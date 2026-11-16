import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import katex from "katex";
import * as math from "../src/lib/math.mjs";
const worked = JSON.parse(
  fs.readFileSync(
    new URL("../src/data/worked-problems.json", import.meta.url),
    "utf8",
  ),
);
const source = fs.readFileSync(
  new URL("../src/visuals/models.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
}).outputText;
const module = { exports: {} };
const questionSource = fs.readFileSync(
  new URL("../src/visuals/question-scenes.ts", import.meta.url),
  "utf8",
);
const questionModule = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(questionSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText,
  {
    module: questionModule,
    exports: questionModule.exports,
    require: () =>
      JSON.parse(
        fs.readFileSync(
          new URL("../src/data/question-visuals.json", import.meta.url),
          "utf8",
        ),
      ),
    Math,
    Number,
    Object,
    Array,
    String,
    Boolean,
    Map,
    Error,
    URL,
  },
);
for (const file of fs.readdirSync(
  new URL("../src/data/question-visuals/", import.meta.url),
)) {
  for (const visual of JSON.parse(
    fs.readFileSync(
      new URL("../src/data/question-visuals/" + file, import.meta.url),
      "utf8",
    ),
  ))
    questionModule.exports.registerQuestionVisual(visual);
}
vm.runInNewContext(compiled, {
  exports: module.exports,
  module,
  require: (name) =>
    name.endsWith("question-scenes")
      ? questionModule.exports
      : name.endsWith("math.mjs")
        ? math
        : worked,
  Math,
  Number,
  Object,
  Array,
  String,
  Boolean,
});
const { makeModel, stories, defaults } = module.exports;
const close = (a, b, eps = 1e-8) =>
  assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);
test("every catalog question has exactly one selectable visualization", () => {
  const catalog = JSON.parse(
    fs.readFileSync(
      new URL("../src/data/questions.json", import.meta.url),
      "utf8",
    ),
  );
  const questionIds = stories
    .filter((s) => s.problemId)
    .map((s) => s.problemId);
  assert.equal(catalog.questions.length, 329);
  assert.equal(new Set(questionIds).size, questionIds.length);
  assert.deepEqual(
    Array.from(questionIds).sort(),
    catalog.questions.map((q) => q.id).sort(),
  );
  assert.equal(catalog.visualizationCount, catalog.questions.length);
  for (const q of catalog.questions)
    assert.equal(q.visualizationStatus, "ready", q.id);
});
test("equation morph preserves both roots throughout the transformation", () => {
  for (const a of [-0.25, 0, 1, 3])
    for (const phase of [0, 0.3, 1, 1.7, 2, 3]) {
      const model = makeModel("difference", { a }, phase);
      const t = Math.min(1, phase / 2);
      const e = t * t * (3 - 2 * t);
      for (const dot of model.dots) {
        const [x, y] = dot.at;
        close(x * x - x, a);
        close(y, x * x - e * x);
        close(y, (1 - e) * x + a);
      }
    }
  assert.equal(makeModel("difference", { a: -1 }, 3).dots.length, 0);
  assert.equal(makeModel("difference", { a: -0.25 }, 3).dots.length, 1);
});
test("piecewise continuity condition matches both branches across all boundary positions", () => {
  for (const c of [-1, 0, 0.5, 1, 2]) {
    const m = makeModel("piecewise", { c, b: c * c - 2 * c }, 3);
    close(m.dots[0].at[1], m.dots[1].at[1]);
    assert.equal(m.metrics[2].value, "연속");
  }
  const broken = makeModel("piecewise", { c: 1, b: 0 }, 2);
  assert.equal(broken.metrics[2].value, "불연속");
  assert.equal(broken.dots[0].open, true);
  assert.equal(broken.dots[1].open, undefined);
  for (const c of [-1, 2])
    for (const b of [-3, 3]) {
      const m = makeModel("piecewise", { c, b }, 2);
      for (const d of m.dots)
        assert.ok(
          d.at[1] > m.range[2] && d.at[1] < m.range[3],
          "boundary values stay in view",
        );
    }
});
test("2026 calculus 24 preserves the exact integral and changes endpoint to u=1", () => {
  const n = 200000,
    dx = Math.PI / 2 / n;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) * dx;
    sum += Math.sqrt(Math.sin(x) - Math.sin(x) ** 3) * dx;
  }
  close(sum, 2 / 3, 2e-8);
  const m = makeModel("integral", { x: Math.PI / 4 }, 4);
  const last = m.lines[0].points.at(-1);
  close(last[0], 1);
  close(last[1], 1);
});
test("2024 calculus 28 reconstructs equal-height roots and exact integral", () => {
  for (const u of [-1, -0.8, -0.4, -0.1]) {
    const h = 5 - 2 * u;
    close(
      -4 * u * Math.exp(4 * u * u),
      2 * (h - 5) * Math.exp((h - 5) ** 2),
      1e-8,
    );
  }
  const n = 50000,
    dx = 2 / n;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) * dx;
    area += 2 * x * Math.exp(x * x) * dx;
  }
  close(area, Math.exp(4) - 1, 1e-6);
  assert.equal(makeModel("levelset", { u: -0.8 }, 3).symbolicX, true);
  assert.equal(makeModel("levelset", { u: -0.8 }, 4).symbolicX, false);
});
test("2025 geometry 27 incircle lies in its plane and all final projected points lie on z=0", () => {
  const scene = worked.find((w) => w.id === "2025-geometry-27").scene;
  const n = scene.sourcePlane.normal,
    A = scene.points.A,
    I = scene.circle.center;
  close(
    n.reduce((s, v, i) => s + v * (I[i] - A[i]), 0),
    0,
  );
  close(Math.hypot(...scene.circle.basisU), 1);
  close(Math.hypot(...scene.circle.basisV), 1);
  const m = makeModel("incircle", {}, 5);
  const ellipse = m.lines.find(
    (l) => l.color === "#0f766e" && l.points.length > 50,
  );
  assert.ok(ellipse);
  for (const pt of ellipse.points) close(pt[2], 0);
  let twiceArea = 0;
  for (let i = 0; i < ellipse.points.length - 1; i++)
    twiceArea +=
      ellipse.points[i][0] * ellipse.points[i + 1][1] -
      ellipse.points[i + 1][0] * ellipse.points[i][1];
  close(Math.abs(twiceArea) / 2, (Math.PI * Math.sqrt(10)) / 4, 0.002);
});
test("2024 probability 28 has 256 outcomes, 70 in condition, 6 in intersection", () => {
  const m = makeModel("balls", {}, 4);
  assert.equal(m.dots.length, 256);
  assert.equal(m.metrics[1].value, "70");
  assert.equal(m.metrics[2].value, "6");
  assert.equal(m.dots.filter((d) => d.color === "#2563eb").length, 6);
  const outcomes = worked.find((w) => w.id === "2024-probability-28").scene
    .outcomes;
  assert.equal(new Set(outcomes.map((o) => o.draws.join(","))).size, 256);
  for (const o of outcomes) {
    const total = o.draws.reduce(
        (s, x) => s + (x === 1 ? 1 : x === 4 ? 3 : 2),
        0,
      ),
      black = o.draws.filter((x) => x !== 1).length;
    assert.equal(o.totalBalls, total);
    assert.equal(o.blackBalls, black);
    assert.equal(o.condition, total === 8);
    assert.equal(o.success, total === 8 && black === 2);
  }
});
test("normal standardization preserves probability between one-sigma bounds", () => {
  close(math.normalCdf(1) - math.normalCdf(-1), 0.682689492, 2e-7);
  for (const mu of [-2, 0, 2])
    for (const sigma of [0.5, 1, 2]) {
      const m = makeModel("normal", { mu, sigma }, 3);
      assert.equal(m.metrics[0].value, "0");
      assert.equal(m.metrics[1].value, "1");
    }
});
test("every formula parses and every transition contains finite coordinates", () => {
  for (const story of stories) {
    for (const s of story.steps)
      katex.renderToString(s.formula, { throwOnError: true, strict: "ignore" });
    const params = defaults(story.id),
      variants = [
        params,
        ...story.parameters.flatMap((p) => [
          { ...params, [p.key]: p.min },
          { ...params, [p.key]: p.max },
        ]),
      ];
    for (const p of variants)
      for (let phase = 0; phase <= story.steps.length - 1; phase += 0.5) {
        const m = makeModel(story.id, p, phase),
          pts = [
            ...m.lines.flatMap((l) => l.points),
            ...m.surfaces.flatMap((s) => s.points),
            ...m.dots.map((d) => d.at),
          ];
        for (const pt of pts)
          assert.ok(
            pt.length === 3 && pt.every(Number.isFinite),
            `${story.id} ${phase}`,
          );
      }
  }
});
