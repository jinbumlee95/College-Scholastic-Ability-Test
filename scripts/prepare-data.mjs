import fs from "node:fs/promises";
import path from "node:path";
const research = path.resolve("../data/research");
const recent = JSON.parse(
  await fs.readFile(path.join(research, "recent-exams.json"), "utf8"),
);
const legacy = JSON.parse(
  await fs.readFile(path.join(research, "legacy-exams.json"), "utf8"),
);
const lessons = JSON.parse(
  await fs.readFile(path.join(research, "visual-lessons.json"), "utf8"),
);
const worked = JSON.parse(
  await fs.readFile(path.join(research, "worked-problems.json"), "utf8"),
);
const chooseLesson = (q) => {
  const t = q.topic;
  if (/조건부|독립사건|여사건|확률의/.test(t)) return "conditional";
  if (/신뢰|추정|표본평균|모평균/.test(t)) return "sampling";
  if (/정규분포|표준화/.test(t)) return "normal";
  if (/이항분포|독립시행|확률변수|기댓값|분산/.test(t)) return "binomial";
  if (/이항정리/.test(t)) return "counting";
  if (/경우의 수|순열|조합|개수/.test(t)) return "combinatorics";
  if (/타원/.test(t)) return "ellipse";
  if (/쌍곡선/.test(t)) return "hyperbola";
  if (/포물선/.test(t)) return "parabola";
  if (/정사영|이면각|단면/.test(t)) return "projection";
  if (/공간|구의|구와|구면/.test(t)) return "spatial";
  if (/벡터|내적|외분점|속력|평면 운동/.test(t)) return "vector";
  if (/적분|넓이|부피/.test(t)) return "integral";
  if (/급수|수열|무한/.test(t)) return "series";
  if (/지수|로그/.test(t)) return "exponential";
  if (/극대|극소|최대|최소|방정식|실근|부등식|그래프|함수의 극값/.test(t))
    return "optimization";
  return q.subject === "calculus"
    ? "tangent"
    : q.subject === "geometry"
      ? "spatial"
      : "combinatorics";
};
const all = [...legacy.exams, ...recent.exams].flatMap((exam) =>
  exam.questions.map((q) => ({
    id:
      exam.track === "통합"
        ? `${exam.year}-${q.subject}-${q.number}`
        : `${exam.year}-${exam.track === "가형" ? "a" : "b"}-${q.number}`,
    year: exam.year,
    track: exam.track,
    ...q,
    lessonId: chooseLesson(q),
    questionUrl: exam.questionUrl,
    answerUrl: exam.answerUrl,
    solutionUrl: exam.solutionUrl,
  })),
);
const byId = new Map(all.map((q) => [q.id, q]));
for (const q of all)
  if (q.duplicateOf) {
    const original = byId.get(q.duplicateOf);
    if (!original) throw new Error("Broken duplicate " + q.id);
    (original.aliases ??= []).push({
      year: q.year,
      track: q.track,
      number: q.number,
      answer: q.answer,
      questionUrl: q.questionUrl,
      questionPage: q.questionPage,
      solutionUrl: q.solutionUrl,
      solutionPage: q.solutionPage,
    });
  }
const questions = all
  .filter((q) => !q.duplicateOf)
  .sort(
    (a, b) =>
      b.year - a.year ||
      a.subject.localeCompare(b.subject) ||
      a.track.localeCompare(b.track) ||
      a.number - b.number,
  );
const payload = {
  updated: "2026-11-16",
  questionCount: questions.length,
  rawQuestionCount: all.length,
  duplicateCount: all.length - questions.length,
  years: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
  questions,
  exams: [...legacy.exams, ...recent.exams].map(({ questions, ...exam }) => ({
    ...exam,
    questionCount: questions.length,
  })),
};
await fs.mkdir("src/data", { recursive: true });
await fs.mkdir("public/data", { recursive: true });
await fs.writeFile("src/data/questions.json", JSON.stringify(payload, null, 2));
await fs.writeFile(
  "src/data/lessons.json",
  JSON.stringify(lessons.lessons, null, 2),
);
await fs.writeFile(
  "src/data/worked-problems.json",
  JSON.stringify(worked.problems, null, 2),
);
await fs.writeFile(
  "public/data/catalog.json",
  JSON.stringify(payload, null, 2),
);
console.log(
  `${questions.length} unique questions; ${all.length - questions.length} duplicate references; ${payload.exams.length} source editions.`,
);
