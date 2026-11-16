import fs from "node:fs";
import assert from "node:assert/strict";
import katex from "katex";
const read = (p) =>
  JSON.parse(fs.readFileSync(new URL("../" + p, import.meta.url), "utf8"));
const data = read("src/data/questions.json"),
  lessons = read("src/data/lessons.json"),
  worked = read("src/data/worked-problems.json");
assert.equal(data.questions.length, 329);
assert.equal(data.rawQuestionCount, 345);
assert.equal(data.duplicateCount, 16);
assert.equal(new Set(data.questions.map((q) => q.id)).size, 329);
assert.deepEqual(
  [...new Set(data.questions.map((q) => q.year))].sort(),
  data.years,
);
for (const q of data.questions) {
  assert.ok(
    lessons.some((l) => l.id === q.lessonId),
    q.id,
  );
  assert.ok(q.questionPage >= 1 && q.solutionPage >= 1, q.id);
  assert.notEqual(q.answer, null);
  if (q.year >= 2022) assert.ok(q.number >= 23 && q.number <= 30);
  for (const field of ["questionUrl", "answerUrl", "solutionUrl"]) {
    const u = new URL(q[field]);
    assert.equal(u.protocol, "https:");
    assert.equal(u.hostname, "wdown.ebsi.co.kr");
  }
}
for (const lesson of lessons) {
  katex.renderToString(lesson.formula, {
    throwOnError: true,
    strict: "ignore",
  });
  for (const step of [...lesson.steps, ...lesson.workedExample.steps])
    if (step.math)
      katex.renderToString(step.math, { throwOnError: true, strict: "ignore" });
}
for (const w of worked) {
  const q = data.questions.find((q) => q.id === w.id);
  assert.ok(q, w.id);
  assert.equal(q.answer, w.answerChoice, w.id);
  for (const step of w.steps)
    katex.renderToString(step.math, { throwOnError: true, strict: "ignore" });
}
console.log(
  `PASS: ${data.questions.length} questions, ${data.exams.length} source editions, ${lessons.length} concept notes, ${worked.length} worked visualizations.`,
);
