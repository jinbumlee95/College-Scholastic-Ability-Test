import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import Module, { createRequire } from "node:module";
import ts from "typescript";
import React from "react";
import { renderToString } from "react-dom/server";
const require = createRequire(import.meta.url),
  root = path.resolve("src");
const previousResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  return previousResolve.call(
    this,
    request.startsWith("@/") ? path.join(root, request.slice(2)) : request,
    ...rest,
  );
};
for (const extension of [".ts", ".tsx"])
  Module._extensions[extension] = function (module, filename) {
    const content = fs.readFileSync(filename, "utf8");
    module._compile(
      ts.transpileModule(content, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      }).outputText,
      filename,
    );
  };
globalThis.window = { location: { hash: "" } };
globalThis.localStorage = { getItem: () => null };
const App = require("../src/App.tsx").default;
test("the learning view renders real formulas, playback controls and archive count", () => {
  window.location.hash = "#scene=difference";
  const html = renderToString(React.createElement(App));
  assert.ok(html.includes("수능 수학 시각화"));
  assert.ok(html.includes("329"));
  assert.ok(html.includes("단계 재생"));
  assert.ok(html.includes("katex-mathml"));
  assert.ok(!html.includes("katex-error"));
});
test("a share link selects the archive and a real question", () => {
  window.location.hash = "#p=2026-calculus-24";
  const html = renderToString(React.createElement(App));
  assert.ok(html.includes("10개년 기출 자료"));
  assert.ok(html.includes("2026"));
});

test("question links render their own steps after loading, across all three subjects", () => {
  const engine = require("../src/visuals/question-scenes.ts");
  for (const id of ["2018-b-29", "2022-geometry-30", "2026-probability-28"]) {
    const q = JSON.parse(
      fs.readFileSync(path.join("public/data/visuals", id + ".json"), "utf8"),
    );
    engine.registerQuestionVisual(q);
    window.location.hash = "#scene=q:" + id;
    const html = renderToString(React.createElement(App));
    assert.ok(html.includes(q.title), id);
    assert.ok(html.includes("단계 재생"), id);
    assert.ok(html.includes("풀이 전환 살펴보기"), id);
    assert.ok(!html.includes("katex-error"), id);
  }
});
