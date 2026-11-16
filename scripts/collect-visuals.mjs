import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/questions.json"), "utf8"),
).questions;
const directory = path.join(root, "src/data/question-visuals");
const records = fs
  .readdirSync(directory)
  .filter((f) => f.endsWith(".json"))
  .flatMap((f) => JSON.parse(fs.readFileSync(path.join(directory, f), "utf8")));
const seen = new Set();
for (const r of records) {
  if (seen.has(r.id)) throw Error(`Duplicate visual ${r.id}`);
  seen.add(r.id);
  const q = catalog.find((q) => q.id === r.id);
  if (!q) throw Error(`Unknown visual ${r.id}`);
  if (r.subject !== q.subject || r.answer !== String(q.answer))
    throw Error(`Catalog mismatch ${r.id}`);
  if (!r.verified || r.steps.length < 3)
    throw Error(`Incomplete visual ${r.id}`);
  for (const c of r.checks ?? [])
    if (
      typeof c.actual !== "number" ||
      !Number.isFinite(c.actual) ||
      Math.abs(c.actual - c.expected) > (c.tolerance ?? 1e-7)
    )
      throw Error(`Check failed ${r.id}: ${c.label}`);
}
const out = path.join(root, "public/data/visuals");
fs.mkdirSync(out, { recursive: true });
for (const r of records) {
  fs.writeFileSync(path.join(out, r.id + ".json"), JSON.stringify(r));
}
const manifest = records
  .sort(
    (a, b) =>
      catalog.findIndex((q) => q.id === a.id) -
      catalog.findIndex((q) => q.id === b.id),
  )
  .map(({ steps, checks, ...rest }) => ({
    ...rest,
    steps: steps.map(({ model, ...s }) => s),
  }));
fs.writeFileSync(
  path.join(root, "src/data/question-visuals.json"),
  JSON.stringify(manifest, null, 2),
);
const missing = catalog.filter((q) => !seen.has(q.id)).map((q) => q.id);
for (const q of catalog) {
  if (seen.has(q.id)) {
    q.visualizationStatus = "ready";
    q.visualizationScope =
      "문항의 실제 조건을 사용한 단계별 시각화 및 독립 풀이";
  }
}
const updated = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/questions.json"), "utf8"),
);
updated.questions = catalog;
updated.visualizationCount = records.length;
fs.writeFileSync(
  path.join(root, "src/data/questions.json"),
  JSON.stringify(updated, null, 2),
);
fs.writeFileSync(
  path.join(root, "public/data/catalog.json"),
  JSON.stringify(updated, null, 2),
);
fs.writeFileSync(
  path.join(root, "public/data/visual-coverage.json"),
  JSON.stringify(
    {
      total: catalog.length,
      implemented: records.length,
      missing,
      bySubject: Object.fromEntries(
        ["calculus", "geometry", "probability"].map((s) => [
          s,
          {
            total: catalog.filter((q) => q.subject === s).length,
            implemented: records.filter((q) => q.subject === s).length,
          },
        ]),
      ),
    },
    null,
    2,
  ),
);
console.log(
  `${records.length}/${catalog.length} question visuals collected; ${missing.length} remaining`,
);
if (process.argv.includes("--complete") && missing.length)
  throw Error(`Missing: ${missing.join(", ")}`);
