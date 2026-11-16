import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import {
  C,
  p,
  line,
  path,
  curve,
  dot,
  surface,
  circle,
  frame,
  step,
  round,
} from "./helpers.mjs";

const metadata = JSON.parse(
  readFileSync(
    new URL("../../src/data/questions.json", import.meta.url),
    "utf8",
  ),
).questions;
const output = [];
const R = String.raw;
const O = p(0, 0, 0),
  addv = (a, b) => a.map((v, i) => v + b[i]),
  sub = (a, b) => a.map((v, i) => v - b[i]),
  mul = (a, t) => a.map((v) => v * t);
const dp = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0),
  norm = (a) => Math.sqrt(dp(a, a)),
  dist = (a, b) => norm(sub(a, b));
const cross = (a, b) =>
  p(
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  );
const unit = (a) => mul(a, 1 / norm(a)),
  mid = (a, b) => mul(addv(a, b), 0.5);
const project = (a, base, n) => sub(a, mul(n, dp(sub(a, base), n) / dp(n, n)));
const poly = (pts, color = C.blue) => path([...pts, pts[0]], color);
const ellipse = (a, b, cx = 0, cy = 0, color = C.blue) =>
  curve(
    (t) => p(cx + a * Math.cos(t), cy + b * Math.sin(t)),
    0,
    Math.PI * 2,
    color,
    100,
  );
const hyper = (a, b, side = 1, color = C.blue) =>
  curve((t) => p(side * a * Math.cosh(t), b * Math.sinh(t)), -1.8, 1.8, color);
const para = (f, y0 = 0, color = C.blue, span = 6) =>
  curve((y) => p((y * y) / (4 * f), y + y0), -span, span, color);
const m = (args = {}) => frame({ equalAspect: true, ...args });
const st = (title, formula, body, model) =>
  step(title, formula, body, {
    ...model,
    description: model.description || body,
  });
const check = (label, actual, expected, tolerance = 1e-7) => ({
  label,
  actual: round(actual),
  expected: round(expected),
  tolerance,
});
function add(id, title, summary, result, steps, checks) {
  const q = metadata.find((q) => q.id === id);
  if (!q) throw Error("Unknown question " + id);
  if (steps.length < 3) throw Error("Too few steps " + id);
  for (const c of checks)
    if (Math.abs(c.actual - c.expected) > c.tolerance)
      throw Error(id + " " + c.label + " " + c.actual + " != " + c.expected);
  output.push({
    id,
    subject: "geometry",
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
function save() {
  mkdirSync(new URL("../../src/data/question-visuals/", import.meta.url), {
    recursive: true,
  });
  const sorted = [...output].sort((a, b) =>
    a.id.localeCompare(b.id, "en", { numeric: true }),
  );
  writeFileSync(
    new URL("../../src/data/question-visuals/geometry.json", import.meta.url),
    JSON.stringify(sorted, null, 2) + "\n",
  );
}

// 2022: the eight actual geometry questions.
{
  const A = p(2, 1, 3),
    P = p(2, 1, -3),
    Q = p(-2, 1, 3),
    H = p(2, 1, 0);
  const base = {
    threeD: true,
    range: [-4, 4, -4, 4],
    surfaces: [surface([p(-4, -2), p(4, -2), p(4, 4), p(-4, 4)], C.muted)],
  };
  add(
    "2022-geometry-23",
    "좌표평면에 대한 대칭",
    "A(2,1,3)를 xy평면과 yz평면에 각각 대칭시킨 두 점 사이의 거리를 구한다.",
    "2√13",
    [
      st(
        "xy평면 대칭",
        R`P=(2,1,-3)`,
        "xy평면 대칭에서는 z좌표의 부호가 바뀐다.",
        m({
          ...base,
          lines: [line(A, P, C.orange)],
          dots: [dot(A, "A"), dot(P, "P"), dot(H, "xy평면")],
        }),
      ),
      st(
        "yz평면 대칭",
        R`Q=(-2,1,3)`,
        "yz평면 대칭에서는 x좌표의 부호가 바뀐다.",
        m({
          ...base,
          lines: [line(A, P, C.orange), line(A, Q, C.green)],
          dots: [dot(A, "A"), dot(P, "P"), dot(Q, "Q")],
        }),
      ),
      st(
        "거리 계산",
        R`PQ=\sqrt{(-4)^2+0^2+6^2}=2\sqrt{13}`,
        "두 대칭점의 좌표 차를 직각삼각형의 두 변으로 본다.",
        m({
          ...base,
          lines: [
            line(P, Q),
            line(P, p(-2, 1, -3), C.muted),
            line(p(-2, 1, -3), Q, C.muted),
          ],
          dots: [dot(P, "P"), dot(Q, "Q")],
        }),
      ),
    ],
    [check("PQ²", dist(P, Q) ** 2, 52)],
  );
}
{
  const a = Math.sqrt(12),
    c = 3 * Math.sqrt(2);
  add(
    "2022-geometry-24",
    "초점에서 주축 찾기",
    "쌍곡선 x²/a²−y²/6=1의 초점이 (3√2,0)이다.",
    "4√3",
    [
      st(
        "초점과 반축",
        R`c=3\sqrt2,\quad b^2=6`,
        "초점은 x축 위에 있고 주축은 두 꼭짓점 사이에 놓인다.",
        m({
          range: [-6, 6, -5, 5],
          dots: [dot(p(c), "F"), dot(p(-c), "F′")],
          lines: [line(p(-c), p(c), C.muted)],
        }),
      ),
      st(
        "반주축 계산",
        R`a^2=c^2-b^2=18-6=12`,
        "쌍곡선에서는 초점거리의 제곱이 두 반축 제곱의 합이다.",
        m({
          range: [-6, 6, -5, 5],
          lines: [hyper(a, Math.sqrt(6)), hyper(a, Math.sqrt(6), -1)],
          dots: [dot(p(a), "A"), dot(p(-a), "A′"), dot(p(c), "F")],
        }),
      ),
      st(
        "주축 길이",
        R`2a=2\sqrt{12}=4\sqrt3`,
        "양쪽 꼭짓점을 잇는 선분이 주축이다.",
        m({
          range: [-6, 6, -5, 5],
          lines: [
            hyper(a, Math.sqrt(6)),
            hyper(a, Math.sqrt(6), -1),
            line(p(-a), p(a), C.orange),
          ],
          dots: [dot(p(a), "A"), dot(p(-a), "A′")],
        }),
      ),
    ],
    [check("초점 관계", a * a + 6, c * c), check("주축²", (2 * a) ** 2, 48)],
  );
}
{
  const a = p(2, 1),
    b = p(1, 3),
    u = unit(a),
    v = unit(b);
  add(
    "2022-geometry-25",
    "방향벡터의 끼인각",
    "대칭형으로 주어진 두 직선 (x+1)/2=y−3, x−2=(y−5)/3의 예각을 구한다.",
    "√2/2",
    [
      st(
        "방향벡터 읽기",
        R`\vec u=(2,1),\quad\vec v=(1,3)`,
        "직선의 분모는 x와 y의 증가 비율을 준다. 평행이동해 원점에서 비교한다.",
        m({
          range: [-1, 4, -1, 4],
          lines: [line(O, a), line(O, b, C.green)],
          dots: [dot(a, "u"), dot(b, "v")],
        }),
      ),
      st(
        "단위벡터로 바꾸기",
        R`|\vec u|=\sqrt5,\quad |\vec v|=\sqrt{10}`,
        "길이를 1로 맞추면 내적이 곧 각의 코사인이 된다.",
        m({
          range: [-0.2, 1.2, -0.2, 1.2],
          lines: [circle(0, 0, 1, C.muted), line(O, u), line(O, v, C.green)],
          dots: [dot(u, "u/√5"), dot(v, "v/√10")],
        }),
      ),
      st(
        "예각의 코사인",
        R`\cos\theta=\frac{|2\cdot1+1\cdot3|}{\sqrt5\sqrt{10}}=\frac{\sqrt2}{2}`,
        "내적이 양수이므로 두 방향벡터 사이의 각이 바로 필요한 예각이다.",
        m({
          range: [-0.2, 1.2, -0.2, 1.2],
          lines: [
            line(O, u),
            line(O, v, C.green),
            line(v, mul(u, dp(u, v)), C.orange, { dashed: true }),
          ],
          dots: [dot(mul(u, dp(u, v)), "정사영")],
          metrics: [{ label: "cos θ", value: "√2/2" }],
        }),
      ),
    ],
    [check("단위벡터 내적", dp(u, v), Math.SQRT1_2)],
  );
}
{
  const c = 4 * Math.sqrt(3),
    A = p(Math.sqrt(37), 1.5 * Math.sqrt(3)),
    B = p(0, -4.5 * Math.sqrt(3)),
    F = p(c),
    G = p(-c);
  const r = 9;
  const foot = (P, U, V) =>
    addv(
      U,
      mul(sub(V, U), dp(sub(P, U), sub(V, U)) / dp(sub(V, U), sub(V, U))),
    );
  const H = foot(B, A, F),
    J = foot(B, A, G);
  add(
    "2022-geometry-26",
    "타원의 초점거리와 접원 넓이",
    "타원 x²/64+y²/16=1에서 AFBF′의 넓이가 72인 접원의 반지름을 구한다.",
    "9",
    [
      st(
        "타원의 거리 합",
        R`AF+AF'=2a=16`,
        "주어진 타원의 장반축은 8이다. 초점을 잇는 두 선분의 길이 합은 항상 16이다.",
        m({
          range: [-10, 10, -18, 7],
          lines: [ellipse(8, 4), line(A, F), line(A, G)],
          dots: [dot(A, "A"), dot(F, "F"), dot(G, "F′")],
        }),
      ),
      st(
        "공통 높이 r",
        R`BH=BJ=r`,
        "원의 중심 B에서 두 접선까지의 수선 길이는 모두 반지름이다.",
        m({
          range: [-10, 10, -18, 7],
          lines: [
            ellipse(8, 4),
            line(A, F),
            line(A, G),
            circle(B[0], B[1], r, C.green),
            line(B, H, C.orange),
            line(B, J, C.orange),
          ],
          dots: [dot(B, "B"), dot(H, "H"), dot(J, "J")],
        }),
      ),
      st(
        "두 삼각형으로 분할",
        R`72=[ABF]+[ABF']=\frac r2(AF+AF')`,
        "대각선 AB로 나누면 밑변은 AF와 AF′이고 높이는 공통으로 r이다.",
        m({
          range: [-10, 10, -18, 7],
          lines: [poly([A, F, B, G]), line(A, B, C.orange)],
          surfaces: [surface([A, B, F]), surface([A, B, G], C.green)],
          dots: [dot(A, "A"), dot(B, "B")],
        }),
      ),
      st(
        "반지름 확정",
        R`72=8r\quad\Longrightarrow\quad r=9`,
        "선택되는 A의 좌표도 타원과 넓이 조건을 만족한다. 두 수선의 실제 길이가 9인지 검산한다.",
        m({
          range: [-10, 10, -18, 7],
          lines: [
            poly([A, F, B, G]),
            circle(B[0], B[1], 9, C.green),
            line(B, H, C.orange),
          ],
          dots: [dot(H, "접점"), dot(B, "r=9")],
          metrics: [{ label: "사각형 넓이", value: "72" }],
        }),
      ),
    ],
    [
      check("A가 타원 위", A[0] ** 2 / 64 + A[1] ** 2 / 16, 1),
      check("접원의 반지름", dist(B, H), 9),
      check("다른 접선 거리", dist(B, J), 9),
      check("사각형 넓이", c * (A[1] - B[1]), 72),
    ],
  );
}
{
  const A = p(0, 0, 4),
    D = p(0, 4, 4),
    E = p(0, 0, 0),
    G = p(4, 4, 0),
    M = mid(A, D),
    J = p(0, 2),
    I = p(1, 1),
    H = p(0, 4);
  const cube = [
    poly([p(0, 0), p(4, 0), G, H], C.muted),
    poly([A, p(4, 0, 4), p(4, 4, 4), D], C.muted),
    ...[p(0, 0), p(4, 0), G, H].map((v) =>
      line(v, addv(v, p(0, 0, 4)), C.muted),
    ),
  ];
  add(
    "2022-geometry-27",
    "정육면체의 삼각형 높이",
    "모서리 길이 4인 정육면체에서 AD의 중점 M과 E,G가 만드는 삼각형의 넓이를 구한다.",
    "12",
    [
      st(
        "밑면 대각선",
        R`EG=4\sqrt2`,
        "EG를 밑변으로 정하고 M에서 밑면으로 내린 수선의 발 J를 표시한다.",
        m({
          threeD: true,
          range: [-1, 5, -1, 5],
          lines: [...cube, line(E, G), line(M, J, C.orange)],
          dots: [dot(M, "M"), dot(E, "E"), dot(G, "G"), dot(J, "J")],
        }),
      ),
      st(
        "밑면에서 한 번 더 투영",
        R`JI=\sqrt2,\quad MJ=4`,
        "J를 EG에 수선으로 투영한 I는 (1,1,0)이다. 삼수선 정리에 의해 MI도 EG에 수직이다.",
        m({
          threeD: true,
          range: [-1, 5, -1, 5],
          lines: [
            ...cube,
            line(E, G),
            line(M, J, C.orange),
            line(J, I, C.green),
            line(M, I, C.red),
          ],
          dots: [dot(M, "M"), dot(J, "J"), dot(I, "I")],
        }),
      ),
      st(
        "공간 높이와 넓이",
        R`MI=\sqrt{4^2+(\sqrt2)^2}=3\sqrt2,\quad[MEG]=\frac12(4\sqrt2)(3\sqrt2)=12`,
        "직각삼각형 MJI에서 높이를 구한 뒤 밑변과 곱한다.",
        m({
          threeD: true,
          range: [-1, 5, -1, 5],
          lines: [...cube, poly([M, E, G]), line(M, I, C.orange)],
          surfaces: [surface([M, E, G])],
          dots: [dot(M, "M"), dot(I, "높이의 발")],
        }),
      ),
    ],
    [
      check("수직 조건", dp(sub(M, I), sub(G, E)), 0),
      check("벡터 외적 넓이", norm(cross(sub(E, M), sub(G, M))) / 2, 12),
    ],
  );
}
{
  const a = (3 * Math.sqrt(3)) / 2,
    f = 0.5,
    F1 = p(f, a),
    F2 = p(-1),
    P = p(1 / 6, (7 * Math.sqrt(3)) / 6),
    Q = p(-1 / 3, (2 * Math.sqrt(3)) / 3),
    H = p(Q[0], P[1]);
  add(
    "2022-geometry-28",
    "마주 보는 포물선의 초점선",
    "(y−a)²=4px와 y²=−4x에서 초점거리 3, 초점선 안의 두 교점 거리 1을 사용한다.",
    "7",
    [
      st(
        "초점의 좌표",
        R`F_1=(p,a),\quad F_2=(-1,0),\quad (p+1)^2+a^2=9`,
        "두 포물선의 초점 사이 거리가 3이다. 그림은 최종 조건을 만족하는 실제 배치를 사용한다.",
        m({
          range: [-4, 4, -3, 6],
          lines: [
            para(f, a, C.blue, 3),
            para(-1, 0, C.green, 3),
            line(F1, F2, C.muted),
          ],
          dots: [dot(F1, "F₁"), dot(F2, "F₂")],
        }),
      ),
      st(
        "교점 사이의 수평 차",
        R`x_P-x_Q=\frac{p+1}{3}`,
        "PQ와 F₁F₂는 같은 직선에 있고 길이 비가 1:3이므로 수평 성분도 그 비율이다.",
        m({
          range: [-4, 4, -3, 6],
          lines: [
            para(f, a, C.blue, 3),
            para(-1, 0, C.green, 3),
            line(F1, F2, C.muted),
            line(P, Q, C.orange),
            line(P, H, C.red),
            line(H, Q, C.red),
          ],
          dots: [dot(P, "P"), dot(Q, "Q")],
        }),
      ),
      st(
        "준선 거리로 전환",
        R`PF_1=p+x_P,\quad QF_2=1-x_Q,\quad PF_1+QF_2=2`,
        "포물선의 정의를 사용하면 초점까지의 거리를 x좌표로 바꿀 수 있다. 전체 길이 3에서 PQ=1을 뺀다.",
        m({
          range: [-4, 4, -3, 6],
          lines: [
            para(f, a, C.blue, 3),
            para(-1, 0, C.green, 3),
            line(F1, P, C.orange),
            line(F2, Q, C.orange),
            line(p(-f, -3), p(-f, 6), C.muted, { dashed: true }),
            line(p(1, -3), p(1, 6), C.muted, { dashed: true }),
          ],
          dots: [dot(P, "P"), dot(Q, "Q")],
        }),
      ),
      st(
        "p와 a² 계산",
        R`p+1+\frac{p+1}{3}=2\Rightarrow p=\frac12,\quad a^2=9-\frac94=\frac{27}4`,
        "거리 관계를 먼저 p의 일차방정식으로 만든다.",
        m({
          range: [-4, 4, -3, 6],
          lines: [
            line(F2, F1),
            line(F2, p(f, 0), C.green),
            line(p(f, 0), F1, C.orange),
          ],
          dots: [dot(F1, "(1/2,3√3/2)"), dot(F2, "(−1,0)")],
        }),
      ),
      st(
        "요구한 값",
        R`a^2+p^2=\frac{27}4+\frac14=7`,
        "구한 상수로 두 포물선과 모든 거리 조건을 다시 확인한다.",
        m({
          range: [-4, 4, -3, 6],
          lines: [
            para(f, a, C.blue, 3),
            para(-1, 0, C.green, 3),
            line(F2, F1, C.muted),
            line(Q, P, C.orange),
          ],
          dots: [dot(F1, "F₁"), dot(F2, "F₂"), dot(P, "P"), dot(Q, "Q")],
          metrics: [{ label: "F₁F₂ / PQ", value: "3 / 1" }],
        }),
      ),
    ],
    [
      check("초점거리", dist(F1, F2), 3),
      check("교점거리", dist(P, Q), 1),
      check("P의 포물선 식", (P[1] - a) ** 2, 4 * f * P[0]),
      check("Q의 포물선 식", Q[1] ** 2, -4 * Q[0]),
      check("a²+p²", a * a + f * f, 7),
    ],
  );
}
{
  const A = p(Math.sqrt(2)),
    B = p(1 / Math.sqrt(2), Math.sqrt(30) / 2),
    D = addv(A, B),
    T = mul(B, 1 / 3),
    P = mul(D, 0.25),
    X = mul(unit(P), Math.sqrt(2)),
    M = 4 * Math.sqrt(2),
    small = (3 * Math.sqrt(3)) / 2 - Math.sqrt(2);
  add(
    "2022-geometry-29",
    "내적 조건을 선분으로 바꾸기",
    "평행사변형의 내부 조건과 OP·OB+BP·BC=2를 함께 만족하는 P의 범위에서 벡터 길이의 최댓값·최솟값을 찾는다.",
    "100",
    [
      st(
        "평행사변형의 실제 좌표",
        R`A=(\sqrt2,0),\ B=(1/\sqrt2,\sqrt{30}/2),\quad \vec{OA}\cdot\vec{OB}=1`,
        "길이와 끼인각 조건을 만족하도록 O와 A를 x축에 놓는다.",
        m({
          range: [-2, 6, -2, 5],
          lines: [poly([O, A, D, B])],
          surfaces: [surface([O, A, D, B])],
          dots: [dot(O, "O"), dot(A, "A"), dot(B, "B"), dot(D, "C")],
        }),
      ),
      st(
        "허용 위치는 닫힌 선분",
        R`\vec{OP}\cdot\vec{OC}=3,\quad 3s+9t=3\Rightarrow s+3t=1`,
        "0≤s,t≤1과 결합하면 P는 A와 B/3 사이의 선분 전체를 움직인다.",
        m({
          range: [-2, 6, -2, 5],
          lines: [
            poly([O, A, D, B], C.muted),
            line(A, T, C.orange),
            line(O, D, C.green),
          ],
          dots: [dot(A, "최대 거리"), dot(T, "B/3")],
        }),
      ),
      st(
        "원점에서 가장 가까운 위치",
        R`|OC|^2=12,\quad P_{\min}=\frac14C,\quad |OP_{\min}|=\frac{\sqrt3}{2}`,
        "원점에서 제한 직선에 내린 수선의 발이 선분 안에 있다.",
        m({
          range: [-2, 6, -2, 5],
          lines: [line(A, T), line(O, P, C.orange), line(O, D, C.muted)],
          dots: [dot(P, "Pmin"), dot(O, "O")],
        }),
      ),
      st(
        "원의 반지름을 더하고 빼기",
        R`M=3\sqrt2+\sqrt2=4\sqrt2,\quad m=\frac{3\sqrt3}{2}-\sqrt2`,
        "3P와 원 위의 X 사이 거리로 바꾼다. 가장 먼 경우 X는 반대 방향, 가장 가까운 경우 같은 방향이다.",
        m({
          range: [-2, 6, -2, 5],
          lines: [
            circle(0, 0, Math.sqrt(2)),
            line(mul(A, 3), mul(A, -1), C.red),
            line(mul(P, 3), X, C.green),
          ],
          dots: [
            dot(mul(A, 3), "3Pmax"),
            dot(mul(A, -1), "Xmax"),
            dot(mul(P, 3), "3Pmin"),
            dot(X, "Xmin"),
          ],
        }),
      ),
      st(
        "계수의 제곱합",
        R`Mm=6\sqrt6-8,\quad a^2+b^2=6^2+(-8)^2=100`,
        "두 극값은 서로 다른 P와 X에서 이루어진다. 각각의 극값을 곱한 뒤 계수를 읽는다.",
        m({
          range: [-2, 6, -2, 5],
          lines: [
            circle(0, 0, Math.sqrt(2)),
            line(A, T, C.orange),
            line(O, P, C.green),
          ],
          dots: [dot(A, "|OP|max=√2"), dot(P, "|OP|min=√3/2")],
          metrics: [{ label: "M × m", value: "6√6 − 8" }],
        }),
      ),
    ],
    [
      check("A·B", dp(A, B), 1),
      check("최소점 조건", dp(P, D), 3),
      check("극값 곱", M * small, 6 * Math.sqrt(6) - 8),
      check("계수 제곱합", 36 + 64, 100),
    ],
  );
}
{
  const CC = p(2, Math.sqrt(5), 5),
    P = p(0, 0, 1),
    Cp = p(2, Math.sqrt(5)),
    e = p(2 / 3, Math.sqrt(5) / 3),
    v = p(-Math.sqrt(5) / 3, 2 / 3),
    Q = addv(CC, mul(e, 5)),
    RR = addv(CC, mul(v, 5)),
    Q1 = p(Q[0], Q[1]),
    R1 = p(RR[0], RR[1]),
    N = cross(sub(Q, P), sub(RR, P));
  const proj = [O, Q1, R1].map((a) => project(a, P, N));
  const base = { threeD: true, range: [-6, 9, -3, 9] };
  const equator = curve(
    (t) => addv(CC, addv(mul(e, 5 * Math.cos(t)), p(0, 0, 5 * Math.sin(t)))),
    0,
    2 * Math.PI,
  );
  add(
    "2022-geometry-30",
    "정사영 넓이를 두 번 계산하기",
    "중심 C(2,√5,5), 반지름 5인 구에서 Q의 큰원 조건과 R의 구면 조건을 사용해 두 단계 정사영 넓이를 계산한다.",
    "23",
    [
      st(
        "수직 단면과 바닥 원",
        R`C'=(2,\sqrt5,0),\quad OC'=3`,
        "평면 OPC는 수직이고 구의 중심을 지난다. Q의 바닥 정사영은 직선 OC′ 위에 있다.",
        m({
          ...base,
          lines: [equator, line(O, Cp, C.green), line(Cp, CC, C.orange)],
          dots: [dot(CC, "C"), dot(P, "P"), dot(Cp, "C′")],
        }),
      ),
      st(
        "OQ₁을 가장 길게",
        R`OQ_1=OC'+5=8`,
        "중심에서 바닥 방향으로 반지름 5만큼 이동한 Q가 밑변 길이를 최대화한다.",
        m({
          ...base,
          lines: [equator, line(O, Q1), line(Q1, Q, C.orange)],
          dots: [dot(Q, "Q"), dot(Q1, "Q₁"), dot(CC, "C")],
        }),
      ),
      st(
        "R₁의 높이를 가장 크게",
        R`R_1C'=5,\quad[OQ_1R_1]=\frac12\cdot8\cdot5=20`,
        "R은 중심을 지나는 수평선 중 OC′와 수직인 방향의 끝점이다. 대칭인 두 선택은 같은 값을 준다.",
        m({
          ...base,
          lines: [
            equator,
            poly([O, Q1, R1]),
            line(Cp, R1, C.orange),
            line(R1, RR, C.green),
          ],
          surfaces: [surface([O, Q1, R1])],
          dots: [dot(RR, "R"), dot(R1, "R₁")],
        }),
      ),
      st(
        "공간 삼각형의 변",
        R`PQ=4\sqrt5,\quad PR=QR=5\sqrt2`,
        "P의 높이는 1, Q와 R의 높이는 5이다. 수평 거리와 높이 차 4를 합친다.",
        m({
          ...base,
          lines: [
            poly([P, Q, RR]),
            poly([O, Q1, R1], C.muted),
            line(P, O, C.orange),
            line(Q, Q1, C.orange),
            line(RR, R1, C.orange),
          ],
          surfaces: [surface([P, Q, RR], C.green)],
          dots: [dot(P, "P"), dot(Q, "Q"), dot(RR, "R")],
        }),
      ),
      st(
        "평면 사이 각의 코사인",
        R`[PQR]=10\sqrt6,\quad\cos\theta=\frac{20}{10\sqrt6}=\frac{\sqrt6}{3}`,
        "PQR의 바닥 정사영이 OQ₁R₁이므로 넓이의 비가 평면각의 코사인이다.",
        m({
          ...base,
          lines: [poly([P, Q, RR]), poly([O, Q1, R1])],
          surfaces: [surface([P, Q, RR], C.green), surface([O, Q1, R1])],
          dots: [
            dot(mid(P, Q), "공간 넓이 10√6"),
            dot(mid(O, Q1), "바닥 넓이 20"),
          ],
        }),
      ),
      st(
        "다시 PQR 평면으로 투영",
        R`20\cos\theta=\frac{20\sqrt6}{3},\quad p+q=3+20=23`,
        "이번에는 바닥 삼각형을 PQR 평면에 수직으로 내려보낸다. 역방향 투영도 코사인을 곱한다.",
        m({
          ...base,
          lines: [
            poly([P, Q, RR], C.muted),
            poly(proj, C.orange),
            ...[O, Q1, R1].map((a, i) =>
              line(a, proj[i], C.green, { dashed: true }),
            ),
          ],
          surfaces: [surface(proj, C.orange)],
          dots: proj.map((a, i) => dot(a, ["O의 상", "Q₁의 상", "R₁의 상"][i])),
        }),
      ),
    ],
    [
      check("Q 구면", dist(Q, CC), 5),
      check("R 구면", dist(RR, CC), 5),
      check("바닥 넓이", norm(cross(Q1, R1)) / 2, 20),
      check("공간 넓이", norm(N) / 2, 10 * Math.sqrt(6)),
      check(
        "최종 투영 넓이",
        norm(cross(sub(proj[1], proj[0]), sub(proj[2], proj[0]))) / 2,
        (20 * Math.sqrt(6)) / 3,
      ),
    ],
  );
}
save();

// Coordinate and vector exercises share rendering primitives, not example data.
function vectorSum(id, a, b, coefficient, result) {
  const bb = mul(b, coefficient),
    v = addv(a, bb),
    range = [
      Math.min(0, a[0], b[0], v[0]) - 2,
      Math.max(0, a[0], b[0], v[0]) + 2,
      Math.min(0, a[1], b[1], v[1]) - 2,
      Math.max(0, a[1], b[1], v[1]) + 2,
    ];
  add(
    id,
    "벡터의 성분과 합",
    `a=(${a[0]},${a[1]}), b=(${b[0]},${b[1]})에서 a+(${coefficient})b의 성분 합을 계산한다.`,
    String(result),
    [
      st(
        "주어진 두 벡터",
        R`\vec a=(${a[0]},${a[1]}),\quad\vec b=(${b[0]},${b[1]})`,
        "두 벡터를 원점에서 그려 각 성분을 확인한다.",
        m({
          range,
          lines: [line(O, a), line(O, b, C.green)],
          dots: [dot(a, "a"), dot(b, "b")],
        }),
      ),
      st(
        "배수와 평행이동",
        R`${coefficient}\vec b=(${bb[0]},${bb[1]})`,
        "b의 방향과 길이를 계수에 맞춘 다음 a의 끝점으로 평행이동한다.",
        m({
          range,
          lines: [line(O, a), line(a, v, C.orange), line(O, bb, C.muted)],
          dots: [dot(a, "a"), dot(v, "a+kb")],
        }),
      ),
      st(
        "성분 합",
        R`\vec a+${coefficient}\vec b=(${v[0]},${v[1]}),\quad ${v[0]}+(${v[1]})=${result}`,
        "합벡터를 x성분과 y성분으로 분해해 더한다.",
        m({
          range,
          lines: [
            line(O, v, C.red),
            line(O, p(v[0]), C.green),
            line(p(v[0]), v, C.orange),
          ],
          dots: [dot(v, "합벡터")],
        }),
      ),
    ],
    [check("성분 합", v[0] + v[1], result)],
  );
}
vectorSum("2017-a-1", p(1, 3), p(5, -6), -1, 5);
vectorSum("2018-a-1", p(3, -1), p(1, 2), 1, 5);
vectorSum("2019-a-1", p(1, -2), p(-1, 4), 2, 5);
vectorSum("2020-a-1", p(3, 1), p(-2, 4), 0.5, 5);
vectorSum("2026-geometry-23", p(4, 1), p(-1, -1), 1, 3);
{
  const A = p(1, 3, -6),
    B = p(-3, 2, -4),
    P = p(-11, 0, 0);
  add(
    "2017-a-8",
    "외분점이 x축 위에 있을 조건",
    "A(1,a,−6), B(−3,2,b)를 3:2로 외분하는 점의 y,z좌표가 모두 0이다.",
    "−1",
    [
      st(
        "외분점의 벡터식",
        R`P=\frac{3B-2A}{3-2}=(-11,6-2a,3b+12)`,
        "외분점은 선분 밖에 있다. 분모의 부호와 두 점의 계수 순서를 유지한다.",
        m({
          threeD: true,
          range: [-13, 3, -7, 5],
          lines: [line(A, B), line(B, P, C.orange)],
          dots: [dot(A, "A"), dot(B, "B"), dot(P, "P")],
        }),
      ),
      st(
        "x축 조건",
        R`6-2a=0,\quad3b+12=0`,
        "x축 위에서는 y와 z가 모두 0이다. 실제 외분점은 (−11,0,0)이다.",
        m({
          threeD: true,
          range: [-13, 3, -7, 5],
          lines: [line(A, P), line(p(-13), p(3), C.green)],
          dots: [dot(A, "a=3"), dot(B, "b=−4"), dot(P, "(−11,0,0)")],
        }),
      ),
      st(
        "값과 비 확인",
        R`a=3,\ b=-4\Rightarrow a+b=-1,\quad AP:BP=3:2`,
        "좌표로 얻은 점이 실제 외분 비율을 만족하는지도 확인한다.",
        m({
          threeD: true,
          range: [-13, 3, -7, 5],
          lines: [line(P, B, C.orange), line(B, A, C.green)],
          dots: [dot(P, "P"), dot(B, "B"), dot(A, "A")],
          metrics: [{ label: "AP/BP", value: "3/2" }],
        }),
      ),
    ],
    [
      check("외분 좌표", norm(sub(P, sub(mul(B, 3), mul(A, 2)))), 0),
      check("거리 비", dist(A, P) / dist(B, P), 1.5),
      check("a+b", 3 - 4, -1),
    ],
  );
}
{
  const position = (t) => p(t - 2 / t, 2 * t + 1 / t),
    P = position(1),
    V = p(3, 1),
    end = addv(P, V);
  add(
    "2017-a-10",
    "평면 운동의 속도벡터",
    "x=t−2/t, y=2t+1/t (t>0)의 운동에서 t=1의 속력을 구한다.",
    "√10",
    [
      st(
        "양의 시간의 경로",
        R`(x(t),y(t))=(t-2/t,2t+1/t),\quad t>0`,
        "원문에서 t는 양수이다. t=1에 해당하는 위치 (−1,3)을 표시한다.",
        m({
          range: [-6, 5, 0, 8],
          lines: [curve(position, 0.4, 3)],
          dots: [dot(P, "t=1")],
        }),
      ),
      st(
        "각 성분의 시간 미분",
        R`x'(t)=1+\frac2{t^2},\quad y'(t)=2-\frac1{t^2}`,
        "곡선의 접선 방향은 속도벡터가 결정한다. t=1에서 (3,1)이다.",
        m({
          range: [-6, 5, 0, 8],
          lines: [curve(position, 0.4, 3), line(P, end, C.orange)],
          dots: [dot(P, "P"), dot(end, "v=(3,1)")],
        }),
      ),
      st(
        "속력은 벡터의 길이",
        R`|\vec v(1)|=\sqrt{3^2+1^2}=\sqrt{10}`,
        "수평 성분 3과 수직 성분 1이 만드는 직각삼각형의 빗변 길이를 구한다.",
        m({
          range: [-6, 5, 0, 8],
          lines: [
            curve(position, 0.4, 3),
            line(P, end, C.orange),
            line(P, addv(P, p(3)), C.green),
            line(addv(P, p(3)), end, C.red),
          ],
          dots: [dot(P, "P")],
        }),
      ),
    ],
    [check("속력²", dp(V, V), 10), check("t=1 위치 x", P[0], -1)],
  );
}
{
  const N = p(2, 2, -1),
    K = p(0, 0, 1),
    base = p(0, 0, 5),
    plane = [p(-2, -2, -3), p(2, -2, 5), p(2, 2, 13), p(-2, 2, 5)];
  add(
    "2017-a-12",
    "법선벡터로 평면각 계산",
    "평면 2x+2y−z+5=0과 xy평면 사이 예각을 구한다.",
    "1/3",
    [
      st(
        "두 평면",
        R`2x+2y-z+5=0,\quad z=0`,
        "주어진 평면은 z=2x+2y+5이다. 공간에서 xy평면과 함께 그린다.",
        m({
          threeD: true,
          range: [-4, 4, -4, 4],
          surfaces: [
            surface(plane),
            surface([p(-4, -4), p(4, -4), p(4, 4), p(-4, 4)], C.green),
          ],
        }),
      ),
      st(
        "법선의 방향",
        R`\vec n=(2,2,-1),\quad\vec k=(0,0,1)`,
        "평면의 각은 법선 사이 각 또는 그 보각이다. 법선을 같은 시작점으로 옮겨 비교한다.",
        m({
          threeD: true,
          range: [-4, 4, -4, 4],
          lines: [line(O, N), line(O, K, C.green)],
          dots: [dot(N, "n"), dot(K, "k")],
        }),
      ),
      st(
        "예각이므로 절댓값",
        R`\cos\theta=\frac{|\vec n\cdot\vec k|}{|\vec n||\vec k|}=\frac{1}{3}`,
        "내적은 −1이지만 문제는 예각을 요구하므로 절댓값을 사용한다.",
        m({
          threeD: true,
          range: [-2, 2, -2, 2],
          lines: [
            line(O, unit(N)),
            line(O, mul(K, -1), C.green),
            line(unit(N), p(0, 0, -1 / 3), C.orange, { dashed: true }),
          ],
          dots: [dot(p(0, 0, -1 / 3), "정사영")],
        }),
      ),
    ],
    [check("법선 코사인", Math.abs(dp(N, K)) / (norm(N) * norm(K)), 1 / 3)],
  );
}
{
  const A = p(Math.sqrt(2)),
    B = p(Math.SQRT1_2, Math.sqrt(1.5)),
    CC = p(-1, 1 / Math.sqrt(3), Math.sqrt(2 / 3));
  add(
    "2017-a-16",
    "내적표를 거리로 변환",
    "세 위치벡터의 길이 제곱은 모두 2이고 a·b=1, b·c=0, a·c=−√2이다.",
    "AB < BC < AC",
    [
      st(
        "내적을 만족하는 좌표 배치",
        R`|a|^2=|b|^2=|c|^2=2`,
        "내적표는 회전과 무관하므로 조건을 만족하는 한 좌표 배치를 택한다.",
        m({
          threeD: true,
          range: [-2, 2, -2, 2],
          lines: [line(O, A), line(O, B, C.green), line(O, CC, C.orange)],
          dots: [dot(A, "A"), dot(B, "B"), dot(CC, "C")],
        }),
      ),
      st(
        "차벡터의 제곱",
        R`AB^2=4-2=2,\quad BC^2=4,\quad AC^2=4+2\sqrt2`,
        "|u−v|²=|u|²+|v|²−2u·v를 각 쌍에 적용한다.",
        m({
          threeD: true,
          range: [-2, 2, -2, 2],
          lines: [line(A, B), line(B, CC, C.green), line(A, CC, C.orange)],
          dots: [
            dot(mid(A, B), "√2"),
            dot(mid(B, CC), "2"),
            dot(mid(A, CC), "√(4+2√2)"),
          ],
        }),
      ),
      st(
        "양수의 제곱 비교",
        R`2<4<4+2\sqrt2\Rightarrow AB<BC<AC`,
        "거리는 모두 양수이므로 제곱의 대소 순서를 그대로 사용할 수 있다.",
        m({
          threeD: true,
          range: [-2, 2, -2, 2],
          lines: [
            line(A, B, C.green),
            line(B, CC, C.orange),
            line(A, CC, C.red),
          ],
          surfaces: [surface([A, B, CC])],
          dots: [dot(A, "A"), dot(B, "B"), dot(CC, "C")],
        }),
      ),
    ],
    [
      check("a·c", dp(A, CC), -Math.sqrt(2)),
      check("b·c", dp(B, CC), 0),
      check("AB²", dist(A, B) ** 2, 2),
      check("BC²", dist(B, CC) ** 2, 4),
    ],
  );
}
{
  const f = 2,
    k = 6,
    A = p(-k),
    P = p(k, 4 * Math.sqrt(3)),
    Q = p(k, -4 * Math.sqrt(3)),
    F = p(0, 2 * Math.sqrt(3)),
    G = p(0, -2 * Math.sqrt(3)),
    semi = 6 + 2 * Math.sqrt(3),
    minor = Math.sqrt(semi * semi - 12);
  add(
    "2017-a-19",
    "접선각에서 포물선과 타원 연결",
    "(−k,0)에서 y²=4px에 그은 두 접선의 각이 π/3이고, 접점들을 지나는 타원의 초점은 접선의 y절편이다.",
    "8",
    [
      st(
        "대칭인 두 접선의 기울기",
        R`m=\tan(\pi/6)=1/\sqrt3`,
        "x축에 대한 대칭성 때문에 두 접선은 각각 x축과 30°를 이룬다.",
        m({
          range: [-8, 15, -12, 12],
          lines: [
            para(f, 0, C.blue, 10),
            line(A, P, C.orange),
            line(A, Q, C.orange),
          ],
          dots: [dot(A, "(−k,0)"), dot(P, "P"), dot(Q, "Q")],
        }),
      ),
      st(
        "포물선 접선식",
        R`y=mx+p/m,\quad k=p/m^2=3p`,
        "접선의 x절편이 −k이므로 k와 p의 비가 정해진다.",
        m({
          range: [-8, 15, -12, 12],
          lines: [
            para(f, 0, C.blue, 10),
            line(A, P, C.orange),
            line(A, Q, C.orange),
          ],
          dots: [
            dot(F, "F=(0,√3p)"),
            dot(G, "F′=(0,−√3p)"),
            dot(P, "(3p,2√3p)"),
          ],
        }),
      ),
      st(
        "한 접점에서 초점거리",
        R`PF=2\sqrt3p,\quad PF'=6p`,
        "P와 두 y절편의 좌표 차를 이용해 두 거리를 구한다.",
        m({
          range: [-8, 15, -12, 12],
          lines: [line(P, F), line(P, G, C.green), line(F, G, C.muted)],
          dots: [dot(P, "P"), dot(F, "F"), dot(G, "F′")],
        }),
      ),
      st(
        "타원의 장축과 비교",
        R`(2\sqrt3+6)p=4\sqrt3+12\Rightarrow p=2,\ k=6`,
        "타원 위 점에서 두 초점까지 거리 합은 장축의 길이이다.",
        m({
          range: [-12, 12, -12, 12],
          lines: [
            ellipse(minor, semi),
            line(P, F, C.orange),
            line(P, G, C.green),
          ],
          dots: [dot(P, "P"), dot(Q, "Q"), dot(F, "F"), dot(G, "F′")],
        }),
      ),
      st(
        "합과 접선 검산",
        R`k+p=6+2=8`,
        "구한 값으로 포물선의 접점, 접선 기울기, 타원의 거리 합을 동시에 검산한다.",
        m({
          range: [-12, 15, -12, 12],
          lines: [
            para(2, 0, C.blue, 10),
            ellipse(minor, semi, 0, 0, C.green),
            line(A, P, C.orange),
            line(A, Q, C.orange),
          ],
          dots: [dot(A, "A"), dot(P, "P"), dot(Q, "Q")],
        }),
      ),
    ],
    [
      check("포물선 접점", P[1] ** 2, 4 * f * P[0]),
      check("장축", dist(P, F) + dist(P, G), 4 * Math.sqrt(3) + 12),
      check("k+p", k + f, 8),
    ],
  );
}
{
  const CC = p(0, -1),
    N = p(1, 8, -4),
    T1 = addv(CC, mul(N, 2 / 9)),
    T2 = sub(CC, mul(N, 2 / 9));
  const plane = (T) => {
    const u = unit(p(8, -1)),
      v = unit(cross(N, u));
    return [
      addv(T, addv(mul(u, 3), mul(v, 3))),
      addv(T, sub(mul(v, 3), mul(u, 3))),
      sub(T, addv(mul(u, 3), mul(v, 3))),
      addv(T, sub(mul(u, 3), mul(v, 3))),
    ];
  };
  add(
    "2017-a-24",
    "구의 두 평행 접평면",
    "x+8y−4z+k=0이 x²+y²+z²+2y−3=0에 접하는 두 k의 합을 구한다.",
    "16",
    [
      st(
        "구의 중심과 반지름",
        R`x^2+(y+1)^2+z^2=4\Rightarrow C=(0,-1,0),\ r=2`,
        "완전제곱식으로 구의 중심을 찾는다.",
        m({
          threeD: true,
          range: [-4, 4, -5, 3],
          lines: [
            circle(0, -1, 2),
            curve(
              (t) => p(2 * Math.cos(t), -1, 2 * Math.sin(t)),
              0,
              2 * Math.PI,
            ),
          ],
          dots: [dot(CC, "C")],
        }),
      ),
      st(
        "접평면까지의 거리",
        R`\frac{|k-8|}{\sqrt{1+64+16}}=2\Rightarrow|k-8|=18`,
        "접할 때 중심에서 평면까지의 거리가 반지름과 같다. 법선 방향 양쪽에 접점이 있다.",
        m({
          threeD: true,
          range: [-4, 4, -5, 3],
          lines: [line(T1, T2, C.orange)],
          surfaces: [surface(plane(T1)), surface(plane(T2), C.green)],
          dots: [dot(CC, "C"), dot(T1, "접점 1"), dot(T2, "접점 2")],
        }),
      ),
      st(
        "두 k의 합",
        R`k=26,-10\quad\Rightarrow\quad26+(-10)=16`,
        "법선 벡터의 방향을 반대로 잡아도 두 평행 접평면의 집합은 같다.",
        m({
          threeD: true,
          range: [-4, 4, -5, 3],
          lines: [line(CC, T1, C.blue), line(CC, T2, C.green)],
          surfaces: [surface(plane(T1)), surface(plane(T2), C.green)],
          dots: [dot(T1, "k=−10"), dot(T2, "k=26")],
        }),
      ),
    ],
    [
      check("첫 접평면", dp(N, T1) - 10, 0),
      check("둘째 접평면", dp(N, T2) + 26, 0),
      check("반지름", dist(CC, T1), 2),
      check("k 합", 26 - 10, 16),
    ],
  );
}
{
  const a = 6,
    b = 8,
    c = 10,
    P = p(14.4, Math.sqrt(304.64)),
    F = p(c),
    G = p(-c),
    A = p(a);
  add(
    "2017-a-28",
    "점근선 비와 자연수 조건",
    "점근선 기울기가 ±4/3이고 PF′=30, 16≤PF≤20, AF는 자연수인 쌍곡선의 주축을 구한다.",
    "12",
    [
      st(
        "세 반길이의 비",
        R`a=3t,\ b=4t,\ c=5t\quad(t>0)`,
        "점근선에서 b/a=4/3, 초점 관계에서 c/a=5/3을 얻는다.",
        m({
          range: [-20, 20, -20, 20],
          lines: [
            hyper(a, b),
            hyper(a, b, -1),
            line(p(-15, -20), p(15, 20), C.muted, { dashed: true }),
            line(p(-15, 20), p(15, -20), C.muted, { dashed: true }),
          ],
          dots: [dot(F, "F"), dot(G, "F′")],
        }),
      ),
      st(
        "거리 차의 범위",
        R`2a=30-PF\in[10,14]\Rightarrow t\in[5/3,7/3]`,
        "PF′가 더 크므로 P는 오른쪽 가지 위에 있다. 쌍곡선의 거리 차는 양의 2a이다.",
        m({
          range: [-20, 20, -20, 20],
          lines: [hyper(a, b), line(P, F, C.orange), line(P, G, C.green)],
          dots: [dot(P, "P"), dot(F, "PF=18"), dot(G, "PF′=30")],
        }),
      ),
      st(
        "자연수 한 개 선택",
        R`AF=c-a=2t\in[10/3,14/3]\cap\mathbb N=\{4\}`,
        "허용 구간에 있는 자연수는 4뿐이므로 t=2이다.",
        m({
          range: [-12, 15, -10, 10],
          lines: [hyper(a, b), line(A, F, C.orange)],
          dots: [dot(A, "a=6"), dot(F, "c=10")],
        }),
      ),
      st(
        "주축 길이",
        R`2a=6t=12`,
        "양쪽 꼭짓점 사이의 길이는 12이다.",
        m({
          range: [-12, 15, -10, 10],
          lines: [hyper(a, b), hyper(a, b, -1), line(p(-a), p(a), C.orange)],
          dots: [dot(p(-a), "−6"), dot(A, "6")],
        }),
      ),
    ],
    [
      check("PF", dist(P, F), 18),
      check("PF′", dist(P, G), 30),
      check("쌍곡선 식", P[0] ** 2 / 36 - P[1] ** 2 / 64, 1),
      check("주축", 2 * a, 12),
    ],
  );
}
{
  const A = p(0, 4 / Math.sqrt(3)),
    B = p(-2, -2 / Math.sqrt(3)),
    CC = p(2, -2 / Math.sqrt(3)),
    D = p(0, 0, 4 * Math.sqrt(2 / 3)),
    P = mid(A, D),
    U = addv(mul(B, 0.8), mul(D, 0.2)),
    V = addv(mul(CC, 0.8), mul(D, 0.2)),
    T = mid(U, V),
    edges = [
      line(A, B),
      line(B, CC),
      line(CC, A),
      line(A, D),
      line(B, D),
      line(CC, D),
    ];
  add(
    "2017-a-29",
    "수직 조건으로 잘린 정사면체",
    "모서리 4인 정사면체에서 O는 ABC의 무게중심, P는 AD의 중점이다. BCD 위의 Q가 OQ⊥OP를 만족할 때 PQ의 최댓값을 구한다.",
    "19",
    [
      st(
        "대칭 좌표 배치",
        R`O=(0,0,0),\quad P=(0,2/\sqrt3,2\sqrt{2/3}),\quad |OP|=2`,
        "밑면 무게중심을 원점에 두고 D를 z축에 놓는다. 각 모서리의 길이는 모두 4이다.",
        m({
          threeD: true,
          range: [-3, 3, -3, 4],
          lines: edges,
          dots: [
            dot(O, "O"),
            dot(P, "P"),
            dot(D, "D"),
            dot(A, "A"),
            dot(B, "B"),
            dot(CC, "C"),
          ],
        }),
      ),
      st(
        "허용 평면으로 자르기",
        R`OQ\perp OP\Rightarrow y_Q+\sqrt2z_Q=0`,
        "원점을 지나고 OP에 수직인 평면과 삼각형 BCD가 만나는 부분을 구한다.",
        m({
          threeD: true,
          range: [-3, 3, -3, 4],
          lines: [...edges, line(O, P, C.red), line(U, V, C.orange)],
          surfaces: [surface([B, CC, D]), surface([U, V, O], C.green)],
          dots: [dot(U, "U"), dot(V, "V")],
        }),
      ),
      st(
        "교선 끝점의 비",
        R`U=\tfrac45B+\tfrac15D,\quad V=\tfrac45C+\tfrac15D`,
        "BD와 CD에 각각 수직 조건을 대입하면 D 방향의 비율이 1/5이다. Q의 범위는 닫힌 선분 UV이다.",
        m({
          threeD: true,
          range: [-3, 3, -3, 4],
          lines: [
            ...edges,
            line(U, V, C.orange),
            line(O, U, C.green),
            line(O, V, C.green),
          ],
          dots: [dot(U, "BD의 1/5점"), dot(V, "CD의 1/5점"), dot(T, "중점")],
        }),
      ),
      st(
        "끝점에서 최대",
        R`PQ^2=OP^2+OQ^2,\quad\max OQ^2=OU^2=OV^2=96/25`,
        "OQ⊥OP이므로 피타고라스를 쓴다. 선분 위 거리 제곱은 볼록하여 최대가 끝점에서 나온다.",
        m({
          threeD: true,
          range: [-3, 3, -3, 4],
          lines: [
            line(P, U, C.red),
            line(P, V, C.red),
            line(U, V, C.orange),
            line(O, U, C.green),
            line(O, P),
          ],
          surfaces: [surface([O, P, U])],
          dots: [dot(U, "최대점"), dot(V, "최대점")],
        }),
      ),
      st(
        "최댓값과 분자·분모",
        R`\max PQ=\sqrt{4+96/25}=14/5,\quad p+q=5+14=19`,
        "14와 5는 서로소이다. 두 대칭 끝점 모두 같은 최댓값을 준다.",
        m({
          threeD: true,
          range: [-3, 3, -3, 4],
          lines: [...edges, line(P, U, C.orange)],
          dots: [dot(P, "P"), dot(U, "PQ=14/5")],
          metrics: [{ label: "최댓값", value: "14/5" }],
        }),
      ),
    ],
    [
      check("정사면체 모서리", dist(A, D), 4),
      check("수직 조건", dp(U, P), 0),
      check("최대 거리", dist(P, U), 14 / 5),
      check("분자와 분모의 합", 14 + 5, 19),
    ],
  );
}
save();

// 2018: conics, motion and projection.
{
  const A = p(1, 6, 4),
    B = p(5, 2, -4),
    P = p(2, 5, 2);
  add(
    "2018-a-3",
    "공간 선분의 내분점",
    "A(1,6,4), B(a,2,−4)의 1:3 내분점이 (2,5,2)이다.",
    "5",
    [
      st(
        "내분의 방향",
        R`AP:PB=1:3`,
        "P는 A에서 B로 가는 길의 1/4 지점이다.",
        m({
          threeD: true,
          range: [0, 7, -5, 7],
          lines: [line(A, B)],
          dots: [dot(A, "A"), dot(B, "B"), dot(P, "P")],
        }),
      ),
      st(
        "x좌표 방정식",
        R`P=\frac{3A+B}{4},\quad\frac{3+a}{4}=2`,
        "내분점에서는 가까운 점 A의 가중치가 3이다.",
        m({
          threeD: true,
          range: [0, 7, -5, 7],
          lines: [
            line(A, P, C.orange),
            line(P, B, C.green),
            line(P, p(2), C.muted, { dashed: true }),
          ],
          dots: [dot(P, "x=2"), dot(p(2), "x축")],
        }),
      ),
      st(
        "나머지 좌표 확인",
        R`a=5,\quad (3\cdot6+2)/4=5,\quad(3\cdot4-4)/4=2`,
        "세 좌표가 모두 주어진 내분점과 일치한다.",
        m({
          threeD: true,
          range: [0, 7, -5, 7],
          lines: [line(A, B), line(A, P, C.orange)],
          dots: [dot(A, "(1,6,4)"), dot(B, "(5,2,−4)"), dot(P, "(2,5,2)")],
        }),
      ),
    ],
    [
      check("내분점 오차", norm(sub(P, mul(addv(mul(A, 3), B), 0.25))), 0),
      check("거리 비", dist(A, P) / dist(P, B), 1 / 3),
    ],
  );
}
{
  const H = p(2, 2),
    F = p(6, 2),
    G = p(-2, 2),
    a = 20,
    b = 2;
  add(
    "2018-a-8",
    "평행이동한 타원의 초점",
    "(x−2)²/a+(y−2)²/4=1의 초점이 (6,b), (−2,b)이다.",
    "40",
    [
      st(
        "타원의 중심",
        R`H=(2,2),\quad b=2`,
        "두 초점의 중점과 타원의 중심이 같으므로 초점의 y좌표는 2이다.",
        m({
          range: [-4, 8, -2, 6],
          lines: [line(G, F, C.muted)],
          dots: [dot(H, "H"), dot(F, "F"), dot(G, "F′")],
        }),
      ),
      st(
        "초점거리와 분모",
        R`c=4,\quad a-4=c^2=16\Rightarrow a=20`,
        "여기서 원문의 a는 장반축 자체가 아니라 그 제곱인 분모이다.",
        m({
          range: [-4, 8, -2, 6],
          lines: [
            ellipse(Math.sqrt(a), 2, 2, 2),
            line(H, F, C.orange),
            line(H, p(2, 4), C.green),
          ],
          dots: [dot(H, "중심"), dot(F, "c=4"), dot(p(2, 4), "단반축 2")],
        }),
      ),
      st(
        "두 미지수의 곱",
        R`ab=20\cdot2=40`,
        "초점의 y좌표 b와 타원 분모 a를 곱한다.",
        m({
          range: [-4, 8, -2, 6],
          lines: [
            ellipse(Math.sqrt(a), 2, 2, 2),
            line(p(2 - Math.sqrt(a), 2), p(2 + Math.sqrt(a), 2), C.orange),
          ],
          dots: [dot(F, "(6,2)"), dot(G, "(−2,2)")],
        }),
      ),
    ],
    [check("초점 관계", a - 4, 16), check("ab", a * b, 40)],
  );
}
{
  const t = Math.acos(0.4),
    pos = (t) => p(Math.sqrt(3) * Math.sin(t), 2 * Math.cos(t) - 5),
    P = pos(t),
    V = p(Math.sqrt(3) * Math.cos(t), -2 * Math.sin(t));
  add(
    "2018-a-16",
    "위치벡터와 속도벡터가 평행한 순간",
    "x=√3 sin t, y=2 cos t−5, 0<t<π에서 OP와 속도벡터가 평행해지는 cos t를 구한다.",
    "2/5",
    [
      st(
        "시간 구간에 맞는 반타원",
        R`P(t)=(\sqrt3\sin t,2\cos t-5),\quad0<t<\pi`,
        "오른쪽 반타원을 따라 움직이며 양 끝의 시간은 포함하지 않는다.",
        m({
          range: [-1, 4, -8, 1],
          lines: [curve(pos, 0.001, Math.PI - 0.001)],
          dots: [
            dot(pos(0), "t=0", C.muted, { open: true }),
            dot(pos(Math.PI), "t=π", C.muted, { open: true }),
            dot(P, "P(α)"),
          ],
        }),
      ),
      st(
        "평행 조건을 행렬식으로",
        R`\vec v=(\sqrt3\cos t,-2\sin t),\quad x v_y-y v_x=0`,
        "분모가 0일 가능성을 피하려고 기울기 대신 두 벡터의 행렬식을 쓴다.",
        m({
          range: [-1, 4, -8, 1],
          lines: [
            curve(pos, 0.001, Math.PI - 0.001),
            line(O, P),
            line(P, addv(P, V), C.orange),
          ],
          dots: [dot(P, "P"), dot(addv(P, V), "v")],
        }),
      ),
      st(
        "삼각항등식 정리",
        R`-2\sin^2\alpha-(2\cos\alpha-5)\cos\alpha=0\Rightarrow5\cos\alpha=2`,
        "sin²+cos²=1을 쓰면 cos α의 일차식이 된다.",
        m({
          range: [-1, 4, -8, 1],
          lines: [
            line(O, P),
            line(O, V, C.orange),
            curve(pos, 0.001, Math.PI - 0.001),
          ],
          dots: [dot(P, "OP"), dot(V, "v")],
        }),
      ),
      st(
        "구간 안의 해",
        R`\cos\alpha=2/5,\quad 0<\alpha<\pi`,
        "arccos(2/5)는 지정한 시간 구간 안에 있으며 실제 벡터들이 평행하다.",
        m({
          range: [-1, 4, -8, 1],
          lines: [line(O, P), line(P, addv(P, V), C.orange)],
          dots: [dot(P, "cos α=2/5")],
          metrics: [{ label: "행렬식", value: "0" }],
        }),
      ),
    ],
    [
      check("평행 행렬식", P[0] * V[1] - P[1] * V[0], 0),
      check("cos α", Math.cos(t), 0.4),
    ],
  );
}
{
  const A = p(2, 3),
    B = p(0, 1),
    CC = p(2, -1),
    M = mid(B, CC),
    N = unit(sub(CC, B)),
    plane = [p(-2, -3, -3), p(4, 3, -3), p(4, 3, 3), p(-2, -3, 3)],
    H = p(3, 2);
  add(
    "2018-a-20",
    "삼각형과 평면 사이 최대 최소거리",
    "C를 A,B와 분리하면서 AC와 BC를 지나는 평면의 최소거리를 최대화한다. 일반 명제 둘과 A(2,3,0), B(0,1,0), C(2,−1,0)의 경우를 판정한다.",
    "ㄱ, ㄴ, ㄷ",
    [
      st(
        "삼각형 평면 안의 분리선",
        R`d(\alpha)=\min\{d(A,\alpha),d(B,\alpha),d(C,\alpha)\}`,
        "A와 B는 같은 쪽, C는 반대쪽에 있다. 삼각형 평면과 α의 교선을 생각한다.",
        m({
          threeD: true,
          range: [-3, 5, -4, 5],
          lines: [poly([A, B, CC])],
          surfaces: [surface([A, B, CC]), surface(plane, C.green)],
          dots: [dot(A, "A"), dot(B, "B"), dot(CC, "C")],
        }),
      ),
      st(
        "평면은 수직일 때 유리",
        R`d(X,\alpha)=d(X,\ell)\sin\varphi\le d(X,\ell)`,
        "교선 ℓ을 고정하고 평면을 세우면 모든 세 거리의 공통 축소율 sin φ가 최대 1이 된다. 따라서 최적 평면은 ABC에 수직이다.",
        m({
          threeD: true,
          range: [-3, 5, -4, 5],
          lines: [
            poly([A, B, CC]),
            line(A, H, C.orange),
            line(B, M, C.orange),
            line(CC, M, C.orange),
          ],
          surfaces: [surface(plane, C.green)],
          dots: [dot(M, "수선의 발"), dot(H, "수선의 발")],
        }),
      ),
      st(
        "점과 선분의 최대 간격",
        R`\max d=\frac12\operatorname{dist}(C,\overline{AB})`,
        "C와 선분 AB의 최근접 쌍을 잇는 선분의 수직이등분선을 쓴다. 최근접점이 내부면 AC와 BC의 중점을 모두 지나고, 끝점이면 그 끝점과 C의 중점을 지난다.",
        m({
          range: [-3, 5, -4, 5],
          lines: [
            poly([A, B, CC]),
            line(B, CC, C.red),
            line(p(-2, -3), p(4, 3), C.green),
          ],
          dots: [dot(M, "BC의 중점"), dot(mid(A, CC), "AC의 중점")],
        }),
      ),
      st(
        "보기의 실제 좌표",
        R`CB\perp AB,\quad\beta:y=x-1,\quad d(B,\beta)=\sqrt2`,
        "주어진 좌표에서는 C와 AB의 최근접점이 B이다. β는 BC의 중점 (1,0)을 지나고 BC에 수직이다.",
        m({
          range: [-3, 5, -4, 5],
          lines: [
            poly([A, B, CC]),
            line(p(-2, -3), p(4, 3), C.green),
            line(B, M, C.orange),
            line(CC, M, C.orange),
            line(A, H, C.orange),
          ],
          dots: [dot(A, "A"), dot(B, "B"), dot(CC, "C"), dot(M, "(1,0)")],
        }),
      ),
      st(
        "세 보기 판정",
        R`d(A,\beta)=d(B,\beta)=d(C,\beta)=\sqrt2`,
        "ㄱ의 수직성, ㄴ의 중점 통과, ㄷ의 B에서 최소거리 달성이 모두 성립한다.",
        m({
          threeD: true,
          range: [-3, 5, -4, 5],
          lines: [poly([A, B, CC]), line(B, M, C.orange)],
          surfaces: [surface(plane, C.green)],
          dots: [dot(B, "최소거리 √2"), dot(M, "β")],
          metrics: [{ label: "참인 명제", value: "ㄱ, ㄴ, ㄷ" }],
        }),
      ),
    ],
    [
      check("CB와 AB 수직", dp(sub(CC, B), sub(A, B)), 0),
      check(
        "A의 평면 거리",
        Math.abs(A[1] - A[0] + 1) / Math.SQRT2,
        Math.SQRT2,
      ),
      check(
        "B의 평면 거리",
        Math.abs(B[1] - B[0] + 1) / Math.SQRT2,
        Math.SQRT2,
      ),
    ],
  );
}
{
  const P = p(1, 1),
    f = (y) => p((y ** 3 + 2) / (1 + Math.sqrt(1 + y ** 4 + 2 * y)), y),
    tangent = curve((x) => 2 * x - 1, -0.5, 3);
  add(
    "2018-a-24",
    "음함수의 접선 기울기",
    "2x+x²y−y³=2 위의 (1,1)에서 접선 기울기를 구한다.",
    "2",
    [
      st(
        "곡선과 지정한 점",
        R`F(x,y)=2x+x^2y-y^3-2=0`,
        "(1,1) 근처에서 원래 식을 만족하는 가지를 그린다.",
        m({
          range: [-1, 4, -1, 4],
          lines: [curve(f, -0.49, 3)],
          dots: [dot(P, "(1,1)")],
        }),
      ),
      st(
        "곱의 미분",
        R`2+2xy+x^2y'-3y^2y'=0`,
        "y를 x의 함수로 보고 x²y와 y³ 모두 연쇄법칙을 적용한다.",
        m({
          range: [-1, 4, -1, 4],
          lines: [curve(f, -0.49, 3), line(p(0.8, 0.6), p(1.2, 1.4), C.orange)],
          dots: [dot(P, "접선 방향")],
        }),
      ),
      st(
        "점 대입과 기울기",
        R`4-2y'=0\Rightarrow y'=2,\quad y=2x-1`,
        "접선은 (1,1)을 지나고 기울기가 2이다.",
        m({
          range: [-1, 4, -1, 4],
          lines: [curve(f, -0.49, 3), tangent],
          dots: [dot(P, "접점"), dot(p(2, 3), "Δx=1, Δy=2")],
        }),
      ),
    ],
    [
      check("원래 곡선", 2 * 1 + 1 * 1 - 1, 2),
      check("미분 관계", 2 + 2 - 2 * 2, 0),
    ],
  );
}
{
  const P = p(4, 1),
    N = p(1, 2),
    A = p(6),
    B = p(0, 3);
  add(
    "2018-a-25",
    "법선벡터로 직선 세우기",
    "(4,1)을 지나며 (1,2)에 수직인 직선의 x,y절편을 구한다.",
    "9",
    [
      st(
        "점과 법선",
        R`\vec n=(1,2),\quad P=(4,1)`,
        "법선은 직선의 진행 방향과 수직이다.",
        m({
          range: [-1, 8, -1, 5],
          lines: [line(P, addv(P, N), C.orange)],
          dots: [dot(P, "P"), dot(addv(P, N), "법선")],
        }),
      ),
      st(
        "점에서의 내적식",
        R`(x-4,y-1)\cdot(1,2)=0\Rightarrow x+2y=6`,
        "직선 위 점과 P의 차벡터가 법선에 수직이라는 조건을 쓴다.",
        m({
          range: [-1, 8, -1, 5],
          lines: [line(A, B), line(P, addv(P, N), C.orange)],
          dots: [dot(P, "P"), dot(A, "A"), dot(B, "B")],
        }),
      ),
      st(
        "두 절편",
        R`a=6,\quad b=3,\quad a+b=9`,
        "y=0과 x=0을 각각 대입한다.",
        m({
          range: [-1, 8, -1, 5],
          lines: [line(A, B), line(O, A, C.green), line(O, B, C.orange)],
          surfaces: [surface([O, A, B])],
          dots: [dot(A, "(6,0)"), dot(B, "(0,3)")],
        }),
      ),
    ],
    [
      check("법선과 직선 수직", dp(sub(A, B), N), 0),
      check("절편의 합", A[0] + B[1], 9),
    ],
  );
}
{
  const a = Math.sqrt(8),
    b = Math.sqrt(17),
    P = p(-4, Math.sqrt(17)),
    F = p(5),
    G = p(-5),
    H = p(0, 25 / Math.sqrt(17)),
    r = 20 / Math.sqrt(34);
  const foot = (A, B, CC) =>
    addv(
      B,
      mul(sub(CC, B), dp(sub(A, B), sub(CC, B)) / dp(sub(CC, B), sub(CC, B))),
    );
  const Q = foot(H, G, P),
    T = foot(H, F, P);
  add(
    "2018-a-27",
    "쌍곡선과 두 접선의 길이",
    "x²/8−y²/17=1 위의 P에 대해 두 초점 연결선에 접하는 원이 있고 F′Q=5√2이다. PF′<PF인 경우를 사용한다.",
    "116",
    [
      st(
        "초점과 거리 차",
        R`c=\sqrt{8+17}=5,\quad PF-PF'=2\sqrt8=4\sqrt2`,
        "PF′가 짧으므로 P는 왼쪽 가지에 있다.",
        m({
          range: [-9, 9, -3, 12],
          lines: [hyper(a, b), hyper(a, b, -1)],
          dots: [dot(P, "P"), dot(F, "F"), dot(G, "F′")],
        }),
      ),
      st(
        "y축 중심의 대칭성",
        R`FQ_F=F'Q=5\sqrt2`,
        "원 중심이 y축에 있으므로 두 초점에서 그은 접선의 길이는 같다.",
        m({
          range: [-9, 9, -3, 12],
          lines: [
            circle(H[0], H[1], r, C.green),
            line(F, T),
            line(G, Q, C.orange),
            line(H, Q, C.muted),
          ],
          dots: [dot(H, "원 중심"), dot(Q, "Q"), dot(T, "다른 접점")],
        }),
      ),
      st(
        "접점까지 같은 두 길이",
        R`PQ=PQ_F\Rightarrow PF+PF'=2F'Q=10\sqrt2`,
        "P에서 원에 그은 두 접선의 길이를 같게 놓으면 두 초점거리의 합을 얻는다.",
        m({
          range: [-9, 9, -3, 12],
          lines: [
            circle(H[0], H[1], r, C.green),
            line(F, P),
            line(G, P, C.orange),
            line(P, Q, C.red),
            line(P, T, C.red),
          ],
          dots: [dot(P, "P"), dot(Q, "Q"), dot(T, "접점")],
        }),
      ),
      st(
        "합과 차로 각 거리",
        R`PF=7\sqrt2,\quad PF'=3\sqrt2`,
        "두 식을 더하고 빼면 각 길이가 정해진다.",
        m({
          range: [-9, 9, -3, 12],
          lines: [hyper(a, b, -1), line(P, F), line(P, G, C.orange)],
          dots: [dot(P, "(−4,√17)"), dot(F, "7√2"), dot(G, "3√2")],
        }),
      ),
      st(
        "제곱합",
        R`PF^2+PF'^2=98+18=116`,
        "좌표 거리와 쌍곡선 방정식으로 함께 검산한다.",
        m({
          range: [-9, 9, -3, 12],
          lines: [hyper(a, b, -1), poly([P, F, G])],
          surfaces: [surface([P, F, G])],
          dots: [dot(P, "P")],
          metrics: [{ label: "거리 제곱합", value: "116" }],
        }),
      ),
    ],
    [
      check("쌍곡선", P[0] ** 2 / 8 - P[1] ** 2 / 17, 1),
      check("접선 길이", dist(G, Q), 5 * Math.SQRT2),
      check("두 접선 길이", dist(P, Q), dist(P, T)),
      check("거리 제곱합", dist(P, F) ** 2 + dist(P, G) ** 2, 116),
    ],
  );
}
{
  const N = p(1, 0, 2),
    H = p(1, 0, 2),
    u = p(0, 1),
    v = p(2 / Math.sqrt(5), 0, -1 / Math.sqrt(5)),
    P = p(1, -1, 2),
    Q = p(1, -1),
    M = mid(P, Q),
    T = project(M, H, N),
    X = sub(H, unit(sub(T, H))),
    circ = curve(
      (t) => addv(H, addv(mul(u, Math.cos(t)), mul(v, Math.sin(t)))),
      0,
      2 * Math.PI,
    );
  add(
    "2018-a-29",
    "원 위에서 벡터 합의 최대 길이",
    "구 x²+y²+z²=6과 x+2z=5의 교선 원에서 y가 최소인 P와 그 바닥 정사영 Q를 사용한다.",
    "136",
    [
      st(
        "교선 원의 중심과 반지름",
        R`H=(1,0,2),\quad r=\sqrt{6-5}=1`,
        "구의 중심을 평면에 정사영하면 원 중심 H이다. y방향은 평면 안에 있다.",
        m({
          threeD: true,
          range: [-1, 4, -3, 3],
          lines: [circ, line(O, H, C.orange)],
          dots: [dot(H, "H"), dot(O, "구 중심")],
        }),
      ),
      st(
        "P와 Q를 확정",
        R`P=(1,-1,2),\quad Q=(1,-1,0),\quad M=(1,-1,1)`,
        "원에서 y가 가장 작은 점은 H에서 y방향으로 1 내려간 점이다. M은 PQ의 중점이다.",
        m({
          threeD: true,
          range: [-1, 4, -3, 3],
          lines: [circ, line(P, Q, C.orange)],
          dots: [dot(P, "P"), dot(Q, "Q"), dot(M, "M")],
        }),
      ),
      st(
        "벡터 합을 한 거리로",
        R`\vec{PX}+\vec{QX}=2\vec{MX}`,
        "두 시작점의 중점을 사용하면 최적화 대상은 4MX²로 바뀐다.",
        m({
          threeD: true,
          range: [-1, 4, -3, 3],
          lines: [circ, line(P, X), line(Q, X, C.green), line(M, X, C.orange)],
          dots: [dot(X, "X"), dot(M, "M")],
        }),
      ),
      st(
        "평면에 먼저 투영",
        R`T=(7/5,-1,9/5),\quad MT^2=4/5,\quad HT=\sqrt{30}/5`,
        "M을 원의 평면에 내린 T로 분해한다. 수직 성분 MT는 X와 관계없이 고정이다.",
        m({
          threeD: true,
          range: [-1, 4, -3, 3],
          lines: [
            circ,
            line(M, T, C.red),
            line(H, T, C.orange),
            line(T, X, C.green),
          ],
          dots: [dot(T, "T"), dot(H, "H"), dot(X, "가장 먼 X")],
        }),
      ),
      st(
        "반지름을 더한 최대거리",
        R`\max MX^2=(1+\sqrt{30}/5)^2+4/5=3+2\sqrt{30}/5`,
        "원 위에서 T와 가장 먼 점은 H를 사이에 두고 T의 반대쪽에 있다.",
        m({
          threeD: true,
          range: [-1, 4, -3, 3],
          lines: [circ, line(T, X, C.orange), line(M, X, C.red)],
          surfaces: [surface([M, T, X])],
          dots: [dot(X, "최대점"), dot(T, "T"), dot(M, "M")],
        }),
      ),
      st(
        "계수 정리",
        R`\max|\vec{PX}+\vec{QX}|^2=12+\frac85\sqrt{30},\quad10(a+b)=136`,
        "처음에 분리한 계수 4를 다시 곱한다.",
        m({
          threeD: true,
          range: [-1, 4, -3, 3],
          lines: [circ, line(P, X), line(Q, X, C.green), line(M, X, C.orange)],
          dots: [dot(X, "최대점")],
          metrics: [{ label: "최댓값", value: "12 + (8/5)√30" }],
        }),
      ),
    ],
    [
      check("최대점의 구면", dp(X, X), 6),
      check("최대점의 평면", dp(N, X), 5),
      check(
        "벡터 합 제곱",
        dp(addv(sub(X, P), sub(X, Q)), addv(sub(X, P), sub(X, Q))),
        12 + (8 * Math.sqrt(30)) / 5,
      ),
      check("요구한 값", 10 * (12 + 8 / 5), 136),
    ],
  );
}
save();

// 2019.
{
  const A = p(2, 4, -2),
    B = p(5, -2, 1),
    P = p(4);
  add(
    "2019-a-3",
    "내분점의 축 조건",
    "A(2,a,−2), B(5,−2,1)의 2:1 내분점이 x축 위에 있다.",
    "4",
    [
      st(
        "2:1 내분",
        R`P=(A+2B)/3`,
        "A에서 B 방향으로 전체의 2/3만큼 이동한다.",
        m({
          threeD: true,
          range: [0, 6, -3, 5],
          lines: [line(A, B)],
          dots: [dot(A, "A"), dot(B, "B"), dot(P, "P")],
        }),
      ),
      st(
        "y,z좌표를 0으로",
        R`P=(4,(a-4)/3,0)`,
        "z좌표는 이미 0이므로 y좌표 조건에서 a를 결정한다.",
        m({
          threeD: true,
          range: [0, 6, -3, 5],
          lines: [
            line(A, P, C.orange),
            line(P, B, C.green),
            line(O, p(6), C.muted),
          ],
          dots: [dot(P, "(4,0,0)")],
        }),
      ),
      st(
        "a를 확정",
        R`a=4`,
        "구한 좌표에서 AP:PB=2:1인지 확인한다.",
        m({
          threeD: true,
          range: [0, 6, -3, 5],
          lines: [line(A, P, C.orange), line(P, B, C.green)],
          dots: [dot(A, "(2,4,−2)"), dot(B, "(5,−2,1)"), dot(P, "P")],
        }),
      ),
    ],
    [
      check("내분점", norm(sub(P, mul(addv(A, mul(B, 2)), 1 / 3))), 0),
      check("거리 비", dist(A, P) / dist(P, B), 2),
    ],
  );
}
{
  const F = p(3),
    P = p(6, 6 * Math.SQRT2),
    H = p(-3, P[1]);
  add(
    "2019-a-6",
    "초점거리와 준선거리",
    "포물선 y²=12x 위의 점 P에서 초점까지 거리가 9이다.",
    "6",
    [
      st(
        "초점과 준선",
        R`4p=12\Rightarrow p=3,\quad F=(3,0),\ x=-3`,
        "포물선의 표준형으로 초점과 준선을 찾는다.",
        m({
          range: [-5, 12, -10, 10],
          lines: [
            para(3, 0, C.blue, 10),
            line(p(-3, -10), p(-3, 10), C.muted, { dashed: true }),
          ],
          dots: [dot(F, "F")],
        }),
      ),
      st(
        "같은 두 거리",
        R`PF=PH=x_P+3=9`,
        "P에서 준선에 내린 수선의 길이가 초점거리와 같다.",
        m({
          range: [-5, 12, -10, 10],
          lines: [para(3, 0, C.blue, 10), line(P, F), line(P, H, C.orange)],
          dots: [dot(P, "P"), dot(H, "H")],
        }),
      ),
      st(
        "x좌표",
        R`x_P=6,\quad y_P=\pm6\sqrt2`,
        "위쪽과 아래쪽 두 점 모두 같은 x좌표를 준다.",
        m({
          range: [-5, 12, -10, 10],
          lines: [
            para(3, 0, C.blue, 10),
            line(p(6, -10), p(6, 10), C.orange, { dashed: true }),
          ],
          dots: [dot(P, "P₊"), dot(p(6, -P[1]), "P₋")],
        }),
      ),
    ],
    [
      check("초점거리", dist(P, F), 9),
      check("포물선 식", P[1] ** 2, 12 * P[0]),
    ],
  );
}
{
  const solve = (x) => {
    let y = 1;
    for (let i = 0; i < 30; i++)
      y -= (Math.exp(x) - x * Math.exp(y) - y) / (-x * Math.exp(y) - 1);
    return y;
  };
  const P = p(0, 1),
    s = 1 - Math.E,
    cv = curve(solve, -0.15, 1);
  add(
    "2019-a-7",
    "지수 음함수의 접선",
    "eˣ−xeʸ=y 위의 (0,1)에서 접선 기울기를 구한다.",
    "1−e",
    [
      st(
        "원래 곡선의 가지",
        R`e^x-xe^y=y,\quad P=(0,1)`,
        "지정한 점을 포함하는 실제 곡선 가지를 수치적으로 그린다.",
        m({ range: [-0.4, 1.2, -1, 2], lines: [cv], dots: [dot(P, "P")] }),
      ),
      st(
        "곱과 합성함수 미분",
        R`e^x-e^y-xe^y y'=y'`,
        "xeʸ에는 곱의 미분과 연쇄법칙이 모두 필요하다.",
        m({
          range: [-0.4, 1.2, -1, 2],
          lines: [
            cv,
            line(p(-0.1, 1 - 0.1 * s), p(0.1, 1 + 0.1 * s), C.orange),
          ],
          dots: [dot(P, "접선 방향")],
        }),
      ),
      st(
        "좌표 대입",
        R`1-e=y',\quad y=1+(1-e)x`,
        "x=0이므로 y′에 곱해진 xeʸ 항이 사라진다.",
        m({
          range: [-0.4, 1.2, -1, 2],
          lines: [cv, curve((x) => 1 + s * x, -0.3, 1, C.orange)],
          dots: [dot(P, "기울기 1−e")],
        }),
      ),
    ],
    [
      check("원문 식", Math.exp(0) - 0 * Math.exp(1), 1),
      check("미분 식", 1 - Math.E, s),
      check(
        "곡선 샘플 잔차",
        Math.exp(0.5) - 0.5 * Math.exp(solve(0.5)) - solve(0.5),
        0,
      ),
    ],
  );
}
{
  const L = p(1, 2, -1),
    v = p(1, -1, 2),
    A = p(2, 0, 5),
    N = p(2, 4, 1),
    I = p(4.5),
    pl = [p(-1, -1, 15), p(4, -1, 5), p(4, 3, -11), p(-1, 3, -1)];
  add(
    "2019-a-13",
    "직선을 포함하는 평면",
    "(2,0,5)를 지나고 x−1=2−y=(z+1)/2를 포함하는 평면의 x절편을 구한다.",
    "9/2",
    [
      st(
        "직선의 점과 방향",
        R`L=(1,2,-1),\quad\vec v=(1,-1,2)`,
        "공통 매개변수를 t로 두면 직선의 점 L과 방향벡터를 읽을 수 있다.",
        m({
          threeD: true,
          range: [-3, 6, -4, 6],
          lines: [line(sub(L, mul(v, 2)), addv(L, mul(v, 2)))],
          dots: [dot(L, "L"), dot(A, "A")],
        }),
      ),
      st(
        "두 방향에 수직인 법선",
        R`\vec{LA}=(1,-2,6),\quad\vec n=(2,4,1)`,
        "v와 LA 모두에 수직인 벡터를 법선으로 선택한다.",
        m({
          threeD: true,
          range: [-3, 6, -4, 6],
          lines: [
            line(L, A, C.orange),
            line(L, addv(L, v)),
            line(L, addv(L, N), C.green),
          ],
          surfaces: [surface(pl)],
          dots: [dot(L, "L"), dot(A, "A")],
        }),
      ),
      st(
        "평면식과 x절편",
        R`2x+4y+z=9\Rightarrow (x,y,z)=(9/2,0,0)`,
        "y=z=0을 대입하여 x축과의 교점을 얻는다.",
        m({
          threeD: true,
          range: [-3, 6, -4, 6],
          lines: [line(O, p(6), C.orange), line(L, A)],
          surfaces: [surface(pl)],
          dots: [dot(I, "x=9/2")],
        }),
      ),
    ],
    [
      check("직선 방향과 법선", dp(v, N), 0),
      check("A의 평면식", dp(A, N), 9),
      check("절편 평면식", dp(I, N), 9),
    ],
  );
}
{
  const B = p(-6),
    D = p(6),
    CC = p(0, 6 * Math.sqrt(3)),
    H = p(-2, 2 * Math.sqrt(3)),
    A = addv(H, p(0, 0, 3)),
    M = O,
    Q = p(0, H[1]);
  add(
    "2019-a-19",
    "넓이 비를 위치와 높이로",
    "변 12인 정삼각형 BCD에서 CDH:BCH:DBH=3:1:2, AH=3이다. A에서 중선 CM까지 거리를 구한다.",
    "√13",
    [
      st(
        "넓이 비와 무게 좌표",
        R`H=\frac{3B+2C+D}{6}=(-2,2\sqrt3,0)`,
        "각 작은 삼각형의 넓이는 맞은편 꼭짓점의 무게가 된다.",
        m({
          threeD: true,
          range: [-7, 7, -1, 12],
          lines: [poly([B, CC, D])],
          surfaces: [
            surface([B, CC, H]),
            surface([CC, D, H], C.green),
            surface([D, B, H], C.orange),
          ],
          dots: [dot(H, "H"), dot(B, "B"), dot(CC, "C"), dot(D, "D")],
        }),
      ),
      st(
        "중선까지의 바닥 거리",
        R`M=(0,0,0),\quad Q=(0,2\sqrt3,0),\quad HQ=2`,
        "CM은 y축 방향이다. H의 x좌표 절댓값이 CM까지의 거리이다.",
        m({
          threeD: true,
          range: [-7, 7, -1, 12],
          lines: [poly([B, CC, D]), line(CC, M), line(H, Q, C.orange)],
          dots: [dot(H, "H"), dot(Q, "Q"), dot(M, "M")],
        }),
      ),
      st(
        "공간의 수선",
        R`AH\perp\text{평면 }BCD,\quad HQ\perp CM\Rightarrow AQ\perp CM`,
        "삼수선 정리에 의해 A에서 CM에 내린 발도 Q이다.",
        m({
          threeD: true,
          range: [-7, 7, -1, 12],
          lines: [
            poly([B, CC, D]),
            line(A, H, C.green),
            line(H, Q, C.orange),
            line(A, Q, C.red),
            line(CC, M),
          ],
          dots: [dot(A, "A"), dot(H, "H"), dot(Q, "Q")],
        }),
      ),
      st(
        "피타고라스",
        R`AQ=\sqrt{AH^2+HQ^2}=\sqrt{9+4}=\sqrt{13}`,
        "서로 수직인 높이 3과 바닥 거리 2를 합친다.",
        m({
          threeD: true,
          range: [-7, 7, -1, 12],
          lines: [poly([A, H, Q]), line(CC, M, C.muted)],
          surfaces: [surface([A, H, Q])],
          dots: [dot(A, "A"), dot(Q, "Q")],
        }),
      ),
    ],
    [
      check(
        "B를 마주한 무게",
        norm(sub(H, mul(addv(addv(mul(B, 3), mul(CC, 2)), D), 1 / 6))),
        0,
      ),
      check("수선 조건", dp(sub(A, Q), sub(CC, M)), 0),
      check("AQ²", dist(A, Q) ** 2, 13),
    ],
  );
}
{
  const pos = (t) => p(1 - Math.cos(4 * t), 0.25 * Math.sin(4 * t)),
    t = Math.PI / 8,
    P = pos(t),
    V = p(4, 0),
    acc = p(0, -4);
  add(
    "2019-a-24",
    "최대 속력에서의 가속도",
    "x=1−cos4t, y=(1/4)sin4t, t≥0인 운동의 속력이 최대일 때 가속도 크기를 구한다.",
    "4",
    [
      st(
        "타원 운동",
        R`P(t)=(1-\cos4t,\tfrac14\sin4t)`,
        "운동 경로의 수평 반축은 1, 수직 반축은 1/4이다.",
        m({
          range: [-1, 6, -4, 2],
          lines: [curve(pos, 0, Math.PI / 2)],
          dots: [dot(P, "t=π/8")],
        }),
      ),
      st(
        "속력 제곱 최대",
        R`v^2=16\sin^24t+\cos^24t=1+15\sin^24t\le16`,
        "sin²4t=1일 때 속력이 4로 최대이다. 이때 cos4t=0이다.",
        m({
          range: [-1, 6, -4, 2],
          lines: [curve(pos, 0, Math.PI / 2), line(P, addv(P, V), C.orange)],
          dots: [dot(P, "최대 속력 위치")],
        }),
      ),
      st(
        "가속도의 성분",
        R`a=(16\cos4t,-4\sin4t)\Rightarrow|a|=4`,
        "최대 속력 순간에는 수평 가속도가 0, 수직 가속도의 크기가 4이다.",
        m({
          range: [-1, 6, -4, 2],
          lines: [
            curve(pos, 0, Math.PI / 2),
            line(P, addv(P, V), C.orange),
            line(P, addv(P, acc), C.green),
          ],
          dots: [dot(addv(P, acc), "가속도 (0,−4)")],
        }),
      ),
    ],
    [check("최대 속력", norm(V), 4), check("가속도 크기", norm(acc), 4)],
  );
}
{
  const F = p(4),
    G = p(-4),
    K = p(0, 3),
    P = p(-8 / 5, 9 / 5),
    Q = p(56 / 19, 99 / 19);
  add(
    "2019-a-28",
    "타원의 거리 합에서 원의 최단거리 빼기",
    "타원 x²/49+y²/33=1과 원 x²+(y−3)²=4에서 F′,P,Q가 한 직선 위에 있을 때 PQ+FQ의 최댓값을 구한다.",
    "11",
    [
      st(
        "초점거리와 원의 위치",
        R`F=(4,0),\quad F'=(-4,0),\quad K=(0,3),\quad r=2`,
        "원은 타원의 내부에 놓인다. F′에서 원을 지나 위쪽 타원에 닿는 Q를 잡는다.",
        m({
          range: [-8, 8, -7, 7],
          lines: [ellipse(7, Math.sqrt(33)), circle(0, 3, 2, C.green)],
          dots: [dot(F, "F"), dot(G, "F′"), dot(K, "K")],
        }),
      ),
      st(
        "타원의 합을 사용",
        R`PQ+FQ=(F'Q-F'P)+FQ=14-F'P`,
        "P는 F′와 Q 사이에 있으므로 선분 길이를 뺄 수 있다.",
        m({
          range: [-8, 8, -7, 7],
          lines: [
            ellipse(7, Math.sqrt(33)),
            circle(0, 3, 2, C.green),
            line(G, Q),
            line(F, Q, C.orange),
          ],
          dots: [dot(P, "P"), dot(Q, "Q")],
        }),
      ),
      st(
        "원 위 최단거리",
        R`\min F'P=F'K-r=5-2=3`,
        "원 중심 K에서 F′ 방향으로 반지름만큼 이동한 P가 가장 가깝다.",
        m({
          range: [-8, 8, -7, 7],
          lines: [
            circle(0, 3, 2, C.green),
            line(G, K, C.muted),
            line(G, P, C.orange),
          ],
          dots: [dot(G, "F′"), dot(P, "(−8/5,9/5)"), dot(K, "K")],
        }),
      ),
      st(
        "최대값과 실제 교점",
        R`\max(PQ+FQ)=14-3=11`,
        "Q=(56/19,99/19)는 해당 직선과 위쪽 타원의 실제 교점이다.",
        m({
          range: [-8, 8, -7, 7],
          lines: [
            ellipse(7, Math.sqrt(33)),
            line(P, Q, C.orange),
            line(F, Q, C.green),
          ],
          dots: [dot(P, "P"), dot(Q, "Q"), dot(F, "F")],
        }),
      ),
    ],
    [
      check("P의 원", P[0] ** 2 + (P[1] - 3) ** 2, 4),
      check("Q의 타원", Q[0] ** 2 / 49 + Q[1] ** 2 / 33, 1),
      check("최대 거리 합", dist(P, Q) + dist(F, Q), 11),
    ],
  );
}
{
  const A = O,
    B = p(6),
    CC = p(0, 3),
    polyX = [p(3), p(4.5), p(4.5, 0.75), p(1.5, 2.25), p(0, 2.25), p(0, 1.5)],
    areaPoly = (pts) =>
      Math.abs(
        pts.reduce(
          (s, a, i) =>
            s +
            a[0] * pts[(i + 1) % pts.length][1] -
            a[1] * pts[(i + 1) % pts.length][0],
          0,
        ),
      ) / 2;
  add(
    "2019-a-29",
    "세 선분의 벡터합이 만드는 육각형",
    "넓이 9인 ABC의 변 위 P,Q,R로 X=(P+R)/4+Q/2를 만들 때 영역 넓이를 구한다.",
    "53",
    [
      st(
        "아핀 좌표로 단순화",
        R`A=(0,0),\ B=(6,0),\ C=(0,3),\quad[ABC]=9`,
        "원문의 삼각형 모양은 정해져 있지 않다. 면적비를 보존하는 아핀 변환으로 이 좌표를 사용하며 최종 비율은 모든 삼각형에 같다.",
        m({
          range: [-1, 7, -1, 4],
          lines: [poly([A, B, CC])],
          dots: [dot(A, "A"), dot(B, "B"), dot(CC, "C")],
        }),
      ),
      st(
        "Q를 고정한 작은 평행사변형",
        R`X=\frac{s}{4}B+\frac{t}{4}C+\frac12((1-u)B+uC),\quad0\le s,t,u\le1`,
        "P=sB, R=tC, Q=(1−u)B+uC이다. u=0에서 X의 범위는 사각형이다.",
        m({
          range: [-1, 7, -1, 4],
          lines: [
            poly([A, B, CC], C.muted),
            poly([p(3), p(4.5), p(4.5, 0.75), p(3, 0.75)]),
          ],
          surfaces: [surface([p(3), p(4.5), p(4.5, 0.75), p(3, 0.75)])],
        }),
      ),
      st(
        "Q를 BC 위로 이동",
        R`\Delta X=\tfrac u2(C-B)`,
        "작은 사각형을 (−3,1.5)만큼 평행이동하며 채운 영역은 여섯 꼭짓점을 갖는다.",
        m({
          range: [-1, 7, -1, 4],
          lines: [
            poly(polyX),
            line(p(3), p(0, 1.5), C.orange),
            poly([p(0, 1.5), p(1.5, 1.5), p(1.5, 2.25), p(0, 2.25)], C.green),
          ],
          surfaces: [surface(polyX)],
        }),
      ),
      st(
        "단위 계수 평면의 넓이",
        R`[\text{계수 영역}]=\frac1{16}+\frac18+\frac18=\frac5{16}`,
        "기본 사각형 1/16과 두 방향으로 쓸려 나간 평행사변형 1/8씩을 더한다.",
        m({
          range: [-1, 7, -1, 4],
          lines: [poly(polyX)],
          surfaces: [
            surface([p(3), p(4.5), p(4.5, 0.75), p(3, 0.75)]),
            surface([p(3), p(3, 0.75), p(0, 2.25), p(0, 1.5)], C.orange),
            surface(
              [p(3, 0.75), p(4.5, 0.75), p(1.5, 2.25), p(0, 2.25)],
              C.green,
            ),
          ],
        }),
      ),
      st(
        "원래 넓이로 환산",
        R`[\text{영역}]=2[ABC]\cdot\frac5{16}=\frac{45}{8},\quad p+q=8+45=53`,
        "계수 평면의 단위 정사각형은 ABC의 두 배 넓이에 해당한다.",
        m({
          range: [-1, 7, -1, 4],
          lines: [poly(polyX)],
          surfaces: [surface(polyX, C.green)],
          dots: polyX.map((v, i) => dot(v, String(i + 1))),
          metrics: [{ label: "영역 넓이", value: "45/8" }],
        }),
      ),
    ],
    [
      check("기준 삼각형 넓이", areaPoly([A, B, CC]), 9),
      check("육각형 넓이", areaPoly(polyX), 45 / 8),
      check("분자 분모 합", 45 + 8, 53),
    ],
  );
}
save();

// 2020.
{
  const A = p(2, 0, 1),
    B = p(3, 2),
    P = p(0, 2);
  add(
    "2020-a-3",
    "y축 위 등거리점",
    "A(2,0,1)와 B(3,2,0)에서 같은 거리에 있는 (0,a,0)을 찾는다.",
    "2",
    [
      st(
        "y축 위의 점",
        R`P=(0,a,0)`,
        "움직일 수 있는 방향은 y축 하나뿐이다.",
        m({
          threeD: true,
          range: [-1, 5, -1, 5],
          lines: [line(p(0, -1), p(0, 5), C.muted)],
          dots: [dot(A, "A"), dot(B, "B"), dot(P, "P")],
        }),
      ),
      st(
        "거리 제곱을 같게",
        R`PA^2=a^2+5,\quad PB^2=(a-2)^2+9`,
        "제곱근을 없애고 두 식을 비교하면 a²이 소거된다.",
        m({
          threeD: true,
          range: [-1, 5, -1, 5],
          lines: [line(P, A), line(P, B, C.orange)],
          dots: [dot(A, "A"), dot(B, "B"), dot(P, "P")],
        }),
      ),
      st(
        "해와 길이 확인",
        R`a^2+5=a^2-4a+13\Rightarrow a=2,\quad PA=PB=3`,
        "점 P=(0,2,0)에서 두 선분 길이가 모두 3이다.",
        m({
          threeD: true,
          range: [-1, 5, -1, 5],
          lines: [line(P, A), line(P, B, C.orange)],
          surfaces: [surface([P, A, B])],
          dots: [dot(P, "(0,2,0)")],
        }),
      ),
    ],
    [check("PA", dist(P, A), 3), check("PB", dist(P, B), 3)],
  );
}
{
  const P = p(1),
    fn = (x) => (3 * x - Math.sqrt(5 * x * x + 4 * x)) / 2;
  add(
    "2020-a-5",
    "이차곡선의 음함수 미분",
    "x²−3xy+y²=x 위의 (1,0)에서 접선 기울기를 구한다.",
    "1/3",
    [
      st(
        "지정한 가지",
        R`x^2-3xy+y^2=x`,
        "(1,0)을 포함하는 실제 이차곡선 가지를 그린다.",
        m({
          range: [-1, 5, -2, 3],
          lines: [curve(fn, 0, 4)],
          dots: [dot(P, "(1,0)")],
        }),
      ),
      st(
        "xy항을 곱으로 미분",
        R`2x-3y-3xy'+2yy'=1`,
        "xy를 미분할 때 y+xy′가 나온다.",
        m({
          range: [-1, 5, -2, 3],
          lines: [curve(fn, 0, 4), line(p(0.4, -0.2), p(1.6, 0.2), C.orange)],
          dots: [dot(P, "접점")],
        }),
      ),
      st(
        "접선 방정식",
        R`2-3y'=1\Rightarrow y'=1/3,\quad y=(x-1)/3`,
        "기울기 1/3인 직선이 지정한 점에서 접한다.",
        m({
          range: [-1, 5, -2, 3],
          lines: [curve(fn, 0, 4), curve((x) => (x - 1) / 3, -1, 5, C.orange)],
          dots: [dot(P, "접점"), dot(p(4, 1), "Δx=3, Δy=1")],
        }),
      ),
    ],
    [check("원문 곡선", 1, 1), check("미분 관계", 2 - 3 * (1 / 3), 1)],
  );
}
{
  const t = Math.acos(2 ** -0.25),
    pos = (t) => p(t + Math.sin(t) * Math.cos(t), Math.tan(t)),
    P = pos(t),
    V = p(Math.SQRT2, Math.SQRT2);
  add(
    "2020-a-9",
    "속도 성분의 곱이 일정한 운동",
    "x=t+sin t cos t, y=tan t, 0<t<π/2에서 속력의 최솟값을 구한다.",
    "2",
    [
      st(
        "시간 구간과 경로",
        R`0<t<\pi/2`,
        "tan t가 정의되는 열린 시간 구간을 사용한다. 경로와 최소 속력 위치를 표시한다.",
        m({
          range: [0, 4, 0, 5],
          lines: [curve(pos, 0.001, 1.35)],
          dots: [dot(P, "최소 속력 시각")],
        }),
      ),
      st(
        "속도 성분의 곱",
        R`x'=2\cos^2t,\quad y'=\sec^2t,\quad x'y'=2`,
        "두 성분은 모두 양수이고 곱이 항상 2이다.",
        m({
          range: [0, 4, 0, 5],
          lines: [curve(pos, 0.001, 1.35), line(P, addv(P, V), C.orange)],
          dots: [dot(addv(P, V), "v=(√2,√2)")],
        }),
      ),
      st(
        "제곱합의 하한",
        R`v^2=(x')^2+(y')^2\ge2x'y'=4`,
        "두 속도 성분이 같을 때 등호가 성립한다.",
        m({
          range: [0, 4, 0, 5],
          lines: [
            line(O, V, C.orange),
            line(O, p(Math.SQRT2), C.green),
            line(p(Math.SQRT2), V, C.blue),
          ],
          dots: [dot(V, "등호: x′=y′")],
        }),
      ),
      st(
        "등호 시각이 구간 안",
        R`\cos^2t=1/\sqrt2\Rightarrow\min v=2`,
        "cos²t=1/√2인 시각은 0과 π/2 사이이므로 하한이 실제로 달성된다.",
        m({
          range: [0, 4, 0, 5],
          lines: [curve(pos, 0.001, 1.35), line(P, addv(P, V), C.orange)],
          dots: [dot(P, "최솟값 2")],
        }),
      ),
    ],
    [
      check("성분의 곱", (2 * Math.cos(t) ** 2) / Math.cos(t) ** 2, 2),
      check("최소 속력", norm(V), 2),
    ],
  );
}
{
  const a = Math.sqrt(15),
    c = Math.sqrt(10),
    A = p(a),
    F = p(0, c),
    G = p(0, -c),
    B = p(2 * a, c),
    P = p(3, c);
  add(
    "2020-a-13",
    "둘레 차에서 타원의 반축 찾기",
    "세로 장반축 5인 타원에서 높이 c의 직선과 AF′의 교점을 B, 타원 교점을 P라 한다. 두 삼각형의 둘레 차가 4이다.",
    "5√6",
    [
      st(
        "초점과 꼭짓점",
        R`a^2+c^2=25,\quad AF=AF'=5,\quad B=(2a,c)`,
        "A=(a,0)에서 두 초점까지 거리는 장반축 5이다. B는 AF′를 같은 길이만큼 연장한 점이다.",
        m({
          range: [-5, 10, -6, 6],
          lines: [ellipse(a, 5), line(G, B, C.muted)],
          dots: [dot(A, "A"), dot(F, "F"), dot(G, "F′"), dot(B, "B")],
        }),
      ),
      st(
        "P의 수평 거리",
        R`P=(a^2/5,c),\quad PF=a^2/5,\quad PF'=10-a^2/5`,
        "y=c를 타원식에 대입하고 두 초점거리의 합 10을 쓴다.",
        m({
          range: [-5, 10, -6, 6],
          lines: [
            ellipse(a, 5),
            line(P, F),
            line(P, G, C.green),
            line(F, B, C.orange),
          ],
          dots: [dot(P, "P"), dot(F, "F"), dot(G, "F′")],
        }),
      ),
      st(
        "둘레에서 공통항 소거",
        R`L_{BPF'}=2a+20-2a^2/5,\quad L_{BFA}=2a+10`,
        "BF′=10과 BA=5를 사용하면 둘레의 차는 10−2a²/5이다.",
        m({
          range: [-5, 10, -6, 6],
          lines: [poly([B, P, G]), poly([B, F, A], C.orange)],
          surfaces: [surface([B, P, G]), surface([B, F, A], C.orange)],
          dots: [dot(B, "B")],
        }),
      ),
      st(
        "반축과 초점거리",
        R`10-2a^2/5=4\Rightarrow a^2=15,\quad c^2=10`,
        "두 반길이는 양수라는 원문의 조건을 적용한다.",
        m({
          range: [-5, 10, -6, 6],
          lines: [ellipse(a, 5), line(O, A, C.orange), line(O, F, C.green)],
          dots: [dot(A, "a=√15"), dot(F, "c=√10")],
        }),
      ),
      st(
        "삼각형 넓이",
        R`[AFF']=\frac12(2c)a=ac=5\sqrt6`,
        "FF′를 밑변으로 잡으면 높이는 a이다.",
        m({
          range: [-5, 10, -6, 6],
          lines: [poly([A, F, G]), line(A, O, C.orange)],
          surfaces: [surface([A, F, G])],
          dots: [dot(A, "A"), dot(F, "F"), dot(G, "F′")],
        }),
      ),
    ],
    [
      check(
        "둘레 차",
        dist(B, P) +
          dist(P, G) +
          dist(G, B) -
          dist(B, F) -
          dist(F, A) -
          dist(A, B),
        4,
      ),
      check("넓이", a * c, 5 * Math.sqrt(6)),
    ],
  );
}
{
  const B = p(-5),
    CC = p(5),
    A = p(0, 5 * Math.sqrt(3)),
    P = p(Math.sqrt(97) / 5, (24 * Math.sqrt(3)) / 5),
    b = Math.sqrt(24);
  add(
    "2020-a-17",
    "쌍곡선 위에서 꼭짓점에 가장 가까운 점",
    "변 10인 정삼각형 ABC에서 PB−PC=2인 P를 움직여 PA가 최소인 위치를 찾는다.",
    "24√3",
    [
      st(
        "거리 차의 자취",
        R`B=(-5,0),\ C=(5,0),\quad x^2-y^2/24=1,\ x>0`,
        "초점거리 차가 양의 2이므로 오른쪽 쌍곡선 가지를 사용한다.",
        m({
          range: [-7, 7, -2, 12],
          lines: [poly([A, B, CC], C.muted), hyper(1, b)],
          dots: [dot(A, "A"), dot(B, "B"), dot(CC, "C")],
        }),
      ),
      st(
        "한 변수로 거리 제곱",
        R`PA^2=1+y^2/24+(y-5\sqrt3)^2`,
        "쌍곡선 식에서 x²을 없애면 y에 대한 볼록 이차식이 된다.",
        m({
          range: [-7, 7, -2, 12],
          lines: [hyper(1, b), line(A, P, C.orange)],
          dots: [dot(P, "P"), dot(A, "A")],
        }),
      ),
      st(
        "이차식의 꼭짓점",
        R`\frac{25}{12}y-10\sqrt3=0\Rightarrow y=24\sqrt3/5`,
        "y는 모든 실수를 취할 수 있으므로 이 꼭짓점이 전역 최솟값을 준다.",
        m({
          range: [-7, 7, -2, 12],
          lines: [
            hyper(1, b),
            line(A, P, C.orange),
            line(p(-6, P[1]), p(6, P[1]), C.green, { dashed: true }),
          ],
          dots: [dot(P, "(√97/5,24√3/5)")],
        }),
      ),
      st(
        "PBC의 넓이",
        R`[PBC]=\frac12\cdot10\cdot\frac{24\sqrt3}{5}=24\sqrt3`,
        "최소거리 자체가 아니라 그 위치에서의 삼각형 넓이를 묻는다.",
        m({
          range: [-7, 7, -2, 12],
          lines: [poly([P, B, CC]), line(P, p(P[0]), C.orange)],
          surfaces: [surface([P, B, CC])],
          dots: [dot(P, "P")],
        }),
      ),
    ],
    [
      check("초점거리 차", dist(P, B) - dist(P, CC), 2),
      check("PA 최솟값", dist(P, A), 2),
      check("삼각형 넓이", 5 * P[1], 24 * Math.sqrt(3)),
    ],
  );
}
{
  const A = O,
    B = p(8),
    CC = p(7.5, Math.sqrt(15) / 2),
    D = p(5, -Math.sqrt(15));
  add(
    "2020-a-19",
    "원 위 네 점의 벡터 관계",
    "AB=8이고 AC·BC=0이며 AD=(1/2)AB−2BC인 네 공원점에서 AD²을 구한다.",
    "40",
    [
      st(
        "AB는 지름",
        R`A=(0,0),\ B=(8,0),\quad C=(x,y),\ x^2+y^2=8x`,
        "C에서 두 선분이 직각이므로 AB가 지름인 원이다.",
        m({
          range: [-1, 9, -5, 5],
          lines: [
            circle(4, 0, 4),
            line(A, B, C.muted),
            line(A, CC),
            line(B, CC, C.green),
          ],
          dots: [dot(A, "A"), dot(B, "B"), dot(CC, "C")],
        }),
      ),
      st(
        "D의 성분",
        R`D=\tfrac12B-2(C-B)=(20-2x,-2y)`,
        "BC=C−B라는 시작점 차이를 놓치지 않는다.",
        m({
          range: [-1, 9, -5, 5],
          lines: [circle(4, 0, 4), line(A, D, C.orange), line(B, CC, C.green)],
          dots: [dot(CC, "C"), dot(D, "D")],
        }),
      ),
      st(
        "D도 같은 원 위",
        R`(20-2x)^2+4y^2=8(20-2x)\Rightarrow x=15/2`,
        "C의 원 방정식을 함께 넣으면 y가 소거되고 x가 정해진다.",
        m({
          range: [-1, 9, -5, 5],
          lines: [circle(4, 0, 4), poly([A, B, CC, D])],
          dots: [dot(CC, "(15/2,√15/2)"), dot(D, "(5,−√15)")],
        }),
      ),
      st(
        "요구한 길이 제곱",
        R`AD^2=5^2+(\sqrt{15})^2=40`,
        "C를 x축에 대해 반사한 경우에도 같은 제곱길이를 얻는다.",
        m({
          range: [-1, 9, -5, 5],
          lines: [
            circle(4, 0, 4),
            line(A, D, C.red),
            line(A, p(5), C.green),
            line(p(5), D, C.orange),
          ],
          dots: [dot(D, "AD²=40")],
        }),
      ),
    ],
    [
      check("C의 원", dist(CC, p(4)), 4),
      check("D의 원", dist(D, p(4)), 4),
      check("벡터 관계", norm(sub(D, sub(mul(B, 0.5), mul(sub(CC, B), 2)))), 0),
      check("AD²", dp(D, D), 40),
    ],
  );
}
{
  const M = p(-1),
    N = p(1),
    A = p(0, 3 * Math.sqrt(3)),
    P = p(0, (7 * Math.sqrt(3)) / 9, (4 * Math.sqrt(6)) / 9),
    normal = cross(sub(M, A), sub(P, A)),
    Np = project(N, A, normal),
    base = 3 * Math.sqrt(3),
    cos = Math.abs(normal[2]) / norm(normal);
  add(
    "2020-a-27",
    "종이 접기에서 정사영 넓이",
    "변 4, 각 60°인 마름모를 AM,AN,MN으로 접어 B,C,D가 P로 겹치는 사면체를 만든다.",
    "8",
    [
      st(
        "접어도 보존되는 길이",
        R`AM=AN=2\sqrt7,\ MN=2,\ AP=4,\ MP=NP=2`,
        "전개도의 변과 중점 관계로 여섯 모서리 길이를 먼저 정한다.",
        m({
          range: [-2, 2, -1, 6],
          lines: [poly([A, M, N])],
          dots: [dot(A, "A"), dot(M, "M"), dot(N, "N")],
        }),
      ),
      st(
        "대칭 좌표로 P 찾기",
        R`M=(-1,0,0),\ N=(1,0,0),\ A=(0,3\sqrt3,0)`,
        "MP=NP로 P의 x좌표가 0이다. MP²=4와 AP²=16을 동시에 푼다.",
        m({
          threeD: true,
          range: [-2, 2, -1, 6],
          lines: [
            poly([A, M, N]),
            line(P, A, C.orange),
            line(P, M, C.orange),
            line(P, N, C.orange),
          ],
          dots: [dot(P, "P"), dot(A, "A"), dot(M, "M"), dot(N, "N")],
        }),
      ),
      st(
        "접힌 꼭짓점의 높이",
        R`P=(0,7\sqrt3/9,4\sqrt6/9)`,
        "z좌표의 양의 해는 위로 접은 배치이다. 아래로 접어도 정사영 넓이는 같다.",
        m({
          threeD: true,
          range: [-2, 2, -1, 6],
          lines: [poly([A, M, N]), line(P, p(P[0], P[1]), C.red)],
          surfaces: [surface([P, A, M]), surface([P, A, N], C.green)],
          dots: [dot(P, "P")],
        }),
      ),
      st(
        "두 평면의 각",
        R`\cos\theta=5/9,\quad[AMN]=3\sqrt3`,
        "밑면의 법선과 PAM의 법선 내적에서 평면각을 계산한다.",
        m({
          threeD: true,
          range: [-2, 2, -1, 6],
          lines: [
            line(A, addv(A, unit(normal)), C.orange),
            line(A, addv(A, p(0, 0, 1)), C.green),
          ],
          surfaces: [surface([A, M, N]), surface([P, A, M], C.orange)],
        }),
      ),
      st(
        "N의 정사영",
        R`[\operatorname{proj}_{PAM}AMN]=3\sqrt3\cdot5/9=5\sqrt3/3`,
        "A와 M은 이미 투영 평면 위에 있으므로 N만 수직으로 내리면 된다.",
        m({
          threeD: true,
          range: [-2, 2, -1, 6],
          lines: [
            poly([A, M, N], C.muted),
            poly([A, M, Np], C.orange),
            line(N, Np, C.green, { dashed: true }),
          ],
          surfaces: [surface([A, M, Np], C.orange)],
          dots: [dot(N, "N"), dot(Np, "N의 정사영")],
        }),
      ),
      st(
        "기약분수의 합",
        R`p=3,\ q=5\Rightarrow p+q=8`,
        "접힌 공간 도형의 실제 모서리 길이와 투영 면적을 검산한다.",
        m({
          threeD: true,
          range: [-2, 2, -1, 6],
          lines: [poly([A, M, Np], C.orange)],
          surfaces: [surface([A, M, Np], C.orange)],
          dots: [dot(A, "A"), dot(M, "M"), dot(Np, "N′")],
          metrics: [{ label: "정사영 넓이", value: "5√3/3" }],
        }),
      ),
    ],
    [
      check("AP", dist(A, P), 4),
      check("MP", dist(M, P), 2),
      check("NP", dist(N, P), 2),
      check("평면각 코사인", cos, 5 / 9),
      check(
        "투영 넓이",
        norm(cross(sub(M, A), sub(Np, A))) / 2,
        (5 * Math.sqrt(3)) / 3,
      ),
    ],
  );
}
{
  const A = p(3, -3, 3),
    B = p(-2, 7, -2),
    H = p(1, 1, 1),
    K = mul(H, 1 / 3),
    w = p(-Math.SQRT1_2, 0, Math.SQRT1_2),
    CC = addv(K, mul(w, Math.sqrt(2 / 3))),
    D = sub(K, mul(w, Math.sqrt(2 / 3))),
    V = Math.abs(dp(sub(B, A), cross(sub(CC, A), sub(D, A)))) / 6;
  add(
    "2020-a-29",
    "한 직선을 지나는 구의 두 접평면",
    "AB를 포함하며 단위구에 접하는 두 평면의 접점 C,D로 사면체 ABCD의 부피를 구한다.",
    "29",
    [
      st(
        "원점에서 AB에 내린 수선",
        R`H=(1,1,1),\quad OH=\sqrt3,\quad AB=5\sqrt6`,
        "AB에 수직이며 원점을 지나는 단면에서 접선 문제로 바꾼다.",
        m({
          threeD: true,
          range: [-4, 5, -4, 8],
          lines: [line(A, B), line(O, H, C.orange)],
          dots: [dot(A, "A"), dot(B, "B"), dot(H, "H"), dot(O, "O")],
        }),
      ),
      st(
        "단위 원의 두 접점",
        R`OC=OD=1,\quad OC\perp HC,\quad OD\perp HD`,
        "단면 안에서 H에서 단위원에 그은 두 접선의 접점이 C,D이다.",
        m({
          threeD: true,
          range: [-4, 5, -4, 8],
          lines: [
            line(H, CC),
            line(H, D, C.green),
            line(O, CC, C.orange),
            line(O, D, C.orange),
          ],
          dots: [dot(H, "H"), dot(CC, "C"), dot(D, "D")],
        }),
      ),
      st(
        "접점 현의 중점",
        R`K=H/3,\quad OK=1/\sqrt3,\quad HK=2/\sqrt3,\quad CD=2\sqrt{2/3}`,
        "접점은 C·H=D·H=1을 만족한다. CD의 중점은 OH 위의 H/3이다.",
        m({
          threeD: true,
          range: [-2, 3, -2, 3],
          lines: [poly([H, CC, D]), line(O, H, C.muted), line(H, K, C.orange)],
          dots: [dot(K, "K"), dot(CC, "C"), dot(D, "D")],
        }),
      ),
      st(
        "단면 삼각형의 넓이",
        R`[HCD]=\tfrac12 CD\cdot HK=2\sqrt2/3`,
        "AB는 단면 HCD에 수직이고 H는 AB의 내부에 있다.",
        m({
          threeD: true,
          range: [-4, 5, -4, 8],
          lines: [line(A, B), poly([H, CC, D])],
          surfaces: [surface([H, CC, D])],
          dots: [dot(H, "H")],
        }),
      ),
      st(
        "두 피라미드의 부피 합",
        R`V=\tfrac13[HCD](AH+HB)=\tfrac13\cdot\tfrac{2\sqrt2}{3}\cdot5\sqrt6=20\sqrt3/9`,
        "사면체를 HCD를 공통 밑면으로 하는 두 부분으로 나누면 높이 합이 AB이다.",
        m({
          threeD: true,
          range: [-4, 5, -4, 8],
          lines: [
            line(A, B),
            line(A, CC),
            line(A, D),
            line(B, CC),
            line(B, D),
            line(CC, D),
          ],
          surfaces: [surface([A, CC, D]), surface([B, CC, D], C.green)],
          dots: [dot(A, "A"), dot(B, "B"), dot(CC, "C"), dot(D, "D")],
        }),
      ),
      st(
        "분자와 분모",
        R`p+q=9+20=29`,
        "실제 좌표의 삼중곱으로 같은 부피를 확인한다.",
        m({
          threeD: true,
          range: [-4, 5, -4, 8],
          lines: [line(A, B), poly([H, CC, D])],
          surfaces: [surface([H, CC, D], C.orange)],
          metrics: [{ label: "부피", value: "20√3/9" }],
        }),
      ),
    ],
    [
      check("C 구면", norm(CC), 1),
      check("D 구면", norm(D), 1),
      check("C 접평면이 A 포함", dp(CC, A), 1),
      check("D 접평면이 B 포함", dp(D, B), 1),
      check("사면체 부피", V, (20 * Math.sqrt(3)) / 9),
    ],
  );
}
save();

// 2023.
{
  const A = p(2, 2, -1),
    B = p(2, -2, 1),
    CC = p(-2, 1, 1);
  add(
    "2023-geometry-23",
    "x축 대칭과 공간 거리",
    "A(2,2,−1)를 x축에 대칭시킨 B와 C(−2,1,1)의 거리를 구한다.",
    "5",
    [
      st(
        "x축 대칭",
        R`(x,y,z)\mapsto(x,-y,-z)`,
        "축 대칭에서는 그 축의 좌표만 유지하고 나머지 두 좌표 부호를 바꾼다.",
        m({
          threeD: true,
          range: [-4, 4, -4, 4],
          lines: [line(A, B, C.orange), line(p(-4), p(4), C.muted)],
          dots: [dot(A, "A"), dot(B, "B")],
        }),
      ),
      st(
        "두 점의 차",
        R`B=(2,-2,1),\quad C-B=(-4,3,0)`,
        "B와 C의 z좌표가 같으므로 수평 평면 안에서 거리 계산이 된다.",
        m({
          threeD: true,
          range: [-4, 4, -4, 4],
          lines: [line(B, CC)],
          dots: [dot(B, "B"), dot(CC, "C")],
        }),
      ),
      st(
        "3-4-5 직각삼각형",
        R`BC=\sqrt{(-4)^2+3^2}=5`,
        "x방향 4와 y방향 3의 이동으로 빗변 5를 얻는다.",
        m({
          threeD: true,
          range: [-4, 4, -4, 4],
          lines: [
            line(B, CC),
            line(B, p(-2, -2, 1), C.green),
            line(p(-2, -2, 1), CC, C.orange),
          ],
          dots: [dot(B, "B"), dot(CC, "C")],
        }),
      ),
    ],
    [check("거리", dist(B, CC), 5)],
  );
}
{
  const f = 1 / 3,
    P = p(3, 2),
    F = p(f),
    H = p(-f, 2);
  add(
    "2023-geometry-24",
    "초점·준선으로 포물선 결정",
    "초점 (1/3,0), 준선 x=−1/3인 포물선이 (a,2)를 지난다.",
    "3",
    [
      st(
        "포물선의 정의",
        R`F=(1/3,0),\quad\ell:x=-1/3`,
        "초점까지 거리와 준선까지 거리가 같은 점들의 자취이다.",
        m({
          range: [-2, 5, -3, 3],
          lines: [line(p(-f, -3), p(-f, 3), C.muted, { dashed: true })],
          dots: [dot(F, "F")],
        }),
      ),
      st(
        "표준형",
        R`y^2=\frac43x`,
        "초점의 x좌표가 p=1/3이므로 y²=4px이다.",
        m({
          range: [-2, 5, -3, 3],
          lines: [para(f, 0, C.blue, 2.5)],
          dots: [dot(P, "(a,2)")],
        }),
      ),
      st(
        "점 대입",
        R`4=\frac43a\Rightarrow a=3`,
        "실제 점 (3,2)에서 두 거리가 모두 10/3인지 검산한다.",
        m({
          range: [-2, 5, -3, 3],
          lines: [para(f, 0, C.blue, 2.5), line(P, F), line(P, H, C.orange)],
          dots: [dot(P, "(3,2)"), dot(H, "H")],
        }),
      ),
    ],
    [
      check("초점거리", dist(P, F), 10 / 3),
      check("준선거리", dist(P, H), 10 / 3),
    ],
  );
}
{
  const a = Math.sqrt(8),
    b = Math.sqrt(2),
    c = Math.sqrt(6),
    P = p(2, 1);
  add(
    "2023-geometry-25",
    "접선의 기울기로 두 반축 계산",
    "타원 x²/a²+y²/b²=1의 (2,1)에서 접선 기울기가 −1/2이다.",
    "2√6",
    [
      st(
        "점이 타원 위",
        R`4/a^2+1/b^2=1`,
        "주어진 점의 좌표를 원래 식에 넣어 첫 관계를 얻는다.",
        m({
          range: [-4, 4, -3, 3],
          lines: [ellipse(a, b)],
          dots: [dot(P, "(2,1)")],
        }),
      ),
      st(
        "접선 기울기",
        R`y'=-\frac{b^2x}{a^2y},\quad-2b^2/a^2=-1/2\Rightarrow a^2=4b^2`,
        "접선식 또는 음함수 미분으로 기울기 조건을 적용한다.",
        m({
          range: [-4, 4, -3, 3],
          lines: [ellipse(a, b), curve((x) => 2 - x / 2, -2, 4, C.orange)],
          dots: [dot(P, "기울기 −1/2")],
        }),
      ),
      st(
        "반축과 초점",
        R`b^2=2,\ a^2=8,\ c^2=a^2-b^2=6`,
        "a>b이므로 초점은 x축 위에 있다.",
        m({
          range: [-4, 4, -3, 3],
          lines: [ellipse(a, b), line(p(-c), p(c), C.orange)],
          dots: [dot(p(-c), "F′"), dot(p(c), "F")],
        }),
      ),
      st(
        "초점 사이 거리",
        R`FF'=2c=2\sqrt6`,
        "반초점거리 c와 두 초점 사이의 길이 2c를 구별한다.",
        m({
          range: [-4, 4, -3, 3],
          lines: [ellipse(a, b), line(p(-c), p(c), C.red)],
          dots: [dot(p(-c), "−√6"), dot(p(c), "√6")],
        }),
      ),
    ],
    [
      check("점의 타원식", 4 / 8 + 1 / 2, 1),
      check("기울기", (-2 * b * b) / (a * a), -0.5),
      check("초점거리²", (2 * c) ** 2, 24),
    ],
  );
}
{
  const A = p(2, 4),
    B = p(2, 8),
    H = p(2, 6),
    P = p(2, 4),
    Q = p(2, 2);
  add(
    "2023-geometry-26",
    "내적 자취와 직선 사이 거리",
    "(p−a)·(p−b)=0, a=(2,4), b=(2,8), q=(1,2)+t(1,0)의 두 자취 사이 최단거리를 구한다.",
    "2",
    [
      st(
        "직각 조건의 원",
        R`(p-a)\cdot(p-b)=0\Rightarrow(x-2)^2+(y-6)^2=4`,
        "AB가 지름인 원이며 두 지름 끝점도 조건에 포함된다.",
        m({
          range: [-2, 6, 0, 10],
          lines: [circle(2, 6, 2), line(A, B, C.muted)],
          dots: [dot(A, "a"), dot(B, "b"), dot(H, "중심")],
        }),
      ),
      st(
        "q의 직선",
        R`q=(1+t,2),\quad y=2`,
        "t가 모든 실수를 움직이므로 수평선 전체가 허용된다.",
        m({
          range: [-2, 6, 0, 10],
          lines: [
            circle(2, 6, 2),
            line(p(-2, 2), p(6, 2), C.green),
            line(H, Q, C.muted, { dashed: true }),
          ],
          dots: [dot(Q, "q")],
        }),
      ),
      st(
        "중심거리에서 반지름 빼기",
        R`\min|p-q|=(6-2)-2=2`,
        "중심의 수선 발 방향으로 가장 낮은 원 위 점 p=(2,4)를 고른다.",
        m({
          range: [-2, 6, 0, 10],
          lines: [
            circle(2, 6, 2),
            line(p(-2, 2), p(6, 2), C.green),
            line(P, Q, C.orange),
          ],
          dots: [dot(P, "p=(2,4)"), dot(Q, "q=(2,2)")],
        }),
      ),
    ],
    [
      check("p의 내적 조건", dp(sub(P, A), sub(P, B)), 0),
      check("최단거리", dist(P, Q), 2),
    ],
  );
}
{
  const A = O,
    B = p(5),
    CC = p(3, Math.sqrt(7), 3),
    H = p(3, Math.sqrt(7)),
    D = p(3),
    N = p(0, -3, Math.sqrt(7));
  add(
    "2023-geometry-27",
    "직선각 두 개에서 이면각 구하기",
    "AB는 α 위에 있고 sin θ₁=4/5, AC와 α의 각이 π/2−θ₁이다. 평면 ABC와 α의 각을 구한다.",
    "√7/4",
    [
      st(
        "길이의 단위 정규화",
        R`AC=5,\quad AD=5\cos\theta_1=3`,
        "각도만 주어졌으므로 길이 단위를 AC=5로 잡아도 답은 변하지 않는다. AB를 x축, α를 z=0으로 놓는다.",
        m({
          threeD: true,
          range: [-1, 6, -1, 5],
          lines: [line(A, B), line(A, CC, C.orange)],
          surfaces: [surface([p(-1, -1), p(6, -1), p(6, 5), p(-1, 5)])],
          dots: [dot(CC, "C"), dot(D, "D")],
        }),
      ),
      st(
        "공간 높이",
        R`CH=5\sin(\pi/2-\theta_1)=3,\quad CD=5\sin\theta_1=4`,
        "C에서 α에 내린 H와 AB에 내린 D를 구별한다.",
        m({
          threeD: true,
          range: [-1, 6, -1, 5],
          lines: [
            line(A, CC),
            line(CC, H, C.red),
            line(CC, D, C.orange),
            line(H, D, C.green),
          ],
          dots: [dot(H, "H"), dot(D, "D"), dot(CC, "C")],
        }),
      ),
      st(
        "단면의 밑변",
        R`DH=\sqrt{CD^2-CH^2}=\sqrt7`,
        "AB에 수직인 단면 삼각형 CDH에서 평면각이 ∠CDH이다.",
        m({
          threeD: true,
          range: [-1, 6, -1, 5],
          lines: [poly([CC, D, H])],
          surfaces: [surface([CC, D, H], C.green)],
          dots: [dot(CC, "C"), dot(D, "D"), dot(H, "H")],
        }),
      ),
      st(
        "이면각의 코사인",
        R`\cos\theta_2=DH/CD=\sqrt7/4`,
        "평면 법선의 내적으로도 같은 값을 확인할 수 있다.",
        m({
          threeD: true,
          range: [-1, 6, -1, 5],
          lines: [line(D, CC), line(D, H, C.green)],
          surfaces: [surface([A, B, CC]), surface([A, B, H], C.green)],
          dots: [dot(D, "θ₂")],
        }),
      ),
    ],
    [
      check("AC", norm(CC), 5),
      check("sin θ₁", norm(sub(CC, D)) / 5, 0.8),
      check("평면각 코사인", Math.abs(N[2]) / norm(N), Math.sqrt(7) / 4),
    ],
  );
}
{
  const a = 9 / 8,
    b = 1.5,
    c = 15 / 8,
    A = p(0, 2.5),
    F = p(c),
    G = p(-c),
    P = p(51 / 40, 0.8),
    Q = p(-51 / 40, 0.8),
    M = p(0, 0.8),
    H = p(P[0]);
  add(
    "2023-geometry-28",
    "닮음과 점근선의 비",
    "AF가 쌍곡선의 점근선과 평행하고 AP:PP′=5:6, PF=1인 대칭 배치를 사용한다.",
    "9/4",
    [
      st(
        "5:3:4 직각삼각형",
        R`AP:MP=5:3\Rightarrow AM:MP=4:3`,
        "P와 P′는 y축 대칭이므로 M은 PP′의 중점이다.",
        m({
          range: [-4, 4, -2, 4],
          lines: [poly([A, F, G]), line(P, Q, C.orange), line(A, M, C.green)],
          dots: [dot(A, "A"), dot(P, "P"), dot(Q, "P′"), dot(M, "M")],
        }),
      ),
      st(
        "반축의 공통 비율",
        R`a=3u,\quad b=4u,\quad c=5u\quad(u>0)`,
        "AF의 기울기 절댓값 4/3이 점근선의 기울기이다.",
        m({
          range: [-4, 4, -2, 4],
          lines: [hyper(a, b), hyper(a, b, -1), line(A, F, C.orange)],
          dots: [dot(F, "F"), dot(G, "F′")],
        }),
      ),
      st(
        "PF=1로 P 좌표",
        R`P=(5u-3/5,4/5)`,
        "PF 방향 역시 수평:수직:길이가 3:4:5이다.",
        m({
          range: [-4, 4, -2, 4],
          lines: [hyper(a, b), poly([P, H, F])],
          dots: [dot(P, "P"), dot(H, "H"), dot(F, "F")],
        }),
      ),
      st(
        "쌍곡선에 대입",
        R`\frac{(5u-3/5)^2}{9u^2}-\frac{(4/5)^2}{16u^2}=1\Rightarrow16u^2-6u=0`,
        "u>0이므로 0인 해를 제외하여 u=3/8을 얻는다.",
        m({
          range: [-4, 4, -2, 4],
          lines: [hyper(a, b), hyper(a, b, -1)],
          dots: [dot(P, "(51/40,4/5)"), dot(F, "(15/8,0)")],
        }),
      ),
      st(
        "주축의 길이",
        R`2a=6u=9/4`,
        "두 꼭짓점을 연결한 주축을 표시한다.",
        m({
          range: [-4, 4, -2, 4],
          lines: [hyper(a, b), hyper(a, b, -1), line(p(-a), p(a), C.orange)],
          dots: [dot(p(-a), "−9/8"), dot(p(a), "9/8")],
        }),
      ),
    ],
    [
      check("PF", dist(P, F), 1),
      check("AP/PP′", dist(A, P) / dist(P, Q), 5 / 6),
      check("쌍곡선 식", P[0] ** 2 / (a * a) - P[1] ** 2 / (b * b), 1),
      check("주축", 2 * a, 9 / 4),
    ],
  );
}
{
  const A = p(0, Math.sqrt(3)),
    B = p(-1),
    CC = p(3),
    D = p(2, Math.sqrt(3)),
    P = p(-1.5, -Math.sqrt(3) / 2),
    Q = p(0, -Math.sqrt(3)),
    H = mid(A, CC);
  const angle = (a, b) => Math.acos(dp(a, b) / (norm(a) * norm(b)));
  add(
    "2023-geometry-29",
    "벡터 조건과 각의 이등분",
    "AB=CD=AD=2인 사다리꼴과 세 조건으로 P,Q를 정하고 CP·DQ를 구한다.",
    "12",
    [
      st(
        "사다리꼴의 실제 좌표",
        R`A=(0,\sqrt3),\ B=(-1,0),\ C=(3,0),\ D=(2,\sqrt3)`,
        "두 밑각 60°와 변 길이 2를 모두 만족하는 좌표를 놓는다.",
        m({
          range: [-3, 5, -3, 4],
          lines: [poly([A, B, CC, D])],
          dots: [dot(A, "A"), dot(B, "B"), dot(CC, "C"), dot(D, "D")],
        }),
      ),
      st(
        "첫 벡터식으로 P",
        R`AC=2(AD+BP)\Rightarrow BP=AB/2\Rightarrow P=(-3/2,-\sqrt3/2)`,
        "P는 AB를 B 쪽으로 1만큼 연장한 점이다.",
        m({
          range: [-3, 5, -3, 4],
          lines: [poly([A, B, CC, D], C.muted), line(A, P, C.orange)],
          dots: [dot(P, "P"), dot(B, "B"), dot(A, "A")],
        }),
      ),
      st(
        "내적 조건의 직선",
        R`AC\cdot PQ=6\Rightarrow y_Q=\sqrt3x_Q-\sqrt3`,
        "Q의 자취는 AC의 수직이등분선이며 H는 AC의 중점이다.",
        m({
          range: [-3, 5, -3, 4],
          lines: [
            poly([A, B, CC, D], C.muted),
            line(A, CC),
            curve((x) => Math.sqrt(3) * (x - 1), -0.5, 3, C.green),
          ],
          dots: [dot(H, "H"), dot(Q, "Q")],
        }),
      ),
      st(
        "각 조건으로 하나 선택",
        R`2\angle BQA=\angle PBQ\Rightarrow AB=BQ=2`,
        "직선과 중심 B 반지름 2인 원의 교점은 (0,−√3)과 (1,0)이다. 두 번째 점은 ∠PBQ=2π/3이므로 예각 조건에서 제외한다.",
        m({
          range: [-3, 5, -3, 4],
          lines: [
            circle(-1, 0, 2, C.muted),
            curve((x) => Math.sqrt(3) * (x - 1), -0.5, 3, C.green),
            poly([A, B, Q]),
            line(B, P, C.orange),
          ],
          dots: [
            dot(Q, "Q=(0,−√3)"),
            dot(p(1), "다른 교점: 각 조건 불만족", C.muted, { open: true }),
          ],
        }),
      ),
      st(
        "내적 계산",
        R`CP=(-9/2,-\sqrt3/2),\ DQ=(-2,-2\sqrt3),\quad CP\cdot DQ=9+3=12`,
        "최종 두 벡터를 각각의 시작점에서 그려 방향까지 확인한다.",
        m({
          range: [-3, 5, -3, 4],
          lines: [line(CC, P, C.orange), line(D, Q, C.green)],
          dots: [dot(CC, "C"), dot(P, "P"), dot(D, "D"), dot(Q, "Q")],
        }),
      ),
    ],
    [
      check(
        "첫 벡터 조건",
        norm(sub(sub(CC, A), mul(addv(sub(D, A), sub(P, B)), 2))),
        0,
      ),
      check("두 번째 내적", dp(sub(CC, A), sub(Q, P)), 6),
      check(
        "각 조건",
        2 * angle(sub(B, Q), sub(A, Q)),
        angle(sub(P, B), sub(Q, B)),
      ),
      check("제외 교점의 원", dist(p(1), B), 2),
      check(
        "제외 교점의 각",
        angle(sub(P, B), sub(p(1), B)),
        (2 * Math.PI) / 3,
      ),
      check("요구 내적", dp(sub(P, CC), sub(Q, D)), 12),
    ],
  );
}
{
  const A = p(0, 0, 6 * Math.SQRT2),
    B = p(6),
    CC = p(-3, 3 * Math.sqrt(3)),
    D = p(-3, -3 * Math.sqrt(3)),
    P = addv(mul(A, 2 / 3), mul(B, 1 / 3)),
    Q = addv(mul(A, 2 / 3), mul(CC, 1 / 3)),
    RR = addv(mul(A, 2 / 3), mul(D, 1 / 3)),
    qp = project(Q, P, P),
    rp = project(RR, P, P),
    edges = [poly([B, CC, D]), line(A, B), line(A, CC), line(A, D)];
  add(
    "2023-geometry-30",
    "정사면체와 구의 두 번째 교점",
    "BCD의 외심을 중심으로 하는 반지름 6인 구와 AB,AC,AD의 두 번째 교점 P,Q,R을 구한 뒤 P의 접평면에 투영한다.",
    "24",
    [
      st(
        "정사면체의 높이",
        R`OB=6,\quad AB=6\sqrt3,\quad AO=6\sqrt2`,
        "밑면 외심을 원점으로 놓고 A를 z축 위에 놓는다.",
        m({
          threeD: true,
          range: [-7, 7, -7, 7],
          lines: [...edges, line(O, A, C.orange)],
          dots: [dot(O, "O"), dot(A, "A"), dot(B, "B")],
        }),
      ),
      st(
        "선분과 구의 교점",
        R`X=A+t(B-A),\quad|X|^2=36\Rightarrow t=1,1/3`,
        "t=1은 B이며 두 번째 교점 P는 A에서 1/3 지점이다. Q,R도 같은 비율이다.",
        m({
          threeD: true,
          range: [-7, 7, -7, 7],
          lines: [...edges, poly([P, Q, RR], C.orange)],
          dots: [dot(P, "P"), dot(Q, "Q"), dot(RR, "R")],
        }),
      ),
      st(
        "작은 정삼각형",
        R`PQ=2\sqrt3,\quad[PQR]=3\sqrt3`,
        "PQR은 밑면 BCD와 평행하고 길이 비가 1/3이다.",
        m({
          threeD: true,
          range: [-7, 7, -7, 7],
          lines: [poly([P, Q, RR]), poly([B, CC, D], C.muted)],
          surfaces: [surface([P, Q, RR])],
          dots: [dot(P, "P"), dot(Q, "Q"), dot(RR, "R")],
        }),
      ),
      st(
        "접평면의 법선",
        R`\vec n_\alpha=OP,\quad\cos\theta=\frac{4\sqrt2}{6}=\frac{2\sqrt2}{3}`,
        "구의 접평면은 접점의 반지름 OP와 수직이다. PQR의 법선은 z축이다.",
        m({
          threeD: true,
          range: [-7, 7, -7, 7],
          lines: [line(O, P, C.orange), line(P, addv(P, p(0, 0, 3)), C.green)],
          surfaces: [surface([P, Q, RR]), surface([P, qp, rp], C.orange)],
          dots: [dot(P, "접점 P")],
        }),
      ),
      st(
        "실제 투영 삼각형",
        R`k=3\sqrt3\cdot\frac{2\sqrt2}{3}=2\sqrt6`,
        "P는 고정하고 Q와 R을 접평면에 수직 투영한다.",
        m({
          threeD: true,
          range: [-7, 7, -7, 7],
          lines: [
            poly([P, Q, RR], C.muted),
            poly([P, qp, rp], C.orange),
            line(Q, qp, C.green, { dashed: true }),
            line(RR, rp, C.green, { dashed: true }),
          ],
          surfaces: [surface([P, qp, rp], C.orange)],
        }),
      ),
      st(
        "넓이의 제곱",
        R`k^2=(2\sqrt6)^2=24`,
        "요구한 것은 투영 넓이 자체가 아니라 그 제곱이다.",
        m({
          threeD: true,
          range: [-7, 7, -7, 7],
          lines: [poly([P, qp, rp], C.orange)],
          surfaces: [surface([P, qp, rp], C.orange)],
          metrics: [{ label: "k²", value: "24" }],
        }),
      ),
    ],
    [
      check("P의 구면", norm(P), 6),
      check("정삼각형 변", dist(P, Q), 2 * Math.sqrt(3)),
      check(
        "투영 넓이",
        norm(cross(sub(qp, P), sub(rp, P))) / 2,
        2 * Math.sqrt(6),
      ),
      check("넓이 제곱", 24, 24),
    ],
  );
}
save();

// 2024.
{
  const A = p(-1, -2, 6),
    B = p(9, 2, 8),
    M = p(4, 0, 7);
  add(
    "2024-geometry-23",
    "중점의 좌표로 미지수 복원",
    "A(a,−2,6), B(9,2,b)의 중점이 (4,0,7)이다.",
    "7",
    [
      st(
        "중점의 평균",
        R`M=(A+B)/2`,
        "세 좌표 각각의 산술평균을 사용한다.",
        m({
          threeD: true,
          range: [-3, 11, -4, 5],
          lines: [line(A, B)],
          dots: [dot(A, "A"), dot(B, "B"), dot(M, "M")],
        }),
      ),
      st(
        "x,z좌표의 방정식",
        R`(a+9)/2=4,\quad(6+b)/2=7`,
        "y좌표 평균은 이미 0이다.",
        m({
          threeD: true,
          range: [-3, 11, -4, 5],
          lines: [line(A, M, C.orange), line(M, B, C.green)],
          dots: [dot(A, "a=−1"), dot(B, "b=8"), dot(M, "(4,0,7)")],
        }),
      ),
      st(
        "합 계산",
        R`a+b=-1+8=7`,
        "실제 좌표로 AM=MB임을 함께 확인한다.",
        m({
          threeD: true,
          range: [-3, 11, -4, 5],
          lines: [line(A, B), line(M, p(4), C.muted, { dashed: true })],
          dots: [dot(M, "중점")],
        }),
      ),
    ],
    [check("중점 오차", norm(sub(mid(A, B), M)), 0), check("합", -1 + 8, 7)],
  );
}
{
  const P = p(Math.sqrt(3), -2),
    s = Math.sqrt(3) / 3;
  add(
    "2024-geometry-24",
    "타원 위의 점에서 접선",
    "x²/a²+y²/6=1 위의 (√3,−2)에서 접선 기울기를 구한다.",
    "√3/3",
    [
      st(
        "먼저 a² 결정",
        R`3/a^2+4/6=1\Rightarrow a^2=9`,
        "점의 좌표를 타원식에 대입하면 장반축이 3임을 알 수 있다.",
        m({
          range: [-4, 4, -4, 4],
          lines: [ellipse(3, Math.sqrt(6))],
          dots: [dot(P, "(√3,−2)")],
        }),
      ),
      st(
        "접선식",
        R`\frac{\sqrt3}{9}x-\frac{2}{6}y=1`,
        "타원의 접선식 x₀x/a²+y₀y/b²=1을 사용한다.",
        m({
          range: [-4, 4, -4, 4],
          lines: [
            ellipse(3, Math.sqrt(6)),
            curve((x) => s * x - 3, -2, 4, C.orange),
          ],
          dots: [dot(P, "접점")],
        }),
      ),
      st(
        "기울기 읽기",
        R`y=\frac{\sqrt3}{3}x-3`,
        "정리한 직선의 x계수가 기울기이다.",
        m({
          range: [-4, 4, -4, 4],
          lines: [
            ellipse(3, Math.sqrt(6)),
            curve((x) => s * x - 3, -2, 4, C.orange),
            line(p(0, -3), p(Math.sqrt(3), -3), C.green),
            line(p(Math.sqrt(3), -3), P, C.red),
          ],
          dots: [dot(P, "Δy/Δx=1/√3")],
        }),
      ),
    ],
    [
      check("원문 타원식", 3 / 9 + 4 / 6, 1),
      check("접점의 직선", s * P[0] - 3, P[1]),
    ],
  );
}
{
  const a = p(Math.sqrt(11)),
    b = p(9 / Math.sqrt(11), Math.sqrt(18 / 11)),
    v = sub(a, b),
    w = sub(mul(a, 2), b);
  add(
    "2024-geometry-25",
    "벡터 길이에서 내적 복원",
    "|a|=√11, |b|=3, |2a−b|=√17로부터 |a−b|를 구한다.",
    "√2",
    [
      st(
        "주어진 길이",
        R`|a|^2=11,\quad|b|^2=9,\quad|2a-b|^2=17`,
        "회전은 길이에 영향을 주지 않으므로 a를 x축 방향으로 놓는다.",
        m({
          range: [-1, 6, -3, 3],
          lines: [line(O, a), line(O, b, C.green), line(O, w, C.orange)],
          dots: [dot(a, "a"), dot(b, "b"), dot(w, "2a−b")],
        }),
      ),
      st(
        "내적항 추출",
        R`17=4\cdot11+9-4a\cdot b\Rightarrow a\cdot b=9`,
        "계수 2를 제곱한 4와 교차항의 계수 −4를 구별한다.",
        m({
          range: [-1, 6, -3, 3],
          lines: [
            line(O, a),
            line(O, b, C.green),
            line(b, p(b[0]), C.orange, { dashed: true }),
          ],
          dots: [dot(p(b[0]), "b의 정사영")],
        }),
      ),
      st(
        "차벡터의 길이",
        R`|a-b|^2=11+9-2\cdot9=2\Rightarrow|a-b|=\sqrt2`,
        "b에서 a로 향하는 벡터가 a−b이다.",
        m({
          range: [-1, 6, -3, 3],
          lines: [
            line(O, a, C.muted),
            line(O, b, C.muted),
            line(b, a, C.orange),
            line(O, v, C.green),
          ],
          dots: [dot(v, "a−b")],
        }),
      ),
    ],
    [
      check("b 길이", norm(b), 3),
      check("주어진 차벡터", dp(w, w), 17),
      check("요구 길이", norm(v), Math.SQRT2),
    ],
  );
}
{
  const h = 6 * Math.sqrt(15),
    Aa = p(-3),
    Bb = p(3),
    A = p(-3, 0, h),
    B = p(3, 0, h),
    M = p(0, 0, h),
    P = p(0, 6),
    N = cross(sub(B, A), sub(P, A)),
    ap = project(Aa, A, N),
    bp = project(Bb, A, N);
  add(
    "2024-geometry-26",
    "평행 선분의 정사영과 평면각",
    "AB와 그 정사영 A′B′의 길이가 모두 6이고 PM′=6이다. 바닥 삼각형을 ABP에 투영한 넓이가 9/2이다.",
    "24",
    [
      st(
        "길이가 보존되면 평행",
        R`AB=A'B'=6\Rightarrow AB\parallel\alpha`,
        "두 점은 α에서 같은 높이에 있다. A′B′의 중점을 M′으로 놓는다.",
        m({
          threeD: true,
          range: [-5, 5, -2, 8],
          lines: [
            line(A, B),
            line(Aa, Bb, C.green),
            line(A, Aa, C.muted),
            line(B, Bb, C.muted),
          ],
          dots: [dot(M, "M"), dot(O, "M′"), dot(P, "P")],
        }),
      ),
      st(
        "바닥 삼각형 넓이",
        R`[A'B'P]=\tfrac12\cdot6\cdot6=18`,
        "PM′는 A′B′에 수직이므로 바로 높이로 쓴다.",
        m({
          threeD: true,
          range: [-5, 5, -2, 8],
          lines: [poly([Aa, Bb, P]), line(P, O, C.orange)],
          surfaces: [surface([Aa, Bb, P])],
        }),
      ),
      st(
        "투영 비율",
        R`\cos\theta=\frac{9/2}{18}=1/4`,
        "투영하는 방향을 바꾸어도 두 평면 사이 예각의 코사인은 같다.",
        m({
          threeD: true,
          range: [-5, 5, -2, 8],
          lines: [
            poly([A, B, P]),
            poly([Aa, Bb, P], C.muted),
            poly([ap, bp, P], C.orange),
          ],
          surfaces: [surface([ap, bp, P], C.orange)],
        }),
      ),
      st(
        "수직 단면의 길이비",
        R`\cos\theta=PM'/PM=6/PM\Rightarrow PM=24`,
        "AB에 수직인 삼각형 PMM′에서 평면각을 읽는다.",
        m({
          threeD: true,
          range: [-5, 5, -2, 8],
          lines: [poly([P, M, O]), line(A, B, C.muted)],
          surfaces: [surface([P, M, O], C.green)],
          dots: [dot(P, "P"), dot(M, "PM=24"), dot(O, "M′")],
        }),
      ),
    ],
    [
      check("PM", dist(P, M), 24),
      check("투영 넓이", norm(cross(sub(bp, ap), sub(P, ap))) / 2, 4.5),
      check("평행 선분 길이", dist(A, B), 6),
    ],
  );
}
{
  const A = p(16, 8 * Math.SQRT2),
    B = p(-2, 8 * Math.SQRT2),
    F = p(2),
    CC = p(1, 2 * Math.SQRT2),
    D = p(4, -4 * Math.SQRT2),
    E = p(-2),
    Cp = p(-2, CC[1]),
    Dp = p(-2, D[1]);
  add(
    "2024-geometry-27",
    "초점선을 삼등분하는 포물선",
    "y²=8x의 A를 준선에 내린 B에서 초점을 지나는 직선의 교점 C,D가 BC=CD와 CF<DF를 만족한다.",
    "108√2",
    [
      st(
        "초점과 준선",
        R`F=(2,0),\quad\ell:x=-2`,
        "A와 B는 같은 높이에 있고 B,C,F,D가 한 직선 위에 순서대로 놓인다.",
        m({
          range: [-4, 19, -8, 14],
          lines: [
            para(2, 0, C.blue, 12),
            line(p(-2, -8), p(-2, 14), C.muted, { dashed: true }),
            line(B, D, C.green),
          ],
          dots: [
            dot(A, "A"),
            dot(B, "B"),
            dot(CC, "C"),
            dot(D, "D"),
            dot(F, "F"),
          ],
        }),
      ),
      st(
        "준선 거리의 1:2 비",
        R`CF=CC'=u,\quad DF=DD'=2u`,
        "B에서 시작하는 같은 직선 위에서 BC:BD=1:2이므로 준선까지의 수평 거리도 1:2이다.",
        m({
          range: [-4, 19, -8, 14],
          lines: [line(B, D), line(CC, Cp, C.orange), line(D, Dp, C.orange)],
          dots: [
            dot(CC, "CF=u"),
            dot(D, "DF=2u"),
            dot(Cp, "C′"),
            dot(Dp, "D′"),
          ],
        }),
      ),
      st(
        "닮음으로 u 계산",
        R`BC=CD=3u,\ BF=4u,\quad3u:u=4u:4\Rightarrow u=3`,
        "직각삼각형 BCC′와 BFE의 닮음을 사용한다.",
        m({
          range: [-4, 19, -8, 14],
          lines: [poly([B, CC, Cp]), poly([B, F, E], C.green)],
          dots: [dot(E, "E"), dot(F, "F")],
        }),
      ),
      st(
        "A와 D의 높이 차",
        R`BE=8\sqrt2,\quad BD'=12\sqrt2,\quad A_x=(8\sqrt2)^2/8=16`,
        "BF=12와 EF=4, BD=18과 DD′=6에서 두 수직 길이를 구한다.",
        m({
          range: [-4, 19, -8, 14],
          lines: [poly([B, D, Dp]), line(A, B, C.orange), line(B, E, C.green)],
          dots: [dot(A, "(16,8√2)"), dot(D, "(4,−4√2)")],
        }),
      ),
      st(
        "삼각형 넓이",
        R`[ABD]=\tfrac12\cdot18\cdot12\sqrt2=108\sqrt2`,
        "수평인 AB를 밑변으로, D에서 AB까지의 수직 거리를 높이로 쓴다.",
        m({
          range: [-4, 19, -8, 14],
          lines: [poly([A, B, D]), line(D, p(D[0], B[1]), C.orange)],
          surfaces: [surface([A, B, D])],
        }),
      ),
    ],
    [
      check("A 포물선", A[1] ** 2, 8 * A[0]),
      check("C 포물선", CC[1] ** 2, 8 * CC[0]),
      check("D 포물선", D[1] ** 2, 8 * D[0]),
      check("동일 선분", dist(B, CC), dist(CC, D)),
      check("넓이", norm(cross(sub(B, A), sub(D, A))) / 2, 108 * Math.SQRT2),
    ],
  );
}
{
  const c = 3 * Math.sqrt(3),
    F = p(c),
    G = p(-c),
    H = p(-Math.sqrt(3), 4),
    Hp = p(-Math.sqrt(3)),
    Q = p(-c, 6),
    P = p(-Math.sqrt(3), 4, Math.sqrt(62)),
    cs = 4 / Math.sqrt(78),
    sn = Math.sqrt(62 / 78),
    circ = curve(
      (t) => p(9 * Math.cos(t), 9 * cs * Math.sin(t), 9 * sn * Math.sin(t)),
      0,
      2 * Math.PI,
    );
  add(
    "2024-geometry-28",
    "공간의 원에서 타원 평면으로",
    "AB=18인 원과 타원이 서로 다른 평면에 있다. 원 위 P의 정사영 H를 중심으로 하는 반지름 4의 원이 AB에 접하고 타원 위 Q를 지난다.",
    "2√78/39",
    [
      st(
        "H의 높이와 초점거리",
        R`HH'=4,\quad\angle HFF'=\pi/6\Rightarrow FH=8,\ FH'=4\sqrt3`,
        "타원 평면을 z=0, 공통 장축을 x축으로 놓는다.",
        m({
          range: [-10, 10, -2, 10],
          lines: [
            ellipse(9, 3 * Math.sqrt(6)),
            circle(H[0], H[1], 4, C.green),
            line(F, H),
          ],
          dots: [dot(H, "H"), dot(Hp, "H′"), dot(F, "F")],
        }),
      ),
      st(
        "타원의 거리 합",
        R`FQ=FH+HQ=12,\quad F'Q=18-12=6`,
        "FH<FQ와 가까운 교점이라는 조건으로 F,H,Q의 순서를 확정한다.",
        m({
          range: [-10, 10, -2, 10],
          lines: [
            ellipse(9, 3 * Math.sqrt(6)),
            line(F, Q, C.orange),
            line(G, Q, C.green),
          ],
          dots: [dot(Q, "Q"), dot(H, "H"), dot(F, "F"), dot(G, "F′")],
        }),
      ),
      st(
        "초점 사이 길이",
        R`FF'=6\sqrt3,\quad OF=3\sqrt3,\quad OH'=\sqrt3`,
        "두 삼각형의 3:2 닮음 또는 코사인법칙으로 초점거리를 구한다.",
        m({
          range: [-10, 10, -2, 10],
          lines: [poly([F, Q, G]), poly([F, H, Hp], C.green)],
          dots: [dot(G, "F′"), dot(Hp, "H′"), dot(O, "O")],
        }),
      ),
      st(
        "원 평면에서의 수직 높이",
        R`PH'=\sqrt{OP^2-OH'^2}=\sqrt{81-3}=\sqrt{78}`,
        "P는 반지름 9인 원 위에 있다. PH′는 두 평면의 교선 AB에 수직이다.",
        m({
          threeD: true,
          range: [-10, 10, -2, 10],
          lines: [
            circ,
            ellipse(9, 3 * Math.sqrt(6), 0, 0, C.green),
            line(P, Hp, C.orange),
            line(P, H, C.red),
          ],
          dots: [dot(P, "P"), dot(H, "H"), dot(Hp, "H′")],
        }),
      ),
      st(
        "이면각의 코사인",
        R`\cos\theta=HH'/PH'=4/\sqrt{78}=2\sqrt{78}/39`,
        "AB에 수직인 단면에서 PH′와 HH′가 이루는 각을 사용한다.",
        m({
          threeD: true,
          range: [-10, 10, -2, 10],
          lines: [circ, poly([P, H, Hp])],
          surfaces: [surface([P, H, Hp], C.orange)],
          dots: [dot(Hp, "θ")],
        }),
      ),
    ],
    [
      check("P의 원 반지름", norm(P), 9),
      check("H의 접원 반지름", dist(H, Q), 4),
      check("Q 타원식", Q[0] ** 2 / 81 + Q[1] ** 2 / 54, 1),
      check("초점 합", dist(Q, F) + dist(Q, G), 18),
      check("평면각", cs, (2 * Math.sqrt(78)) / 39),
    ],
  );
}
{
  const cfg = (c) => {
    const b = Math.sqrt(c * c - 9),
      x = 33 / c,
      y = Math.sqrt(196 - (x + c) ** 2),
      P = p(x, y),
      F = p(c),
      G = p(-c),
      u = mul(sub(P, G), 1 / 14),
      r = (c * c - 9) / (3 + c * u[0]),
      Q = addv(G, mul(u, r));
    return { c, b, P, F, G, Q };
  };
  const one = cfg(7),
    two = cfg(4),
    picture = (z) =>
      m({
        range: [-10, 12, -4, 11],
        lines: [
          hyper(3, z.b),
          hyper(3, z.b, -1),
          poly([z.P, z.Q, z.F]),
          line(z.G, z.P, C.muted),
        ],
        dots: [dot(z.P, "P"), dot(z.Q, "Q"), dot(z.F, "F"), dot(z.G, "F′")],
      });
  add(
    "2024-geometry-29",
    "이등변 조건의 두 경우",
    "주축 6인 쌍곡선에서 P는 제1사분면, Q는 PF′ 위이고 삼각형 PQF의 둘레가 28이다. 이등변 PF′F가 가능한 모든 c를 구한다.",
    "11",
    [
      st(
        "쌍곡선의 두 거리 차",
        R`PF'-PF=6,\quad QF-QF'=6`,
        "P는 오른쪽, 같은 초점선의 다른 교점 Q는 왼쪽 가지이다.",
        picture(one),
      ),
      st(
        "둘레에서 Q 소거",
        R`28=PF+PQ+QF=PF+PF'+6\Rightarrow PF+PF'=22`,
        "Q가 F′와 P 사이에 있으므로 PQ+QF′=PF′이다.",
        m({
          ...picture(one),
          lines: [line(one.P, one.F, C.orange), line(one.P, one.G, C.green)],
          dots: [dot(one.P, "P"), dot(one.F, "PF=8"), dot(one.G, "PF′=14")],
        }),
      ),
      st(
        "각 초점거리 결정",
        R`PF'=14,\quad PF=8`,
        "합 22와 차 6을 연립한다. 따라서 두 초점거리끼리는 같을 수 없다.",
        m({
          ...picture(two),
          lines: [line(two.P, two.F, C.orange), line(two.P, two.G, C.green)],
          dots: [dot(two.P, "P"), dot(two.F, "8"), dot(two.G, "14")],
        }),
      ),
      st(
        "첫 이등변 경우",
        R`FF'=PF'=14\Rightarrow c=7`,
        "밑변 FF′가 긴 초점거리 PF′와 같아지는 경우이다.",
        picture(one),
      ),
      st(
        "둘째 이등변 경우",
        R`FF'=PF=8\Rightarrow c=4`,
        "밑변 FF′가 짧은 초점거리 PF와 같아지는 경우도 실제 제1사분면 점을 만든다.",
        picture(two),
      ),
      st(
        "가능한 값의 합",
        R`c=7,4>3,\quad\sum c=11`,
        "두 경우 모두 b²=c²−9>0이고 P의 두 좌표가 양수이며 실제 둘레도 28이다. 파란색은 c=4, 주황색은 c=7의 배치이다.",
        m({
          ...picture(two),
          lines: [
            ...picture(two).lines,
            hyper(3, one.b, 1, C.orange),
            hyper(3, one.b, -1, C.orange),
            line(one.P, one.F, C.orange),
            line(one.P, one.G, C.orange),
          ],
          dots: [
            ...picture(two).dots,
            dot(one.P, "P (c=7)", C.orange),
            dot(one.F, "F (c=7)", C.orange),
            dot(one.G, "F′ (c=7)", C.orange),
          ],
          metrics: [{ label: "허용 c", value: "4, 7" }],
        }),
      ),
    ],
    [
      ...["one", "two"].flatMap((name, i) => {
        const z = i ? two : one;
        return [
          check(name + " 초점 차", dist(z.P, z.G) - dist(z.P, z.F), 6),
          check(
            name + " 둘레",
            dist(z.P, z.Q) + dist(z.Q, z.F) + dist(z.F, z.P),
            28,
          ),
          check(
            name + " 쌍곡선",
            z.Q[0] ** 2 / 9 - z.Q[1] ** 2 / (z.b * z.b),
            1,
          ),
        ];
      }),
      check("c의 합", 7 + 4, 11),
    ],
  );
}
{
  const A = O,
    B = p(4),
    CC = p(2, 2 * Math.sqrt(3)),
    D = mul(B, 0.25),
    E = addv(mul(B, 0.75), mul(CC, 0.25)),
    F = mul(CC, 0.75),
    u = p(0, 1),
    P = addv(D, u),
    Q = addv(E, u),
    RR = addv(F, u),
    X = mul(u, -3),
    S = norm(cross(sub(Q, P), sub(RR, P))) / 2;
  add(
    "2024-geometry-30",
    "세 단위벡터가 정렬되는 극값",
    "변 4인 정삼각형의 세 1:3 내분점 D,E,F를 중심으로 반지름 1인 원 위에 P,Q,R이 있다. AX=PB+QC+RA의 길이가 최대인 경우를 구한다.",
    "147",
    [
      st(
        "세 내분점과 원",
        R`D=B/4,\ E=3B/4+C/4,\ F=3C/4`,
        "A를 원점으로 놓는다. 각 원의 반지름은 정확히 1이다.",
        m({
          range: [-2, 6, -4, 6],
          lines: [
            poly([A, B, CC], C.muted),
            circle(D[0], D[1], 1),
            circle(E[0], E[1], 1, C.green),
            circle(F[0], F[1], 1, C.orange),
          ],
          dots: [dot(D, "D"), dot(E, "E"), dot(F, "F")],
        }),
      ),
      st(
        "고정 벡터가 소거",
        R`DB+EC+FA=0,\quad AX=-(DP+EQ+FR)`,
        "세 내분점의 정의에 의해 고정된 세 벡터의 합이 0이다.",
        m({
          range: [-2, 6, -4, 6],
          lines: [line(D, P), line(E, Q, C.green), line(F, RR, C.orange)],
          dots: [dot(P, "P"), dot(Q, "Q"), dot(RR, "R")],
        }),
      ),
      st(
        "삼각부등식의 등호",
        R`|AX|\le|DP|+|EQ|+|FR|=3`,
        "세 단위벡터가 모두 같은 방향일 때만 최대값 3이다. 그림은 가능한 공통 방향 중 위쪽 방향을 선택했다.",
        m({
          range: [-2, 6, -4, 6],
          lines: [
            line(D, P),
            line(E, Q, C.green),
            line(F, RR, C.orange),
            line(A, X, C.red),
          ],
          dots: [dot(X, "X"), dot(P, "P"), dot(Q, "Q"), dot(RR, "R")],
        }),
      ),
      st(
        "삼각형 전체가 평행이동",
        R`P=D+u,\ Q=E+u,\ R=F+u,\quad|u|=1`,
        "어느 공통 방향을 택해도 PQR은 DEF의 평행이동이므로 넓이는 변하지 않는다.",
        m({
          range: [-2, 6, -4, 6],
          lines: [poly([D, E, F], C.muted), poly([P, Q, RR])],
          surfaces: [surface([P, Q, RR])],
        }),
      ),
      st(
        "작은 정삼각형 넓이",
        R`DE^2=3^2+1^2-2\cdot3\cdot1\cos(\pi/3)=7`,
        "DEF는 회전 대칭으로 정삼각형이며 한 변이 √7이다.",
        m({
          range: [-2, 6, -4, 6],
          lines: [poly([D, E, F]), poly([D, B, E], C.orange)],
          surfaces: [surface([D, E, F])],
          dots: [dot(D, "D"), dot(E, "E"), dot(F, "F")],
        }),
      ),
      st(
        "요구한 제곱값",
        R`S=7\sqrt3/4,\quad16S^2=147`,
        "실제 좌표의 외적으로 구한 넓이와 일치한다.",
        m({
          range: [-2, 6, -4, 6],
          lines: [poly([P, Q, RR])],
          surfaces: [surface([P, Q, RR], C.green)],
          metrics: [{ label: "16S²", value: "147" }],
        }),
      ),
    ],
    [
      check("세 원 반지름", dist(P, D) + dist(Q, E) + dist(RR, F), 3),
      check(
        "AX 벡터",
        norm(sub(X, addv(addv(sub(B, P), sub(CC, Q)), sub(A, RR)))),
        0,
      ),
      check("DE²", dist(D, E) ** 2, 7),
      check("16S²", 16 * S * S, 147),
    ],
  );
}
save();

// 2025.
{
  const a = p(3, 3),
    b = p(1, 2),
    bb = mul(b, 3),
    S = p(6, 9);
  add(
    "2025-geometry-23",
    "벡터식에서 한 성분 찾기",
    "a=(k,3), b=(1,2), a+3b=(6,9)에서 k를 구한다.",
    "3",
    [
      st(
        "알려진 벡터의 세 배",
        R`3b=(3,6)`,
        "b의 방향은 그대로 두고 길이를 세 배로 늘린다.",
        m({
          range: [-1, 8, -1, 11],
          lines: [line(O, b, C.green), line(O, bb, C.orange)],
          dots: [dot(b, "b"), dot(bb, "3b")],
        }),
      ),
      st(
        "합벡터에서 빼기",
        R`a=(6,9)-(3,6)=(3,3)`,
        "3b의 끝점에서 목표 합벡터까지의 차가 a이다.",
        m({
          range: [-1, 8, -1, 11],
          lines: [
            line(O, bb, C.green),
            line(bb, S, C.orange),
            line(O, S, C.muted),
          ],
          dots: [dot(S, "(6,9)")],
        }),
      ),
      st(
        "첫 성분 비교",
        R`k+3=6\Rightarrow k=3`,
        "둘째 성분도 3+6=9로 일치한다.",
        m({
          range: [-1, 8, -1, 11],
          lines: [line(O, a), line(a, S, C.green)],
          dots: [dot(a, "a=(3,3)"), dot(S, "a+3b")],
        }),
      ),
    ],
    [check("합벡터 오차", norm(sub(addv(a, bb), S)), 0), check("k", a[0], 3)],
  );
}
{
  const V = p(1),
    F = p(3),
    P = p(3, 4),
    H = p(-1, 4),
    cv = curve((y) => p(1 + (y * y) / 8, y), -6, 6);
  add(
    "2025-geometry-24",
    "꼭짓점이 이동한 포물선",
    "꼭짓점 (1,0), 준선 x=−1인 포물선 위의 (3,a)에서 양수 a를 구한다.",
    "4",
    [
      st(
        "꼭짓점에서 준선까지",
        R`p=1-(-1)=2,\quad F=(3,0)`,
        "꼭짓점과 준선 사이 거리 2가 초점거리 p이다.",
        m({
          range: [-3, 7, -6, 6],
          lines: [
            line(p(-1, -6), p(-1, 6), C.muted, { dashed: true }),
            line(V, F, C.orange),
          ],
          dots: [dot(V, "꼭짓점"), dot(F, "F")],
        }),
      ),
      st(
        "평행이동된 표준형",
        R`y^2=8(x-1)`,
        "원점 꼭짓점의 포물선을 x방향으로 1만큼 옮긴다.",
        m({ range: [-3, 7, -6, 6], lines: [cv], dots: [dot(P, "(3,a)")] }),
      ),
      st(
        "양수 조건",
        R`a^2=8(3-1)=16,\quad a>0\Rightarrow a=4`,
        "아래쪽 교점도 있지만 양수 조건이 위쪽 점을 선택한다.",
        m({
          range: [-3, 7, -6, 6],
          lines: [cv, line(P, F), line(P, H, C.orange)],
          dots: [
            dot(P, "a=4"),
            dot(p(3, -4), "제외: a<0", C.muted, { open: true }),
          ],
        }),
      ),
    ],
    [
      check("초점과 준선 거리", dist(P, F), dist(P, H)),
      check("포물선식", P[1] ** 2, 8 * (P[0] - 1)),
    ],
  );
}
{
  const A = p(6, 3, 6),
    B = p(-4, -2, 4),
    I = mul(addv(mul(A, 2), mul(B, 3)), 0.2),
    E = sub(mul(B, 3), mul(A, 2));
  add(
    "2025-geometry-25",
    "내분점은 축 위, 외분점은 평면 위",
    "A(a,b,6), B(−4,−2,c)를 같은 비 3:2로 내분·외분한 두 점의 위치 조건을 함께 사용한다.",
    "13",
    [
      st(
        "내분점의 x,y좌표",
        R`I=(2A+3B)/5,\quad2a-12=0,\quad2b-6=0`,
        "z축 위라는 조건은 x와 y좌표가 0이라는 뜻이다.",
        m({
          threeD: true,
          range: [-26, 8, -14, 5],
          lines: [line(A, B)],
          dots: [dot(A, "A"), dot(B, "B"), dot(I, "z축 위 I")],
        }),
      ),
      st(
        "외분점의 z좌표",
        R`E=3B-2A,\quad3c-12=0`,
        "xy평면 위라는 조건은 z좌표가 0이라는 뜻이다.",
        m({
          threeD: true,
          range: [-26, 8, -14, 5],
          lines: [line(A, E), line(O, I, C.orange)],
          dots: [dot(I, "I"), dot(E, "xy평면 위 E")],
        }),
      ),
      st(
        "세 상수의 합",
        R`a=6,\ b=3,\ c=4\Rightarrow a+b+c=13`,
        "내분점 (0,0,24/5)와 외분점 (−24,−12,0)을 직접 확인한다.",
        m({
          threeD: true,
          range: [-26, 8, -14, 5],
          lines: [line(A, B), line(B, E, C.orange)],
          dots: [
            dot(A, "(6,3,6)"),
            dot(B, "(−4,−2,4)"),
            dot(I, "(0,0,24/5)"),
            dot(E, "(−24,−12,0)"),
          ],
        }),
      ),
    ],
    [
      check("내분점 축 조건", I[0] ** 2 + I[1] ** 2, 0),
      check("외분점 평면 조건", E[2], 0),
      check("합", 6 + 3 + 4, 13),
    ],
  );
}
{
  const points = (n) => {
    const x = 1 / n;
    return {
      P: p(x, Math.sqrt(1 - (x * x) / 2)),
      Q: p(x, Math.sqrt(2 * (1 - 2 * x * x))),
      alpha: 2 * n,
      beta: n / 2,
    };
  };
  const lo = points(4),
    hi = points(10);
  const tangent = (X, a2, b2, xmin, xmax, color) =>
    curve((x) => (b2 * (1 - (X[0] * x) / a2)) / X[1], xmin, xmax, color);
  add(
    "2025-geometry-26",
    "타원 접선의 절편을 n으로 표현",
    "x=1/n의 제1사분면 교점에서 두 타원 접선의 x절편 차가 6 이상 15 이하인 자연수 n을 센다.",
    "7",
    [
      st(
        "두 타원과 같은 x좌표",
        R`C_1:x^2/2+y^2=1,\quad C_2:2x^2+y^2/2=1`,
        "n≥2이면 두 교점의 y좌표가 모두 양수라 접선 절편식이 유효하다.",
        m({
          range: [-2, 2, -2, 2],
          lines: [
            ellipse(Math.SQRT2, 1),
            ellipse(Math.SQRT1_2, Math.SQRT2, 0, 0, C.green),
            line(p(0.25, -2), p(0.25, 2), C.muted),
          ],
          dots: [dot(lo.P, "P"), dot(lo.Q, "Q")],
        }),
      ),
      st(
        "접선에서 y=0 대입",
        R`\alpha=2/(1/n)=2n,\quad\beta=(1/2)/(1/n)=n/2`,
        "접선의 x절편은 x축 분모를 접점의 x좌표로 나눈 값이다.",
        m({
          range: [-1, 9, -2, 2],
          lines: [
            tangent(lo.P, 2, 1, 0, 8, C.blue),
            tangent(lo.Q, 0.5, 2, 0, 3, C.green),
          ],
          dots: [
            dot(p(8), "α=8"),
            dot(p(2), "β=2"),
            dot(lo.P, "P"),
            dot(lo.Q, "Q"),
          ],
        }),
      ),
      st(
        "부등식의 양 끝 포함",
        R`6\le3n/2\le15\Rightarrow4\le n\le10`,
        "양쪽 부등호가 등호를 포함하므로 n=4와 n=10도 허용한다.",
        m({
          range: [-1, 21, -2, 3],
          lines: [
            tangent(hi.P, 2, 1, 0, 20, C.blue),
            tangent(hi.Q, 0.5, 2, 0, 6, C.green),
            line(p(5), p(20), C.orange),
          ],
          dots: [dot(p(20), "α=20"), dot(p(5), "β=5")],
        }),
      ),
      st(
        "자연수 세기",
        R`n=4,5,6,7,8,9,10\Rightarrow7\text{개}`,
        "각 점은 허용되는 실제 자연수 n을 나타낸다.",
        m({
          range: [2, 12, -1, 2],
          lines: [line(p(3), p(11), C.muted)],
          dots: Array.from({ length: 7 }, (_, i) =>
            dot(p(i + 4), String(i + 4)),
          ),
        }),
      ),
    ],
    [
      check("하한 절편 차", lo.alpha - lo.beta, 6),
      check("상한 절편 차", hi.alpha - hi.beta, 15),
      check("개수", 10 - 4 + 1, 7),
    ],
  );
}
{
  const previous = JSON.parse(
    readFileSync(
      new URL("../../src/data/worked-problems.json", import.meta.url),
      "utf8",
    ),
  ).find((x) => x.id === "2025-geometry-27");
  const { A, B, C: CC, D, M, Ap, H, I } = previous.scene.points;
  const U = previous.scene.circle.basisU,
    V = previous.scene.circle.basisV,
    r = Math.SQRT2,
    N = cross(sub(CC, A), sub(D, A)),
    cs = Math.abs(N[2]) / norm(N),
    circ = curve(
      (t) => addv(I, addv(mul(U, r * Math.cos(t)), mul(V, r * Math.sin(t)))),
      0,
      2 * Math.PI,
      C.orange,
      96,
    ),
    projected = path(
      circ.points.map((v) => p(v[0], v[1])),
      C.green,
    ),
    edges = [poly([A, CC, D]), line(A, B), line(B, CC), line(B, D)];
  const pointLineDistance = (P, A, B) =>
    norm(cross(sub(P, A), sub(B, A))) / dist(A, B);
  add(
    "2025-geometry-27",
    "내접원을 보조단면으로 정사영",
    "AB=6, BC=4√5이고 AMD가 정삼각형이며 BC⊥AMD이다. ACD의 내접원을 BCD에 정사영한다.",
    "π√10/4",
    [
      st(
        "입체의 수직 조건",
        R`BM=CM=2\sqrt5,\quad BC\perp AMD`,
        "기존 검증 풀이의 실제 좌표를 사용한다. BCD가 z=0인 목표 평면이다.",
        m({
          threeD: true,
          range: [-6, 6, -2, 6],
          lines: edges,
          surfaces: [surface([A, M, D]), surface([B, CC, D], C.green)],
          dots: [
            dot(A, "A"),
            dot(B, "B"),
            dot(CC, "C"),
            dot(D, "D"),
            dot(M, "M"),
          ],
        }),
      ),
      st(
        "정삼각형의 변",
        R`AM=\sqrt{6^2-(2\sqrt5)^2}=4,\quad AD=DM=4`,
        "직각삼각형 ABM에서 AM을 구한다.",
        m({
          threeD: true,
          range: [-6, 6, -2, 6],
          lines: [poly([A, B, M]), poly([A, M, D], C.orange)],
          surfaces: [surface([A, B, M])],
          dots: [dot(A, "A"), dot(M, "M")],
        }),
      ),
      st(
        "내접원의 반지름",
        R`AC=CD=6,\quad[ACD]=8\sqrt2,\quad s=8,\quad r=\sqrt2`,
        "이등변삼각형 ACD의 넓이를 반둘레로 나누어 반지름을 구한다. 중심은 무게중심이 아니라 내심 I이다.",
        m({
          threeD: true,
          range: [-6, 6, -2, 6],
          lines: [poly([A, CC, D]), circ],
          surfaces: [surface([A, CC, D])],
          dots: [dot(I, "I")],
        }),
      ),
      st(
        "공통 모서리에 수직인 단면",
        R`AH\perp CD,\quad A'H\perp CD,\quad\cos\theta=\frac{A'H}{AH}=\frac{\sqrt{10}}8`,
        "A′는 A의 바닥 정사영이고 H는 CD 위의 수선 발이다. AA′H에서 평면각을 읽는다.",
        m({
          threeD: true,
          range: [-6, 6, -2, 6],
          lines: [poly([A, Ap, H]), line(CC, D), circ],
          surfaces: [surface([A, Ap, H], C.green)],
          dots: [dot(Ap, "A′"), dot(H, "H")],
        }),
      ),
      st(
        "원 위의 모든 점을 수직 투영",
        R`(x,y,z)\mapsto(x,y,0)`,
        "카메라 방향과 무관하게 z축을 따라 투영한다. 반지름 √2인 원은 두 반축 √2, √5/4인 타원이 된다.",
        m({
          threeD: true,
          range: [-6, 6, -2, 6],
          lines: [
            circ,
            projected,
            ...circ.points
              .filter((_, i) => i % 12 === 0)
              .map((v) => line(v, p(v[0], v[1]), C.muted, { dashed: true })),
          ],
          surfaces: [surface(projected.points, C.green)],
        }),
      ),
      st(
        "정사영 넓이",
        R`S=\pi r^2\cos\theta=2\pi\cdot\frac{\sqrt{10}}8=\frac{\pi\sqrt{10}}4`,
        "원래 넓이 2π에 평면각의 코사인을 곱한다.",
        m({
          threeD: true,
          range: [-6, 6, -2, 6],
          lines: [poly([B, CC, D], C.muted), projected],
          surfaces: [surface(projected.points, C.green)],
          dots: [dot(p(I[0], I[1]), "투영 중심")],
          metrics: [{ label: "넓이", value: "π√10/4" }],
        }),
      ),
    ],
    [
      check("AB", dist(A, B), 6),
      check("내심-AC", pointLineDistance(I, A, CC), r),
      check("내심-CD", pointLineDistance(I, CC, D), r),
      check("내심-DA", pointLineDistance(I, D, A), r),
      check("평면각", cs, Math.sqrt(10) / 8),
      check("투영 넓이", Math.PI * r * r * cs, (Math.PI * Math.sqrt(10)) / 4),
    ],
  );
}
{
  const A = O,
    B = p(8),
    CC = p(8, 6),
    O0 = p(4, 3),
    K = p(4),
    D = p(2.5),
    P = p(2.5, 0, Math.sqrt(55) / 2),
    Q = p(2.5, 0, -Math.sqrt(55) / 2),
    H = p(1.6, 1.2),
    circ = curve(
      (t) => p(4 + 4 * Math.cos(t), 0, 4 * Math.sin(t)),
      0,
      2 * Math.PI,
    );
  add(
    "2025-geometry-28",
    "구의 단면 원에서 등거리 두 점",
    "직각삼각형의 두 직각변은 8과 6이고 AC가 구의 지름이다. AB를 포함하는 수직 단면 원에서 AC까지 거리 4인 두 점 사이 거리를 구한다.",
    "√55",
    [
      st(
        "구와 단면 원",
        R`AC=10,\quad O=(4,3,0),\quad R=5`,
        "A=(0,0,0), B=(8,0,0), C=(8,6,0)으로 놓는다. 단면 y=0의 원은 중심 (4,0,0), 반지름 4이다.",
        m({
          threeD: true,
          range: [-1, 10, -2, 8],
          lines: [poly([A, B, CC]), circ, line(O0, K, C.orange)],
          dots: [dot(O0, "O"), dot(K, "단면 중심")],
        }),
      ),
      st(
        "AC까지 거리 4",
        R`P=(x,0,z),\quad d(P,AC)^2=\tfrac9{25}x^2+z^2=16`,
        "AC 방향 단위벡터는 (4/5,3/5,0)이다. 정사영을 빼서 수선 길이를 쓴다.",
        m({
          threeD: true,
          range: [-1, 10, -2, 8],
          lines: [circ, line(A, CC), line(P, H, C.orange)],
          dots: [dot(P, "P"), dot(H, "H")],
        }),
      ),
      st(
        "원 방정식과 연립",
        R`(x-4)^2+z^2=16\Rightarrow16x^2-200x+400=0`,
        "z²을 소거하면 x=5/2 또는 10이다. 단면 원의 x범위는 0≤x≤8이다.",
        m({
          threeD: true,
          range: [-1, 11, -2, 8],
          lines: [circ, line(p(2.5, 0, -5), p(2.5, 0, 5), C.green)],
          dots: [
            dot(D, "x=5/2"),
            dot(p(10), "제외: x=10", C.muted, { open: true }),
          ],
        }),
      ),
      st(
        "두 높이",
        R`z^2=16-(5/2-4)^2=55/4`,
        "P와 Q는 평면 ABC를 기준으로 대칭인 위아래 두 점이다.",
        m({
          threeD: true,
          range: [-1, 10, -2, 8],
          lines: [
            circ,
            line(P, Q, C.orange),
            line(P, H, C.green),
            line(Q, H, C.green),
          ],
          dots: [dot(P, "P"), dot(Q, "Q"), dot(D, "중점 D")],
        }),
      ),
      st(
        "두 점 사이 거리",
        R`PQ=2|z|=\sqrt{55}`,
        "같은 x,y좌표에서 z좌표 차만 계산한다.",
        m({
          threeD: true,
          range: [-1, 10, -2, 8],
          lines: [circ, line(P, Q, C.red)],
          dots: [dot(P, "z=√55/2"), dot(Q, "z=−√55/2")],
        }),
      ),
    ],
    [
      check("P 구면", dist(P, O0), 5),
      check("P에서 AC 거리", dist(P, H), 4),
      check("Q에서 AC 거리", dist(Q, H), 4),
      check("PQ", dist(P, Q), Math.sqrt(55)),
    ],
  );
}
{
  const F = p(6),
    G = p(-6),
    P = p(4 / 3, (7 * Math.sqrt(5)) / 3),
    Q = p(190 / 27, (112 * Math.sqrt(5)) / 27),
    H = mid(F, Q),
    area = norm(cross(sub(F, P), sub(Q, P))) / 2;
  add(
    "2025-geometry-29",
    "닮음으로 결정되는 쌍곡선 위 점",
    "x²−y²/35=1에서 P는 제1사분면, Q는 F′P를 P 너머로 연장한 선 위에 있고 PQ=PF이다. 두 삼각형의 닮음으로 넓이를 구한다.",
    "107",
    [
      st(
        "초점거리와 변수",
        R`c=6,\quad PF=u,\quad PF'=u+2,\quad QF'=2u+2`,
        "PF′<QF′ 조건이 Q의 위치를 연장선 쪽으로 정한다.",
        m({
          range: [-8, 10, -2, 12],
          lines: [
            hyper(1, Math.sqrt(35)),
            line(G, Q, C.muted),
            line(P, F, C.orange),
          ],
          dots: [dot(F, "F"), dot(G, "F′"), dot(P, "P"), dot(Q, "Q")],
        }),
      ),
      st(
        "닮음의 대응변",
        R`\frac{2(u+1)}{12}=\frac{12}{u+2}`,
        "삼각형 QF′F와 FF′P의 대응 순서에 맞춰 두 비를 세운다.",
        m({
          range: [-8, 10, -2, 12],
          lines: [poly([Q, G, F]), poly([F, G, P], C.orange)],
          surfaces: [surface([Q, G, F]), surface([F, G, P], C.orange)],
        }),
      ),
      st(
        "양의 해 선택",
        R`(u+1)(u+2)=72\Rightarrow(u+10)(u-7)=0\Rightarrow u=7`,
        "길이는 양수이므로 −10은 제외한다. PF′=9, QF′=16이다.",
        m({
          range: [-8, 10, -2, 12],
          lines: [line(P, F, C.orange), line(P, Q, C.orange), line(G, Q)],
          dots: [dot(P, "PF=PQ=7"), dot(G, "QF′=16")],
        }),
      ),
      st(
        "이등변삼각형의 밑변과 높이",
        R`QF=28/3,\quad FH=14/3,\quad PH=7\sqrt5/3`,
        "닮음비 4/3으로 QF를 구한다. PQ=PF이므로 밑변 QF의 중점 H가 수선 발이다.",
        m({
          range: [-8, 10, -2, 12],
          lines: [poly([P, F, Q]), line(P, H, C.green)],
          dots: [dot(H, "H"), dot(P, "P")],
        }),
      ),
      st(
        "넓이와 기약분수",
        R`[PFQ]=\tfrac12\cdot\tfrac{28}3\cdot\tfrac{7\sqrt5}3=\tfrac{98\sqrt5}9,\quad p+q=107`,
        "실제 좌표의 외적으로도 같은 넓이를 확인한다.",
        m({
          range: [-8, 10, -2, 12],
          lines: [poly([P, F, Q])],
          surfaces: [surface([P, F, Q], C.green)],
          metrics: [{ label: "넓이", value: "98√5/9" }],
        }),
      ),
    ],
    [
      check("P 쌍곡선", P[0] ** 2 - P[1] ** 2 / 35, 1),
      check("PQ=PF", dist(P, Q), dist(P, F)),
      check("QF", dist(Q, F), 28 / 3),
      check("넓이", area, (98 * Math.sqrt(5)) / 9),
    ],
  );
}
{
  const A = p(-2, 4),
    B = p(-2),
    CC = p(2),
    D = p(2, 4),
    H = p(0.5, 2),
    v = sub(CC, A),
    u = unit(v),
    Pmax = mul(u, 2),
    Pmin = mul(u, -2),
    Qmax = addv(H, mul(u, 0.5)),
    Qmin = sub(H, mul(u, 0.5)),
    maximum = dp(v, sub(Qmax, A)),
    minimum = dp(v, sub(Qmin, A));
  add(
    "2025-geometry-30",
    "벡터식으로 이동한 원의 내적 극값",
    "정사각형 변은 4이고 |XB+XC|=|XB−XC|인 자취 위의 P에 대해 4PQ=PB+2PD이다. AC·AQ의 두 극값의 곱을 구한다.",
    "316",
    [
      st(
        "첫 자취는 지름 BC의 원",
        R`|2XO|=|CB|=4\Rightarrow|XO|=2`,
        "BC의 중점을 원점으로 놓으면 반지름 2인 원이 된다.",
        m({
          range: [-4, 5, -4, 6],
          lines: [poly([A, B, CC, D], C.muted), circle(0, 0, 2)],
          dots: [
            dot(A, "A"),
            dot(B, "B"),
            dot(CC, "C"),
            dot(D, "D"),
            dot(O, "O"),
          ],
        }),
      ),
      st(
        "Q의 자취로 변환",
        R`Q=(B+2D+P)/4=(1/2,2)+P/4`,
        "P의 원을 1/4로 축소하고 중심을 H=(1/2,2)로 옮긴다.",
        m({
          range: [-4, 5, -4, 6],
          lines: [
            circle(0, 0, 2),
            circle(0.5, 2, 0.5, C.green),
            line(Pmax, Qmax, C.muted, { dashed: true }),
          ],
          dots: [dot(H, "H"), dot(Pmax, "P"), dot(Qmax, "Q")],
        }),
      ),
      st(
        "고정 내적과 변동 내적",
        R`AC\cdot AQ=AC\cdot AH+AC\cdot HQ=18+AC\cdot HQ`,
        "반지름 벡터 HQ의 길이는 1/2로 고정이다.",
        m({
          range: [-4, 5, -4, 6],
          lines: [
            circle(0.5, 2, 0.5, C.green),
            line(A, CC),
            line(A, H, C.muted),
            line(H, Qmax, C.orange),
            line(H, Qmin, C.red),
          ],
          dots: [dot(Qmax, "최대"), dot(Qmin, "최소")],
        }),
      ),
      st(
        "평행·반평행에서 극값",
        R`M=18+2\sqrt2,\quad m=18-2\sqrt2`,
        "HQ가 AC와 같은 방향이면 최대, 반대 방향이면 최소이다.",
        m({
          range: [-4, 5, -4, 6],
          lines: [
            circle(0.5, 2, 0.5, C.green),
            line(A, Qmax, C.orange),
            line(A, Qmin, C.red),
          ],
          dots: [dot(Qmax, "M"), dot(Qmin, "m")],
        }),
      ),
      st(
        "곱의 차이제곱",
        R`Mm=18^2-(2\sqrt2)^2=316`,
        "극값에서의 실제 P,Q를 원래 벡터식에 대입해 검산한다.",
        m({
          range: [-4, 5, -4, 6],
          lines: [
            circle(0, 0, 2),
            circle(0.5, 2, 0.5, C.green),
            line(Pmax, Qmax, C.orange),
            line(Pmin, Qmin, C.red),
          ],
          dots: [
            dot(Pmax, "Pmax"),
            dot(Pmin, "Pmin"),
            dot(Qmax, "Qmax"),
            dot(Qmin, "Qmin"),
          ],
        }),
      ),
    ],
    [
      check(
        "최대점 벡터식",
        norm(
          sub(
            mul(sub(Qmax, Pmax), 4),
            addv(sub(B, Pmax), mul(sub(D, Pmax), 2)),
          ),
        ),
        0,
      ),
      check("M", maximum, 18 + 2 * Math.SQRT2),
      check("m", minimum, 18 - 2 * Math.SQRT2),
      check("극값 곱", maximum * minimum, 316),
    ],
  );
}
save();

// 2026.
{
  const V = p(2),
    F = p(5),
    H = p(-1),
    cv = curve((y) => p(2 + (y * y) / 12, y), -6, 6);
  add(
    "2026-geometry-24",
    "초점과 준선 사이 거리",
    "y²=12(x−2)의 초점과 준선 사이 거리를 구한다.",
    "6",
    [
      st(
        "이동한 꼭짓점",
        R`V=(2,0),\quad4p=12\Rightarrow p=3`,
        "포물선의 x방향 평행이동과 초점거리 p를 분리한다.",
        m({ range: [-3, 8, -6, 6], lines: [cv], dots: [dot(V, "꼭짓점")] }),
      ),
      st(
        "초점과 준선",
        R`F=(5,0),\quad\ell:x=-1`,
        "꼭짓점에서 오른쪽 3에 초점, 왼쪽 3에 준선이 있다.",
        m({
          range: [-3, 8, -6, 6],
          lines: [cv, line(p(-1, -6), p(-1, 6), C.muted, { dashed: true })],
          dots: [dot(F, "F"), dot(V, "V"), dot(H, "준선 위의 발")],
        }),
      ),
      st(
        "수직 거리",
        R`d(F,\ell)=5-(-1)=6`,
        "초점과 준선 사이 거리는 p가 아니라 2p이다.",
        m({
          range: [-3, 8, -6, 6],
          lines: [
            cv,
            line(F, H, C.orange),
            line(p(-1, -6), p(-1, 6), C.muted, { dashed: true }),
          ],
          dots: [dot(F, "5"), dot(H, "−1")],
        }),
      ),
    ],
    [check("초점-준선 거리", dist(F, H), 6)],
  );
}
{
  const A = p(3, -1.5, -2),
    B = p(-3, -1.5, -2),
    CC = p(-3, 1.5, 2),
    H = p(-3, 1.5, -2);
  add(
    "2026-geometry-25",
    "평면 대칭과 원점 대칭",
    "A(3,−3/2,−2)를 yz평면과 원점에 각각 대칭시킨 B,C의 거리를 구한다.",
    "5",
    [
      st(
        "yz평면 대칭",
        R`B=(-3,-3/2,-2)`,
        "yz평면 대칭은 x좌표의 부호만 바꾼다.",
        m({
          threeD: true,
          range: [-5, 5, -4, 4],
          lines: [line(A, B, C.orange)],
          dots: [dot(A, "A"), dot(B, "B")],
        }),
      ),
      st(
        "원점 대칭",
        R`C=(-3,3/2,2)`,
        "원점 대칭은 세 좌표의 부호를 모두 바꾼다.",
        m({
          threeD: true,
          range: [-5, 5, -4, 4],
          lines: [line(A, CC, C.green), line(B, CC)],
          dots: [dot(A, "A"), dot(B, "B"), dot(CC, "C")],
        }),
      ),
      st(
        "같은 x좌표에서 거리",
        R`BC=\sqrt{0^2+3^2+4^2}=5`,
        "yz방향 직각삼각형의 두 변이 3과 4이다.",
        m({
          threeD: true,
          range: [-5, 5, -4, 4],
          lines: [line(B, CC), line(B, H, C.green), line(H, CC, C.orange)],
          dots: [dot(B, "B"), dot(CC, "C"), dot(H, "직각점")],
        }),
      ),
    ],
    [check("BC", dist(B, CC), 5)],
  );
}
{
  const a = 4 / Math.sqrt(3),
    U = p(a, Math.SQRT2 * a),
    P = p(0, a / Math.SQRT2),
    F = p(0, Math.SQRT2 * a),
    G = p(0, -Math.SQRT2 * a),
    up = curve((t) => p(a * Math.sinh(t), a * Math.cosh(t)), -1.4, 1.4),
    down = curve((t) => p(a * Math.sinh(t), -a * Math.cosh(t)), -1.4, 1.4);
  add(
    "2026-geometry-26",
    "세로 쌍곡선의 접선과 초점거리 곱",
    "x²/a²−y²/a²=−1의 (a,√2a)에서 접선의 y절편 P가 PF·PF′=8을 만족한다.",
    "4√3/3",
    [
      st(
        "주축 방향 확인",
        R`y^2-x^2=a^2,\quad F=(0,\sqrt2a),\ F'=(0,-\sqrt2a)`,
        "우변의 부호 때문에 주축은 y축 방향이다.",
        m({
          range: [-6, 6, -6, 6],
          lines: [up, down],
          dots: [dot(F, "F"), dot(G, "F′"), dot(U, "(a,√2a)")],
        }),
      ),
      st(
        "접선과 y절편",
        R`ax-\sqrt2ay=-a^2\Rightarrow P=(0,a/\sqrt2)`,
        "접선은 x−√2y=−a이고 x=0을 대입하면 P를 얻는다.",
        m({
          range: [-6, 6, -6, 6],
          lines: [
            up,
            down,
            curve((x) => (x + a) / Math.SQRT2, -6, 6, C.orange),
          ],
          dots: [dot(P, "P"), dot(U, "접점")],
        }),
      ),
      st(
        "같은 축 위의 거리",
        R`PF=a/\sqrt2,\quad PF'=3a/\sqrt2`,
        "P는 원점과 위쪽 초점 사이에 있으므로 두 거리는 차와 합으로 계산한다.",
        m({
          range: [-6, 6, -6, 6],
          lines: [up, down, line(P, F, C.orange), line(P, G, C.green)],
          dots: [dot(P, "P"), dot(F, "F"), dot(G, "F′")],
        }),
      ),
      st(
        "양수 a 결정",
        R`\tfrac32a^2=8\Rightarrow a=4\sqrt3/3`,
        "a>0인 해만 선택한다.",
        m({
          range: [-6, 6, -6, 6],
          lines: [up, down, line(G, F, C.orange)],
          dots: [dot(U, "a=4√3/3")],
          metrics: [{ label: "PF × PF′", value: "8" }],
        }),
      ),
    ],
    [
      check("접점 쌍곡선", U[1] ** 2 - U[0] ** 2, a * a),
      check("거리 곱", dist(P, F) * dist(P, G), 8),
    ],
  );
}
{
  const h = Math.sqrt(21),
    A = p(-2.5),
    B = p(2.5),
    CC = p(1.5, 2, h),
    D = p(-1.5, 2, h),
    H = p(-1.5, 2),
    Hp = p(-1.5),
    top = curve(
      (t) => p(2.5 * Math.cos(t), 2.5 * Math.sin(t), h),
      0,
      2 * Math.PI,
    ),
    bottom = circle(0, 0, 2.5),
    wires = [
      bottom,
      top,
      ...[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((t) =>
        line(
          p(2.5 * Math.cos(t), 2.5 * Math.sin(t)),
          p(2.5 * Math.cos(t), 2.5 * Math.sin(t), h),
          C.muted,
        ),
      ),
    ];
  add(
    "2026-geometry-27",
    "원기둥 속 사다리꼴과 바닥 삼각형",
    "지름 5인 원기둥에서 AB는 지름, CD=3이고 AD=BC이다. ABCD 넓이가 ABH 넓이의 네 배이다.",
    "√21",
    [
      st(
        "평행한 두 현",
        R`AB=5,\quad CD=HI=3,\quad AD=BC\Rightarrow AB\parallel CD`,
        "같은 높이의 차를 빼면 바닥의 대응 현까지 거리가 같아져 등변사다리꼴이 된다.",
        m({
          threeD: true,
          range: [-4, 4, -4, 4],
          lines: [...wires, poly([A, B, CC, D])],
          dots: [dot(A, "A"), dot(B, "B"), dot(CC, "C"), dot(D, "D")],
        }),
      ),
      st(
        "바닥에서 현까지 거리",
        R`HH'=\sqrt{(5/2)^2-(3/2)^2}=2`,
        "반지름 5/2와 반현 3/2로 직각삼각형을 만든다.",
        m({
          threeD: true,
          range: [-4, 4, -4, 4],
          lines: [
            bottom,
            line(A, B),
            line(O, H, C.green),
            line(H, Hp, C.orange),
            line(O, Hp, C.muted),
          ],
          dots: [dot(H, "H"), dot(Hp, "H′"), dot(O, "원 중심")],
        }),
      ),
      st(
        "넓이 비로 사다리꼴 높이",
        R`[ABH]=5,\quad[ABCD]=\tfrac{5+3}{2}DH'=20\Rightarrow DH'=5`,
        "삼수선 정리에 의해 DH′는 사다리꼴의 두 평행변에 수직이다.",
        m({
          threeD: true,
          range: [-4, 4, -4, 4],
          lines: [poly([A, B, CC, D]), line(D, Hp, C.orange)],
          surfaces: [surface([A, B, CC, D])],
          dots: [dot(D, "D"), dot(Hp, "H′")],
        }),
      ),
      st(
        "원기둥의 수직 높이",
        R`DH=\sqrt{DH'^2-HH'^2}=\sqrt{25-4}=\sqrt{21}`,
        "사다리꼴 안의 높이 5와 원기둥의 높이를 구별한다.",
        m({
          threeD: true,
          range: [-4, 4, -4, 4],
          lines: [...wires, poly([D, H, Hp])],
          surfaces: [surface([D, H, Hp], C.orange)],
          dots: [dot(D, "D"), dot(H, "H"), dot(Hp, "H′")],
        }),
      ),
    ],
    [
      check("AD=BC", dist(A, D), dist(B, CC)),
      check("사다리꼴 높이", dist(D, Hp), 5),
      check("높이", dist(D, H), Math.sqrt(21)),
      check(
        "넓이 비",
        (norm(cross(sub(B, A), sub(D, A))) +
          norm(cross(sub(CC, B), sub(D, B)))) /
          2 /
          (norm(cross(sub(B, A), sub(H, A))) / 2),
        4,
      ),
    ],
  );
}
{
  const H = O,
    B = p(0, 4),
    CC = p(-2),
    D = p(2),
    A = p(0, 2, 2 * Math.sqrt(3)),
    G = mul(addv(A, B), 1 / 3),
    I = mul(A, 0.5),
    radius = 2 / Math.sqrt(3),
    K = p(0, 2, Math.sqrt(3)),
    normal = cross(sub(B, A), sub(CC, A)),
    circ = curve(
      (t) => addv(K, p(Math.cos(t), Math.sin(t))),
      0,
      2 * Math.PI,
      C.orange,
      96,
    ),
    projected = path(
      circ.points.map((P) => project(P, A, normal)),
      C.green,
    ),
    sphereRings = [
      curve(
        (t) => addv(G, p(radius * Math.cos(t), radius * Math.sin(t))),
        0,
        2 * Math.PI,
        C.muted,
      ),
      curve(
        (t) => addv(G, p(radius * Math.cos(t), 0, radius * Math.sin(t))),
        0,
        2 * Math.PI,
        C.muted,
      ),
    ],
    cos = Math.abs(normal[2]) / norm(normal);
  add(
    "2026-geometry-28",
    "직각 조건이 만드는 구 위의 원",
    "AB=AH=CD=4, BC=BD=2√5이고 ABH⊥BCD이다. ABH의 무게중심 G를 중심으로 ACD에 접하는 구 위에서 AP⊥GP인 점의 자취를 ABC에 투영한다.",
    "π/4",
    [
      st(
        "정삼각형 ABH",
        R`CH=DH=2,\quad BH=\sqrt{20-4}=4`,
        "삼수선 정리와 BC=BD로 H는 CD의 중점이다. AB=AH=BH=4가 된다.",
        m({
          threeD: true,
          range: [-4, 4, -2, 6],
          lines: [poly([A, B, H]), poly([B, CC, D]), line(A, CC), line(A, D)],
          dots: [
            dot(A, "A"),
            dot(B, "B"),
            dot(H, "H"),
            dot(CC, "C"),
            dot(D, "D"),
          ],
        }),
      ),
      st(
        "구의 중심과 반지름",
        R`G=(0,2,2\sqrt3/3),\quad I=A/2,\quad r_S=GI=2\sqrt3/3`,
        "ACD는 CD를 포함한다. G에서 이 평면에 내린 발 I는 AH의 중점이다.",
        m({
          threeD: true,
          range: [-4, 4, -2, 6],
          lines: [...sphereRings, line(G, I, C.orange)],
          surfaces: [surface([A, CC, D])],
          dots: [dot(G, "G"), dot(I, "접점 I")],
        }),
      ),
      st(
        "직각 조건을 평면으로",
        R`(A-P)\cdot(G-P)=0\Rightarrow(A-G)\cdot(P-G)=r_S^2`,
        "P가 구 위이므로 |P−G|²=r²이다. 따라서 구와 한 평면의 교선이 자취이다.",
        m({
          threeD: true,
          range: [-4, 4, -2, 6],
          lines: [...sphereRings, line(G, A, C.green), circ],
          dots: [dot(K, "교선 원 중심 K"), dot(G, "G")],
        }),
      ),
      st(
        "교선 원의 실제 반지름",
        R`z_P=\sqrt3,\quad K=(0,2,\sqrt3),\quad r_T=\sqrt{4/3-1/3}=1`,
        "AG가 수직 방향이므로 자취 평면은 바닥 BCD와 평행하다. 자취 원은 접점 I도 지난다.",
        m({
          threeD: true,
          range: [-4, 4, -2, 6],
          lines: [circ, line(G, K, C.orange), line(K, I, C.green)],
          surfaces: [surface(circ.points, C.orange)],
          dots: [dot(K, "K"), dot(I, "I")],
        }),
      ),
      st(
        "ABC 평면과의 각",
        R`[ABC]=8,\quad[\operatorname{proj}_{BCD}ABC]=2\Rightarrow\cos\theta=1/4`,
        "실제 좌표의 법선에서도 z성분 비율이 1/4이다.",
        m({
          threeD: true,
          range: [-4, 4, -2, 6],
          lines: [
            poly([A, B, CC]),
            poly([p(0, 2), B, CC], C.green),
            line(A, p(0, 2), C.muted, { dashed: true }),
          ],
          surfaces: [surface([A, B, CC]), surface([p(0, 2), B, CC], C.green)],
        }),
      ),
      st(
        "원의 정사영",
        R`(x,y,z)\mapsto\operatorname{proj}_{ABC}(x,y,z)`,
        "자취 원의 각 점을 ABC의 법선 방향으로 내려 실제 타원을 만든다.",
        m({
          threeD: true,
          range: [-4, 4, -2, 6],
          lines: [
            circ,
            projected,
            ...circ.points
              .filter((_, i) => i % 16 === 0)
              .map((P) =>
                line(P, project(P, A, normal), C.muted, { dashed: true }),
              ),
          ],
          surfaces: [surface(projected.points, C.green)],
        }),
      ),
      st(
        "투영 면적",
        R`S=\pi r_T^2\cos\theta=\pi/4`,
        "구의 반지름과 자취 원의 반지름 1을 구별해 계산한다.",
        m({
          threeD: true,
          range: [-4, 4, -2, 6],
          lines: [poly([A, B, CC], C.muted), projected],
          surfaces: [surface(projected.points, C.green)],
          metrics: [{ label: "정사영 넓이", value: "π/4" }],
        }),
      ),
    ],
    [
      check("AB", dist(A, B), 4),
      check("BC", dist(B, CC), 2 * Math.sqrt(5)),
      check("구의 접점", dist(G, I), radius),
      check("자취 표본의 구면", dist(circ.points[17], G), radius),
      check(
        "자취 표본 직각",
        dp(sub(A, circ.points[17]), sub(G, circ.points[17])),
        0,
      ),
      check("평면각", cos, 0.25),
      check("정사영 면적", Math.PI * cos, Math.PI / 4),
    ],
  );
}
{
  const focus = 9,
    A = p(1, 6),
    H = p(-9, 6),
    F = p(9),
    center = p(-4),
    a = 13,
    b = 6.5,
    c = (13 * Math.sqrt(3)) / 2,
    B = p(-4 + c),
    Bp = p(-4 - c),
    Hp = p(-9),
    cv = curve((y) => p((y * y) / 36, y), -10, 10);
  add(
    "2026-geometry-29",
    "포물선과 타원의 거리 정의 결합",
    "포물선의 초점 F(p,0), 제1사분면 점 A, 준선 위 발 H를 지나는 타원의 양의 초점을 B라 한다. AHB의 둘레는 p+27, 넓이는 2p+12이다.",
    "360",
    [
      st(
        "포물선의 같은 두 거리",
        R`AF=AH=p+x_A,\quad y_A^2=4px_A`,
        "A와 H는 같은 높이에 놓인다. 타원은 두 점 A,H의 수평 중점에 대해 대칭이다.",
        m({
          range: [-19, 12, -10, 10],
          lines: [
            cv,
            line(A, F),
            line(A, H, C.orange),
            line(p(-9, -10), p(-9, 10), C.muted, { dashed: true }),
          ],
          dots: [dot(A, "A"), dot(H, "H"), dot(F, "F")],
        }),
      ),
      st(
        "타원의 대칭과 장축",
        R`AB=HB',\quad AB+HB=3p-x_A`,
        "타원에서 서로 대칭인 A,H와 두 초점 B,B′를 대응시킨다. F는 오른쪽 x축 꼭짓점이다.",
        m({
          range: [-19, 12, -10, 10],
          lines: [
            ellipse(a, b, -4, 0, C.green),
            line(A, B),
            line(H, B, C.orange),
            line(H, Bp, C.muted),
          ],
          dots: [dot(B, "B"), dot(Bp, "B′"), dot(F, "F")],
        }),
      ),
      st(
        "둘레에서 p 확정",
        R`[\text{둘레}]=(3p-x_A)+(p+x_A)=4p=p+27\Rightarrow p=9`,
        "x_A가 소거되어 초점의 위치가 먼저 정해진다.",
        m({
          range: [-19, 12, -10, 10],
          lines: [ellipse(a, b, -4, 0, C.green), poly([A, H, B])],
          dots: [dot(F, "p=9")],
        }),
      ),
      st(
        "넓이와 포물선식을 연립",
        R`y_A(x_A+9)=60,\quad y_A^2=36x_A`,
        "AH는 수평이고 B는 x축 위이므로 높이는 y_A이다. 넓이는 30이다.",
        m({
          range: [-19, 12, -10, 10],
          lines: [poly([A, H, B]), line(B, p(B[0], 6), C.orange)],
          surfaces: [surface([A, H, B])],
          dots: [dot(A, "(x_A,y_A)")],
        }),
      ),
      st(
        "제1사분면의 해",
        R`x_A(x_A+9)^2=100\Rightarrow(x_A-1)(x_A^2+19x_A+100)=0`,
        "x_A>0에서 두 번째 인수는 양수이므로 x_A=1, y_A=6이다.",
        m({
          range: [-19, 12, -10, 10],
          lines: [cv, ellipse(a, b, -4, 0, C.green)],
          dots: [dot(A, "(1,6)"), dot(H, "(−9,6)"), dot(F, "(9,0)")],
        }),
      ),
      st(
        "HF의 길이 제곱",
        R`HF^2=(2p)^2+y_A^2=18^2+6^2=360`,
        "준선에서 초점까지 수평 거리는 2p이다.",
        m({
          range: [-19, 12, -10, 10],
          lines: [poly([H, Hp, F])],
          surfaces: [surface([H, Hp, F], C.orange)],
          dots: [dot(H, "H"), dot(F, "F"), dot(Hp, "H′")],
        }),
      ),
    ],
    [
      check("A 포물선", A[1] ** 2, 4 * focus * A[0]),
      check("A 타원", (A[0] + 4) ** 2 / (a * a) + A[1] ** 2 / (b * b), 1),
      check("AHB 둘레", dist(A, H) + dist(H, B) + dist(B, A), 36),
      check("AHB 넓이", norm(cross(sub(H, A), sub(B, A))) / 2, 30),
      check("HF²", dist(H, F) ** 2, 360),
    ],
  );
}
{
  const r = 5 * Math.SQRT2,
    A = p(-r),
    B = p(r),
    P = p((-24 * r) / 25, (7 * r) / 25),
    Q = p((527 * r) / 625, (-336 * r) / 625),
    Ropp = mul(P, -1),
    value = dp(sub(A, P), sub(B, Q)),
    lineCenter = mul(P, -48 / 50),
    tangent = unit(p(-P[1], P[0]));
  add(
    "2026-geometry-30",
    "원 위 내적 조건의 두 교점",
    "AB=10√2가 지름인 원에서 PB=14이고 주어진 벡터 내적 조건을 만족하는 Q≠B를 선택한다.",
    "221",
    [
      st(
        "원점과 반지름",
        R`|OA|^2=|OB|^2=|OP|^2=|OQ|^2=50`,
        "AB의 중점을 원점으로 잡는다. PB²=196에서 OP·OB를 얻는다.",
        m({
          range: [-9, 9, -9, 9],
          lines: [circle(0, 0, r), line(A, B, C.muted), line(P, B, C.orange)],
          dots: [dot(A, "A"), dot(B, "B"), dot(P, "P")],
        }),
      ),
      st(
        "PB의 길이를 내적으로",
        R`196=100-2OP\cdot OB\Rightarrow OP\cdot OB=-48`,
        "같은 반지름 위의 두 위치벡터 차의 제곱을 전개한다.",
        m({
          range: [-9, 9, -9, 9],
          lines: [circle(0, 0, r), line(O, P), line(O, B, C.green)],
          dots: [dot(P, "P"), dot(B, "B"), dot(O, "O")],
        }),
      ),
      st(
        "원래 벡터식을 정리",
        R`296-2OP\cdot OQ=2(100-2OP\cdot OQ)\Rightarrow OP\cdot OQ=-48`,
        "PA+PB=−2OP와 PQ+PB=OQ+OB−2OP를 사용한다.",
        m({
          range: [-9, 9, -9, 9],
          lines: [
            circle(0, 0, r),
            line(
              sub(lineCenter, mul(tangent, 7)),
              addv(lineCenter, mul(tangent, 7)),
              C.orange,
            ),
          ],
          dots: [dot(B, "가능 교점 B"), dot(Q, "가능 교점 Q")],
        }),
      ),
      st(
        "Q≠B로 다른 교점 선택",
        R`\cos\theta=-24/25,\quad\sin\theta=7/25,\quad Q=r(527/625,-336/625)`,
        "P를 위쪽에 잡은 좌표에서 다른 교점 Q의 각은 2θ이다. 아래쪽 대칭 배치도 같은 절댓값을 준다.",
        m({
          range: [-9, 9, -9, 9],
          lines: [
            circle(0, 0, r),
            line(O, P),
            line(O, Q, C.green),
            line(P, Q, C.orange),
          ],
          dots: [
            dot(B, "제외: QB=0", C.muted, { open: true }),
            dot(Q, "Q"),
            dot(P, "P"),
          ],
        }),
      ),
      st(
        "두 요청 벡터의 내적",
        R`PA\cdot QB=-196/25`,
        "P에서 A로, Q에서 B로 향하는 실제 차벡터를 사용한다. 방향을 반대로 읽으면 부호가 달라진다.",
        m({
          range: [-9, 9, -9, 9],
          lines: [circle(0, 0, r), line(P, A, C.orange), line(Q, B, C.green)],
          dots: [dot(P, "P"), dot(A, "A"), dot(Q, "Q"), dot(B, "B")],
        }),
      ),
      st(
        "절댓값과 기약분수",
        R`|PA\cdot QB|=196/25,\quad p+q=25+196=221`,
        "196과 25는 서로소이며 원문의 절댓값 조건을 마지막에 적용한다.",
        m({
          range: [-9, 9, -9, 9],
          lines: [line(P, A, C.orange), line(Q, B, C.green)],
          dots: [dot(P, "P"), dot(Q, "Q")],
          metrics: [{ label: "내적 절댓값", value: "196/25" }],
        }),
      ),
    ],
    [
      check("PB", dist(P, B), 14),
      check("Q의 원", norm(Q), r),
      check("Q≠B", dist(Q, B), 2 * r * Math.sqrt((1 - 527 / 625) / 2)),
      check(
        "원문 내적 등식",
        dp(addv(sub(A, P), sub(B, P)), addv(sub(Q, P), sub(B, P))),
        2 * dist(P, Q) ** 2,
      ),
      check("요구 내적", value, -196 / 25),
    ],
  );
}
save();
