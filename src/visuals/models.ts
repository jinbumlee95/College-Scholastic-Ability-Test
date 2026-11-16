import { normalCdf, format } from "../lib/math.mjs";
import workedProblems from "../data/worked-problems.json";
import {
  questionStories,
  questionModel,
  isQuestionScene,
} from "./question-scenes";
export type Point = [number, number, number];
export type Stroke = {
  points: Point[];
  color: string;
  dashed?: boolean;
  opacity?: number;
  width?: number;
};
export type Dot = {
  at: Point;
  color: string;
  open?: boolean;
  label?: string;
  size?: number;
  opacity?: number;
};
export type Surface = {
  points: Point[];
  color: string;
  opacity: number;
  triangulation?: "strip-to-axis";
};
export type Model = {
  lines: Stroke[];
  dots: Dot[];
  surfaces: Surface[];
  threeD: boolean;
  range: [number, number, number, number];
  metrics: { label: string; value: string }[];
  description: string;
  symbolicX?: boolean;
  axisLabel?: string;
  inspection?: string;
  equalAspect?: boolean;
};
export type SceneId = string;
export const colors = {
  blue: "#2563eb",
  green: "#0f766e",
  orange: "#d97706",
  red: "#dc2626",
  muted: "#a8a29e",
};
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (t: number) => {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
};
const points = (fn: (x: number) => Point, a: number, b: number, n = 120) =>
  Array.from({ length: n + 1 }, (_, i) => fn(a + ((b - a) * i) / n));
const line = (
  a: Point,
  b: Point,
  color = colors.muted,
  dashed = false,
): Stroke => ({ points: [a, b], color, dashed });
export interface Parameter {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  initial: number;
  unit?: string;
}
export interface StoryStep {
  title: string;
  formula: string;
  body: string;
}
export interface Story {
  id: SceneId;
  title: string;
  subtitle: string;
  subject: "calculus" | "geometry" | "probability";
  parameters: Parameter[];
  steps: StoryStep[];
  problemId?: string;
}
export const stories: Story[] = [
  {
    id: "difference",
    title: "두 곡선의 교점에서 차이 함수로",
    subtitle: "같은 해를 다른 기준으로 바라보기",
    subject: "calculus",
    parameters: [
      {
        key: "a",
        label: "수평선 높이 a",
        min: -1,
        max: 3,
        step: 0.05,
        initial: 1,
      },
    ],
    steps: [
      {
        title: "두 그래프의 교점을 찾습니다",
        formula: String.raw`f(x)=g(x)+a,\quad f(x)=x^2,\;g(x)=x`,
        body: "파란 포물선과 초록 직선이 만나는 점을 봅니다. 두 그래프의 높이가 같은 x가 방정식의 해입니다.",
      },
      {
        title: "같은 x에서 g(x)를 함께 뺍니다",
        formula: String.raw`f(x)-t\,g(x)=(1-t)g(x)+a\quad(0\le t\le1)`,
        body: "전환 중에는 양쪽 높이에서 똑같이 t·g(x)를 뺍니다. 교점의 높이는 이동하지만 x좌표는 계속 같습니다.",
      },
      {
        title: "차이 함수를 수평선과 비교합니다",
        formula: String.raw`f(x)-g(x)=a\quad\Longrightarrow\quad x^2-x=a`,
        body: "이제 초록 그래프는 y=a인 수평선입니다. 원래 두 그래프의 비교를 한 함수의 높이 문제로 바꿨습니다.",
      },
      {
        title: "경계에서 해의 개수가 바뀝니다",
        formula: String.raw`x^2-x=\left(x-\frac12\right)^2-\frac14`,
        body: "a를 움직여 보세요. a=−1/4에서 수평선이 꼭짓점에 닿고, 그보다 높으면 두 해, 낮으면 실근이 없습니다.",
      },
    ],
  },
  {
    id: "piecewise",
    title: "경계에서 식이 바뀌는 함수",
    subtitle: "함숫값·좌우 극한을 따로 따라가기",
    subject: "calculus",
    parameters: [
      { key: "c", label: "경계 c", min: -1, max: 2, step: 0.1, initial: 1 },
      {
        key: "b",
        label: "오른쪽 식의 상수 b",
        min: -3,
        max: 3,
        step: 0.1,
        initial: 0,
      },
    ],
    steps: [
      {
        title: "두 식의 전체 모양을 봅니다",
        formula: String.raw`y=x^2,\qquad y=2x+b`,
        body: "아직 조건을 적용하지 않은 두 그래프입니다. 두 식을 모두 그린 뒤 각 식이 적용되는 범위를 구분합니다.",
      },
      {
        title: "경계 c로 정의역을 나눕니다",
        formula: String.raw`F(x)=\begin{cases}x^2&x<c\\2x+b&x\ge c\end{cases}`,
        body: "경계의 왼쪽은 파란 식, 오른쪽은 초록 식만 남습니다. 빈 점은 제외, 채운 점은 포함입니다.",
      },
      {
        title: "경계의 값과 극한을 비교합니다",
        formula: String.raw`\lim_{x\to c^-}F(x)=c^2,\quad F(c)=\lim_{x\to c^+}F(x)=2c+b`,
        body: "경계선 위에서 빈 점과 채운 점의 높이를 비교합니다. 가까이 다가간 값과 실제 함숫값은 서로 다를 수 있습니다.",
      },
      {
        title: "연속 조건으로 두 높이를 맞춥니다",
        formula: String.raw`c^2=2c+b\quad\Longleftrightarrow\quad b=c^2-2c`,
        body: "연속 조건에 맞추기를 누르면 오른쪽 그래프가 위아래로 이동해 두 점이 만나게 됩니다. 연속이어도 기울기는 다를 수 있습니다.",
      },
    ],
  },
  {
    id: "projection",
    title: "공간의 삼각형을 평면에 내리기",
    subtitle: "정사영의 길이와 넓이가 줄어드는 이유",
    subject: "geometry",
    parameters: [
      {
        key: "theta",
        label: "두 평면의 각 θ",
        min: 0,
        max: 80,
        step: 1,
        initial: 55,
        unit: "°",
      },
    ],
    steps: [
      {
        title: "기울어진 평면의 삼각형을 봅니다",
        formula: String.raw`A=(0,0,0),\ B=(4,0,0),\ C=(1,3\cos\theta,3\sin\theta)`,
        body: "밑변 AB를 축으로 기울어진 삼각형입니다. 드래그해 회전하면 종이에 겹쳐 보이던 점들의 높이 차이가 드러납니다.",
      },
      {
        title: "수선으로 투영 방향을 정합니다",
        formula: String.raw`C\longmapsto C^{\prime}=(1,3\cos\theta,0)`,
        body: "점 C에서 기준 평면으로 수선을 내립니다. 옆으로 비스듬히 미는 것이 아니라 평면의 법선 방향으로 이동합니다.",
      },
      {
        title: "정사영 삼각형을 분리해 봅니다",
        formula: String.raw`H=3,\qquad H^{\prime}=3\cos\theta`,
        body: "점 C의 그림자가 기준 평면에 내려옵니다. AB는 그대로이고, 밑변에 수직인 높이만 cos θ배가 됩니다.",
      },
      {
        title: "넓이 비를 확인합니다",
        formula: String.raw`S^{\prime}=\frac12\cdot4\cdot3\cos\theta=S\cos\theta`,
        body: "각도를 움직여 보세요. θ=0°에서는 넓이가 같고, 90°에 가까워질수록 정사영은 밑변에 가까워집니다.",
      },
    ],
  },
  {
    id: "integral",
    title: "치환적분",
    subtitle: "2026학년도 미적분 24번",
    subject: "calculus",
    parameters: [
      {
        key: "x",
        label: "관찰하는 x",
        min: 0,
        max: Math.PI / 2,
        step: 0.01,
        initial: Math.PI / 4,
      },
    ],
    steps: [],
  },
  {
    id: "conditional",
    title: "조건이 표본공간을 바꾸는 순간",
    subtitle: "조건을 먼저 적용하고, 그 안에서 다시 세기",
    subject: "probability",
    parameters: [
      {
        key: "sum",
        label: "두 주사위 합 조건",
        min: 3,
        max: 11,
        step: 1,
        initial: 7,
      },
    ],
    steps: [
      {
        title: "가능한 결과를 모두 놓습니다",
        formula: String.raw`\Omega=\{(i,j):1\le i,j\le6\},\quad |\Omega|=36`,
        body: "서로 구별되는 두 공정한 주사위를 던집니다. 격자의 각 점은 순서가 있는 한 결과이고 확률은 모두 같습니다.",
      },
      {
        title: "주어진 조건에 맞는 결과만 남깁니다",
        formula: String.raw`A=\{(i,j):i+j=s\}`,
        body: "합이 s라는 정보를 얻었습니다. 조건을 만족하지 않는 점들은 표본공간에서 빠집니다. 분모는 더 이상 36이 아닙니다.",
      },
      {
        title: "남은 결과 안에서 사건을 셉니다",
        formula: String.raw`B=\{(i,j):i\text{가 짝수}\},\quad P(B\mid A)=\frac{|A\cap B|}{|A|}`,
        body: "남은 점 중 첫 번째 주사위가 짝수인 점을 파란색으로 봅니다. 합 조건을 바꾸면 분모와 분자가 함께 변합니다.",
      },
    ],
  },
  {
    id: "normal",
    title: "정규분포의 좌표를 표준화하기",
    subtitle: "넓이를 유지하며 평균과 단위를 바꾸기",
    subject: "probability",
    parameters: [
      { key: "mu", label: "평균 μ", min: -2, max: 2, step: 0.1, initial: 1 },
      {
        key: "sigma",
        label: "표준편차 σ",
        min: 0.5,
        max: 2,
        step: 0.1,
        initial: 1.5,
      },
    ],
    steps: [
      {
        title: "원래 분포에서 구간을 정합니다",
        formula: String.raw`X\sim N(\mu,\sigma^2),\quad P(\mu-\sigma\le X\le\mu+\sigma)`,
        body: "평균에서 표준편차만큼 떨어진 두 점 사이의 넓이를 표시했습니다.",
      },
      {
        title: "평균을 빼서 중심을 옮깁니다",
        formula: String.raw`Y=X-\mu`,
        body: "평균이 0으로 이동합니다. 구간의 양 끝과 밀도 곡선이 함께 움직이므로 넓이는 같습니다.",
      },
      {
        title: "표준편차로 나눠 단위를 맞춥니다",
        formula: String.raw`Z=\frac{X-\mu}{\sigma}\sim N(0,1)`,
        body: "가로 길이를 σ로 나누는 동시에 밀도의 높이는 σ배가 됩니다. 가로축만 바꾸면 확률의 넓이가 보존되지 않습니다.",
      },
      {
        title: "표준정규분포의 넓이를 읽습니다",
        formula: String.raw`P(-1\le Z\le1)=\Phi(1)-\Phi(-1)\approx0.6827`,
        body: "어떤 μ, σ에서 출발했어도 표준화한 두 끝점은 −1과 1입니다.",
      },
    ],
  },
  {
    id: "conic",
    title: "타원의 두 초점과 거리의 합",
    subtitle: "정의가 곡선을 만드는 과정",
    subject: "geometry",
    parameters: [
      {
        key: "theta",
        label: "타원 위의 위치",
        min: 0,
        max: 360,
        step: 1,
        initial: 40,
        unit: "°",
      },
      { key: "a", label: "긴 반지름 a", min: 2, max: 4, step: 0.1, initial: 3 },
    ],
    steps: [
      {
        title: "두 초점과 한 점을 놓습니다",
        formula: String.raw`c^2=a^2-b^2,\quad F_1=(-c,0),\ F_2=(c,0)`,
        body: "짧은 반지름 b=1.5인 타원입니다. 두 초점의 간격은 a와 b가 결정합니다.",
      },
      {
        title: "두 거리의 합을 봅니다",
        formula: String.raw`PF_1+PF_2=2a`,
        body: "점 P를 타원 위에서 움직여 보세요. 한 선분이 길어지면 다른 선분이 짧아지며 합은 유지됩니다.",
      },
      {
        title: "거리 조건을 좌표식으로 읽습니다",
        formula: String.raw`\frac{x^2}{a^2}+\frac{y^2}{b^2}=1`,
        body: "거리의 합 조건과 좌표 방정식은 같은 점들의 집합을 나타냅니다.",
      },
    ],
  },
  {
    id: "vector",
    title: "내적을 정사영으로 읽기",
    subtitle: "두 벡터의 방향 관계를 길이로 바꾸기",
    subject: "geometry",
    parameters: [
      {
        key: "theta",
        label: "두 벡터 사이의 각",
        min: 0,
        max: 180,
        step: 1,
        initial: 50,
        unit: "°",
      },
    ],
    steps: [
      {
        title: "두 벡터를 같은 시작점에 놓습니다",
        formula: String.raw`\vec a=(3,0),\quad\vec b=(2\cos\theta,2\sin\theta)`,
        body: "벡터는 시작점의 위치보다 크기와 방향이 중요합니다. 두 벡터를 같은 원점에서 비교합니다.",
      },
      {
        title: "한 벡터를 다른 벡터 위로 내립니다",
        formula: String.raw`\operatorname{proj}_{\vec a}\vec b=(2\cos\theta,0)`,
        body: "파란 축 방향으로 초록 벡터의 성분을 분리합니다. 각이 둔각이면 투영 성분의 방향이 반대입니다.",
      },
      {
        title: "부호가 있는 길이에 크기를 곱합니다",
        formula: String.raw`\vec a\cdot\vec b=|\vec a||\vec b|\cos\theta=6\cos\theta`,
        body: "90°일 때 내적은 0입니다. 90°를 넘어서면 투영 성분과 내적이 함께 음수가 됩니다.",
      },
    ],
  },
];
const exactScenes: Record<string, SceneId> = {
  "2024-calculus-28": "levelset",
  "2026-calculus-24": "integral",
  "2025-geometry-27": "incircle",
  "2024-probability-28": "balls",
};
for (const problem of workedProblems) {
  const id = exactScenes[problem.id];
  const existing = stories.find((s) => s.id === id);
  const story: Story = {
    id,
    title: problem.shortTitle,
    subtitle: `${problem.year}학년도 ${problem.subject === "geometry" ? "기하" : problem.subject === "calculus" ? "미적분" : "확률과 통계"} ${problem.number}번`,
    subject: problem.subject as Story["subject"],
    problemId: problem.id,
    parameters:
      existing?.parameters ||
      (id === "levelset"
        ? [
            {
              key: "u",
              label: "왼쪽 근 u",
              min: -1,
              max: -0.1,
              step: 0.01,
              initial: -0.8,
            },
          ]
        : id === "balls"
          ? [
              {
                key: "outcome",
                label: "관찰할 결과 번호 (0–255)",
                min: 0,
                max: 255,
                step: 1,
                initial: 15,
              },
            ]
          : []),
    steps: problem.steps.map((s) => ({
      title: s.title,
      formula: s.math,
      body: s.explanation,
    })),
  };
  if (existing) stories.splice(stories.indexOf(existing), 1, story);
  else stories.push(story);
}
stories.push(
  ...questionStories.filter(
    (s) => !stories.some((existing) => existing.problemId === s.problemId),
  ),
);
export function defaults(id: SceneId): Record<string, number> {
  return Object.fromEntries(
    stories.find((s) => s.id === id)!.parameters.map((p) => [p.key, p.initial]),
  );
}
export function makeModel(
  id: SceneId,
  p: Record<string, number>,
  progress: number,
): Model {
  if (isQuestionScene(id)) return questionModel(id, progress);
  const m: Model = {
    lines: [],
    dots: [],
    surfaces: [],
    threeD: false,
    range: [-3.3, 4.3, -2.5, 5.5],
    metrics: [],
    description: "",
  };
  const curve = (
    fn: (x: number) => number,
    a: number,
    b: number,
    color: string,
    opacity = 1,
  ) =>
    m.lines.push({
      points: points((x) => [x, fn(x), 0], a, b),
      color,
      opacity,
    });
  const poly = (pts: Point[], color: string, opacity = 0.15) =>
    m.surfaces.push({ points: pts, color, opacity });
  const metric = (label: string, value: number | string) =>
    m.metrics.push({
      label,
      value: typeof value === "number" ? format(value) : value,
    });
  if (id === "difference") {
    const t = ease(progress / 2),
      a = p.a,
      disc = 1 + 4 * a;
    curve((x) => x * x - t * x, -2.3, 3.2, colors.blue);
    curve((x) => (1 - t) * x + a, -3.3, 4.3, colors.green);
    curve((x) => x * x, -2.3, 2.3, colors.blue, 0.12);
    curve((x) => x + a, -3.3, 4.3, colors.green, 0.12);
    if (disc >= 0) {
      const roots =
        disc < 1e-9
          ? [0.5]
          : [(1 - Math.sqrt(disc)) / 2, (1 + Math.sqrt(disc)) / 2];
      for (const x of roots) {
        const y = (1 - t) * x + a;
        m.dots.push({
          at: [x, y, 0],
          color: colors.orange,
          label: `x = ${format(x)}`,
        });
        m.lines.push(line([x, 0, 0], [x, y, 0], colors.orange, true));
      }
      metric("실근 개수", roots.length);
      metric("해 x", roots.map((x) => format(x)).join(", "));
    } else {
      metric("실근 개수", 0);
      metric("해 x", "없음");
    }
    metric("비교 높이 a", a);
    m.description = `같은 x에서 양변의 높이를 함께 이동합니다. ${disc < 0 ? "실근 없음" : disc === 0 ? "중근" : "서로 다른 두 실근"}.`;
  } else if (id === "piecewise") {
    const c = p.c,
      b = p.b,
      cut = ease(progress),
      left = c * c,
      right = 2 * c + b;
    m.range = [
      -3.3,
      4.3,
      Math.min(-2.5, left - 1, right - 1),
      Math.max(5.5, left + 1, right + 1),
    ];
    curve((x) => x * x, -2, c, colors.blue);
    curve((x) => 2 * x + b, c, 4.3, colors.green);
    curve((x) => x * x, c, 2.6, colors.blue, 1 - cut * 0.93);
    curve((x) => 2 * x + b, -3.3, c, colors.green, 1 - cut * 0.93);
    m.lines.push(line([c, -2.5, 0], [c, 5.5, 0], colors.orange, true));
    poly(
      [
        [-3.3, -2.5, 0],
        [c, -2.5, 0],
        [c, 5.5, 0],
        [-3.3, 5.5, 0],
      ],
      colors.blue,
      0.035,
    );
    poly(
      [
        [c, -2.5, 0],
        [4.3, -2.5, 0],
        [4.3, 5.5, 0],
        [c, 5.5, 0],
      ],
      colors.green,
      0.035,
    );
    if (progress > 0.5) {
      m.dots.push(
        {
          at: [c, left, 0],
          color: colors.blue,
          open: true,
          label: "왼쪽 극한",
        },
        { at: [c, right, 0], color: colors.green, label: "F(c)" },
      );
      if (progress > 1.5)
        m.lines.push(line([c, left, 0], [c, right, 0], colors.red));
    }
    metric("왼쪽 극한", left);
    metric("F(c) · 오른쪽 극한", right);
    metric("연속 여부", Math.abs(left - right) < 1e-6 ? "연속" : "불연속");
    m.description = `경계 x=${format(c)}. 빈 점 높이 ${format(left)}, 채운 점 높이 ${format(right)}.`;
  } else if (id === "projection") {
    m.threeD = true;
    const angle = (p.theta * Math.PI) / 180,
      c: Point = [1, 3 * Math.cos(angle), 3 * Math.sin(angle)],
      a: Point = [0, 0, 0],
      b: Point = [4, 0, 0],
      foot: Point = [1, c[1], 0];
    poly(
      [
        [-1, -1, 0],
        [5, -1, 0],
        [5, 4, 0],
        [-1, 4, 0],
      ],
      colors.muted,
      0.13,
    );
    poly([a, b, c], colors.blue, 0.2);
    m.lines.push({ points: [a, b, c, a], color: colors.blue });
    m.dots.push(
      { at: a, color: colors.blue, label: "A" },
      { at: b, color: colors.blue, label: "B" },
      { at: c, color: colors.blue, label: "C" },
    );
    const drop = ease(progress - 1);
    const moving: Point = [1, c[1], c[2] * (1 - drop)];
    if (progress > 0) {
      m.lines.push({
        ...line(c, foot, colors.orange, true),
        opacity: ease(progress),
      });
      m.lines.push(line([1, 0, 0], c, colors.blue, true));
      m.dots.push({ at: foot, color: colors.green, label: "C′" });
      poly([a, b, moving], colors.green, 0.25);
      m.lines.push({ points: [a, b, moving, a], color: colors.green });
    }
    if (progress > 1.5) m.lines.push(line([1, 0, 0], foot, colors.green, true));
    metric("원래 넓이 S", 6);
    metric("정사영 넓이 S′", 6 * Math.cos(angle));
    metric("넓이 비 cos θ", Math.cos(angle));
    m.description =
      "파란 삼각형에서 초록 정사영으로 수선을 따라 내려옵니다. 회전·확대로 공간 구조를 확인할 수 있습니다.";
  } else if (id === "integral") {
    m.range = [-0.2, 1.8, -0.1, 1.25];
    const t = ease(progress - 2),
      end = Math.PI / 2,
      limit = mix(end, Math.sin(end), t);
    const height = (x: number) =>
      mix(
        Math.sqrt(Math.max(0, Math.sin(x))) * Math.cos(x),
        Math.sqrt(Math.max(0, Math.sin(x))),
        t,
      );
    const graph = points((x) => [mix(x, Math.sin(x), t), height(x), 0], 0, end);
    m.lines.push({ points: graph, color: colors.blue });
    poly([[0, 0, 0], ...graph, [limit, 0, 0]], colors.blue, 0.13);
    const dx = 0.035,
      x = p.x,
      x2 = Math.min(end, x + dx),
      x1 = mix(x, Math.sin(x), t),
      xr = mix(x2, Math.sin(x2), t);
    const strip = points(
      (v) => [mix(v, Math.sin(v), t), height(v), 0],
      x,
      x2,
      30,
    );
    poly([[x1, 0, 0], ...strip, [xr, 0, 0]], colors.orange, 0.7);
    m.dots.push({ at: [x1, height(x), 0], color: colors.orange });
    metric(t < 0.5 ? "x" : "u", mix(x, Math.sin(x), t));
    metric("전체 적분값", (2 / 3) * Math.sin(end) ** 1.5);
    metric("가로축", t < 0.01 ? "x" : t > 0.99 ? "u = sin x" : "좌표 전환 중");
    m.description =
      "치환 전후의 넓이는 같으며, 전환 애니메이션 자체는 도형의 보간입니다.";
  } else if (id === "levelset") {
    const k = 5,
      scale = 4 * Math.exp(4),
      u = p.u ?? -0.8,
      f = (x: number) => -4 * x * Math.exp(4 * x * x),
      level = f(u) / scale,
      move = ease(progress - 1);
    m.range = [-1.4, 7.7, -0.35, 2.4];
    m.symbolicX = progress < 4;
    m.axisLabel = "y / (4e⁴)";
    curve((x) => f(x) / scale, -1.14, 0, colors.blue);
    m.dots.push({ at: [0, 0, 0], color: colors.blue, label: "0" });
    if (progress > 0.4) {
      m.lines.push({
        ...line([-1.4, level, 0], [7.6, level, 0], colors.orange, true),
        opacity: ease(progress),
      });
      m.dots.push(
        { at: [u, level, 0], color: colors.orange, label: "g(t)" },
        { at: [k - 2 * u, level, 0], color: colors.green, label: "h(t)" },
      );
    }
    if (progress > 1) {
      m.lines.push({
        points: points(
          (x) => [mix(x, k - 2 * x, move), f(x) / scale, 0],
          -1.14,
          0,
        ),
        color: colors.green,
      });
      m.lines.push({
        ...line(
          [u, level, 0],
          [mix(u, k - 2 * u, move), level, 0],
          colors.orange,
          true,
        ),
        opacity: 0.6,
      });
    }
    if (progress > 2) {
      m.lines.push({
        ...line([0, 0, 0], [k, 0, 0], colors.green),
        width: 0.06,
      });
      m.dots.push({
        at: [k, 0, 0],
        color: colors.green,
        label: progress < 4 ? "k" : "5",
      });
      poly(
        [
          [0, -0.02, 0],
          [k, -0.02, 0],
          [k, 0.05, 0],
          [0, 0.05, 0],
        ],
        colors.green,
        0.35,
      );
    }
    if (progress > 3) {
      const graph = points(
        (x) => [x, (2 * (x - k) * Math.exp((x - k) ** 2)) / scale, 0],
        k,
        7,
      );
      poly([[k, 0, 0], ...graph, [7, 0, 0]], colors.orange, 0.22);
    }
    metric("왼쪽 근 g(t)", u);
    metric(
      "오른쪽 근 h(t)",
      progress < 4 ? `k + ${format(-2 * u)}` : k - 2 * u,
    );
    metric("이동량 k", progress < 4 ? "미지수" : 5);
    m.description =
      "왼쪽 가지를 반사·가로 확대·평행이동해 오른쪽 가지를 복원합니다. 세로축은 4e⁴로 나눈 값입니다.";
  } else if (id === "incircle") {
    m.threeD = true;
    m.range = [-5.5, 5.5, -1, 5];
    const problem = workedProblems.find((w) => w.id === "2025-geometry-27")!,
      scene = problem.scene as any,
      pts = scene.points as Record<string, Point>;
    const { A, B, C, D, M, Ap, H, I } = pts;
    const edges: [[Point, Point], ...Array<[Point, Point]>] = [
      [A, B],
      [A, C],
      [A, D],
      [B, C],
      [B, D],
      [C, D],
    ];
    edges.forEach(([a, b]) =>
      m.lines.push({
        ...line(a, b, colors.muted),
        opacity: progress >= 2 ? 0.3 : 0.7,
      }),
    );
    poly([B, C, D], colors.muted, 0.11);
    poly([A, C, D], colors.blue, progress >= 2 ? 0.13 : 0.07);
    if (progress < 2) {
      poly([A, M, D], colors.blue, 0.17);
      m.lines.push({ ...line(A, M, colors.blue), opacity: 1 });
      if (progress > 0.1) poly([A, B, M], colors.orange, 0.15);
    }
    for (const [name, at] of Object.entries({ A, B, C, D, M }))
      m.dots.push({
        at,
        color: name === "A" ? colors.blue : colors.muted,
        label: name,
      });
    if (progress > 1) {
      const circle = scene.circle,
        round = points(
          (t) =>
            [0, 1, 2].map(
              (i) =>
                circle.center[i] +
                circle.radius *
                  (Math.cos(t) * circle.basisU[i] +
                    Math.sin(t) * circle.basisV[i]),
            ) as Point,
          0,
          Math.PI * 2,
          100,
        );
      m.lines.push({
        points: round,
        color: colors.blue,
        opacity: ease(progress - 1),
      });
      poly(round, colors.blue, 0.15);
      m.dots.push({ at: I, color: colors.blue, label: "I" });
      if (progress > 3) {
        const drop = ease(progress - 3),
          projected = round.map(([x, y, z]) => [x, y, z * (1 - drop)] as Point);
        m.lines.push({ points: projected, color: colors.green });
        poly(projected, colors.green, 0.2);
        for (let j = 0; j < round.length; j += 12)
          m.lines.push({
            ...line(
              round[j],
              [round[j][0], round[j][1], 0],
              colors.orange,
              true,
            ),
            opacity: 0.55,
          });
      }
    }
    if (progress > 2) {
      poly([A, Ap, H], colors.orange, 0.25);
      m.lines.push(
        line(A, Ap, colors.orange, true),
        line(A, H, colors.orange),
        line(Ap, H, colors.green),
      );
      m.dots.push(
        { at: Ap, color: colors.orange, label: "A′" },
        { at: H, color: colors.orange, label: "H" },
      );
    }
    metric("내접원 반지름", progress >= 2 ? "√2" : "계산 전");
    metric("cos θ", progress >= 3 ? "√10 / 8" : "계산 전");
    metric("정사영 넓이", progress >= 4 ? "π√10 / 4" : "계산 전");
    m.description =
      "실제 기출의 사면체 좌표입니다. 내접원을 z=0 평면에 수직 투영하고 보조단면에서 이면각을 확인합니다.";
  } else if (id === "balls") {
    m.range = [-0.8, 16, -0.8, 16];
    let eventCount = 0,
      favorableCount = 0;
    const exact = workedProblems.find((w) => w.id === "2024-probability-28")!
      .scene as any;
    const outcomes: { at: Point; inE: boolean; inF: boolean }[] =
      exact.outcomes.map((o: any, i: number) => {
        const inE = o.condition,
          inF = o.condition && o.success;
        if (inE) eventCount++;
        if (inF) favorableCount++;
        return { at: [i % 16, Math.floor(i / 16), 0], inE, inF };
      });
    const phase = ease(progress - 1);
    outcomes.forEach((o, i) =>
      m.dots.push({
        at: o.at,
        color:
          progress < 1
            ? colors.muted
            : !o.inE
              ? colors.muted
              : progress >= 3 && o.inF
                ? colors.blue
                : colors.orange,
        size:
          i === Math.round(p.outcome ?? 15)
            ? 0.09
            : progress < 1
              ? 0.05
              : o.inE
                ? 0.055
                : mix(0.05, 0.012, phase),
      }),
    );
    const observed = exact.outcomes[Math.round(p.outcome ?? 15)];
    m.inspection = `관찰한 카드 순서: ${observed.draws.join(" → ")} · 옮긴 공 ${observed.totalBalls}개 · 검정 공 ${observed.blackBalls}개 · ${observed.condition ? (observed.success ? "조건과 사건 모두 만족" : "조건만 만족") : "조건 불만족"}`;
    metric("전체 결과", 256);
    metric("조건을 만족", progress >= 2 ? eventCount : "선별 전");
    metric("교집합", progress >= 3 ? favorableCount : "선별 전");
    metric(
      "조건부확률",
      progress >= 4 ? `${favorableCount}/${eventCount}` : "계산 전",
    );
    m.description =
      "복원추출 4회의 순서 있는 결과 256개를 놓고 조건과 교집합에 따라 점을 걸러 냅니다.";
  } else if (id === "conditional") {
    m.range = [0, 7, 0, 7];
    const sum = Math.round(p.sum);
    let total = 0,
      fav = 0;
    for (let i = 1; i <= 6; i++)
      for (let j = 1; j <= 6; j++) {
        const inA = i + j === sum,
          inB = i % 2 === 0;
        if (inA) {
          total++;
          if (inB) fav++;
        }
        const fade = ease(progress);
        m.dots.push({
          at: [i, j, 0],
          color: inA
            ? progress > 1
              ? inB
                ? colors.blue
                : colors.orange
              : colors.orange
            : colors.muted,
          size: inA ? 0.11 : mix(0.1, 0.03, fade),
        });
        if (inA && progress > 0.5)
          poly(
            [
              [i - 0.24, j - 0.24, 0],
              [i + 0.24, j - 0.24, 0],
              [i + 0.24, j + 0.24, 0],
              [i - 0.24, j + 0.24, 0],
            ],
            inB && progress > 1 ? colors.blue : colors.orange,
            0.1,
          );
      }
    metric("전체 결과", 36);
    metric("조건 A의 결과", total);
    metric("A ∩ B의 결과", fav);
    metric("P(B | A)", `${fav}/${total} ≈ ${format(fav / total)}`);
    m.description = `합이 ${sum}인 ${total}개 결과 중 첫 번째가 짝수인 것은 ${fav}개입니다.`;
  } else if (id === "normal") {
    m.range = [-5, 5, -0.03, 0.85];
    const mu = p.mu * (1 - ease(progress)),
      sd = mix(p.sigma, 1, ease(progress - 1)),
      f = (x: number) =>
        Math.exp(-0.5 * ((x - mu) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
    curve(f, -5, 5, colors.blue);
    poly(
      [
        [mu - sd, 0, 0],
        ...points((x) => [x, f(x), 0], mu - sd, mu + sd),
        [mu + sd, 0, 0],
      ],
      colors.blue,
      0.2,
    );
    for (const x of [mu - sd, mu, mu + sd])
      m.lines.push(line([x, 0, 0], [x, f(x), 0], colors.orange, true));
    metric("중심", mu);
    metric("현재 단위", sd);
    metric("색칠한 확률", normalCdf(1) - normalCdf(-1));
    m.description =
      "가로축 단위와 세로축 밀도를 함께 바꾸어 넓이를 유지합니다.";
  } else if (id === "conic") {
    m.range = [-5, 5, -3, 3];
    const a = p.a,
      b = 1.5,
      c = Math.sqrt(a * a - b * b),
      t = (p.theta * Math.PI) / 180,
      pt: Point = [a * Math.cos(t), b * Math.sin(t), 0],
      f1: Point = [-c, 0, 0],
      f2: Point = [c, 0, 0];
    m.lines.push({
      points: points(
        (x) => [a * Math.cos(x), b * Math.sin(x), 0],
        0,
        Math.PI * 2,
        180,
      ),
      color: colors.blue,
      opacity: progress < 1 ? 0.2 : 1,
    });
    m.dots.push(
      { at: f1, color: colors.green, label: "F₁" },
      { at: f2, color: colors.green, label: "F₂" },
      { at: pt, color: colors.orange, label: "P" },
    );
    m.lines.push(line(f1, pt, colors.green), line(f2, pt, colors.orange));
    metric("PF₁", Math.hypot(pt[0] + c, pt[1]));
    metric("PF₂", Math.hypot(pt[0] - c, pt[1]));
    metric("거리의 합", 2 * a);
    m.description = "점의 위치에 관계없이 두 초점까지 거리의 합은 일정합니다.";
  } else if (id === "vector") {
    m.range = [-3.5, 4, -1, 3.5];
    const theta = (p.theta * Math.PI) / 180,
      b: Point = [2 * Math.cos(theta), 2 * Math.sin(theta), 0],
      foot: Point = [b[0], 0, 0];
    m.lines.push(
      line([0, 0, 0], [3, 0, 0], colors.blue),
      line([0, 0, 0], b, colors.green),
    );
    m.dots.push(
      { at: [3, 0, 0], color: colors.blue, label: "a" },
      { at: b, color: colors.green, label: "b" },
    );
    if (progress > 0) {
      m.lines.push(line(b, foot, colors.orange, true), {
        ...line([0, 0, 0], foot, colors.orange),
        width: 0.055,
      });
      m.dots.push({ at: foot, color: colors.orange, label: "정사영" });
    }
    metric("투영 성분", b[0]);
    metric("내적 a · b", 3 * b[0]);
    metric("각 θ", `${p.theta}°`);
    m.description = "각도가 둔각이 되면 투영 성분의 부호가 음수로 바뀝니다.";
  }
  return m;
}
