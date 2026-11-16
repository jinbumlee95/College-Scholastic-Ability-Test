import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import katex from "katex";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const catalog = read("src/data/questions.json").questions;
const records = fs
  .readdirSync(path.join(root, "src/data/question-visuals"))
  .filter((f) => f.endsWith(".json"))
  .flatMap((f) => read("src/data/question-visuals/" + f));
let formulas = 0,
  checks = 0,
  frames = 0,
  largest = { count: 0, id: "" };
const seen = new Set();
const validPoint = (p, id) =>
  assert.ok(
    Array.isArray(p) &&
      p.length === 3 &&
      p.every((v) => typeof v === "number" && Number.isFinite(v)),
    `Invalid coordinate ${id}: ${JSON.stringify(p)}`,
  );
for (const q of records) {
  assert.ok(!seen.has(q.id), `Duplicate ${q.id}`);
  seen.add(q.id);
  const entry = catalog.find((x) => x.id === q.id);
  assert.ok(entry, q.id);
  assert.equal(q.subject, entry.subject, q.id);
  assert.equal(String(q.answer), String(entry.answer), q.id);
  assert.ok(q.verified && q.steps.length >= 3, q.id);
  assert.ok(
    q.source.questionPage === entry.questionPage &&
      q.source.solutionPage === entry.solutionPage,
    q.id + " source",
  );
  assert.ok(q.checks?.length, q.id + " needs a verification calculation");
  for (const c of q.checks) {
    assert.ok(
      Number.isFinite(c.actual) && Number.isFinite(c.expected),
      q.id + " " + c.label,
    );
    assert.ok(
      Math.abs(c.actual - c.expected) <= (c.tolerance ?? 1e-7),
      `${q.id}: ${c.label}: ${c.actual} != ${c.expected}`,
    );
    checks++;
  }
  for (const [i, s] of q.steps.entries()) {
    const id = `${q.id} step ${i + 1}`;
    assert.ok(s.title && s.body && s.formula, id);
    assert.ok(
      !/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(s.formula),
      id + " escaped control character",
    );
    try {
      katex.renderToString(s.formula, { throwOnError: true, strict: "ignore" });
    } catch (e) {
      throw Error(id + " " + e.message);
    }
    formulas++;
    const m = s.model;
    assert.equal(m.range.length, 4, id);
    assert.ok(
      m.range.every(Number.isFinite) &&
        m.range[0] < m.range[1] &&
        m.range[2] < m.range[3],
      id + " range",
    );
    assert.ok(
      m.lines.length + m.dots.length + m.surfaces.length > 0,
      id + " empty",
    );
    for (const shape of [...m.lines, ...m.surfaces]) {
      assert.ok(shape.points.length >= 2, id);
      shape.points.forEach((p) => validPoint(p, id));
    }
    for (const d of m.dots) validPoint(d.at, id);
    if (m.dots.length > largest.count) largest = { count: m.dots.length, id };
    frames++;
  }
  const hashes = q.steps.map((s) =>
    JSON.stringify([s.model.lines, s.model.dots, s.model.surfaces]),
  );
  assert.ok(new Set(hashes).size >= 2, q.id + " has no geometric change");
}
const missing = catalog.filter((q) => !seen.has(q.id)).map((q) => q.id);
if (process.argv.includes("--complete"))
  assert.equal(missing.length, 0, missing.join(", "));
console.log(
  JSON.stringify({
    questions: records.length,
    total: catalog.length,
    frames,
    formulas,
    checks,
    largestPointSet: largest,
    remaining: missing.length,
  }),
);
