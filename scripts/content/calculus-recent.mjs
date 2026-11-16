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
  round,
} from "./helpers.mjs";
const R = String.raw,
  PI = Math.PI,
  E = Math.E;
const catalog = JSON.parse(
  fs.readFileSync(
    new URL("../../src/data/questions.json", import.meta.url),
    "utf8",
  ),
).questions;
const items = [];
const bisect = (f, a, b) => {
  for (let i = 0; i < 80; i++) {
    const m = (a + b) / 2;
    if (f(a) * f(m) <= 0) b = m;
    else a = m;
  }
  return (a + b) / 2;
};
const chk = (label, actual, expected, tolerance = 1e-7) => ({
  label,
  actual,
  expected,
  tolerance,
});
const metric = (label, value) => ({ label, value: String(value) });
const model = (range, lines = [], dots = [], surfaces = [], extra = {}) =>
  frame({ range, lines, dots, surfaces, ...extra });
const S = (title, formula, body, m) =>
  step(title, formula, body, { ...m, description: m.description || body });
function add(id, title, summary, result, steps, checks = []) {
  const q = catalog.find((q) => q.id === id);
  if (!q) throw Error(id);
  for (const c of checks)
    if (
      !Number.isFinite(c.actual) ||
      Math.abs(c.actual - c.expected) > c.tolerance
    )
      throw Error(`${id}: ${c.label}: ${c.actual} != ${c.expected}`);
  items.push({
    id,
    subject: "calculus",
    title,
    summary,
    answer: q.answer,
    result,
    steps,
    checks,
    source: { questionPage: q.questionPage, solutionPage: q.solutionPage },
    verified: true,
  });
}
const dotsN = (fn, n = 12, start = 1, color = C.blue) =>
  Array.from({ length: n }, (_, i) =>
    dot(p(i + start, fn(i + start)), `${i + start}`, color),
  );
const graph = (f, a, b, range, extra = {}) =>
  model(range, [curve(f, a, b)], [], [], extra);

// 2026: official odd-numbered paper, elective calculus questions 23--30.
{
  const f = (x) => Math.tan(6 * x) / (2 * x),
    rr = [-0.2, 0.2, 0, 8];
  add(
    "2026-calculus-23",
    "탄젠트의 작은 각을 같은 비율로 바꾸기",
    "tan(6x)/(2x)의 x→0 극한",
    "3",
    [
      S(
        "양쪽에서 0에 접근",
        R`\lim_{x\to0}\frac{\tan6x}{2x}`,
        "0에서는 분모가 0이다. 좌우의 비율을 각각 그려 수렴할 높이를 살핀다.",
        model(
          rr,
          [curve(f, -0.18, -0.002), curve(f, 0.002, 0.18)],
          [dot(p(0, 3), "제거 가능한 빈점", C.orange, { open: true })],
        ),
      ),
      S(
        "각과 분모를 일치시키기",
        R`u=6x:\quad\frac{\tan6x}{2x}=3\frac{\tan u}{u}`,
        "가로축을 u=6x로 바꾸고 세로축의 3배를 분리한다.",
        model(
          [-1.1, 1.1, 0, 3],
          [
            curve((u) => Math.tan(u) / u, -1, -0.001),
            curve((u) => Math.tan(u) / u, 0.001, 1),
            line(p(-1, 1), p(1, 1), C.green),
          ],
          [dot(p(0, 1), "1", C.green, { open: true })],
        ),
      ),
      S(
        "기본 극한 적용",
        R`3\lim_{u\to0}\frac{\tan u}{u}=3`,
        "tan u/u는 1에 수렴하므로 처음 비율은 3에 수렴한다.",
        model(
          rr,
          [
            curve(f, -0.18, -0.002),
            curve(f, 0.002, 0.18),
            line(p(-0.2, 3), p(0.2, 3), C.green),
          ],
          [dot(p(0, 3), "극한 3", C.green, { open: true })],
        ),
      ),
    ],
    [chk("작은 양수에서의 비율", f(1e-6), 3, 1e-8)],
  );
}
{
  const f = (x) => Math.sqrt(Math.sin(x)) * Math.cos(x),
    rr = [-0.1, 1.7, -0.1, 1.3];
  add(
    "2026-calculus-24",
    "치환할 때 높이와 폭이 함께 바뀌는 넓이",
    "0부터 π/2까지 √(sin x−sin³x)의 정적분",
    "2/3",
    [
      S(
        "실제 적분 영역",
        R`I=\int_0^{\pi/2}\sqrt{\sin x-\sin^3x}\,dx`,
        "주어진 구간에서 피적분함수는 0 이상이다.",
        model(rr, [curve(f, 0, PI / 2)], [], [area(f, 0, PI / 2)]),
      ),
      S(
        "제곱근의 절댓값 확인",
        R`\sqrt{\sin x(1-\sin^2x)}=\sqrt{\sin x}\,|\cos x|`,
        "제곱근을 분리할 때 √(cos²x)는 |cos x|이다.",
        model(
          rr,
          [curve(f, 0, PI / 2), curve(Math.cos, 0, PI / 2, C.orange)],
          [dot(p(PI / 2, 0), "cos x=0")],
        ),
      ),
      S(
        "구간에서 부호 결정",
        R`0\le x\le\pi/2\implies\cos x\ge0`,
        "따라서 절댓값을 벗긴 √sin x cos x를 적분한다.",
        model(
          rr,
          [curve(f, 0, PI / 2)],
          [dot(p(0, 0), "0"), dot(p(PI / 2, 0), "π/2")],
          [area(f, 0, PI / 2, C.green)],
        ),
      ),
      S(
        "곡선 띠의 넓이 보존",
        R`u=\sin x,\quad du=\cos x\,dx,\quad \sqrt{\sin x}\cos x\,dx=\sqrt u\,du`,
        "0.65≤x≤0.75의 실제 곡선 아래 띠를 대응하는 sin(0.65)≤u≤sin(0.75)의 곡선 띠로 옮긴다. 두 정적분은 정확히 같다.",
        model(
          [-0.1, 1.7, -0.1, 1.3],
          [curve(f, 0, PI / 2), curve(Math.sqrt, 0, 1, C.green)],
          [],
          [
            area(f, 0.65, 0.75, C.orange, 96),
            area(Math.sqrt, Math.sin(0.65), Math.sin(0.75), C.green, 96),
          ],
          {
            metrics: [
              metric("원래 경계", "0 → π/2"),
              metric("새 경계", "0 → 1"),
            ],
          },
        ),
      ),
      S(
        "새 좌표에서 적분",
        R`I=\int_0^1\sqrt u\,du=\left[\frac23u^{3/2}\right]_0^1=\frac23`,
        "u축에서 √u 아래 넓이는 2/3이다.",
        model(
          [-0.1, 1.2, -0.1, 1.2],
          [curve(Math.sqrt, 0, 1, C.green)],
          [dot(p(1, 1), "(1,1)")],
          [area(Math.sqrt, 0, 1, C.green)],
          { metrics: [metric("정적분", "2/3")] },
        ),
      ),
    ],
    [
      chk(
        "x=t²로 끝점 특이성을 제거한 수치적분",
        integrate((t) => 2 * t * f(t * t), 0, Math.sqrt(PI / 2), 10000),
        2 / 3,
        1e-8,
      ),
      chk(
        "두 실제 곡선 띠의 정적분",
        integrate(f, 0.65, 0.75, 10000),
        integrate(Math.sqrt, Math.sin(0.65), Math.sin(0.75), 10000),
        1e-10,
      ),
    ],
  );
}
{
  const lo = (n) => Math.sqrt(9 - 5 / (n * n)) + 2,
    hi = (n) => 5 + 1 / n;
  add(
    "2026-calculus-25",
    "미정 수열을 두 경계로 조이기",
    "√(9n²−5)+2n<aₙ<5n+1에서 유리식의 극한",
    "5/2",
    [
      S(
        "각 항이 놓이는 구간",
        R`\sqrt{9n^2-5}+2n<a_n<5n+1`,
        "aₙ 자체를 임의로 고르지 않고 허용되는 세로 구간을 표시한다.",
        model(
          [0, 10, 0, 52],
          Array.from({ length: 9 }, (_, i) =>
            line(
              p(i + 1, (i + 1) * lo(i + 1)),
              p(i + 1, (i + 1) * hi(i + 1)),
              C.orange,
            ),
          ),
          [],
          [],
          { metrics: [metric("주황 선분", "aₙ의 허용 범위")] },
        ),
      ),
      S(
        "n으로 나누어 같은 높이 비교",
        R`\sqrt{9-5/n^2}+2<\frac{a_n}{n}<5+\frac1n\quad\Longrightarrow\quad\frac{a_n}{n}\to5`,
        "위아래 경계가 모두 5로 모이므로 샌드위치 정리가 적용된다.",
        model(
          [0, 22, 3.5, 6.2],
          [
            curve(lo, 1, 20, C.blue),
            curve(hi, 1, 20, C.orange),
            line(p(0, 5), p(22, 5), C.green),
          ],
        ),
      ),
      S(
        "분자와 분모의 차수 맞추기",
        R`\frac{(a_n+2)^2}{na_n+5n^2-2}=\frac{(a_n/n+2/n)^2}{a_n/n+5-2/n^2}\longrightarrow\frac{25}{10}=\frac52`,
        "각 경계에 대응하는 유리식도 같은 값에 접근한다. 미정 수열의 실제 그래프를 꾸며내지 않는다.",
        model(
          [1, 50, 2.3, 6],
          [
            curve(
              (n) => (lo(n) + 2 / n) ** 2 / (lo(n) + 5 - 2 / n ** 2),
              1,
              50,
            ),
            curve(
              (n) => (hi(n) + 2 / n) ** 2 / (hi(n) + 5 - 2 / n ** 2),
              1,
              50,
              C.orange,
            ),
            line(p(1, 2.5), p(50, 2.5), C.green),
          ],
          [],
          [],
          { metrics: [metric("극한", "5/2")] },
        ),
      ),
    ],
    [chk("극한 대입", (5 + 0) ** 2 / (5 + 5), 2.5)],
  );
}
{
  const s = (x) => Math.sqrt(x + x * Math.log(x)),
    A = (x) => (Math.sqrt(3) / 4) * s(x) ** 2,
    rr = [0.8, 2.2, -0.1, 2.3];
  const slices = (n) =>
    Array.from({ length: n }, (_, i) => {
      const x = 1 + i / (n - 1),
        y = s(x);
      return surface(
        [p(x, 0, 0), p(x, y, 0), p(x, y / 2, (Math.sqrt(3) * y) / 2)],
        C.blue,
        0.28,
      );
    });
  add(
    "2026-calculus-26",
    "정삼각형 단면을 쌓아 부피 계산",
    "1≤x≤2, 밑변 √(x+x ln x)의 정삼각형 단면",
    "√3(3+8 ln 2)/16",
    [
      S(
        "밑면에서 단면의 밑변 읽기",
        R`s(x)=\sqrt{x+x\ln x}\quad(1\le x\le2)`,
        "세로 길이 s(x)가 정삼각형의 한 변이 된다.",
        model(
          rr,
          [curve(s, 1, 2), line(p(1.5), p(1.5, s(1.5)), C.orange)],
          [],
          [area(s, 1, 2)],
        ),
      ),
      S(
        "정삼각형의 높이와 넓이",
        R`h(x)=\frac{\sqrt3}{2}s(x),\quad A(x)=\frac{\sqrt3}{4}(x+x\ln x)`,
        "x에 수직인 평면 안에서 실제 정삼각형을 구성한다.",
        model(
          rr,
          [],
          [dot(p(1.5, s(1.5) / 2, (Math.sqrt(3) * s(1.5)) / 2), "높이 √3s/2")],
          slices(3),
          { threeD: true, equalAspect: true },
        ),
      ),
      S(
        "단면을 구간 전체에 쌓기",
        R`V=\int_1^2A(x)\,dx=\frac{\sqrt3}{4}\int_1^2(x+x\ln x)\,dx`,
        "평행한 단면을 쌓은 뒤 넓이 함수의 정적분으로 바꾼다.",
        model(rr, [], [], slices(15), { threeD: true, equalAspect: true }),
      ),
      S(
        "부분적분으로 계산",
        R`\int(x+x\ln x)dx=\frac{x^2}{4}+\frac{x^2}{2}\ln x`,
        "x ln x에는 부분적분을 적용한다.",
        model(
          [0.8, 2.2, 0, 1.8],
          [curve(A, 1, 2, C.green)],
          [],
          [area(A, 1, 2, C.green)],
        ),
      ),
      S(
        "양 끝값의 차",
        R`V=\frac{\sqrt3}{4}\left(\frac34+2\ln2\right)=\frac{\sqrt3}{16}(3+8\ln2)`,
        "단면적 그래프 아래 넓이가 원래 입체의 부피다.",
        model(
          [0.8, 2.2, 0, 1.8],
          [curve(A, 1, 2, C.green)],
          [dot(p(1, A(1)), "x=1"), dot(p(2, A(2)), "x=2")],
          [area(A, 1, 2, C.green)],
          {
            metrics: [
              metric("V", round((Math.sqrt(3) / 16) * (3 + 8 * Math.log(2)))),
            ],
          },
        ),
      ),
    ],
    [
      chk(
        "단면적 수치적분",
        integrate(A, 1, 2, 10000),
        (Math.sqrt(3) / 16) * (3 + 8 * Math.log(2)),
        1e-8,
      ),
    ],
  );
}
{
  const xy = (t) =>
    p(
      Math.exp(4 * t) * (1 + Math.sin(PI * t) ** 2),
      Math.exp(4 * t) * (1 - 3 * Math.cos(PI * t) ** 2),
    );
  const P = xy(0.25),
    m = (3 * PI - 2) / (PI + 6);
  add(
    "2026-calculus-27",
    "매개변수 조건을 선형 결합으로 소거하기",
    "x=e⁴ᵗ(1+sin²πt), y=e⁴ᵗ(1−3cos²πt)와 y=3x−5e의 교점 접선",
    "(3π−2)/(π+6)",
    [
      S(
        "곡선과 조건 직선",
        R`x=e^{4t}(1+\sin^2\pi t),\quad y=e^{4t}(1-3\cos^2\pi t)`,
        "두 좌표를 같은 매개변수 t로 그린 곡선이다.",
        model(
          [0, 9, -6, 8],
          [curve(xy, 0, 0.45), curve((x) => 3 * x - 5 * E, 1, 7, C.orange)],
          [dot(P, "교점")],
        ),
      ),
      S(
        "3x−y로 삼각함수 제거",
        R`3x-y=5e^{4t}=5e\implies t=\frac14`,
        "sin²+cos²=1 덕분에 교점의 매개변수를 바로 결정할 수 있다.",
        model(
          [0, 0.5, 0, 35],
          [
            curve((t) => 5 * Math.exp(4 * t), 0, 0.45),
            line(p(0, 5 * E), p(0.5, 5 * E), C.orange),
          ],
          [dot(p(0.25, 5 * E), "t=1/4")],
        ),
      ),
      S(
        "좌표별 미분 후 비율",
        R`x'(1/4)=e(6+\pi),\quad y'(1/4)=e(3\pi-2)`,
        "접선 벡터의 가로 성분은 양수이므로 dy/dx가 정의된다.",
        model(
          [0, 9, -6, 8],
          [
            curve(xy, 0, 0.45),
            line(P, p(P[0] + 2, P[1] + 2 * m), C.green),
            line(P, p(P[0] + 2, P[1]), C.orange),
            line(p(P[0] + 2, P[1]), p(P[0] + 2, P[1] + 2 * m), C.orange),
          ],
          [dot(P, "(3e/2,−e/2)")],
        ),
      ),
      S(
        "접선 기울기 확정",
        R`\frac{dy}{dx}=\frac{y'(t)}{x'(t)}=\frac{3\pi-2}{\pi+6}`,
        "좌표의 변화율을 나누면 실제 접선의 기울기가 된다.",
        model(
          [0, 9, -6, 8],
          [
            curve(xy, 0, 0.45),
            curve((x) => P[1] + m * (x - P[0]), 0, 9, C.green),
          ],
          [dot(P, "접점")],
          [],
          { metrics: [metric("기울기", round(m))] },
        ),
      ),
    ],
    [
      chk("교점 직선 조건", 3 * P[0] - P[1], 5 * E),
      chk(
        "중심차분 기울기",
        (xy(0.250001)[1] - xy(0.249999)[1]) /
          (xy(0.250001)[0] - xy(0.249999)[0]),
        m,
        1e-8,
      ),
    ],
  );
}
{
  const f = (s) => (s * s) / 2 - s + Math.log1p(s),
    df = (s) => s - 1 + 1 / (1 + s),
    T = (s) => s ** 3 / (s + 1),
    g = (t) => bisect((s) => T(s) - t, 0, 4);
  const rr = [-0.3, 3.5, -5, 5];
  add(
    "2026-calculus-28",
    "접선 절편의 길이를 역함수 적분으로 바꾸기",
    "f(x)=x²/2−x+ln(1+x), 두 y축 교점 사이 거리가 t일 때 접점 x=g(t)",
    "157/12+ln 2",
    [
      S(
        "접선과 수선의 y절편",
        R`y=f(s)+f'(s)(x-s)`,
        "접점의 수평선과 접선이 y축에서 만드는 두 점을 표시한다.",
        model(
          rr,
          [
            curve(f, 0, 3),
            curve((x) => f(2) + df(2) * (x - 2), 0, 3, C.orange),
            line(p(0, f(2)), p(2, f(2)), C.muted),
            line(p(0, f(2) - 2 * df(2)), p(0, f(2)), C.green),
          ],
          [dot(p(2, f(2)), "s=2")],
        ),
      ),
      S(
        "거리와 접점의 관계",
        R`t=s f'(s)=\frac{s^3}{s+1}=:T(s)`,
        "f′(s)>0이므로 거리는 s f′(s)다. 함수 T는 양수 구간에서 증가한다.",
        model(
          [0, 3.5, 0, 8],
          [curve(T, 0, 3, C.green)],
          [dot(p(1, 0.5), "(1,1/2)"), dot(p(3, 27 / 4), "(3,27/4)")],
        ),
      ),
      S(
        "역함수 적분의 구간",
        R`g=T^{-1},\quad T(1)=1/2,\quad T(3)=27/4`,
        "좌표를 서로 바꿔 g의 그래프를 얻는다.",
        model(
          [0, 7.2, 0, 3.5],
          [
            curve((t) => g(t), 0.5, 27 / 4, C.green),
            line(p(0), p(4, 4), C.muted),
          ],
          [dot(p(0.5, 1), "(1/2,1)"), dot(p(27 / 4, 3), "(27/4,3)")],
          [area(g, 0.5, 27 / 4, C.green)],
        ),
      ),
      S(
        "역함수 적분의 부분적분",
        R`\int_{1/2}^{27/4}g(t)dt=[sT(s)]_1^3-\int_1^3T(s)ds`,
        "t=T(s)로 바꾸고 sT′(s)를 부분적분한다.",
        model(
          [0, 3.5, 0, 8],
          [curve(T, 0, 3)],
          [],
          [
            surface([p(0), p(3), p(3, 27 / 4), p(0, 27 / 4)], C.muted, 0.1),
            area(T, 1, 3, C.orange),
          ],
          { metrics: [metric("경계항", "79/4")] },
        ),
      ),
      S(
        "다항식과 로그로 분해",
        R`T(s)=s^2-s+1-\frac1{s+1},\quad\int_1^3T(s)ds=\frac{20}{3}-\ln2`,
        "나눗셈으로 적분 가능한 네 항으로 바꾼다.",
        model(
          [0.8, 3.2, 0, 8],
          [curve(T, 1, 3, C.orange)],
          [],
          [area(T, 1, 3, C.orange)],
          { metrics: [metric("빼는 넓이", "20/3−ln 2")] },
        ),
      ),
      S(
        "경계항에서 넓이 빼기",
        R`\frac{79}{4}-\left(\frac{20}{3}-\ln2\right)=\frac{157}{12}+\ln2`,
        "원래 g의 그래프 아래 넓이와 수치적분 결과도 일치한다.",
        model(
          [0, 7.2, 0, 3.5],
          [curve(g, 0.5, 27 / 4, C.green)],
          [],
          [area(g, 0.5, 27 / 4, C.green)],
          { metrics: [metric("정적분", "157/12+ln 2")] },
        ),
      ),
    ],
    [
      chk(
        "역함수 수치적분",
        integrate(g, 0.5, 27 / 4, 12000),
        157 / 12 + Math.log(2),
        1e-7,
      ),
      chk("접선 절편 거리", 2 * df(2), T(2)),
    ],
  );
}
{
  const b = (n) => 27 / 3 ** (n - 1),
    a = (n) => n / 4;
  add(
    "2026-calculus-29",
    "세 연속항으로 공비를 정하고 망원급수로 제한하기",
    "등차수열 aₙ과 등비수열 bₙ의 연결 조건 및 두 급수의 차",
    "97",
    [
      S(
        "세 항의 등비 조건",
        R`a_n=an,\quad\left(\frac1{2a}-1\right)^2=\left(\frac1a-1\right)\left(\frac1{3a}-1\right)`,
        "연속하는 세 등비항의 가운데 제곱은 양 끝의 곱이다.",
        model(
          [0, 4, -1, 4],
          [],
          [
            dot(p(1, 3), "1/a−1"),
            dot(p(2, 1), "1/(2a)−1"),
            dot(p(3, 1 / 3), "1/(3a)−1"),
          ],
          [],
          { metrics: [metric("해결 결과", "1/a=4")] },
        ),
      ),
      S(
        "첫 수열과 공비 결정",
        R`a=\frac14,\quad(b_{k+1},b_{k+2},b_{k+3})=(3,1,1/3),\quad r=1/3`,
        "a는 0이 아니므로 방정식의 유효한 해는 1/4이다.",
        model(
          [0, 8, 0, 4],
          [
            path(
              Array.from({ length: 7 }, (_, i) => p(i + 1, a(i + 1))),
              C.green,
            ),
          ],
          dotsN(a, 7),
          [],
          { metrics: [metric("aₙ", "n/4"), metric("b의 공비", "1/3")] },
        ),
      ),
      S(
        "급수 차로 첫째항 제한",
        R`\sum\frac1{a_na_{n+1}}=16\sum\left(\frac1n-\frac1{n+1}\right)=16,\quad32<3^{k+2}<92`,
        "소거되는 급수의 합은 16이고, b₁=3^{k+1}이다.",
        model(
          [0, 5, 0, 260],
          [],
          [
            dot(p(1, 27), "k=1: 탈락", C.muted),
            dot(p(2, 81), "k=2: 허용", C.green),
            dot(p(3, 243), "k=3: 상한 초과", C.muted),
          ],
          [
            surface(
              [p(0.5, 32), p(3.5, 32), p(3.5, 92), p(0.5, 92)],
              C.green,
              0.12,
            ),
          ],
        ),
      ),
      S(
        "짝수 번째 항만 다시 묶기",
        R`k=2,\ b_1=27,\quad\sum_{n=1}^\infty b_{2n}=\frac9{1-1/9}=\frac{81}{8}`,
        "짝수 번째 항들은 첫째항 9, 공비 1/9인 등비수열이다.",
        model(
          [0, 6, 0, 10],
          [],
          dotsN((n) => b(2 * n), 5),
          bars(
            Array.from({ length: 5 }, (_, i) => b(2 * (i + 1))),
            C.blue,
            1,
          ),
        ),
      ),
      S(
        "기약분수의 분자·분모",
        R`a_2\sum b_{2n}=\frac12\cdot\frac{81}{8}=\frac{81}{16},\qquad p+q=97`,
        "81과 16은 서로소다.",
        model(
          [0, 6, 0, 6],
          [],
          dotsN(
            (n) =>
              0.5 *
              Array.from({ length: n }, (_, i) => b(2 * (i + 1))).reduce(
                (u, v) => u + v,
                0,
              ),
            5,
            1,
            C.green,
          ),
          [],
          { metrics: [metric("극한", "81/16"), metric("답", "97")] },
        ),
      ),
    ],
    [
      chk("급수 차", 27 / (1 - 1 / 3) - 16, 24.5),
      chk("최종 분수", (a(2) * 9) / (1 - 1 / 9), 81 / 16),
    ],
  );
}
{
  const F = (y) =>
    y < -1
      ? -Math.exp(-y - 1) - 1
      : y > 1
        ? Math.exp(y - 1) + 1
        : (5 * y - y ** 3) / 2;
  const b = bisect((x) => Math.log(x) + 2 * x, 0.1, 1),
    beta = Math.log(b) - 1;
  const fig = (m) =>
    model(
      [-9, 9, -3.3, 3.3],
      [
        curve((y) => p(F(y), y), -3, 3),
        curve((x) => m * (x - 1), -9, 9, C.orange),
      ],
      [dot(p(1, 0), "(1,0)")],
    );
  add(
    "2026-calculus-30",
    "역함수의 세 구간에서 교점 개수의 변화 찾기",
    "증가함수의 역함수 조건과 y=m(x−1)의 교점 수 g(m)",
    "11",
    [
      S(
        "증가 조건으로 제곱근의 부호 선택",
        R`F(y)=f^{-1}(y)=\begin{cases}-e^{-y-1}-1&y<-1\\(5y-y^3)/2&|y|\le1\\e^{y-1}+1&y>1\end{cases}`,
        "역함수도 증가하므로 각 구간의 부호가 정해진다. 경계 ±1에서 값은 ±2로 연결된다.",
        model(
          [-3.3, 3.3, -9, 9],
          [curve(F, -3, -1), curve(F, -1, 1, C.green), curve(F, 1, 3)],
          [dot(p(-1, -2), "(−1,−2)"), dot(p(1, 2), "(1,2)")],
        ),
      ),
      S(
        "좌표 교환과 직선 다발",
        R`(y,F(y))\longmapsto(F(y),y),\qquad y=m(x-1)`,
        "원래 곡선은 역함수의 좌표를 서로 바꾸어 그린다. 모든 직선은 (1,0)을 지난다.",
        fig(-0.35),
      ),
      S(
        "작은 양의 기울기의 세 교점",
        R`0<m<b\implies g(m)=3`,
        "왼쪽 지수 가지에서 두 교점, 나머지 증가 가지에서 한 교점을 갖는다.",
        fig(b * 0.65),
      ),
      S(
        "왼쪽 가지에 접하는 임계값",
        R`F(\beta)-1=\beta F'(\beta)\implies(\beta+1)e^{-(\beta+1)}=-2`,
        "음의 접점에서는 β<−1이다. 기울기를 b=1/F′(β)로 두면 ln b/b=−2가 된다.",
        model(
          [-9, 9, -3.3, 3.3],
          [
            curve((y) => p(F(y), y), -3, 3),
            curve((x) => b * (x - 1), -9, 9, C.orange),
          ],
          [dot(p(F(beta), beta), "중복되는 두 교점"), dot(p(1, 0), "(1,0)")],
          [],
          { metrics: [metric("b", round(b)), metric("ln b/b", "−2")] },
        ),
      ),
      S(
        "접점을 지나면 두 교점 소멸",
        R`g(m)=\begin{cases}1&m\le0\\3&0<m<b\\2&m=b\\1&m>b\end{cases}`,
        "양의 다른 가지에서 생기는 접촉은 교점 개수를 바꾸지 않는다. 불연속은 0과 b뿐이다.",
        fig(b * 1.4),
      ),
      S(
        "점의 값과 오른쪽 극한 구별",
        R`a=0,\quad g(a)=1,\quad g(a+)=3,\quad g(b)=2`,
        "g(0)의 값은 1이고, 0의 오른쪽에서는 3이다. 열린 점과 닫힌 점을 구별한다.",
        model(
          [-0.2, 1, 0, 4],
          [
            line(p(-0.2, 1), p(0, 1)),
            line(p(0, 3), p(b, 3)),
            line(p(b, 1), p(1, 1)),
          ],
          [
            dot(p(0, 1), "g(0)=1"),
            dot(p(0, 3), "3", C.blue, { open: true }),
            dot(p(b, 3), "", C.blue, { open: true }),
            dot(p(b, 1), "", C.blue, { open: true }),
            dot(p(b, 2), "g(b)=2", C.green),
          ],
        ),
      ),
      S(
        "요구한 식에 대입",
        R`1\cdot3+2\left(\frac{\ln b}{b}\right)^2=3+2(-2)^2=11`,
        "접점의 위치를 정확한 초월수 형태로 풀 필요 없이 접선 관계를 사용한다.",
        model(
          [-0.2, 1, 0, 4],
          [],
          [
            dot(p(0, 1), "1"),
            dot(p(0, 3), "3", C.green, { open: true }),
            dot(p(b, 2), "2"),
          ],
          [],
          { metrics: [metric("ln b/b", "−2"), metric("최종값", "11")] },
        ),
      ),
    ],
    [
      chk("임계 기울기 관계", Math.log(b) / b, -2),
      chk("음의 가지 접선 조건", F(beta) - 1, beta * Math.exp(-beta - 1)),
      chk("최종 계산", 3 + 2 * 4, 11),
    ],
  );
}

// 2019, type A: original odd-numbered paper and official solution checked.
{
  const f = (x) => x * x + 5 * x,
    g = (x) => Math.log1p(3 * x),
    q = (x) => f(x) / g(x);
  add(
    "2019-a-2",
    "로그의 입력과 분자의 작은 양을 맞추기",
    "(x²+5x)/ln(1+3x)의 x→0 극한",
    "5/3",
    [
      S(
        "함께 0으로 가는 두 함수",
        R`\lim_{x\to0}\frac{x^2+5x}{\ln(1+3x)}`,
        "분자와 분모가 모두 0으로 가므로 각각의 값만 대입해서는 비율을 알 수 없다.",
        model(
          [-0.2, 0.2, -1.1, 1.1],
          [curve(f, -0.18, 0.18), curve(g, -0.18, 0.18, C.orange)],
          [dot(p(0, 0), "두 함수의 원점")],
          [],
          { metrics: [metric("파랑", "x²+5x"), metric("주황", "ln(1+3x)")] },
        ),
      ),
      S(
        "기본 로그 극한으로 변환",
        R`\frac{x^2+5x}{\ln(1+3x)}=\frac{x+5}{3}\frac{3x}{\ln(1+3x)}`,
        "u=3x로 입력을 바꾸면 u/ln(1+u)는 1로 간다.",
        model(
          [-0.5, 0.5, 0.6, 1.4],
          [
            curve((u) => u / Math.log1p(u), -0.45, -0.001),
            curve((u) => u / Math.log1p(u), 0.001, 0.45),
            line(p(-0.5, 1), p(0.5, 1), C.green),
          ],
          [dot(p(0, 1), "기본 극한 1", C.green, { open: true })],
        ),
      ),
      S(
        "남는 계수의 극한",
        R`\frac53\cdot1=\frac53`,
        "원래 비율의 좌우 그래프는 같은 높이 5/3으로 모인다.",
        model(
          [-0.2, 0.2, 0.8, 2.5],
          [
            curve(q, -0.18, -0.001),
            curve(q, 0.001, 0.18),
            line(p(-0.2, 5 / 3), p(0.2, 5 / 3), C.green),
          ],
          [dot(p(0, 5 / 3), "5/3", C.green, { open: true })],
        ),
      ),
    ],
    [
      chk("우극한 근사", q(1e-8), 5 / 3, 1e-7),
      chk("좌극한 근사", q(-1e-8), 5 / 3, 1e-7),
    ],
  );
}
{
  const exp = (x) => 2 ** x + 2,
    log = (x) => Math.log2(8 * x),
    shift = (x) => Math.log2(8 * (x - 2)),
    inv = (x) => 2 ** (x - 3) + 2;
  add(
    "2019-a-5",
    "옮긴 로그 그래프를 뒤집어 지수함수와 비교하기",
    "y=2ˣ+2와 y=log₂(8x)의 평행이동·역함수 관계",
    "3",
    [
      S(
        "로그 그래프를 오른쪽으로 2",
        R`y=\log_2(8x)\ \longmapsto\ y=\log_2(8(x-2))=3+\log_2(x-2)`,
        "x 대신 x−2를 넣는다. 정의역과 수직 점근선도 함께 오른쪽으로 2만큼 옮겨진다.",
        model(
          [-0.3, 6, -1, 6],
          [
            curve(log, 0.07, 4),
            curve(shift, 2.07, 6, C.orange),
            line(p(2, -1), p(2, 6), C.muted),
          ],
          [dot(p(1, 3), "원래 (1,3)", C.blue), dot(p(3, 3), "이동 후 (3,3)")],
          [],
          { metrics: [metric("새 정의역", "x>2")] },
        ),
      ),
      S(
        "대각선에 대칭시키기",
        R`x=3+\log_2(y-2)\quad\Longrightarrow\quad y=2^{x-3}+2`,
        "x와 y를 교환한다. 로그 그래프의 점 (4,4)뿐 아니라 (2.5,2)도 각각 좌표가 뒤바뀐다.",
        model(
          [0, 6, 0, 6],
          [
            curve(shift, 2.125, 6, C.orange),
            curve(inv, 0, 5, C.green),
            line(p(0), p(6, 6), C.muted),
          ],
          [
            dot(p(2.5, 2), "로그 (2.5,2)", C.orange),
            dot(p(2, 2.5), "역함수 (2,2.5)", C.green),
          ],
        ),
      ),
      S(
        "지수함수의 수평 이동량",
        R`2^{x-m}+2=2^{x-3}+2\quad\Longrightarrow\quad m=3`,
        "원래 지수함수의 (0,3)이 (3,3)으로 옮겨진다. 따라서 오른쪽 이동량은 3이다.",
        model(
          [-1, 6, 1, 7],
          [
            curve(exp, -1, 2, C.blue),
            curve(inv, -1, 5, C.green),
            line(p(0, 3), p(3, 3), C.orange),
          ],
          [dot(p(0, 3), "원래"), dot(p(3, 3), "오른쪽 3")],
        ),
      ),
    ],
    [
      chk("합성하여 입력 회복", shift(inv(2.3)), 2.3),
      chk("수평 이동", exp(1.7), inv(4.7)),
    ],
  );
}
{
  const f = (x) => 1 / (1 + Math.exp(-x)),
    g = (y) => Math.log(y / (1 - y)),
    q = f(-1),
    a = Math.exp(1) / (1 + Math.exp(1)) ** 2,
    m = 1 / a;
  add(
    "2019-a-9",
    "로지스틱 곡선의 접선을 역함수로 뒤집기",
    "f(x)=1/(1+e⁻ˣ), g=f⁻¹일 때 g′(f(−1))",
    "(1+e)²/e",
    [
      S(
        "대응하는 두 좌표",
        R`f(-1)=\frac1{1+e}=:q,\quad g(q)=-1`,
        "원래 그래프의 (−1,q)와 역함수의 (q,−1)는 좌표를 서로 바꾼 점이다.",
        model(
          [-3, 3, -3, 3],
          [
            curve(f, -3, 3),
            curve(g, 0.05, 0.95, C.orange),
            line(p(-3, -3), p(3, 3), C.muted),
          ],
          [dot(p(-1, q), "(−1,q)", C.blue), dot(p(q, -1), "(q,−1)", C.orange)],
        ),
      ),
      S(
        "원래 접선의 변화율",
        R`f'(x)=\frac{e^{-x}}{(1+e^{-x})^2},\quad f'(-1)=\frac e{(1+e)^2}`,
        "접점 근처에서 가로 변화 1에 대응하는 접선의 세로 변화가 f′(−1)이다.",
        model(
          [-3, 1, -0.1, 1.1],
          [
            curve(f, -3, 1),
            curve((x) => q + a * (x + 1), -3, 1, C.green),
            line(p(-1, q), p(0, q), C.orange),
            line(p(0, q), p(0, q + a), C.orange),
          ],
          [dot(p(-1, q), "접점")],
          [],
          { metrics: [metric("원래 기울기", round(a))] },
        ),
      ),
      S(
        "가로·세로 변화량 교환",
        R`g'(f(-1))=\frac1{f'(-1)}=\frac{(1+e)^2}{e}`,
        "대칭 뒤에는 가로 변화 a와 세로 변화 1이 된다. 따라서 역함수 접선의 기울기는 1/a다.",
        model(
          [0, 1, -3, 3],
          [
            curve(g, 0.05, 0.95, C.orange),
            curve((x) => -1 + m * (x - q), 0, 1, C.green),
            line(p(q, -1), p(q + a, -1), C.muted),
            line(p(q + a, -1), p(q + a, 0), C.muted),
          ],
          [dot(p(q, -1), "역함수 접점")],
          [],
          { metrics: [metric("역함수 기울기", round(m))] },
        ),
      ),
    ],
    [chk("역함수 관계", g(q), -1), chk("도함수의 곱", a / (q * (1 - q)), 1)],
  );
}
{
  const D = (t) => 16 * Math.cos(t) ** 2 - 24 * Math.sin(t),
    a = PI / 6,
    b = (5 * PI) / 6;
  add(
    "2019-a-11",
    "실근이 없는 조건을 사인의 높이로 바꾸기",
    "6x²+4cosθ·x+sinθ=0이 실근을 갖지 않는 θ의 구간",
    "4π/3",
    [
      S(
        "판별식의 음수 구간",
        R`D=16\cos^2\theta-24\sin\theta<0`,
        "이차방정식이 서로 다른 허근을 갖는 조건은 판별식이 0보다 작다는 것이다.",
        model(
          [0, 2 * PI, -26, 42],
          [curve(D, 0, 2 * PI), line(p(0), p(2 * PI), C.muted)],
          [
            dot(p(a, 0), "경계", C.orange, { open: true }),
            dot(p(b, 0), "경계", C.orange, { open: true }),
          ],
          [area(D, a, b, C.orange)],
        ),
      ),
      S(
        "사인 하나의 부등식",
        R`2\sin^2\theta+3\sin\theta-2>0\iff(2\sin\theta-1)(\sin\theta+2)>0`,
        "−1≤sinθ≤1이므로 sinθ+2는 항상 양수다. 남는 조건은 sinθ>1/2이다.",
        model(
          [0, 2 * PI, -1.2, 1.2],
          [
            curve(Math.sin, 0, 2 * PI),
            line(p(0, 0.5), p(2 * PI, 0.5), C.orange),
            curve(Math.sin, a, b, C.green),
          ],
          [
            dot(p(a, 0.5), "π/6", C.orange, { open: true }),
            dot(p(b, 0.5), "5π/6", C.orange, { open: true }),
          ],
        ),
      ),
      S(
        "열린 구간의 두 끝값",
        R`\alpha=\frac\pi6,\quad\beta=\frac{5\pi}6,\quad3\alpha+\beta=\frac{4\pi}3`,
        "구간 끝에서는 중근을 가지므로 포함하지 않는다. 두 끝값으로 요구한 선형 결합을 계산한다.",
        model(
          [0, 2 * PI, -0.5, 1.2],
          [line(p(a, 0), p(b, 0), C.green), curve(Math.sin, 0, PI, C.muted)],
          [
            dot(p(a, 0), "α=π/6", C.green, { open: true }),
            dot(p(b, 0), "β=5π/6", C.green, { open: true }),
          ],
          [],
          { metrics: [metric("3α+β", "4π/3")] },
        ),
      ),
    ],
    [
      chk("왼쪽 판별식", D(a), 0),
      chk("오른쪽 판별식", D(b), 0),
      chk("각도 결합", 3 * a + b, (4 * PI) / 3),
    ],
  );
}
{
  const f = (x) => (x - 2) * (x - 4),
    g = (x) => 1.5 * (x - 3),
    prod = (x) => g(x) * (f(x) - 3);
  add(
    "2019-a-14",
    "지수 부등식을 세 근의 부호표로 바꾸기",
    "주어진 포물선 f와 직선 g에서 (1/2)ᶠᵍ≥(1/8)ᵍ",
    "13",
    [
      S(
        "원문 그래프의 교점 읽기",
        R`f(1)=f(5)=3,\quad g(3)=0,\quad f(x)=(x-2)(x-4)`,
        "원문 포물선의 근은 2와 4이고, 직선은 (3,0), (5,3)을 지난다. y=3을 기준으로 f의 높이를 비교한다.",
        model(
          [0, 6, -5, 9],
          [
            curve(f, 0, 6),
            curve(g, 0, 6, C.orange),
            line(p(0, 3), p(6, 3), C.muted),
          ],
          [dot(p(1, 3), "f=3"), dot(p(5, 3), "f=3"), dot(p(3, 0), "g=0")],
        ),
      ),
      S(
        "밑이 1보다 작아 부등호 반전",
        R`(1/8)^{g(x)}=(1/2)^{3g(x)}\quad\Longrightarrow\quad g(x)(f(x)-3)\le0`,
        "밑 1/2의 지수함수는 감소한다. 지수끼리 비교하면 f에서 기준 높이 3을 빼야 한다.",
        model(
          [0, 6, -5, 6],
          [
            curve((x) => f(x) - 3, 0, 6),
            curve(g, 0, 6, C.orange),
            line(p(0), p(6), C.muted),
          ],
          [dot(p(1, 0), "1"), dot(p(3, 0), "3"), dot(p(5, 0), "5")],
        ),
      ),
      S(
        "세 경계를 기준으로 부호 분리",
        R`\frac32(x-1)(x-3)(x-5)\le0\quad\Longrightarrow\quad x\le1\ \text{또는}\ 3\le x\le5`,
        "곱의 부호는 단순근 1, 3, 5에서 바뀐다. 등호가 허용되므로 세 경계를 모두 포함한다.",
        model(
          [0, 6, -25, 25],
          [
            curve(prod, 0, 6),
            line(p(0, 0), p(1, 0), C.green),
            line(p(3, 0), p(5, 0), C.green),
          ],
          [1, 3, 5].map((x) => dot(p(x, 0), String(x), C.green)),
        ),
      ),
      S(
        "자연수만 선택해 합산",
        R`x\in\{1,3,4,5\},\quad1+3+4+5=13`,
        "실수 해 구간에서 자연수 점만 남긴다.",
        model(
          [0, 6, -1, 1],
          [line(p(0), p(6), C.muted)],
          [1, 2, 3, 4, 5, 6].map((x) =>
            dot(p(x), String(x), [1, 3, 4, 5].includes(x) ? C.green : C.muted, {
              open: ![1, 3, 4, 5].includes(x),
            }),
          ),
          [],
          { metrics: [metric("자연수의 합", "13")] },
        ),
      ),
    ],
    [
      chk("포물선의 기준 높이", f(1), 3),
      chk("직선 원문 점", g(5), 3),
      chk(
        "선택한 자연수의 합",
        [1, 2, 3, 4, 5, 6]
          .filter((x) => prod(x) <= 0)
          .reduce((a, b) => a + b, 0),
        13,
      ),
    ],
  );
}
{
  const f = (x) => (1 / x + 2 / x ** 2 - 1) / 3,
    I = (2 * Math.log(2)) / 3 + 0.5;
  add(
    "2019-a-16",
    "서로 역수인 구간의 적분을 같은 I로 만들기",
    "2f(x)+x⁻²f(1/x)=x⁻¹+x⁻², ∫₁/₂²f(x)dx",
    "1/2+(2/3)ln 2",
    [
      S(
        "역수 치환이 바꾸는 경계",
        R`u=1/x,\quad du=-x^{-2}dx,\quad x:\tfrac12\to2\Rightarrow u:2\to\tfrac12`,
        "역수 함수는 양수 구간에서 감소한다. 두 끝점이 서로 바뀌고 미분의 음수가 적분 방향을 뒤집는다.",
        model(
          [0, 2.3, 0, 2.3],
          [curve((x) => 1 / x, 0.5, 2), line(p(0), p(2.3, 2.3), C.muted)],
          [dot(p(0.5, 2), "1/2 ↔ 2"), dot(p(2, 0.5), "2 ↔ 1/2")],
        ),
      ),
      S(
        "두 적분이 같은 값",
        R`\int_{1/2}^2x^{-2}f(1/x)dx=\int_{1/2}^2f(u)du=I`,
        "f를 임의로 가정할 필요 없이 치환식만으로 왼쪽의 두 적분이 2I와 I가 됨을 안다.",
        model(
          [0, 3, -0.2, 1.2],
          [
            line(p(0.5, 0), p(2, 0), C.blue),
            line(p(0.5, 0.8), p(2, 0.8), C.green),
          ],
          [
            dot(p(0.5, 0), "x=1/2"),
            dot(p(2, 0), "x=2"),
            dot(p(0.5, 0.8), "u=1/2"),
            dot(p(2, 0.8), "u=2"),
          ],
          [],
          {
            metrics: [
              metric("같은 적분 구간", "[1/2,2]"),
              metric("왼쪽 적분", "2I+I=3I"),
            ],
          },
        ),
      ),
      S(
        "알려진 함수의 넓이 계산",
        R`3I=\int_{1/2}^2(1/x+1/x^2)dx=\left[\ln x-1/x\right]_{1/2}^{2}=2\ln2+\frac32`,
        "오른쪽은 원시함수가 명확한 두 함수의 합이다.",
        model(
          [0.3, 2.2, 0, 6.5],
          [curve((x) => 1 / x + 1 / x ** 2, 0.5, 2, C.green)],
          [],
          [area((x) => 1 / x + 1 / x ** 2, 0.5, 2, C.green)],
        ),
      ),
      S(
        "3으로 나누고 직접 검산",
        R`I=\frac12+\frac23\ln2,\qquad f(x)=\frac13\left(\frac1x+\frac2{x^2}-1\right)`,
        "원식과 x를 1/x로 바꾼 식을 연립하면 f도 결정된다. 이 곡선 아래 넓이로 결과를 검산한다.",
        model(
          [0.3, 2.2, -0.2, 3.3],
          [curve(f, 0.5, 2)],
          [dot(p(2, 0), "끝점 f(2)=0")],
          [area(f, 0.5, 2)],
          { metrics: [metric("I", round(I))] },
        ),
      ),
    ],
    [
      chk(
        "원식 x=0.7",
        2 * f(0.7) + f(1 / 0.7) / 0.7 ** 2,
        1 / 0.7 + 1 / 0.7 ** 2,
      ),
      chk("구한 f의 적분", integrate(f, 0.5, 2, 20000), I, 1e-8),
    ],
  );
}

{
  const r = (t) => 1 / (1 + Math.sin(t)),
    s = (t) => (t * r(t) ** 2) / 2,
    T = (t) => 0.5 * Math.tan(t) * (1 - Math.cos(t) * r(t));
  const geom = (t, withSector = true, withTriangle = true) => {
    const A = p(),
      B = p(1),
      Ct = p(1, Math.tan(t)),
      D = p(r(t)),
      Et = p(r(t) * Math.cos(t), r(t) * Math.sin(t));
    return model(
      [-0.06, 1.12, -0.06, Math.tan(t) + 0.1],
      [
        path([A, B, Ct, A]),
        line(Ct, D, C.orange),
        line(A, Et, C.green),
        curve((u) => p(r(t) * Math.cos(u), r(t) * Math.sin(u)), 0, t, C.green),
      ],
      [dot(A, "A"), dot(B, "B"), dot(Ct, "C"), dot(D, "D"), dot(Et, "E")],
      [
        ...(withSector
          ? [
              surface(
                [
                  A,
                  ...curve(
                    (u) => p(r(t) * Math.cos(u), r(t) * Math.sin(u)),
                    0,
                    t,
                  ).points,
                ],
                C.green,
                0.25,
              ),
            ]
          : []),
        ...(withTriangle ? [surface([B, Ct, Et], C.orange, 0.25)] : []),
      ],
      {
        equalAspect: true,
        metrics: [metric("θ", round(t)), metric("AD", round(r(t)))],
      },
    );
  };
  add(
    "2019-a-18",
    "각의 이등분선으로 작은 부채꼴과 삼각형 비교",
    "AB=1인 직각삼각형의 부채꼴 S와 삼각형 T, limθ→0⁺ S²/T",
    "1/2",
    [
      S(
        "각의 이등분선이 정하는 반지름",
        R`AC=\sec\theta,\ BC=\tan\theta,\quad AD=\frac{AC}{AC+BC}=\frac1{1+\sin\theta}`,
        "A=(0,0), B=(1,0), C=(1,tanθ)로 둔다. C의 이등분선과 AB의 교점이 D이고 부채꼴의 반지름은 AD다.",
        geom(0.65, false, false),
      ),
      S(
        "두 도형의 실제 넓이",
        R`S=\frac{\theta}{2(1+\sin\theta)^2},\quad T=\frac12\tan\theta\left(1-\frac{\cos\theta}{1+\sin\theta}\right)`,
        "E의 좌표는 (AD cosθ, AD sinθ)다. 삼각형 BCE의 세로 밑변 BC와 가로 높이 1−Eₓ를 곱한다.",
        geom(0.65),
      ),
      S(
        "작은 각에서 차수 구분",
        R`\frac S\theta\to\frac12,\quad\frac T{\theta^2}=\frac12\frac{\tan\theta}{\theta}\frac{(1-\cos\theta)/\theta+\sin\theta/\theta}{1+\sin\theta}\to\frac12`,
        "부채꼴 넓이는 θ와 같은 차수, 삼각형 넓이는 θ²과 같은 차수다. θ를 줄여도 정확한 좌표로 두 도형을 다시 그린다.",
        geom(0.15),
      ),
      S(
        "정규화한 넓이의 극한",
        R`S/\theta\to1/2,\qquad T/\theta^2\to1/2`,
        "같은 그래프에 원래 넓이를 섞지 않고 각각 θ와 θ²으로 나눈 값을 비교한다.",
        model(
          [0, 0.7, 0.1, 0.8],
          [
            curve((t) => s(t) / t, 0.001, 0.65, C.green),
            curve((t) => T(t) / t ** 2, 0.001, 0.65, C.orange),
            line(p(0, 0.5), p(0.7, 0.5), C.muted),
          ],
          [dot(p(0, 0.5), "두 정규화 값 → 1/2", C.green, { open: true })],
          [],
          { metrics: [metric("초록", "S/θ"), metric("주황", "T/θ²")] },
        ),
      ),
      S(
        "분자와 분모의 차수 소거",
        R`\frac{S^2}{T}=\frac{(S/\theta)^2}{T/\theta^2}\longrightarrow\frac{(1/2)^2}{1/2}=\frac12`,
        "θ²을 약분한 뒤 두 유한한 극한을 나눈다.",
        model(
          [0, 0.7, 0, 0.6],
          [
            curve((t) => s(t) ** 2 / T(t), 0.001, 0.65, C.blue),
            line(p(0, 0.5), p(0.7, 0.5), C.green),
          ],
          [dot(p(0, 0.5), "극한 1/2", C.green, { open: true })],
        ),
      ),
    ],
    [
      chk("이등분선의 비", r(0.65) / (1 - r(0.65)), 1 / Math.sin(0.65)),
      chk("작은 각의 넓이비", s(1e-6) ** 2 / T(1e-6), 0.5, 2e-6),
    ],
  );
}
{
  const a = Array.from({ length: 8 }, (_, i) =>
    bisect(
      (x) => Math.tan(x) - x - PI / 2,
      i * PI + 1e-8,
      (i + 0.5) * PI - 1e-8,
    ),
  );
  const delta = a.map((v, i) => v - i * PI),
    d = a.slice(1).map((v, i) => v - a[i]);
  add(
    "2019-a-20",
    "사인 곡선의 접점을 한 주기 안으로 모으기",
    "(−π/2,0)에서 y=sin x에 그은 접선들의 양수 접점 aₙ",
    "ㄱ, ㄴ, ㄷ 모두 참",
    [
      S(
        "외부 점을 지나는 접선",
        R`\sin a_n=\cos a_n(a_n+\pi/2)\quad\Longrightarrow\quad\tan a_n=a_n+\pi/2`,
        "접선의 식에 주어진 외부 점을 넣는다. cos aₙ=0이면 접선이 그 점을 지나지 않으므로 나눌 수 있다.",
        model(
          [-2, 10, -3, 3],
          [
            curve(Math.sin, -PI / 2, 9.5),
            ...a
              .slice(0, 3)
              .map((t) =>
                curve((x) => Math.cos(t) * (x + PI / 2), -PI / 2, t, C.orange),
              ),
          ],
          [
            dot(p(-PI / 2, 0), "외부 점"),
            ...a
              .slice(0, 3)
              .map((t, i) => dot(p(t, Math.sin(t)), `a${i + 1}`, C.green)),
          ],
        ),
      ),
      S(
        "각 주기에서 하나의 접점",
        R`(n-1)\pi<a_n<(n-\tfrac12)\pi,\quad \delta_n=a_n-(n-1)\pi\in(0,\pi/2)`,
        "tan x−x의 도함수 tan²x는 각 양수 반주기에서 양수다. 따라서 각 구간에 해가 정확히 하나씩 있고 δₙ은 접점의 주기 안 위치다.",
        model(
          [0, 10, 0, 12],
          [
            ...Array.from({ length: 3 }, (_, i) =>
              curve(Math.tan, i * PI + 0.001, (i + 0.5) * PI - 0.09, C.blue),
            ),
            curve((x) => x + PI / 2, 0, 10, C.orange),
          ],
          a
            .slice(0, 3)
            .map((t, i) => dot(p(t, t + PI / 2), `a${i + 1}`, C.green)),
        ),
      ),
      S(
        "한 구간에서 증가와 볼록성",
        R`Q(\delta_n)=\tan\delta_n-\delta_n=(n-\tfrac12)\pi,\quad Q'>0,\quad Q''=2\tan\delta\sec^2\delta>0`,
        "증가하고 엄밀히 볼록한 Q의 역함수는 증가하고 엄밀히 오목하다. 등간격 높이에서 읽은 δₙ은 증가하지만 증가량은 작아진다.",
        model(
          [0, PI / 2, 0, 26],
          [curve((t) => Math.tan(t) - t, 0.001, 1.535, C.blue)],
          delta.map((v, i) => dot(p(v, (i + 0.5) * PI), `δ${i + 1}`, C.orange)),
          [],
          { metrics: [metric("δₙ의 성질", "증가 · 증가량 감소")] },
        ),
      ),
      S(
        "접점 간격은 π보다 큼",
        R`a_{n+1}-a_n=\pi+(\delta_{n+1}-\delta_n)>\pi\quad\Longrightarrow\quad \tan a_{n+2}-\tan a_n>2\pi`,
        "접점의 간격은 정확한 주기 π보다 조금 크다. ㄱ의 등식을 이용하면 ㄴ의 탄젠트 차이가 두 접점 간격의 합으로 바뀐다.",
        model(
          [0.5, 7.5, 3, 4],
          [
            line(p(0.5, PI), p(7.5, PI), C.muted),
            path(
              d.map((v, i) => p(i + 1, v)),
              C.green,
            ),
          ],
          d.map((v, i) => dot(p(i + 1, v), `d${i + 1}`, C.green)),
          [],
          { metrics: [metric("dₙ", "aₙ₊₁−aₙ"), metric("기준선", "π")] },
        ),
      ),
      S(
        "간격의 감소로 마지막 부등식",
        R`d_n>d_{n+2}\iff a_{n+1}+a_{n+2}>a_n+a_{n+3}`,
        "δₙ의 증가량이 감소하므로 dₙ도 엄밀히 감소한다. 따라서 ㄱ, ㄴ, ㄷ이 모두 참이다.",
        model(
          [0.5, 8.5, 1, 1.6],
          [
            path(
              delta.map((v, i) => p(i + 1, v)),
              C.blue,
            ),
          ],
          delta.map((v, i) => dot(p(i + 1, v), `δ${i + 1}`)),
          [],
          {
            metrics: [
              metric("판정", "ㄱ · ㄴ · ㄷ 모두 참"),
              metric("모든 n의 근거", "Q⁻¹의 엄밀한 오목성"),
            ],
          },
        ),
      ),
    ],
    [
      ...a
        .slice(0, 4)
        .map((v, i) =>
          chk(`접점 ${i + 1} 방정식`, Math.tan(v), v + PI / 2, 1e-9),
        ),
      chk("관찰한 모든 간격 > π", Number(d.every((v) => v > PI)), 1),
      chk(
        "관찰한 간격의 엄밀한 감소",
        Number(d.slice(1).every((v, i) => v < d[i])),
        1,
      ),
    ],
  );
}
{
  const xs = [-1 / 8, 3 / 4, 5 / 2, 6],
    h = 8 / 9,
    hs = [1, 4 / 3, 8 / 3, 8],
    ans = Math.cbrt(h);
  add(
    "2019-a-21",
    "합성된 도함수를 세제곱 함수의 확대 관계로 바꾸기",
    "2f²(x)f′(x)=f²(2x+1)f′(2x+1), f(−1/8)=1, f(6)=2",
    "∛(8/9)",
    [
      S(
        "곱 형태를 한 함수의 미분으로",
        R`H(x)=f(x)^3\quad\Longrightarrow\quad H'(2x+1)=2H'(x)`,
        "f의 구체적인 그래프를 가정하지 않는다. 주어진 두 값만 세제곱하여 H(−1/8)=1, H(6)=8로 표시한다.",
        model(
          [-1.2, 6.5, 0, 9],
          [],
          [dot(p(-1 / 8, 1), "H(−1/8)=1"), dot(p(6, 8), "H(6)=8")],
        ),
      ),
      S(
        "연쇄법칙으로 적분 관계 얻기",
        R`\frac d{dx}H(2x+1)=4H'(x)\quad\Longrightarrow\quad H(2x+1)=4H(x)+C`,
        "합성함수를 미분할 때 안쪽 도함수 2가 추가된다. 변환 x↦2x+1의 고정점은 −1이다.",
        model(
          [-1.5, 3, -1.5, 6.5],
          [
            curve((x) => 2 * x + 1, -1.25, 2.5),
            line(p(-1.5, -1.5), p(3, 3), C.muted),
          ],
          [dot(p(-1, -1), "고정점 −1")],
          [],
          { metrics: [metric("C", "−3H(−1)")] },
        ),
      ),
      S(
        "고정점 높이를 빼면 네 배",
        R`h=H(-1),\quad H(2x+1)-h=4(H(x)-h)`,
        "입력은 −1/8→3/4→5/2→6으로 세 번 변한다. 고정점에서 잰 높이는 1배→4배→16배→64배다.",
        model(
          [-0.3, 3.3, 0, 68],
          [
            path(
              [1, 4, 16, 64].map((v, i) => p(i, v)),
              C.green,
            ),
          ],
          [1, 4, 16, 64].map((v, i) => dot(p(i, v), `${v}배`, C.green)),
          [],
          {
            metrics: [
              metric("가로축", "변환 횟수"),
              metric("세로축", "H(x)−h의 상대 배수"),
            ],
          },
        ),
      ),
      S(
        "두 알려진 높이로 h 결정",
        R`8-h=64(1-h)\quad\Longrightarrow\quad63h=56\quad\Longrightarrow\quad h=\frac89`,
        "h가 결정되었으므로 네 입력에서의 정확한 H값을 계산할 수 있다. 그 사이 함수 모양은 정하지 않는다.",
        model(
          [-1.2, 6.5, 0, 9],
          [
            line(p(-1.2, h), p(6.5, h), C.muted),
            ...xs.map((x, i) => line(p(x, h), p(x, hs[i]), C.green)),
          ],
          [
            dot(p(-1, h), "h=8/9", C.green),
            ...xs.map((x, i) => dot(p(x, hs[i]), ["1", "4/3", "8/3", "8"][i])),
          ],
        ),
      ),
      S(
        "세제곱에서 원래 함수로",
        R`f(-1)^3=\frac89\quad\Longrightarrow\quad f(-1)=\sqrt[3]{\frac89}=\frac{2\sqrt[3]3}{3}`,
        "실수에서 세제곱 함수는 일대일이므로 실수 세제곱근이 하나로 정해진다.",
        model(
          [0, 1.3, 0, 2],
          [
            curve((x) => x ** 3, 0, 1.25),
            line(p(0, h), p(ans, h), C.orange),
            line(p(ans, 0), p(ans, h), C.orange),
          ],
          [dot(p(ans, h), "(f(−1),8/9)", C.green)],
        ),
      ),
    ],
    [
      chk("3회 확대 관계", 8 - h, 64 * (1 - h)),
      chk("구한 세제곱근", ans ** 3, 8 / 9),
      chk("중간 알려진 H값", 4 * hs[1] - 3 * h, hs[2]),
    ],
  );
}
{
  const c = 1 / Math.sqrt(26),
    s = 5 / Math.sqrt(26);
  add(
    "2019-a-23",
    "탄젠트로 정해지는 두 방향에서 코사인 제곱 읽기",
    "tanθ=5일 때 1/cos²θ",
    "26",
    [
      S(
        "탄젠트가 같은 두 방향",
        R`\tan\theta=5\quad\Longrightarrow\quad\sin\theta=5\cos\theta`,
        "단위원에서 기울기 5인 직선과 만나는 두 점을 모두 표시한다. θ의 사분면을 임의로 고르지 않는다.",
        model(
          [-1.2, 1.2, -1.2, 1.2],
          [circle(0, 0, 1), line(p(-0.24, -1.2), p(0.24, 1.2), C.orange)],
          [dot(p(c, s), "제1사분면"), dot(p(-c, -s), "제3사분면")],
          [],
          { equalAspect: true },
        ),
      ),
      S(
        "단위원 항등식에 대입",
        R`\cos^2\theta+25\cos^2\theta=1\quad\Longrightarrow\quad\cos^2\theta=\frac1{26}`,
        "두 교점의 x좌표는 부호만 다르므로 제곱하면 같은 1/26이다.",
        model(
          [-1.2, 1.2, -1.2, 1.2],
          [
            circle(0, 0, 1),
            line(p(c, 0), p(c, s), C.green),
            line(p(-c, 0), p(-c, -s), C.green),
          ],
          [dot(p(c, 0), "1/√26"), dot(p(-c, 0), "−1/√26")],
          [],
          { equalAspect: true },
        ),
      ),
      S(
        "역수 계산",
        R`\frac1{\cos^2\theta}=1+\tan^2\theta=1+25=26`,
        "양쪽 사분면 모두 같은 답을 준다. 항등식 sec²θ=1+tan²θ로도 바로 확인된다.",
        model([-0.5, 2.5, 0, 28], [], [], bars([1, 25, 26], C.green), {
          metrics: [metric("세 막대", "1, tan²θ, sec²θ"), metric("정답", "26")],
        }),
      ),
    ],
    [
      chk("단위원 조건", c * c + s * s, 1),
      chk("탄젠트 조건", s / c, 5),
      chk("코사인 제곱의 역수", 1 / c ** 2, 26),
    ],
  );
}
{
  const f = (x) => -x * Math.cos(x),
    a = PI / 2;
  add(
    "2019-a-25",
    "삼각함수 대칭 뒤 부분적분으로 경계항 없애기",
    "∫₀^π x cos(π−x) dx",
    "2",
    [
      S(
        "대칭으로 코사인 부호 바꾸기",
        R`\cos(\pi-x)=-\cos x\quad\Longrightarrow\quad I=-\int_0^\pi x\cos x\,dx`,
        "피적분함수는 0부터 π/2까지 음수이고 이후 양수다. 음의 넓이와 양의 넓이를 따로 표시한다.",
        model(
          [-0.1, 3.4, -1, 3.4],
          [curve(f, 0, PI)],
          [dot(p(a, 0), "π/2")],
          [area(f, 0, a, C.orange), area(f, a, PI, C.green)],
        ),
      ),
      S(
        "부분적분의 두 항",
        R`I=-[x\sin x]_0^\pi+\int_0^\pi\sin x\,dx`,
        "x를 미분하고 cos x를 적분하면 경계항 x sin x와 사인 적분이 남는다. 양 끝의 사인이 0이므로 경계항도 모두 0이다.",
        model(
          [-0.1, 3.4, -0.1, 2],
          [curve((x) => x * Math.sin(x), 0, PI, C.orange)],
          [dot(p(0, 0), "0·sin0=0"), dot(p(PI, 0), "π·sinπ=0")],
        ),
      ),
      S(
        "남은 사인 곡선의 넓이",
        R`I=[-\cos x]_0^\pi=1-(-1)=2`,
        "변환 후에는 [0,π]에서 사인 그래프 아래의 양의 넓이만 남는다.",
        model(
          [-0.1, 3.4, -0.1, 1.2],
          [curve(Math.sin, 0, PI, C.green)],
          [],
          [area(Math.sin, 0, PI, C.green)],
          { metrics: [metric("정적분", "2")] },
        ),
      ),
    ],
    [
      chk(
        "원래 적분 수치값",
        integrate((x) => x * Math.cos(PI - x), 0, PI, 20000),
        2,
        1e-8,
      ),
      chk("경계항", PI * Math.sin(PI), 0),
    ],
  );
}
{
  const f = (x) => 6 * PI * x ** 3 - 9 * PI * x * x + PI / 6,
    df = (x) => 18 * PI * x * (x - 1),
    g = (x) => 1 / (2 + Math.sin(f(x))),
    dg = (x) => (-Math.cos(f(x)) * df(x)) / (2 + Math.sin(f(x))) ** 2;
  const roots = [-0.5, -1.5, -2.5].map((z) =>
    bisect((x) => f(x) / PI - z, 0, 1),
  );
  add(
    "2019-a-30",
    "극값의 순서로 숨은 삼차함수의 최솟값 결정",
    "g=1/(2+sin f), 첫 극값 0과 두 번째·다섯 번째 극값의 역수 차",
    "27",
    [
      S(
        "첫 극값에서 함수와 도함수 결정",
        R`g(0)=\frac25,\ 0<f(0)<\frac\pi2\Rightarrow f(0)=\frac\pi6,\quad f'(0)=0`,
        "sin f(0)=1/2이고 주어진 위상 구간에서 해는 π/6이다. cos f(0)≠0이므로 g′(0)=0은 f′(0)=0을 뜻한다.",
        model(
          [0, 0.55, 0, 1.1],
          [
            curve((z) => Math.sin(PI * z), 0, 0.5),
            line(p(0, 0.5), p(0.5, 0.5), C.orange),
          ],
          [dot(p(1 / 6, 0.5), "f(0)/π=1/6")],
          [],
          {
            metrics: [
              metric("가로축", "위상 f/π"),
              metric("삼차함수", "f(x)=6πx³+px²+π/6"),
            ],
          },
        ),
      ),
      S(
        "극값을 만드는 두 종류",
        R`g'(x)=\frac{-\cos(f(x))f'(x)}{(2+\sin(f(x)))^2},\quad \sin f(\alpha_5)-\sin f(\alpha_2)=\frac12`,
        "cos f=0에서의 사인값은 ±1이어서 두 값의 차가 1/2일 수 없다. 따라서 α₂와 α₅ 중 정확히 하나가 f′의 두 번째 영점이다. 이 영점은 양수여야 하므로 p<0이다.",
        model(
          [-2.5, 2.5, -0.4, 1.4],
          [line(p(-2.5, 0), p(2.5, 0), C.muted)],
          [
            dot(p(-2, 0), "가능한 차 −2", C.muted),
            dot(p(0, 0), "가능한 차 0", C.muted),
            dot(p(2, 0), "가능한 차 2", C.muted),
            dot(p(0.5, 1), "요구한 차 1/2", C.orange),
          ],
          [],
          { metrics: [metric("남은 후보", "α₂ 또는 α₅가 f의 극소점")] },
        ),
      ),
      S(
        "α₂가 극소점인 경우 배제",
        R`-\pi/2<f(\alpha_2)<\pi/6,\quad f(\alpha_5)=5\pi/2\Rightarrow\sin f(\alpha_2)=1/2`,
        "극소점 전에 다른 극값이 없어야 하므로 극소 위상은 (−π/2,π/6)에 있다. 이후 π/2, 3π/2, 5π/2를 차례로 지난다. 그런데 열린 후보 구간에서 sin z는 1/2보다 작아 모순이다.",
        model(
          [-0.55, 0.22, -1.1, 0.7],
          [
            curve((z) => Math.sin(PI * z), -0.5, 1 / 6, C.blue),
            line(p(-0.55, 0.5), p(0.22, 0.5), C.orange),
          ],
          [
            dot(p(-0.5, -1), "−1/2", C.blue, { open: true }),
            dot(p(1 / 6, 0.5), "1/6 제외", C.orange, { open: true }),
          ],
          [],
          {
            metrics: [
              metric("가로축", "f(α₂)/π 후보"),
              metric("결론", "α₅가 극소점"),
            ],
          },
        ),
      ),
      S(
        "세 위상 경계를 지난 뒤의 극소점",
        R`f(\alpha_2)=-\pi/2,\quad -7\pi/2<f(\alpha_5)<-5\pi/2,\quad\sin f(\alpha_5)=-1/2`,
        "α₂, α₃, α₄에서 −π/2, −3π/2, −5π/2를 차례로 지난 뒤 α₅에서 방향이 바뀐다. 해당 열린 구간에서 사인값 −1/2를 갖는 위상은 −17π/6뿐이다.",
        model(
          [-3.6, -2.4, -1.2, 1.2],
          [
            curve((z) => Math.sin(PI * z), -3.5, -2.5),
            line(p(-3.6, -0.5), p(-2.4, -0.5), C.orange),
          ],
          [
            dot(p(-17 / 6, -0.5), "−17/6", C.green),
            dot(p(-3.5, 1), "−7/2", C.muted, { open: true }),
            dot(p(-2.5, -1), "−5/2", C.muted, { open: true }),
          ],
          [],
          { metrics: [metric("가로축", "극소 위상 / π")] },
        ),
      ),
      S(
        "극소점과 삼차함수 확정",
        R`u=-\frac p{9\pi}>0,\quad f(u)=\frac\pi6-3\pi u^3=-\frac{17\pi}6\Rightarrow u=1,\ p=-9\pi`,
        "이제 원문 조건으로 함수가 하나로 결정된다. 처음으로 확정된 삼차함수 f/π와 세 위상 경계의 실제 교점을 그린다.",
        model(
          [-0.1, 1.55, -3.7, 1],
          [
            curve((x) => f(x) / PI, 0, 1.5),
            ...[-0.5, -1.5, -2.5].map((z) => line(p(0, z), p(1.5, z), C.muted)),
          ],
          [
            dot(p(0, 1 / 6), "α₁=0"),
            ...roots.map((v, i) => dot(p(v, f(v) / PI), `α${i + 2}`)),
            dot(p(1, -17 / 6), "α₅=1", C.green),
          ],
          [],
          { metrics: [metric("f(x)", "6πx³−9πx²+π/6")] },
        ),
      ),
      S(
        "합성함수의 극값 순서 검산",
        R`f(x)=6\pi x^3-9\pi x^2+\pi/6,\quad g(1)=2/3,\quad g(\alpha_2)=1`,
        "확정한 f를 g에 넣으면 실제 극값의 순서와 역수 차 조건이 모두 맞는다.",
        model(
          [-0.05, 1.25, 0.2, 1.1],
          [curve(g, 0, 1.2, C.green, 300)],
          [
            dot(p(0, g(0)), "α₁"),
            ...roots.map((v, i) => dot(p(v, g(v)), `α${i + 2}`)),
            dot(p(1, g(1)), "α₅"),
          ],
          [],
          { metrics: [metric("역수 차", "3/2−1=1/2")] },
        ),
      ),
      S(
        "구하려는 점의 위상과 변화율",
        R`f(-1/2)=-17\pi/6,\quad f'(-1/2)=27\pi/2,\quad \sin f=-1/2,\quad\cos f=-\sqrt3/2`,
        "요구한 입력 −1/2에서 위상을 확인한다. 같은 사인값이라도 코사인의 부호까지 확인해야 접선의 방향을 결정할 수 있다.",
        model(
          [-0.55, -0.45, 0.2, 1.15],
          [
            curve(g, -0.54, -0.46, C.blue, 128),
            curve((x) => g(-0.5) + dg(-0.5) * (x + 0.5), -0.52, -0.48, C.green),
          ],
          [dot(p(-0.5, g(-0.5)), "접점 (−1/2,2/3)")],
          [],
          { metrics: [metric("양의 접선 기울기", "3√3π")] },
        ),
      ),
      S(
        "기울기에서 계수의 제곱",
        R`g'(-1/2)=\frac{(\sqrt3/2)(27\pi/2)}{(3/2)^2}=3\sqrt3\pi=a\pi\quad\Longrightarrow\quad a^2=27`,
        "분모는 항상 양수다. 정확한 기울기를 π로 나눈 계수 a의 제곱이 최종 답이다.",
        model(
          [0, 7, 0, 30],
          [
            curve((x) => x * x, 0, 5.4, C.green),
            line(p(0, 27), p(3 * Math.sqrt(3), 27), C.orange),
          ],
          [dot(p(3 * Math.sqrt(3), 27), "(a,a²)=(3√3,27)", C.green)],
          [],
          { metrics: [metric("정답", "27")] },
        ),
      ),
    ],
    [
      chk("첫 극값의 함수값", g(0), 2 / 5),
      chk("극소 위상", f(1), (-17 * PI) / 6),
      chk("역수 차 조건", 1 / g(1) - 1 / g(roots[0]), 0.5),
      chk("요구한 계수 제곱", (dg(-0.5) / PI) ** 2, 27),
      chk(
        "접선 중심차분",
        (g(-0.5 + 1e-7) - g(-0.5 - 1e-7)) / 2e-7,
        3 * Math.sqrt(3) * PI,
        1e-7,
      ),
    ],
  );
}

// 2019, type B.
{
  const f = (n) => (6 - 3 / n ** 2) / (2 + 5 / n);
  add(
    "2019-b-3",
    "같은 차수의 다항식 수열",
    "(6n²−3)/(2n²+5n)의 극한",
    "3",
    [
      S(
        "분자와 분모를 n²으로",
        R`\frac{6n^2-3}{2n^2+5n}=\frac{6-3/n^2}{2+5/n}`,
        "분자와 분모의 최고차수가 같으므로 n²으로 나눈다.",
        model(
          [1, 20, 0, 8],
          [
            curve((n) => 6 - 3 / n ** 2, 1, 20),
            curve((n) => 2 + 5 / n, 1, 20, C.orange),
          ],
        ),
      ),
      S(
        "낮은 차수 항의 소멸",
        R`6-3/n^2\to6,\quad2+5/n\to2`,
        "두 정규화한 수열의 극한을 따로 확인한다.",
        model(
          [1, 20, 0, 8],
          [line(p(1, 6), p(20, 6), C.blue), line(p(1, 2), p(20, 2), C.orange)],
          dotsN((n) => 6 - 3 / n ** 2, 12).concat(
            dotsN((n) => 2 + 5 / n, 12, 1, C.orange),
          ),
        ),
      ),
      S(
        "극한의 나눗셈",
        R`\frac62=3`,
        "분모의 극한은 0이 아니므로 그대로 나눌 수 있다.",
        model(
          [1, 30, 0, 3.5],
          [curve(f, 1, 30), line(p(1, 3), p(30, 3), C.green)],
          [],
          [],
          { metrics: [metric("극한", "3")] },
        ),
      ),
    ],
    [chk("최고차항 비", 6 / 2, 3)],
  );
}
{
  const endpoints = [
    dot(p(-1, 2), "왼쪽 극한", C.blue, { open: true }),
    dot(p(-1, -1), "포함"),
    dot(p(1, -1), "미포함", C.blue, { open: true }),
    dot(p(1, 1), "포함"),
  ];
  add(
    "2019-b-7",
    "좌극한과 우극한의 접근 방향",
    "그래프에서 limₓ→−1⁻f−limₓ→1⁺f",
    "1",
    [
      S(
        "확정된 경계값만 표시",
        R`f(-1)=-1,\quad f(1)=1`,
        "식이 주어지지 않은 곡선은 임의의 함수로 만들지 않고 원문에 표시된 경계점만 추출한다.",
        model([-2, 2, -1.5, 2.5], [line(p(-1, -1), p(1, -1))], endpoints),
      ),
      S(
        "−1의 왼쪽 극한",
        R`\lim_{x\to-1-}f(x)=2`,
        "열린 점 (−1,2)로 접근한다. 점선은 함수 그래프가 아니라 접근 방향이다.",
        model(
          [-2, 2, -1.5, 2.5],
          [line(p(-1.8, 2), p(-1, 2), C.green, { dashed: true })],
          endpoints,
        ),
      ),
      S(
        "1의 오른쪽 극한과 차",
        R`\lim_{x\to1+}f(x)=1,\qquad2-1=1`,
        "오른쪽 가지의 경계 높이는 1이다.",
        model(
          [-2, 2, -1.5, 2.5],
          [line(p(1.8, 1), p(1, 1), C.green, { dashed: true })],
          [
            dot(p(-1, 2), "2", C.blue, { open: true }),
            dot(p(1, 1), "1", C.green),
          ],
          [],
          { metrics: [metric("차", "1")] },
        ),
      ),
    ],
    [chk("한쪽 극한 차", 2 - 1, 1)],
  );
}
{
  const base = (x) => x ** 3 - 3 * x,
    f = (x) => base(x) + 5;
  add(
    "2019-b-9",
    "상수항은 극대 위치를 바꾸지 않는다",
    "f=x³−3x+a의 극댓값이 7",
    "5",
    [
      S(
        "도함수에서 상수 소멸",
        R`f'(x)=3(x+1)(x-1)`,
        "상수 a는 기울기에 영향을 주지 않는다.",
        model(
          [-2, 2, -4, 10],
          [curve((x) => 3 * x * x - 3, -2, 2, C.green)],
          [dot(p(-1, 0), "−1"), dot(p(1, 0), "1")],
        ),
      ),
      S(
        "극대 위치 판정",
        R`f':+\to-\text{ at }x=-1\implies f(-1)=a+2`,
        "−1에서 도함수가 양수에서 음수로 바뀐다. 정규화한 f−a의 극댓값은 2다.",
        model(
          [-2, 2, -3, 3],
          [curve(base, -2, 2)],
          [dot(p(-1, 2), "f−a의 극대 2")],
          [],
          { metrics: [metric("세로축", "f(x)−a")] },
        ),
      ),
      S(
        "수직 이동량",
        R`a+2=7\implies a=5`,
        "정규화한 곡선을 위로 5만큼 이동하면 극댓값 7이 된다.",
        model(
          [-2, 2, 0, 9],
          [curve(f, -2, 2, C.green)],
          [dot(p(-1, 7), "극댓값 7")],
        ),
      ),
    ],
    [chk("극댓값 조건", f(-1), 7)],
  );
}
{
  const H = (x) => x ** 3 + x * x - 2,
    d = (x) => 3 * x * x + 2 * x;
  add(
    "2019-b-14",
    "적분 구간이 사라지는 상한부터 대입",
    "∫1ˣf′(t)dt=x³+ax²−2에서 f′(a)",
    "5",
    [
      S(
        "같은 적분 경계",
        R`x=1:\quad0=1+a-2\implies a=1`,
        "상한과 하한이 같은 정적분은 0이다.",
        model(
          [0, 2, -3, 11],
          [curve(H, 0, 2)],
          [dot(p(1, 0), "적분값 0")],
          [],
          { metrics: [metric("세로축", "f(x)−f(1)")] },
        ),
      ),
      S(
        "미적분의 기본정리",
        R`f'(x)=3x^2+2ax=3x^2+2x`,
        "양변을 x로 미분하면 적분 상수는 필요하지 않다.",
        model(
          [0, 2, 0, 17],
          [curve(d, 0, 2, C.green)],
          [dot(p(1, 5), "x=a=1")],
        ),
      ),
      S(
        "요구한 미분계수",
        R`f'(a)=f'(1)=3+2=5`,
        "f의 세로 이동은 알려지지 않았지만 도함수는 완전히 정해진다.",
        model(
          [0, 2, -3, 11],
          [curve(H, 0, 2), curve((x) => 5 * (x - 1), 0, 2, C.orange)],
          [dot(p(1, 0), "기울기 5")],
        ),
      ),
    ],
    [chk("상한이 하한인 적분", H(1), 0), chk("미분계수", d(1), 5)],
  );
}
{
  const r = 1 / Math.sqrt(3),
    arc = (x) => Math.sqrt(Math.max(0, 16 - x * x)),
    edge = (x) => Math.sqrt(3) * (4 - x),
    parts = (j) => {
      const q = r ** j,
        tr = (v) => p(q * v[0], q * v[1]);
      return [
        surface(
          [
            ...curve(edge, 0, 2).points,
            ...curve(arc, 0, 2).points.reverse(),
          ].map(tr),
          C.blue,
          0.4,
        ),
        surface(
          [
            ...curve(arc, 2, 4).points,
            ...curve(edge, 2, 4).points.reverse(),
          ].map(tr),
          C.green,
          0.4,
        ),
      ];
    };
  add(
    "2019-b-16",
    "삼각형과 부채꼴의 공통 부분을 두 번 빼기",
    "OA₁=4, OB₁=4√3에서 두 도형의 겹치지 않는 부분 반복",
    "2π",
    [
      S(
        "원과 빗변의 내부 교점",
        R`x^2+y^2=16,\quad y=\sqrt3(4-x)\implies(x,y)=(2,2\sqrt3)`,
        "다른 교점은 A₁=(4,0)이다.",
        model(
          [-0.3, 4.5, -0.3, 7.3],
          [
            path([p(0), p(4), p(0, 4 * Math.sqrt(3)), p(0)]),
            curve(arc, 0, 4, C.orange),
          ],
          [dot(p(2, 2 * Math.sqrt(3)), "내부 교점")],
          parts(0),
          { equalAspect: true },
        ),
      ),
      S(
        "공통 넓이 계산",
        R`I=\int_0^2\sqrt{16-x^2}dx+\int_2^4\sqrt3(4-x)dx=4\sqrt3+4\pi/3`,
        "공통 부분의 윗경계는 x=2에서 원호에서 직선으로 바뀐다.",
        model(
          [-0.3, 4.5, -0.3, 7.3],
          [curve(arc, 0, 4), curve(edge, 0, 4, C.orange)],
          [],
          [
            surface(
              [
                p(0),
                ...curve(arc, 0, 2).points,
                ...curve(edge, 2, 4).points,
                p(4),
              ],
              C.muted,
              0.3,
            ),
          ],
          { equalAspect: true },
        ),
      ),
      S(
        "첫 색칠 넓이와 닮음비",
        R`S_1=8\sqrt3+4\pi-2I=4\pi/3,\quad OA_2/OA_1=1/\sqrt3`,
        "공통 부분을 제외한 합집합은 두 넓이의 합에서 공통 부분을 두 번 빼야 한다.",
        model(
          [-0.3, 4.5, -0.3, 7.3],
          [],
          [],
          [...parts(0), ...parts(1), ...parts(2)],
          { equalAspect: true },
        ),
      ),
      S(
        "등비급수",
        R`\lim S_n=\frac{4\pi/3}{1-1/3}=2\pi`,
        "길이비를 제곱하여 넓이비 1/3을 사용한다.",
        model(
          [-0.3, 4.5, -0.3, 7.3],
          [],
          [],
          Array.from({ length: 7 }, (_, i) => parts(i)).flat(),
          { equalAspect: true, metrics: [metric("전체 넓이", "2π")] },
        ),
      ),
    ],
    [
      chk(
        "첫 넓이",
        8 * Math.sqrt(3) + 4 * PI - 2 * (4 * Math.sqrt(3) + (4 * PI) / 3),
        (4 * PI) / 3,
      ),
      chk("급수 합", (4 * PI) / 3 / (1 - r * r), 2 * PI),
    ],
  );
}
{
  const rect = (x, A, color) =>
    surface([p(x), p(x + 3), p(x + 3, A / 3), p(x, A / 3)], color, 0.35);
  add(
    "2019-b-17",
    "평행이동 조건이 적분값에 더하는 양",
    "증가 연속함수 f(x)=f(x−3)+4, ∫0⁶f=0",
    "18",
    [
      S(
        "한 구간 이동의 적분 변화",
        R`f(x+3)=f(x)+4\implies\int_3^6f=\int_0^3f+12`,
        "함수의 구체적인 모양은 정해지지 않았다. 폭 3에서 높이가 4 늘어 적분값은 12 증가한다.",
        model(
          [0, 9, -3, 7],
          [line(p(0, 0), p(3, 0), C.muted), line(p(3, 4), p(6, 4), C.orange)],
          [],
          [rect(3, 12, C.orange)],
          { metrics: [metric("도식", "함수 그래프가 아닌 적분 변화량")] },
        ),
      ),
      S(
        "처음 두 적분을 연립",
        R`I+(I+12)=0\implies I=-6,\quad\int_3^6f=6`,
        "주어진 전체 적분 0이 첫 두 구간의 부호 있는 넓이를 정한다.",
        model(
          [0, 9, -3, 7],
          [],
          [dot(p(1.5, -2), "−6"), dot(p(4.5, 2), "+6")],
          [rect(0, -6, C.blue), rect(3, 6, C.orange)],
        ),
      ),
      S(
        "다음 구간의 넓이",
        R`\int_6^9f=I+24=18`,
        "증가함수이고 ∫0⁶f=0이므로 f(6)>0이다. [6,9]에서는 정적분이 실제 넓이와 같다.",
        model(
          [0, 9, -3, 7],
          [],
          [dot(p(7.5, 6), "넓이 18")],
          [rect(0, -6, C.blue), rect(3, 6, C.orange), rect(6, 18, C.green)],
          { metrics: [metric("블록", "적분값을 표시, f의 모양 아님")] },
        ),
      ),
    ],
    [chk("처음 전체 적분", -6 + 6, 0), chk("다음 구간", -6 + 24, 18)],
  );
}
{
  const g = (x, a) => (x + 3) / (x * x + a * x + 3),
    choices = Array.from({ length: 7 }, (_, i) => i - 3);
  add(
    "2019-b-21",
    "연속성이 분모의 실근을 배제한다",
    "monic 삼차 f, fg=x(x+3), g(0)=1, f(1)이 자연수",
    "5/13",
    [
      S(
        "0에서의 조건과 인수",
        R`f(x)=x(x^2+ax+b),\quad g(0)=\lim_{x\to0}\frac{x+3}{x^2+ax+b}=3/b=1`,
        "f(0)=0이고 g가 연속이므로 b=3이다.",
        model([-1, 1, 0, 2], [], [dot(p(0, 1), "g(0)=1")], [], {
          metrics: [metric("분모 상수항", "b=3")],
        }),
      ),
      S(
        "분모가 실수축에서 0이 되지 않기",
        R`a^2-12<0\implies-2\sqrt3<a<2\sqrt3`,
        "분모의 실근이 있으면 분자 x+3으로 모두 소거할 수 없다. 중근 −3의 제곱은 상수항이 9여서 역시 불가능하다.",
        model(
          [-4, 4, -13, 5],
          [curve((a) => a * a - 12, -4, 4)],
          [
            dot(p(-2 * Math.sqrt(3), 0), "제외", C.orange, { open: true }),
            dot(p(2 * Math.sqrt(3), 0), "제외", C.orange, { open: true }),
          ],
        ),
      ),
      S(
        "자연수 조건으로 이산화",
        R`f(1)=a+4\in\mathbb N\implies a=-3,-2,-1,0,1,2,3`,
        "a는 정수이며 앞의 열린 구간에 속해야 한다.",
        model(
          [-4, 4, 0, 6],
          [],
          choices.map((a) => dot(p(a, g(2, a)), String(a))),
          [],
          { metrics: [metric("세로축", "g(2)=5/(2a+7)")] },
        ),
      ),
      S(
        "가장 큰 분모 선택",
        R`g(2)=\frac5{2a+7}\ge\frac5{13}\quad(a=3)`,
        "모든 후보에서 분모가 양수이므로 a가 클수록 g(2)가 작다.",
        model(
          [-3.5, 3.5, -1, 4.5],
          [curve((x) => g(x, 3), -3.5, 3.5, C.green)],
          [dot(p(2, 5 / 13), "최소 5/13")],
          [],
          { metrics: [metric("달성 매개변수", "a=3")] },
        ),
      ),
    ],
    [
      chk("최솟값", Math.min(...choices.map((a) => g(2, a))), 5 / 13),
      chk("0 연속값", g(0, 3), 1),
    ],
  );
}
{
  const f = (x) => x ** 4 - 3 * x * x + 8,
    d = (x) => 4 * x ** 3 - 6 * x;
  add(
    "2019-b-23",
    "다항함수의 접선 기울기",
    "f=x⁴−3x²+8에서 f′(2)",
    "20",
    [
      S(
        "항별 미분",
        R`f'(x)=4x^3-6x`,
        "상수 8의 미분은 0이다.",
        model(
          [-2.3, 2.5, 0, 30],
          [curve(f, -2.3, 2.5)],
          [dot(p(2, 12), "(2,12)")],
        ),
      ),
      S(
        "도함수의 x=2 값",
        R`f'(2)=4\cdot8-6\cdot2=20`,
        "도함수 그래프에서 x=2의 높이가 접선 기울기다.",
        model(
          [-2.3, 2.5, -40, 50],
          [curve(d, -2.3, 2.5, C.green)],
          [dot(p(2, 20), "20")],
        ),
      ),
      S(
        "원래 곡선 위 접선",
        R`y=20(x-2)+12`,
        "기울기를 원래 그래프의 접점으로 되돌려 확인한다.",
        model(
          [1, 2.6, -10, 35],
          [curve(f, 1, 2.6), curve((x) => 20 * (x - 2) + 12, 1, 2.6, C.orange)],
          [dot(p(2, 12), "접점")],
        ),
      ),
    ],
    [chk("도함수", d(2), 20)],
  );
}
{
  const f = (x) => x + Math.abs(x - 3);
  add(
    "2019-b-25",
    "절댓값의 경계에서 상수와 직선으로 분해",
    "∫1⁴(x+|x−3|)dx",
    "10",
    [
      S(
        "절댓값 안의 부호",
        R`x+|x-3|=\begin{cases}3&x\le3\\2x-3&x\ge3\end{cases}`,
        "x=3을 기준으로 피적분함수의 식이 달라진다.",
        model([0.5, 4.5, 0, 6], [curve(f, 1, 4)], [dot(p(3, 3), "경계 3")]),
      ),
      S(
        "두 넓이로 나누기",
        R`\int_1^3 3dx+\int_3^4(2x-3)dx`,
        "왼쪽은 직사각형, 오른쪽은 사다리꼴이다.",
        model(
          [0.5, 4.5, 0, 6],
          [curve(f, 1, 4)],
          [],
          [area(f, 1, 3, C.blue), area(f, 3, 4, C.green)],
        ),
      ),
      S(
        "각 넓이의 합",
        R`3\cdot2+\frac{3+5}{2}\cdot1=6+4=10`,
        "경계에서 함수가 연속이므로 포함점 차이는 적분값에 영향을 주지 않는다.",
        model(
          [0.5, 4.5, 0, 6],
          [curve(f, 1, 4, C.green)],
          [dot(p(2, 3), "넓이 6"), dot(p(3.5, 4), "넓이 4")],
          [area(f, 1, 4, C.green)],
          { metrics: [metric("합", "10")] },
        ),
      ),
    ],
    [chk("적분", integrate(f, 1, 3, 1000) + integrate(f, 3, 4, 1000), 10)],
  );
}
{
  const pos = (t) => -(t ** 3) / 3 + 3 * t * t + 22,
    v = (t) => -t * t + 6 * t,
    acc = (t) => -2 * t + 6;
  add(
    "2019-b-27",
    "가속도가 0인 시각에서 위치 조건 대입",
    "x=−t³/3+3t²+k, 가속도 0일 때 위치 40",
    "22",
    [
      S(
        "위치에서 속도와 가속도",
        R`v(t)=-t^2+6t,\quad a(t)=-2t+6`,
        "위치를 두 번 미분하면 가속도를 얻는다.",
        model([0, 6, -7, 10], [curve(v, 0, 6), curve(acc, 0, 6, C.orange)]),
      ),
      S(
        "가속도 0인 시각",
        R`-2t+6=0\implies t=3`,
        "이때 속도는 9로 0이 아니다. 가속도와 속도를 구별한다.",
        model(
          [0, 6, -7, 10],
          [curve(acc, 0, 6, C.orange)],
          [dot(p(3, 0), "가속도 0"), dot(p(3, 9), "속도 9", C.blue)],
        ),
      ),
      S(
        "위치 40으로 초기상수 결정",
        R`-27/3+27+k=40\implies k=22`,
        "찾은 시각을 원래 위치 식에 넣는다.",
        model(
          [0, 6, 15, 60],
          [curve(pos, 0, 6, C.green)],
          [dot(p(0, 22), "초기 위치 22"), dot(p(3, 40), "주어진 위치 40")],
        ),
      ),
    ],
    [chk("가속도 조건", acc(3), 0), chk("위치 조건", pos(3), 40)],
  );
}
{
  const f = (x) => x ** 3,
    g = (x) => -((x - 2) ** 2),
    beta = 4 - 2 * Math.SQRT2;
  add(
    "2019-b-30",
    "두 곡선 사이 직선의 허용 기울기",
    "0과 2에서의 수평접선 조건, 모든 x>0에서 g≤kx−2≤f",
    "5",
    [
      S(
        "접선 조건으로 함수 형태",
        R`f(x)=x^2(x+c),\quad g(x)=-(x-2)^2`,
        "주어진 수평접선과 최고차항 계수를 반영한다. 아직 c는 미정이다.",
        model(
          [-0.3, 3, -5, 1],
          [curve(g, -0.3, 3, C.orange)],
          [dot(p(0, 0), "f의 수평접점"), dot(p(2, 0), "g의 수평접점")],
        ),
      ),
      S(
        "접선의 개수로 후보 제한",
        R`t[-2t^2+(6-c)t+4c]=0\implies c\in\{0,-2,-18\}`,
        "접점 t에서의 접선이 (2,0)을 지나는 조건이다. t=0과 다른 해가 정확히 하나여야 한다.",
        model(
          [-19, 1, 0, 1],
          [],
          [-18, -2, 0].map((c) => dot(p(c, 0.5), `c=${c}`)),
          [],
          { metrics: [metric("이차식 판별식", "(c+2)(c+18)")] },
        ),
      ),
      S(
        "교점 한 개 조건으로 확정",
        R`c=-2,-18\text{은 }f=g\text{의 실근이 3개};\quad c=0\implies f=x^3`,
        "c=−2에서는 명시적으로 (x−1)(x−2)(x+2)가 된다. c=−18은 −1,0,1과 +∞에서 부호가 번갈아 바뀐다.",
        model(
          [-2.5, 3, -8, 28],
          [curve(f, -2.5, 3), curve(g, -2.5, 3, C.orange)],
          [dot(p(0, 0), "확정된 f=x³")],
        ),
      ),
      S(
        "모든 x의 조건을 k의 상·하한으로",
        R`4-x-2/x\le k\le x^2+2/x\quad(x>0)`,
        "양수 x로 나누어 k를 가운데 두고, 왼쪽의 최댓값과 오른쪽의 최솟값을 찾는다.",
        model(
          [0.3, 3, -4, 12],
          [
            curve((x) => 4 - x - 2 / x, 0.3, 3, C.orange),
            curve((x) => x * x + 2 / x, 0.3, 3, C.blue),
          ],
          [
            dot(p(Math.SQRT2, beta), "하한의 최대"),
            dot(p(1, 3), "상한의 최소"),
          ],
        ),
      ),
      S(
        "접하는 두 극한 직선",
        R`\beta=4-2\sqrt2\ (x=\sqrt2),\quad\alpha=3\ (x=1)`,
        "허용되는 직선은 두 접선 사이의 기울기를 갖는다.",
        model(
          [0, 2.5, -4, 16],
          [
            curve(f, 0, 2.5),
            curve(g, 0, 2.5, C.orange),
            curve((x) => 3 * x - 2, 0, 2.5, C.green),
            curve((x) => beta * x - 2, 0, 2.5, C.green),
          ],
          [
            dot(p(0, -2), "고정 절편"),
            dot(p(1, 1), "상한 접점"),
            dot(p(Math.SQRT2, g(Math.SQRT2)), "하한 접점"),
          ],
        ),
      ),
      S(
        "기울기 차의 계수",
        R`\alpha-\beta=-1+2\sqrt2\implies a^2+b^2=1+4=5`,
        "정확한 계수 −1과 2를 제곱하여 더한다.",
        model(
          [0, 4, 0, 1],
          [line(p(beta, 0.5), p(3, 0.5), C.green)],
          [dot(p(beta, 0.5), "β=4−2√2"), dot(p(3, 0.5), "α=3")],
          [],
          { metrics: [metric("답", "5")] },
        ),
      ),
    ],
    [
      chk("상한 접선 값", 3 * 1 - 2, f(1)),
      chk("하한 접선 값", beta * Math.SQRT2 - 2, g(Math.SQRT2)),
      chk("계수 제곱합", (-1) ** 2 + 2 ** 2, 5),
    ],
  );
}

// 2020, type B.
{
  const f = (n) => Math.sqrt(9 + 4 / n ** 2) / (5 - 2 / n);
  add(
    "2020-b-3",
    "최고차항으로 나눈 수열의 극한",
    "√(9n²+4)/(5n−2)의 극한",
    "3/5",
    [
      S(
        "분자·분모의 n 규모",
        R`\frac{\sqrt{9n^2+4}}{5n-2}`,
        "n>0이므로 제곱근 밖으로 n을 꺼낼 수 있다.",
        model(
          [1, 12, 0, 60],
          [
            curve((n) => Math.sqrt(9 * n * n + 4), 1, 12),
            curve((n) => 5 * n - 2, 1, 12, C.orange),
          ],
        ),
      ),
      S(
        "n으로 나누기",
        R`\frac{\sqrt{9+4/n^2}}{5-2/n}`,
        "분자와 분모는 각각 3과 5로 수렴한다.",
        model(
          [1, 20, 0, 6],
          [
            curve((n) => Math.sqrt(9 + 4 / n ** 2), 1, 20),
            curve((n) => 5 - 2 / n, 1, 20, C.orange),
          ],
        ),
      ),
      S(
        "극한값 비교",
        R`\frac{\sqrt9}{5}=\frac35`,
        "양의 항들이 3/5에 접근한다.",
        model(
          [1, 30, 0.5, 1.3],
          [curve(f, 1, 30), line(p(1, 0.6), p(30, 0.6), C.green)],
          dotsN(f, 10),
          [],
          { metrics: [metric("극한", "3/5")] },
        ),
      ),
    ],
    [chk("극한 근사", f(1e8), 0.6, 1e-8)],
  );
}
{
  const base = [
    line(p(-1.3, 2), p(0, 2)),
    line(p(0, 0), p(1, 2)),
    line(p(1, 1), p(3, -1)),
  ];
  const endpoints = [
    dot(p(0, 2), "", C.blue, { open: true }),
    dot(p(0, 0), "f(0)=0"),
    dot(p(1, 2), "", C.blue, { open: true }),
    dot(p(1, 1), "", C.blue, { open: true }),
    dot(p(1, 0), "f(1)=0"),
  ];
  add(
    "2020-b-8",
    "경계의 함수값과 한쪽 극한 구별",
    "원문 그래프에서 x→0⁺와 x→1⁻의 함수값 차",
    "−2",
    [
      S(
        "원문 경계점 재현",
        R`f(0)=0,\quad f(1)=0`,
        "열린 점은 해당 조각의 경계에서 포함하지 않는 값이다.",
        model([-1.4, 3.2, -1.3, 2.5], base, endpoints),
      ),
      S(
        "0의 오른쪽에서 접근",
        R`\lim_{x\to0+}f(x)=0`,
        "0<x<1의 직선 조각을 따라 원점으로 접근한다. 왼쪽의 높이 2는 사용하지 않는다.",
        model(
          [-0.2, 1.2, -0.2, 2.5],
          [line(p(0), p(1, 2), C.green)],
          endpoints
            .filter((d) => d.at[0] === 0)
            .concat([dot(p(0.15, 0.3), "0⁺", C.green)]),
        ),
      ),
      S(
        "1의 왼쪽에서 접근",
        R`\lim_{x\to1-}f(x)=2\implies0-2=-2`,
        "x=1의 닫힌 점 높이 0과 달리 왼쪽 극한은 열린 점 높이 2다.",
        model(
          [-0.2, 1.2, -0.2, 2.5],
          [line(p(0), p(1, 2), C.green)],
          [
            dot(p(1, 2), "왼쪽 극한 2", C.green, { open: true }),
            dot(p(1, 0), "함수값 0"),
            dot(p(0.85, 1.7), "1⁻", C.green),
          ],
          [],
          { metrics: [metric("차", "−2")] },
        ),
      ),
    ],
    [chk("극한 차", 0 - 2, -2)],
  );
}
{
  const f = (x) => 4 * x ** 3 + x,
    F = (u) => f(2 * u),
    rect = (n) =>
      Array.from({ length: n }, (_, i) =>
        surface(
          [
            p(i / n),
            p((i + 1) / n),
            p((i + 1) / n, F((i + 1) / n)),
            p(i / n, F((i + 1) / n)),
          ],
          C.blue,
          0.3,
        ),
      );
  add(
    "2020-b-11",
    "표본점의 2배와 리만합 폭 구별",
    "f=4x³+x, (1/n)Σf(2k/n)의 극한",
    "9",
    [
      S(
        "같은 폭에서 다른 입력",
        R`\frac1n\sum_{k=1}^nf(2k/n)\to\int_0^1f(2u)du`,
        "폭은 1/n이므로 구간 [0,1]에서 f(2u)를 적분한다.",
        model([0, 1.1, 0, 36], [curve(F, 0, 1)], [], rect(8)),
      ),
      S(
        "원래 x좌표로 변환",
        R`x=2u,\ du=dx/2\implies\frac12\int_0^2(4x^3+x)dx`,
        "x축이 2배 늘어난 만큼 적분 앞에 1/2가 붙는다.",
        model(
          [0, 2.2, 0, 18],
          [curve((x) => f(x) / 2, 0, 2, C.green)],
          [],
          [area((x) => f(x) / 2, 0, 2, C.green)],
        ),
      ),
      S(
        "다항식 적분",
        R`\frac12[x^4+x^2/2]_0^2=\frac12(16+2)=9`,
        "간격 보정 1/2를 놓치면 결과가 두 배가 된다.",
        model(
          [0, 1.1, 0, 36],
          [curve(F, 0, 1, C.green)],
          [],
          [area(F, 0, 1, C.green)],
          { metrics: [metric("극한", "9")] },
        ),
      ),
    ],
    [chk("리만합 적분", integrate(F, 0, 1, 30000), 9, 1e-8)],
  );
}
{
  const f = (x) => -(x ** 4) + 8 * x * x - 1,
    d = (x) => -4 * x * (x - 2) * (x + 2);
  add(
    "2020-b-12",
    "짝함수의 두 극대 위치를 연결",
    "−x⁴+8a²x²−1의 극대점 x=b, x=2−2b, a>0,b>1",
    "3",
    [
      S(
        "도함수의 세 근",
        R`f'(x)=-4x(x-2a)(x+2a)`,
        "양의 a에 대해 0은 극소, ±2a는 극대다.",
        model(
          [-3, 3, -1, 1],
          [
            line(p(-2, 0.5), p(0, 0.5), C.muted),
            line(p(0, 0.5), p(2, 0.5), C.muted),
          ],
          [
            dot(p(-2, 0.5), "−2a, 극대"),
            dot(p(0, 0.5), "0, 극소"),
            dot(p(2, 0.5), "2a, 극대"),
          ],
          [],
          { metrics: [metric("가로 좌표", "a로 정규화한 x/a")] },
        ),
      ),
      S(
        "위치의 부호로 대응",
        R`b=2a,\quad2-2b=-2a\implies b=2,\ a=1`,
        "b>1이므로 b는 양의 극대점이고 2−2b는 음의 극대점이다.",
        model(
          [-3, 3, -10, 18],
          [curve(f, -3, 3)],
          [dot(p(-2, 15), "2−2b=−2"), dot(p(2, 15), "b=2")],
        ),
      ),
      S(
        "극대 부호 변화 확인",
        R`a+b=1+2=3`,
        "확정된 도함수는 −2와 2에서 양수→음수로 바뀐다.",
        model(
          [-3, 3, -70, 70],
          [curve(d, -3, 3, C.green)],
          [dot(p(-2, 0), "극대"), dot(p(2, 0), "극대")],
          [],
          { metrics: [metric("합", "3")] },
        ),
      ),
    ],
    [chk("극대 위치의 합", 2 + (2 - 2 * 2), 0), chk("매개변수 합", 1 + 2, 3)],
  );
}
{
  const prod = (x) => 2 * x * x * (x - 2),
    f = (x) => 2 * x * x;
  add(
    "2020-b-14",
    "두 극한이 정하는 다항식의 인수",
    "정수계수 f,g에 대해 fg/x³→2, x→0에서 fg/x²→−4",
    "8",
    [
      S(
        "전체 차수와 낮은 차수",
        R`f(x)g(x)=2x^3-4x^2=2x^2(x-2)`,
        "무한대 극한은 차수 3과 최고차계수 2를, 0에서의 극한은 x²의 계수 −4를 정한다.",
        model(
          [-1, 3, -6, 20],
          [curve(prod, -1, 3)],
          [dot(p(0, 0), "중근 0"), dot(p(2, 0), "단근 2")],
        ),
      ),
      S(
        "x−2 인수의 배치",
        R`(x-2)\mid f\implies f(2)=0`,
        "최댓값을 얻으려면 x−2를 g에 배치하고 f는 2x²의 정수계수 인수로 둔다.",
        model(
          [0, 5, 0, 10],
          [],
          [
            dot(p(1, 1), "1"),
            dot(p(2, 2), "2 또는 x"),
            dot(p(3, 4), "2x 또는 x²"),
            dot(p(4, 8), "2x²", C.green),
          ],
        ),
      ),
      S(
        "정수계수에서 최대값 달성",
        R`f(x)=2x^2,\quad g(x)=x-2\implies f(2)=8`,
        "가능한 양의 값 중 8이 가장 크며 실제 정수계수 인수로 달성된다.",
        model(
          [-1, 3, -3, 20],
          [curve(f, -1, 3, C.green), curve((x) => x - 2, -1, 3, C.orange)],
          [dot(p(2, 8), "최대 8")],
        ),
      ),
    ],
    [chk("인수 곱", f(3) * (3 - 2), prod(3)), chk("최댓값", f(2), 8)],
  );
}
{
  const s1 = 4 * (2 - Math.sqrt(3) + PI / 3),
    r = 0.8,
    e = 2 * Math.sqrt(3),
    bottom = (x) => 7 - Math.sqrt(16 - x * x),
    parts = (j) => {
      const q = r ** j,
        dy = 15 * (1 - q),
        tr = (pts) => pts.map((v) => p(q * v[0], dy + q * v[1]));
      return [
        surface(
          tr([
            p(0, 5),
            p(e, 5),
            ...curve((x) => bottom(x), 0, e).points.reverse(),
          ]),
          C.blue,
          0.45,
        ),
        surface(
          tr([
            p(e, 5),
            p(4, 5),
            p(4, 7),
            ...curve((x) => bottom(x), e, 4).points.reverse(),
          ]),
          C.green,
          0.45,
        ),
      ];
    };
  add(
    "2020-b-18",
    "두 원호 조각의 넓이와 반복 닮음",
    "한 변 5 정사각형, 3:2 분점에서 시작하는 원호 색칠 반복",
    "(100/9)(2−√3+π/3)",
    [
      S(
        "다음 정사각형 한 변",
        R`AA_1=3,\quad A_1B_1=\sqrt{5^2-3^2}=4`,
        "A=(0,0)으로 두면 A₁=(0,3), B₁=(4,3)이다.",
        model(
          [-0.3, 5.5, -0.3, 7.5],
          [
            path([p(0), p(5), p(5, 5), p(0, 5), p(0)]),
            curve((t) => p(5 * Math.cos(t), 5 * Math.sin(t)), 0, PI / 2),
            path([p(0, 3), p(4, 3), p(4, 7), p(0, 7), p(0, 3)], C.orange),
          ],
          [dot(p(0, 3), "A₁"), dot(p(4, 3), "B₁")],
          [],
          { equalAspect: true },
        ),
      ),
      S(
        "원호와 y=5의 교점",
        R`x^2+(y-7)^2=16,\ y=5\implies E_1=(2\sqrt3,5)`,
        "새 부채꼴 중심은 D₁=(0,7)이고 반지름은 4다.",
        model(
          [-0.3, 5.5, 2.5, 7.5],
          [curve(bottom, 0, 4), line(p(0, 5), p(5, 5), C.orange)],
          [dot(p(e, 5), "E₁"), dot(p(0, 7), "D₁")],
          parts(0),
          { equalAspect: true },
        ),
      ),
      S(
        "두 부분 넓이 합",
        R`S_1=\int_0^{2\sqrt3}(\sqrt{16-x^2}-2)dx+\int_{2\sqrt3}^4(2-\sqrt{16-x^2})dx=4(2-\sqrt3+\pi/3)`,
        "직선 위쪽과 아래쪽 원호 조각을 각각 양의 넓이로 계산한다.",
        model(
          [0, 4.3, -2.3, 2.3],
          [curve((x) => Math.sqrt(16 - x * x) - 2, 0, 4)],
          [],
          [
            area((x) => Math.sqrt(16 - x * x) - 2, 0, e, C.blue),
            area((x) => Math.sqrt(16 - x * x) - 2, e, 4, C.green),
          ],
        ),
      ),
      S(
        "반복 닮음의 길이비",
        R`\text{길이비}=4/5,\qquad\text{넓이비}=16/25`,
        "각 단계의 원호와 직선도 정사각형과 함께 같은 비율로 줄어든다.",
        model(
          [-0.3, 5.5, 0, 16],
          [],
          [],
          Array.from({ length: 6 }, (_, i) => parts(i)).flat(),
          { equalAspect: true },
        ),
      ),
      S(
        "무한히 더한 넓이",
        R`\lim S_n=\frac{4(2-\sqrt3+\pi/3)}{1-16/25}=\frac{100}{9}(2-\sqrt3+\pi/3)`,
        "추가되는 넓이들을 공비 16/25인 급수로 합한다.",
        model(
          [0, 10, 0, 16],
          [line(p(0, s1 / (1 - r * r)), p(10, s1 / (1 - r * r)), C.green)],
          dotsN((n) => (s1 * (1 - r ** (2 * n))) / (1 - r * r), 9),
          [],
          { metrics: [metric("넓이 합", "(100/9)(2−√3+π/3)")] },
        ),
      ),
    ],
    [
      chk(
        "첫 넓이 적분",
        integrate(
          (t) => Math.abs(4 * Math.cos(t) - 2) * 4 * Math.cos(t),
          0,
          PI / 2,
          100000,
        ),
        s1,
        1e-7,
      ),
      chk("급수 계수", 4 / (1 - r * r), 100 / 9),
    ],
  );
}
{
  const f = (x) => (x <= 0 ? -x : x <= 2 ? x - 1 : 2 * x - 3),
    P = (x) => x * x * (x - 2),
    F = (x) => P(x) * f(x) ** 2;
  add(
    "2020-b-20",
    "점프와 꺾임을 다항식의 영점으로 없애기",
    "세 구간 함수 f와 p f, p f²의 연속·미분 가능 조건",
    "ㄱ, ㄴ",
    [
      S(
        "원래 함수의 두 경계",
        R`f(x)=\begin{cases}-x&x\le0\\x-1&0<x\le2\\2x-3&x>2\end{cases}`,
        "0에서는 점프, 2에서는 연속이지만 기울기가 1에서 2로 바뀐다.",
        model(
          [-2, 4, -1.5, 5.5],
          [
            curve((x) => -x, -2, 0),
            curve((x) => x - 1, 0, 2),
            curve((x) => 2 * x - 3, 2, 4),
          ],
          [
            dot(p(0, 0), "닫힘"),
            dot(p(0, -1), "열림", C.blue, { open: true }),
            dot(p(2, 1), "기울기 변화"),
          ],
        ),
      ),
      S(
        "0에서 연속의 필요조건",
        R`(pf)(0-)=0,\quad(pf)(0+)=-p(0)\implies p(0)=0`,
        "ㄱ은 참이다. 한쪽 극한을 같게 만들기 위해 0에서 다항식이 사라져야 한다.",
        model(
          [-1, 1, -1.5, 1.5],
          [line(p(-1, 0), p(0, 0), C.blue), line(p(0, -1), p(1, -1), C.orange)],
          [
            dot(p(0, 0), "왼쪽 0"),
            dot(p(0, -1), "오른쪽 −p(0)", C.orange, { open: true }),
          ],
          [],
          { metrics: [metric("세로축", "한쪽 극한의 관계 도식")] },
        ),
      ),
      S(
        "2에서 미분 가능의 필요조건",
        R`(pf)'(2-)=p'(2)+p(2),\quad(pf)'(2+)=p'(2)+2p(2)\implies p(2)=0`,
        "ㄴ도 참이다. 함수값은 이미 같고 기울기 차가 p(2)다.",
        model(
          [-1, 1, 0, 3],
          [line(p(-1, 1), p(0, 2), C.blue), line(p(0, 2), p(1, 3), C.orange)],
          [dot(p(0, 2), "p(2)=0에서 기울기 일치")],
          [],
          { metrics: [metric("미분 차", "p(2)")] },
        ),
      ),
      S(
        "세 번째 주장에 대한 실제 반례",
        R`p(x)=x^2(x-2)\implies p(x)f(x)^2\text{ 는 전 구간 미분 가능}`,
        "0에서는 이중근, 2에서는 단근이면 충분하다. 이 다항식은 x²(x−2)²로 나누어떨어지지 않으므로 ㄷ은 거짓이다.",
        model(
          [-1, 3, -2, 10],
          [curve(F, -1, 0), curve(F, 0, 2, C.green), curve(F, 2, 2.7)],
          [dot(p(0, 0), "양쪽 미분 0"), dot(p(2, 0), "양쪽 미분 4")],
          [],
          { metrics: [metric("참인 보기", "ㄱ, ㄴ")] },
        ),
      ),
    ],
    [
      chk("반례의 0 오른쪽 미분", (F(1e-6) - F(0)) / 1e-6, 0, 3e-6),
      chk(
        "반례의 2 좌우 미분 차",
        (F(2 + 1e-6) - F(2)) / 1e-6 - (F(2) - F(2 - 1e-6)) / 1e-6,
        0,
        4e-5,
      ),
    ],
  );
}
{
  const f = (x) => (x * (4 - x)) / 3,
    g = (x) => Math.abs(x - 1) - 1;
  add(
    "2020-b-26",
    "절댓값 경계에서 나누는 두 곡선 사이 넓이",
    "f=x(4−x)/3, g=|x−1|−1 사이 넓이 S에서 4S",
    "14",
    [
      S(
        "절댓값을 두 직선으로",
        R`g(x)=-x\ (x\le1),\quad g(x)=x-2\ (x\ge1)`,
        "x=1에서 직선이 꺾인다.",
        model(
          [-0.5, 3.5, -1.5, 2],
          [curve(f, -0.5, 3.5), curve(g, -0.5, 3.5, C.orange)],
          [dot(p(1, -1), "경계 1")],
        ),
      ),
      S(
        "유효한 교점 결정",
        R`f=-x\implies x=0;\qquad f=x-2\implies x=3`,
        "각 방정식의 다른 근은 해당 조각의 정의역 밖이므로 버린다.",
        model(
          [-0.5, 3.5, -1.5, 2],
          [curve(f, 0, 3), curve(g, 0, 3, C.orange)],
          [dot(p(0, 0), "0"), dot(p(3, 1), "3")],
          [
            surface(
              [...curve(f, 0, 3).points, ...curve(g, 0, 3).points.reverse()],
              C.blue,
            ),
          ],
        ),
      ),
      S(
        "경계에서 적분 분리",
        R`S=\int_0^1\frac{7x-x^2}{3}dx+\int_1^3\frac{-x^2+x+6}{3}dx=\frac72`,
        "윗함수 f에서 아랫함수 g를 빼고 x=1을 기준으로 나눈다.",
        model(
          [0, 3.2, 0, 2.5],
          [curve((x) => f(x) - g(x), 0, 3, C.green)],
          [],
          [
            area((x) => f(x) - g(x), 0, 1, C.blue),
            area((x) => f(x) - g(x), 1, 3, C.green),
          ],
          { metrics: [metric("S", "7/2"), metric("4S", "14")] },
        ),
      ),
    ],
    [
      chk(
        "넓이 적분",
        integrate((x) => f(x) - g(x), 0, 1, 10000) +
          integrate((x) => f(x) - g(x), 1, 3, 20000),
        3.5,
        1e-8,
      ),
    ],
  );
}
{
  const x1 = (t) => t ** 3 - 2 * t * t + 3 * t,
    x2 = (t) => t * t + 12 * t,
    v1 = (t) => 3 * t * t - 4 * t + 3,
    v2 = (t) => 2 * t + 12;
  add(
    "2020-b-27",
    "같은 속도의 시각과 두 위치의 차",
    "P의 위치 t³−2t²+3t, Q의 위치 t²+12t",
    "27",
    [
      S(
        "위치를 미분하여 속도",
        R`v_P=3t^2-4t+3,\quad v_Q=2t+12`,
        "위치가 같은 시각이 아니라 속도가 같은 시각을 구한다.",
        model([0, 4, 0, 40], [curve(v1, 0, 4), curve(v2, 0, 4, C.orange)]),
      ),
      S(
        "시각의 정의역으로 해 선택",
        R`3t^2-6t-9=0\implies t=-1,3;\quad t\ge0\implies t=3`,
        "음의 해 −1은 시각의 조건에 맞지 않는다.",
        model(
          [0, 4, 0, 40],
          [curve(v1, 0, 4), curve(v2, 0, 4, C.orange)],
          [dot(p(3, 18), "같은 속도 18")],
        ),
      ),
      S(
        "그 순간의 위치로 이동",
        R`x_P(3)=18,\quad x_Q(3)=45\implies|45-18|=27`,
        "속도 그래프에서 찾은 t=3을 두 위치 함수에 대입한다.",
        model(
          [0, 50, 0, 1],
          [line(p(18, 0.5), p(45, 0.5), C.green)],
          [dot(p(18, 0.5), "P:18"), dot(p(45, 0.5), "Q:45")],
          [],
          { metrics: [metric("거리", "27")] },
        ),
      ),
    ],
    [chk("같은 속도", v1(3), v2(3)), chk("두 위치 거리", x2(3) - x1(3), 27)],
  );
}
{
  const f = (x) => 1.5 * x + 1;
  add(
    "2020-b-28",
    "모든 구간에서 정확한 사다리꼴 공식",
    "∫1ˣf=(x−1)(f(x)+f(1))/2인 다항함수, f(0)=1",
    "7",
    [
      S(
        "최고차항 계수 비교",
        R`\deg f=n:\quad\frac{c}{n+1}=\frac c2\implies n=1`,
        "상수함수도 첫 조건은 만족하지만 두 번째 적분 조건과 f(0)=1에는 맞지 않는다.",
        model([0, 3, 0, 3], [line(p(1, 1), p(2, 2), C.muted)], [], [], {
          metrics: [metric("확정된 형태", "f(x)=ax+1")],
        }),
      ),
      S(
        "두 적분을 a로 표현",
        R`\int_0^2(ax+1)dx=2a+2,\quad5\int_{-1}^1x(ax+1)dx=10a/3`,
        "대칭 구간에서 홀함수 x의 적분은 0이다.",
        model(
          [-1, 2, -1, 4.5],
          [curve(f, -1, 2)],
          [],
          [area(f, 0, 2, C.blue), area((x) => x * f(x), -1, 1, C.orange)],
        ),
      ),
      S(
        "계수 결정",
        R`2a+2=10a/3\implies a=3/2`,
        "첫 적분의 기울기 계수를 구해 함수를 확정한다.",
        model(
          [0, 2.2, 0, 5],
          [curve(f, 0, 2)],
          [dot(p(0, 1), "f(0)=1")],
          [surface([p(1), p(2), p(2, f(2)), p(1, f(1))], C.green)],
        ),
      ),
      S(
        "목표점 평가",
        R`f(4)=\frac32\cdot4+1=7`,
        "선형 함수에서 사다리꼴 넓이 공식이 모든 x에 대해 정확히 성립한다.",
        model(
          [0, 4.5, 0, 8],
          [curve(f, 0, 4.5, C.green)],
          [dot(p(4, 7), "f(4)=7")],
        ),
      ),
    ],
    [
      chk(
        "두 번째 적분 조건",
        integrate(f, 0, 2, 10000),
        5 * integrate((x) => x * f(x), -1, 1, 20000),
        1e-7,
      ),
      chk("목표값", f(4), 7),
    ],
  );
}
{
  const a = 32 / 9,
    b = -16 / 3,
    f = (x) => a * x ** 3 + b * x * x + x;
  add(
    "2020-b-30",
    "두 직선과 각각 두 교점인 삼차함수",
    "f(0)=0, f−x와 f+x가 각각 서로 다른 실근 두 개, f′(1)=1",
    "51",
    [
      S(
        "공통 근 0을 분리",
        R`f(x)=ax^3+bx^2+cx,\quad f(x)\mp x=x(ax^2+bx+c\mp1)`,
        "각 이차식의 판별식은 D₋와 D₊이며 D₋−D₊=8a>0이다.",
        model([-1, 3, 0, 2], [], [dot(p(0, 0.5), "공통 실근 0")], [], {
          metrics: [metric("판별식 관계", "D₋>D₊")],
        }),
      ),
      S(
        "큰 판별식 쪽의 근이 0과 겹침",
        R`c=1,\quad b\ne0,\quad b^2-8a=0`,
        "D₋=0이면 D₊<0이 되어 f+x의 실근이 하나뿐이다. 따라서 f−x에서는 이차식의 한 근이 0과 겹치고 f+x에서는 중근이 생겨야 한다.",
        model(
          [-0.3, 2, -1, 5],
          [
            curve((x) => f(x) - x, -0.3, 2),
            curve((x) => f(x) + x, -0.3, 2, C.orange),
          ],
          [
            dot(p(0, 0), "공통 0"),
            dot(p(0.75, 0), "f+x의 중근"),
            dot(p(1.5, 0), "f−x의 다른 근"),
          ],
        ),
      ),
      S(
        "미분 조건을 연립",
        R`3a+2b+1=1,\quad b=-3a/2,\quad b^2=8a\implies a=32/9,\ b=-16/3`,
        "a>0 조건으로 a=0인 해를 제외한다.",
        model(
          [0, 2, 0, 10],
          [
            curve((x) => 3 * a * x * x + 2 * b * x + 1, 0, 2, C.green),
            line(p(0, 1), p(2, 1), C.orange),
          ],
          [dot(p(1, 1), "f′(1)=1")],
        ),
      ),
      S(
        "원래 그래프의 두 직선 확인",
        R`f(x)=\frac{32}{9}x^3-\frac{16}{3}x^2+x`,
        "y=x는 0에서 접하고 x=3/2에서 다시 만난다. y=−x는 x=3/4에서 접한다.",
        model(
          [-0.2, 1.8, -2, 4],
          [
            curve(f, -0.2, 1.8),
            curve((x) => x, -0.2, 1.8, C.green),
            curve((x) => -x, -0.2, 1.8, C.orange),
          ],
          [dot(p(0.75, -0.75), "접점"), dot(p(1.5, 1.5), "교점")],
        ),
      ),
      S(
        "목표값",
        R`f(3)=96-48+3=51`,
        "결정된 계수로 x=3의 함수값을 계산한다.",
        model(
          [0, 3.2, -2, 65],
          [curve(f, 0, 3.2, C.green)],
          [dot(p(3, 51), "51")],
        ),
      ),
    ],
    [
      chk("미분 조건", 3 * a + 2 * b + 1, 1),
      chk("중근 판별식", b * b - 8 * a, 0),
      chk("목표값", f(3), 51),
    ],
  );
}

// 2020, type A.
{
  const f = (x) => (6 * x) / (Math.exp(4 * x) - Math.exp(2 * x));
  add(
    "2020-a-2",
    "지수의 차에서 공통 인자 분리",
    "6x/(e⁴ˣ−e²ˣ)의 극한",
    "3",
    [
      S(
        "분모의 두 지수함수",
        R`e^{4x}-e^{2x}=e^{2x}(e^{2x}-1)`,
        "공통 인자 e²ˣ를 묶는다.",
        model(
          [-0.4, 0.4, 0, 6],
          [
            curve((x) => Math.exp(4 * x), -0.4, 0.4),
            curve((x) => Math.exp(2 * x), -0.4, 0.4, C.orange),
          ],
        ),
      ),
      S(
        "기본 극한의 증가량 일치",
        R`\frac{6x}{e^{2x}(e^{2x}-1)}=3e^{-2x}\frac{2x}{e^{2x}-1}`,
        "u=2x에서 u/(eᵘ−1)→1을 적용한다.",
        model(
          [-0.4, 0.4, 0.5, 1.8],
          [
            curve((x) => (2 * x) / Math.expm1(2 * x), -0.4, -0.001),
            curve((x) => (2 * x) / Math.expm1(2 * x), 0.001, 0.4),
            line(p(-0.4, 1), p(0.4, 1), C.green),
          ],
        ),
      ),
      S(
        "상수배의 극한",
        R`3\cdot1\cdot1=3`,
        "좌우 비율이 모두 3으로 모인다.",
        model(
          [-0.4, 0.4, 0, 10],
          [
            curve(f, -0.4, -0.001),
            curve(f, 0.001, 0.4),
            line(p(-0.4, 3), p(0.4, 3), C.green),
          ],
          [dot(p(0, 3), "3", C.green, { open: true })],
        ),
      ),
    ],
    [
      chk(
        "안정식의 극한",
        3 * Math.exp(-2e-8) * (2e-8 / Math.expm1(2e-8)),
        3,
        1e-6,
      ),
    ],
  );
}
{
  const angles = [PI / 3, (2 * PI) / 3, (4 * PI) / 3, (5 * PI) / 3],
    valid = [(2 * PI) / 3, (5 * PI) / 3];
  add(
    "2020-a-7",
    "방정식의 각을 사분면 조건으로 걸러내기",
    "0<x<2π, 4cos²x−1=0과 sin x cos x<0",
    "7π/3",
    [
      S(
        "코사인의 두 값",
        R`4\cos^2x-1=0\implies\cos x=\pm1/2`,
        "단위원에서 x좌표가 ±1/2인 네 점을 찾는다.",
        model(
          [-1.3, 1.3, -1.3, 1.3],
          [
            circle(0, 0, 1),
            line(p(0.5, -1), p(0.5, 1), C.orange),
            line(p(-0.5, -1), p(-0.5, 1), C.orange),
          ],
          angles.map((t) =>
            dot(p(Math.cos(t), Math.sin(t)), `${round(t / PI)}π`),
          ),
          [],
          { equalAspect: true },
        ),
      ),
      S(
        "곱이 음수인 사분면",
        R`\sin x\cos x<0\iff x\text{가 제2 또는 제4사분면}`,
        "사인과 코사인의 부호가 반대인 두 점만 남는다.",
        model(
          [-1.3, 1.3, -1.3, 1.3],
          [circle(0, 0, 1)],
          valid.map((t) =>
            dot(p(Math.cos(t), Math.sin(t)), t < PI ? "2π/3" : "5π/3", C.green),
          ),
          [],
          { equalAspect: true },
        ),
      ),
      S(
        "각의 합",
        R`2\pi/3+5\pi/3=7\pi/3`,
        "각의 위치를 실수축으로 옮겨 더한다.",
        model(
          [0, 2 * PI, 0, 1],
          [],
          valid.map((t) => dot(p(t, 0.5), t < PI ? "2π/3" : "5π/3", C.green)),
          [],
          { metrics: [metric("합", "7π/3")] },
        ),
      ),
    ],
    [
      chk(
        "각의 합",
        valid.reduce((a, b) => a + b, 0),
        (7 * PI) / 3,
      ),
    ],
  );
}
{
  const f = (x) => (Math.log(x) - 1) / (x * x),
    F = (x) => -Math.log(x) / x;
  add(
    "2020-a-8",
    "로그 몫의 미분을 역으로 읽는 적분",
    "∫eᵉ²(ln x−1)/x² dx",
    "(e−2)/e²",
    [
      S(
        "적분 구간과 부호",
        R`\int_e^{e^2}\frac{\ln x-1}{x^2}dx`,
        "x≥e에서 분자가 0 이상이다.",
        model([2.5, 8, 0, 0.08], [curve(f, E, E * E)], [], [area(f, E, E * E)]),
      ),
      S(
        "로그 몫의 도함수",
        R`\left(\frac{\ln x}{x}\right)'=\frac{1-\ln x}{x^2}`,
        "피적분함수는 ln x/x의 도함수에 음수를 붙인 것이다.",
        model(
          [2.5, 8, -0.4, 0],
          [curve(F, E, E * E, C.green)],
          [dot(p(E, F(E)), "−1/e"), dot(p(E * E, F(E * E)), "−2/e²")],
        ),
      ),
      S(
        "양 끝값 계산",
        R`[-\ln x/x]_e^{e^2}=\frac1e-\frac2{e^2}=\frac{e-2}{e^2}`,
        "로그 경계를 지수의 정수배로 환원한다.",
        model(
          [2.5, 8, 0, 0.08],
          [curve(f, E, E * E, C.green)],
          [],
          [area(f, E, E * E, C.green)],
          { metrics: [metric("정적분", "(e−2)/e²")] },
        ),
      ),
    ],
    [chk("적분", integrate(f, E, E * E, 20000), (E - 2) / (E * E), 1e-8)],
  );
}
{
  const beta = Math.atan(1.5),
    alpha = PI - 2 * beta;
  add(
    "2020-a-10",
    "이등변삼각형의 각 관계와 배각 공식",
    "AB=AC, tan(α+β)=−3/2에서 tan α",
    "12/5",
    [
      S(
        "내각 합",
        R`\alpha+2\beta=\pi\implies\alpha+\beta=\pi-\beta`,
        "밑각 두 개가 같으므로 α+β를 β 하나로 나타낼 수 있다.",
        model(
          [-1.3, 1.3, 0, 1.8],
          [path([p(-1), p(1), p(0, 1.5), p(-1)])],
          [dot(p(0, 1.5), "α"), dot(p(-1), "β"), dot(p(1), "β")],
          [],
          { equalAspect: true },
        ),
      ),
      S(
        "보각의 탄젠트",
        R`\tan(\alpha+\beta)=-\tan\beta=-3/2\implies\tan\beta=3/2`,
        "직각삼각형으로 밑각의 세로:가로 비를 3:2로 표시한다.",
        model(
          [0, 2.3, 0, 3.3],
          [path([p(0), p(2), p(2, 3), p(0)])],
          [dot(p(2, 3), "세로 3"), dot(p(2), "가로 2")],
          [],
          { equalAspect: true },
        ),
      ),
      S(
        "배각 공식",
        R`\tan\alpha=-\tan2\beta=-\frac{2(3/2)}{1-(3/2)^2}=\frac{12}{5}`,
        "분모가 음수여서 최종 탄젠트는 양수다.",
        model(
          [0, 1.3, 0, 2.8],
          [
            line(p(0), p(1, 12 / 5), C.green),
            line(p(1, 0), p(1, 12 / 5), C.orange),
          ],
          [dot(p(1, 12 / 5), "tan α=12/5")],
        ),
      ),
    ],
    [chk("각 관계", Math.tan(alpha), 12 / 5)],
  );
}
{
  add(
    "2020-a-11",
    "두 번째 도함수가 부호를 바꾸는 매개변수",
    "y=ax²−2sin2x가 변곡점을 갖는 정수 a의 개수",
    "7",
    [
      S(
        "두 번 미분",
        R`y''=2a+8\sin2x`,
        "변곡점은 y″=0인 것에 더해 부호가 바뀌어야 한다.",
        model(
          [0, 2 * PI, -9, 9],
          [
            curve((x) => 8 * Math.sin(2 * x), 0, 2 * PI, C.blue, 160),
            line(p(0, 0), p(2 * PI, 0), C.orange),
          ],
        ),
      ),
      S(
        "수평선과 진폭의 내부 교차",
        R`\sin2x=-a/4\text{ 에서 부호 변화}\iff-4<a<4`,
        "a=±4에서는 y″가 0에 닿기만 하므로 제외한다.",
        model(
          [0, 2 * PI, -1.2, 1.2],
          [
            curve((x) => Math.sin(2 * x), 0, 2 * PI, C.blue, 160),
            line(p(0, 0.75), p(2 * PI, 0.75), C.green),
            line(p(0, 1), p(2 * PI, 1), C.muted),
          ],
          [],
          [],
          {
            metrics: [
              metric("내부 교차", "|a|<4"),
              metric("접촉만 발생", "a=±4 제외"),
            ],
          },
        ),
      ),
      S(
        "정수 세기",
        R`a\in\{-3,-2,-1,0,1,2,3\}\implies7\text{개}`,
        "열린 구간 (−4,4)에 들어 있는 정수만 센다.",
        model(
          [-4.5, 4.5, 0, 1],
          [],
          Array.from({ length: 7 }, (_, i) =>
            dot(p(i - 3, 0.5), String(i - 3), C.green),
          ).concat([
            dot(p(-4, 0.5), "제외", C.muted, { open: true }),
            dot(p(4, 0.5), "제외", C.muted, { open: true }),
          ]),
        ),
      ),
    ],
    [
      chk(
        "허용 정수 개수",
        Array.from({ length: 9 }, (_, i) => i - 4).filter(
          (a) => Math.abs(a) < 4,
        ).length,
        7,
      ),
    ],
  );
}
{
  const k = Math.log(13),
    A = (x) => Math.exp(x) / (1 + Math.exp(x)),
    s = (x) => Math.sqrt(A(x));
  add(
    "2020-a-12",
    "로지스틱 단면적의 부피로 경계 결정",
    "한 변 √(eˣ/(eˣ+1))인 정사각형 단면의 0≤x≤k 부피가 ln7",
    "ln 13",
    [
      S(
        "밑면의 길이에서 단면적",
        R`A(x)=\frac{e^x}{e^x+1}`,
        "정사각형 한 변의 제곱이 단면적이다. 오른쪽 경계는 마지막에 구할 k다.",
        model([0, 3, 0, 1.1], [curve(A, 0, 3)], [], [], {
          metrics: [metric("적분 구간", "0≤x≤k")],
        }),
      ),
      S(
        "로그 원시함수",
        R`V(k)=[\ln(1+e^x)]_0^k=\ln\frac{1+e^k}{2}`,
        "분자 eˣ는 분모 1+eˣ의 도함수다.",
        model(
          [0, 3, 0, 2.5],
          [
            curve((x) => Math.log((1 + Math.exp(x)) / 2), 0, 3),
            line(p(0, Math.log(7)), p(3, Math.log(7)), C.orange),
          ],
          [dot(p(k, Math.log(7)), "V=ln7")],
        ),
      ),
      S(
        "경계값 결정",
        R`\frac{1+e^k}{2}=7\implies e^k=13\implies k=\ln13`,
        "확정된 구간에서 실제 단면을 쌓아 부피를 나타낸다.",
        model(
          [0, 3, 0, 1.1],
          [],
          [],
          Array.from({ length: 10 }, (_, i) => {
            const x = (k * i) / 9,
              h = s(x);
            return surface(
              [p(x, 0, 0), p(x, h, 0), p(x, h, h), p(x, 0, h)],
              C.green,
              0.25,
            );
          }),
          { threeD: true, equalAspect: true, metrics: [metric("k", "ln13")] },
        ),
      ),
    ],
    [chk("부피 조건", integrate(A, 0, k, 20000), Math.log(7), 1e-8)],
  );
}
{
  const rt = Math.sqrt(3),
    av = [Math.sqrt(3), 3 ** (1 / 6)];
  add(
    "2020-a-15",
    "직각 조건을 지수함수 교점의 가로좌표로",
    "y=aˣ와 y=√3의 교점 A, OA⊥AB, B=(4,0)",
    "3^(2/3)",
    [
      S(
        "교점의 미정 좌표",
        R`A=(u,\sqrt3),\quad a^u=\sqrt3`,
        "a>1이므로 u>0이다. 높이는 고정되어 있다.",
        model(
          [0, 4.5, 0, 2.5],
          [line(p(0, rt), p(4, rt), C.orange)],
          [dot(p(0), "O"), dot(p(4), "B")],
          [],
          { metrics: [metric("A의 조건", "y=√3")] },
        ),
      ),
      S(
        "수직 조건의 이차방정식",
        R`\frac{\sqrt3}{u}\frac{-\sqrt3}{4-u}=-1\implies u(4-u)=3`,
        "두 직선의 기울기를 곱하거나 OA·AB=0을 사용한다.",
        model(
          [0, 4.5, 0, 2.5],
          [
            path([p(0), p(1, rt), p(4)], C.blue),
            path([p(0), p(3, rt), p(4)], C.green),
          ],
          [dot(p(1, rt), "u=1"), dot(p(3, rt), "u=3")],
          [],
          { equalAspect: true },
        ),
      ),
      S(
        "두 밑의 곱",
        R`a=3^{1/2}\text{ 또는 }3^{1/6}\implies\prod a=3^{2/3}`,
        "교점의 두 가능한 가로좌표를 지수방정식에 각각 대입한다.",
        model(
          [0, 4, 0, 4],
          [
            curve((x) => av[0] ** x, 0, 2.4),
            curve((x) => av[1] ** x, 0, 4, C.green),
            line(p(0, rt), p(4, rt), C.orange),
          ],
          [dot(p(1, rt), "√3"), dot(p(3, rt), "3^(1/6)")],
        ),
      ),
    ],
    [chk("밑의 곱", av[0] * av[1], 3 ** (2 / 3))],
  );
}
{
  const g = (t) => (t - 1) * Math.exp(t) - t - 1,
    gp = (t) => t * Math.exp(t) - 1,
    c = bisect(g, 1, 2);
  add(
    "2020-a-21",
    "절댓값 미분 가능성의 최소 수직 이동",
    "eˣ의 접선 f와 |f+k−ln x|가 미분 가능한 최소 k=g(t)",
    "ㄱ, ㄴ, ㄷ",
    [
      S(
        "절댓값 안쪽의 최소점",
        R`H(x)=e^t x+(1-t)e^t-\ln x+k,\quad H'(x)=e^t-1/x`,
        "H″=1/x²>0이고 양 끝에서 +∞로 가므로 최소점 x=e⁻ᵗ 하나를 갖는다.",
        model(
          [0.1, 4, -1, 4],
          [curve((x) => x - Math.log(x) - 1, 0.1, 4)],
          [dot(p(1, 0), "t=0일 때 최소점")],
          [],
          { metrics: [metric("최소가 0 이상", "절댓값의 뾰족점 없음")] },
        ),
      ),
      S(
        "최소값을 0에 맞춘 이동량",
        R`g(t)=(t-1)e^t-t-1`,
        "최솟값을 음수로 내리면 단순한 영점 두 개에서 절댓값이 미분 불가능해진다.",
        model([-3, 2, -3, 5], [curve(g, -3, 2)], [dot(p(0, -2), "g(0)=−2")]),
      ),
      S(
        "음의 넓이와 대칭인 영점",
        R`g(0)=-2<0,\quad g(-t)=e^{-t}g(t)`,
        "0 근처의 적분은 음수다. 양의 인자 e⁻ᵗ 때문에 영점은 서로 반대 위치에 나타난다.",
        model(
          [-2, 2, -3, 3],
          [curve(g, -2, 2)],
          [dot(p(-c, 0), "α=−c"), dot(p(c, 0), "β=c")],
          [area(g, -c, c, C.orange)],
        ),
      ),
      S(
        "적분이 최소인 구간",
        R`g'(t)=te^t-1;\quad g<0\text{ 는 }(-c,c),\quad c>1`,
        "g는 음수 구간 바깥에서 양수다. 적분을 최소로 하려면 음수 구간 전체를 선택한다.",
        model(
          [-2, 2, -3, 3],
          [curve(g, -2, 2, C.green)],
          [dot(p(-c, 0), "−c"), dot(p(c, 0), "c"), dot(p(1, g(1)), "g(1)=−2")],
          [area(g, -c, c, C.green)],
        ),
      ),
      S(
        "기울기 비의 부호와 크기",
        R`\frac{1+g'(\beta)}{1+g'(\alpha)}=\frac{ce^c}{-ce^{-c}}=-e^{2c}<-e^2`,
        "c>1이므로 세 보기 ㄱ, ㄴ, ㄷ이 모두 참이다.",
        model(
          [-2, 2, -12, 12],
          [curve((t) => 1 + gp(t), -2, 2, C.orange)],
          [dot(p(-c, 1 + gp(-c)), "분모 <0"), dot(p(c, 1 + gp(c)), "분자 >0")],
          [],
          { metrics: [metric("참인 보기", "ㄱ, ㄴ, ㄷ")] },
        ),
      ),
    ],
    [
      chk("영점 대칭", g(-c), 0),
      chk("기울기 비", (1 + gp(c)) / (1 + gp(-c)), -Math.exp(2 * c)),
      chk("양의 영점 위치", c > 1 ? 1 : 0, 1),
    ],
  );
}
{
  const f = (x) => x ** 3 * Math.log(x),
    d = (x) => x * x * (3 * Math.log(x) + 1);
  add(
    "2020-a-22",
    "곱의 미분에서 공통 x² 분리",
    "f=x³ln x에서 f′(e)/e²",
    "4",
    [
      S(
        "두 인자의 곱",
        R`f'(x)=3x^2\ln x+x^3\cdot1/x`,
        "다항식과 로그함수를 각각 미분한 두 항을 더한다.",
        model([0.2, 3, 0, 32], [curve(f, 0.2, 3)], [dot(p(E, E ** 3), "x=e")]),
      ),
      S(
        "공통 인자 분리",
        R`f'(x)=x^2(3\ln x+1)`,
        "요구하는 분모 e²가 도함수의 공통 인자와 상쇄된다.",
        model(
          [0.2, 3, -5, 5],
          [curve((x) => 3 * Math.log(x) + 1, 0.2, 3, C.green)],
          [dot(p(E, 4), "3 ln e+1")],
        ),
      ),
      S(
        "로그 값 대입",
        R`\frac{f'(e)}{e^2}=3\ln e+1=4`,
        "ln e=1을 대입한다.",
        model(
          [0.2, 3, -5, 5],
          [
            curve((x) => 3 * Math.log(x) + 1, 0.2, 3, C.green),
            line(p(0.2, 4), p(3, 4), C.orange),
          ],
          [dot(p(E, 4), "4")],
        ),
      ),
    ],
    [chk("목표값", d(E) / (E * E), 4)],
  );
}
{
  const ratio = (t) => Math.sqrt(1 + (Math.sin(t) / t) ** 2) + Math.sin(t) / t;
  const scene = (t) => {
    const P = p(t, Math.sin(t)),
      r = Math.sin(t),
      dist = Math.hypot(...P.slice(0, 2)),
      Rr = p(P[0] * (1 - r / dist), P[1] * (1 - r / dist));
    return model(
      [-0.1, 1.8, -0.1, 1.8],
      [
        curve(Math.sin, 0, 1.5),
        circle(P[0], P[1], r),
        line(p(0), P, C.orange),
        line(P, p(t, 0), C.muted),
      ],
      [dot(P, "P"), dot(p(t, 0), "Q"), dot(Rr, "R")],
      [],
      { equalAspect: true },
    );
  };
  add(
    "2020-a-24",
    "원과 직선의 거리 차를 유리화",
    "P=(t,sin t) 중심 원의 반지름 sin t, OQ/OR의 t→0⁺ 극한",
    "2",
    [
      S(
        "반지름과 원점 거리",
        R`PQ=PR=\sin t,\quad OP=\sqrt{t^2+\sin^2t}`,
        "원은 x축에 접하므로 반지름이 sin t다.",
        scene(0.65),
      ),
      S(
        "선분에서 반지름 빼기",
        R`OR=\sqrt{t^2+\sin^2t}-\sin t,\quad OQ=t`,
        "R은 선분 OP 위에 있으므로 OR=OP−PR이다.",
        scene(0.3),
      ),
      S(
        "켤레로 유리화",
        R`\frac{OQ}{OR}=\sqrt{1+(\sin t/t)^2}+\sin t/t\to\sqrt2+1`,
        "분모를 유리화하면 t²가 남아 기본 사인 극한을 적용할 수 있다.",
        model(
          [0, 1, 2, 2.6],
          [curve(ratio, 0.001, 1, C.green)],
          [dot(p(0, 1 + Math.SQRT2), "1+√2", C.green, { open: true })],
          [],
          { metrics: [metric("a+b", "1+1=2")] },
        ),
      ),
    ],
    [chk("극한", ratio(1e-6), 1 + Math.SQRT2, 1e-8)],
  );
}
{
  const f = (x) => (x * x + 2) * Math.exp(-x),
    inv = (y) => bisect((x) => f(x) - y, -5, 15),
    g = (u) => inv(10 * u - 8);
  add(
    "2020-a-26",
    "역함수와 입력 축소의 연쇄법칙",
    "f=(x²+2)e⁻ˣ, g((x+8)/10)=f⁻¹(x), g(1)=0",
    "5",
    [
      S(
        "대응점 확인",
        R`f(0)=2,\quad (2+8)/10=1,\quad g(1)=0`,
        "x=2를 넣으면 g의 입력이 1이 된다.",
        model([-1, 4, 0, 9], [curve(f, -1, 4)], [dot(p(0, 2), "f(0)=2")]),
      ),
      S(
        "합성으로 역함수 제거",
        R`f(g((x+8)/10))=x\implies f'(g(\cdot))g'(\cdot)/10=1`,
        "안쪽 입력의 미분계수 1/10을 함께 곱한다.",
        model(
          [0.9, 1.4, -1, 2],
          [curve(g, 0.9, 1.4, C.green)],
          [dot(p(1, 0), "g(1)=0")],
        ),
      ),
      S(
        "도함수 값과 절댓값",
        R`f'(0)=-2,\quad-2g'(1)=10\implies g'(1)=-5,\ |g'(1)|=5`,
        "원래 함수는 감소하므로 역함수와 g의 기울기도 음수다.",
        model(
          [0.9, 1.4, -1, 2],
          [
            curve(g, 0.9, 1.4, C.green),
            curve((u) => -5 * (u - 1), 0.9, 1.4, C.orange),
          ],
          [dot(p(1, 0), "기울기 −5")],
        ),
      ),
    ],
    [
      chk("역함수 조건", g(1), 0),
      chk("미분 검산", (g(1.000001) - g(0.999999)) / 0.000002, -5, 1e-7),
    ],
  );
}
{
  const d = bisect((u) => u * Math.log(u) - 1, 1, 3),
    F = (t) => t + d - 3 * Math.log(t) + Math.log(2 * d),
    t = 1 / 3,
    a = F(t),
    y1 = (x) => t ** 3 * Math.log(x - t),
    y2 = (x) => 2 * Math.exp(x - a);
  add(
    "2020-a-30",
    "유일한 교점을 접선 조건으로 바꾸기",
    "t³ln(x−t)와 2e^(x−a)가 한 점에서 만나는 a=f(t)",
    "64",
    [
      S(
        "증가하지만 굽음이 반대인 두 곡선",
        R`y_1=t^3\ln(x-t),\quad y_2=2e^{x-a},\quad x>t`,
        "차 y₁−y₂는 엄격히 오목하고 양 끝에서 음수다. 교점이 한 개이려면 최대값이 0이어야 한다.",
        model(
          [0.35, 4, -0.15, 0.2],
          [curve(y1, 0.35, 4), curve(y2, 0.35, 4, C.orange)],
          [dot(p(t + d, y1(t + d)), "접점")],
        ),
      ),
      S(
        "함숫값과 기울기 동시 일치",
        R`t^3\ln(\alpha-t)=2e^{\alpha-a},\quad\frac{t^3}{\alpha-t}=2e^{\alpha-a}`,
        "두 식을 나누면 접점까지의 수평 거리 d=α−t가 일정함을 알 수 있다.",
        model(
          [0.8, 3, 0, 2],
          [
            curve((u) => Math.log(u), 0.8, 3),
            curve((u) => 1 / u, 0.8, 3, C.orange),
          ],
          [dot(p(d, 1 / d), "ln d=1/d")],
        ),
      ),
      S(
        "접점 거리와 이동량",
        R`d\ln d=1,\quad a=t+d-3\ln t+\ln(2d)`,
        "초월상수 d를 정확한 수치로 풀지 않아도 t에 대한 미분에서는 상수로 사라진다.",
        model(
          [0.15, 2.5, 0, 10],
          [curve(F, 0.15, 2.5, C.green)],
          [dot(p(t, a), "t=1/3")],
        ),
      ),
      S(
        "기울기 계산",
        R`f'(t)=1-3/t\implies f'(1/3)=-8`,
        "유일한 교점 조건이 만든 a의 변화율을 계산한다.",
        model(
          [0.15, 1, 0, 10],
          [
            curve(F, 0.15, 1, C.green),
            curve((u) => a - 8 * (u - t), 0.15, 1, C.orange),
          ],
          [dot(p(t, a), "기울기 −8")],
        ),
      ),
      S(
        "제곱값",
        R`\{f'(1/3)\}^2=64`,
        "요구하는 값은 미분계수 자체가 아닌 제곱이다.",
        model(
          [0.15, 1, -20, 1],
          [curve((u) => 1 - 3 / u, 0.15, 1, C.green)],
          [dot(p(t, -8), "−8")],
          [],
          { metrics: [metric("제곱", "64")] },
        ),
      ),
    ],
    [
      chk("접선 함숫값", y1(t + d), y2(t + d)),
      chk("접선 기울기", t ** 3 / d, y2(t + d)),
      chk("변화율", (F(t + 1e-6) - F(t - 1e-6)) / 2e-6, -8, 1e-7),
    ],
  );
}

// 2021, type A (paper pages were inspected as rendered scans).
{
  const v = (n) => (Math.sqrt(4 * n * n + 2 * n + 1) + 2 * n) / (2 * n + 1);
  add(
    "2021-a-2",
    "제곱근 차의 역수를 유리화",
    "1/(√(4n²+2n+1)−2n)의 극한",
    "2",
    [
      S(
        "큰 두 수의 차",
        R`\frac1{\sqrt{4n^2+2n+1}-2n}`,
        "분모의 두 항은 발산하지만 차는 발산하지 않는다.",
        model(
          [1, 12, 0, 26],
          [
            curve((n) => Math.sqrt(4 * n * n + 2 * n + 1), 1, 12),
            curve((n) => 2 * n, 1, 12, C.orange),
          ],
        ),
      ),
      S(
        "켤레를 곱해 차 제거",
        R`\frac{\sqrt{4n^2+2n+1}+2n}{2n+1}`,
        "제곱의 차를 계산하면 분모의 n²항이 사라진다.",
        model([1, 25, 1, 2.1], [curve(v, 1, 25)], dotsN(v, 12)),
      ),
      S(
        "2n으로 나눠 극한 계산",
        R`\frac{\sqrt{1+1/(2n)+1/(4n^2)}+1}{1+1/(2n)}\to2`,
        "분자 2, 분모 1의 비율로 수렴한다.",
        model(
          [1, 25, 1, 2.1],
          [curve(v, 1, 25), line(p(1, 2), p(25, 2), C.green)],
          [],
          [],
          { metrics: [metric("극한", "2")] },
        ),
      ),
    ],
    [chk("큰 n의 비율", v(1e8), 2, 1e-7)],
  );
}
{
  const f = (x) => Math.exp(x) * (x * x - 2 * x - 7),
    d = (x) => Math.exp(x) * (x * x - 9);
  add(
    "2021-a-7",
    "지수인자의 양수성을 이용한 극값",
    "f=eˣ(x²−2x−7)의 극댓값과 극솟값의 곱",
    "−32",
    [
      S(
        "곱의 미분",
        R`f'(x)=e^x(x^2-9)=e^x(x+3)(x-3)`,
        "eˣ는 항상 양수이므로 부호는 두 일차인자가 결정한다.",
        model([-5, 4, -90, 30], [curve(f, -5, 4)], [], []),
      ),
      S(
        "부호 변화로 극대·극소 판정",
        R`x<-3:+,\quad-3<x<3:-,\quad x>3:+`,
        "−3에서 증가→감소, 3에서 감소→증가한다.",
        model(
          [-5, 4, -12, 12],
          [curve((x) => x * x - 9, -5, 4, C.green)],
          [dot(p(-3, 0), "극대"), dot(p(3, 0), "극소")],
        ),
      ),
      S(
        "지수 인자가 상쇄되는 곱",
        R`a=8e^{-3},\ b=-4e^3\implies ab=-32`,
        "극값을 곱하면 e⁻³e³=1이 된다.",
        model(
          [-5, 4, -90, 30],
          [curve(f, -5, 4)],
          [dot(p(-3, f(-3)), "8e⁻³"), dot(p(3, f(3)), "−4e³")],
          [],
          { metrics: [metric("곱", "−32")] },
        ),
      ),
    ],
    [chk("극값의 곱", f(-3) * f(3), -32), chk("정지점", d(-3) + d(3), 0)],
  );
}
{
  const f = (x) => Math.exp(2 * x),
    a = -Math.log(2),
    b = Math.log(2);
  add(
    "2021-a-8",
    "로그 경계를 지수함수 값으로 환원",
    "y=e²ˣ, x=ln(1/2), x=ln2, x축 사이 넓이",
    "15/8",
    [
      S(
        "정확한 양 끝 경계",
        R`A=\int_{\ln(1/2)}^{\ln2}e^{2x}dx`,
        "항상 양수인 곡선이므로 정적분이 곧 넓이다.",
        model(
          [-0.9, 0.9, 0, 4.5],
          [curve(f, a, b)],
          [dot(p(a, f(a)), "ln(1/2)"), dot(p(b, f(b)), "ln2")],
          [area(f, a, b)],
        ),
      ),
      S(
        "원시함수",
        R`\int e^{2x}dx=\tfrac12e^{2x}`,
        "지수 안의 2를 보정하여 1/2를 곱한다.",
        model(
          [-0.9, 0.9, 0, 2.5],
          [curve((x) => 0.5 * f(x), a, b, C.green)],
          [dot(p(a, 0.125), "1/8"), dot(p(b, 2), "2")],
        ),
      ),
      S(
        "끝값의 차",
        R`A=\frac12(4-1/4)=\frac{15}{8}`,
        "e^(2ln2)=4, e^(2ln(1/2))=1/4다.",
        model(
          [-0.9, 0.9, 0, 4.5],
          [curve(f, a, b, C.green)],
          [],
          [area(f, a, b, C.green)],
          { metrics: [metric("넓이", "15/8")] },
        ),
      ),
    ],
    [chk("적분", integrate(f, a, b, 20000), 15 / 8, 1e-8)],
  );
}
{
  const f = (x) => Math.sqrt(3 / (3 + x)),
    rect = (n) =>
      Array.from({ length: n }, (_, i) =>
        surface(
          [
            p(i / n),
            p((i + 1) / n),
            p((i + 1) / n, f((i + 1) / n)),
            p(i / n, f((i + 1) / n)),
          ],
          C.blue,
          0.35,
        ),
      );
  add(
    "2021-a-11",
    "루트 안의 n을 약분한 리만합",
    "(1/n)Σ√(3n/(3n+k))의 극한",
    "4√3−6",
    [
      S(
        "구간과 높이 읽기",
        R`\frac1n\sum_{k=1}^n\sqrt{\frac3{3+k/n}}`,
        "폭은 1/n, 오른쪽 끝점은 k/n이다.",
        model([0, 1.1, 0, 1.1], [curve(f, 0, 1)], [], rect(6)),
      ),
      S(
        "정적분으로 연결",
        R`\int_0^1\sqrt{\frac3{3+x}}dx=\sqrt3\int_3^4u^{-1/2}du`,
        "u=3+x로 바꾸면 구간이 [3,4]가 된다.",
        model(
          [2.8, 4.2, 0, 1.1],
          [curve((u) => Math.sqrt(3 / u), 3, 4, C.green)],
          [],
          [area((u) => Math.sqrt(3 / u), 3, 4, C.green)],
        ),
      ),
      S(
        "제곱근 원시함수 계산",
        R`2\sqrt3[\sqrt u]_3^4=4\sqrt3-6`,
        "오른쪽 끝점 합은 감소함수의 적분에 아래쪽에서 접근한다.",
        model([0, 1.1, 0, 1.1], [curve(f, 0, 1, C.green)], [], rect(30), {
          metrics: [metric("극한", "4√3−6")],
        }),
      ),
    ],
    [chk("수치적분", integrate(f, 0, 1, 10000), 4 * Math.sqrt(3) - 6, 1e-8)],
  );
}
{
  const A = p(0, 0),
    quad = [p(4, -2), p(4, 0), p(3, 0), p(2.5, -1.5)],
    r = 9 / 14,
    poly = (j) =>
      surface(
        quad.map((v) => p(v[0] * r ** j, v[1] * r ** j)),
        j % 2 ? C.green : C.blue,
        0.5,
      );
  add(
    "2021-a-14",
    "직각이등변삼각형이 정하는 반복 도형의 비",
    "AB₁=2, AD₁=4인 직사각형에서 색칠한 사각형을 반복",
    "441/115",
    [
      S(
        "첫 도형의 길이와 좌표",
        R`C_1=(4,-2),\ D_1=(4,0),\ E_1=(3,0),\ F_1=(5/2,-3/2)`,
        "A를 원점으로 잡았다. CE의 길이는 √5이고 CEF는 직각이등변삼각형이다.",
        model(
          [-0.2, 4.3, -2.3, 0.3],
          [
            path([A, p(0, -2), p(4, -2), p(4, 0), A]),
            path([...quad, quad[0]], C.orange),
          ],
          quad.map((v, i) => dot(v, ["C₁", "D₁", "E₁", "F₁"][i])),
          [poly(0)],
          { equalAspect: true },
        ),
      ),
      S(
        "첫 색칠 넓이",
        R`S_1=\frac12(2)(1)+\frac14(\sqrt5)^2=\frac94`,
        "삼각형 CDE와 직각이등변삼각형 CEF의 넓이를 더한다.",
        model(
          [2, 4.3, -2.3, 0.3],
          [line(quad[0], quad[2], C.orange)],
          [],
          [
            surface([quad[0], quad[1], quad[2]], C.blue),
            surface([quad[0], quad[2], quad[3]], C.green),
          ],
          { equalAspect: true },
        ),
      ),
      S(
        "다음 직사각형의 높이",
        R`C_2=(2k,-k)\in E_1F_1,\quad y=3(x-3)\implies k=9/7`,
        "새 직사각형의 가로:세로는 2:1이고 C₂는 선분 EF 위에 있다.",
        model(
          [-0.2, 4.3, -2.3, 0.3],
          [
            path([A, p(0, -2), p(4, -2), p(4, 0), A]),
            path(
              [A, p(0, -9 / 7), p(18 / 7, -9 / 7), p(18 / 7, 0), A],
              C.green,
            ),
            line(quad[2], quad[3], C.orange),
          ],
          [dot(p(18 / 7, -9 / 7), "C₂")],
          [poly(0)],
          { equalAspect: true },
        ),
      ),
      S(
        "길이비를 넓이비로 제곱",
        R`r=\frac{9/7}{2}=\frac9{14},\quad\text{넓이비}=\frac{81}{196}`,
        "같은 꼭짓점 A를 기준으로 모든 좌표가 9/14배씩 줄어든다.",
        model(
          [-0.2, 4.3, -2.3, 0.3],
          [],
          [],
          Array.from({ length: 6 }, (_, i) => poly(i)),
          { equalAspect: true },
        ),
      ),
      S(
        "등비급수 합",
        R`\lim S_n=\frac{9/4}{1-81/196}=\frac{441}{115}`,
        "서로 겹치지 않는 색칠 부분의 넓이를 모두 더한다.",
        model(
          [0, 10, 0, 4],
          [line(p(0, 441 / 115), p(10, 441 / 115), C.green)],
          dotsN((n) => ((9 / 4) * (1 - r ** (2 * n))) / (1 - r * r), 9),
          [],
          { metrics: [metric("전체 넓이", "441/115")] },
        ),
      ),
    ],
    [
      chk("C₂가 EF 위", -9 / 7, 3 * (18 / 7 - 3)),
      chk("급수 합", 9 / 4 / (1 - r * r), 441 / 115),
    ],
  );
}
{
  const f = (x) => 2 * x + 3 / x,
    g = (x) => 2 * x + 3 / x + 9;
  add(
    "2021-a-15",
    "분리된 정의역마다 적분 상수 결정",
    "x>0에서 f′=2−3/x², f(1)=5; x<0에서 g′(x)=f′(−x)",
    "2",
    [
      S(
        "양수 영역의 상수",
        R`f(x)=2x+3/x+C_1,\quad f(1)=5\implies C_1=0`,
        "0은 정의역에서 빠져 있으므로 양수·음수 구간의 적분 상수를 따로 정한다.",
        model(
          [0.3, 3.3, 0, 12],
          [curve(f, 0.3, 3.3)],
          [dot(p(1, 5), "f(1)=5")],
        ),
      ),
      S(
        "음수 영역에서 도함수 확인",
        R`g'(x)=f'(-x)=2-3/x^2\implies g(x)=2x+3/x+C_2`,
        "g′(x)=f′(−x)는 g=f(−x)라는 뜻이 아니다. 적분하면 별도의 상수가 생긴다.",
        model(
          [-3.5, -0.3, -12, 6],
          [
            curve((x) => 2 * x + 3 / x, -3.5, -0.3),
            curve(g, -3.5, -0.3, C.orange),
          ],
          [],
          [],
          { metrics: [metric("이동량", "C₂")] },
        ),
      ),
      S(
        "두 함수값 조건 사용",
        R`f(2)+g(-2)=9\implies C_2=9,\quad g(-3)=-6-1+9=2`,
        "f(2)와 g(−2)의 비상수항이 서로 상쇄된다.",
        model(
          [-3.5, -0.3, -6, 6],
          [curve(g, -3.5, -0.3, C.green)],
          [dot(p(-2, g(-2)), "g(−2)=7/2"), dot(p(-3, 2), "g(−3)=2")],
        ),
      ),
    ],
    [chk("합 조건", f(2) + g(-2), 9), chk("목표값", g(-3), 2)],
  );
}
{
  const f = (x, a) =>
    Math.abs(x) < 1
      ? 2 * x
      : Math.abs(x) === 1
        ? (a * x) / 4
        : ((a - 2) * x) / 3;
  const fm = (a) =>
    model(
      [-2, 2, -4, 4],
      [
        curve((x) => ((a - 2) * x) / 3, -2, -1),
        curve((x) => 2 * x, -1, 1, C.green),
        curve((x) => ((a - 2) * x) / 3, 1, 2),
      ],
      [
        ...[-1, 1].flatMap((x) => [
          dot(p(x, 2 * x), "안쪽 극한", C.green, { open: true }),
          dot(p(x, ((a - 2) * x) / 3), "바깥 극한", C.blue, { open: true }),
          dot(p(x, (a * x) / 4), "실제 함수값", C.orange),
        ]),
      ],
    );
  add(
    "2021-a-18",
    "수열의 극한이 만드는 세 구간과 경계값",
    "limₙ((a−2)x²ⁿ⁺¹+2x)/(3x²ⁿ+1), f(f(1))=5/4",
    "15/2",
    [
      S(
        "거듭제곱 크기로 구간 나누기",
        R`f(x)=\begin{cases}(a-2)x/3&|x|>1\\2x&|x|<1\\ax/4&x=\pm1\end{cases}`,
        "x²ⁿ은 |x|<1에서 0, |x|>1에서 무한대로 간다. 경계에서는 1이다.",
        model(
          [-2, 2, 0, 4],
          [
            curve((x) => x ** 8, -1.18, 1.18),
            line(p(-1, 0), p(-1, 4), C.orange),
            line(p(1, 0), p(1, 4), C.orange),
          ],
          [],
          [],
          { metrics: [metric("경계", "±1을 별도 대입")] },
        ),
      ),
      S(
        "합성의 입력이 안쪽인 경우",
        R`f(1)=a/4,\quad|a|<4\implies f(a/4)=a/2=5/4\implies a=5/2`,
        "후보 a=5/2는 |a|<4 조건을 만족한다.",
        fm(2.5),
      ),
      S(
        "합성의 입력이 바깥인 경우",
        R`|a|>4:\quad a(a-2)/12=5/4\implies a=5\text{ 또는 }-3`,
        "해 −3은 이 경우의 조건에 맞지 않아 제외하고 a=5만 남긴다.",
        fm(5),
      ),
      S(
        "경계 입력 검사와 합",
        R`a=\pm4\implies f(a/4)=1\ne5/4;\quad\sum a=5+5/2=15/2`,
        "경계값을 안쪽 식이나 바깥쪽 식에 대신 넣으면 잘못된 해가 생긴다.",
        model(
          [-5, 6, -2, 2],
          [line(p(-5, 1.25), p(6, 1.25), C.green)],
          [-4, -3, 2.5, 4, 5].map((a) =>
            dot(
              p(a, f(a / 4, a)),
              String(a),
              a === 2.5 || a === 5 ? C.green : C.muted,
            ),
          ),
          [],
          { metrics: [metric("합", "15/2")] },
        ),
      ),
    ],
    [
      chk("첫 후보", f(f(1, 2.5), 2.5), 1.25),
      chk("둘째 후보", f(f(1, 5), 5), 1.25),
    ],
  );
}
{
  const n = 16,
    w = (x) => PI * Math.sin(2 * n * PI * x),
    h = (x) => Math.max(0, w(x));
  add(
    "2021-a-20",
    "이진 선택함수가 남기는 양의 반파",
    "f(x)=πsin2πx, h=f(nx)g(x), g의 값은 0 또는 1, 두 적분 조건",
    "16",
    [
      S(
        "연속성이 선택 구간을 제한",
        R`f(nx)=\pi\sin2n\pi x,\quad g(x)\in\{0,1\}`,
        "h가 연속이므로 f(nx)≠0인 각 반주기에서는 g가 갑자기 바뀔 수 없다. 그림은 최종 n=16에 해당한다.",
        model([-1, 1, -3.5, 3.5], [curve(w, -1, 1, C.blue, 1024)], [], [], {
          metrics: [metric("영점", "x=k/(2n)")],
        }),
      ),
      S(
        "적분 2가 모든 양의 반파를 강제",
        R`\int_0^{1/(2n)}\pi\sin2n\pi x\,dx=1/n,\quad\int_{-1}^1\max(f(nx),0)dx=2`,
        "가능한 최대 적분 2를 얻으려면 양수 반파를 모두 선택하고 음수 반파를 모두 지워야 한다.",
        model(
          [-1, 1, -0.3, 3.5],
          [curve(h, -1, 1, C.green, 1024)],
          [],
          Array.from({ length: 2 * n }, (_, i) =>
            area(w, -1 + i / n, -1 + i / n + 1 / (2 * n), C.green, 12),
          ),
        ),
      ),
      S(
        "대칭으로 가중 적분 단순화",
        R`\int_{-1}^1xh(x)dx=\int_0^1x\pi\sin2n\pi x\,dx`,
        "x f(nx)는 짝함수다. 좌우의 선택 반파를 합치면 오른쪽 구간의 전체 적분과 같다.",
        model(
          [0, 1, -3.5, 3.5],
          [curve((x) => x * w(x), 0, 1, C.orange, 700)],
          [],
          [area((x) => x * w(x), 0, 1, C.orange, 700)],
        ),
      ),
      S(
        "부분적분과 n 결정",
        R`\int_0^1x\pi\sin2n\pi x\,dx=-\frac1{2n}=-\frac1{32}\implies n=16`,
        "경계의 cos(2nπ)=1, sin(2nπ)=0을 사용한다.",
        model(
          [0, 1, -3.5, 3.5],
          [curve((x) => x * w(x), 0, 1, C.orange, 700)],
          [],
          [],
          { metrics: [metric("가중 적분", "−1/32"), metric("n", "16")] },
        ),
      ),
    ],
    [
      chk("선택 적분", integrate(h, -1, 1, 160000), 2, 2e-7),
      chk(
        "가중 적분",
        integrate((x) => x * h(x), -1, 1, 160000),
        -1 / 32,
        1e-8,
      ),
    ],
  );
}
{
  const f = (x) => (x * x - 2 * x - 6) / (x - 1),
    d = (x) => 1 + 7 / (x - 1) ** 2;
  add(
    "2021-a-23",
    "몫을 간단히 바꾼 뒤 기울기 계산",
    "(x²−2x−6)/(x−1)의 x=0 미분계수",
    "8",
    [
      S(
        "몫과 나머지",
        R`f(x)=x-1-\frac7{x-1},\quad x\ne1`,
        "x=1은 정의역에서 제외된다. 접점 x=0과 다른 점이다.",
        model(
          [-2, 3, -12, 14],
          [curve(f, -2, 0.5), curve(f, 1.5, 3)],
          [dot(p(0, 6), "(0,6)")],
        ),
      ),
      S(
        "도함수",
        R`f'(x)=1+\frac7{(x-1)^2}`,
        "−7/(x−1)의 미분은 양수 7/(x−1)²다.",
        model(
          [-2, 3, 0, 15],
          [curve(d, -2, 0.25, C.green), curve(d, 1.75, 3, C.green)],
          [dot(p(0, 8), "f′(0)")],
        ),
      ),
      S(
        "접선 확인",
        R`f'(0)=8,\qquad y=8x+6`,
        "원래 곡선의 (0,6)에서 기울기가 8인 직선을 그린다.",
        model(
          [-1.2, 0.6, -4, 15],
          [curve(f, -1.2, 0.5), curve((x) => 8 * x + 6, -1.2, 0.6, C.orange)],
          [dot(p(0, 6), "접점")],
        ),
      ),
    ],
    [chk("미분계수", d(0), 8)],
  );
}
{
  const scene = (t) => {
    const A = p(0),
      B = p(2),
      G = p(2, 2 * Math.tan(t)),
      F = p(Math.cos(t), Math.sin(t)),
      Ee = p(Math.cos(3 * t), Math.sin(3 * t));
    return model(
      [-0.1, 2.2, -0.1, 1.5],
      [
        path([A, B, G, A]),
        curve((u) => p(Math.cos(u), Math.sin(u)), 0, 3 * t, C.orange),
        line(A, Ee, C.orange),
      ],
      [dot(F, "F"), dot(Ee, "E"), dot(G, "G")],
      [
        surface(
          [
            F,
            G,
            B,
            p(1, 0),
            ...curve((u) => p(Math.cos(u), Math.sin(u)), 0, t).points.reverse(),
          ],
          C.blue,
        ),
        surface(
          [A, ...curve((u) => p(Math.cos(u), Math.sin(u)), t, 3 * t).points],
          C.green,
        ),
      ],
      { equalAspect: true },
    );
  };
  add(
    "2021-a-24",
    "삼각형에서 부채꼴을 뺀 작은 각 넓이",
    "AB=2, 반지름 1의 부채꼴과 각 θ, 목표 40 lim f/g",
    "60",
    [
      S(
        "원호의 삼등분으로 중심각 읽기",
        R`\angle DAF=\theta,\quad\angle FAE=2\theta,\quad g(\theta)=\theta`,
        "F가 D쪽의 삼등분점이므로 AFE의 중심각은 2θ다.",
        scene(0.2),
      ),
      S(
        "삼각형에서 작은 부채꼴 빼기",
        R`BG=2\tan\theta,\quad f(\theta)=2\tan\theta-\theta/2`,
        "삼각형 ABG의 넓이에서 ADF의 넓이를 뺀다.",
        scene(0.1),
      ),
      S(
        "θ로 나누어 극한",
        R`40\frac{f}{g}=40\left(2\frac{\tan\theta}{\theta}-\frac12\right)\to40(2-1/2)=60`,
        "두 영역 모두 θ 규모로 작아지므로 θ를 먼저 약분한다.",
        model(
          [0, 0.5, 55, 70],
          [
            curve(
              (t) => 40 * ((2 * Math.tan(t)) / t - 0.5),
              0.001,
              0.5,
              C.green,
            ),
            line(p(0, 60), p(0.5, 60), C.orange),
          ],
          [dot(p(0, 60), "60", C.green, { open: true })],
        ),
      ),
    ],
    [chk("극한", 40 * ((2 * Math.tan(1e-6)) / 1e-6 - 0.5), 60, 1e-7)],
  );
}
{
  const G = (x) => x ** 3 + x + 1,
    f = (x) => x * (x - 5) ** 2,
    k = (y) => bisect((x) => G(x) - y, -5, 5),
    h = (y) => f(k(y));
  add(
    "2021-a-28",
    "절댓값의 미분 가능성이 단근 위치를 정한다",
    "f=(x−a)(x−b)², a<b, g=x³+x+1, h=f∘g⁻¹",
    "72",
    [
      S(
        "절댓값의 뾰족점을 없애는 위치",
        R`h(x)=(k(x)-a)(k(x)-b)^2,\quad k=g^{-1}`,
        "h의 단근에서는 |h|가 뾰족해진다. (x−1)|h(x)|의 미분 가능성을 위해 그 단근은 x=1이어야 한다.",
        model([0, 3, 0, 3], [curve(G, -0.5, 1)], [dot(p(0, 1), "g(0)=1")], [], {
          metrics: [metric("조건", "g(a)=1")],
        }),
      ),
      S(
        "a 결정과 대응점",
        R`g(a)=1\implies a=0,\quad k(3)=1,\quad k'(3)=1/(3+1)=1/4`,
        "g는 도함수 3x²+1이 양수이므로 역함수가 존재한다.",
        model(
          [0, 4, 0, 1.5],
          [
            curve(k, 0, 4, C.green),
            curve((y) => 1 + (y - 3) / 4, 1, 4, C.orange),
          ],
          [dot(p(3, 1), "(3,1)")],
        ),
      ),
      S(
        "합성함수 미분 조건",
        R`h'(3)=f'(1)k'(3)=\frac{(1-b)(3-b)}4=2`,
        "역함수 기울기 1/4를 곱하는 것을 빠뜨리지 않는다.",
        model(
          [-2, 6, -3, 10],
          [
            curve((b) => ((1 - b) * (3 - b)) / 4, -2, 6),
            line(p(-2, 2), p(6, 2), C.orange),
          ],
          [dot(p(-1, 2), "b=−1 제외"), dot(p(5, 2), "b=5", C.green)],
        ),
      ),
      S(
        "순서 조건으로 해 선택",
        R`b^2-4b-5=0\implies b=-1,5;\quad b>a=0\implies b=5`,
        "따라서 f(x)=x(x−5)²로 확정된다.",
        model(
          [-1, 8.5, -40, 100],
          [curve(f, -1, 8.5)],
          [dot(p(0, 0), "단근"), dot(p(5, 0), "중근")],
        ),
      ),
      S(
        "목표 함수값",
        R`f(8)=8(8-5)^2=72`,
        "확정된 함수를 x=8에서 평가한다.",
        model(
          [0, 8.5, 0, 100],
          [curve(f, 0, 8.5, C.green)],
          [dot(p(8, 72), "72")],
          [],
          { metrics: [metric("정답", "72")] },
        ),
      ),
    ],
    [
      chk("합성함수 미분", (h(3.00001) - h(2.99999)) / 0.00002, 2, 1e-7),
      chk("목표값", f(8), 72),
    ],
  );
}
{
  const a = Math.SQRT1_2,
    f = (u) => (u - a) ** 2 * (u - 1) + 0.5,
    g = (x) => f(Math.sin(PI * x) ** 2),
    p1 = Math.asin(Math.sqrt(a)) / PI;
  add(
    "2021-a-30",
    "사인 제곱의 왕복과 세 개의 같은 극댓값",
    "g(x)=f(sin²πx), (0,1)에 극대 세 개, 최댓값 1/2·최솟값 0",
    "29",
    [
      S(
        "입력의 왕복과 대칭",
        R`u=\sin^2\pi x:\quad0\to1\to0,\quad g(1-x)=g(x)`,
        "x=1/2를 중심으로 같은 함수값이 대칭적으로 나타난다.",
        model(
          [0, 1, 0, 1.1],
          [curve((x) => Math.sin(PI * x) ** 2, 0, 1)],
          [dot(p(0.5, 1), "입력의 전환점")],
        ),
      ),
      S(
        "같은 극댓값이 만드는 인수",
        R`f(u)-1/2=(u-\alpha)^2(u-1),\quad0<\alpha<1`,
        "안쪽의 극대 u=α는 중근이고, 중앙 x=1/2의 극대는 u=1에 대응한다. 아직 α를 정하지 않고 두 인수의 중복도만 표시한다.",
        model(
          [0, 3, 0, 2.5],
          [],
          [dot(p(1, 2), "α: 중복도 2"), dot(p(2, 1), "1: 중복도 1")],
          bars([2, 1], C.blue, 1),
          {
            metrics: [
              metric("가로축", "두 근의 구분"),
              metric("세로축", "f(u)−1/2의 근의 중복도"),
              metric("α의 범위", "0<α<1"),
            ],
          },
        ),
      ),
      S(
        "최솟값은 u=0에서",
        R`f((\alpha+2)/3)=1/2+4(\alpha-1)^3/27>0`,
        "가능한 α 전체에서 내부 극솟값을 비교한다. 그래프의 가로축은 u가 아니라 미정 계수 α다. 내부 극솟값은 항상 양수이므로 최솟값 0은 입력 끝점 u=0에서 얻어야 한다.",
        model(
          [-0.05, 1.05, 0, 0.6],
          [
            curve((t) => 0.5 + (4 * (t - 1) ** 3) / 27, 0, 1, C.green),
            line(p(0, 0), p(1, 0), C.muted),
          ],
          [
            dot(p(0, 0.5 - 4 / 27), "19/54", C.green, { open: true }),
            dot(p(1, 0.5), "1/2", C.green, { open: true }),
          ],
          [],
          {
            metrics: [
              metric("가로축", "미정 계수 α"),
              metric("세로축", "내부 극솟값"),
              metric("양의 하한", "19/54"),
            ],
          },
        ),
      ),
      S(
        "α를 결정하고 세 극대 확인",
        R`f(0)=1/2-\alpha^2=0\implies\alpha=1/\sqrt2`,
        "이제 그래프의 모든 상수가 확정된다. g의 세 극대는 p₁, 1/2, 1−p₁이다.",
        model(
          [0, 1, 0, 0.55],
          [curve(g, 0, 1, C.green, 220)],
          [p1, 0.5, 1 - p1].map((x) => dot(p(x, 0.5), "극대 1/2")),
        ),
      ),
      S(
        "f(2)의 유리·무리 계수",
        R`f(2)=(2-1/\sqrt2)^2+1/2=5-2\sqrt2,\quad5^2+(-2)^2=29`,
        "구한 α를 원래 삼차함수에 넣어 계산한다.",
        model(
          [0, 2.1, 0, 3],
          [curve(f, 0, 2.1, C.green)],
          [dot(p(2, f(2)), "5−2√2")],
          [],
          { metrics: [metric("a²+b²", "29")] },
        ),
      ),
    ],
    [
      chk("최솟값 조건", f(0), 0),
      chk(
        "세 극댓값",
        Math.max(...[p1, 0.5, 1 - p1].map((x) => Math.abs(g(x) - 0.5))),
        0,
      ),
      chk("목표값", f(2), 5 - 2 * Math.SQRT2),
    ],
  );
}

// 2022
{
  const v = (n) => (5 + 3 / n) / (1 - 2 / n ** 2);
  add(
    "2022-calculus-23",
    "가장 느리게 사라지는 항으로 나누기",
    "(5/n+3/n²)/(1/n−2/n³)의 극한",
    "5",
    [
      S(
        "분자와 분모의 공통 규모",
        R`\frac{5/n+3/n^2}{1/n-2/n^3}`,
        "분자와 분모에서 가장 큰 항은 모두 1/n 규모다.",
        model(
          [1, 15, 0, 6],
          [
            curve((n) => 5 / n + 3 / n ** 2, 1.5, 15),
            curve((n) => 1 / n - 2 / n ** 3, 1.5, 15, C.orange),
          ],
        ),
      ),
      S(
        "n을 곱해 0/0 제거",
        R`\frac{5+3/n}{1-2/n^2}`,
        "분자는 5, 분모는 1로 접근한다.",
        model(
          [1, 20, 0, 8],
          [
            curve((n) => 5 + 3 / n, 1, 20),
            curve((n) => 1 - 2 / n ** 2, 2, 20, C.orange),
            line(p(1, 5), p(20, 5), C.green),
          ],
        ),
      ),
      S(
        "0이 아닌 분모의 극한",
        R`\frac{5+0}{1-0}=5`,
        "n=1의 음수 항은 수열의 극한에 영향을 주지 않는다.",
        model(
          [2, 30, 4, 14],
          [curve(v, 2, 30), line(p(2, 5), p(30, 5), C.green)],
          dotsN(v, 10, 2),
          [],
          { metrics: [metric("극한", "5")] },
        ),
      ),
    ],
    [chk("극한 대입", (5 + 0) / (1 - 0), 5)],
  );
}
{
  const xy = (t) => p(t ** 3 + t, Math.exp(t));
  add(
    "2022-calculus-24",
    "합성함수의 입력 변화율을 나누기",
    "f(x³+x)=eˣ에서 f′(2)",
    "e/4",
    [
      S(
        "2를 만드는 내부 입력",
        R`x^3+x=2\iff x=1`,
        "x³+x는 엄격히 증가하므로 내부 입력 2에 대응하는 x는 1뿐이다.",
        model(
          [0, 1.5, 0, 4],
          [
            curve((x) => x ** 3 + x, 0, 1.4),
            line(p(0, 2), p(1.5, 2), C.orange),
          ],
          [dot(p(1, 2), "x=1")],
        ),
      ),
      S(
        "연쇄법칙",
        R`f'(x^3+x)(3x^2+1)=e^x`,
        "f의 그래프는 (x³+x,eˣ)라는 정확한 매개변수 곡선으로 나타낼 수 있다.",
        model([0, 4, 0, 4.5], [curve(xy, -0.2, 1.4)], [dot(xy(1), "(2,e)")]),
      ),
      S(
        "대응점에서 기울기",
        R`4f'(2)=e\implies f'(2)=e/4`,
        "가로 변화율 4로 세로 변화율 e를 나눈다.",
        model(
          [0, 4, 0, 4.5],
          [
            curve(xy, -0.2, 1.4),
            curve((u) => E + (E / 4) * (u - 2), 0, 4, C.orange),
          ],
          [dot(p(2, E), "접점")],
          [],
          { metrics: [metric("기울기", "e/4")] },
        ),
      ),
    ],
    [
      chk(
        "매개변수 차분",
        (xy(1.000001)[1] - xy(0.999999)[1]) /
          (xy(1.000001)[0] - xy(0.999999)[0]),
        E / 4,
        1e-8,
      ),
    ],
  );
}
{
  const a = 12 / 5,
    r = -1 / 5,
    seq = (n) => a * r ** (n - 1);
  add(
    "2022-calculus-25",
    "홀짝의 차와 제곱합으로 공비 결정",
    "Σ(a₂ₙ₋₁−a₂ₙ)=3, Σaₙ²=6인 등비수열",
    "2",
    [
      S(
        "수렴 조건과 두 등비급수",
        R`|r|<1,\quad\frac{a(1-r)}{1-r^2}=3,\quad\frac{a^2}{1-r^2}=6`,
        "제곱합이 유한하므로 |r|<1이다. 홀짝 차는 두 항씩 묶는다.",
        model(
          [0, 7, -0.7, 2.7],
          [],
          dotsN(seq, 6),
          bars(
            Array.from({ length: 6 }, (_, i) => seq(i + 1)),
            C.blue,
            1,
          ),
        ),
      ),
      S(
        "연립하여 공비 계산",
        R`a=3(1+r),\quad9\frac{1+r}{1-r}=6\implies r=-1/5,\ a=12/5`,
        "분모 1+r과 1−r은 0이 아니므로 약분할 수 있다.",
        model(
          [-1, 0.9, 0, 25],
          [
            curve((x) => (9 * (1 + x)) / (1 - x), -0.9, 0.4),
            line(p(-1, 6), p(0.9, 6), C.orange),
          ],
          [dot(p(-0.2, 6), "r=−1/5")],
        ),
      ),
      S(
        "원래 급수의 합",
        R`\sum a_n=\frac{12/5}{1+1/5}=2`,
        "부분합은 2를 중심으로 번갈아 접근한다.",
        model(
          [0, 10, 1.7, 2.5],
          [line(p(0, 2), p(10, 2), C.green)],
          dotsN((n) => (a * (1 - r ** n)) / (1 - r), 9),
          [],
          { metrics: [metric("합", "2")] },
        ),
      ),
    ],
    [
      chk("홀짝 차", a / (1 + r), 3),
      chk("제곱합", (a * a) / (1 - r * r), 6),
      chk("전체 합", a / (1 - r), 2),
    ],
  );
}
{
  const f = (x) => (x * x + 2 * x) / (x ** 3 + 3 * x * x + 1),
    rects = (n) =>
      Array.from({ length: n }, (_, i) =>
        surface(
          [
            p(i / n),
            p((i + 1) / n),
            p((i + 1) / n, f((i + 1) / n)),
            p(i / n, f((i + 1) / n)),
          ],
          C.blue,
          0.3,
        ),
      );
  add(
    "2022-calculus-26",
    "합의 차수를 맞추고 로그미분 찾기",
    "Σ(k²+2kn)/(k³+3k²n+n³)의 극한",
    "(ln 5)/3",
    [
      S(
        "n³으로 나누어 리만합 표시",
        R`\sum_{k=1}^n\frac1n\frac{(k/n)^2+2(k/n)}{(k/n)^3+3(k/n)^2+1}`,
        "가로 폭 1/n을 분리하면 구간 [0,1]의 오른쪽 리만합이다.",
        model([0, 1.1, 0, 0.8], [curve(f, 0, 1)], [], rects(6)),
      ),
      S(
        "정적분으로 이동",
        R`\int_0^1\frac{x^2+2x}{x^3+3x^2+1}\,dx`,
        "분모는 구간 전체에서 양수이므로 연속인 함수를 적분한다.",
        model([0, 1.1, 0, 0.8], [curve(f, 0, 1)], [], rects(28)),
      ),
      S(
        "분모의 도함수 확인",
        R`(x^3+3x^2+1)'=3(x^2+2x)`,
        "분자가 분모 도함수의 1/3이다.",
        model(
          [0, 1.1, 0, 0.8],
          [curve(f, 0, 1, C.green)],
          [],
          [area(f, 0, 1, C.green)],
          { metrics: [metric("치환 구간", "1 → 5")] },
        ),
      ),
      S(
        "로그 경계값",
        R`\frac13[\ln(x^3+3x^2+1)]_0^1=\frac13\ln5`,
        "ln1=0이므로 ln5/3이 남는다.",
        model(
          [0.8, 5.2, 0, 0.4],
          [curve((u) => 1 / (3 * u), 1, 5, C.green)],
          [],
          [area((u) => 1 / (3 * u), 1, 5, C.green)],
          { metrics: [metric("극한", "ln5/3")] },
        ),
      ),
    ],
    [chk("수치적분", integrate(f, 0, 1, 20000), Math.log(5) / 3, 1e-8)],
  );
}
{
  const xy = (t) => p((t * t) / 2, t ** 4 / 2 - Math.log(t) / 8),
    speed = (t) => 2 * t ** 3 + 1 / (8 * t),
    roots = (t) => {
      const disc = Math.sqrt(t ** 4 - Math.log(t) / 2);
      return [(t * t - disc) / 2, (t * t + disc) / 2];
    };
  add(
    "2022-calculus-27",
    "두 교점의 중점을 근과 계수로 구하기",
    "y=x²와 y=t²x−ln(t)/8의 교점 중점이 1≤t≤e에서 움직인 거리",
    "e⁴/2−3/8",
    [
      S(
        "교점의 합과 곱",
        R`u+v=t^2,\quad uv=\frac{\ln t}{8}`,
        "두 교점의 x좌표를 각각 풀지 않고 이차방정식의 근과 계수를 이용한다.",
        model(
          [-0.2, 4, 0, 16],
          [
            curve((x) => x * x, 0, 4),
            curve((x) => 4 * x - Math.log(2) / 8, 0, 4, C.orange),
          ],
          roots(2)
            .map((x) => dot(p(x, x * x), "교점"))
            .concat([dot(xy(2), "중점 P", C.green)]),
        ),
      ),
      S(
        "중점의 매개변수 식",
        R`P(t)=\left(\frac{t^2}{2},\frac{t^4}{2}-\frac{\ln t}{8}\right)`,
        "y좌표는 (u²+v²)/2=((u+v)²−2uv)/2다.",
        model(
          [0, 4, 0, 29],
          [curve(xy, 1, E)],
          [dot(xy(1), "t=1"), dot(xy(E), "t=e")],
        ),
      ),
      S(
        "속력의 완전제곱",
        R`v=\sqrt{t^2+(2t^3-1/(8t))^2}=2t^3+\frac1{8t}`,
        "제곱근 안을 완전제곱으로 묶는다. t>0이므로 양의 제곱근을 선택한다.",
        model(
          [0.8, 2.9, 0, 42],
          [curve(speed, 1, E, C.green)],
          [],
          [area(speed, 1, E, C.green)],
        ),
      ),
      S(
        "속력 적분",
        R`L=\left[\frac{t^4}{2}+\frac{\ln t}{8}\right]_1^e=\frac{e^4}{2}-\frac38`,
        "이동 거리는 위치 좌표의 차가 아니라 속력의 적분이다.",
        model([0, 4, 0, 29], [curve(xy, 1, E, C.green)], [], [], {
          metrics: [
            metric("거리", "e⁴/2−3/8"),
            metric("수치", round(E ** 4 / 2 - 3 / 8)),
          ],
        }),
      ),
    ],
    [
      chk("속력 항등식", Math.hypot(2, 16 - 1 / 16), speed(2)),
      chk("거리 적분", integrate(speed, 1, E, 40000), E ** 4 / 2 - 3 / 8, 1e-8),
    ],
  );
}
{
  const F = (x) => 6 * PI * (x - 1) ** 2,
    G = (x) => 3 * F(x) + 4 * Math.cos(F(x)),
    beta = PI - Math.asin(0.75),
    phases = [beta, beta + 2 * PI, beta + 4 * PI],
    mins = [
      1,
      ...phases.flatMap((t) => [
        1 - Math.sqrt(t / (6 * PI)),
        1 + Math.sqrt(t / (6 * PI)),
      ]),
    ].sort((a, b) => a - b);
  add(
    "2022-calculus-28",
    "안쪽 함수의 방향을 나눠 극소 세기",
    "f=6π(x−1)², g=3f+4cos f의 (0,2) 극소점 개수",
    "7",
    [
      S(
        "합성함수 미분을 두 인자로",
        R`g'(x)=12\pi(x-1)\{3-4\sin(6\pi(x-1)^2)\}`,
        "x=1과 나머지 위상 조건을 따로 검사한다.",
        model([0, 2, 0, 20], [curve(F, 0, 2)], [dot(p(1, 0), "x=1")]),
      ),
      S(
        "오른쪽 반구간에서 위상 증가",
        R`1<x<2:\quad0<f(x)<6\pi`,
        "오른쪽에서는 f′>0이므로 3−4sin t가 음수에서 양수로 바뀌는 지점이 극소다.",
        model(
          [0, 6 * PI, -1.5, 7.5],
          [curve((t) => 3 - 4 * Math.sin(t), 0, 6 * PI, C.blue, 200)],
          phases.map((t) => dot(p(t, 0), "− → +")),
        ),
      ),
      S(
        "세 위상을 두 위치로 되돌리기",
        R`t_j=\pi-\arcsin(3/4)+2j\pi\ (j=0,1,2),\quad x=1\pm\sqrt{t_j/(6\pi)}`,
        "g는 x=1에 대해 대칭이므로 오른쪽의 세 극소에 대응하는 왼쪽 극소가 세 개 있다.",
        model(
          [0, 2, 0, 63],
          [curve(G, 0, 2, C.blue, 260)],
          mins.filter((x) => x !== 1).map((x) => dot(p(x, G(x)), "극소")),
        ),
      ),
      S(
        "중앙 경계점도 검사",
        R`x=1\text{ 부근에서 }3-4\sin f(x)>0\implies g':-\to+`,
        "x=1도 별도의 극소다. 위상 방정식의 해에 포함되지 않으므로 하나를 더해야 한다.",
        model(
          [0, 2, 0, 63],
          [curve(G, 0, 2, C.green, 260)],
          mins.map((x, i) => dot(p(x, G(x)), `${i + 1}`)),
          [],
          { metrics: [metric("극소 개수", "3+1+3=7")] },
        ),
      ),
    ],
    [
      chk("극소점 수", mins.length, 7),
      chk(
        "위상 조건",
        Math.max(...phases.map((t) => Math.abs(Math.sin(t) - 0.75))),
        0,
        1e-8,
      ),
    ],
  );
}
{
  const side = (t) =>
      2 / (1 + (Math.sqrt(3) / 2) * (1 / Math.tan(t) + 1 / Math.tan(2 * t))),
    f = (t) =>
      2 * t +
      0.5 * Math.sin(4 * t) -
      (2 * Math.sin(t) * Math.sin(2 * t)) / Math.sin(3 * t),
    g = (t) => (Math.sqrt(3) / 4) * side(t) ** 2;
  const scene = (t) => {
    const a = side(t),
      H = (Math.sqrt(3) * a) / 2,
      U = p(H / Math.tan(t), H),
      T = p(2 - H / Math.tan(2 * t), H),
      S = p((U[0] + T[0]) / 2, 0),
      rx = (2 * Math.tan(2 * t)) / (Math.tan(t) + Math.tan(2 * t)),
      Rr = p(rx, rx * Math.tan(t)),
      Q = p(1 - Math.cos(4 * t), Math.sin(4 * t));
    return model(
      [-0.1, 2.1, -0.1, 1.2],
      [
        curve((u) => p(1 + Math.cos(u), Math.sin(u)), 0, PI),
        line(p(0), Rr),
        line(p(2), Q, C.orange),
        path([S, T, U, S], C.green),
      ],
      [dot(Rr, "R"), dot(Q, "Q"), dot(S, "S"), dot(T, "T"), dot(U, "U")],
      [
        surface(
          [
            p(0),
            Rr,
            Q,
            ...curve((u) => p(1 + Math.cos(u), Math.sin(u)), PI - 4 * t, PI)
              .points,
          ],
          C.blue,
        ),
        surface([S, T, U], C.green),
      ],
      { equalAspect: true },
    );
  };
  add(
    "2022-calculus-29",
    "서로 다른 차수로 작아지는 두 넓이",
    "반원과 두 각 θ, 2θ로 만든 영역 f와 정삼각형 넓이 g의 비",
    "11",
    [
      S(
        "원주각을 중심각으로",
        R`\angle AMQ=4\theta,\quad[\text{부채꼴 }AMQ]=2\theta`,
        "반지름은 1이다. 중심각 4θ인 부채꼴과 삼각형을 이용해 파란 영역을 분해한다.",
        scene(0.24),
      ),
      S(
        "파란 넓이를 세 부분으로",
        R`f(\theta)=2\theta+\tfrac12\sin4\theta-\frac{2\sin\theta\sin2\theta}{\sin3\theta}`,
        "부채꼴과 삼각형 MBQ를 더하고 삼각형 RAB를 뺀다.",
        scene(0.14),
      ),
      S(
        "정삼각형 한 변의 정확한 식",
        R`\ell=\frac2{1+\frac{\sqrt3}{2}(\cot\theta+\cot2\theta)},\quad g=\frac{\sqrt3}{4}\ell^2`,
        "높이 H=√3ℓ/2에서 양 사선 사이 폭이 ℓ가 되는 조건을 쓴다.",
        scene(0.07),
      ),
      S(
        "각 넓이의 차수 분리",
        R`\frac{f(\theta)}\theta\to\frac83,\quad\frac\ell\theta\to\frac8{3\sqrt3},\quad\frac{g(\theta)}{\theta^2}\to\frac{16\sqrt3}{27}`,
        "f는 θ 규모, g는 θ² 규모다. 같은 차수로 나눈 다음 비교한다.",
        model(
          [0, 0.3, 0, 3.5],
          [
            curve((t) => f(t) / t, 0.001, 0.3),
            curve((t) => g(t) / t ** 2, 0.001, 0.3, C.green),
          ],
          [
            dot(p(0, 8 / 3), "8/3", C.blue, { open: true }),
            dot(p(0, (16 * Math.sqrt(3)) / 27), "16√3/27", C.green, {
              open: true,
            }),
          ],
        ),
      ),
      S(
        "목표 비율과 분자·분모",
        R`\frac{g}{\theta f}=\frac{g/\theta^2}{f/\theta}\to\frac{2\sqrt3}{9}\implies p+q=11`,
        "서로소인 자연수 p=9, q=2를 더한다.",
        model(
          [0, 0.3, 0, 0.6],
          [
            curve((t) => g(t) / (t * f(t)), 0.001, 0.3, C.green),
            line(
              p(0, (2 * Math.sqrt(3)) / 9),
              p(0.3, (2 * Math.sqrt(3)) / 9),
              C.orange,
            ),
          ],
          [dot(p(0, (2 * Math.sqrt(3)) / 9), "2√3/9", C.green, { open: true })],
          [],
          { metrics: [metric("답", "11")] },
        ),
      ),
    ],
    [
      chk(
        "넓이 비의 극한",
        g(1e-8) / (1e-8 * f(1e-8)),
        (2 * Math.sqrt(3)) / 9,
        1e-7,
      ),
    ],
  );
}
{
  const block = (x, width, A, color, label) => ({
    surface: surface(
      [p(x), p(x + width), p(x + width, A / width), p(x, A / width)],
      color,
      0.35,
    ),
    dot: dot(p(x + width / 2, A / width), label, color),
  });
  const bb = [
    block(1, 1, 1.25, C.blue, "I₁=5/4"),
    block(2, 2, 7, C.orange, "I₂=7"),
    block(4, 4, 20, C.green, "I₃=20"),
  ];
  add(
    "2022-calculus-30",
    "미정 함수 대신 넓이의 재귀 관계를 시각화",
    "증가함수 f와 역함수 g의 관계 g(2x)=2f(x), ∫1²f=5/4",
    "143",
    [
      S(
        "대응점 사슬",
        R`f(1)=1\Rightarrow g(2)=2\Rightarrow f(2)=2\Rightarrow f(4)=4\Rightarrow f(8)=8`,
        "함수 전체는 정해지지 않았다. 확실한 네 대응점만 표시한다.",
        model(
          [0, 9, 0, 9],
          [line(p(0), p(9, 9), C.muted, { dashed: true })],
          [1, 2, 4, 8].map((x) => dot(p(x, x), `(${x},${x})`)),
          [],
          {
            metrics: [metric("회색 대각선", "대응점 기준선, f의 그래프 아님")],
          },
        ),
      ),
      S(
        "적분을 세 구간으로 나누기",
        R`I_1=\int_1^2f=5/4,\ I_2=\int_2^4f,\ I_3=\int_4^8f`,
        "도형은 면적 수치를 표현하는 블록이다. 미정 함수의 그래프를 직선으로 가정하지 않는다.",
        model([0, 9, 0, 6], [], [bb[0].dot], [bb[0].surface], {
          metrics: [metric("블록 의미", "적분값만 표현")],
        }),
      ),
      S(
        "역함수 적분과 두 배 확대",
        R`I_2+\int_2^4g=4^2-2^2=12,\quad\int_2^4g(y)dy=4I_1=5`,
        "가로축 치환 y=2x와 높이 2배가 함께 적용되어 넓이는 4배가 된다.",
        model(
          [0, 9, 0, 6],
          [],
          [bb[0].dot, bb[1].dot],
          [bb[0].surface, bb[1].surface],
          { metrics: [metric("I₂", "12−5=7")] },
        ),
      ),
      S(
        "다음 구간에도 같은 관계",
        R`I_3=8^2-4^2-4I_2=48-28=20`,
        "알려진 면적 7을 이용하여 다음 구간의 면적 20을 구한다.",
        model(
          [0, 9, 0, 6],
          [],
          bb.map((b) => b.dot),
          bb.map((b) => b.surface),
          { metrics: [metric("총 면적", "5/4+7+20=113/4")] },
        ),
      ),
      S(
        "부분적분으로 원하는 적분 계산",
        R`\int_1^8xf'(x)dx=[xf(x)]_1^8-\int_1^8f=63-\frac{113}{4}=\frac{139}{4}`,
        "전체 함수식을 구하지 않아도 경계값과 세 구간의 면적으로 충분하다.",
        model(
          [0, 3, 0, 65],
          [],
          [
            dot(p(0.5, 63), "경계항 63"),
            dot(p(1.5, 113 / 4), "빼는 넓이 113/4"),
            dot(p(2.5, 139 / 4), "결과 139/4", C.green),
          ],
          bars([63, 113 / 4, 139 / 4], C.green, 0.5, 0.5),
          { metrics: [metric("p+q", "4+139=143")] },
        ),
      ),
    ],
    [
      chk("두 번째 면적", 12 - 4 * 1.25, 7),
      chk("세 번째 면적", 48 - 4 * 7, 20),
      chk("최종 적분", 63 - (1.25 + 7 + 20), 139 / 4),
    ],
  );
}

// 2023
{
  const f = (x) => (Math.log1p(x) * (Math.sqrt(x + 4) + 2)) / x;
  add(
    "2023-calculus-23",
    "제곱근의 차를 유리화해 로그 극한과 결합",
    "ln(1+x)/(√(x+4)−2)의 극한",
    "4",
    [
      S(
        "0으로 가는 두 양",
        R`\frac{\ln(1+x)}{\sqrt{x+4}-2}`,
        "분자와 분모가 동시에 0으로 간다.",
        model(
          [-0.6, 0.8, -1, 1],
          [
            curve(Math.log1p, -0.6, 0.8),
            curve((x) => Math.sqrt(x + 4) - 2, -0.6, 0.8, C.orange),
          ],
        ),
      ),
      S(
        "제곱근 분모 유리화",
        R`\frac{\ln(1+x)}x\left(\sqrt{x+4}+2\right)`,
        "켤레를 곱하면 분모가 x가 되어 기본 로그 극한이 드러난다.",
        model(
          [-0.6, 0.8, 0, 5],
          [
            curve((x) => Math.sqrt(x + 4) + 2, -0.6, 0.8, C.green),
            curve((x) => Math.log1p(x) / x, 0.001, 0.8, C.blue),
          ],
          [dot(p(0, 4), "4"), dot(p(0, 1), "1", C.blue, { open: true })],
        ),
      ),
      S(
        "두 극한의 곱",
        R`1\cdot(2+2)=4`,
        "좌우 극한이 모두 4이다.",
        model(
          [-0.6, 0.8, 2.5, 6],
          [
            curve(f, -0.6, -0.001),
            curve(f, 0.001, 0.8),
            line(p(-0.6, 4), p(0.8, 4), C.green),
          ],
          [dot(p(0, 4), "극한 4", C.green, { open: true })],
        ),
      ),
    ],
    [chk("극한 수치", f(1e-8), 4, 1e-7)],
  );
}
{
  const f = (x) => Math.sqrt(1 + 3 * x),
    rects = (n) =>
      Array.from({ length: n }, (_, i) =>
        surface(
          [
            p(i / n),
            p((i + 1) / n),
            p((i + 1) / n, f((i + 1) / n)),
            p(i / n, f((i + 1) / n)),
          ],
          C.blue,
          0.35,
        ),
      );
  add(
    "2023-calculus-24",
    "등분점의 합을 정적분으로",
    "(1/n)Σ√(1+3k/n)의 극한",
    "14/9",
    [
      S(
        "폭 1/n과 오른쪽 끝 높이",
        R`\Delta x=1/n,\quad x_k=k/n,\quad f(x_k)=\sqrt{1+3k/n}`,
        "0부터 1까지 n등분한 직사각형의 합이다.",
        model([0, 1.1, 0, 2.2], [curve(f, 0, 1)], [], rects(5)),
      ),
      S(
        "분할을 세분화",
        R`\lim_{n\to\infty}\frac1n\sum_{k=1}^n\sqrt{1+3k/n}=\int_0^1\sqrt{1+3x}\,dx`,
        "등분 간격이 줄어들면서 직사각형 합이 곡선 아래 넓이로 접근한다.",
        model([0, 1.1, 0, 2.2], [curve(f, 0, 1)], [], rects(25)),
      ),
      S(
        "선형 치환 후 적분",
        R`u=1+3x:\quad\frac13\int_1^4u^{1/2}du=\frac29(8-1)=\frac{14}{9}`,
        "새 구간은 1부터 4이며 dx=du/3을 빠뜨리지 않는다.",
        model(
          [0.8, 4.2, 0, 0.8],
          [curve((u) => Math.sqrt(u) / 3, 1, 4, C.green)],
          [],
          [area((u) => Math.sqrt(u) / 3, 1, 4, C.green)],
          { metrics: [metric("넓이", "14/9")] },
        ),
      ),
    ],
    [chk("적분 검산", integrate(f, 0, 1, 20000), 14 / 9, 1e-8)],
  );
}
{
  const ratio = (n) => (6 * 4 ** (n - 1) + 1) / (3 ** n + 2 ** (2 * n - 1));
  add(
    "2023-calculus-25",
    "분모에서 가장 빠른 지수 성장 찾기",
    "(aₙ+1)/(3ⁿ+2²ⁿ⁻¹)→3인 등비수열의 a₂",
    "24",
    [
      S(
        "4ⁿ으로 크기 맞추기",
        R`\frac{a r^{n-1}+1}{3^n+4^n/2}=\frac{(a/4)(r/4)^{n-1}+4^{-n}}{(3/4)^n+1/2}`,
        "분모의 지배항은 4ⁿ/2이다.",
        model(
          [0, 16, 0, 1.5],
          [],
          dotsN((n) => 0.75 ** n + 0.5, 15),
          [],
          { metrics: [metric("분모 극한", "1/2")] },
        ),
      ),
      S(
        "유한한 양의 극한이 강제하는 공비",
        R`r=4,\qquad\frac{a/4}{1/2}=3\implies a=6`,
        "r/4의 절댓값이 1보다 작으면 0, 크면 발산한다. r=−4는 부호가 교대하여 극한이 없다.",
        model(
          [0, 16, 0, 3.4],
          [line(p(0, 3), p(16, 3), C.green)],
          dotsN(ratio, 15),
          [],
          { metrics: [metric("공비", "4"), metric("첫째항", "6")] },
        ),
      ),
      S(
        "두 번째 항",
        R`a_2=ar=6\cdot4=24`,
        "정해진 등비수열의 첫 두 항을 확인한다.",
        model(
          [0, 3, 0, 28],
          [line(p(1, 6), p(2, 24), C.blue)],
          [dot(p(1, 6), "a₁=6"), dot(p(2, 24), "a₂=24", C.green)],
        ),
      ),
    ],
    [
      chk("큰 n의 원래 비율", ratio(100), 3, 1e-8),
      chk("두 번째 항", 6 * 4, 24),
    ],
  );
}
{
  const A = (x) => 1 / Math.cos(x) ** 2 + Math.tan(x),
    s = (x) => Math.sqrt(A(x)),
    end = PI / 3;
  add(
    "2023-calculus-26",
    "정사각형 단면의 두 삼각함수 적분",
    "0≤x≤π/3에서 한 변 √(sec²x+tan x)",
    "√3+ln 2",
    [
      S(
        "밑변 길이를 확인",
        R`s(x)=\sqrt{\sec^2x+\tan x}`,
        "각 x에서 밑면의 세로 길이가 정사각형 단면의 변이다.",
        model([-0.1, 1.2, 0, 2.7], [curve(s, 0, end)], [], [area(s, 0, end)]),
      ),
      S(
        "단면 제곱 후 쌓기",
        R`V=\int_0^{\pi/3}(\sec^2x+\tan x)dx`,
        "단면적은 제곱근 안의 식과 같다.",
        model(
          [-0.1, 1.2, 0, 2.7],
          [],
          [],
          Array.from({ length: 9 }, (_, i) => {
            const x = (end * i) / 8,
              h = s(x);
            return surface(
              [p(x, 0, 0), p(x, h, 0), p(x, h, h), p(x, 0, h)],
              C.blue,
              0.25,
            );
          }),
          { threeD: true, equalAspect: true },
        ),
      ),
      S(
        "원시함수의 차",
        R`[\tan x-\ln(\cos x)]_0^{\pi/3}=\sqrt3+\ln2`,
        "이 구간에서는 cos x가 양수이므로 로그 안의 절댓값을 생략할 수 있다.",
        model(
          [-0.1, 1.2, 0, 6.2],
          [curve(A, 0, end, C.green)],
          [dot(p(end, A(end)), "π/3")],
          [area(A, 0, end, C.green)],
          { metrics: [metric("V", "√3+ln 2")] },
        ),
      ),
    ],
    [
      chk(
        "단면적 적분",
        integrate(A, 0, end, 40000),
        Math.sqrt(3) + Math.log(2),
        1e-8,
      ),
    ],
  );
}
{
  const O = p(0, 0),
    A = p(1, 0),
    P = p(0.6, 0.8),
    Q = p(0.4, 0.2),
    rad = 1 / Math.sqrt(5),
    tri = (j) => {
      const r = rad ** j;
      return surface(
        [p(0.6 * r, 0.8 * r), p(0.4 * r, 0.2 * r), p(r, 0)],
        j % 2 ? C.green : C.blue,
        0.55,
      );
    };
  add(
    "2023-calculus-27",
    "직각이등변삼각형의 반복 축소",
    "반지름 1의 사분원에서 3:4 직사각형과 닮은 도형 반복",
    "1/4",
    [
      S(
        "3:4:5로 첫 꼭짓점 결정",
        R`P_1=(3/5,4/5),\quad A_1=(1,0)`,
        "직사각형의 대각선 OP₁이 반지름 1이다.",
        model(
          [-0.1, 1.1, -0.1, 1.1],
          [
            curve((t) => p(Math.cos(t), Math.sin(t)), 0, PI / 2),
            path([O, p(0.6, 0), P, p(0, 0.8), O], C.orange),
          ],
          [dot(P, "P₁=(3/5,4/5)"), dot(A, "A₁")],
          [],
          { equalAspect: true },
        ),
      ),
      S(
        "직각이등변삼각형의 내부 꼭짓점",
        R`Q_1=(2/5,1/5),\quad A_1P_1^2=4/5,\quad S_1=\frac14A_1P_1^2=1/5`,
        "선분 A₁P₁을 빗변으로 하고 사분원 내부에 놓이는 직각이등변삼각형을 선택한다.",
        model(
          [-0.1, 1.1, -0.1, 1.1],
          [path([P, Q, A, P]), line(O, Q, C.orange)],
          [dot(Q, "Q₁")],
          [tri(0)],
          { equalAspect: true },
        ),
      ),
      S(
        "새 반지름과 넓이 비",
        R`OQ_1^2=1/5,\quad\frac{S_{n+1}-S_n}{S_n-S_{n-1}}=1/5`,
        "길이비는 1/√5이고 넓이비는 그 제곱인 1/5이다.",
        model(
          [-0.1, 1.1, -0.1, 1.1],
          [
            curve(
              (t) => p(rad * Math.cos(t), rad * Math.sin(t)),
              0,
              PI / 2,
              C.green,
            ),
          ],
          [],
          [tri(0), tri(1), tri(2)],
          { equalAspect: true },
        ),
      ),
      S(
        "겹치지 않는 넓이의 합",
        R`\lim S_n=\frac{1/5}{1-1/5}=\frac14`,
        "각 삼각형은 다음 작은 부채꼴 바깥쪽에 놓이므로 넓이를 더할 수 있다.",
        model(
          [-0.1, 1.1, -0.1, 1.1],
          [],
          [],
          Array.from({ length: 7 }, (_, i) => tri(i)),
          { equalAspect: true, metrics: [metric("넓이 합", "1/4")] },
        ),
      ),
    ],
    [
      chk(
        "첫 넓이",
        Math.abs(
          (P[0] - Q[0]) * (A[1] - Q[1]) - (P[1] - Q[1]) * (A[0] - Q[0]),
        ) / 2,
        0.2,
      ),
      chk("다음 반지름 제곱", Q[0] ** 2 + Q[1] ** 2, 0.2),
      chk("급수", 0.2 / (1 - 0.2), 0.25),
    ],
  );
}
{
  const geom = (t) => {
    const P = p(Math.cos(2 * t), Math.sin(2 * t)),
      Q = p(-Math.sin(2 * t), Math.cos(2 * t)),
      S = p(0, Math.tan(t)),
      slope = -1 / Math.tan(t),
      rx = (Q[1] - Math.tan(t) - slope * Q[0]) / (Math.tan(t) - slope);
    return { P, Q, S, R: p(rx, Math.tan(t) * (rx + 1)) };
  };
  const f = (t) => 0.5 * Math.sin(2 * t),
    g = (t) =>
      0.5 * Math.sin(t) * Math.cos(t) * (3 + Math.tan(t)) * (1 - Math.tan(t));
  const scene = (t) => {
    const z = geom(t);
    return model(
      [-1.2, 1.2, -0.1, 1.2],
      [
        curve((u) => p(Math.cos(u), Math.sin(u)), 0, PI),
        line(p(-1, 0), z.P),
        line(p(0, 1), z.Q, C.orange),
        line(z.Q, z.R, C.orange),
        line(p(0), p(0, 1), C.muted),
      ],
      [dot(z.P, "P"), dot(z.Q, "Q"), dot(z.R, "R"), dot(z.S, "S")],
      [
        surface([p(0), p(1), z.P], C.blue),
        surface([p(0, 1), z.Q, z.R, z.S], C.orange),
      ],
      { equalAspect: true },
    );
  };
  add(
    "2023-calculus-28",
    "사라지는 두 넓이의 일차항을 소거하기",
    "반원에서 PB=QC인 두 점과 사각형 CQRS의 넓이 극한",
    "2",
    [
      S(
        "원주각과 중심각",
        R`\angle BOP=\angle COQ=2\theta,\quad f(\theta)=\tfrac12\sin2\theta`,
        "반지름은 1이며 원주각 θ에 대한 중심각은 2θ다.",
        scene(0.3),
      ),
      S(
        "사각형을 직각 사다리꼴로",
        R`CS=1-\tan\theta,\ CQ=2\sin\theta,\ RS=\sin\theta(1+\tan\theta)`,
        "사다리꼴의 높이는 QR=(1−tan θ)cos θ다.",
        scene(0.2),
      ),
      S(
        "실제 넓이식을 만들기",
        R`g(\theta)=\tfrac12\sin\theta\cos\theta(3+\tan\theta)(1-\tan\theta)`,
        "두 평행변의 합에 높이를 곱하고 2로 나눈다.",
        model(
          [0, 0.7, 0, 0.8],
          [curve(f, 0, 0.7), curve(g, 0, 0.7, C.orange)],
          [],
          [],
          { metrics: [metric("파랑", "f(θ)"), metric("주황", "g(θ)")] },
        ),
      ),
      S(
        "공통인 일차항 소거",
        R`3f-2g=\sin\theta\cos\theta\tan\theta(\tan\theta+2)`,
        "작은 두 넓이를 따로 근사하면 필요한 이차항을 놓친다. 먼저 정확히 뺀다.",
        model(
          [0, 0.65, 0, 1.2],
          [curve((t) => 3 * f(t) - 2 * g(t), 0, 0.65, C.green)],
          [],
          [area((t) => 3 * f(t) - 2 * g(t), 0, 0.65, C.green)],
        ),
      ),
      S(
        "θ²로 나누고 기본 극한 적용",
        R`\frac{3f-2g}{\theta^2}=\frac{\sin\theta}{\theta}\frac{\tan\theta}{\theta}\cos\theta(\tan\theta+2)\longrightarrow2`,
        "sin θ/θ와 tan θ/θ는 모두 1로 간다.",
        model(
          [0, 0.5, 1.5, 3],
          [
            curve((t) => (3 * f(t) - 2 * g(t)) / (t * t), 0.001, 0.5, C.green),
            line(p(0, 2), p(0.5, 2), C.orange),
          ],
          [dot(p(0, 2), "2", C.green, { open: true })],
        ),
      ),
    ],
    [
      chk(
        "넓이 항등식",
        3 * f(0.2) - 2 * g(0.2),
        Math.sin(0.2) * Math.cos(0.2) * Math.tan(0.2) * (Math.tan(0.2) + 2),
      ),
      chk(
        "극한",
        (((Math.sin(1e-7) / 1e-7) * Math.tan(1e-7)) / 1e-7) *
          Math.cos(1e-7) *
          (Math.tan(1e-7) + 2),
        2,
        2e-7,
      ),
    ],
  );
}
{
  const f = (x) => Math.exp(2 * x) + Math.exp(x) - 6,
    g = (y) => Math.log((Math.sqrt(4 * y + 25) - 1) / 2);
  add(
    "2023-calculus-29",
    "지수함수의 역함수 적분을 원함수로 계산",
    "f(x)=ae²ˣ+beˣ+c, 무한대 극한과 f(ln2)=0",
    "26",
    [
      S(
        "−∞ 극한에서 계수 분리",
        R`\frac{f(x)+6}{e^x}=ae^x+b+(c+6)e^{-x}\to1\implies c=-6,\ b=1`,
        "e⁻ˣ 항이 발산하지 않으려면 계수가 0이어야 한다.",
        model(
          [-8, 0, 0, 2.2],
          [
            curve((x) => Math.exp(x) + 1, -8, 0),
            line(p(-8, 1), p(0, 1), C.green),
          ],
          [],
          [],
          { metrics: [metric("남는 상수", "b=1")] },
        ),
      ),
      S(
        "초기값으로 마지막 계수",
        R`4a+2-6=0\implies a=1,\quad f(\ln4)=14`,
        "두 대응점을 찾아 역함수 적분의 양 끝을 정한다.",
        model(
          [0, 1.5, -5, 16],
          [curve(f, 0, 1.45)],
          [
            dot(p(Math.log(2), 0), "(ln2,0)"),
            dot(p(Math.log(4), 14), "(ln4,14)"),
          ],
        ),
      ),
      S(
        "좌표 교환과 부분적분",
        R`\int_0^{14}g(y)dy=[xf(x)]_{\ln2}^{\ln4}-\int_{\ln2}^{\ln4}f(x)dx`,
        "역함수를 직접 적분하지 않고 대응되는 직사각형에서 원함수 넓이를 뺀다.",
        model(
          [0, 15, 0, 1.6],
          [curve(g, 0, 14, C.green)],
          [],
          [area(g, 0, 14, C.green)],
        ),
      ),
      S(
        "지수함수 적분으로 환원",
        R`14\ln4-[e^{2x}/2+e^x-6x]_{\ln2}^{\ln4}=34\ln2-8`,
        "경계항은 28 ln 2이고 빼는 넓이는 8−6 ln 2다.",
        model(
          [0.6, 1.5, 0, 15],
          [curve(f, Math.log(2), Math.log(4), C.orange)],
          [],
          [area(f, Math.log(2), Math.log(4), C.orange)],
          { metrics: [metric("원함수 넓이", "8−6 ln2")] },
        ),
      ),
      S(
        "유리수 계수 더하기",
        R`p=-8,\ q=34,\quad p+q=26`,
        "상수항과 ln2의 계수를 분리한다.",
        model(
          [0, 15, 0, 1.6],
          [curve(g, 0, 14, C.green)],
          [dot(p(0, Math.log(2)), "ln2"), dot(p(14, Math.log(4)), "ln4")],
          [area(g, 0, 14, C.green)],
          { metrics: [metric("적분", "34 ln2−8"), metric("답", "26")] },
        ),
      ),
    ],
    [
      chk(
        "역함수 적분",
        integrate(g, 0, 14, 30000),
        34 * Math.log(2) - 8,
        1e-8,
      ),
    ],
  );
}
{
  const f = (x) => (5 / 9) * x ** 3 - 2.5 * x * x + 8,
    h = (x) => Math.exp(Math.sin(PI * f(x))) - 1,
    z = Math.asin(Math.log(2)) / PI,
    levels = [1 - z, 2 + z, 3 - z, 4 + z, 5 - z, 6 + z, 7 - z],
    roots = levels.map((v) => bisect((x) => f(x) - v, 0, 3));
  add(
    "2023-calculus-30",
    "합성함수의 교점 수를 안쪽 함수의 범위로 이동",
    "h=e^(sin(πf))−1, 0에서 극대 0, (0,3)에서 h=1의 해 일곱 개",
    "31",
    [
      S(
        "극댓값 조건과 도함수",
        R`f(0)=d\in\mathbb Z,\quad h'(0)=\pi\cos(\pi d)f'(0)=0\implies f'(0)=0`,
        "정수 d에서 cos πd는 0이 아니므로 f′(0)=0이다. 아직 미정인 계수의 그래프는 그리지 않는다.",
        model(
          [-0.2, 3.2, 0, 2],
          [line(p(0, 1), p(3, 1), C.muted)],
          [dot(p(0, 1), "f′(0)=0"), dot(p(3, 1), "f′(3)=0")],
          [],
          { metrics: [metric("f′(x)", "3a x(x−3), a>0")] },
        ),
      ),
      S(
        "0에서 3까지 단조 감소",
        R`f'(x)=3ax(x-3)<0\ (0<x<3),\quad f((0,3))=(1/2,d)`,
        "f는 0에서 극대, 3에서 극소다. h도 0에서 극대이므로 cos πd>0, 즉 d는 양의 짝수다.",
        model(
          [0, 9, -1.2, 1.2],
          [
            curve((u) => Math.sin(PI * u), 0.5, 8, C.blue, 220),
            line(p(0.5, Math.log(2)), p(8, Math.log(2)), C.orange),
          ],
          [],
          [],
          {
            metrics: [
              metric("가로축", "u=f(x)"),
              metric("허용 상한", "양의 짝수 d"),
            ],
          },
        ),
      ),
      S(
        "일곱 교점으로 상한 결정",
        R`h=1\iff\sin(\pi u)=\ln2,\quad 1/2<u<d\implies d=8`,
        "d=2,4,6,8에서는 해가 각각 1,3,5,7개다. 안쪽 함수가 일대일이므로 이 개수가 그대로 보존된다.",
        model(
          [0, 8.3, -1.2, 1.2],
          [
            curve((u) => Math.sin(PI * u), 0.5, 8, C.blue, 220),
            line(p(0.5, Math.log(2)), p(8, Math.log(2)), C.orange),
          ],
          levels.map((v) => dot(p(v, Math.log(2)), round(v).toString())),
          [],
          { metrics: [metric("해 개수", "7")] },
        ),
      ),
      S(
        "삼차함수 확정",
        R`f(3)=1/2,\ f(0)=8\implies f(x)=\frac59x^3-\frac52x^2+8`,
        "도함수의 두 근과 양 끝 함수값으로 계수를 정한다.",
        model(
          [0, 3.2, 0, 9],
          [curve(f, 0, 3)],
          roots.map((x, i) => dot(p(x, levels[i]), "대응점")),
          [],
          { metrics: [metric("f(0)", "8"), metric("f(3)", "1/2")] },
        ),
      ),
      S(
        "목표 함수값",
        R`f(2)=\frac{40}{9}-10+8=\frac{22}{9},\quad p+q=31`,
        "기약분수 22/9의 분자와 분모를 더한다.",
        model(
          [0, 3.2, 0, 9],
          [curve(f, 0, 3, C.green)],
          [dot(p(2, f(2)), "f(2)=22/9")],
          [],
          { metrics: [metric("답", "31")] },
        ),
      ),
    ],
    [
      chk("오른쪽 값", f(3), 0.5),
      chk(
        "일곱 해의 합성함수 오차",
        Math.max(...roots.map((x) => Math.abs(h(x) - 1))),
        0,
        1e-8,
      ),
      chk("목표값", f(2), 22 / 9),
    ],
  );
}

// 2024
{
  const f = (x) => Math.log1p(3 * x) / Math.log1p(5 * x);
  add(
    "2024-calculus-23",
    "로그의 증가율을 같은 변수로 비교",
    "ln(1+3x)/ln(1+5x)의 극한",
    "3/5",
    [
      S(
        "공통으로 0이 되는 두 로그",
        R`\frac{\ln(1+3x)}{\ln(1+5x)}`,
        "두 로그는 x=0에서 모두 0이다.",
        model(
          [-0.15, 0.3, -2, 1.5],
          [
            curve((x) => Math.log1p(3 * x), -0.15, 0.3),
            curve((x) => Math.log1p(5 * x), -0.15, 0.3, C.orange),
          ],
        ),
      ),
      S(
        "각각 자기 증가량으로 나누기",
        R`\frac35\frac{\ln(1+3x)}{3x}\frac{5x}{\ln(1+5x)}`,
        "ln(1+u)/u→1을 두 인자에 적용한다.",
        model(
          [-0.15, 0.3, 0.3, 1.8],
          [
            curve((x) => Math.log1p(3 * x) / (3 * x), 0.001, 0.3),
            curve((x) => (5 * x) / Math.log1p(5 * x), 0.001, 0.3, C.orange),
            line(p(-0.15, 1), p(0.3, 1), C.green),
          ],
        ),
      ),
      S(
        "상수 비율만 남기기",
        R`\lim_{x\to0}\frac{\ln(1+3x)}{\ln(1+5x)}=\frac35`,
        "좌우에서 모두 3/5에 접근한다.",
        model(
          [-0.15, 0.3, 0.3, 0.9],
          [
            curve(f, -0.15, -0.001),
            curve(f, 0.001, 0.3),
            line(p(-0.15, 0.6), p(0.3, 0.6), C.green),
          ],
          [dot(p(0, 0.6), "3/5", C.green, { open: true })],
        ),
      ),
    ],
    [chk("작은 양수 극한", f(1e-8), 0.6, 1e-7)],
  );
}
{
  const xy = (t) => p(Math.log1p(t ** 3), Math.sin(PI * t)),
    P = xy(1),
    m = (-2 * PI) / 3;
  add(
    "2024-calculus-24",
    "매개변수의 두 변화율을 나누기",
    "x=ln(t³+1), y=sin(πt), t=1의 접선 기울기",
    "−2π/3",
    [
      S(
        "같은 t가 정하는 점",
        R`(x,y)=(\ln(t^3+1),\sin\pi t),\quad t=1\implies(\ln2,0)`,
        "좌표별로 다른 독립변수를 쓰지 않고 같은 t로 궤적을 만든다.",
        model([0, 2, -1.5, 1.5], [curve(xy, 0.05, 1.8)], [dot(P, "t=1")]),
      ),
      S(
        "가로·세로 속도",
        R`x'(1)=\frac{3}{2},\quad y'(1)=-\pi`,
        "x′(1)가 0이 아니므로 접선 기울기는 두 속도의 비다.",
        model(
          [0, 2, -1.5, 1.5],
          [
            curve(xy, 0.05, 1.8),
            line(P, p(P[0] + 0.45, 0), C.orange),
            line(p(P[0] + 0.45, 0), p(P[0] + 0.45, 0.45 * m), C.green),
          ],
          [dot(P, "접점")],
        ),
      ),
      S(
        "접선으로 전환",
        R`\left.\frac{dy}{dx}\right|_{t=1}=\frac{-\pi}{3/2}=-\frac{2\pi}{3}`,
        "기울기 −2π/3인 직선이 접점에서 곡선과 같은 방향을 갖는다.",
        model(
          [0, 2, -1.5, 1.5],
          [
            curve(xy, 0.05, 1.8),
            curve((x) => m * (x - P[0]), 0, 1.4, C.orange),
          ],
          [dot(P, "(ln 2,0)")],
        ),
      ),
    ],
    [
      chk(
        "차분 기울기",
        (xy(1.000001)[1] - xy(0.999999)[1]) /
          (xy(1.000001)[0] - xy(0.999999)[0]),
        m,
        1e-8,
      ),
    ],
  );
}
{
  const f = (x) => 4 * x * x * (x + 1),
    dlog = (x) => 2 / x + 1 / (x + 1);
  add(
    "2024-calculus-25",
    "역함수의 미분을 로그미분으로 연결",
    "역함수 g와 ∫1ᵃ1/(g′(f(x))f(x))dx, f(1)=8",
    "48",
    [
      S(
        "역함수 미분 공식 대입",
        R`g'(f(x))=\frac1{f'(x)}\implies\frac1{g'(f(x))f(x)}=\frac{f'(x)}{f(x)}`,
        "역함수와 원함수의 도함수는 대응점에서 역수 관계다. 아직 함수 전체를 특정하지 않는다.",
        model(
          [0, 3, 0, 3],
          [line(p(1, 0), p(1, 2), C.blue), line(p(2, 0), p(2, 0.5), C.orange)],
          [],
          [],
          { metrics: [metric("도함수 관계", "g′(f(x))f′(x)=1")] },
        ),
      ),
      S(
        "적분의 상한을 미분",
        R`\frac{f'(x)}{f(x)}=\frac2x+\frac1{x+1}`,
        "모든 양수 a에서 성립하는 식을 a에 관해 미분한다.",
        model(
          [0.4, 2.5, 0, 6],
          [curve(dlog, 0.4, 2.5, C.green)],
          [],
          [area(dlog, 1, 2, C.green)],
        ),
      ),
      S(
        "로그 차이로 함수값 복원",
        R`\ln\frac{f(x)}8=2\ln x+\ln(x+1)-\ln2\implies f(x)=4x^2(x+1)`,
        "f(1)=8을 이용해 상수를 정한다. 양수 정의역에서 f의 값도 양수다.",
        model([0, 2.2, 0, 60], [curve(f, 0, 2.1)], [dot(p(1, 8), "f(1)=8")]),
      ),
      S(
        "x=2에 대입",
        R`f(2)=4\cdot2^2\cdot3=48`,
        "도함수 관계를 다시 확인하면 f′/f가 앞서 얻은 식과 일치한다.",
        model(
          [0, 2.2, 0, 60],
          [curve(f, 0, 2.1)],
          [dot(p(1, 8), "8"), dot(p(2, 48), "48", C.green)],
          [],
          { metrics: [metric("f(2)", "48")] },
        ),
      ),
    ],
    [
      chk("초기값", f(1), 8),
      chk("목표값", f(2), 48),
      chk("로그미분", (12 * 4 + 8 * 2) / f(2), dlog(2)),
    ],
  );
}
{
  const l = (3 * PI) / 4,
    r = (5 * PI) / 4,
    A = (x) => (1 - 2 * x) * Math.cos(x),
    s = (x) => Math.sqrt(A(x));
  add(
    "2024-calculus-26",
    "정사각형 단면과 삼각함수 부분적분",
    "3π/4≤x≤5π/4, 한 변 √((1−2x)cos x)",
    "2√2π−√2",
    [
      S(
        "두 음수의 곱인 밑변 제곱",
        R`A(x)=(1-2x)\cos x\ge0`,
        "주어진 구간에서 1−2x와 cos x가 모두 음수이므로 단면적은 양수다.",
        model([2, 4.2, 0, 3], [curve(s, l, r)], [], [area(s, l, r)]),
      ),
      S(
        "실제 정사각형 단면",
        R`V=\int_{3\pi/4}^{5\pi/4}(1-2x)\cos x\,dx`,
        "단면 한 변을 제곱하고 x방향으로 쌓는다.",
        model(
          [2, 4.2, 0, 3],
          [],
          [],
          Array.from({ length: 10 }, (_, i) => {
            const x = l + ((r - l) * i) / 9,
              h = s(x);
            return surface(
              [p(x, 0, 0), p(x, h, 0), p(x, h, h), p(x, 0, h)],
              C.blue,
              0.25,
            );
          }),
          { threeD: true, equalAspect: true },
        ),
      ),
      S(
        "부분적분한 원시함수",
        R`\int(1-2x)\cos x\,dx=(1-2x)\sin x-2\cos x`,
        "x cos x의 적분에 부분적분을 적용한다.",
        model(
          [2, 4.2, 0, 8],
          [curve(A, l, r, C.green)],
          [],
          [area(A, l, r, C.green)],
        ),
      ),
      S(
        "끝값의 삼각함수 대입",
        R`V=2\sqrt2\pi-\sqrt2`,
        "두 끝점의 코사인 항은 상쇄되고 사인 항의 차가 남는다.",
        model(
          [2, 4.2, 0, 8],
          [curve(A, l, r, C.green)],
          [dot(p(l, A(l)), "3π/4"), dot(p(r, A(r)), "5π/4")],
          [area(A, l, r, C.green)],
          { metrics: [metric("부피", "2√2π−√2")] },
        ),
      ),
    ],
    [
      chk(
        "단면적 적분",
        integrate(A, l, r, 20000),
        2 * Math.SQRT2 * PI - Math.SQRT2,
        1e-8,
      ),
    ],
  );
}
{
  const u = -1.5,
    t = 1.5 - Math.log(2),
    aExp = Math.exp(t),
    F = (x) => Math.exp(-x) + aExp,
    m = -Math.exp(1.5),
    T = (s) => Math.log(-s - 1) - s;
  add(
    "2024-calculus-27",
    "원점을 지나는 접선의 접점도 함께 미분하기",
    "y=e⁻ˣ+eᵗ의 원점 통과 접선 기울기를 f(t)라 할 때 f′(a)",
    "−e√e/3",
    [
      S(
        "접점과 원점 연결",
        R`y=-e^{-s}(x-s)+e^{-s}+e^t`,
        "접점의 x좌표 s도 t에 따라 변한다.",
        model(
          [-2.5, 0.5, -1, 15],
          [curve(F, -2.5, 0.5), curve((x) => m * x, -2.5, 0.2, C.orange)],
          [dot(p(0, 0), "원점"), dot(p(u, F(u)), "s=−3/2")],
        ),
      ),
      S(
        "절편이 0인 조건",
        R`e^t=-(s+1)e^{-s},\quad s<-1,\qquad f(t)=-e^{-s}`,
        "양수 eᵗ 때문에 s<−1이다.",
        model(
          [-3, -1.05, -2, 4],
          [curve(T, -3, -1.05, C.green)],
          [dot(p(u, t), "(s,a)")],
        ),
      ),
      S(
        "매개변수 관계의 미분",
        R`e^t\frac{dt}{ds}=se^{-s},\quad f'(t)\frac{dt}{ds}=e^{-s}\implies f'(t)=\frac{e^t}{s}`,
        "동일한 dt/ds를 소거하면 접점의 변화율을 직접 구할 필요가 없다.",
        model(
          [-1, 3, -12, 0],
          [curve((s) => p(T(s), -Math.exp(-s)), -2.5, -1.1)],
          [dot(p(t, m), "f(a)=−e√e")],
        ),
      ),
      S(
        "주어진 기울기로 접점 결정",
        R`s=-3/2,\quad e^a=e^{3/2}/2\implies f'(a)=-e^{3/2}/3`,
        "f(a)의 값으로 s를 정한 후 미분식에 대입한다.",
        model(
          [-1, 3, -12, 0],
          [
            curve((s) => p(T(s), -Math.exp(-s)), -2.5, -1.1),
            curve((x) => m - (Math.exp(1.5) / 3) * (x - t), -0.3, 2, C.orange),
          ],
          [dot(p(t, m), "접선")],
          [],
          { metrics: [metric("f′(a)", "−e√e/3")] },
        ),
      ),
    ],
    [
      chk("원점 통과 조건", F(u) - u * m, 0),
      chk("도함수 관계", aExp / u, -Math.exp(1.5) / 3),
    ],
  );
}
{
  const left = (x) => -4 * x * Math.exp(4 * x * x),
    right = (x) => 2 * (x - 5) * Math.exp((x - 5) ** 2),
    scale = 4 * Math.exp(4),
    f = (x) => (x < 0 ? left(x) : x <= 5 ? 0 : right(x)),
    rr = [-1.25, 7.4, -0.15, 3.2];
  add(
    "2024-calculus-28",
    "두 근의 선형 관계가 만드는 구간별 함수",
    "x<0에서 −4xe⁴ˣ², 2g(t)+h(t)=k, ∫0⁷f=e⁴−1",
    "(4/3)e⁷",
    [
      S(
        "알려진 왼쪽 가지와 경계",
        R`f(x)=-4xe^{4x^2}\ (x<0),\quad\lim_{x\to0-}f(x)=f(0)=0`,
        "왼쪽 가지는 양수이고 엄격히 감소한다. 세로축은 f/(4e⁴)로 축소한다.",
        model(
          rr,
          [curve((x) => left(x) / scale, -1.15, 0)],
          [dot(p(0, 0), "포함되는 경계 0")],
          [],
          { metrics: [metric("세로축", "f(x)/(4e⁴)")] },
        ),
      ),
      S(
        "같은 높이의 두 근 연결",
        R`u=g(t)<0,\quad h(t)=-2u+k`,
        "같은 높이 t에서 오른쪽 근은 왼쪽 근의 가로좌표를 −2배 한 뒤 k만큼 옮긴 점이다. k는 이 단계에서 미정이다.",
        model(
          [-2, 3, -0.2, 2],
          [line(p(-1, 1), p(2, 1), C.orange)],
          [dot(p(-1, 1), "u"), dot(p(2, 1), "−2u (k를 뺀 좌표)")],
          [],
          { metrics: [metric("오른쪽 좌표", "h−k=−2u")] },
        ),
      ),
      S(
        "오른쪽 공식과 0인 구간",
        R`f(x)=2(x-k)e^{(x-k)^2}\ (x>k),\qquad f(x)=0\ (0\le x\le k)`,
        "u=(k−x)/2를 왼쪽 공식에 대입한다. 0과 k 사이의 양수 값은 세 번째 근을 만들므로 있을 수 없다.",
        model(
          [-1.2, 2.4, -0.1, 3.2],
          [
            curve((u) => left(u) / scale, -1.15, 0),
            curve((v) => (2 * v * Math.exp(v * v)) / scale, 0, 2.25, C.green),
          ],
          [dot(p(0, 0), "오른쪽은 x−k축")],
          [],
          { metrics: [metric("k", "아직 미정, k≥0")] },
        ),
      ),
      S(
        "넓이로 경계 k 결정",
        R`e^{(7-k)^2}-1=e^4-1,\quad k<7\implies k=5`,
        "적분이 양수이므로 k<7이다. 따라서 7−k=2를 선택한다.",
        model(
          rr,
          [curve((x) => f(x) / scale, -1.15, 7.25)],
          [],
          [area((x) => f(x) / scale, 5, 7, C.green)],
          { metrics: [metric("적분 구간", "5 → 7"), metric("경계", "k=5")] },
        ),
      ),
      S(
        "구간 경계와 포함점 확정",
        R`f(x)=\begin{cases}-4xe^{4x^2}&x<0\\0&0\le x\le5\\2(x-5)e^{(x-5)^2}&x>5\end{cases}`,
        "0과 5에서는 함수값과 양쪽 극한이 모두 0이다.",
        model(
          rr,
          [
            curve((x) => left(x) / scale, -1.15, 0),
            line(p(0, 0), p(5, 0), C.green),
            curve((x) => right(x) / scale, 5, 7.25),
          ],
          [dot(p(0, 0), "0, 닫힌 점"), dot(p(5, 0), "5, 닫힌 점")],
        ),
      ),
      S(
        "큰 함수값은 비율로 계산",
        R`\frac{f(9)}{f(8)}=\frac{8e^{16}}{6e^9}=\frac43e^7`,
        "값이 매우 커지는 8과 9를 잘린 높이로 그리지 않고 로그값과 정확한 비율로 비교한다.",
        model(
          [7.5, 9.5, 0, 20],
          [
            line(p(8, 0), p(8, Math.log(6) + 9)),
            line(p(9, 0), p(9, Math.log(8) + 16), C.green),
          ],
          [
            dot(p(8, Math.log(6) + 9), "ln f(8)=ln6+9"),
            dot(p(9, Math.log(8) + 16), "ln f(9)=ln8+16"),
          ],
          [],
          { metrics: [metric("세로축", "ln f(x)"), metric("비율", "(4/3)e⁷")] },
        ),
      ),
    ],
    [
      chk("넓이 조건", integrate(f, 0, 7, 100000), Math.exp(4) - 1, 2e-6),
      chk("함수값의 비", f(9) / f(8), (4 / 3) * Math.exp(7), 1e-8),
    ],
  );
}
{
  const r = -0.5,
    s = 0.25;
  add(
    "2024-calculus-29",
    "두 공비의 관계와 절댓값 급수",
    "두 등비급수의 곱 조건, 3Σ|a₂ₙ|=7Σ|a₃ₙ|",
    "162",
    [
      S(
        "급수의 곱 조건에서 첫째항 소거",
        R`\frac1{1-rs}=\frac1{(1-r)(1-s)}\implies r+s=2rs`,
        "첫째항들은 0이 아니므로 소거된다. 수렴 조건은 |r|,|s|<1이다.",
        model(
          [-1, 1, -1, 1],
          [curve((x) => x / (2 * x - 1), -1, 0.32)],
          [],
          [surface([p(-1, -1), p(1, -1), p(1, 1), p(-1, 1)], C.muted, 0.08)],
        ),
      ),
      S(
        "공비 절댓값 결정",
        R`u=|r|:\quad\frac{3u}{1-u^2}=\frac{7u^2}{1-u^3}\implies(u-1)(2u-1)(2u+3)=0`,
        "0<u<1인 해는 u=1/2 하나다.",
        model(
          [0, 1, -2, 4],
          [curve((u) => 4 * u ** 3 - 7 * u + 3, 0, 1, C.orange)],
          [
            dot(p(0.5, 0), "u=1/2"),
            dot(p(1, 0), "수렴 조건 제외", C.muted, { open: true }),
          ],
        ),
      ),
      S(
        "부호를 관계식으로 결정",
        R`r=1/2\text{ 는 불가능};\quad r=-1/2,\ s=1/4`,
        "r=1/2를 넣으면 1/2=0이 된다. 남은 r=−1/2에서 s=1/4를 얻는다.",
        model(
          [0, 8, -0.6, 1.2],
          [],
          [
            ...dotsN((n) => r ** (n - 1), 7),
            ...dotsN((n) => s ** (n - 1), 7, 1, C.green),
          ],
          [],
          { metrics: [metric("세로축", "aₙ/a₁, bₙ/b₁")] },
        ),
      ),
      S(
        "항의 비를 공비의 거듭제곱으로",
        R`S=\sum_{n\ge1}(s^{n-1}+s^{2n+1})=\frac1{1-s}+\frac{s^3}{1-s^2}`,
        "b₁은 모든 항의 비에서 사라진다. 두 등비급수의 합으로 분리한다.",
        model(
          [0, 7, 0, 1.2],
          [],
          dotsN((n) => s ** (n - 1) + s ** (2 * n + 1), 6),
          bars(
            Array.from(
              { length: 6 },
              (_, i) => s ** i + s ** (2 * (i + 1) + 1),
            ),
            C.blue,
            1,
          ),
        ),
      ),
      S(
        "최종 배수",
        R`S=\frac43+\frac1{60}=\frac{27}{20},\quad120S=162`,
        "합 27/20에 120을 곱한다.",
        model(
          [0, 7, 0, 1.5],
          [line(p(0, 27 / 20), p(7, 27 / 20), C.green)],
          dotsN(
            (n) =>
              Array.from(
                { length: n },
                (_, i) => s ** i + s ** (2 * (i + 1) + 1),
              ).reduce((a, b) => a + b, 0),
            6,
          ),
          [],
          { metrics: [metric("S", "27/20"), metric("120S", "162")] },
        ),
      ),
    ],
    [
      chk("공비 관계", r + s, 2 * r * s),
      chk("최종 급수", 120 * (1 / (1 - s) + s ** 3 / (1 - s * s)), 162),
    ],
  );
}
{
  const F = (x) => 0.5 * Math.sin(x) * Math.abs(Math.sin(x)),
    d = (x) => Math.abs(Math.sin(x)) * Math.cos(x),
    an = [PI / 4, (3 * PI) / 4, PI, (5 * PI) / 4, (7 * PI) / 4, 2 * PI],
    a = PI / 4,
    g = (x) => F(a) + d(a) * (x - a),
    hp = (x) => F(x) - g(x);
  add(
    "2024-calculus-30",
    "접선의 횡단과 적분함수의 극값",
    "f′=|sin x|cos x, 접선과의 차를 적분한 h가 접점에서 극값을 갖는 조건",
    "125",
    [
      S(
        "상수와 무관한 실제 함수",
        R`F(x)=f(x)-f(0)=\frac12\sin x\,|\sin x|`,
        "세로 이동은 접선과의 차에서 사라진다. 정규화한 F를 그린다.",
        model(
          [0, 2 * PI, -0.7, 0.7],
          [curve(F, 0, 2 * PI, C.blue, 180)],
          [],
          [],
          { metrics: [metric("세로축", "f(x)−f(0)")] },
        ),
      ),
      S(
        "h′의 부호 변화로 옮기기",
        R`h'(x)=f(x)-g(x),\quad h'(a)=0`,
        "h의 극값은 접선과 곡선의 차가 접점 양쪽에서 부호를 바꿀 때 생긴다.",
        model(
          [0, PI / 2, -0.4, 0.7],
          [curve(F, 0, PI / 2), curve(g, 0, PI / 2, C.orange)],
          [dot(p(a, F(a)), "a=π/4")],
        ),
      ),
      S(
        "접선 횡단을 차이 그래프로",
        R`f(x)-g(x)\text{ 가 }a\text{ 양쪽에서 부호 변화}`,
        "단순히 접한다는 사실만으로는 충분하지 않다. 차이가 0을 가로지르는지 확인한다.",
        model(
          [0, PI / 2, -0.15, 0.15],
          [curve(hp, 0, PI / 2, C.green)],
          [dot(p(a, 0), "부호 전환")],
          [area(hp, 0, a, C.blue), area(hp, a, PI / 2, C.orange)],
        ),
      ),
      S(
        "변곡점과 절댓값 경계 조사",
        R`a=\pi/4,\ 3\pi/4,\ \pi,\ 5\pi/4,\ 7\pi/4,\ 2\pi,\ldots`,
        "sin x≠0 구간의 cos 2x=0과 경계 x=kπ를 함께 검사한다. 경계에서도 접선을 횡단한다.",
        model(
          [0, 2 * PI, -0.7, 0.7],
          [curve(F, 0, 2 * PI, C.blue, 180)],
          an.map((x, i) => dot(p(x, F(x)), `a${i + 1}`)),
        ),
      ),
      S(
        "두 번째와 여섯 번째 위치의 차",
        R`\frac{100}{\pi}(a_6-a_2)=\frac{100}{\pi}\left(2\pi-\frac{3\pi}{4}\right)=125`,
        "양수인 해만 작은 순서로 세어 a₂와 a₆를 선택한다.",
        model(
          [0, 2 * PI, -0.7, 0.7],
          [
            curve(F, 0, 2 * PI, C.muted, 160),
            line(p(an[1], -0.6), p(an[5], -0.6), C.green),
          ],
          [
            dot(p(an[1], F(an[1])), "a₂=3π/4"),
            dot(p(an[5], F(an[5])), "a₆=2π"),
          ],
          [],
          { metrics: [metric("차", "5π/4"), metric("답", "125")] },
        ),
      ),
    ],
    [
      chk("F의 도함수", (F(0.7 + 1e-6) - F(0.7 - 1e-6)) / 2e-6, d(0.7), 1e-8),
      chk("최종 차이", (100 / PI) * (an[5] - an[1]), 125),
    ],
  );
}

// 2025
{
  const f = (x) => (3 * x * x) / Math.sin(x) ** 2;
  add(
    "2025-calculus-23",
    "사인과 각의 비를 제곱으로 분리",
    "3x²/sin²x의 극한",
    "3",
    [
      S(
        "원래 비율",
        R`\lim_{x\to0}\frac{3x^2}{\sin^2x}`,
        "0을 제외한 양쪽 가지를 그린다.",
        model(
          [-1, 1, 0, 5],
          [curve(f, -1, -0.001), curve(f, 0.001, 1)],
          [dot(p(0, 3), "미정의", C.orange, { open: true })],
        ),
      ),
      S(
        "기본 비율로 분해",
        R`\frac{3x^2}{\sin^2x}=3\left(\frac{x}{\sin x}\right)^2`,
        "x/sin x의 좌우 극한은 모두 1이다.",
        model(
          [-1, 1, 0.5, 1.5],
          [
            curve((x) => x / Math.sin(x), -1, -0.001),
            curve((x) => x / Math.sin(x), 0.001, 1),
            line(p(-1, 1), p(1, 1), C.green),
          ],
        ),
      ),
      S(
        "제곱과 상수배의 극한",
        R`3\cdot1^2=3`,
        "제곱해도 극한은 1이고 마지막에 3을 곱한다.",
        model(
          [-1, 1, 0, 5],
          [
            curve(f, -1, -0.001),
            curve(f, 0.001, 1),
            line(p(-1, 3), p(1, 3), C.green),
          ],
          [dot(p(0, 3), "극한 3", C.green, { open: true })],
        ),
      ),
    ],
    [chk("극한 근사", f(1e-6), 3, 1e-8)],
  );
}
{
  const f = (x) => (x + 2) / (x + 1);
  add(
    "2025-calculus-24",
    "유리함수의 넓이를 직사각형과 로그로 나누기",
    "0≤x≤10에서 (x+2)/(x+1)의 적분",
    "10+ln 11",
    [
      S(
        "주어진 넓이",
        R`\int_0^{10}\frac{x+2}{x+1}\,dx`,
        "구간 전체에서 분모가 양수이므로 곡선 아래 넓이다.",
        model([-0.5, 10.5, 0, 2.3], [curve(f, 0, 10)], [], [area(f, 0, 10)]),
      ),
      S(
        "몫과 나머지 분리",
        R`\frac{x+2}{x+1}=1+\frac1{x+1}`,
        "높이 1인 직사각형과 1/(x+1)의 넓이로 분해한다.",
        model(
          [-0.5, 10.5, 0, 2.3],
          [curve(f, 0, 10), line(p(0, 1), p(10, 1), C.orange)],
          [],
          [
            surface([p(0), p(10), p(10, 1), p(0, 1)], C.orange),
            surface([p(0, 1), ...curve(f, 0, 10).points, p(10, 1)], C.blue),
          ],
        ),
      ),
      S(
        "끝값으로 계산",
        R`[x+\ln(x+1)]_0^{10}=10+\ln11`,
        "직사각형 넓이는 10이고 나머지 넓이는 ln 11이다.",
        model(
          [-0.5, 10.5, 0, 1.3],
          [curve((x) => 1 / (x + 1), 0, 10, C.green)],
          [],
          [area((x) => 1 / (x + 1), 0, 10, C.green)],
          { metrics: [metric("직사각형", "10"), metric("곡선 아래", "ln 11")] },
        ),
      ),
    ],
    [chk("수치적분", integrate(f, 0, 10, 30000), 10 + Math.log(11), 1e-8)],
  );
}
{
  add(
    "2025-calculus-25",
    "발산하는 두 항의 차를 유리화하기",
    "naₙ/(n²+3)→1에서 √(aₙ²+n)−aₙ의 극한",
    "1/2",
    [
      S(
        "수열의 상대 크기",
        R`\frac{a_n}{n}=\frac{na_n}{n^2+3}\left(1+\frac3{n^2}\right)\longrightarrow1`,
        "aₙ의 실제 항은 정해지지 않았다. 수렴 관계와 1+3/n²의 실제 보정항만 표시한다.",
        model(
          [0, 20, 0.8, 4.2],
          [
            curve((n) => 1 + 3 / n ** 2, 1, 20),
            line(p(0, 1), p(20, 1), C.green),
          ],
          [],
          [],
          { metrics: [metric("미정 수열의 조건", "aₙ/n → 1")] },
        ),
      ),
      S(
        "켤레로 곱하기",
        R`\sqrt{a_n^2+n}-a_n=\frac{n}{\sqrt{a_n^2+n}+a_n}`,
        "큰 두 값의 차를 계산하는 대신 분자의 n이 남는 분수로 바꾼다.",
        model(
          [0, 3, 0, 3],
          [line(p(0, 1), p(1, 1), C.blue), line(p(1, 1), p(2, 1), C.orange)],
          [dot(p(1, 1), "√((aₙ/n)²+1/n)→1"), dot(p(2, 1), "aₙ/n→1")],
          [],
          { metrics: [metric("합의 극한", "1+1=2")] },
        ),
      ),
      S(
        "n으로 나눈 분모",
        R`\frac1{\sqrt{(a_n/n)^2+1/n}+a_n/n}\longrightarrow\frac1{1+1}=\frac12`,
        "분모의 극한이 2이므로 역수를 취할 수 있다.",
        model(
          [0, 3, 0, 2.5],
          [line(p(0.5, 0), p(0.5, 2), C.orange)],
          [dot(p(0.5, 2), "분모 2"), dot(p(2, 0.5), "역수 1/2", C.green)],
          [],
          { metrics: [metric("극한", "1/2")] },
        ),
      ),
    ],
    [chk("극한 식", 1 / (Math.sqrt(1) + 1), 0.5)],
  );
}
{
  const A = (x) => (x + 1) / (x * (x + Math.log(x))),
    s = (x) => Math.sqrt(A(x)),
    slices = (n) =>
      Array.from({ length: n }, (_, i) => {
        const x = 1 + ((E - 1) * i) / (n - 1),
          h = s(x);
        return surface(
          [p(x, 0, 0), p(x, h, 0), p(x, h, h), p(x, 0, h)],
          C.blue,
          0.22,
        );
      });
  add(
    "2025-calculus-26",
    "정사각형 단면에서 로그 치환으로",
    "1≤x≤e, 정사각형 단면의 한 변 √((x+1)/(x(x+ln x)))",
    "ln(e+1)",
    [
      S(
        "밑면의 세로 길이",
        R`s(x)=\sqrt{\frac{x+1}{x(x+\ln x)}}`,
        "밑면의 세로 길이가 정사각형의 한 변이다.",
        model([0.8, 3, 0, 1.7], [curve(s, 1, E)], [], [area(s, 1, E)]),
      ),
      S(
        "제곱하여 단면적 얻기",
        R`A(x)=s(x)^2=\frac{1+1/x}{x+\ln x}`,
        "단면을 3차원에서 세운다. 분자 1+1/x는 분모의 도함수다.",
        model([0.8, 3, 0, 1.7], [], [], slices(10), {
          threeD: true,
          equalAspect: true,
        }),
      ),
      S(
        "단면적의 치환적분",
        R`u=x+\ln x,\ du=(1+1/x)dx,\quad V=\int_1^{e+1}\frac{du}{u}`,
        "x=1은 u=1, x=e는 u=e+1로 바뀐다.",
        model(
          [0.8, 4, 0, 1.2],
          [curve((u) => 1 / u, 1, E + 1, C.green)],
          [],
          [area((u) => 1 / u, 1, E + 1, C.green)],
        ),
      ),
      S(
        "부피 계산",
        R`V=[\ln u]_1^{e+1}=\ln(e+1)`,
        "양 끝 로그의 차가 전체 부피다.",
        model(
          [0.8, 4, 0, 1.2],
          [curve((u) => 1 / u, 1, E + 1, C.green)],
          [dot(p(1, 1), "u=1"), dot(p(E + 1, 1 / (E + 1)), "u=e+1")],
          [area((u) => 1 / u, 1, E + 1, C.green)],
          { metrics: [metric("V", "ln(e+1)")] },
        ),
      ),
    ],
    [chk("단면적 적분", integrate(A, 1, E, 30000), Math.log(E + 1), 1e-8)],
  );
}
{
  const g = (x) => (Math.exp(x) - 1) ** 3,
    h = (y) => Math.log(1 + Math.cbrt(y));
  add(
    "2025-calculus-27",
    "역함수 존재가 도함수의 중근을 강제한다",
    "g(x)=f(eˣ)+eˣ, 원점에서의 접선은 x축, h=g⁻¹",
    "1/36",
    [
      S(
        "접선 조건을 f에 전달",
        R`g(0)=0,\ g'(0)=0\implies f(1)=-1,\ f'(1)=-1`,
        "아직 f 전체를 임의로 그리지 않고 주어진 점과 접선 조건만 표시한다.",
        model(
          [0, 2, -2, 1],
          [line(p(0.5, -0.5), p(1.5, -1.5), C.orange)],
          [dot(p(1, -1), "f(1)=−1")],
          [],
          { metrics: [metric("접선 기울기", "−1")] },
        ),
      ),
      S(
        "단조성으로 중근 결정",
        R`g'(x)=e^x\{f'(e^x)+1\}\ge0\implies f'(u)+1=3(u-1)^2`,
        "g는 연속이고 역함수가 있으며 +∞에서 증가한다. 따라서 u>0에서 이차식은 음수가 될 수 없고 u=1이 중근이다.",
        model(
          [0, 2.2, -0.3, 4],
          [curve((u) => 3 * (u - 1) ** 2, 0, 2, C.green)],
          [dot(p(1, 0), "중근")],
        ),
      ),
      S(
        "원래 함수와 역함수의 대응점",
        R`f(u)=u^3-3u^2+2u-1,\quad g(x)=(e^x-1)^3,\quad g(\ln3)=8`,
        "초기값 f(1)=−1로 적분 상수를 정한다.",
        model(
          [-0.5, 1.5, -1, 12],
          [curve(g, -0.5, 1.2)],
          [dot(p(Math.log(3), 8), "(ln 3,8)")],
        ),
      ),
      S(
        "기울기를 역수로 바꾸기",
        R`h'(8)=\frac1{g'(\ln3)}=\frac1{3\cdot3\cdot(3-1)^2}=\frac1{36}`,
        "좌표를 교환하면 가로와 세로 변화량이 바뀐다.",
        model(
          [0, 10, 0, 1.5],
          [
            curve(h, 0, 10, C.green),
            curve((y) => Math.log(3) + (y - 8) / 36, 3, 10, C.orange),
          ],
          [dot(p(8, Math.log(3)), "(8,ln 3)")],
          [],
          { metrics: [metric("역함수 기울기", "1/36")] },
        ),
      ),
    ],
    [
      chk("원함수 값", g(Math.log(3)), 8),
      chk("역함수 중심차분", (h(8.0001) - h(7.9999)) / 0.0002, 1 / 36, 1e-8),
    ],
  );
}
{
  const d = (x) => -x + Math.exp(1 - x * x),
    dd = (x) => -1 - 2 * x * Math.exp(1 - x * x),
    F = (x) => (-x * x) / 2 + integrate((u) => Math.exp(1 - u * u), 0, x, 500),
    gap = (x, t) => F(t) + d(t) * (x - t) - F(x),
    gf = (t) => integrate((x) => x * d(x), 0, t, 4000) - 0.5 * t * t * d(t);
  add(
    "2025-calculus-28",
    "접선과 곡선 사이의 넓이를 미분하기",
    "f′(x)=−x+e^(1−x²), 양의 접점 t와 y축이 만드는 넓이 g(t)",
    "e/2+2/3",
    [
      S(
        "수직 이동을 제거한 곡선",
        R`F(x)=f(x)-f(0),\quad f''(x)=-1-2xe^{1-x^2}<0\ (x>0)`,
        "f(0)는 주어지지 않았다. 세로축을 F=f−f(0)로 잡으면 넓이와 접선 기울기는 그대로다.",
        model(
          [0, 1.6, -0.2, 2],
          [
            curve(F, 0, 1.5),
            curve((x) => F(1) + d(1) * (x - 1), 0, 1.5, C.orange),
          ],
          [dot(p(1, F(1)), "t=1")],
          [],
          { metrics: [metric("세로축", "f(x)−f(0)")] },
        ),
      ),
      S(
        "접선이 위에 있는 영역",
        R`g(t)=\int_0^t[f(t)+f'(t)(x-t)-f(x)]dx`,
        "x>0에서 f″<0이므로 접선과 곡선의 차가 음수가 되지 않는다.",
        model(
          [0, 1.2, 0, 1.5],
          [curve((x) => gap(x, 1), 0, 1, C.orange)],
          [],
          [area((x) => gap(x, 1), 0, 1, C.orange)],
        ),
      ),
      S(
        "부분적분으로 f의 상수 제거",
        R`g(t)=\int_0^t x f'(x)dx-\frac{t^2}{2}f'(t)`,
        "f의 원시함수 전체를 구하지 않고 도함수만으로 넓이를 계산한다.",
        model(
          [0, 1.2, -0.2, 1.5],
          [curve((x) => x * d(x), 0, 1, C.green)],
          [],
          [area((x) => x * d(x), 0, 1, C.green)],
          { metrics: [metric("f′(1)", "0")] },
        ),
      ),
      S(
        "넓이와 변화율 각각 계산",
        R`g(1)=\frac e2-\frac56,\qquad g'(t)=-\frac{t^2}{2}f''(t),\quad g'(1)=\frac32`,
        "미분할 때 두 개의 tf′(t)항이 소거된다.",
        model(
          [0, 1.5, 0, 2],
          [
            curve(gf, 0, 1.4),
            curve((t) => gf(1) + 1.5 * (t - 1), 0.6, 1.4, C.orange),
          ],
          [dot(p(1, gf(1)), "g(1)")],
          [],
          { metrics: [metric("g′(1)", "3/2")] },
        ),
      ),
      S(
        "두 값 더하기",
        R`g(1)+g'(1)=\frac e2-\frac56+\frac32=\frac e2+\frac23`,
        "넓이 함수의 값과 그 기울기를 더한다.",
        model(
          [0, 1.5, 0, 3],
          [],
          [
            dot(p(1, gf(1)), "넓이"),
            dot(p(1, 1.5), "변화율", C.orange),
            dot(p(1, E / 2 + 2 / 3), "합", C.green),
          ],
          [],
          { metrics: [metric("답", "e/2+2/3")] },
        ),
      ),
    ],
    [
      chk("넓이 공식", gf(1), E / 2 - 5 / 6, 1e-7),
      chk("변화율", -0.5 * dd(1), 1.5),
    ],
  );
}
{
  const a = (n) => 5 * (-0.5) ** (n - 1),
    sign = (k) => (-1) ** ((k * (k + 1)) / 2),
    v = (m) => (-0.5) ** (m - 1),
    accepted = [1, 3, 5, 7, 9];
  add(
    "2025-calculus-29",
    "절댓값 급수에서 부호 주기의 합까지",
    "Σ(|aₙ|+aₙ)=40/3, Σ(|aₙ|−aₙ)=20/3인 등비수열",
    "25",
    [
      S(
        "더하기와 빼기로 두 급수 분리",
        R`\sum|a_n|=10,\quad\sum a_n=10/3`,
        "양의 항과 음의 항이 모두 있으므로 공비는 음수다.",
        model(
          [0, 8, -3, 6],
          [],
          dotsN(a, 7),
          bars(
            Array.from({ length: 7 }, (_, i) => a(i + 1)),
            C.blue,
            1,
          ),
          {
            metrics: [
              metric("절댓값 합", "10"),
              metric("부호 있는 합", "10/3"),
            ],
          },
        ),
      ),
      S(
        "첫째항과 공비 결정",
        R`\frac{|a_1|}{1-|r|}=10,\quad\frac{a_1}{1-r}=10/3\implies a_1=5,\ r=-1/2`,
        "합이 양수이므로 첫째항도 양수다. 두 식을 나누어 r을 정한다.",
        model(
          [0, 8, -3, 6],
          [path(Array.from({ length: 7 }, (_, i) => p(i + 1, a(i + 1))))],
          dotsN(a, 7),
          [],
          { metrics: [metric("aₙ", "5(−1/2)ⁿ⁻¹")] },
        ),
      ),
      S(
        "네 항의 부호 주기로 묶기",
        R`\sum_{k\ge1}(-1)^{k(k+1)/2}(-1/2)^k=\frac{1/2-1/4-1/8+1/16}{1-1/16}=\frac15`,
        "가중 부호는 +,−,−,+가 반복된다. 네 항씩 묶은 급수의 공비는 1/16이다.",
        model(
          [0, 9, -0.3, 0.6],
          [],
          dotsN((k) => sign(k) * (-0.5) ** k, 8),
          bars(
            Array.from(
              { length: 8 },
              (_, i) => sign(i + 1) * (-0.5) ** (i + 1),
            ),
            C.orange,
            1,
          ),
        ),
      ),
      S(
        "m에 관한 부등식으로 축소",
        R`\lim\sum_{k=1}^{2n}(-1)^{k(k+1)/2}a_{m+k}=(-1/2)^{m-1}>1/700`,
        "짝수 m은 음수라 제외된다. 홀수 m의 양수 값만 경계와 비교한다.",
        model(
          [0, 12, -0.6, 1.1],
          [line(p(0, 1 / 700), p(12, 1 / 700), C.orange)],
          dotsN(v, 11),
          [],
          {
            metrics: [
              metric("m 홀수", "2^(m−1)<700"),
              metric("경계 부근", "m=9:1/256, m=11:1/1024"),
            ],
          },
        ),
      ),
      S(
        "허용하는 자연수 더하기",
        R`m\in\{1,3,5,7,9\},\quad\sum m=25`,
        "m=9에서는 1/256이고 m=11에서는 1/1024라서 경계를 넘지 못한다.",
        model(
          [0, 12, 0, 1],
          [],
          accepted.map((m) => dot(p(m, 0.5), String(m), C.green)),
          [],
          { metrics: [metric("합", "25")] },
        ),
      ),
    ],
    [
      chk(
        "가중 급수",
        Array.from(
          { length: 80 },
          (_, i) => sign(i + 1) * (-0.5) ** (i + 1),
        ).reduce((s, x) => s + x, 0),
        0.2,
      ),
      chk(
        "허용 m의 합",
        accepted.reduce((s, x) => s + x, 0),
        25,
      ),
    ],
  );
}
{
  const phase = (x) => 1.5 * x - 3 * PI + Math.sin(x),
    f = (x) => Math.sin(phase(x)),
    df = (x) => (1.5 + Math.cos(x)) * Math.cos(phase(x)),
    peaks = [-1.5 * PI, 0.5 * PI, 2.5 * PI].map((y) =>
      bisect((x) => phase(x) - y, 0, 4 * PI),
    );
  add(
    "2025-calculus-30",
    "위상 함수의 증가로 극대점 세기",
    "f(x)=sin(ax+b+sin x), 도함수의 첫 재현 시각이 4π",
    "17",
    [
      S(
        "함숫값 조건으로 후보 축소",
        R`\sin b=0,\quad\sin(2\pi a+b)=2\pi a+b\implies b=-2\pi a,\ a\in\{1,3/2,2\}`,
        "sin u=u의 해는 0이다. b가 π의 정수배인 조건과 합친다.",
        model(
          [0.5, 2.5, -14, 0],
          [line(p(1, -2 * PI), p(2, -4 * PI), C.muted)],
          [
            dot(p(1, -2 * PI), "a=1"),
            dot(p(1.5, -3 * PI), "a=3/2"),
            dot(p(2, -4 * PI), "a=2"),
          ],
        ),
      ),
      S(
        "도함수의 첫 반복으로 선택",
        R`a=1,2\Rightarrow f'(2\pi)=f'(0);\quad a=3/2,\ b=-3\pi`,
        "정수 a는 2π에서 이미 같은 도함숫값을 가져 제외된다. a=3/2에서는 최솟값 −5/2의 첫 재현이 4π다.",
        model(
          [0, 4 * PI, -3, 3],
          [
            curve(df, 0, 4 * PI, C.blue, 220),
            line(p(0, -2.5), p(4 * PI, -2.5), C.orange),
          ],
          [dot(p(0, -2.5), "0"), dot(p(4 * PI, -2.5), "4π")],
        ),
      ),
      S(
        "위상 좌표로 극대 조건 이동",
        R`u(x)=\frac32x-3\pi+\sin x,\quad u'(x)=3/2+\cos x>0`,
        "u는 −3π에서 3π까지 엄격히 증가하므로 사인의 극대 위상을 한 번씩 지난다.",
        model(
          [0, 4 * PI, -10, 10],
          [
            curve(phase, 0, 4 * PI),
            ...[-1.5 * PI, 0.5 * PI, 2.5 * PI].map((y) =>
              line(p(0, y), p(4 * PI, y), C.orange),
            ),
          ],
          peaks.map((x, i) => dot(p(x, phase(x)), `극대 ${i + 1}`)),
        ),
      ),
      S(
        "극대 세 개와 첫 위치",
        R`u=-3\pi/2,\ \pi/2,\ 5\pi/2;\quad n=3,\ \alpha_1=\pi`,
        "u(π)=−3π/2이고 u가 증가하므로 첫 극대의 위치는 정확히 π이다.",
        model(
          [0, 4 * PI, -1.3, 1.3],
          [curve(f, 0, 4 * PI, C.green, 220)],
          peaks.map((x, i) => dot(p(x, 1), i === 0 ? "α₁=π" : `α${i + 1}`)),
        ),
      ),
      S(
        "요구한 π의 계수",
        R`n\alpha_1-ab=3\pi-\frac32(-3\pi)=\frac{15}{2}\pi\implies p+q=17`,
        "기약분수 15/2의 분자와 분모를 더한다.",
        model(
          [0, 4 * PI, -1.3, 1.3],
          [curve(f, 0, 4 * PI, C.green, 160)],
          [dot(p(PI, 1), "첫 극대")],
          [],
          {
            metrics: [
              metric("n", "3"),
              metric("계수", "15/2"),
              metric("답", "17"),
            ],
          },
        ),
      ),
    ],
    [
      chk("첫 극대의 위상", phase(PI), -1.5 * PI),
      chk("첫 도함수 반복", df(4 * PI), df(0)),
      chk("π 계수", 3 - 1.5 * -3, 7.5),
    ],
  );
}

fs.mkdirSync(new URL("../../src/data/question-visuals/", import.meta.url), {
  recursive: true,
});
fs.writeFileSync(
  new URL(
    "../../src/data/question-visuals/calculus-recent.json",
    import.meta.url,
  ),
  JSON.stringify(items, null, 2) + "\n",
);
console.log(
  `calculus-recent: ${items.length} verified question visualizations`,
);
