import fs from "node:fs";
import {
  C,
  p,
  line,
  path,
  curve,
  dot,
  surface,
  area,
  circle,
  frame,
  step,
  integrate,
  bars,
} from "./helpers.mjs";
const catalog = JSON.parse(
  fs.readFileSync(
    new URL("../../src/data/questions.json", import.meta.url),
    "utf8",
  ),
).questions;
const entries = [];
const R = String.raw,
  pi = Math.PI,
  e = Math.E;
const check = (label, actual, expected, tolerance = 1e-6) => ({
  label,
  actual,
  expected,
  tolerance,
});
const F = (range, lines = [], dots = [], surfaces = [], metrics = []) =>
  frame({ range, lines, dots, surfaces, metrics });
const met = (label, value) => ({ label, value: String(value) });
function add(id, title, summary, result, steps, checks) {
  const q = catalog.find((x) => x.id === id);
  if (!q) throw Error(id);
  for (const s of steps) {
    s.model.description = s.body;
  }
  entries.push({
    id,
    subject: "calculus",
    title,
    summary,
    result: String(result),
    answer: q.answer,
    steps,
    checks,
    source: {
      questionPage: q.questionPage,
      solutionPage: q.solutionPage,
      questionUrl: q.questionUrl,
      solutionUrl: q.solutionUrl,
    },
    verified: true,
  });
}
function integral(
  id,
  title,
  fn,
  primitive,
  a,
  b,
  formula,
  anti,
  result,
  range,
) {
  const m = (end) =>
    F(
      range,
      [curve(fn, a, b)],
      [dot(p(end, fn(end)), "b")],
      [area(fn, a, end)],
    );
  add(
    id,
    title,
    `${a}부터 ${b === pi / 2 ? "π/2" : b === e ? "e" : b}까지의 부호 있는 넓이를 구합니다.`,
    result,
    [
      step(
        "적분 구간과 높이를 봅니다",
        formula,
        "파란 곡선의 높이가 적분할 함수입니다. 가로 구간은 적분의 아래끝과 위끝으로 정해집니다.",
        m(a),
      ),
      step(
        "구간을 따라 넓이를 누적합니다",
        anti,
        "오른쪽 끝을 이동하며 넓이를 더합니다. x축 아래 부분은 음수로 누적합니다.",
        m((a + b) / 2),
      ),
      step(
        "원시함수의 끝값을 뺍니다",
        `${anti}=${result}`,
        "전체 구간의 누적값은 원시함수의 위끝 값에서 아래끝 값을 뺀 결과입니다.",
        m(b),
      ),
    ],
    [
      check(
        "중점 적분 검산",
        integrate(fn, a, b, 20000),
        primitive(b) - primitive(a),
        1e-6,
      ),
    ],
  );
}
function derivative(id, title, fn, df, x, formula, result, range) {
  const h = [1, 0.25, 0.01],
    y = fn(x);
  add(
    id,
    title,
    `x=${x}에서 두 점의 할선이 접선으로 바뀌는 과정을 봅니다.`,
    result,
    h.map((d, i) => {
      const slope = i === 2 ? df(x) : (fn(x + d) - y) / d;
      return step(
        [
          "두 점의 할선을 그립니다",
          "두 번째 점을 가까이 옮깁니다",
          "미분계수가 접선의 기울기입니다",
        ][i],
        i === 2 ? formula : R`\frac{f(a+h)-f(a)}h`,
        i === 2
          ? `h가 0으로 가면 기울기는 ${result}입니다. 주황 선은 이 점에서의 접선입니다.`
          : "같은 곡선 위 두 점의 세로 변화량을 가로 변화량으로 나눕니다.",
        F(
          range,
          [
            curve(fn, range[0], range[1]),
            curve((t) => y + slope * (t - x), range[0], range[1], C.orange),
          ],
          [dot(p(x, y), "P"), dot(p(x + d, fn(x + d)), "Q", C.green)],
          [],
          [met("기울기", slope.toFixed(5))],
        ),
      );
    }),
    [check("중앙 차분", (fn(x + 1e-5) - fn(x - 1e-5)) / 2e-5, df(x), 1e-6)],
  );
}
function ratioLimit(
  id,
  title,
  numerator,
  denominator,
  numFormula,
  ratioFormula,
  value,
  range,
) {
  add(
    id,
    title,
    "분자와 분모가 함께 0에 가까워질 때 각 변화율의 비를 비교합니다.",
    value,
    [
      step(
        "두 함수가 함께 0으로 갑니다",
        numFormula,
        "원점 부근에서 분자와 분모의 높이를 비교합니다.",
        F(range, [
          curve(numerator, range[0], range[1]),
          curve(denominator, range[0], range[1], C.green),
        ]),
      ),
      step(
        "함수값의 비를 그립니다",
        ratioFormula,
        "0에서는 나눗셈이 정의되지 않으므로 빈 점으로 표시합니다. 양쪽에서 다가오는 높이를 확인합니다.",
        F(
          [range[0], range[1], 0, value * 1.8],
          [
            curve((x) => numerator(x) / denominator(x), range[0], -0.00001),
            curve((x) => numerator(x) / denominator(x), 0.00001, range[1]),
          ],
          [dot(p(0, value), "극한", C.orange, { open: true })],
        ),
      ),
      step(
        "접선 기울기의 비로 수렴합니다",
        `${ratioFormula}=${value}`,
        "지수·로그 함수의 기본 극한으로 두 변화율을 나눕니다. 빈 점의 높이가 구하는 극한입니다.",
        F(
          [-0.03, 0.03, value - 0.3, value + 0.3],
          [
            curve((x) => numerator(x) / denominator(x), -0.03, -0.00001),
            curve((x) => numerator(x) / denominator(x), 0.00001, 0.03),
            line(p(-0.03, value), p(0.03, value), C.green, { dashed: true }),
          ],
          [dot(p(0, value), String(value), C.orange, { open: true })],
        ),
      ),
    ],
    [
      check(
        "양쪽 극한 평균",
        (numerator(1e-7) / denominator(1e-7) +
          numerator(-1e-7) / denominator(-1e-7)) /
          2,
        value,
        1e-6,
      ),
    ],
  );
}

ratioLimit(
  "2017-a-2",
  "두 변화율의 비가 2로 모입니다",
  (x) => Math.expm1(6 * x),
  (x) => Math.log1p(3 * x),
  R`e^{6x}-1,\quad\ln(1+3x)`,
  R`\lim_{x\to0}\frac{e^{6x}-1}{\ln(1+3x)}`,
  2,
  [-0.2, 0.2, -1, 3],
);
integral(
  "2017-a-3",
  "사인 곡선 아래 넓이",
  (x) => 2 * Math.sin(x),
  (x) => -2 * Math.cos(x),
  0,
  pi / 2,
  R`\int_0^{\pi/2}2\sin x\,dx`,
  R`[-2\cos x]_0^{\pi/2}`,
  "2",
  [-0.2, 1.9, -0.3, 2.5],
);
{
  const fn = (x) => x ** 3 + x + 1,
    range = [-1.2, 2, -1.5, 3];
  add(
    "2017-a-6",
    "역함수에서 가로와 세로를 맞바꿉니다",
    "f(x)=x³+x+1의 역함수 g에 대해 g′(1)을 구합니다.",
    "1",
    [
      step(
        "원함수의 대응점을 찾습니다",
        R`f(0)=1\quad\Longrightarrow\quad g(1)=0`,
        "원함수의 점 (0,1)은 역함수에서 (1,0)이 됩니다.",
        F(
          range,
          [
            curve(fn, -1, 1.1),
            line(p(-1, -1), p(3, 3), C.muted, { dashed: true }),
          ],
          [dot(p(0, 1), "(0,1)")],
        ),
      ),
      step(
        "곡선을 대각선에 대해 반사합니다",
        R`(x,f(x))\longleftrightarrow(f(x),x)`,
        "가로 변화량과 세로 변화량이 서로 바뀝니다. 초록 곡선이 역함수입니다.",
        F(
          range,
          [
            curve(fn, -1, 1.1),
            curve((x) => p(fn(x), x), -1, 1.1, C.green),
            line(p(-1, -1), p(3, 3), C.muted, { dashed: true }),
          ],
          [dot(p(1, 0), "(1,0)")],
        ),
      ),
      step(
        "두 접선 기울기는 역수입니다",
        R`g'(1)=\frac1{f'(0)}=\frac1{3\cdot0^2+1}=1`,
        "원함수의 기울기가 1이므로 반사된 접선도 기울기 1입니다.",
        F(
          range,
          [
            curve((x) => p(fn(x), x), -1, 1.1, C.green),
            line(p(-0.2, -1.2), p(2.2, 1.2), C.orange),
          ],
          [dot(p(1, 0), "기울기 1")],
        ),
      ),
    ],
    [
      check("원함수 값", fn(0), 1),
      check("미분계수 역수", 1 / (3 * 0 ** 2 + 1), 1),
    ],
  );
}
integral(
  "2017-a-9",
  "로그의 넓이를 부분적분합니다",
  (x) => Math.log(x / e),
  (x) => x * Math.log(x) - 2 * x,
  1,
  e,
  R`\int_1^e\ln\frac xe\,dx`,
  R`[x\ln x-2x]_1^e`,
  "2-e",
  [0.7, 3, -1.3, 0.4],
);
{
  const h = (x) => Math.sqrt(x) + 1,
    slices = [0, 0.5, 1];
  add(
    "2017-a-11",
    "정사각형 단면을 쌓아 부피를 구합니다",
    "0≤x≤1에서 단면의 한 변은 √x+1입니다.",
    "17/6",
    slices.map((x, i) => {
      const s = h(x);
      const m = frame({
        threeD: true,
        range: [-0.2, 2, -0.2, 2.5],
        lines: [
          curve((t) => p(t, h(t)), 0, 1),
          curve((t) => p(t, h(t), h(t)), 0, 1),
          line(p(0), p(1)),
          line(p(0, 0, 1), p(1, 0, 2)),
        ],
        surfaces: [
          surface([p(x), p(x, s), p(x, s, s), p(x, 0, s)], C.orange, 0.45),
        ],
        dots: [dot(p(x, s, s), `x=${x}`)],
        metrics: [met("단면 넓이", (s * s).toFixed(4))],
      });
      return step(
        [
          "밑면에서 한 변을 읽습니다",
          "세로 단면을 정사각형으로 세웁니다",
          "단면 넓이를 x방향으로 적분합니다",
        ][i],
        [
          R`\ell(x)=\sqrt x+1`,
          R`A(x)=(\sqrt x+1)^2=x+2\sqrt x+1`,
          R`V=\int_0^1(x+2\sqrt x+1)dx=\frac{17}6`,
        ][i],
        [
          "밑면 곡선의 높이가 정사각형 단면의 한 변입니다.",
          "단면을 이동하면 한 변뿐 아니라 높이도 함께 바뀝니다.",
          "정사각형의 넓이를 적분하므로 곡선 높이 자체를 적분한 값과 다릅니다.",
        ][i],
        m,
      );
    }),
    [
      check(
        "부피 수치 적분",
        integrate((x) => h(x) ** 2, 0, 1, 80000),
        17 / 6,
        1e-6,
      ),
    ],
  );
}
{
  const angles = [0.9, 0.45, 0.12];
  add(
    "2017-a-14",
    "작아지는 삼각형과 θ⁴의 크기를 비교합니다",
    "반지름 1인 사분원에서 AQH의 넓이를 θ⁴로 나눕니다.",
    "1/8",
    angles.map((t, i) => {
      const c = Math.cos(t),
        s = Math.sin(t),
        A = p(1),
        H = p(c),
        Q = p(c, 1 - c);
      return step(
        [
          "보조선을 그리고 길이를 읽습니다",
          "두 직각변이 동시에 작아집니다",
          "기본 삼각함수 극한을 적용합니다",
        ][i],
        [
          R`AH=QH=1-\cos\theta`,
          R`S(\theta)=\frac12(1-\cos\theta)^2`,
          R`\frac{S(\theta)}{\theta^4}=\frac12\left(\frac{1-\cos\theta}{\theta^2}\right)^2\to\frac18`,
        ][i],
        "호 위의 P에서 내린 수선은 AB와 Q에서 만납니다. 주황 삼각형의 두 변은 모두 1−cosθ입니다.",
        frame({
          range:
            i === 2
              ? [c - 0.002, 1.002, -0.002, 1 - c + 0.002]
              : [-0.2, 1.3, -0.2, 1.2],
          equalAspect: true,
          lines: [
            curve((u) => p(Math.cos(u), Math.sin(u)), 0, pi / 2),
            line(p(1), p(0, 1), C.green),
            line(p(c, s), H),
            line(p(), p(c, s)),
          ],
          surfaces: [surface([A, H, Q], C.orange, 0.5)],
          dots: [
            dot(A, "A"),
            dot(Q, "Q"),
            dot(H, "H"),
            ...(i === 2 ? [] : [dot(p(c, s), "P")]),
          ],
          metrics: [
            met("θ", t),
            met("S/θ⁴", ((0.5 * (1 - c) ** 2) / t ** 4).toFixed(6)),
          ],
        }),
      );
    }),
    [
      check(
        "극한 수치",
        0.5 * ((1 - Math.cos(0.001)) / 0.001 ** 2) ** 2,
        0.125,
        1e-7,
      ),
    ],
  );
}
{
  const fn = (x) => 2 * Math.exp(-x);
  add(
    "2017-a-15",
    "접선 삼각형의 넓이가 최대인 위치",
    "y=2e⁻ˣ의 접선과 y축 사이 삼각형의 넓이를 비교합니다.",
    "2",
    [0.7, 1.4, 2].map((t, i) => {
      const y = fn(t),
        a = t * t * Math.exp(-t);
      return step(
        [
          "접점에서 접선을 그립니다",
          "넓이를 t 하나의 식으로 바꿉니다",
          "증가에서 감소로 바뀌는 t를 찾습니다",
        ][i],
        [
          R`y-2e^{-t}=-2e^{-t}(x-t)`,
          R`S(t)=\frac12\cdot t\cdot2te^{-t}=t^2e^{-t}`,
          R`S'(t)=te^{-t}(2-t),\quad t=2`,
        ][i],
        "A=(0,2e⁻ᵗ), B=(0,2(t+1)e⁻ᵗ)이므로 AB=2te⁻ᵗ입니다. 넓이의 도함수 부호는 2−t가 결정합니다.",
        F(
          [-0.3, 4, -0.3, 2.8],
          [curve(fn, 0, 4), curve((x) => y - y * (x - t), 0, 3, C.green)],
          [dot(p(t, y), "P"), dot(p(0, y), "A"), dot(p(0, y * (1 + t)), "B")],
          [surface([p(0, y), p(t, y), p(0, y * (1 + t))], C.orange, 0.3)],
          [met("t", t), met("삼각형 넓이", a.toFixed(5))],
        ),
      );
    }),
    [check("최대점 도함수", 2 * Math.exp(-2) * (2 - 2), 0)],
  );
}
{
  const I = (x) => integrate((t) => Math.sin(t * t), 0, x, 500),
    fn = (x) => Math.exp(-x) * I(x),
    df = (x) => Math.exp(-x) * (Math.sin(x * x) - I(x)),
    b = Math.sqrt(pi);
  let lo = 0.1,
    hi = b;
  for (let i = 0; i < 50; i++) {
    let m = (lo + hi) / 2;
    if (df(m) > 0) lo = m;
    else hi = m;
  }
  const r = (lo + hi) / 2;
  add(
    "2017-a-20",
    "양의 적분에서 극댓점의 존재까지",
    "e⁻ˣ∫₀ˣ sin(t²)dt의 부호와 평균값 정리를 연결합니다.",
    "ㄱ, ㄴ, ㄷ",
    [
      step(
        "구간 전체에서 적분할 함수가 양수입니다",
        R`0<t<\sqrt\pi\Rightarrow\sin(t^2)>0`,
        "0<t²<π이므로 누적 넓이는 양수입니다. 따라서 f(√π)>0입니다.",
        F(
          [-0.15, 2, -0.2, 1.3],
          [curve((t) => Math.sin(t * t), 0, b)],
          [],
          [area((t) => Math.sin(t * t), 0, b)],
        ),
      ),
      step(
        "양의 평균 기울기에서 증가점을 찾습니다",
        R`\exists a:\ f'(a)=\frac{f(\sqrt\pi)-f(0)}{\sqrt\pi}>0`,
        "끝점들을 잇는 할선의 기울기가 양수이므로 평균값 정리에 의해 양의 미분계수가 존재합니다.",
        F(
          [-0.15, 2, -0.1, 0.6],
          [curve(fn, 0, b), line(p(), p(b, fn(b)), C.green)],
          [dot(p(b, fn(b)), "f(√π)>0")],
        ),
      ),
      step(
        "오른쪽 끝에서는 도함수가 음수입니다",
        R`f'(x)=e^{-x}\sin x^2-f(x),\quad f'(\sqrt\pi)<0`,
        "도함수는 연속이며 앞에서 양수인 점이 있고 오른쪽 끝에서 음수입니다. 사이에 0이 존재합니다.",
        F(
          [-0.15, 2, -0.3, 0.5],
          [curve(fn, 0, b), curve(df, 0, b, C.green)],
          [dot(p(r, 0), "f′=0"), dot(p(r, fn(r)), "극댓점")],
          [],
          [met("판정", "ㄱ·ㄴ·ㄷ 모두 참")],
        ),
      ),
    ],
    [check("도함수 영점", df(r), 0), check("f(0)", fn(0), 0)],
  );
}
{
  const A = Math.SQRT2 - 1,
    B = 2 * Math.SQRT2;
  add(
    "2017-a-21",
    "알 수 없는 함수를 누적 넓이 축으로 바꿉니다",
    "증가 연속함수의 양·음 넓이를 구하고 u=F(x)로 치환합니다.",
    "1+2√2",
    [
      step(
        "양수·음수 부분의 넓이를 분리합니다",
        R`P-N=2,\quad P+N=2\sqrt2`,
        "함수의 구체적인 모양은 주어지지 않았습니다. 확정되는 두 넓이 P와 N만 막대로 나타냅니다.",
        F(
          [-0.7, 2.7, -0.2, 3],
          [],
          [dot(p(0, A), "N"), dot(p(1, 1 + Math.SQRT2), "P")],
          bars([A, 1 + Math.SQRT2]),
          [met("N", "√2−1"), met("P", "√2+1")],
        ),
      ),
      step(
        "증가하는 누적량 u로 적분 변수를 바꿉니다",
        R`u=F(x),\quad 0\le u\le2\sqrt2,\quad F(c)=N`,
        "f의 부호가 바뀌는 c 이전에는 f dx=−du, 이후에는 f dx=du입니다. 가로축은 x가 아니라 누적 넓이 u입니다.",
        {
          ...F(
            [-0.3, 3.2, -1, 3.2],
            [line(p(0), p(A, -A), C.red), line(p(A, A), p(B, B), C.green)],
            [],
            [area((u) => -u, 0, A, C.red)],
          ),
          axisLabel: "u = F(x)",
        },
      ),
      step(
        "두 삼각형의 부호 있는 넓이를 더합니다",
        R`-\int_0^N u\,du+\int_N^{2\sqrt2}u\,du=4-N^2=1+2\sqrt2`,
        "누적 넓이 축에서는 곡선의 원래 모양을 몰라도 직선 y=±u의 적분으로 결정됩니다.",
        {
          ...F(
            [-0.3, 3.2, -1, 3.2],
            [line(p(0), p(A, -A), C.red), line(p(A, A), p(B, B), C.green)],
            [],
            [area((u) => -u, 0, A, C.red), area((u) => u, A, B, C.green)],
          ),
          axisLabel: "u = F(x)",
        },
      ),
    ],
    [check("넓이 합", 0.5 * B * B - A * A, 1 + 2 * Math.SQRT2)],
  );
}
{
  add(
    "2017-a-23",
    "감소하는 지수함수와 부등식 경계",
    "(1/2)^(x−5)≥4인 자연수 x를 찾습니다.",
    "6",
    [
      step(
        "두 그래프의 높이를 비교합니다",
        R`2^{5-x}\ge4`,
        "밑이 1/2이므로 x가 증가할수록 곡선의 높이는 감소합니다.",
        F(
          [0, 6, 0, 10],
          [curve((x) => 2 ** (5 - x), 2, 6), line(p(0, 4), p(6, 4), C.green)],
        ),
      ),
      step(
        "밑을 통일하고 지수를 비교합니다",
        R`2^{5-x}\ge2^2\iff 5-x\ge2\iff x\le3`,
        "밑을 2로 통일하면 지수의 대소가 그대로 높이의 대소가 됩니다.",
        F(
          [0, 6, 0, 10],
          [curve((x) => 2 ** (5 - x), 2, 6), line(p(0, 4), p(6, 4), C.green)],
          [dot(p(3, 4), "경계 x=3")],
          [surface([p(0), p(3), p(3, 10), p(0, 10)], C.green, 0.1)],
        ),
      ),
      step(
        "자연수 조건을 적용합니다",
        R`x\in\{1,2,3\},\quad1+2+3=6`,
        "음수나 0은 자연수 조건에서 빠집니다. 가능한 세 수를 더합니다.",
        F(
          [0, 5, -1, 2],
          [line(p(0), p(3), C.green)],
          [1, 2, 3].map((x) => dot(p(x), String(x))),
        ),
      ),
    ],
    [
      check(
        "자연수 합",
        [1, 2, 3].reduce((a, b) => a + b),
        6,
      ),
    ],
  );
}
{
  const roots = [pi, 1.5 * pi];
  add(
    "2017-a-25",
    "삼각방정식을 높이 조건으로 바꿉니다",
    "0<x<2π에서 cos²x−sin x=1의 해를 찾습니다.",
    "7",
    [
      step(
        "원래 두 변을 비교합니다",
        R`\cos^2x-\sin x=1`,
        "양끝 0과 2π는 제외된 구간입니다.",
        F(
          [-0.3, 6.6, -1.3, 1.5],
          [
            curve((x) => Math.cos(x) ** 2 - Math.sin(x), 0, 2 * pi),
            line(p(0, 1), p(2 * pi, 1), C.green),
          ],
        ),
      ),
      step(
        "사인값 두 개로 분리합니다",
        R`\sin x(\sin x+1)=0\iff\sin x=0\text{ 또는 }-1`,
        "사인 곡선이 y=0 또는 y=−1에 닿는 위치를 찾습니다.",
        F(
          [-0.3, 6.6, -1.3, 1.5],
          [curve(Math.sin, 0, 2 * pi), line(p(0, -1), p(2 * pi, -1), C.green)],
          roots.map((x) => dot(p(x, Math.sin(x)), x === pi ? "π" : "3π/2")),
        ),
      ),
      step(
        "구간 안의 해만 더합니다",
        R`\pi+\frac{3\pi}2=\frac{5\pi}2,\quad p+q=2+5=7`,
        "x=0과 2π는 빈 점으로 지우고 두 해의 합을 기약분수로 나타냅니다.",
        F(
          [-0.3, 6.6, -1.3, 1.5],
          [curve(Math.sin, 0, 2 * pi)],
          [
            ...roots.map((x) =>
              dot(p(x, Math.sin(x)), x === pi ? "π" : "3π/2"),
            ),
            dot(p(0), "제외", C.muted, { open: true }),
            dot(p(2 * pi), "제외", C.muted, { open: true }),
          ],
        ),
      ),
    ],
    [
      check(
        "두 해 대입",
        roots.reduce(
          (s, x) => s + Math.abs(Math.cos(x) ** 2 - Math.sin(x) - 1),
          0,
        ),
        0,
      ),
    ],
  );
}
{
  add(
    "2017-a-30",
    "같은 두 극댓값을 중근과 접점으로 바꿉니다",
    "두 극댓점 사이 거리 6√3을 이용해 g′의 영점 개수 경계를 찾습니다.",
    "216",
    [
      step(
        "두 극댓점은 같은 직선과 접합니다",
        R`g(x)-M(x-a)=-(x-\alpha)^2(x-\beta)^2`,
        "f의 극댓값 M에서 g와 직선 M(x−a)가 두 번씩 접하므로 두 중근을 갖습니다. 그래프는 차이 함수이며 좌표를 중앙으로 평행이동했습니다.",
        F(
          [-7, 7, -800, 100],
          [curve((t) => -((t * t - 27) ** 2), -7, 7)],
          [dot(p(-3 * Math.sqrt(3)), "α"), dot(p(3 * Math.sqrt(3)), "β")],
        ),
      ),
      step(
        "도함수의 두 영점이 합쳐지는 경계를 봅니다",
        R`u=x-\frac{\alpha+\beta}2,\quad g'(x)=-4u^3+108u+M`,
        "h=(x−α)(x−β)라 놓으면 f′=−hQ/(x−a)², Q=2h′(x−a)−h입니다. Q(a)<0, Q(α)<0, Q(β)>0이고 Q의 최고차항은 3x²이므로 한 근은 a 왼쪽, 다른 근은 (α,β)에 있습니다. 따라서 정의역에서 f의 극값은 정확히 세 개이며, g의 극값은 세 개보다 적어야 합니다.",
        F(
          [-7, 7, -350, 500],
          [curve((u) => -4 * u ** 3 + 108 * u + 100, -6, 6)],
          [dot(p(-3, -116), "극소 높이 M−216")],
          [],
          [met("비교용 M", 100)],
        ),
      ),
      step(
        "중근에서 극값의 개수가 줄어듭니다",
        R`(g')'(u)=-12u^2+108=0\Rightarrow u=\pm3`,
        "u=−3에서 g′의 극솟값은 M−216입니다. 양수 M에서 이 값이 0이 되는 순간 두 영점이 합쳐집니다.",
        F(
          [-7, 7, -350, 500],
          [curve((u) => -4 * u ** 3 + 108 * u + 216, -6, 6)],
          [dot(p(-3), "중근"), dot(p(6), "다른 영점")],
          [],
          [met("M", 216)],
        ),
      ),
      step(
        "양의 M의 최소 경계를 택합니다",
        R`M-216\ge0\quad\Longrightarrow\quad M_{\min}=216`,
        "중근에서는 g′의 부호가 바뀌지 않으므로 g의 극값으로 세지 않습니다. 경계 M=216이 포함됩니다.",
        F(
          [-7, 7, -350, 500],
          [curve((u) => -4 * (u + 3) ** 2 * (u - 6), -6, 6)],
          [dot(p(-3), "부호 유지"), dot(p(6), "부호 변화")],
          [],
          [met("최소 M", 216)],
        ),
      ),
    ],
    [
      check("극소 높이", -4 * (-3) ** 3 + 108 * -3 + 216, 0),
      check("거리", 6 * Math.sqrt(3), 2 * 3 * Math.sqrt(3)),
    ],
  );
}

// 2017학년도 나형 — 원문 그래프는 필요한 가지와 끝점만 독립적으로 재구성.
{
  const lines = [
    line(p(-2, 2), p(0), C.blue),
    line(p(0), p(1, 2), C.green),
    line(p(1, -3), p(4, 1.5), C.blue),
  ];
  const ends = [
    dot(p(0), "", C.blue, { open: true }),
    dot(p(1, 2), "", C.green, { open: true }),
    dot(p(1, -3), "", C.blue, { open: true }),
    dot(p(0, -2), "f(0)"),
    dot(p(1, 3), "f(1)"),
  ];
  add(
    "2017-b-8",
    "함숫값과 다가가는 높이를 구분합니다",
    "원문 그래프에서 0의 왼쪽 극한과 1의 오른쪽 극한을 읽습니다.",
    "−3",
    [
      step(
        "빈 점과 채운 점을 구별합니다",
        R`f(0)=-2,\quad f(1)=3`,
        "채운 점은 해당 x에서의 함숫값입니다. 문제에서 묻는 두 극한과는 구분합니다.",
        F([-2.5, 4.5, -3.6, 3.7], lines, ends),
      ),
      step(
        "지정된 방향에서 가지를 따라갑니다",
        R`\lim_{x\to0^-}f(x)=0,\quad\lim_{x\to1^+}f(x)=-3`,
        "0의 왼쪽 가지는 원점으로, 1의 오른쪽 가지는 높이 −3으로 다가갑니다.",
        F([-2.5, 4.5, -3.6, 3.7], lines, [
          ...ends,
          dot(p(-0.4, 0.4), "왼쪽에서"),
          dot(p(1.4, -2.4), "오른쪽에서"),
        ]),
      ),
      step(
        "두 극한값만 더합니다",
        R`0+(-3)=-3`,
        "점의 실제 함수값 −2와 3은 이 덧셈에 쓰지 않습니다.",
        F(
          [-2.5, 4.5, -3.6, 3.7],
          lines,
          [...ends, dot(p(-0.04, 0.04), "→0"), dot(p(1.04, -2.94), "→−3")],
          [],
          [met("두 극한의 합", -3)],
        ),
      ),
    ],
    [check("극한의 합", 0 - 3, -3)],
  );
}
integral(
  "2017-b-9",
  "다항함수의 부호 있는 넓이",
  (x) => 6 * x * x - x,
  (x) => 2 * x ** 3 - (x * x) / 2,
  0,
  2,
  R`\int_0^2(6x^2-x)dx`,
  R`[2x^3-\tfrac12x^2]_0^2`,
  "14",
  [-0.2, 2.3, -1, 24],
);
{
  const v = (t) => 4 - 2 * t;
  add(
    "2017-b-12",
    "속도의 음수 부분을 반사해 이동 거리를 봅니다",
    "속도 v(t)=−2t+4를 0≤t≤4에서 적분합니다.",
    "8",
    [
      step(
        "방향을 바꾸는 시각을 찾습니다",
        R`v(t)=4-2t=0\iff t=2`,
        "t=2에서 속도가 0이 된 뒤 음수가 됩니다. 뒤로 움직인 거리도 양수로 세어야 합니다.",
        F([-0.3, 4.4, -4.8, 4.8], [curve(v, 0, 4)], [dot(p(2), "방향 전환")]),
      ),
      step(
        "음수 속도를 x축 위로 반사합니다",
        R`\text{거리}=\int_0^4|4-2t|dt`,
        "절댓값을 취하면 뒤로 간 구간의 넓이도 양수가 됩니다.",
        F(
          [-0.3, 4.4, -4.8, 4.8],
          [curve(v, 0, 2), curve((t) => -v(t), 2, 4, C.green)],
          [],
          [area(v, 0, 2), area((t) => -v(t), 2, 4, C.green)],
        ),
      ),
      step(
        "두 삼각형 넓이를 더합니다",
        R`\frac12\cdot2\cdot4+\frac12\cdot2\cdot4=8`,
        "변위는 0이지만 이동 거리는 8입니다. 좌우 두 삼각형의 넓이를 더합니다.",
        F(
          [-0.3, 4.4, -1, 5],
          [curve((t) => Math.abs(v(t)), 0, 4)],
          [],
          [area(v, 0, 2), area((t) => -v(t), 2, 4, C.green)],
          [met("변위", 0), met("이동 거리", 8)],
        ),
      ),
    ],
    [
      check(
        "속력 적분",
        integrate((t) => Math.abs(v(t)), 0, 4),
        8,
      ),
    ],
  );
}
{
  add(
    "2017-b-14",
    "분모의 점프를 분자의 0으로 맞춥니다",
    "f는 x=2에서 2에서 1로 바뀌고, g(x)=ax+1입니다.",
    "−1/2",
    [0, -0.25, -0.5].map((a, i) => {
      const left = (x) => (a * x + 1) / ((x - 2) ** 2 + 2),
        right = (x) => a * x + 1;
      return step(
        [
          "분모가 달라지는 경계를 표시합니다",
          "양쪽 극한을 같은 a로 계산합니다",
          "분자가 0이면 두 높이가 만납니다",
        ][i],
        [
          R`\frac{g(x)}{f(x)}=\begin{cases}\frac{ax+1}{(x-2)^2+2}&x<2\\ax+1&x\ge2\end{cases}`,
          R`\frac{2a+1}{2}=2a+1`,
          R`2a+1=0\quad\Longrightarrow\quad a=-\frac12`,
        ][i],
        "분모는 어느 쪽에서도 0이 되지 않습니다. x=2의 좌극한과 실제 함수값을 일치시키면 연속 조건이 완성됩니다.",
        F(
          [-0.4, 4.4, -1.4, 1.5],
          [
            curve(left, 0, 2),
            curve(right, 2, 4, C.green),
            line(p(2, -1.4), p(2, 1.5), C.muted, { dashed: true }),
          ],
          [
            dot(p(2, left(2)), "좌극한", C.blue, { open: true }),
            dot(p(2, right(2)), "함숫값", C.green),
          ],
          [],
          [met("a", a)],
        ),
      );
    }),
    [check("좌우 값 일치", (-0.5 * 2 + 1) / 2, -0.5 * 2 + 1)],
  );
}
{
  const first = (4 * pi) / 3 - Math.sqrt(3),
    ratio = 3 / 8;
  function fractal(level) {
    let todo = [{ x: 0, y: 0, r: 2 }],
      lines = [],
      surfaces = [];
    for (let n = 0; n <= level; n++) {
      const next = [];
      for (const { x, y, r } of todo) {
        lines.push(circle(x, y, r, n ? C.muted : C.blue, 40));
        for (const sign of [-1, 1]) {
          const angles = sign < 0 ? [(2 * pi) / 3, pi] : [0, pi / 3];
          const pts = curve(
            (t) => p(x + r * Math.cos(t), y + r * Math.sin(t)),
            ...angles,
            C.green,
            24,
          ).points;
          surfaces.push(
            surface(
              [p(x + (sign * r) / 2, y), ...pts],
              n ? C.orange : C.green,
              0.35,
            ),
          );
          next.push({
            x: x + sign * (r / 2 + (r * Math.sqrt(3)) / 2),
            y: y + (r * Math.sqrt(3)) / 2,
            r: (r * Math.sqrt(3)) / 4,
          });
        }
      }
      todo = next;
    }
    return frame({
      range: [-4.5, 4.5, -2.5, 4.5],
      lines,
      surfaces,
      equalAspect: true,
      metrics: [
        met(
          "누적 넓이",
          ((first * (1 - ratio ** (level + 1))) / (1 - ratio)).toFixed(6),
        ),
      ],
    });
  }
  add(
    "2017-b-17",
    "새 원 두 개의 넓이 비를 누적합니다",
    "반지름 2인 원에서 시작해 같은 두 조각을 반복합니다.",
    "(32π−24√3)/15",
    [
      step(
        "첫 원의 두 조각 넓이를 구합니다",
        R`a_1=2\left(\frac{2\pi}3-\frac{\sqrt3}2\right)=\frac{4\pi}3-\sqrt3`,
        "한 조각은 반지름 2인 부채꼴에서 삼각형을 뺀 넓이입니다. 좌우 두 조각을 더합니다.",
        fractal(0),
      ),
      step(
        "반지름 비와 개수 증가를 함께 셉니다",
        R`\frac{r_{n+1}}{r_n}=\frac{\sqrt3}4,\quad r=2\left(\frac{\sqrt3}4\right)^2=\frac38`,
        "새 원은 두 개씩 생깁니다. 길이 비를 제곱한 뒤 개수 2를 곱해야 전체 넓이 비가 됩니다.",
        fractal(1),
      ),
      step(
        "등비급수의 합으로 남은 넓이를 더합니다",
        R`S_\infty=\frac{4\pi/3-\sqrt3}{1-3/8}=\frac{32\pi-24\sqrt3}{15}`,
        "점점 작아지는 조각은 총 넓이 비 3/8로 줄어듭니다.",
        fractal(3),
      ),
    ],
    [
      check(
        "첫 두 조각",
        2 * integrate((x) => Math.sqrt(4 - x * x), -2, -1, 60000),
        first,
        1e-6,
      ),
      check("급수 합", first / (1 - ratio), (32 * pi - 24 * Math.sqrt(3)) / 15),
    ],
  );
}
{
  const f = (u) => u * (u + 4);
  add(
    "2017-b-18",
    "극한으로 근에서의 기울기를 결정합니다",
    "최고차항 계수 1인 이차함수의 두 근 사이 거리를 구합니다.",
    "4",
    [
      step(
        "극한값이 1이 아니므로 f(a)=0입니다",
        R`f(a)\ne0\Rightarrow\lim\frac{f(x)-(x-a)}{f(x)+(x-a)}=1`,
        "주어진 극한은 3/5이므로 f(a)=0이어야 합니다. 좌표를 u=x−a로 바꿉니다.",
        F(
          [-5, 1, -6, 6],
          [line(p(-5), p(1), C.muted)],
          [dot(p(0), "u=0은 근")],
        ),
      ),
      step(
        "공통 인수 x−a를 약분합니다",
        R`f(x)=(x-a)(x-b),\quad\frac{a-b-1}{a-b+1}=\frac35`,
        "극한 조건은 두 근의 간격 a−b를 직접 결정합니다. 식을 풀면 a−b=4입니다.",
        F([-5, 1, -6, 6], [curve(f, -5, 1)], [dot(p(0), "a"), dot(p(-4), "b")]),
      ),
      step(
        "가로 거리만 읽습니다",
        R`5(a-b-1)=3(a-b+1)\Rightarrow|a-b|=4`,
        "전체 그래프를 평행이동해도 두 근의 거리는 변하지 않습니다. 그림은 u=x−a 좌표의 정확한 식입니다.",
        F(
          [-5, 1, -6, 6],
          [curve(f, -5, 1), line(p(-4, -0.8), p(0, -0.8), C.green)],
          [dot(p(0), "0"), dot(p(-4), "−4")],
          [],
          [met("근 사이 거리", 4)],
        ),
      ),
    ],
    [check("극한 조건", (4 - 1) / (4 + 1), 3 / 5)],
  );
}
{
  add(
    "2017-b-20",
    "도함수의 음수 구간과 누적 변화량",
    "삼차함수의 극대점 0과 극소점 k를 적분 조건으로 제한합니다.",
    "ㄱ, ㄴ, ㄷ",
    [
      step(
        "도함수의 부호를 고정합니다",
        R`f'(x)=c\,x(x-k),\quad c>0,\ k>0`,
        "최고차항 계수가 양수이고 0이 극대점이므로 k>0입니다. 가로축 u=x/k, 세로축 f′/(ck²)로 정규화했습니다.",
        {
          ...F(
            [-0.3, 2, -0.4, 2.4],
            [curve((u) => u * (u - 1), -0.2, 2)],
            [dot(p(0), "0"), dot(p(1), "k")],
            [area((u) => u * (u - 1), 0, 1, C.red)],
          ),
          axisLabel: "u=x/k",
        },
      ),
      step(
        "t>1에서 양쪽을 미분합니다",
        R`|f'(t)|=f'(t)\quad(t>1)\Rightarrow0<k\le1`,
        "t>1에서는 도함수가 음수일 수 없습니다. 따라서 감소 구간 (0,k)가 1의 오른쪽까지 이어지면 모순입니다.",
        F(
          [-0.2, 1.5, -0.5, 1.4],
          [line(p(0, 0.4), p(1, 0.4), C.green)],
          [
            dot(p(0, 0.4), "제외", C.green, { open: true }),
            dot(p(1, 0.4), "포함", C.green),
          ],
          [],
          [met("k의 범위", "0<k≤1")],
        ),
      ),
      step(
        "절댓값 적분을 나누어 극솟값을 정합니다",
        R`f(0)-f(k)+f(t)-f(k)=f(t)+f(0)\Rightarrow f(k)=0`,
        "구간 (0,k)의 도함수 적분은 음수이고 극솟값은 0입니다. 세 보기 모두 참입니다. 마지막 그림은 c·k³로 나눈 정확한 함수족입니다.",
        {
          ...F(
            [-0.3, 2, -0.1, 0.9],
            [curve((u) => u ** 3 / 3 - (u * u) / 2 + 1 / 6, -0.2, 2)],
            [dot(p(0, 1 / 6), "극대"), dot(p(1), "극소 0")],
          ),
          axisLabel: "u=x/k",
        },
      ),
    ],
    [check("정규화 함수의 극솟값", 1 / 3 - 1 / 2 + 1 / 6, 0)],
  );
}
derivative(
  "2017-b-23",
  "할선의 기울기를 접선으로 보냅니다",
  (x) => x ** 3 + 3 * x * x + 3,
  (x) => 3 * x * x + 6 * x,
  2,
  R`f'(2)=3(2)^2+6(2)=24`,
  "24",
  [0.5, 3.1, -5, 65],
);
{
  add(
    "2017-b-26",
    "수직인 두 기울기에서 계수를 찾습니다",
    "(1,1)에서 접선에 수직인 직선의 기울기가 −1/2입니다.",
    "2",
    [
      step(
        "수직인 두 선의 기울기를 연결합니다",
        R`m\cdot\left(-\frac12\right)=-1\Rightarrow m=2`,
        "수직인 두 직선의 기울기 곱은 −1입니다. 접선 기울기는 2가 됩니다.",
        frame({
          range: [-1, 3, -1, 3],
          equalAspect: true,
          lines: [
            line(p(-1, 2), p(3, 0), C.green),
            line(p(0, -1), p(2, 3), C.orange),
          ],
          dots: [dot(p(1, 1), "P")],
        }),
      ),
      step(
        "도함수에 x=1을 대입합니다",
        R`f'(x)=3x^2-a,\quad3-a=2\Rightarrow a=1`,
        "미분계수 조건으로 a를 정합니다. 곡선 위 점 조건은 아직 b를 결정하는 데 남아 있습니다.",
        F(
          [-1, 2.1, -1, 6],
          [
            curve((x) => x ** 3 - x + 1, -1, 2),
            line(p(0, -1), p(2, 3), C.orange),
          ],
          [dot(p(1, 1), "기울기 2")],
        ),
      ),
      step(
        "곡선 위의 점으로 b를 정합니다",
        R`1=1-a+b\Rightarrow b=1,\quad a+b=2`,
        "기울기 조건과 점의 위치 조건을 각각 사용하면 두 계수가 모두 1입니다.",
        F(
          [-1, 2.1, -1, 6],
          [
            curve((x) => x ** 3 - x + 1, -1, 2),
            line(p(0, -1), p(2, 3), C.orange),
          ],
          [dot(p(1, 1), "(1,1)")],
          [],
          [met("a", 1), met("b", 1)],
        ),
      ),
    ],
    [check("수직 기울기 곱", 2 * -0.5, -1), check("점 대입", 1 - 1 + 1, 1)],
  );
}
{
  const ratio = (n) => (144 + 4 * 0.25 ** n) / (9 + 0.25 ** n);
  add(
    "2017-b-28",
    "길이의 제곱에서 지배적인 항을 남깁니다",
    "Pₙ=(4ⁿ,2ⁿ)의 이웃한 점 사이 길이 비를 구합니다.",
    "16",
    [
      step(
        "두 좌표의 변화량을 직각삼각형으로 봅니다",
        R`\Delta x=3\cdot4^n,\quad\Delta y=2^n`,
        "n=1의 실제 점 P₁=(4,2), P₂=(16,4)를 표시했습니다.",
        F(
          [0, 18, 0, 6],
          [
            curve(Math.sqrt, 0, 18),
            line(p(4, 2), p(16, 4), C.orange),
            line(p(4, 2), p(16, 2), C.green),
            line(p(16, 2), p(16, 4), C.green),
          ],
          [dot(p(4, 2), "P₁"), dot(p(16, 4), "P₂")],
        ),
      ),
      step(
        "거리의 제곱을 계산합니다",
        R`L_n^2=9\cdot16^n+4^n`,
        "공통의 큰 인자 16ⁿ으로 나누면 작은 항 (1/4)ⁿ만 남습니다.",
        F(
          [0, 8, 15, 16.2],
          [line(p(0, 16), p(8, 16), C.green, { dashed: true })],
          Array.from({ length: 4 }, (_, i) =>
            dot(p(i + 1, ratio(i + 1)), String(i + 1)),
          ),
        ),
      ),
      step(
        "작은 항을 0으로 보냅니다",
        R`\frac{L_{n+1}^2}{L_n^2}=\frac{144+4(1/4)^n}{9+(1/4)^n}\to16`,
        "주황 점들은 수열 값입니다. 16 아래에서 점점 가까워집니다.",
        F(
          [0, 8, 15, 16.2],
          [line(p(0, 16), p(8, 16), C.green, { dashed: true })],
          Array.from({ length: 8 }, (_, i) =>
            dot(p(i + 1, ratio(i + 1)), String(i + 1)),
          ),
        ),
      ),
    ],
    [check("극한 근사", ratio(15), 16, 1e-7)],
  );
}
{
  const h1 = (x) => -8 * x ** 3 + 12 * x * x - 11 * x,
    h2 = (x) => 8 * x ** 3 - 12 * x * x + 13 * x - 8;
  add(
    "2017-b-30",
    "역함수 방정식을 두 k의 범위로 바꿉니다",
    "0≤x≤1에서 해가 존재하는 k의 전체 범위를 구합니다.",
    "65",
    [
      step(
        "도함수 식을 인수분해합니다",
        R`(g(x)-2x)(g(x)+2x-2)=0`,
        "f′를 대입해 정리하면 역함수의 값이 두 직선 중 하나와 만나는 조건입니다.",
        F(
          [-0.2, 1.2, -0.3, 2.3],
          [line(p(), p(1, 2)), line(p(0, 2), p(1, 0), C.green)],
        ),
      ),
      step(
        "역함수 관계로 원함수에 다시 넣습니다",
        R`g(x)=2x\Rightarrow k=-8x^3+12x^2-11x`,
        "f(g(x))=x를 사용하면 미지수 k가 x의 다항식으로 나타납니다. 첫 함수는 [0,1]에서 감소합니다.",
        F(
          [-0.2, 1.2, -9, 2],
          [curve(h1, 0, 1)],
          [dot(p(0, h1(0)), "0"), dot(p(1, h1(1)), "−7")],
        ),
      ),
      step(
        "두 번째 가지의 k 범위를 합칩니다",
        R`g(x)=2-2x\Rightarrow k=8x^3-12x^2+13x-8`,
        "두 번째 함수는 [0,1]에서 증가하며 범위가 [−8,1]입니다. 첫 범위 [−7,0]을 포함합니다.",
        F(
          [-0.2, 1.2, -9, 2],
          [curve(h1, 0, 1), curve(h2, 0, 1, C.green)],
          [dot(p(0, -8), "m=−8"), dot(p(1, 1), "M=1")],
        ),
      ),
      step(
        "두 끝값의 제곱을 더합니다",
        R`k\in[-8,1],\quad m^2+M^2=64+1=65`,
        "두 끝값 모두 닫힌 구간의 x=0 또는 1에서 실제로 얻어집니다.",
        F(
          [-9, 2, -1, 2],
          [line(p(-8, 0.5), p(1, 0.5), C.green)],
          [dot(p(-8, 0.5), "−8"), dot(p(1, 0.5), "1")],
          [],
          [met("정답", 65)],
        ),
      ),
    ],
    [
      check("최소 k", h2(0), -8),
      check("최대 k", h2(1), 1),
      check("제곱합", h2(0) ** 2 + h2(1) ** 2, 65),
    ],
  );
}

// 2018학년도 가형
ratioLimit(
  "2018-a-2",
  "로그와 지수의 접선 기울기를 비교합니다",
  (x) => Math.log1p(5 * x),
  (x) => Math.expm1(2 * x),
  R`\ln(1+5x),\quad e^{2x}-1`,
  R`\lim_{x\to0}\frac{\ln(1+5x)}{e^{2x}-1}`,
  2.5,
  [-0.15, 0.2, -1.5, 1],
);
{
  const f = (x) => 1 + 3 ** (1 - x);
  add(
    "2018-a-5",
    "감소함수의 최댓값은 왼쪽 끝입니다",
    "1≤x≤3에서 1+(1/3)^(x−1)의 최댓값을 찾습니다.",
    "2",
    [
      step(
        "밑이 1보다 작은 지수함수를 봅니다",
        R`y=\left(\frac13\right)^x`,
        "x가 커질수록 함수값이 작아집니다.",
        F([-0.3, 3.4, -0.2, 3.5], [curve((x) => 3 ** -x, 0, 3)]),
      ),
      step(
        "오른쪽으로 1, 위로 1 옮깁니다",
        R`f(x)=1+\left(\frac13\right)^{x-1}`,
        "평행이동 후에도 감소하는 성질은 유지됩니다. 두 끝점 사이의 닫힌 구간만 남깁니다.",
        F(
          [-0.3, 3.4, -0.2, 3.5],
          [curve(f, 1, 3)],
          [dot(p(1, f(1)), "x=1"), dot(p(3, f(3)), "x=3")],
        ),
      ),
      step(
        "포함된 왼쪽 끝점의 값을 읽습니다",
        R`\max_{[1,3]}f=f(1)=1+1=2`,
        "닫힌 구간이므로 왼쪽 끝 x=1도 후보에 포함됩니다.",
        F(
          [-0.3, 3.4, -0.2, 3.5],
          [curve(f, 1, 3), line(p(0, 2), p(3.2, 2), C.green, { dashed: true })],
          [dot(p(1, 2), "최댓값 2")],
        ),
      ),
    ],
    [check("왼쪽 끝값", f(1), 2)],
  );
}
{
  const roots = [pi / 2, (7 * pi) / 6, (11 * pi) / 6];
  add(
    "2018-a-7",
    "삼각방정식을 사인의 두 높이로 바꿉니다",
    "0≤x<2π에서 cos²x=sin²x−sin x의 해를 구합니다.",
    "7π/2",
    [
      step(
        "두 그래프의 교점을 표시합니다",
        R`\cos^2x=\sin^2x-\sin x`,
        "교점의 가로좌표가 방정식의 해입니다.",
        F(
          [-0.3, 6.6, -1.4, 2.4],
          [
            curve((x) => Math.cos(x) ** 2, 0, 2 * pi),
            curve((x) => Math.sin(x) ** 2 - Math.sin(x), 0, 2 * pi, C.green),
          ],
        ),
      ),
      step(
        "사인값의 두 높이로 바꿉니다",
        R`1-\sin^2x=\sin^2x-\sin x\Rightarrow(2\sin x+1)(\sin x-1)=0`,
        "사인값은 1 또는 −1/2입니다. 곡선과 수평선의 교점을 선택합니다.",
        F(
          [-0.3, 6.6, -1.4, 1.4],
          [
            curve(Math.sin, 0, 2 * pi),
            line(p(0, -0.5), p(2 * pi, -0.5), C.green),
          ],
          roots.map((x) => dot(p(x, Math.sin(x)))),
        ),
      ),
      step(
        "세 해의 합을 계산합니다",
        R`\frac\pi2+\frac{7\pi}6+\frac{11\pi}6=\frac{7\pi}2`,
        "해는 주어진 한 주기 안에서 세 개이며 합은 7π/2입니다.",
        F(
          [-0.3, 6.6, -1.4, 1.4],
          [curve(Math.sin, 0, 2 * pi)],
          roots.map((x, i) =>
            dot(p(x, Math.sin(x)), ["π/2", "7π/6", "11π/6"][i]),
          ),
        ),
      ),
    ],
    [
      check(
        "근 대입",
        roots.reduce(
          (a, x) =>
            a + Math.abs(Math.cos(x) ** 2 - Math.sin(x) ** 2 + Math.sin(x)),
          0,
        ),
        0,
      ),
    ],
  );
}
{
  add(
    "2018-a-9",
    "한 점의 값과 기울기를 함께 변환합니다",
    "극한에서 f(2)=3, f′(2)=5를 읽고 g=f·e^(2−x)를 미분합니다.",
    "2",
    [
      step(
        "유한한 극한에서 점의 높이를 정합니다",
        R`\lim_{x\to2}\frac{f(x)-3}{x-2}=5\Rightarrow f(2)=3`,
        "f가 미분가능하므로 연속입니다. 분모가 0으로 갈 때 분자도 0으로 가야 합니다.",
        F([1.2, 2.8, -1, 7], [], [dot(p(2, 3), "f(2)=3")]),
      ),
      step(
        "주어진 극한은 접선 기울기입니다",
        R`f'(2)=5`,
        "파란 선은 f 전체의 그래프가 아니라 (2,3)에서 확정되는 접선입니다.",
        F(
          [1.2, 2.8, -1, 7],
          [curve((x) => 3 + 5 * (x - 2), 1.2, 2.8)],
          [dot(p(2, 3), "접선 기울기 5")],
        ),
      ),
      step(
        "곱의 미분으로 기울기를 바꿉니다",
        R`g'(2)=e^0\{f'(2)-f(2)\}=5-3=2`,
        "e^(2−x)를 곱하면 이 점의 높이는 그대로지만 기울기는 3만큼 감소합니다. 초록 선은 g의 접선입니다.",
        F(
          [1.2, 2.8, -1, 7],
          [
            curve((x) => 3 + 5 * (x - 2), 1.2, 2.8, C.muted),
            curve((x) => 3 + 2 * (x - 2), 1.2, 2.8, C.green),
          ],
          [dot(p(2, 3), "기울기 2")],
        ),
      ),
    ],
    [check("곱의 미분", 5 - 3, 2)],
  );
}
{
  add(
    "2018-a-11",
    "역함수 기울기와 곱의 미분을 연결합니다",
    "f(1)=2, f′(1)=3이고 h(x)=xg(x)입니다.",
    "5/3",
    [
      step(
        "원함수에서 확정되는 접선을 그립니다",
        R`f(1)=2,\quad f'(1)=3`,
        "함수 전체는 미정이므로 점과 그 점에서의 접선만 나타냅니다.",
        frame({
          range: [-0.3, 3.4, -0.3, 3.4],
          equalAspect: true,
          lines: [
            curve((x) => 2 + 3 * (x - 1), 0.3, 1.45),
            line(p(), p(3, 3), C.muted, { dashed: true }),
          ],
          dots: [dot(p(1, 2), "(1,2)")],
        }),
      ),
      step(
        "점과 접선을 대각선에 대해 반사합니다",
        R`g(2)=1,\quad g'(2)=\frac13`,
        "역함수에서는 가로·세로가 교환되어 기울기가 역수가 됩니다.",
        frame({
          range: [-0.3, 3.4, -0.3, 3.4],
          equalAspect: true,
          lines: [
            curve((x) => 2 + 3 * (x - 1), 0.3, 1.45, C.muted),
            curve((x) => 1 + (x - 2) / 3, 0, 3.2, C.green),
            line(p(), p(3, 3), C.muted, { dashed: true }),
          ],
          dots: [dot(p(2, 1), "(2,1)")],
        }),
      ),
      step(
        "xg(x)의 기울기는 두 항의 합입니다",
        R`h'(2)=g(2)+2g'(2)=1+\frac23=\frac53`,
        "h(2)=2이고 그 점의 접선 기울기는 5/3입니다. 주황 선은 h의 국소 접선입니다.",
        F(
          [-0.3, 3.4, -0.3, 4],
          [curve((x) => 2 + (5 / 3) * (x - 2), 0.8, 3.2, C.orange)],
          [dot(p(2, 2), "h(2)=2")],
          [],
          [met("h′(2)", "5/3")],
        ),
      ),
    ],
    [check("곱의 미분", 1 + 2 / 3, 5 / 3)],
  );
}
{
  const a = (e * e + 1) / 2,
    f = (x) => Math.exp(2 * x),
    g = (x) => a - 2 * x;
  let lo = 0,
    hi = 1;
  for (let i = 0; i < 50; i++) {
    let m = (lo + hi) / 2;
    if (f(m) < g(m)) lo = m;
    else hi = m;
  }
  const c = (lo + hi) / 2;
  const between = (u, v) =>
    surface(
      [...curve(f, u, v).points, ...curve(g, u, v).points.reverse()],
      u === 0 ? C.blue : C.orange,
      0.24,
    );
  add(
    "2018-a-12",
    "같은 두 넓이를 차이 함수의 적분으로 바꿉니다",
    "e^(2x)와 직선 −2x+a 사이 양쪽 넓이가 같습니다.",
    "(e²+1)/2",
    [
      step(
        "두 그래프 사이의 영역을 나눕니다",
        R`f(x)=e^{2x},\quad g(x)=-2x+a`,
        "두 함수는 [0,1]에서 한 번 만납니다. 교점 왼쪽과 오른쪽의 높이 순서가 반대입니다.",
        F(
          [-0.2, 1.2, -0.5, 8.5],
          [curve(f, 0, 1), curve(g, 0, 1, C.green)],
          [dot(p(c, f(c)), "교점")],
          [between(0, c), between(c, 1)],
        ),
      ),
      step(
        "양변에서 직선 높이를 뺍니다",
        R`f(x)-g(x)=e^{2x}+2x-a`,
        "같은 x에서 두 높이를 빼면 두 영역이 x축 아래와 위의 영역으로 옮겨집니다.",
        F(
          [-0.2, 1.2, -4, 6],
          [curve((x) => f(x) - g(x), 0, 1)],
          [],
          [
            area((x) => f(x) - g(x), 0, c),
            area((x) => f(x) - g(x), c, 1, C.orange),
          ],
        ),
      ),
      step(
        "같은 넓이는 부호 있는 합이 0입니다",
        R`\int_0^1(e^{2x}+2x-a)dx=0`,
        "음의 넓이와 양의 넓이가 상쇄됩니다. 교점의 복잡한 값을 구할 필요가 없습니다.",
        F(
          [-0.2, 1.2, -4, 6],
          [curve((x) => f(x) - g(x), 0, 1)],
          [dot(p(c), "부호 경계")],
          [
            area((x) => f(x) - g(x), 0, c),
            area((x) => f(x) - g(x), c, 1, C.orange),
          ],
        ),
      ),
      step(
        "상수 a만 정리합니다",
        R`\frac{e^2-1}2+1-a=0\Rightarrow a=\frac{e^2+1}2`,
        "정적분을 계산하면 a가 바로 정해집니다.",
        F(
          [-0.2, 1.2, -4, 6],
          [curve((x) => f(x) - g(x), 0, 1)],
          [],
          [
            area((x) => f(x) - g(x), 0, c),
            area((x) => f(x) - g(x), c, 1, C.orange),
          ],
          [met("부호 있는 넓이 합", 0)],
        ),
      ),
    ],
    [
      check(
        "넓이 차",
        integrate((x) => f(x) - g(x), 0, 1, 20000),
        0,
        1e-7,
      ),
    ],
  );
}
{
  const A = p(0, 4),
    B = p(-3),
    D = p(0),
    E = p(0, 1),
    CC = p(2);
  const base = [path([A, B, CC, A]), line(A, D, C.green)];
  add(
    "2018-a-14",
    "두 직각삼각형을 같은 좌표에 놓습니다",
    "AD를 3:1로 나누는 E와 두 빗변 길이에서 각의 차를 구합니다.",
    "2√5/5",
    [
      step(
        "공유하는 수선의 길이를 정합니다",
        R`AD=h,\ ED=h/4,\ DC=d`,
        "AC²−EC²=h²−(h/4)²=20−5이므로 h=4, 이어서 d=2입니다.",
        frame({
          range: [-4, 3, -1, 5],
          equalAspect: true,
          lines: base,
          dots: [
            dot(A, "A"),
            dot(B, "B"),
            dot(CC, "C"),
            dot(D, "D"),
            dot(E, "E"),
          ],
        }),
      ),
      step(
        "두 각의 사인과 코사인을 읽습니다",
        R`\cos\alpha=\frac35,\ \sin\alpha=\frac45,\quad\cos\beta=\frac2{\sqrt5},\ \sin\beta=\frac1{\sqrt5}`,
        "AB=5에서 BD=3이 됩니다. E와 C를 연결하면 β의 직각삼각형도 보입니다.",
        frame({
          range: [-4, 3, -1, 5],
          equalAspect: true,
          lines: [...base, line(E, CC, C.orange)],
          surfaces: [
            surface([B, D, A], C.blue, 0.15),
            surface([D, E, CC], C.orange, 0.22),
          ],
          dots: [dot(E, "E"), dot(B, "α"), dot(CC, "β")],
        }),
      ),
      step(
        "두 각의 차의 코사인을 계산합니다",
        R`\cos(\alpha-\beta)=\frac35\frac2{\sqrt5}+\frac45\frac1{\sqrt5}=\frac{2\sqrt5}5`,
        "두 단위 방향벡터의 내적과 같은 값입니다. 길이 비가 각의 차를 결정합니다.",
        frame({
          range: [-0.2, 1.3, -0.2, 1.2],
          equalAspect: true,
          lines: [
            line(p(), p(0.6, 0.8)),
            line(p(), p(2 / Math.sqrt(5), 1 / Math.sqrt(5)), C.orange),
          ],
          dots: [
            dot(p(0.6, 0.8), "α"),
            dot(p(2 / Math.sqrt(5), 1 / Math.sqrt(5)), "β"),
          ],
        }),
      ),
    ],
    [
      check("길이 조건 AC²−EC²", 20 - 5, 4 ** 2 - 1 ** 2),
      check(
        "내적",
        (0.6 * 2) / Math.sqrt(5) + 0.8 / Math.sqrt(5),
        (2 * Math.sqrt(5)) / 5,
      ),
    ],
  );
}
{
  const f = (x) => Math.log((1 + Math.exp(x)) / 2),
    a = Math.log(17),
    b = Math.log(9),
    c = Math.log(5);
  add(
    "2018-a-15",
    "적분함수를 계산하고 합성을 거꾸로 추적합니다",
    "로지스틱 함수의 적분 f에 대해 f(f(a))=ln5입니다.",
    "ln17",
    [
      step(
        "적분할 식을 로그의 미분으로 바꿉니다",
        R`\frac1{1+e^{-t}}=\frac{e^t}{1+e^t}`,
        "분자에 eᵗ가 나타나므로 ln(1+eᵗ)의 미분입니다.",
        F(
          [-0.3, 3.4, -0.2, 1.3],
          [curve((x) => 1 / (1 + Math.exp(-x)), 0, 3)],
          [],
          [area((x) => 1 / (1 + Math.exp(-x)), 0, b)],
        ),
      ),
      step(
        "적분함수의 그래프와 대각선을 봅니다",
        R`f(x)=\ln\frac{1+e^x}2`,
        "아래끝 0의 값 ln2를 빼야 f(0)=0이 됩니다.",
        F(
          [-0.3, 3.4, -0.2, 3.4],
          [curve(f, 0, 3.3), line(p(), p(3.3, 3.3), C.muted, { dashed: true })],
          [dot(p(b, c), "f(ln9)=ln5")],
        ),
      ),
      step(
        "두 번의 대응을 거꾸로 올립니다",
        R`f(f(a))=\ln5\Rightarrow f(a)=\ln9\Rightarrow a=\ln17`,
        "ln5에서 수평으로 곡선을 만나고 대각선을 이용해 한 번 더 거꾸로 추적합니다.",
        F(
          [-0.3, 3.4, -0.2, 3.4],
          [
            curve(f, 0, 3.3),
            line(p(), p(3.3, 3.3), C.muted, { dashed: true }),
            path([p(0, c), p(b, c), p(b, b), p(a, b), p(a, 0)], C.orange),
          ],
          [dot(p(a, b), "a=ln17"), dot(p(b, c), "ln9")],
        ),
      ),
    ],
    [check("합성 대입", f(f(a)), Math.log(5))],
  );
}
{
  const ts = [0.9, 0.5, 0.15];
  add(
    "2018-a-17",
    "마름모의 보조선으로 작은 삼각형을 분리합니다",
    "한 변 1인 마름모에서 삼각형 CFG의 넓이를 θ⁵로 나눕니다.",
    "1/16",
    ts.map((t, i) => {
      const c = Math.cos(t),
        s = Math.sin(t),
        A = p(),
        B = p(1),
        D = p(c, s),
        CC = p(1 + c, s),
        E = p(1 + c),
        FF = p((1 + c) ** 2 / 2, (s * (1 + c)) / 2),
        G = p(1 + c * c, s * c);
      return step(
        [
          "수선을 내려 F와 G를 정합니다",
          "작은 두 길이를 1−cosθ로 표현합니다",
          "세 개의 작은 인자를 나눠 극한을 계산합니다",
        ][i],
        [
          R`C=(1+\cos\theta,\sin\theta),\quad E=(1+\cos\theta,0)`,
          R`CG=1-\cos\theta,\quad S=\frac14\sin\theta(1-\cos\theta)^2`,
          R`\frac S{\theta^5}=\frac14\frac{\sin\theta}{\theta}\left(\frac{1-\cos\theta}{\theta^2}\right)^2\to\frac1{16}`,
        ][i],
        "EF는 AC에 수직입니다. G가 BC를 나누는 비를 구하면 넓이에 들어가는 길이들이 모두 θ로 표현됩니다.",
        frame({
          range:
            i === 2
              ? [
                  Math.min(CC[0], FF[0], G[0]) - 0.004,
                  CC[0] + 0.004,
                  Math.min(CC[1], FF[1], G[1]) - 0.004,
                  CC[1] + 0.004,
                ]
              : [-0.2, 2.3, -0.2, 1.4],
          equalAspect: true,
          lines: [
            path([A, B, CC, D, A]),
            line(A, CC, C.green),
            line(CC, E, C.muted),
            line(E, FF, C.orange),
          ],
          surfaces: [surface([CC, FF, G], C.red, 0.45)],
          dots: [dot(CC, "C"), dot(FF, "F"), dot(G, "G")],
          metrics: [
            met("θ", t),
            met("S/θ⁵", ((0.25 * s * (1 - c) ** 2) / t ** 5).toFixed(6)),
          ],
        }),
      );
    }),
    [
      check(
        "극한 근사",
        (0.25 * Math.sin(0.001) * (1 - Math.cos(0.001)) ** 2) / 0.001 ** 5,
        1 / 16,
        1e-7,
      ),
    ],
  );
}
{
  const t0 = 1 / (2 * e),
    ta = Math.log(e + 2) + 1 / (e + 2) - 1;
  const scene = (t, z) => {
    const m = z ? 1 / z : (1 - t) / (e - 1);
    return frame({
      range: [0.5, 6.5, -0.5, 2.8],
      lines: [
        curve(Math.log, 1, e),
        curve((x) => Math.log(x) - t, e, 6.2, C.green),
        curve((x) => m * (x - 1), 1, 6.2, C.orange),
        line(p(e, -0.5), p(e, 2.6), C.muted, { dashed: true }),
      ],
      dots: [
        dot(p(1), "(1,0)"),
        dot(p(e, 1), "", C.blue, { open: true }),
        dot(p(e, 1 - t), "f(e)", C.green),
        ...(z ? [dot(p(z, Math.log(z) - t), "접점")] : []),
      ],
      metrics: [met("t", t.toFixed(5)), met("최소 기울기", m.toFixed(5))],
    });
  };
  add(
    "2018-a-21",
    "경계점을 지나는 선에서 접선으로 바뀝니다",
    "로그 함수가 x=e에서 t만큼 내려갈 때 가능한 직선의 최소 기울기를 구합니다.",
    "1/((e−1)(e+1))",
    [
      step(
        "x=e를 기준으로 부등호가 바뀝니다",
        R`x<e:g\le f,\quad x>e:g\ge f`,
        "왼쪽 조건에서 g(1)≤0입니다. 기울기 m인 직선은 오른쪽에서 m≥sup₍ₓ≥e₎(ln x−t)/(x−1)을 만족해야 합니다. 이 하한은 (1,0)을 지나는 직선에서 달성되며, 기울기가 1/(e−1) 이하라 왼쪽의 로그 곡선 아래에도 놓입니다.",
        scene(t0, null),
      ),
      step(
        "작은 t에서는 경계점이 기준입니다",
        R`0<t\le1/e:\ h(t)=\frac{1-t}{e-1},\quad h'(t)=-\frac1{e-1}`,
        "오른쪽 그래프의 시작점 (e,1−t)을 지나는 선이 최소입니다. t=1/e에서 이 선이 오른쪽 그래프의 접선이 됩니다.",
        scene(1 / e, e),
      ),
      step(
        "큰 t에서는 접점이 오른쪽으로 움직입니다",
        R`h=1/z,\quad\ln z+1/z=t+1\Rightarrow h-\ln h=t+1`,
        "경계보다 오른쪽인 z에서 접하는 선을 (1,0)과 연결합니다. 두 조건을 합쳐 h와 t의 관계를 얻습니다.",
        scene(ta, e + 2),
      ),
      step(
        "두 구간의 미분계수를 곱합니다",
        R`h'(a)=\frac{h(a)}{h(a)-1}=-\frac1{e+1},\quad h'(1/(2e))h'(a)=\frac1{(e-1)(e+1)}`,
        "h(a)=1/(e+2)<1/e이므로 a는 접선 구간입니다. 두 지점에 서로 다른 식을 적용합니다.",
        scene(ta, e + 2),
      ),
    ],
    [
      check("접점 직선 통과", (e + 2 - 1) / (e + 2), Math.log(e + 2) - ta),
      check("경계 두 미분계수", 1 / e / (1 / e - 1), -1 / (e - 1)),
    ],
  );
}
derivative(
  "2018-a-23",
  "로그 합성함수의 미분",
  (x) => Math.log1p(x * x),
  (x) => (2 * x) / (1 + x * x),
  1,
  R`f'(1)=\left.\frac{2x}{x^2+1}\right|_{x=1}=1`,
  "1",
  [-0.5, 2.5, -0.4, 2.5],
);
{
  const tent = (x, t) => Math.max(0, 1 - Math.abs(x - t)),
    conv = (t) => integrate((x) => tent(x, t) * Math.cos(pi * x), 5, 13, 4800);
  const scene = (t) =>
    F(
      [3.5, 14.5, -1.3, 1.3],
      [
        curve((x) => Math.cos(pi * x), 4, 14, C.muted, 200),
        curve((x) => tent(x, t), 4, 14, C.blue, 200),
        line(p(5, -1.3), p(5, 1.3), C.green, { dashed: true }),
        line(p(13, -1.3), p(13, 1.3), C.green, { dashed: true }),
      ],
      [],
      [
        area(
          (x) => tent(x, t) * Math.cos(pi * x),
          Math.max(5, t - 1),
          Math.min(13, t + 1),
          C.orange,
        ),
      ],
      [met("삼각형 중심 t", t), met("가중 적분", conv(t).toFixed(6))],
    );
  add(
    "2018-a-30",
    "움직이는 삼각형 창이 적분 경계에 잘립니다",
    "폭 2의 삼각형 함수와 cos(πx)의 곱을 길이 8의 구간에서 적분합니다.",
    "21",
    [
      step(
        "삼각형 창의 지지구간을 확인합니다",
        R`f_t(x)=\max(0,1-|x-t|)`,
        "삼각형이 움직이면 곱의 넓이도 바뀝니다. 먼저 t가 적분 구간 안에 충분히 들어온 경우를 봅니다.",
        scene(9),
      ),
      step(
        "구간 안쪽에서는 한 주기의 합성입니다",
        R`k+1\le t\le k+7:\quad g(t)=\frac4{\pi^2}\cos\pi t`,
        "삼각형 전체가 들어오면 홀수 t에서 극소값 −4/π², 짝수 t에서 극댓값을 얻습니다.",
        scene(7),
      ),
      step(
        "양 끝에서는 삼각형의 절반만 남습니다",
        R`g(k)=g(k+8)=-\frac2{\pi^2}`,
        "k가 홀수이므로 양 끝도 음의 극소입니다. 삼각형 절반만 적분되어 안쪽 극솟값의 절반이 됩니다.",
        scene(5),
      ),
      step(
        "음의 극소 위치 다섯 개를 더합니다",
        R`\alpha_i=k+2(i-1),\quad5k+20=45\Rightarrow k=5`,
        "끝점 두 개와 안쪽 세 개를 모두 셉니다. 그림은 이제 구해진 k=5를 대입한 g의 그래프입니다.",
        F(
          [3.5, 14.5, -0.5, 0.5],
          [curve(conv, 4, 14, C.blue, 240)],
          [5, 7, 9, 11, 13].map((x) => dot(p(x, conv(x)), String(x))),
        ),
      ),
      step(
        "끝점과 내부의 가중치를 다르게 더합니다",
        R`\sum g(\alpha_i)=-\frac{2+4+4+4+2}{\pi^2},\quad k-\pi^2\sum g(\alpha_i)=21`,
        "다섯 극소의 위치 합과 함수값 합은 서로 다른 양입니다. 경계에서 잘리는 두 부분을 반영하면 21입니다.",
        F(
          [3.5, 14.5, -0.5, 0.5],
          [curve(conv, 4, 14, C.blue, 240)],
          [5, 7, 9, 11, 13].map((x) => dot(p(x, conv(x)), String(x))),
          [],
          [met("결과", 21)],
        ),
      ),
    ],
    [
      check("끝점 적분", conv(5), -2 / pi ** 2, 2e-6),
      check("내부 적분", conv(7), -4 / pi ** 2, 2e-6),
      check("극소 위치 합", 5 + 7 + 9 + 11 + 13, 45),
    ],
  );
}

// 2018학년도 나형
{
  const v = (n) => 1 / 5 - 3 / 5 ** (n + 1);
  add(
    "2018-b-3",
    "수열과 극한 높이 사이의 차이가 줄어듭니다",
    "(5ⁿ−3)/5ⁿ⁺¹을 일정한 값과 작은 항으로 나눕니다.",
    "1/5",
    [2, 4, 8].map((n, i) =>
      step(
        [
          "처음 몇 항을 표시합니다",
          "공통 거듭제곱으로 나눕니다",
          "남은 오차가 0으로 갑니다",
        ][i],
        [
          R`a_n=\frac{5^n-3}{5^{n+1}}`,
          R`a_n=\frac15-\frac3{5^{n+1}}`,
          R`\lim a_n=\frac15`,
        ][i],
        "주황 점에서 수평선까지의 거리는 3/5ⁿ⁺¹이며 매번 1/5배가 됩니다.",
        F(
          [0, 9, 0, 0.24],
          [
            line(p(0, 0.2), p(9, 0.2), C.green, { dashed: true }),
            ...Array.from({ length: n }, (_, j) =>
              line(p(j + 1, v(j + 1)), p(j + 1, 0.2), C.muted),
            ),
          ],
          Array.from({ length: n }, (_, j) =>
            dot(p(j + 1, v(j + 1)), String(j + 1)),
          ),
          [],
          [met("마지막 항", v(n).toFixed(7))],
        ),
      ),
    ),
    [check("극한 근사", v(12), 0.2, 1e-8)],
  );
}
{
  const ls = [
    curve((x) => x * (x + 2), -2.7, 0),
    line(p(0, 1), p(1), C.green),
    line(p(1, 3), p(2.4, -1.2)),
  ];
  const ds = [
    dot(p(0), "", C.blue, { open: true }),
    dot(p(0, 1), "f(0)=1"),
    dot(p(1), "", C.green, { open: true }),
    dot(p(1, 2), "f(1)=2"),
    dot(p(1, 3), "", C.blue, { open: true }),
  ];
  add(
    "2018-b-5",
    "닫힌 점을 지나쳐 열린 끝점으로 갑니다",
    "0의 왼쪽과 1의 오른쪽에서 다가가는 높이를 더합니다.",
    "3",
    [
      step(
        "원문에서 지정한 두 방향을 구별합니다",
        R`x\to0^-,\quad x\to1^+`,
        "좌우 극한은 해당 방향의 가지를 따라 읽습니다. 원문의 가지 연결과 표시된 점을 재구성했습니다.",
        F([-3, 3, -1.5, 4], ls, ds),
      ),
      step(
        "각 가지의 끝 높이에 가까이 갑니다",
        R`\lim_{x\to0^-}f(x)=0,\quad\lim_{x\to1^+}f(x)=3`,
        "왼쪽 곡선은 원점으로, 오른쪽 직선은 (1,3)으로 향합니다. 곡선의 모양은 원문 도식의 보간이며 표시된 극한값만 계산에 사용합니다.",
        F([-3, 3, -1.5, 4], ls, [
          ...ds,
          dot(p(-0.2, -0.36), "→0"),
          dot(p(1.2, 2.4), "→3"),
        ]),
      ),
      step(
        "두 극한 높이를 더합니다",
        R`0+3=3`,
        "실제 함수값 1과 2는 이 극한의 합과 구별합니다.",
        F(
          [-3, 3, -1.5, 4],
          ls,
          [...ds, dot(p(-0.02, -0.0396), "→0"), dot(p(1.02, 2.94), "→3")],
          [],
          [met("극한의 합", 3)],
        ),
      ),
    ],
    [check("합", 0 + 3, 3)],
  );
}
{
  const f = (x) => 3 * x * x - 4;
  add(
    "2018-b-9",
    "양과 음의 넓이가 상쇄되는 위끝을 찾습니다",
    "∫₀ᵃ(3x²−4)dx=0을 만족하는 양수 a를 구합니다.",
    "2",
    [0.8, 1.5, 2].map((a, i) =>
      step(
        [
          "먼저 음의 넓이가 쌓입니다",
          "양의 구간이 음의 넓이를 상쇄합니다",
          "누적 넓이가 0이 되는 양수 해를 고릅니다",
        ][i],
        [
          R`f(x)=3x^2-4`,
          R`\int_0^a f(x)dx=a^3-4a`,
          R`a(a-2)(a+2)=0,\quad a>0\Rightarrow a=2`,
        ][i],
        "곡선 아래 부호 있는 넓이를 더합니다. a=0과 −2는 양수 조건을 만족하지 않습니다.",
        F(
          [-0.2, 2.4, -5, 10],
          [
            curve(f, 0, 2.3),
            line(p(a, -4.5), p(a, 9), C.muted, { dashed: true }),
          ],
          [dot(p(a, f(a)), "a")],
          [
            area(f, 0, Math.min(a, 2 / Math.sqrt(3)), C.red),
            ...(a > 2 / Math.sqrt(3)
              ? [area(f, 2 / Math.sqrt(3), a, C.blue)]
              : []),
          ],
          [met("a", a), met("누적 적분", a ** 3 - 4 * a)],
        ),
      ),
    ),
    [check("a=2 적분", integrate(f, 0, 2, 20000), 0, 1e-7)],
  );
}
{
  const f = (x) => (x - 1) * (x - 2) * (x + 2);
  add(
    "2018-b-18",
    "극한값으로 단순근의 기울기를 정합니다",
    "최고차항 계수 1, f(1)=0인 삼차함수를 결정합니다.",
    "10",
    [
      step(
        "x=2도 근이어야 합니다",
        R`\lim_{x\to2}\frac{f(x)}{(x-2)\{f'(x)\}^2}=\frac14\Rightarrow f(2)=0`,
        "분모가 0으로 가므로 f(2)=0입니다. 중근이라면 분모가 더 높은 차수로 0에 가까워져 유한한 극한을 만들 수 없습니다.",
        F([-0.5, 3.5, -5, 13], [], [dot(p(1), "근 1"), dot(p(2), "근 2")]),
      ),
      step(
        "분자에서 한 번의 x−2를 약분합니다",
        R`\frac1{f'(2)}=\frac14\Rightarrow f'(2)=4`,
        "x=2는 단순근이므로 극한은 미분계수의 역수입니다.",
        F(
          [-0.5, 3.5, -5, 13],
          [line(p(1, -4), p(3, 4), C.orange)],
          [dot(p(2), "접선 기울기 4")],
        ),
      ),
      step(
        "나머지 한 근을 결정합니다",
        R`f(x)=(x-1)(x-2)(x-b),\quad f'(2)=2-b=4\Rightarrow b=-2`,
        "근 세 개와 최고차항 계수로 함수가 완전히 정해집니다.",
        F(
          [-2.5, 3.5, -7, 13],
          [curve(f, -2.3, 3.1)],
          [dot(p(-2), "−2"), dot(p(1), "1"), dot(p(2), "2")],
        ),
      ),
      step(
        "정해진 함수에서 x=3의 높이를 읽습니다",
        R`f(3)=(3-1)(3-2)(3+2)=10`,
        "극한 조건으로 얻은 함수를 대입해 끝값을 계산합니다.",
        F(
          [-2.5, 3.5, -7, 13],
          [curve(f, -2.3, 3.1)],
          [dot(p(3, 10), "f(3)=10")],
        ),
      ),
    ],
    [
      check("함숫값", f(3), 10),
      check("미분계수", (f(2 + 1e-5) - f(2 - 1e-5)) / 2e-5, 4),
    ],
  );
}
{
  const first = (11 * Math.sqrt(3) - 4 * pi) / 64,
    ratio = 3 / 16;
  function fractal(level) {
    let A = p(0, Math.sqrt(3) / 2),
      B = p(-0.5),
      CC = p(0.5);
    const lines = [],
      surfaces = [];
    for (let n = 0; n <= level; n++) {
      const D = p((A[0] + B[0]) / 2, (A[1] + B[1]) / 2),
        r = Math.hypot(D[0] - CC[0], D[1] - CC[1]),
        L = Math.hypot(B[0] - CC[0], B[1] - CC[1]),
        B2 = p(
          CC[0] + ((B[0] - CC[0]) * r) / L,
          CC[1] + ((B[1] - CC[1]) * r) / L,
        ),
        v = p(D[0] - CC[0], D[1] - CC[1]),
        q = ((B2[0] - CC[0]) * v[0] + (B2[1] - CC[1]) * v[1]) / (r * r),
        A2 = p(CC[0] + q * v[0], CC[1] + q * v[1]),
        C2 = p((CC[0] + B2[0]) / 2, (CC[1] + B2[1]) / 2);
      let t1 = Math.atan2(D[1] - CC[1], D[0] - CC[0]),
        t2 = Math.atan2(B2[1] - CC[1], B2[0] - CC[0]);
      while (t2 - t1 > pi) t2 -= 2 * pi;
      while (t2 - t1 < -pi) t2 += 2 * pi;
      const arc = curve(
        (t) => p(CC[0] + r * Math.cos(t), CC[1] + r * Math.sin(t)),
        t1,
        t2,
        C.orange,
        40,
      );
      lines.push(path([A, B, CC, A]), arc, line(B2, A2, C.green));
      surfaces.push(
        surface([B, D, ...arc.points, B2], C.orange, 0.4),
        surface([CC, A2, C2], C.green, 0.3),
      );
      A = A2;
      B = B2;
      CC = C2;
    }
    return frame({
      range: [-0.7, 0.7, -0.15, 1],
      equalAspect: true,
      lines,
      surfaces,
      metrics: [
        met(
          "누적 넓이",
          ((first * (1 - ratio ** (level + 1))) / (1 - ratio)).toFixed(7),
        ),
      ],
    });
  }
  add(
    "2018-b-19",
    "정삼각형 속 다음 정삼각형의 크기를 읽습니다",
    "부채꼴을 뺀 조각과 작은 삼각형을 반복해서 더합니다.",
    "(11√3−4π)/52",
    [
      step(
        "첫 색칠 영역을 둘로 나눕니다",
        R`a_1=\left(\frac{\sqrt3}8-\frac\pi{16}\right)+\frac{3\sqrt3}{64}=\frac{11\sqrt3-4\pi}{64}`,
        "주황 조각은 직각삼각형에서 30도 부채꼴을 뺀 영역, 초록 조각은 작은 삼각형입니다.",
        fractal(0),
      ),
      step(
        "다음 정삼각형의 한 변을 비교합니다",
        R`\frac{\ell_{n+1}}{\ell_n}=\frac{\sqrt3}4\Rightarrow r=\frac3{16}`,
        "같은 절차가 더 작은 정삼각형에서 반복됩니다. 면적 비는 길이 비의 제곱입니다.",
        fractal(1),
      ),
      step(
        "반복되는 색칠 넓이를 합칩니다",
        R`\frac{a_1}{1-3/16}=\frac{11\sqrt3-4\pi}{52}`,
        "각 단계의 조각을 더한 넓이는 이 등비급수의 합으로 수렴합니다.",
        fractal(4),
      ),
    ],
    [check("급수 합", first / (1 - ratio), (11 * Math.sqrt(3) - 4 * pi) / 52)],
  );
}
{
  const df = (x) => 4 * x * x * (x - 1),
    f = (x) => x ** 4 - (4 / 3) * x ** 3;
  add(
    "2018-b-20",
    "도함수의 중근에서는 증감이 바뀌지 않습니다",
    "f′(0)=0의 양쪽에서 모두 감소하는 사차함수를 조사합니다.",
    "ㄱ, ㄷ",
    [
      step(
        "0은 도함수의 짝수 중복도 근입니다",
        R`f'(x)=4x^2(x-r)`,
        "0의 양쪽에서 도함수가 음수이므로 0에서 부호가 바뀌지 않습니다. 삼차 도함수의 남은 근 r은 양수입니다.",
        F([-1.2, 2.3, -6, 18], [curve(df, -1, 2.1)], [dot(p(0), "중근 0")]),
      ),
      step(
        "x=2의 기울기로 남은 근을 정합니다",
        R`f'(2)=16(2-r)=16\Rightarrow r=1`,
        "(0,2) 안의 유일한 근은 1이고, 여기서 감소에서 증가로 바뀝니다. 극댓값은 없습니다.",
        F(
          [-1.2, 2.3, -6, 18],
          [curve(df, -1, 2.1)],
          [
            dot(p(0), "부호 유지"),
            dot(p(1), "부호 변화"),
            dot(p(2, 16), "f′(2)=16"),
          ],
        ),
      ),
      step(
        "f(0)=0인 경우의 최소 높이를 봅니다",
        R`f(x)=x^4-\frac43x^3,\quad f(1)=-\frac13`,
        "상수를 0으로 정한 경우 함수는 x=1에서 최솟값 −1/3을 갖습니다. ㄱ과 ㄷ이 참입니다.",
        F(
          [-1.2, 2.1, -1, 5],
          [
            curve(f, -1, 2),
            line(p(-1, -1 / 3), p(2, -1 / 3), C.green, { dashed: true }),
          ],
          [dot(p(1, -1 / 3), "최소 −1/3"), dot(p(0), "수평 변곡점")],
        ),
      ),
    ],
    [check("x=2 도함수", df(2), 16), check("최솟값", f(1), -1 / 3)],
  );
}
derivative(
  "2018-b-23",
  "삼차함수의 한 점에서 기울기를 읽습니다",
  (x) => 2 * x ** 3 + x + 1,
  (x) => 6 * x * x + 1,
  1,
  R`f'(1)=6\cdot1^2+1=7`,
  "7",
  [-0.3, 2.1, -1, 20],
);
{
  const g = (x) => (2 * x * x + 1) / (x + 1);
  add(
    "2018-b-25",
    "알려진 극한을 보존하는 인자를 묶습니다",
    "(x+1)f(x)→1을 이용해 (2x²+1)f(x)의 극한을 계산합니다.",
    "30",
    [
      step(
        "알려진 묶음 A(x)를 그대로 둡니다",
        R`A(x)=(x+1)f(x)\to1`,
        "f의 전체 모양은 주어지지 않았으므로 그리지 않습니다. 확정된 극한 높이만 표시합니다.",
        F(
          [0.4, 1.6, 0, 2],
          [line(p(0.4, 1), p(1.6, 1), C.muted, { dashed: true })],
          [dot(p(1, 1), "A의 극한", C.orange, { open: true })],
        ),
      ),
      step(
        "새 식과 알려진 식의 비를 계산합니다",
        R`(2x^2+1)f(x)=\frac{2x^2+1}{x+1}A(x)`,
        "새로 그리는 파란 곡선은 확정된 인자 (2x²+1)/(x+1)입니다. x=1에서 연속입니다.",
        F([0.4, 1.6, 0, 3], [curve(g, 0.4, 1.6)], [dot(p(1, 1.5), "3/2")]),
      ),
      step(
        "인자의 극한과 알려진 극한을 곱합니다",
        R`a=\frac32\cdot1,\quad20a=30`,
        "A(x)의 극한 1과 연속인 인자의 값 3/2를 곱합니다.",
        F(
          [0.4, 1.6, 0, 3],
          [
            curve(g, 0.4, 1.6),
            line(p(0.4, 1.5), p(1.6, 1.5), C.green, { dashed: true }),
          ],
          [dot(p(1, 1.5), "a=3/2")],
          [],
          [met("20a", 30)],
        ),
      ),
    ],
    [check("인자 값", g(1), 1.5), check("묻는 값", 20 * g(1), 30)],
  );
}
{
  const f = (x) => -2 * x * x + 3 * x;
  add(
    "2018-b-26",
    "두 곡선 사이의 높이를 빼서 넓이를 구합니다",
    "포물선 −2x²+3x와 직선 y=x 사이의 영역입니다.",
    "4",
    [
      step(
        "두 교점으로 적분 구간을 정합니다",
        R`-2x^2+3x=x\Rightarrow x=0,1`,
        "구간 [0,1]에서는 포물선이 직선보다 위에 있습니다.",
        F(
          [-0.3, 1.5, -0.4, 1.6],
          [curve(f, -0.2, 1.4), line(p(-0.2, -0.2), p(1.4, 1.4), C.green)],
          [dot(p(0), "0"), dot(p(1, 1), "1")],
          [surface([...curve(f, 0, 1).points, p(1, 1), p(0)], C.blue, 0.25)],
        ),
      ),
      step(
        "양쪽에서 직선 y=x를 뺍니다",
        R`(-2x^2+3x)-x=2x(1-x)`,
        "두 그래프의 세로 간격이 x축 위 높이로 옮겨집니다.",
        F(
          [-0.3, 1.5, -0.4, 1.6],
          [curve((x) => f(x) - x, -0.2, 1.4)],
          [dot(p(0)), dot(p(1))],
          [area((x) => f(x) - x, 0, 1)],
        ),
      ),
      step(
        "차이 함수의 정적분을 계산합니다",
        R`\int_0^1(2x-2x^2)dx=\frac13,\quad p+q=3+1=4`,
        "기약분수의 분모와 분자를 더하는 것이 최종 질문입니다.",
        F(
          [-0.3, 1.5, -0.4, 1.6],
          [curve((x) => f(x) - x, 0, 1)],
          [],
          [area((x) => f(x) - x, 0, 1)],
          [met("넓이", "1/3"), met("p+q", 4)],
        ),
      ),
    ],
    [
      check(
        "넓이",
        integrate((x) => f(x) - x, 0, 1),
        1 / 3,
        1e-7,
      ),
    ],
  );
}
{
  const poly = (x) => (x - 1) ** 2 * (2 * x + 1),
    f = (x) => (x <= 1 ? 0 : poly(x)),
    K = 19 / 12;
  add(
    "2018-b-29",
    "매끈한 접합 경계와 아래에서 받치는 직선",
    "구간별 함수의 미분가능성과 f≥g 조건으로 a와 k를 결정합니다.",
    "32",
    [
      step(
        "값이 이어지는 후보 경계를 찾습니다",
        R`(a-1)^2(2a+1)=0\Rightarrow a=-\frac12\text{ 또는 }1`,
        "왼쪽이 0이므로 오른쪽 다항식도 경계에서 0이어야 합니다.",
        F(
          [-0.8, 2.8, -1, 14],
          [curve(poly, -0.7, 2.6)],
          [dot(p(-0.5), "−1/2"), dot(p(1), "1")],
        ),
      ),
      step(
        "경계의 기울기도 0이어야 합니다",
        R`P'(x)=6x(x-1),\quad P'(-1/2)=9/2,\ P'(1)=0\Rightarrow a=1`,
        "a=−1/2는 꺾이므로 제외됩니다. a=1에서만 0인 왼쪽 가지와 매끈하게 이어집니다.",
        F(
          [-0.8, 2.8, -1, 14],
          [line(p(-0.7), p(1)), curve(poly, 1, 2.6, C.green)],
          [dot(p(1), "기울기 0")],
        ),
      ),
      step(
        "기울기 12인 직선을 아래로 내립니다",
        R`P'(m)=12\Rightarrow6m(m-1)=12\Rightarrow m=2`,
        "k를 작게 하면 g가 위로 올라가 f를 뚫습니다. 최소 k에서는 직선이 곡선에 접합니다.",
        F(
          [0.5, 2.8, -1, 14],
          [
            curve(f, 0.5, 2.6),
            curve((x) => Math.max(0, 12 * (x - 1.35)), 0.5, 2.6, C.orange),
          ],
          [dot(p(2, 5), "접점 후보")],
        ),
      ),
      step(
        "접선의 x절편이 최소 k입니다",
        R`y-5=12(x-2)\Rightarrow y=12(x-19/12)`,
        "직선을 접할 때까지 내리면 k=19/12입니다. f−g=(x−2)²(2x+5)≥0이므로 전체 오른쪽 구간에서도 조건을 만족합니다.",
        F(
          [0.5, 2.8, -1, 14],
          [
            curve(f, 0.5, 2.6),
            curve((x) => Math.max(0, 12 * (x - K)), 0.5, 2.6, C.orange),
          ],
          [dot(p(2, 5), "접점"), dot(p(K), "k=19/12")],
        ),
      ),
      step(
        "서로소 분자·분모와 a를 더합니다",
        R`a+p+q=1+12+19=32`,
        "k의 경계값은 실제로 포함됩니다. 따라서 묻는 합은 32입니다.",
        F(
          [0.5, 2.8, -1, 14],
          [
            curve(f, 0.5, 2.6),
            curve((x) => Math.max(0, 12 * (x - K)), 0.5, 2.6, C.orange),
          ],
          [dot(p(2, 5), "접선")],
          [],
          [met("a", 1), met("k 최소", "19/12"), met("합", 32)],
        ),
      ),
    ],
    [
      check("접점 값", poly(2), 12 * (2 - K)),
      check("접점 기울기", 6 * 2 * (2 - 1), 12),
      check("접합 기울기", 6 * 1 * (1 - 1), 0),
    ],
  );
}
{
  const hump = (x) => {
    const n = Math.floor(x),
      u = x - n;
    return (0.5 * u * (1 - u)) / 2 ** n;
  };
  const scene = (subtract, reflect) => {
    const lines = [],
      surfaces = [];
    for (let n = 0; n < 11; n++) {
      const sign = reflect && n >= 5 && n < 9 ? -1 : 1,
        fun = (x) =>
          (subtract ? 0 : x) + (sign * 0.5 * (x - n) * (1 - x + n)) / 2 ** n;
      lines.push(curve(fun, n, n + 1, sign < 0 ? C.orange : C.blue, 32));
      if (subtract)
        surfaces.push(area(fun, n, n + 1, sign < 0 ? C.orange : C.blue, 24));
    }
    return F(
      subtract ? [-0.2, 11.2, -0.02, 0.15] : [-0.2, 11.2, -0.2, 11.3],
      [
        ...lines,
        ...(!subtract ? [line(p(), p(11, 11), C.green, { dashed: true })] : []),
      ],
      [],
      surfaces,
    );
  };
  add(
    "2018-b-30",
    "대각선을 빼고 특정 구간만 반사합니다",
    "단위 구간마다 절반으로 줄어드는 곡선의 적분을 비교합니다.",
    "9",
    [
      step(
        "직선 y=x를 기준으로 작은 곡선을 봅니다",
        R`f(u)=\frac{3u-u^2}2,\quad g(n+u)=n+u+\frac{u(1-u)}{2^{n+1}}`,
        "모든 정수 경계에서 곡선은 y=x와 만납니다. 그 사이의 작은 봉우리 높이는 구간마다 절반으로 줄어듭니다.",
        scene(false, false),
      ),
      step(
        "기준 직선을 빼면 면적만 남습니다",
        R`g(x)-x=\frac{u(1-u)}{2^{n+1}},\quad u=x-n`,
        "2aₙ−n²는 2∫(h−x)입니다. 큰 삼각형 넓이를 제거하면 작은 봉우리들의 급수로 바뀝니다.",
        scene(true, false),
      ),
      step(
        "5부터 k까지의 봉우리를 아래로 반사합니다",
        R`h-x=\begin{cases}g-x&x<5\text{ 또는 }x\ge k\\-(g-x)&5\le x<k\end{cases}`,
        "h=2x−g인 구간만 y=x에 대해 반사됩니다. 그림에는 계산으로 얻을 k=9의 경계를 표시했습니다.",
        scene(true, true),
      ),
      step(
        "단위 구간의 넓이를 등비급수로 합칩니다",
        R`\int_n^{n+1}(g-x)dx=\frac1{6\cdot2^{n+1}}`,
        "반사된 구간은 원래 양수였던 넓이를 빼고 음수로 넣으므로 원래 합에서 그 넓이의 두 배를 뺍니다.",
        scene(true, true),
      ),
      step(
        "주어진 극한값에서 경계를 결정합니다",
        R`\frac13-\frac1{48}\left(1-2^{-(k-5)}\right)=\frac{241}{768}\Rightarrow2^{-(k-5)}=\frac1{16}\Rightarrow k=9`,
        "수열 전체를 계산할 필요 없이 반사가 끝나는 위치 k만 구하면 됩니다.",
        {
          ...scene(true, true),
          metrics: [met("k", 9), met("극한값", "241/768")],
        },
      ),
    ],
    [
      check("단위 구간 넓이", integrate(hump, 0, 1), 1 / 12, 1e-7),
      check("k=9 극한", 1 / 3 - (1 / 48) * (1 - 2 ** -4), 241 / 768),
    ],
  );
}

fs.mkdirSync(new URL("../../src/data/question-visuals/", import.meta.url), {
  recursive: true,
});
fs.writeFileSync(
  new URL(
    "../../src/data/question-visuals/calculus-early.json",
    import.meta.url,
  ),
  JSON.stringify(entries),
);
console.log(`calculus-early: ${entries.length} authored visuals`);
