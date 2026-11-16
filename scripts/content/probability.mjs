import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  C,
  p,
  line,
  curve,
  dot,
  surface,
  frame,
  step,
  choose,
  bars,
  round,
} from "./helpers.mjs";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const catalogData = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/questions.json"), "utf8"),
);
const catalog = (
  Array.isArray(catalogData) ? catalogData : catalogData.questions
).filter((q) => q.subject === "probability");
const byId = new Map(catalog.map((q) => [q.id, q]));
const output = [];
const R = String.raw;
const factorial = (n) => {
  let v = 1;
  for (let k = 2; k <= n; k++) v *= k;
  return v;
};
const product = (n, k) => {
  let out = [[]];
  for (let i = 0; i < k; i++)
    out = out.flatMap((a) =>
      Array.from({ length: n }, (_, j) => [...a, j + 1]),
    );
  return out;
};
const permutations = (a) =>
  a.length
    ? a.flatMap((v, i) =>
        permutations(a.filter((_, j) => i !== j)).map((b) => [v, ...b]),
      )
    : [[]];
const pairs = (a) => a.flatMap((v, i) => a.slice(i + 1).map((w) => [v, w]));
const fmt = (x) => (Number.isInteger(x) ? String(x) : String(round(x)));
function chart(labels, values, description, highlight = -1) {
  const max = Math.max(1e-8, ...values.map(Math.abs));
  return frame({
    range: [
      -0.8,
      Math.max(2, values.length) - 0.2,
      Math.min(0, ...values) - max * 0.13,
      max * 1.22,
    ],
    surfaces: values.flatMap((v, i) =>
      bars([v], i === highlight ? C.orange : C.blue, i),
    ),
    dots: values.map((v, i) =>
      dot(p(i, v), fmt(v), i === highlight ? C.orange : C.blue),
    ),
    metrics: labels.map((label, i) => ({ label, value: fmt(values[i]) })),
    description,
  });
}
function grid(items, selector, description, cols = 16, success = () => false) {
  const n = items.length,
    rows = Math.ceil(n / cols);
  return frame({
    range: [-0.7, cols - 0.3, -0.7, rows - 0.3],
    dots: items.map((item, i) => ({
      at: p(i % cols, Math.floor(i / cols)),
      color: selector(item) ? (success(item) ? C.green : C.blue) : C.muted,
      size: selector(item) ? 0.075 : 0.025,
    })),
    metrics: [
      { label: "전체 결과", value: String(n) },
      { label: "강조한 결과", value: String(items.filter(selector).length) },
    ],
    description,
    equalAspect: true,
  });
}
function normal(mu, sd, lo, hi, description) {
  const density = (x) =>
      Math.exp(-0.5 * ((x - mu) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI)),
    a = mu - 3.5 * sd,
    b = mu + 3.5 * sd;
  lo = Math.max(a, lo);
  hi = Math.min(b, hi);
  return frame({
    range: [a, b, -0.04 / sd, 0.5 / sd],
    lines: [
      curve(density, a, b, C.blue, 100),
      line(p(mu), p(mu, density(mu)), C.orange, { dashed: true }),
    ],
    surfaces:
      hi >= lo
        ? [
            surface(
              [p(lo), ...curve(density, lo, hi, C.blue, 60).points, p(hi)],
              C.blue,
              0.25,
            ),
          ]
        : [],
    metrics: [
      { label: "평균", value: fmt(mu) },
      { label: "표준편차", value: fmt(sd) },
      { label: "표시 구간", value: `${fmt(lo)} ~ ${fmt(hi)}` },
    ],
    description,
  });
}
function interval(
  center,
  half,
  description,
  labels = ["하한", "중심", "상한"],
) {
  return frame({
    range: [center - half * 1.5, center + half * 1.5, -1, 1],
    lines: [line(p(center - half), p(center + half), C.blue)],
    dots: [
      dot(p(center - half), labels[0], C.blue),
      dot(p(center), labels[1], C.orange),
      dot(p(center + half), labels[2], C.blue),
    ],
    metrics: [
      { label: "하한", value: fmt(center - half) },
      { label: "중심", value: fmt(center) },
      { label: "상한", value: fmt(center + half) },
      { label: "길이", value: fmt(2 * half) },
    ],
    description,
  });
}
const S = (title, formula, body, labels, values, highlight = -1) =>
  step(title, formula, body, chart(labels, values, body, highlight));
function add(id, title, summary, result, steps, checks = []) {
  const q = byId.get(id);
  if (!q) throw Error(`Unknown probability question ${id}`);
  if (steps.length < 3) throw Error(`Too few steps: ${id}`);
  for (const c of checks)
    if (Math.abs(c.actual - c.expected) > (c.tolerance ?? 1e-7))
      throw Error(`Failed ${id}: ${c.label} ${c.actual} != ${c.expected}`);
  output.push({
    id,
    subject: "probability",
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
const check = (label, actual, expected, tolerance = 1e-7) => ({
  label,
  actual,
  expected,
  tolerance,
});
const compositions = (n, k) =>
  k === 1
    ? [[n]]
    : Array.from({ length: n + 1 }, (_, v) =>
        compositions(n - v, k - 1).map((a) => [v, ...a]),
      ).flat();

// 2026학년도: 원문 선택과목 23~30번, 실제 상수와 사건 사용.
{
  const words = product(4, 3);
  add(
    "2026-probability-23",
    "세 자리에 네 문자 선택하기",
    "서로 다른 네 문자를 중복하여 세 자리에 놓는다.",
    "64",
    [
      S(
        "첫 자리의 네 선택",
        R`4`,
        "첫 자리는 a,b,c,d 중 하나다.",
        ["첫 자리"],
        [4],
      ),
      S(
        "둘째 자리도 독립된 네 선택",
        R`4\times4=16`,
        "앞에서 쓴 문자를 다시 쓸 수 있으므로 두 자리까지 16가지다.",
        ["두 자리"],
        [16],
      ),
      step(
        "세 자리의 전체 결과",
        R`4^3=64`,
        "세 번째 자리의 네 선택까지 곱한다. 점 하나는 실제 문자 세 개의 배열이다.",
        grid(words, () => true, "네 문자 중복순열 64개", 8),
      ),
    ],
    [check("실제 배열 전수 열거", words.length, 64)],
  );
  add(
    "2026-probability-24",
    "조건부확률에서 합집합으로",
    "P(A)=2/5, P(B|A)=1/4, P(A∪B)=1을 이용한다.",
    "7/10",
    [
      S(
        "A 안에서 겹친 부분 찾기",
        R`P(A\cap B)=\frac25\cdot\frac14=\frac1{10}`,
        "조건부확률에 조건 사건 A의 확률을 곱한다.",
        ["A∩B", "A의 나머지"],
        [0.1, 0.3],
        0,
      ),
      S(
        "합집합 전체를 나누기",
        R`P(A\setminus B)=\frac25-\frac1{10}=\frac3{10}`,
        "전체가 A∪B이므로 A에만 속한 부분을 빼면 B가 남는다.",
        ["A만", "B"],
        [0.3, 0.7],
        1,
      ),
      S(
        "겹친 부분까지 포함한 B",
        R`P(B)=1-\frac3{10}=\frac7{10}`,
        "B는 교집합 1/10과 B에만 속한 부분 6/10의 합이다.",
        ["A만", "A∩B", "B만", "바깥"],
        [0.3, 0.1, 0.6, 0],
        2,
      ),
    ],
    [check("합집합 공식", 0.4 + 0.7 - 0.4 * 0.25, 1)],
  );
  const balls = [
      ...Array.from({ length: 5 }, (_, i) => ({ color: "W", n: i + 1 })),
      ...Array.from({ length: 5 }, (_, i) => ({ color: "B", n: i + 2 })),
    ],
    out = pairs(balls),
    sameColor = ([a, b]) => a.color === b.color,
    sameNumber = ([a, b]) => a.n === b.n;
  add(
    "2026-probability-25",
    "색 또는 숫자가 같은 두 공",
    "흰 공 1~5와 검은 공 2~6에서 두 개를 동시에 꺼낸다.",
    "8/15",
    [
      step(
        "구별되는 공 두 개 선택",
        R`|\Omega|=\binom{10}2=45`,
        "색과 숫자를 함께 사용하면 열 공은 모두 구별된다. 순서는 세지 않는다.",
        grid(out, () => true, "실제 공 열 개의 비복원 두 개 선택", 9),
      ),
      step(
        "색이 같은 선택",
        R`2\binom52=20`,
        "흰색끼리와 검은색끼리 각각 열 가지다.",
        grid(out, sameColor, "동색인 두 공 20개 선택", 9),
      ),
      step(
        "숫자가 같은 선택 추가",
        R`|A\cap B|=0,\quad |A\cup B|=20+4=24`,
        "두 색에 공통으로 있는 숫자 2,3,4,5가 네 쌍이다. 같은 색에서는 같은 숫자가 없으므로 중복되지 않는다.",
        grid(
          out,
          (x) => sameColor(x) || sameNumber(x),
          "동색 20개와 동수 4개를 합친 24개",
          9,
          sameNumber,
        ),
      ),
      S(
        "합집합의 확률",
        R`P(A\cup B)=\frac{24}{45}=\frac8{15}`,
        "같은 확률의 전체 45개 가운데 24개를 고른다.",
        ["성공", "나머지"],
        [24, 21],
        0,
      ),
    ],
    [
      check(
        "합집합 전수 열거",
        out.filter((x) => sameColor(x) || sameNumber(x)).length,
        24,
      ),
    ],
  );
  add(
    "2026-probability-26",
    "신뢰구간의 양 끝과 길이",
    "모표준편차 5, 표본 크기 36, 99% 신뢰구간의 하한은 1.2다.",
    "5.5",
    [
      S(
        "표본평균의 표준편차",
        R`\sigma_{\bar X}=\frac5{\sqrt{36}}=\frac56`,
        "모표준편차를 표본 크기의 제곱근으로 나눈다.",
        ["모표준편차", "표본평균 표준편차"],
        [5, 5 / 6],
      ),
      step(
        "한쪽 오차 한계",
        R`h=2.58\cdot\frac56=2.15`,
        "99% 신뢰구간은 표본평균에서 양쪽으로 2.15만큼 뻗는다.",
        interval(0, 2.15, "중심에서 양쪽으로 같은 오차 한계"),
      ),
      step(
        "하한을 맞춰 구간 이동",
        R`a=1.2+2(2.15)=5.5`,
        "구간 길이 4.3을 하한에 더한다. 중심은 3.35다.",
        interval(3.35, 2.15, "하한 1.2, 상한 5.5의 실제 신뢰구간"),
      ),
    ],
    [check("상한 계산", 1.2 + (2 * 2.58 * 5) / 6, 5.5)],
  );
  const probs = [1, 1, 3, 5, 2].map((x) => x / 12),
    mean = probs.reduce((s, v, i) => s + i * v, 0),
    second = probs.reduce((s, v, i) => s + i * i * v, 0);
  add(
    "2026-probability-27",
    "확률분포를 완성한 뒤 분산 확대",
    "0~3의 확률은 |2x−1|/12이고 P(X=4)=a다.",
    "45",
    [
      S(
        "빠진 확률 채우기",
        R`a=1-\frac{1+1+3+5}{12}=\frac16`,
        "전체 확률이 1이라는 조건으로 마지막 막대의 높이를 정한다.",
        ["X=0", "X=1", "X=2", "X=3", "X=4"],
        probs,
        4,
      ),
      S(
        "평균과 제곱평균",
        R`E(X)=\frac{30}{12}=\frac52,\quad E(X^2)=\frac{90}{12}=\frac{15}2`,
        "각 값에 그 확률을 곱한 합과 각 제곱값에 확률을 곱한 합을 계산한다.",
        ["E(X)", "E(X²)"],
        [mean, second],
      ),
      S(
        "분산은 배율의 제곱만큼",
        R`V(X)=\frac54,\quad V(X/a)=36V(X)=45`,
        "a=1/6이므로 X/a=6X다. 분산은 6배가 아니라 36배가 된다.",
        ["V(X)", "V(6X)"],
        [second - mean * mean, 36 * (second - mean * mean)],
        1,
      ),
    ],
    [
      check(
        "확률 합",
        probs.reduce((a, b) => a + b),
        1,
      ),
      check("변환 후 분산", 36 * (second - mean * mean), 45),
    ],
  );
  const rolls = product(6, 4),
    counts = rolls.map((seq) => {
      const b = Array(6).fill(0);
      for (const d of seq)
        for (let k = 1; k <= 6; k++)
          if (d % 2 ? k % 2 : d % k === 0) b[k - 1]++;
      return { seq, b, total: b.reduce((a, c) => a + c) };
    }),
    E = (o) => o.total % 2 === 1,
    F = (o) => o.b[2] === o.b[1] + 1,
    den = counts.filter(E).length,
    num = counts.filter((o) => E(o) && F(o)).length;
  add(
    "2026-probability-28",
    "상자별 증가량을 네 번 누적하기",
    "홀수 눈은 1·3·5번 상자, 짝수 눈은 약수 상자에 넣는다. 총수가 홀수인 조건을 적용한다.",
    "3/16",
    [
      S(
        "한 번의 증가량",
        R`k=1,3,5:3;\quad k=2:2;\quad k=4:3;\quad k=6:4`,
        "눈별로 실제로 공이 들어가는 상자 수를 센다.",
        ["1", "2", "3", "4", "5", "6"],
        [3, 2, 3, 3, 3, 4],
      ),
      step(
        "네 번의 순서열",
        R`|\Omega|=6^4=1296`,
        "각 점은 네 눈의 순서열 하나다. 상자 여섯 개의 공 개수를 실제로 누적한다.",
        grid(counts, () => true, "네 번 주사위 결과 1296개", 36),
      ),
      step(
        "총 공 개수가 홀수",
        R`|E|=640`,
        "증가량이 홀수인 눈 1,3,4,5가 홀수 번 나오는 순서열만 남긴다.",
        grid(counts, E, "총수 홀수 조건을 만족한 640개", 36),
      ),
      step(
        "3번 상자가 하나 더 많은 경우",
        R`|E\cap F|=120`,
        "남은 결과 안에서 3번 상자와 2번 상자의 공 개수 차이가 1인지 검사한다.",
        grid(counts, E, "조건 640개 중 차이 조건도 만족하는 120개", 36, F),
      ),
      S(
        "조건부확률",
        R`P(F\mid E)=\frac{120}{640}=\frac3{16}`,
        "확률의 분모는 전체 1296개가 아니라 조건을 만족한 640개다.",
        ["교집합", "조건의 나머지"],
        [num, den - num],
        0,
      ),
    ],
    [check("조건 전수검산", den, 640), check("교집합 전수검산", num, 120)],
  );
  add(
    "2026-probability-29",
    "혼합 시행을 이항분포로 묶기",
    "주사위에 따라 동전을 5회 또는 3회 던진다. 기록이 3인 횟수 X의 평균은 4800이다.",
    "977",
    [
      S(
        "한 시행의 성공확률",
        R`p=\frac a6\binom53 2^{-5}+\frac{6-a}6 2^{-3}=\frac{a+4}{32}`,
        "다섯 번 중 앞면 세 번과 세 번 모두 앞면의 경우를 가지별 확률로 합친다.",
        ["5회에서 3회", "3회에서 3회"],
        [10 / 32, 1 / 8],
      ),
      S(
        "평균으로 a 결정",
        R`19200\frac{a+4}{32}=4800\Rightarrow a=4,\quad p=\frac14`,
        "X는 같은 성공확률의 시행을 19200번 센 이항변수다.",
        ["5회 가지의 기여", "3회 가지의 기여", "합"],
        [((4 / 6) * 10) / 32, 2 / 6 / 8, 0.25],
        2,
      ),
      step(
        "정규근사의 중심과 폭",
        R`E(X)=4800,\quad V(X)=3600,\quad \sigma_X=60`,
        "시행 수가 크므로 문제의 지시에 따라 정규분포로 근사한다.",
        normal(
          4800,
          60,
          4590,
          4920,
          "평균 4800, 표준편차 60; 문항의 절단점 4920",
        ),
      ),
      step(
        "표준화한 경계",
        R`\frac{4800+30a-4800}{60}=2,\quad k\approx0.5+0.477=0.977`,
        "주어진 표의 0에서 2까지 확률을 사용한다. 연속성 보정은 문항의 표 계산 방식에 맞춰 적용하지 않는다.",
        normal(0, 1, -3.5, 2, "표준정규분포의 2 이하 넓이"),
      ),
      S(
        "요구한 값",
        R`1000k=977`,
        "표의 세 자리 근삿값을 사용한 결과다.",
        ["1000k"],
        [977],
      ),
    ],
    [
      check("평균", (19200 * (4 + 4)) / 32, 4800),
      check("분산", 19200 * 0.25 * 0.75, 3600),
      check("표에 따른 답", 1000 * (0.5 + 0.477), 977),
    ],
  );
  const configs = product(3, 10)
      .map((a) => a.map((x) => x - 1))
      .filter(
        (a) =>
          a.reduce((s, v) => s + v, 0) === 8 &&
          [4, 6].includes(a.filter((v) => v === 1).length) &&
          a.every(
            (v, i) =>
              v !== 2 ||
              ((i === 0 || a[i - 1] === 0) && (i === 9 || a[i + 1] === 0)),
          ),
      ),
    n4 = configs.filter((a) => a.filter((v) => v === 1).length === 4).length,
    n6 = configs.length - n4;
  add(
    "2026-probability-30",
    "두 공 주머니의 이웃을 비우기",
    "주머니 10개에 같은 공 8개를 나누고, 두 공 주머니의 양옆은 빈 주머니여야 한다.",
    "262",
    [
      S(
        "한 공 주머니 수로 분리",
        R`(n_0,n_1,n_2)=(4,4,2)\ \text{또는}\ (3,6,1)`,
        "공 총수 8과 주머니 총수 10을 동시에 적용한다.",
        ["첫 경우 빈/한/두 공", "둘째 경우 빈/한/두 공"],
        [4 + 4 + 2, 3 + 6 + 1],
      ),
      S(
        "한 공 주머니가 네 개",
        R`\binom52\binom62=10\cdot15=150`,
        "빈 주머니 네 개의 다섯 틈 중 두 틈에 두 공 주머니를 넣는다. 금지된 이웃을 피하고 남은 세 틈에 한 공 주머니 네 개를 중복조합으로 배치한다.",
        ["두 공 위치", "한 공 배치", "해당 경우"],
        [10, 15, n4],
        2,
      ),
      S(
        "한 공 주머니가 여섯 개",
        R`\binom41\binom82=4\cdot28=112`,
        "빈 주머니 세 개의 네 틈 중 하나에 두 공 주머니를 둔다. 한 공 주머니 여섯 개를 허용된 세 틈에 나눈다.",
        ["두 공 위치", "한 공 배치", "해당 경우"],
        [4, 28, n6],
        2,
      ),
      S(
        "겹치지 않는 두 경우 합하기",
        R`150+112=262`,
        "주머니 수열 3¹⁰개를 독립적으로 검사해도 조건을 만족하는 수열이 262개다.",
        ["한 공 4개", "한 공 6개", "합"],
        [n4, n6, n4 + n6],
        2,
      ),
    ],
    [
      check("한 공 4개 전수검산", n4, 150),
      check("한 공 6개 전수검산", n6, 112),
      check("전체 전수검산", configs.length, 262),
    ],
  );
}

// 2025학년도.
{
  add(
    "2025-probability-23",
    "x³을 고르는 위치와 계수",
    "(x³+2)⁵에서 x⁶을 만드는 항을 찾는다.",
    "80",
    [
      S(
        "지수 6을 만드는 선택 수",
        R`3r=6\Rightarrow r=2`,
        "다섯 괄호 중 두 곳에서 x³을 골라야 한다.",
        ["목표 지수", "한 항의 지수", "선택 횟수"],
        [6, 3, 2],
        2,
      ),
      S(
        "두 위치를 고르는 조합",
        R`\binom52=10`,
        "나머지 세 괄호에서는 상수 2를 고른다.",
        ["x³ 위치"],
        [choose(5, 2)],
      ),
      S(
        "상수의 곱을 함께 곱하기",
        R`[x^6](x^3+2)^5=\binom52 2^3=80`,
        "열 위치 선택마다 상수의 곱 8이 붙는다.",
        ["위치 수", "상수 곱", "계수"],
        [10, 8, 80],
        2,
      ),
    ],
    [check("계수", choose(5, 2) * 2 ** 3, 80)],
  );
  add(
    "2025-probability-24",
    "겹친 부분으로 B의 크기 복원",
    "P(A|B)=P(A)=1/2, P(A∩B)=1/5다.",
    "7/10",
    [
      S(
        "조건부확률의 분모 복원",
        R`\frac{1/5}{P(B)}=\frac12\Rightarrow P(B)=\frac25`,
        "B 안에서 A가 차지하는 비율이 절반이다.",
        ["교집합", "B의 나머지"],
        [0.2, 0.2],
      ),
      S(
        "교집합 중복을 제거",
        R`P(A\cup B)=\frac12+\frac25-\frac15`,
        "A와 B를 더할 때 겹친 부분을 두 번 세었으므로 한 번 뺀다.",
        ["A만", "A∩B", "B만"],
        [0.3, 0.2, 0.2],
      ),
      S(
        "전체 확률과 비교",
        R`P(A\cup B)=\frac7{10}`,
        "합집합 7/10과 바깥 3/10이 전체를 이룬다.",
        ["합집합", "바깥"],
        [0.7, 0.3],
        0,
      ),
    ],
    [check("덧셈정리", 0.5 + 0.4 - 0.2, 0.7)],
  );
  add(
    "2025-probability-25",
    "표본 수가 정하는 신뢰구간 길이",
    "모표준편차 2, 표본 크기 256인 95% 신뢰구간의 길이다.",
    "0.49",
    [
      S(
        "평균의 표준편차",
        R`\frac2{\sqrt{256}}=\frac18`,
        "표본 크기가 256이므로 표준편차를 16으로 나눈다.",
        ["σ", "σ/√n"],
        [2, 0.125],
      ),
      step(
        "중심에서의 오차 한계",
        R`h=1.96\cdot\frac18=0.245`,
        "가로축은 표본평균에서의 상대 위치다. 중심의 실제 값은 주어지지 않았고 길이 계산에 필요하지 않다.",
        interval(0, 0.245, "표본평균에 대한 상대 위치, 양쪽 0.245"),
      ),
      S(
        "양 끝 사이 길이",
        R`b-a=2h=0.49`,
        "한쪽 오차 한계의 두 배가 구간 전체 길이다.",
        ["왼쪽 길이", "오른쪽 길이", "전체"],
        [0.245, 0.245, 0.49],
        2,
      ),
    ],
    [check("신뢰구간 길이", (2 * 1.96 * 2) / 16, 0.49)],
  );
  add(
    "2025-probability-26",
    "적어도 한 명은 여사건으로",
    "A 선호 9명, B 선호 7명인 16명에서 세 명을 고른다.",
    "17/20",
    [
      S(
        "세 학생을 고르는 전체 경우",
        R`\binom{16}3=560`,
        "학생들은 서로 구별되고 선택 순서는 세지 않는다.",
        ["전체"],
        [choose(16, 3)],
      ),
      S(
        "B가 한 명도 없는 경우",
        R`\binom93=84`,
        "A를 고른 아홉 명 안에서 세 명을 고르는 경우가 여사건이다.",
        ["모두 A", "B 포함"],
        [84, 560 - 84],
        0,
      ),
      S(
        "전체에서 여사건 제외",
        R`1-\frac{84}{560}=\frac{17}{20}`,
        "B가 한 명, 두 명, 세 명인 경우를 따로 계산하지 않아도 된다.",
        ["원하는 경우", "여사건"],
        [476, 84],
        0,
      ),
    ],
    [check("여사건 계산", 1 - choose(9, 3) / choose(16, 3), 17 / 20)],
  );
  const card = [1, 3, 5, 7, 9],
    samples = product(5, 3).map(
      (a) => a.map((i) => card[i - 1]).reduce((s, v) => s + v) / 3,
    ),
    vmean = samples.reduce((s, x) => s + (x - 5) ** 2, 0) / samples.length;
  add(
    "2025-probability-27",
    "복원추출 평균의 분산",
    "1,3,5,7,9 중 복원추출 세 번의 평균을 X̄라 하고 V(aX̄+6)=24다.",
    "3",
    [
      S(
        "한 장의 분산",
        R`E(X)=5,\quad V(X)=\frac{16+4+0+4+16}{5}=8`,
        "평균 5에서 떨어진 거리의 제곱을 평균낸다.",
        ["1", "3", "5", "7", "9"],
        card.map((x) => (x - 5) ** 2),
      ),
      S(
        "독립인 세 값의 평균",
        R`V(\bar X)=\frac83`,
        "복원추출이므로 세 시행이 독립이다. 평균의 분산은 원래 분산의 1/3이다.",
        ["한 장", "세 장 평균"],
        [8, vmean],
      ),
      S(
        "확대와 평행이동의 영향",
        R`a^2\frac83=24\Rightarrow a^2=9\Rightarrow a=3`,
        "상수 6을 더해도 분산은 그대로다. a가 양수라는 조건으로 3을 고른다.",
        ["V(X̄)", "V(3X̄+6)"],
        [8 / 3, 24],
        1,
      ),
    ],
    [
      check("125개 표본평균 분산", vmean, 8 / 3),
      check("양의 배율", Math.sqrt(24 / (8 / 3)), 3),
    ],
  );
  const funcs = product(6, 6).filter(
      (a) =>
        6 % (a[0] * a[5]) === 0 &&
        2 * a[0] <= a[1] &&
        a[1] <= a[2] &&
        a[2] <= a[3] &&
        a[3] <= a[4] &&
        a[4] <= 2 * a[5],
    ),
    ends = [
      [1, 1],
      [1, 2],
      [1, 3],
      [1, 6],
      [2, 3],
    ],
    ct = ends.map(
      ([a, b]) => funcs.filter((f) => f[0] === a && f[5] === b).length,
    );
  add(
    "2025-probability-28",
    "양 끝의 함수값으로 중복조합 분리",
    "f:{1,…,6}→{1,…,6}, f(1)f(6)은 6의 약수이며 중간 네 값이 지정된 순서로 놓인다.",
    "171",
    [
      S(
        "허용되는 양 끝",
        R`(f(1),f(6))=(1,1),(1,2),(1,3),(1,6),(2,3)`,
        "단조 조건에서 f(1)≤f(6)이다. 곱이 1,2,3,6인 순서쌍만 남긴다.",
        ["(1,1)", "(1,2)", "(1,3)", "(1,6)", "(2,3)"],
        [1, 1, 1, 1, 1],
      ),
      S(
        "중간 네 값의 선택 범위",
        R`2f(1)\le f(2)\le\cdots\le f(5)\le\min(6,2f(6))`,
        "공역의 최댓값 6을 반드시 함께 적용한다. 각 경우에 쓸 수 있는 값의 개수는 1,3,5,5,3이다.",
        ["(1,1)", "(1,2)", "(1,3)", "(1,6)", "(2,3)"],
        [1, 3, 5, 5, 3],
      ),
      S(
        "네 값을 중복 선택",
        R`\binom44+\binom64+\binom84+\binom84+\binom64=1+15+70+70+15`,
        "중간 네 값은 비감소 순서이므로 중복조합으로 결정된다.",
        ["(1,1)", "(1,2)", "(1,3)", "(1,6)", "(2,3)"],
        ct,
      ),
      S(
        "모든 양 끝 경우 합산",
        R`1+15+70+70+15=171`,
        "6⁶개 실제 함수값 배열을 검사한 결과도 171이다.",
        ["전체 조건 함수"],
        [funcs.length],
      ),
    ],
    [
      check("함수 전수검산", funcs.length, 171),
      ...ct.map((n, i) => check(`양끝 ${ends[i]}`, n, [1, 15, 70, 70, 15][i])),
    ],
  );
  add(
    "2025-probability-29",
    "대칭과 평행이동으로 확률 구간 합치기",
    "X의 대칭 중심과 Y의 이동 관계를 이용해 두 구간 확률을 합친다.",
    "25",
    [
      step(
        "40−x의 대칭 중심",
        R`2m_1=40\Rightarrow m_1=20`,
        "x와 40−x는 평균을 기준으로 대칭이므로 중심은 20이다. 표준편차는 아직 정하지 않는다.",
        interval(20, 5, "15와 25는 중심 20에 대한 대칭점", [
          "15",
          "m₁=20",
          "25",
        ]),
      ),
      step(
        "Y 구간을 X 좌표로 옮기기",
        R`Y\overset d=X-10\Rightarrow m_2=10,\ \sigma_2=\sigma_1`,
        "Y의 [15,20]은 X의 [25,30]에 해당한다.",
        interval(27.5, 2.5, "Y의 [15,20]을 X의 [25,30]으로 이동", [
          "25",
          "27.5",
          "30",
        ]),
      ),
      step(
        "대칭시킨 구간을 이어 붙이기",
        R`P(15\le X\le20)+P(25\le X\le30)=P(20\le X\le30)`,
        "첫 구간을 평균 20에 대해 반사하면 [20,25]이 되어 두 구간이 맞닿는다.",
        interval(25, 5, "합쳐진 X의 [20,30] 구간", ["20", "25", "30"]),
      ),
      step(
        "표의 0.4772로 폭 결정",
        R`P(0\le Z\le10/\sigma_1)=0.4772\Rightarrow \sigma_1=\sigma_2=5`,
        "제공된 표에서 0.4772는 z=2에 해당한다. 이제 분포의 폭이 결정된다.",
        normal(20, 5, 20, 30, "조건을 모두 적용한 X~N(20,25)"),
      ),
      S(
        "평균과 표준편차의 합",
        R`m_1+\sigma_2=20+5=25`,
        "두 번째 항은 분산 25가 아니라 표준편차 5다.",
        ["m₁", "σ₂", "합"],
        [20, 5, 25],
        2,
      ),
    ],
    [check("표준화 경계", 10 / 5, 2), check("요구한 합", 20 + 5, 25)],
  );
  const flipseq = product(6, 3),
    win = (s) => {
      const coins = [1, 1, 0, 0, 0];
      for (const d of s)
        for (let i = 0; i < 5; i++) if (d === 6 || d === i + 1) coins[i] ^= 1;
      return coins.every(Boolean);
    },
    success = flipseq.filter(win),
    g0 = success.filter((s) => !s.includes(6)).length,
    g1 = success.filter((s) => s.includes(6)).length;
  add(
    "2025-probability-30",
    "동전 뒤집기의 홀짝 조건",
    "앞앞뒤뒤뒤에서 세 번 시행 후 다섯 동전이 모두 앞면이 되는 눈의 순서를 센다.",
    "19",
    [
      step(
        "세 번 주사위의 전체 순서",
        R`6^3=216`,
        "각 점은 실제 눈 세 개의 순서다. 뒤집힌 횟수가 홀수인 자리만 최종 상태가 바뀐다.",
        grid(flipseq, () => true, "세 번 눈의 순서 216개", 18),
      ),
      S(
        "전체 뒤집기가 없을 때",
        R`(3,4,5)\text{를 한 번씩}:3!=6`,
        "처음 뒷면인 세 자리만 각각 한 번 뒤집어야 한다.",
        ["6의 눈 0회 성공"],
        [g0],
      ),
      S(
        "전체 뒤집기가 한 번일 때",
        R`(1,2,6)\text{를 한 번씩}:3!=6`,
        "전체를 뒤집은 효과와 처음 앞면인 두 자리를 뒤집는 효과가 합쳐져 모두 앞면이 된다. 6이 두 번 이상이면 불가능하다.",
        ["6의 눈 0회", "6의 눈 1회"],
        [g0, g1],
      ),
      step(
        "성공 순서열만 확인",
        R`P=\frac{12}{216}=\frac1{18}`,
        "직접 뒤집기 시뮬레이션을 해도 성공 순서열이 열두 개다.",
        grid(flipseq, win, "모든 동전이 앞면인 실제 순서열 12개", 18),
      ),
      S(
        "기약분수의 분자와 분모",
        R`p+q=18+1=19`,
        "문항이 요구하는 것은 확률 자체가 아니라 기약분수 분모와 분자의 합이다.",
        ["p", "q", "합"],
        [18, 1, 19],
        2,
      ),
    ],
    [
      check("성공 순서열", success.length, 12),
      check("6 없는 성공", g0, 6),
      check("6 있는 성공", g1, 6),
    ],
  );
}

// 2024학년도.
{
  const arrangements = [
    ...new Set(permutations(["x", "x", "y", "y", "z"]).map((a) => a.join(""))),
  ];
  add(
    "2024-probability-23",
    "같은 문자 배열의 중복 제거",
    "x 두 개, y 두 개, z 한 개를 모두 일렬로 놓는다.",
    "30",
    [
      S(
        "모두 구별했을 때",
        R`5!=120`,
        "x와 y에 임시 번호를 붙이면 다섯 자리를 120가지로 배치한다.",
        ["구별된 배열"],
        [120],
      ),
      S(
        "같은 x와 같은 y를 합치기",
        R`\frac{5!}{2!2!}`,
        "x끼리 바꾼 두 가지와 y끼리 바꾼 두 가지가 같은 문자열을 만든다.",
        ["임시 중복 배율"],
        [4],
      ),
      step(
        "서로 다른 실제 문자열",
        R`\frac{120}{4}=30`,
        "중복 문자열을 제거해 직접 나열한 결과도 30개다.",
        grid(arrangements, () => true, "xxyyz의 서로 다른 배열 30개", 10),
      ),
    ],
    [check("문자열 중복제거", arrangements.length, 30)],
  );
  add(
    "2024-probability-24",
    "여사건 비율과 독립",
    "P(Aᶜ)=2P(A), P(A∩B)=1/4인 독립 사건이다.",
    "3/4",
    [
      S(
        "전체를 세 몫으로 나누기",
        R`P(A)+2P(A)=1\Rightarrow P(A)=\frac13`,
        "A와 여사건은 전체를 겹치지 않게 나눈다.",
        ["A", "Aᶜ"],
        [1 / 3, 2 / 3],
      ),
      S(
        "독립의 곱셈식",
        R`\frac13P(B)=\frac14`,
        "독립 사건의 교집합 확률은 두 확률의 곱이다.",
        ["A∩B", "A∩Bᶜ"],
        [1 / 4, 1 / 12],
      ),
      S(
        "B의 크기 복원",
        R`P(B)=\frac{1/4}{1/3}=\frac34`,
        "B와 여사건의 확률이 3:1이다.",
        ["B", "Bᶜ"],
        [0.75, 0.25],
        0,
      ),
    ],
    [check("독립 교집합", (1 / 3) * 0.75, 0.25)],
  );
  const endPairs = product(6, 2).filter(([a, b]) => a !== b),
    endOK = ([a, b]) => a + b <= 10;
  add(
    "2024-probability-25",
    "양 끝 카드만 먼저 보기",
    "1~6 카드 여섯 장을 배열하고 양 끝의 합이 10 이하일 확률이다.",
    "14/15",
    [
      step(
        "양 끝의 순서 있는 선택",
        R`6\cdot5=30`,
        "중간 네 장은 어느 양 끝 선택에서도 4!가지이므로 확률 계산에서 약분된다.",
        grid(endPairs, () => true, "서로 다른 양 끝 카드 30쌍", 6),
      ),
      step(
        "합이 10을 넘는 여사건",
        R`(5,6),(6,5)\Rightarrow2\text{가지}`,
        "서로 다른 카드이므로 합이 11인 이 두 쌍만 제외한다.",
        grid(endPairs, (x) => !endOK(x), "여사건인 두 끝쌍", 6),
      ),
      S(
        "여사건을 빼기",
        R`1-\frac2{30}=\frac{14}{15}`,
        "나머지 28쌍은 모두 조건을 만족한다.",
        ["조건 만족", "여사건"],
        [28, 2],
        0,
      ),
    ],
    [check("양끝쌍 전수검산", endPairs.filter(endOK).length, 28)],
  );
  const xprob = Array.from({ length: 5 }, (_, k) => choose(4, k) / 16),
    yp = [xprob[0], xprob[1], xprob.slice(2).reduce((s, v) => s + v)];
  add(
    "2024-probability-26",
    "확률변수를 2에서 묶기",
    "동전 네 개의 앞면 수 X를 Y=min(X,2)로 바꾼다.",
    "13/8",
    [
      S(
        "앞면 개수의 이항분포",
        R`P(X=k)=\binom4k2^{-4}`,
        "0,1,2,3,4개가 나올 확률을 각각 센다.",
        ["0", "1", "2", "3", "4"],
        xprob,
      ),
      S(
        "2 이상인 세 막대 합치기",
        R`P(Y=0)=\frac1{16},\ P(Y=1)=\frac4{16},\ P(Y=2)=\frac{11}{16}`,
        "X=2,3,4는 모두 같은 값 Y=2로 이동한다.",
        ["Y=0", "Y=1", "Y=2"],
        yp,
        2,
      ),
      S(
        "바뀐 값으로 평균 계산",
        R`E(Y)=0\frac1{16}+1\frac4{16}+2\frac{11}{16}=\frac{13}8`,
        "원래 X값 대신 변환된 Y값을 확률에 곱한다.",
        ["0의 기여", "1의 기여", "2의 기여"],
        [0, 1 / 4, 22 / 16],
        2,
      ),
    ],
    [check("변환평균", yp[1] + 2 * yp[2], 13 / 8)],
  );
  add(
    "2024-probability-27",
    "비율로 주어진 신뢰구간의 중심",
    "모표준편차 5, n=49, 신뢰구간은 [a,6a/5]다.",
    "15.4",
    [
      step(
        "한쪽 오차 한계",
        R`h=1.96\frac57=1.4`,
        "표본평균을 기준으로 양쪽 길이는 각각 1.4다.",
        interval(0, 1.4, "표본평균에서의 상대 오차 구간"),
      ),
      S(
        "끝점 차이로 하한 구하기",
        R`\frac65a-a=2.8\Rightarrow a=14`,
        "상한과 하한의 차이는 전체 길이 2.8이다.",
        ["하한 a", "상한 6a/5"],
        [14, 16.8],
      ),
      step(
        "표본평균은 두 끝점의 중점",
        R`\bar x=\frac{14+16.8}{2}=15.4`,
        "신뢰구간의 중심이 관측된 표본평균이다.",
        interval(15.4, 1.4, "실제 신뢰구간 [14,16.8]"),
      ),
    ],
    [
      check("신뢰구간 길이", (2 * 1.96 * 5) / 7, 2.8),
      check("중점", (14 + 16.8) / 2, 15.4),
    ],
  );
  const seqs = product(4, 4).map((seq) => ({
      seq,
      total: seq.reduce((s, n) => s + { 1: 1, 2: 2, 3: 2, 4: 3 }[n], 0),
      black: seq.filter((n) => n !== 1).length,
    })),
    E = (o) => o.total === 8,
    F = (o) => o.black === 2;
  add(
    "2024-probability-28",
    "총수 조건으로 카드 순서열 거르기",
    "카드 1·2·3·4에 따라 흰 공과 검은 공을 옮기는 시행을 네 번 한다.",
    "3/35",
    [
      step(
        "동일한 확률의 전체 순서열",
        R`4^4=256`,
        "카드를 되넣으므로 순서열 256개가 같은 확률이다.",
        grid(seqs, () => true, "실제 카드 네 장 순서열 256개"),
      ),
      S(
        "공 총수가 8인 경우 분리",
        R`n_1+n_2+n_3=4,\quad n_1+2n_2+3n_3=8\Rightarrow n_1=n_3`,
        "한 개, 두 개, 세 개를 옮긴 횟수로 분류한다. 두 개를 옮기는 눈에는 카드 2와 3의 두 선택이 있다.",
        ["(0,4,0)", "(1,2,1)", "(2,0,2)"],
        [16, 48, 6],
      ),
      step(
        "70개를 새 표본공간으로",
        R`|E|=16+48+6=70`,
        "총수가 8인 70개만 남긴다.",
        grid(seqs, E, "총 공 8개인 조건 순서열"),
      ),
      step(
        "그중 검정 공 두 개",
        R`|E\cap F|=\frac{4!}{2!2!}=6`,
        "이 조건 안에서 검정 공이 두 개려면 1과 4가 각각 두 번 나와야 한다.",
        grid(seqs, E, "조건 70개 중 검정 두 개인 6개", 16, F),
      ),
      S(
        "조건부확률",
        R`\frac6{70}=\frac3{35}`,
        "전체 256개가 아니라 조건을 만족하는 70개를 분모로 쓴다.",
        ["교집합", "조건의 나머지"],
        [6, 64],
        0,
      ),
    ],
    [
      check("E 전수검산", seqs.filter(E).length, 70),
      check("교집합 전수검산", seqs.filter((o) => E(o) && F(o)).length, 6),
    ],
  );
  const tuples = product(6, 4).filter(
      ([a, b, c, d]) => a <= c && b <= c && c <= d,
    ),
    counts = Array.from(
      { length: 6 },
      (_, i) => tuples.filter((t) => t[2] === i + 1).length,
    );
  add(
    "2024-probability-29",
    "가운데 값 c를 고정해 세기",
    "1~6의 자연수 a,b,c,d가 a≤c≤d, b≤c≤d를 만족한다.",
    "196",
    [
      S(
        "c가 정해지면 a,b는 독립 선택",
        R`a,b\in\{1,\ldots,c\}\Rightarrow c^2`,
        "a와 b 사이의 대소 조건은 없으므로 순서 있는 두 선택이다.",
        ["c=1", "2", "3", "4", "5", "6"],
        [1, 4, 9, 16, 25, 36],
      ),
      S(
        "d는 c 이상인 값",
        R`d\in\{c,\ldots,6\}\Rightarrow7-c`,
        "각 c의 선택에 d의 가능한 수를 곱한다.",
        ["c=1", "2", "3", "4", "5", "6"],
        counts,
      ),
      S(
        "c별 경우를 모두 합치기",
        R`\sum_{c=1}^6c^2(7-c)=6+20+36+48+50+36=196`,
        "각 순서쌍은 고유한 c를 가지므로 경우가 겹치지 않는다.",
        ["합"],
        [tuples.length],
      ),
    ],
    [check("1296개 순서쌍 검산", tuples.length, 196)],
  );
  add(
    "2024-probability-30",
    "길이가 같은 정규구간의 위치",
    "X~N(1,t²), P(X≤5t)≥1/2를 만족하는 t에서 지정 구간 확률을 최대화한다.",
    "673",
    [
      S(
        "평균을 기준으로 t 제한",
        R`5t\ge1\Rightarrow t\ge\frac15`,
        "정규분포의 누적확률이 절반 이상이려면 경계가 평균보다 크거나 같아야 한다.",
        ["t 최솟값"],
        [0.2],
      ),
      step(
        "구간을 표준화",
        R`\frac{t^2\pm t+1-1}{t}=t\pm1`,
        "표준화 후 구간 길이는 항상 2이고 중심만 t가 된다. 그림은 허용되는 경계 t=1/5의 구간이다.",
        normal(0, 1, -0.8, 1.2, "t=1/5에서의 표준화 구간 [-0.8,1.2]"),
      ),
      step(
        "중심이 0에 가까울수록 넓다",
        R`\frac{d}{dt}\{\Phi(t+1)-\Phi(t-1)\}=\phi(t+1)-\phi(t-1)<0\quad(t>0)`,
        "고정 길이 구간을 오른쪽으로 옮길수록 밀도가 낮은 쪽이 늘어난다. 따라서 가장 작은 t=1/5가 최대다.",
        normal(0, 1, -0.8, 1.2, "최댓값을 주는 가장 중앙에 가까운 허용 구간"),
      ),
      S(
        "주어진 표로 넓이 더하기",
        R`k=0.288+0.385=0.673,\quad1000k=673`,
        "−0.8부터 0까지와 0부터 1.2까지의 넓이를 합한다.",
        ["왼쪽 넓이", "오른쪽 넓이", "합"],
        [0.288, 0.385, 0.673],
        2,
      ),
    ],
    [check("표의 합", 1000 * (0.288 + 0.385), 673)],
  );
}

// 2023학년도.
{
  add(
    "2023-probability-23",
    "세 번의 x³ 선택",
    "(x³+3)⁵의 x⁹ 계수를 구한다.",
    "90",
    [
      S(
        "지수 맞추기",
        R`3r=9\Rightarrow r=3`,
        "다섯 괄호 중 세 곳에서 x³을 고른다.",
        ["지수", "선택 수"],
        [9, 3],
      ),
      S(
        "위치 고르기",
        R`\binom53=10`,
        "상수 3을 고를 두 위치도 함께 정해진다.",
        ["위치 수"],
        [10],
      ),
      S(
        "상수 곱 반영",
        R`\binom53 3^2=90`,
        "각 위치 선택에서 상수 곱은 9다.",
        ["위치", "상수 곱", "계수"],
        [10, 9, 90],
        2,
      ),
    ],
    [check("이항계수", choose(5, 3) * 9, 90)],
  );
  const nums = product(5, 4),
    valid = (a) => a[0] >= 4 && a[3] % 2 === 1;
  add(
    "2023-probability-24",
    "천의 자리와 일의 자리 제한",
    "1~5를 중복 사용한 네 자리 수 중 4000 이상인 홀수를 센다.",
    "150",
    [
      step(
        "중복 가능한 네 자리",
        R`5^4=625`,
        "각 점은 네 자리의 실제 숫자 배열이다.",
        grid(nums, () => true, "전체 625개", 25),
      ),
      step(
        "4000 이상만 남기기",
        R`2\cdot5^3=250`,
        "천의 자리는 4 또는 5여야 한다.",
        grid(nums, (a) => a[0] >= 4, "천의 자리를 제한", 25),
      ),
      step(
        "홀수 조건 추가",
        R`2\cdot5\cdot5\cdot3=150`,
        "일의 자리는 1,3,5이고 중간 두 자리는 자유롭다.",
        grid(nums, valid, "두 자리의 조건을 함께 만족", 25),
      ),
    ],
    [check("전수 열거", nums.filter(valid).length, 150)],
  );
  add(
    "2023-probability-25",
    "흰 마스크가 적어도 하나",
    "흰색 5개와 검은색 9개 중 세 개를 동시에 선택한다.",
    "10/13",
    [
      S(
        "전체 선택",
        R`\binom{14}3=364`,
        "개별 마스크는 구별하여 세 개를 고른다.",
        ["전체"],
        [364],
      ),
      S(
        "검은색만 선택",
        R`\binom93=84`,
        "흰색이 하나도 없는 여사건을 센다.",
        ["검은색만", "흰색 포함"],
        [84, 280],
        0,
      ),
      S(
        "여사건 빼기",
        R`1-\frac{84}{364}=\frac{10}{13}`,
        "적어도 하나라는 조건은 1에서 여사건을 빼면 된다.",
        ["성공 확률", "여사건 확률"],
        [10 / 13, 3 / 13],
        0,
      ),
    ],
    [check("조합 확률", 1 - choose(9, 3) / choose(14, 3), 10 / 13)],
  );
  const b = [
      { w: 1, n: 1 },
      { w: 1, n: 2 },
      { w: 0, n: 1 },
      { w: 0, n: 2 },
      { w: 0, n: 2 },
      { w: 0, n: 2 },
    ],
    tr = [];
  for (let i = 0; i < 6; i++)
    for (let j = i + 1; j < 6; j++)
      for (let k = j + 1; k < 6; k++) tr.push([b[i], b[j], b[k]]);
  const A = (t) => t.reduce((s, v) => s + v.w, 0) === 1,
    B = (t) => t.every((v) => v.n === 2);
  add(
    "2023-probability-26",
    "색 사건과 숫자 사건의 겹침",
    "흰 공 두 개와 검은 공 네 개에서 세 개를 꺼낸다. 흰 공 한 개인 사건과 곱이 8인 사건을 합친다.",
    "13/20",
    [
      step(
        "세 공 선택 20개",
        R`|\Omega|=\binom63=20`,
        "숫자가 같은 검은 공도 개별 공으로 구별한다.",
        grid(tr, () => true, "실제 공 세 개 조합", 5),
      ),
      step(
        "흰색 하나 검은색 둘",
        R`|A|=\binom21\binom42=12`,
        "색으로 정한 사건 A를 강조한다.",
        grid(tr, A, "A의 12개", 5),
      ),
      step(
        "곱이 8인 선택",
        R`|B|=\binom43=4,\quad |A\cap B|=\binom32=3`,
        "2가 적힌 공 세 개가 필요하다. 흰색 2와 검은색 2 두 개가 교집합이다.",
        grid(tr, B, "B의 네 개, 교집합 세 개", 5, A),
      ),
      S(
        "중복 제거",
        R`P(A\cup B)=\frac{12+4-3}{20}=\frac{13}{20}`,
        "두 사건을 더한 뒤 겹쳐 센 세 경우를 뺀다.",
        ["A만", "교집합", "B만", "바깥"],
        [9, 3, 1, 7],
      ),
    ],
    [check("합집합 열거", tr.filter((t) => A(t) || B(t)).length, 13)],
  );
  add(
    "2023-probability-27",
    "신뢰구간 길이로 표본 수 결정",
    "16개 표본의 95% 구간 746.1~755.9에서 모표준편차를 복원한다.",
    "74",
    [
      step(
        "기존 구간의 반길이",
        R`h=\frac{755.9-746.1}{2}=4.9`,
        "중심은 751이며 양쪽 오차가 같다.",
        interval(751, 4.9, "실제 95% 구간"),
      ),
      S(
        "모표준편차 복원",
        R`1.96\frac\sigma4=4.9\Rightarrow\sigma=10`,
        "표본 크기 16의 제곱근은 4다.",
        ["표본평균 표준편차", "모표준편차"],
        [2.5, 10],
      ),
      S(
        "99% 구간의 길이 제한",
        R`\frac{51.6}{\sqrt n}\le6\iff n\ge73.96`,
        "길이가 6 이하가 되는 최초의 자연수를 찾는다.",
        ["n=73 길이", "n=74 길이", "허용 길이"],
        [51.6 / Math.sqrt(73), 51.6 / Math.sqrt(74), 6],
        1,
      ),
      S(
        "자연수 올림",
        R`n_{\min}=74`,
        "73에서는 길이가 6보다 크고 74에서는 작다.",
        ["최소 표본 크기"],
        [74],
      ),
    ],
    [
      check("σ 복원", (4.9 * 4) / 1.96, 10),
      check("최소 정수", Math.ceil((51.6 / 6) ** 2), 74),
    ],
  );
  const dens = (x) => (x <= 2.5 ? x / 5 : (4 - x) / 3);
  const dm = (lo, hi, desc) =>
    frame({
      range: [-0.3, 4.3, -0.05, 0.62],
      lines: [curve(dens, 0, 2.5), curve(dens, 2.5, 4)],
      surfaces: [
        surface(
          [p(lo), ...curve(dens, lo, hi, C.blue, 100).points, p(hi)],
          C.green,
          0.25,
        ),
      ],
      dots: [dot(p(2.5, 0.5), "(b,c)", C.orange)],
      description: desc,
    });
  add(
    "2023-probability-28",
    "삼각형 밀도에서 중간 넓이 읽기",
    "밀도 그래프의 꼭짓점 (0,0),(b,c),(a,0)과 두 누적확률을 이용한다.",
    "7",
    [
      step(
        "전체 삼각형의 넓이",
        R`\frac12ac=1\Rightarrow ac=2`,
        "도형은 조건을 모두 푼 실제 크기 a=4,b=2.5,c=0.5로 표시한다. 첫 단계는 전체 넓이 1이다.",
        dm(0, 4, "전체 삼각형 넓이 1"),
      ),
      step(
        "b 왼쪽 확률",
        R`F(b)-(1-F(b))=\frac14\Rightarrow F(b)=\frac58,\quad bc=\frac54`,
        "연속분포이므로 한 점의 확률은 0이다. 왼쪽 삼각형의 넓이는 5/8이다.",
        dm(0, 2.5, "b 왼쪽 삼각형 5/8"),
      ),
      step(
        "중앙값은 오름차순 구간 안",
        R`\sqrt5<b,\quad \frac12\sqrt5\frac cb\sqrt5=\frac12\Rightarrow b=5c`,
        "F(b)>1/2이므로 √5는 꼭짓점의 왼쪽이다. 이 구간의 밀도는 cx/b다.",
        dm(0, Math.sqrt(5), "√5까지 삼각형 넓이 1/2"),
      ),
      S(
        "양의 해 선택",
        R`5c^2=\frac54\Rightarrow c=\frac12,\quad b=\frac52,\quad a=4`,
        "높이가 양수라는 조건으로 c의 양의 해를 선택한다.",
        ["a", "b", "c"],
        [4, 2.5, 0.5],
      ),
      S(
        "요구한 합",
        R`a+b+c=4+\frac52+\frac12=7`,
        "세 상수를 더한다.",
        ["합"],
        [7],
      ),
    ],
    [
      check("전체 넓이", 0.5 * 4 * 0.5, 1),
      check("중앙값 넓이", Math.sqrt(5) ** 2 / 10, 0.5),
      check("확률 차", 2 * 0.5 * 2.5 * 0.5 - 1, 0.25),
    ],
  );
  const seq = product(6, 3),
    E = (a) => a.filter((x) => x % 2).length % 2 === 1,
    F = (a) => a.filter((x) => x === 1).length === 1;
  add(
    "2023-probability-29",
    "카드 뒤집기와 홀짝 보존",
    "1~6 카드의 초기 합은 21. 주사위 세 번으로 뒤집은 뒤 합이 짝수인 조건을 적용한다.",
    "49",
    [
      step(
        "세 번 주사위의 216가지",
        R`|\Omega|=6^3=216`,
        "카드를 다시 뒤집으면 원래 상태로 돌아온다. 반복 등장도 그대로 계산한다.",
        grid(seq, () => true, "실제 눈 세 개의 순서열", 18),
      ),
      step(
        "홀수 카드가 뒤집힌 횟수",
        R`\text{합이 짝수}\iff\text{홀수 눈이 1회 또는 3회}`,
        "홀수 카드를 한 번 뒤집을 때마다 합의 홀짝이 바뀐다. 최초 합은 홀수다.",
        grid(seq, E, "짝수 합이 되는 108개", 18),
      ),
      S(
        "1이 정확히 한 번",
        R`|E\cap F|=3\cdot3^2+3\cdot2^2=39`,
        "나머지 두 눈은 모두 짝수이거나 모두 3,5여야 한다.",
        ["나머지 짝수", "나머지 3 또는 5"],
        [27, 12],
      ),
      step(
        "조건 표본공간에서 비율",
        R`P(F\mid E)=\frac{39}{108}=\frac{13}{36}`,
        "조건을 만족한 108개 중 39개가 1을 정확히 한 번 포함한다.",
        grid(seq, E, "조건 내부의 교집합", 18, F),
      ),
      S(
        "분모와 분자 합",
        R`p+q=36+13=49`,
        "기약분수의 두 자연수를 더한다.",
        ["분모", "분자", "합"],
        [36, 13, 49],
        2,
      ),
    ],
    [
      check("분모 열거", seq.filter(E).length, 108),
      check("교집합 열거", seq.filter((a) => E(a) && F(a)).length, 39),
    ],
  );
  const lower = (k) =>
      product(k, 3).filter(
        (a) =>
          a[0] <= 2 && a[1] <= 3 && a[2] <= 4 && a[0] <= a[1] && a[1] <= a[2],
      ),
    lc = [1, 2, 3, 4].map((k) => lower(k).length),
    rc = [...lc].reverse(),
    counts = lc.map((v, i) => v * rc[i]);
  add(
    "2023-probability-30",
    "여섯 칸 차이로 함수 두 부분 분리",
    "1~10에서 증가하지 않는 곳이 없는 함수에 f(x)≤x 또는 ≥x와 f(6)=f(5)+6을 적용한다.",
    "100",
    [
      S(
        "경계값의 네 경우",
        R`(f(5),f(6))=(1,7),(2,8),(3,9),(4,10)`,
        "f(1)=1,f(10)=10이 고정된다. 두 경계값의 차이가 6이므로 네 경우뿐이다.",
        ["f(5)=1", "2", "3", "4"],
        [7, 8, 9, 10],
      ),
      S(
        "왼쪽 세 값 열거",
        R`L_1=1,\quad L_2=4,\quad L_3=9,\quad L_4=14`,
        "f(2)≤2, f(3)≤3, f(4)≤4와 비감소 조건을 함께 확인한다.",
        ["L₁", "L₂", "L₃", "L₄"],
        lc,
      ),
      S(
        "오른쪽은 반사 대응",
        R`f(x)\mapsto11-f(11-x),\quad (R_1,R_2,R_3,R_4)=(14,9,4,1)`,
        "x와 함수값을 각각 11에서 빼면 왼쪽과 오른쪽 제한이 대응한다.",
        ["R₁", "R₂", "R₃", "R₄"],
        rc,
      ),
      S(
        "독립인 양쪽 선택 곱하기",
        R`(L_kR_k)=(14,36,36,14)`,
        "경계값을 고정하면 왼쪽과 오른쪽의 선택을 자유롭게 결합할 수 있다.",
        ["k=1", "k=2", "k=3", "k=4"],
        counts,
      ),
      S(
        "네 경우 합하기",
        R`14+36+36+14=100`,
        "경계값이 다른 경우는 중복되지 않는다.",
        ["전체 함수"],
        [counts.reduce((a, b) => a + b)],
      ),
    ],
    [
      check(
        "각 경계값 열거 합",
        counts.reduce((a, b) => a + b),
        100,
      ),
    ],
  );
}

// 2022학년도.
{
  add(
    "2022-probability-23",
    "x를 고를 다섯 위치",
    "(x+2)⁷의 x⁵ 계수를 구한다.",
    "84",
    [
      S(
        "x 선택 횟수",
        R`r=5`,
        "일곱 괄호에서 다섯 번 x를 골라야 한다.",
        ["전체 괄호", "x 선택", "2 선택"],
        [7, 5, 2],
      ),
      S(
        "선택 위치",
        R`\binom75=21`,
        "x의 다섯 위치를 정한다.",
        ["조합 수"],
        [21],
      ),
      S(
        "남은 상수 곱",
        R`\binom75 2^2=84`,
        "나머지 두 곳의 상수 곱은 4다.",
        ["조합", "상수 곱", "계수"],
        [21, 4, 84],
        2,
      ),
    ],
    [check("계수", choose(7, 5) * 4, 84)],
  );
  add(
    "2022-probability-24",
    "두 배로 확대한 이항변수의 분산",
    "X~B(n,1/3), V(2X)=40에서 n을 구한다.",
    "45",
    [
      S(
        "한 번 성공 지시변수의 분산",
        R`p(1-p)=\frac13\frac23=\frac29`,
        "독립인 n번의 지시변수를 더한 것이 X다.",
        ["성공 확률", "실패 확률", "한 번 분산"],
        [1 / 3, 2 / 3, 2 / 9],
      ),
      S(
        "배율 제곱 적용",
        R`V(2X)=4V(X)=\frac{8n}{9}=40`,
        "값을 두 배 하면 평균에서의 거리도 두 배, 거리 제곱은 네 배다.",
        ["V(X)", "V(2X)"],
        [10, 40],
      ),
      S(
        "시행 수 복원",
        R`n=40\cdot\frac98=45`,
        "n은 자연수이며 45가 모든 조건을 만족한다.",
        ["시행 수"],
        [45],
      ),
    ],
    [check("분산 검산", 4 * 45 * (1 / 3) * (2 / 3), 40)],
  );
  const triples = [];
  for (let c = 1; c <= 5; c++)
    for (let d = 1; d <= 6 - c; d++) triples.push([c, d, 7 - c - d]);
  add(
    "2022-probability-25",
    "제곱의 차로 두 수 고정",
    "다섯 자연수의 합이 12이고 |a²−b²|=5다.",
    "30",
    [
      S(
        "인수분해로 a,b 결정",
        R`|a-b|(a+b)=5\Rightarrow\{a,b\}=\{2,3\}`,
        "양의 정수 인수쌍은 1과 5뿐이다. 순서는 두 가지다.",
        ["a<b", "a>b"],
        [1, 1],
      ),
      step(
        "나머지 자연수 합",
        R`c+d+e=7\Rightarrow(c-1)+(d-1)+(e-1)=4`,
        "자연수 조건을 비음수 조건으로 바꾸어 빠짐없이 센다.",
        grid(triples, () => true, "합이 7인 양의 세 정수 15개", 5),
      ),
      S(
        "중복조합과 두 순서",
        R`2\binom{4+3-1}{3-1}=2\binom62=30`,
        "c,d,e의 순서는 구별된다. a,b의 두 순서와 곱한다.",
        ["세 정수", "a,b 순서", "전체"],
        [15, 2, 30],
        2,
      ),
    ],
    [
      check("양의 세 정수 열거", triples.length, 15),
      check("전체", 2 * triples.length, 30),
    ],
  );
  const sets = [];
  for (let a = 1; a <= 8; a++)
    for (let b = a + 1; b <= 9; b++)
      for (let c = b + 1; c <= 10; c++) sets.push([a, b, c]);
  add(
    "2022-probability-26",
    "최솟값 5 또는 6을 제외",
    "1~10의 카드 중 세 장을 골라 최솟값이 4 이하 또는 7 이상이 되는 확률이다.",
    "13/15",
    [
      step(
        "순서 없는 세 카드",
        R`\binom{10}3=120`,
        "정렬된 세 수 한 개가 한 표본이다.",
        grid(sets, () => true, "세 카드의 모든 조합", 12),
      ),
      step(
        "제외되는 최솟값",
        R`\min=5:\binom52=10,\quad\min=6:\binom42=6`,
        "5를 고르면 나머지는 6~10에서, 6을 고르면 나머지는 7~10에서 고른다.",
        grid(sets, (a) => a[0] === 5 || a[0] === 6, "여사건 16개", 12),
      ),
      S(
        "여사건의 비율 빼기",
        R`1-\frac{10+6}{120}=\frac{13}{15}`,
        "최솟값이 4 이하와 7 이상인 두 사건은 이 여사건의 정확한 보완이다.",
        ["원하는 조합", "여사건"],
        [104, 16],
        0,
      ),
    ],
    [
      check(
        "여사건 전수 열거",
        sets.filter((a) => a[0] === 5 || a[0] === 6).length,
        16,
      ),
    ],
  );
  add(
    "2022-probability-27",
    "하한이 같은 두 신뢰구간",
    "표본 100개의 95% 구간과 400개의 99% 구간은 하한이 같고 표본평균 차가 1.34다.",
    "7.84",
    [
      S(
        "두 오차 한계",
        R`h_1=0.196\sigma,\quad h_2=0.129\sigma`,
        "표본 크기의 제곱근은 각각 10,20이다.",
        ["첫 배율", "둘째 배율"],
        [0.196, 0.129],
      ),
      S(
        "같은 하한에서 중심 차",
        R`h_1-h_2=1.34\Rightarrow0.067\sigma=1.34\Rightarrow\sigma=20`,
        "하한을 빼서 같게 놓으면 표본평균 차가 오차 한계 차와 같다.",
        ["h₁", "h₂", "차"],
        [3.92, 2.58, 1.34],
        2,
      ),
      step(
        "첫 구간의 길이",
        R`b-a=2h_1=7.84`,
        "그림은 공통 하한을 0으로 옮긴 상대 좌표다. 첫 구간 중심은 하한에서 3.92만큼 오른쪽이다.",
        interval(3.92, 3.92, "공통 하한 기준 첫 신뢰구간"),
      ),
    ],
    [
      check("표준편차", 1.34 / (0.196 - 0.129), 20),
      check("길이", (2 * 1.96 * 20) / 10, 7.84),
    ],
  );
  const fn = product(4, 5).filter((a) =>
      a.every((v, i) => v >= Math.sqrt(i + 1)),
    ),
    onto = fn.filter((a) => new Set(a).size === 3),
    ranges = [
      [1, 2, 3],
      [1, 2, 4],
      [1, 3, 4],
      [2, 3, 4],
    ],
    cts = ranges.map(
      (r) => onto.filter((a) => a.every((v) => r.includes(v))).length,
    );
  add(
    "2022-probability-28",
    "허용값과 치역 세 개의 교집합",
    "f:{1,…,5}→{1,…,4}, f(x)≥√x이며 치역의 원소가 세 개다.",
    "128",
    [
      S(
        "입력별 허용값",
        R`f(1)\in\{1,2,3,4\};\ f(2),f(3),f(4)\in\{2,3,4\};\ f(5)\in\{3,4\}`,
        "정수 함수값이므로 √x 이상 조건을 올림하여 적용한다.",
        ["x=1", "2", "3", "4", "5"],
        [4, 3, 3, 3, 2],
      ),
      step(
        "부등식만 만족한 함수",
        R`4\cdot3^3\cdot2=216`,
        "다섯 함수값을 실제로 열거한다.",
        grid(fn, () => true, "허용값 조건을 만족한 216개", 18),
      ),
      S(
        "1과 2를 모두 쓰는 치역",
        R`\{1,2,3\}:7,\quad\{1,2,4\}:7`,
        "1은 f(1)에서만 가능하고 마지막 값은 3 또는 4로 고정된다. 가운데 세 값에서 2가 적어도 한 번 필요하므로 2³−1이다.",
        ["123", "124"],
        cts.slice(0, 2),
      ),
      S(
        "나머지 두 치역",
        R`\{1,3,4\}:2^4-2=14,\quad\{2,3,4\}:2(3^4-2\cdot2^4+1)=100`,
        "234의 경우 f(5)를 3 또는 4로 정하고 첫 네 값에 나머지 두 값이 모두 나오게 포함배제를 적용한다.",
        ["134", "234"],
        cts.slice(2),
      ),
      step(
        "치역이 정확히 세 개인 함수",
        R`7+7+14+100=128`,
        "치역별 경우는 서로 겹치지 않는다.",
        grid(fn, (a) => new Set(a).size === 3, "최종 조건을 만족한 128개", 18),
      ),
    ],
    [
      check("허용값 열거", fn.length, 216),
      check("치역 세 개 열거", onto.length, 128),
    ],
  );
  const f = (x) => (x < 3 ? x / 12 : x <= 5 ? 0.25 : (6 - x) / 4),
    g = (x) => 1 / 3 - f(x),
    m = (kind, lo, hi) =>
      frame({
        range: [-0.3, 6.3, -0.04, 0.4],
        lines: [
          curve(f, 0, 3),
          curve(f, 3, 5),
          curve(f, 5, 6),
          line(p(0, 1 / 3), p(6, 1 / 3), C.orange),
          ...(kind === "g"
            ? [
                curve(g, 0, 3, C.green),
                curve(g, 3, 5, C.green),
                curve(g, 5, 6, C.green),
              ]
            : []),
        ],
        surfaces:
          lo == null
            ? []
            : [
                surface(
                  [
                    p(lo),
                    ...curve(kind === "g" ? g : f, lo, hi, C.green, 120).points,
                    p(hi),
                  ],
                  C.green,
                  0.23,
                ),
              ],
        description:
          kind === "g"
            ? "초록 밀도 g=1/3−f의 실제 넓이"
            : "원문 f의 사다리꼴 밀도",
      });
  add(
    "2022-probability-29",
    "두 밀도의 합을 직사각형으로",
    "0~6에서 f+g=k. f는 (0,0),(3,1/4),(5,1/4),(6,0)을 잇는 밀도다.",
    "31",
    [
      step(
        "두 밀도의 넓이 합",
        R`6k=\int_0^6(f+g)dx=2\Rightarrow k=\frac13`,
        "각 확률밀도함수의 전체 넓이는 1이다.",
        m("f", 0, 6),
      ),
      step(
        "g를 빈 부분으로 바꾸기",
        R`g(x)=\frac13-f(x),\quad 6k=2,\quad15k=5`,
        "원래 밀도 위에서 높이 1/3까지 남은 차가 g다.",
        m("g", 0, 6),
      ),
      step(
        "2부터 3까지 사다리꼴",
        R`\int_2^3g(x)dx=\frac12\left(\frac16+\frac1{12}\right)=\frac18`,
        "f(2)=1/6이고 f(3)=1/4다. g의 양 끝 높이는 1/6,1/12다.",
        m("g", 2, 3),
      ),
      step(
        "3부터 5까지 직사각형",
        R`\int_3^5g(x)dx=2\left(\frac13-\frac14\right)=\frac16`,
        "이 구간에서 g의 높이는 일정한 1/12이다.",
        m("g", 3, 5),
      ),
      S(
        "넓이와 요구값",
        R`P(2\le Y\le5)=\frac18+\frac16=\frac7{24},\quad p+q=31`,
        "확률을 기약분수로 나타내고 분자와 분모를 더한다.",
        ["첫 넓이", "둘째 넓이", "전체 확률"],
        [1 / 8, 1 / 6, 7 / 24],
        2,
      ),
    ],
    [
      check("f 전체 넓이", 0.5 * 3 * 0.25 + 2 * 0.25 + 0.5 * 0.25, 1),
      check("구간 확률", 1 / 8 + 1 / 6, 7 / 24),
    ],
  );
  const bin = product(2, 5).map((a) => a.map((v) => v - 1)),
    data = bin.map((a) => {
      let w = 0,
        b = 0,
        hit = false;
      for (const v of a) {
        v ? (w += 2) : b++;
        if (w === b) hit = true;
      }
      return { a, w, b, hit, weight: 2 ** (w / 2) * 4 ** b };
    }),
    den = data.filter((o) => o.w + o.b >= 7).reduce((s, o) => s + o.weight, 0),
    num = data
      .filter((o) => o.w + o.b >= 7 && o.hit)
      .reduce((s, o) => s + o.weight, 0);
  add(
    "2022-probability-30",
    "흰 공 두 개와 검은 공 하나의 경로",
    "주사위 5·6이면 흰 공 둘, 1~4면 검은 공 하나. 다섯 번 뒤 총수가 7 이상인 조건이다.",
    "191",
    [
      S(
        "한 번의 두 가지 이동",
        R`W:(a,b)\mapsto(a+2,b),\ P(W)=\frac13;\quad B:(a,b)\mapsto(a,b+1),\ P(B)=\frac23`,
        "흰 공과 검은 공의 증가량도, 확률도 다르다.",
        ["흰 공 가지 확률", "검은 공 가지 확률"],
        [1 / 3, 2 / 3],
      ),
      S(
        "총수 조건을 흰 시행 수로",
        R`a_5+b_5=5+N_W\ge7\iff N_W\ge2`,
        "흰 시행이 두 번 이상인 경우가 조건 사건이다.",
        ["W=2", "W=3", "W=4", "W=5"],
        [80, 40, 10, 1],
      ),
      S(
        "중간에 공 수가 같아지는 때",
        R`2N_W=k-N_W\Rightarrow k=3N_W`,
        "1≤k≤5에서 가능한 시각은 k=3뿐이며 첫 세 번에 흰 시행이 한 번이어야 한다.",
        ["가능한 k", "첫 세 번 W 수"],
        [3, 1],
      ),
      S(
        "교집합의 확률",
        R`P(E\cap F)=\binom31\frac13\left(\frac23\right)^2\left[1-\left(\frac23\right)^2\right]=\frac{60}{243}`,
        "첫 세 번에 W 한 번, 뒤 두 번에 W가 적어도 한 번 나와야 총수 조건도 성립한다.",
        ["교집합 분자", "조건의 나머지 분자"],
        [60, 71],
        0,
      ),
      S(
        "조건부확률과 답",
        R`P(F\mid E)=\frac{60/243}{131/243}=\frac{60}{131},\quad p+q=191`,
        "32개의 W/B 경로에 주사위 경우의 수 가중치를 붙여 독립적으로 검산한다.",
        ["분자", "분모", "합"],
        [60, 131, 191],
        2,
      ),
    ],
    [
      check("실제 주사위 조건 결과", den, 131 * 32),
      check("실제 교집합 결과", num, 60 * 32),
      check("조건부확률", num / den, 60 / 131),
    ],
  );
}

// 2021학년도 가형·나형. 중복 수록이어도 요구값이 다른 문항은 해당 ID의 답을 보존한다.
{
  add(
    "2021-a-4",
    "두 방향의 조건부확률",
    "P(B|A)=1/4, P(A|B)=1/3, P(A)+P(B)=7/10이다.",
    "1/10",
    [
      S(
        "교집합을 공통 단위로",
        R`x=P(A\cap B),\quad P(A)=4x,\quad P(B)=3x`,
        "조건부확률의 분모를 옮겨 같은 교집합으로 나타낸다.",
        ["A의 단위", "B의 단위"],
        [4, 3],
      ),
      S(
        "주어진 합 대입",
        R`7x=\frac7{10}\Rightarrow x=\frac1{10}`,
        "P(A)+P(B)는 합집합 확률이 아니다. 교집합을 두 번 포함한 합이다.",
        ["A", "B"],
        [0.4, 0.3],
      ),
      S(
        "서로 겹치지 않는 네 영역",
        R`P(A\cap B)=\frac1{10}`,
        "A만 0.3, 교집합 0.1, B만 0.2, 바깥 0.4로 전체를 나눈다.",
        ["A만", "교집합", "B만", "바깥"],
        [0.3, 0.1, 0.2, 0.4],
        1,
      ),
    ],
    [
      check("조건부확률 B|A", 0.1 / 0.4, 0.25),
      check("조건부확률 A|B", 0.1 / 0.3, 1 / 3),
    ],
  );
  add(
    "2021-a-6",
    "표본평균의 평균과 표준편차",
    "모집단 N(20,5²)에서 16개를 뽑은 표본평균의 평균과 표준편차의 합이다.",
    "85/4",
    [
      step(
        "원래 모집단",
        R`X\sim N(20,5^2)`,
        "한 관측값의 평균은 20, 표준편차는 5다.",
        normal(20, 5, 15, 25, "모집단의 중심과 한 표준편차"),
      ),
      step(
        "평균은 그대로 폭은 축소",
        R`\bar X\sim N\left(20,\frac{25}{16}\right)`,
        "표본평균의 표준편차는 5/4다.",
        normal(20, 1.25, 18.75, 21.25, "표본평균 분포의 좁아진 폭"),
      ),
      S(
        "요구한 합",
        R`E(\bar X)+\sigma(\bar X)=20+\frac54=\frac{85}4`,
        "분산과 표준편차를 구별한다.",
        ["평균", "표준편차", "합"],
        [20, 1.25, 21.25],
        2,
      ),
    ],
    [check("합", 20 + 5 / Math.sqrt(16), 85 / 4)],
  );
  add(
    "2021-a-9",
    "A의 양옆을 숫자 카드로",
    "문자 A~E 다섯 장과 숫자 1~4 네 장을 일렬로 놓는다. A의 바로 양옆이 숫자일 확률이다.",
    "1/6",
    [
      S(
        "아홉 카드 전체 순열",
        R`|\Omega|=9!`,
        "아홉 장은 서로 구별된다.",
        ["전체 배열"],
        [factorial(9)],
      ),
      S(
        "A 양옆 숫자 선택",
        R`{}_4P_2=4\cdot3=12`,
        "왼쪽과 오른쪽이 구별되므로 숫자 두 장을 순서 있게 고른다.",
        ["양옆 숫자 배열"],
        [12],
      ),
      S(
        "세 카드를 한 묶음으로",
        R`N=12\cdot7!`,
        "숫자-A-숫자 묶음 하나와 나머지 여섯 장을 배열한다.",
        ["성공", "나머지"],
        [12 * factorial(7), factorial(9) - 12 * factorial(7)],
        0,
      ),
      S(
        "전체와의 비율",
        R`\frac{12\cdot7!}{9!}=\frac16`,
        "묶음 안에서 A는 항상 가운데이므로 끝에 놓이는 경우가 없다.",
        ["성공 확률"],
        [1 / 6],
      ),
    ],
    [check("순열 비율", (12 * factorial(7)) / factorial(9), 1 / 6)],
  );
  add(
    "2021-a-12",
    "다른 정규분포의 꼬리 대응",
    "X~N(8,3²), Y~N(m,σ²), P(4≤X≤8)+P(Y≥8)=1/2다.",
    "0.9772",
    [
      step(
        "X의 왼쪽 구간",
        R`P(4\le X\le8)=P\left(-\frac43\le Z\le0\right)`,
        "X에서 4는 평균보다 4/3 표준편차 왼쪽이다.",
        normal(8, 3, 4, 8, "X의 주어진 구간"),
      ),
      step(
        "남은 꼬리로 Y 경계 결정",
        R`P(Y\ge8)=P\left(Z\ge\frac43\right)\Rightarrow\frac{8-m}{\sigma}=\frac43`,
        "정규분포 누적확률의 엄격한 증가로 표준화 경계가 같다.",
        normal(0, 1, 4 / 3, 3.5, "Y의 상단 꼬리가 표준정규 4/3 이후"),
      ),
      step(
        "질문 경계 표준화",
        R`\frac{8+2\sigma/3-m}{\sigma}=2`,
        "기존 경계에 2/3 표준편차를 더한다.",
        normal(0, 1, -3.5, 2, "질문의 확률은 Z≤2"),
      ),
      S(
        "제공 표 적용",
        R`P(Z\le2)=0.5+0.4772=0.9772`,
        "원문 표의 네 자리 확률을 사용한다.",
        ["절반", "0~2", "합"],
        [0.5, 0.4772, 0.9772],
        2,
      ),
    ],
    [
      check("표준화 경계", 4 / 3 + 2 / 3, 2),
      check("확률", 0.5 + 0.4772, 0.9772),
    ],
  );
  const kvalues = Array.from({ length: 16 }, (_, k) => k),
    kp = kvalues.map((k) => choose(15, k) * (1 / 3) ** k * (2 / 3) ** (15 - k));
  add(
    "2021-a-17",
    "격자 이동의 거리 기댓값",
    "주사위가 2 이하면 x방향 3, 3 이상이면 y방향 1 이동을 15번 반복한다.",
    "17",
    [
      S(
        "가로 이동 수를 K로",
        R`K\sim B\left(15,\frac13\right)`,
        "한 번의 가로 이동 확률은 2/6이다.",
        [
          "K=0",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "10",
          "11",
          "12",
          "13",
          "14",
          "15",
        ],
        kp,
        5,
      ),
      step(
        "도착점의 실제 위치",
        R`P=(3K,15-K)`,
        "각 점은 가능한 도착점이다. 모두 제1사분면에 놓인다.",
        frame({
          range: [-2, 47, -2, 17],
          dots: kvalues.map((k) => dot(p(3 * k, 15 - k), String(k), C.blue)),
          lines: [line(p(0, 15), p(45, 0), C.muted)],
          description: "가로 이동 수 0~15에 대응하는 실제 도착점",
        }),
      ),
      S(
        "직선까지 거리 단순화",
        R`X=\frac{|3(3K)+4(15-K)|}{5}=12+K`,
        "3x+4y=0까지 거리이며 분자가 항상 양수라 절댓값을 없앨 수 있다.",
        ["K=0 거리", "K=5 거리", "K=15 거리"],
        [12, 17, 27],
      ),
      S(
        "기댓값 선형성",
        R`E(X)=12+E(K)=12+15\cdot\frac13=17`,
        "거리의 선형식에 평균을 대입한다.",
        ["상수 부분", "평균 이동 수", "평균 거리"],
        [12, 5, 17],
        2,
      ),
    ],
    [
      check(
        "확률 합",
        kp.reduce((s, v) => s + v),
        1,
      ),
      check(
        "분포로 거리 검산",
        kp.reduce((s, v, k) => s + v * (12 + k), 0),
        17,
      ),
    ],
  );
  const dice3 = product(6, 3),
    dice4 = product(6, 4),
    sum10 = (a) => a.reduce((s, v) => s + v, 0) === 10,
    n3 = dice3.filter(sum10).length,
    n4 = dice4.filter(sum10).length,
    total = (0.4 * n3) / 216 + (0.6 * n4) / 1296;
  for (const [id, result, last] of [
    ["2021-a-19", "47/540", false],
    ["2021-b-29", "587", true],
  ])
    add(
      id,
      "공의 숫자가 정하는 주사위 횟수",
      "3 공 두 개와 4 공 세 개 중 뽑은 숫자만큼 주사위를 던져 눈의 합을 기록한다. 점수가 10일 확률이다.",
      result,
      [
        S(
          "두 분기의 선택 확률",
          R`P(3)=\frac25,\quad P(4)=\frac35`,
          "3이면 세 번, 4이면 네 번 던진다. 두 분기는 서로 배반이다.",
          ["세 번 분기", "네 번 분기"],
          [0.4, 0.6],
        ),
        step(
          "세 번의 합이 10",
          R`N_3=27,\quad P(S_3=10)=\frac{27}{216}=\frac18`,
          "세 눈의 순서열 216개에서 합이 10인 27개를 직접 센다.",
          grid(dice3, sum10, "세 주사위의 합 10", 18),
        ),
        step(
          "네 번의 합이 10",
          R`N_4=\binom93-4=80,\quad P(S_4=10)=\frac{80}{1296}`,
          "양의 정수 네 개의 합이 10인 84개에서 어느 한 눈이 7인 네 경우를 제외한다.",
          grid(dice4, sum10, "네 주사위의 합 10", 36),
        ),
        S(
          "분기 확률을 곱해 더하기",
          R`\frac25\frac18+\frac35\frac{80}{1296}=\frac1{20}+\frac1{27}=\frac{47}{540}`,
          "각 가지의 조건부확률에 그 가지를 선택할 확률을 곱한다.",
          ["세 번 기여", "네 번 기여", "전체 확률"],
          [1 / 20, 1 / 27, total],
          2,
        ),
        ...(last
          ? [
              S(
                "분모와 분자의 합",
                R`p+q=540+47=587`,
                "나형은 확률 자체 대신 기약분수의 분모와 분자 합을 묻는다.",
                ["분모", "분자", "합"],
                [540, 47, 587],
                2,
              ),
            ]
          : []),
      ],
      [
        check("세 번 열거", n3, 27),
        check("네 번 열거", n4, 80),
        check("전체 확률", total, 47 / 540),
      ],
    );
  add(
    "2021-a-22",
    "음의 지수가 섞인 이항전개",
    "(x+3/x²)⁵의 x² 계수를 구한다.",
    "15",
    [
      S(
        "일반항의 지수",
        R`\binom5r x^{5-r}(3x^{-2})^r=\binom5r3^r x^{5-3r}`,
        "두 종류의 항을 선택한 횟수로 지수를 정리한다.",
        ["r=0 지수", "r=1", "r=2"],
        [5, 2, -1],
      ),
      S(
        "목표 지수 대입",
        R`5-3r=2\Rightarrow r=1`,
        "상수 배율 3이 있는 항을 한 번 고른다.",
        ["선택 수"],
        [1],
      ),
      S(
        "계수 계산",
        R`\binom513=15`,
        "다섯 위치 각각에서 계수 3이 생긴다.",
        ["위치 수", "배율", "계수"],
        [5, 3, 15],
        2,
      ),
    ],
    [check("계수", choose(5, 1) * 3, 15)],
  );
  const seating = permutations(["A", "C", "D", "E", "F"]).map((a) => [
      "B",
      ...a,
    ]),
    adj = (a, s) => [1, 5].includes(a.indexOf(s));
  add(
    "2021-a-26",
    "이웃 조건이 있는 원순열",
    "여섯 학생 중 A와 B는 이웃하고 B와 C는 이웃하지 않게 원탁에 앉힌다.",
    "36",
    [
      step(
        "B를 고정해 회전 중복 제거",
        R`5!=120`,
        "B를 기준 자리로 고정한다. 반사는 다른 배열이다.",
        grid(seating, () => true, "B를 고정한 실제 120개 원순열", 12),
      ),
      step(
        "A를 B의 양옆으로",
        R`2\cdot4!=48`,
        "A는 B의 왼쪽 또는 오른쪽 두 자리 중 하나에 앉는다.",
        grid(seating, (a) => adj(a, "A"), "A,B 이웃 조건", 12),
      ),
      step(
        "C는 나머지 세 자리로",
        R`2\cdot3\cdot3!=36`,
        "C는 B의 두 이웃 자리를 모두 피한다. 남은 세 학생을 자유롭게 배열한다.",
        grid(
          seating,
          (a) => adj(a, "A") && !adj(a, "C"),
          "두 조건을 모두 만족한 36개",
          12,
        ),
      ),
    ],
    [
      check(
        "원순열 전수검산",
        seating.filter((a) => adj(a, "A") && !adj(a, "C")).length,
        36,
      ),
    ],
  );
  const comps = compositions(6, 4),
    hats = [];
  for (const black of comps)
    if (black[0] >= 4)
      for (const white of comps)
        if (
          black.every((v, i) => v + white[i] >= 1) &&
          black.filter((v, i) => v > white[i]).length === 2 &&
          black[0] > white[0]
        )
          hats.push({ black, white });
  const hc = [
    hats.filter((o) => o.black[0] === 4 && Math.max(...o.black.slice(1)) === 2)
      .length,
    hats.filter((o) => o.black[0] === 4 && Math.max(...o.black.slice(1)) === 1)
      .length,
    hats.filter((o) => o.black[0] === 5).length,
  ];
  add(
    "2021-a-29",
    "두 색 모자 배분의 대소 조건",
    "네 학생에게 검은 모자 6개와 흰 모자 6개를 모두 나눈다. 각자 하나 이상, A의 검은 모자는 4개 이상이며 검은색이 흰색보다 많은 학생은 A 포함 두 명이다.",
    "201",
    [
      S(
        "A의 검은 모자 개수",
        R`b_A=4\ \text{또는}\ 5`,
        "A 이외에도 검은색이 더 많은 학생이 한 명 필요하므로 A가 검은색 6개를 독점할 수 없다.",
        ["A=4", "A=5"],
        [4, 5],
      ),
      S(
        "A=4, 다른 한 명에게 검은색 둘",
        R`3\left[\binom62-1+\binom52\right]=72`,
        "그 학생의 흰 모자는 0 또는 1개다. 나머지 두 학생에게 흰색 하나씩을 먼저 주고 A의 흰색이 4개가 되는 경우를 제외한다.",
        ["흰색 0인 경우", "흰색 1인 경우"],
        [3 * 14, 3 * 10],
      ),
      S(
        "A=4, 둘에게 검은색 하나씩",
        R`3\cdot2\left(\binom62-1\right)=84`,
        "검은색이 더 많은 다른 한 명을 고르고, 나머지 검은색을 받을 학생을 고른다. 그 한 명은 흰색 0개여야 한다.",
        ["해당 배분"],
        [hc[1]],
      ),
      S(
        "A=5, 다른 한 명에게 검은색 하나",
        R`3\binom62=45`,
        "다른 한 명은 흰색이 0개이며 나머지 두 학생은 흰색 하나 이상이다. A는 흰색 최대 4개라 자동으로 대소 조건을 만족한다.",
        ["해당 배분"],
        [hc[2]],
      ),
      S(
        "모든 배분 합하기",
        R`72+84+45=201`,
        "두 색 각각의 비음수 정수 배분을 전수 검사해 원문 조건을 직접 검산한다.",
        ["검은색 4+2", "4+1+1", "5+1", "전체"],
        [...hc, hats.length],
        3,
      ),
    ],
    [
      check("검은색 4+2", hc[0], 72),
      check("검은색 4+1+1", hc[1], 84),
      check("검은색 5+1", hc[2], 45),
      check("모자 배분 총합", hats.length, 201),
    ],
  );
  add(
    "2021-b-5",
    "독립과 같은 주변확률",
    "A,B가 독립이며 P(A|B)=P(B), P(A∩B)=1/9이다.",
    "1/3",
    [
      S(
        "독립에서 조건 제거",
        R`P(A\mid B)=P(A)\Rightarrow P(A)=P(B)=p`,
        "교집합이 양수라 P(B)>0이며 조건부확률이 정의된다.",
        ["A 배율", "B 배율"],
        [1, 1],
      ),
      S(
        "곱으로 교집합 표현",
        R`p^2=\frac19\Rightarrow p=\frac13`,
        "확률은 음수가 될 수 없으므로 양의 제곱근을 고른다.",
        ["P(A)", "P(B)", "교집합"],
        [1 / 3, 1 / 3, 1 / 9],
        2,
      ),
      S(
        "분할 영역 검산",
        R`P(A\setminus B)=P(B\setminus A)=\frac29`,
        "네 영역의 합이 1이 된다.",
        ["A만", "교집합", "B만", "바깥"],
        [2 / 9, 1 / 9, 2 / 9, 4 / 9],
      ),
    ],
    [check("독립 교집합", (1 / 3) ** 2, 1 / 9)],
  );
  const dice = product(6, 3),
    pass = (a) => a.reduce((s, v) => s * v, 1) === 4;
  add(
    "2021-b-8",
    "세 주사위의 곱 4",
    "세 번의 눈 a,b,c가 abc=4를 만족하는 확률이다.",
    "1/36",
    [
      step(
        "순서 있는 세 눈",
        R`6^3=216`,
        "세 번의 시각을 구별한다.",
        grid(dice, () => true, "세 주사위 실제 순서열", 18),
      ),
      S(
        "소인수로 가능한 유형 찾기",
        R`(1,1,4),\quad(1,2,2)`,
        "곱에 3 또는 5가 포함될 수 없으며 2의 지수 합이 2여야 한다.",
        ["114 순열", "122 순열"],
        [3, 3],
      ),
      step(
        "여섯 성공 결과",
        R`\frac{3+3}{216}=\frac1{36}`,
        "각 유형의 중복순열이 세 개씩이다.",
        grid(dice, pass, "곱이 4인 여섯 결과", 18),
      ),
    ],
    [check("곱 조건 전수검산", dice.filter(pass).length, 6)],
  );
  const ff = product(4, 4),
    ok = (a) => a[1] <= a[2] && a[2] <= a[3];
  add(
    "2021-b-13",
    "세 함수값의 비감소 배열",
    "f:{1,2,3,4}→{1,2,3,4}에서 f(2)≤f(3)≤f(4)다.",
    "80",
    [
      S(
        "자유로운 f(1)",
        R`f(1):4\text{가지}`,
        "첫 함수값은 뒤 세 값의 순서 조건과 독립이다.",
        ["첫 값"],
        [4],
      ),
      S(
        "뒤 세 값의 중복조합",
        R`{}_4H_3=\binom63=20`,
        "네 값 중 중복 허용 세 개를 고르면 비감소 순서가 유일하다.",
        ["뒤 세 값"],
        [20],
      ),
      step(
        "두 선택 결합",
        R`4\cdot20=80`,
        "전체 4⁴개 함수에서 실제 순서 조건을 검사한다.",
        grid(ff, ok, "순서 조건을 만족한 80개 함수", 16),
      ),
    ],
    [check("함수 전수검산", ff.filter(ok).length, 80)],
  );
  add(
    "2021-b-22",
    "x 하나를 선택하는 이항계수",
    "(3x+1)⁸의 x 계수를 구한다.",
    "24",
    [
      S(
        "x의 지수는 선택 횟수",
        R`r=1`,
        "여덟 괄호에서 한 번만 3x를 선택한다.",
        ["3x 선택", "1 선택"],
        [1, 7],
      ),
      S(
        "선택 위치와 상수",
        R`\binom81\cdot3\cdot1^7`,
        "위치는 여덟 곳이며 각 위치가 계수 3을 준다.",
        ["위치", "배율"],
        [8, 3],
      ),
      S(
        "계수 완성",
        R`8\cdot3=24`,
        "같은 x항의 계수를 더한다.",
        ["계수"],
        [24],
      ),
    ],
    [check("계수", choose(8, 1) * 3, 24)],
  );
}

// 2020학년도.
{
  add(
    "2020-a-4",
    "양과 음의 지수 함께 정리",
    "(2x+1/x²)⁴의 x 계수를 구한다.",
    "32",
    [
      S(
        "역수 항 r개 선택",
        R`\binom4r(2x)^{4-r}(x^{-2})^r=\binom4r2^{4-r}x^{4-3r}`,
        "x 지수는 4−3r이다.",
        ["r=0", "r=1", "r=2"],
        [4, 1, -2],
      ),
      S(
        "목표 지수 1",
        R`4-3r=1\Rightarrow r=1`,
        "역수 항을 한 번 고른다.",
        ["역수 항 선택 수"],
        [1],
      ),
      S(
        "선택 위치와 2의 곱",
        R`\binom412^3=32`,
        "나머지 세 괄호의 계수 2를 모두 곱한다.",
        ["위치", "2³", "계수"],
        [4, 8, 32],
        2,
      ),
    ],
    [check("계수", choose(4, 1) * 8, 32)],
  );
  add(
    "2020-a-6",
    "흰 공 둘 검은 공 둘",
    "흰 공 3개와 검은 공 4개 중 네 개를 동시에 꺼낸다.",
    "18/35",
    [
      S(
        "전체 네 공 조합",
        R`\binom74=35`,
        "꺼내는 순서를 구별하지 않는다.",
        ["전체"],
        [35],
      ),
      S(
        "색별로 두 개씩",
        R`\binom32\binom42=3\cdot6=18`,
        "흰 공 선택과 검은 공 선택을 결합한다.",
        ["흰 공 선택", "검은 공 선택", "성공 조합"],
        [3, 6, 18],
        2,
      ),
      S(
        "성공 비율",
        R`P=\frac{18}{35}`,
        "전체 35개 조합의 확률이 같다.",
        ["성공", "나머지"],
        [18, 17],
        0,
      ),
    ],
    [check("확률", (choose(3, 2) * choose(4, 2)) / choose(7, 4), 18 / 35)],
  );
  const vp = [1 / 6, 1 / 3, 1 / 2],
    mu = 7 / 3,
    v = vp.reduce((s, p, i) => s + p * (i + 1 - mu) ** 2, 0);
  add(
    "2020-a-14",
    "한 번·평균·합의 분산 비교",
    "1 공 10개, 2 공 20개, 3 공 30개에서 복원추출 열 번의 합 Y를 구한다.",
    "37/6",
    [
      S(
        "한 번의 실제 확률분포",
        R`P(X=1)=\frac16,\ P(X=2)=\frac13,\ P(X=3)=\frac12`,
        "공 60개에서 각 숫자의 비율을 읽는다.",
        ["1", "2", "3"],
        vp,
      ),
      S(
        "평균에서의 제곱거리",
        R`E(X)=\frac73,\quad V(X)=6-\left(\frac73\right)^2=\frac59`,
        "제곱평균 E(X²)=6에서 평균의 제곱을 뺀다.",
        ["E(X²)", "E(X)²", "V(X)"],
        [6, 49 / 9, v],
        2,
      ),
      S(
        "평균과 합의 분산",
        R`V(\bar X)=\frac1{18},\quad V(Y)=100V(\bar X)=\frac{50}9`,
        "독립인 열 관측의 평균과 합은 서로 10배 관계다.",
        ["한 번 분산", "평균 분산", "합 분산"],
        [5 / 9, 1 / 18, 50 / 9],
      ),
      S(
        "세 빈칸 합",
        R`p+q+r=\frac59+\frac1{18}+\frac{50}9=\frac{37}6`,
        "요구값은 세 분산의 합이다.",
        ["합"],
        [37 / 6],
      ),
    ],
    [check("모분산", v, 5 / 9), check("요구 합", v + v / 10 + v * 10, 37 / 6)],
  );
  const comps = compositions(9, 3),
    all = Array.from({ length: 5 }, (_, d) =>
      comps.map(([a, b, e]) => [a, b, e + d, d]),
    ).flat();
  add(
    "2020-a-16",
    "차를 새 비음수 변수로",
    "a+b+c−d=9, 0≤d≤4, c≥d인 비음수 정수 순서쌍을 센다.",
    "275",
    [
      S(
        "c−d를 새 변수로",
        R`e=c-d\ge0\Rightarrow a+b+e=9`,
        "c≥d 조건 덕분에 e가 비음수다. 역변환은 c=e+d로 유일하다.",
        ["자유로운 d 값 수"],
        [5],
      ),
      step(
        "세 비음수 변수의 합",
        R`\binom{9+3-1}{3-1}=\binom{11}2=55`,
        "점 하나가 a,b,e의 실제 해다.",
        grid(comps, () => true, "비음수 해 55개", 11),
      ),
      S(
        "d의 다섯 선택 결합",
        R`5\cdot55=275`,
        "각 해에 d=0,1,2,3,4를 자유롭게 결합한다.",
        ["d=0", "1", "2", "3", "4"],
        [55, 55, 55, 55, 55],
      ),
      S(
        "역변환 검산",
        R`c=e+d,\quad a+b+c-d=9`,
        "모든 생성 결과가 원래 부등식과 방정식을 만족한다.",
        ["전체 순서쌍"],
        [all.length],
      ),
    ],
    [
      check(
        "전수검산",
        all.filter(([a, b, c, d]) => a + b + c - d === 9 && d <= 4 && c >= d)
          .length,
        275,
      ),
    ],
  );
  add(
    "2020-a-18",
    "밀도 조건 안에서 구간확률 최대",
    "X~N(10,2²), Y~N(m,2²), f(12)≤g(20)이며 P(21≤Y≤24)를 최대화한다.",
    "0.5328",
    [
      step(
        "같은 높이는 평균에서 같은 거리",
        R`f(12)\le g(20)\iff|20-m|\le2\iff18\le m\le22`,
        "표준편차가 같아 밀도는 평균에서 가까울수록 높다.",
        normal(10, 2, 10, 12, "X에서 평균과 12의 거리 2"),
      ),
      step(
        "구간의 중심에 평균 접근",
        R`\text{구간 중심}=22.5,\quad m\le22<22.5`,
        "길이 3인 구간은 평균을 중심에 가까이 옮길수록 넓이가 커진다. 허용된 최대 평균은 22다.",
        normal(20, 2, 21, 24, "이동 전 m=20의 구간 넓이"),
      ),
      step(
        "허용 경계 m=22",
        R`P(21\le Y\le24)=P(-0.5\le Z\le1)`,
        "m=22에서 구간 중심까지 거리가 최소다.",
        normal(22, 2, 21, 24, "최대가 되는 실제 분포"),
      ),
      S(
        "제공 표로 넓이 합",
        R`0.1915+0.3413=0.5328`,
        "평균 왼쪽과 오른쪽의 넓이를 더한다.",
        ["−0.5~0", "0~1", "합"],
        [0.1915, 0.3413, 0.5328],
        2,
      ),
    ],
    [
      check("표 계산", 0.1915 + 0.3413, 0.5328),
      check("밀도 경계 거리", Math.abs(20 - 22), 2),
    ],
  );
  const coin = product(2, 7).map((a) => a.map((v) => v - 1)),
    count = (a) => a.reduce((s, v) => s + v, 0),
    adj = (a) => a.some((v, i) => v && a[i + 1]);
  add(
    "2020-a-20",
    "앞면 횟수와 연속 조건",
    "동전 일곱 번에서 앞면이 세 번 이상이고 앞면이 연속하는 경우가 있어야 한다.",
    "11/16",
    [
      step(
        "일곱 번의 128개 배열",
        R`2^7=128`,
        "0은 뒷면, 1은 앞면인 실제 수열을 열거한다.",
        grid(coin, () => true, "모든 동전 결과", 16),
      ),
      step(
        "앞면 세 번 이상",
        R`128-\left[\binom70+\binom71+\binom72\right]=99`,
        "앞면 수가 0,1,2인 경우를 뺀다.",
        grid(coin, (a) => count(a) >= 3, "횟수 조건 99개", 16),
      ),
      S(
        "연속하지 않는 경우 제외",
        R`\binom53+\binom44=10+1=11`,
        "앞면 3개 또는 4개를 뒷면의 틈에 한 개씩 넣는다. 앞면 5개 이상이면 연속을 피할 수 없다.",
        ["앞면 3 비연속", "앞면 4 비연속"],
        [10, 1],
      ),
      step(
        "두 조건의 교집합",
        R`\frac{99-11}{128}=\frac{11}{16}`,
        "앞면 세 번 이상인 결과 중 인접 앞면이 있는 88개만 남긴다.",
        grid(coin, (a) => count(a) >= 3 && adj(a), "최종 88개", 16),
      ),
    ],
    [
      check("횟수 조건", coin.filter((a) => count(a) >= 3).length, 99),
      check(
        "두 조건 전수검산",
        coin.filter((a) => count(a) >= 3 && adj(a)).length,
        88,
      ),
    ],
  );
  add(
    "2020-a-23",
    "이항평균으로 성공확률 복원",
    "X~B(80,p), E(X)=20일 때 분산을 구한다.",
    "15",
    [
      S(
        "평균 식",
        R`80p=20\Rightarrow p=\frac14`,
        "한 번 성공확률은 전체 평균을 시행 수로 나눈 값이다.",
        ["성공", "실패"],
        [0.25, 0.75],
      ),
      S(
        "독립 시행의 분산",
        R`V(X)=80p(1-p)`,
        "한 번의 분산 p(1−p)를 80번 합한다.",
        ["한 번 분산", "시행 수"],
        [3 / 16, 80],
      ),
      S(
        "수치 대입",
        R`V(X)=80\cdot\frac14\cdot\frac34=15`,
        "평균 20에 실패확률 3/4를 곱해도 같다.",
        ["평균", "분산"],
        [20, 15],
        1,
      ),
    ],
    [check("분산", 80 * 0.25 * 0.75, 15)],
  );
  const ab = [
      [3, 0],
      [4, 1],
      [5, 2],
    ],
    ct = ab.map(([a, b]) => choose(5, a) * choose(4, b));
  add(
    "2020-a-25",
    "두 이항 횟수의 차",
    "주사위 다섯 번의 홀수 횟수 a와 동전 네 번의 앞면 횟수 b에 대해 a−b=3이다.",
    "137",
    [
      S(
        "두 횟수의 분포",
        R`a\sim B(5,1/2),\quad b\sim B(4,1/2)`,
        "각 시행의 두 범주는 확률이 1/2이며 두 묶음은 독립이다.",
        ["주사위 횟수", "동전 횟수"],
        [5, 4],
      ),
      S(
        "가능한 횟수쌍",
        R`(a,b)=(3,0),(4,1),(5,2)`,
        "0≤a≤5, 0≤b≤4를 차 조건에 대입한다.",
        ["(3,0)", "(4,1)", "(5,2)"],
        ct,
      ),
      S(
        "같은 분모로 합산",
        R`P=\frac{10+20+6}{2^9}=\frac9{128}`,
        "각 횟수쌍의 조합 수를 곱하여 더한다.",
        ["성공", "나머지"],
        [36, 476],
        0,
      ),
      S(
        "요구 합",
        R`p+q=128+9=137`,
        "기약분수의 분모와 분자를 더한다.",
        ["답"],
        [137],
      ),
    ],
    [
      check(
        "성공 경우의 수",
        ct.reduce((a, b) => a + b),
        36,
      ),
      check("확률", 36 / 512, 9 / 128),
    ],
  );
  const words = product(6, 5),
    valid = (a) =>
      [1, 2, 3, 4, 5, 6].every((v) => {
        const n = a.filter((x) => x === v).length;
        return n === 0 || n === (v % 2 ? 1 : 2);
      }),
    ww = words.filter(valid);
  add(
    "2020-a-28",
    "홀수 한 번과 짝수 두 번",
    "1~6으로 만든 다섯 자리 수에서 각 홀수는 0·1번, 각 짝수는 0·2번만 사용한다.",
    "450",
    [
      S(
        "사용한 숫자 종류 수",
        R`o+2e=5,\quad(o,e)=(3,1),(1,2)`,
        "홀수와 짝수 종류가 각각 최대 세 개라는 제한을 함께 적용한다.",
        ["홀수 3 짝수 1", "홀수 1 짝수 2"],
        [1, 1],
      ),
      S(
        "홀수 셋 짝수 하나",
        R`\binom33\binom31\frac{5!}{2!}=180`,
        "짝수 하나가 두 번 반복된다.",
        ["선택", "배열", "경우"],
        [3, 60, 180],
        2,
      ),
      S(
        "홀수 하나 짝수 둘",
        R`\binom31\binom32\frac{5!}{2!2!}=270`,
        "두 짝수가 각각 두 번 반복되어 두 개의 2!로 나눈다.",
        ["선택", "배열", "경우"],
        [9, 30, 270],
        2,
      ),
      S(
        "두 경우 합과 전수검산",
        R`180+270=450`,
        "6⁵개의 실제 숫자 배열을 검사해도 450개다.",
        ["첫 유형", "둘째 유형", "전체"],
        [180, 270, ww.length],
        2,
      ),
    ],
    [check("실제 다섯 자리 수 열거", ww.length, 450)],
  );
  add(
    "2020-b-5",
    "A 바깥의 B를 합치기",
    "P(Aᶜ)=2/3, P(Aᶜ∩B)=1/4에서 합집합 확률을 구한다.",
    "7/12",
    [
      S(
        "A의 확률 복원",
        R`P(A)=1-\frac23=\frac13`,
        "여사건을 1에서 뺀다.",
        ["A", "A 바깥"],
        [1 / 3, 2 / 3],
      ),
      S(
        "겹치지 않는 두 조각",
        R`A\cup B=A\sqcup(A^c\cap B)`,
        "B 중 A 바깥에 있는 부분만 새로 더하면 중복이 없다.",
        ["A", "A 바깥의 B"],
        [1 / 3, 1 / 4],
      ),
      S(
        "합집합 완성",
        R`P(A\cup B)=\frac13+\frac14=\frac7{12}`,
        "나머지 5/12가 두 사건 모두 아닌 부분이다.",
        ["합집합", "바깥"],
        [7 / 12, 5 / 12],
        0,
      ),
    ],
    [check("합집합", 1 / 3 + 1 / 4, 7 / 12)],
  );
  add(
    "2020-b-9",
    "생태연구 선택자 안의 여학생",
    "남학생 문화40·생태60, 여학생 문화50·생태50인 200명 자료다.",
    "5/11",
    [
      S(
        "전체 표의 네 칸",
        R`40+60+50+50=200`,
        "처음 표본공간은 학생 200명이다.",
        ["남 문화", "남 생태", "여 문화", "여 생태"],
        [40, 60, 50, 50],
      ),
      S(
        "생태연구 열만 남기기",
        R`N(\text{생태})=60+50=110`,
        "조건에 따라 분모를 생태연구 선택자 110명으로 바꾼다.",
        ["남 생태", "여 생태"],
        [60, 50],
        1,
      ),
      S(
        "조건 내부 비율",
        R`P(\text{여}\mid\text{생태})=\frac{50}{110}=\frac5{11}`,
        "200명이 아니라 조건을 만족한 110명으로 나눈다.",
        ["여학생", "남학생"],
        [5 / 11, 6 / 11],
        0,
      ),
    ],
    [check("조건부확률", 50 / 110, 5 / 11)],
  );
  add(
    "2020-b-13",
    "파프리카 무게 구간의 표준화",
    "무게는 N(180,20²)이고 190~210g일 확률을 구한다.",
    "0.2417",
    [
      step(
        "원래 단위의 구간",
        R`P(190\le X\le210)`,
        "평균 180g에서 10~30g 오른쪽 구간이다.",
        normal(180, 20, 190, 210, "실제 무게 구간"),
      ),
      step(
        "표준편차 단위로 변경",
        R`Z=\frac{X-180}{20},\quad0.5\le Z\le1.5`,
        "양 끝에서 평균을 빼고 표준편차 20으로 나눈다.",
        normal(0, 1, 0.5, 1.5, "표준화한 구간"),
      ),
      S(
        "표의 누적 넓이 차",
        R`0.4332-0.1915=0.2417`,
        "0~1.5에서 0~0.5를 뺀다.",
        ["0~1.5", "0~0.5", "차"],
        [0.4332, 0.1915, 0.2417],
        2,
      ),
    ],
    [check("표 계산", 0.4332 - 0.1915, 0.2417)],
  );
  add(
    "2020-b-22",
    "순열과 조합의 관계",
    "₇P₂+₇C₂를 계산한다.",
    "63",
    [
      S(
        "순서를 구별하는 선택",
        R`{}_7P_2=7\cdot6=42`,
        "첫 대상 일곱 가지와 다른 둘째 대상 여섯 가지다.",
        ["순열"],
        [42],
      ),
      S(
        "순서 중복 제거",
        R`\binom72=\frac{42}{2!}=21`,
        "같은 두 대상을 두 순서로 센 것을 합친다.",
        ["조합"],
        [21],
      ),
      S(
        "요구한 합",
        R`42+21=63`,
        "순열과 조합을 더한다.",
        ["순열", "조합", "합"],
        [42, 21, 63],
        2,
      ),
    ],
    [check("합", 7 * 6 + choose(7, 2), 63)],
  );
  const candy = compositions(6, 3).filter((a) => a[0] >= 1),
    choco = compositions(5, 3).filter((a) => a[1] >= 1),
    dist = candy.flatMap((a) => choco.map((b) => ({ a, b }))),
    good = (o) => o.a[2] + o.b[2] >= 1;
  add(
    "2020-b-29",
    "두 종류 배분에서 C의 빈손 제외",
    "A는 사탕 하나 이상, B는 초콜릿 하나 이상, C는 두 종류 합해 하나 이상을 받는다.",
    "285",
    [
      S(
        "A에게 사탕 하나 먼저",
        R`a_A'=a_A-1\ge0,\quad\binom72=21`,
        "사탕 여섯 개 중 하나를 먼저 주고 남은 다섯 개를 세 명에게 나눈다.",
        ["사탕 배분"],
        [21],
      ),
      S(
        "B에게 초콜릿 하나 먼저",
        R`b_B'=b_B-1\ge0,\quad\binom62=15`,
        "초콜릿 다섯 개 중 남은 네 개를 나누면 된다.",
        ["초콜릿 배분"],
        [15],
      ),
      step(
        "첫 두 조건을 결합",
        R`21\cdot15=315`,
        "사탕 배분과 초콜릿 배분은 독립적인 선택이다.",
        grid(dist, () => true, "첫 두 조건의 실제 배분", 21),
      ),
      S(
        "C가 아무것도 못 받는 경우",
        R`6\cdot5=30`,
        "사탕의 남은 다섯 개와 초콜릿의 남은 네 개를 각각 A,B에게만 나눈다.",
        ["C 빈손", "C 수령"],
        [30, 285],
        0,
      ),
      step(
        "여사건 제외",
        R`315-30=285`,
        "각 점은 세 학생의 사탕·초콜릿 개수가 확정된 배분이다.",
        grid(dist, good, "C도 적어도 하나 받는 285개", 21),
      ),
    ],
    [
      check("전체 배분", dist.length, 315),
      check("모든 조건 검산", dist.filter(good).length, 285),
    ],
  );
}

// 2019학년도.
{
  add(
    "2019-a-4",
    "배반 조건을 포함 관계로",
    "A와 Bᶜ가 배반이며 P(A)=1/3, P(Aᶜ∩B)=1/6이다.",
    "1/2",
    [
      S(
        "A 중 B 밖은 없음",
        R`A\cap B^c=\varnothing\Rightarrow A\subseteq B`,
        "A는 전부 B 안에 놓여 있다.",
        ["A 안", "A 중 B 바깥"],
        [1 / 3, 0],
      ),
      S(
        "B를 두 영역으로 분리",
        R`B=A\sqcup(A^c\cap B)`,
        "A에 속하는 부분과 속하지 않는 부분은 겹치지 않는다.",
        ["A", "B의 나머지"],
        [1 / 3, 1 / 6],
      ),
      S(
        "두 조각 합산",
        R`P(B)=\frac13+\frac16=\frac12`,
        "B 바깥 확률도 1/2이다.",
        ["B", "바깥"],
        [0.5, 0.5],
        0,
      ),
    ],
    [check("확률", 1 / 3 + 1 / 6, 0.5)],
  );
  add(
    "2019-a-8",
    "제곱평균과 분산의 차",
    "X~B(n,1/2), E(X²)=V(X)+25이다.",
    "10",
    [
      S(
        "분산의 정의 적용",
        R`E(X^2)-V(X)=E(X)^2=25`,
        "차는 평균의 제곱이다.",
        ["평균 제곱"],
        [25],
      ),
      S(
        "음이 아닌 평균 선택",
        R`E(X)=5`,
        "X는 성공 횟수이므로 평균은 음수가 아니다.",
        ["평균"],
        [5],
      ),
      S(
        "이항평균 np",
        R`\frac n2=5\Rightarrow n=10`,
        "성공확률 1/2로 시행 수를 복원한다.",
        ["n", "np", "np(1−p)"],
        [10, 5, 2.5],
      ),
    ],
    [check("평균 제곱", (10 * 0.5) ** 2, 25)],
  );
  const gcd = (a, b) => (b ? gcd(b, a % b) : a),
    pr = pairs([2, 3, 4, 5, 6, 7, 8]);
  add(
    "2019-a-10",
    "서로소인 구슬 두 개",
    "2~8 구슬 일곱 개에서 두 개를 동시에 선택한다.",
    "2/3",
    [
      step(
        "전체 21개 조합",
        R`\binom72=21`,
        "두 수의 순서는 구별하지 않는다.",
        grid(pr, () => true, "실제 두 자연수 조합", 7),
      ),
      step(
        "공약수가 있는 경우 제외",
        R`\gcd(a,b)>1:\ \binom42+1=7`,
        "짝수 2,4,6,8끼리의 여섯 쌍과 (3,6) 한 쌍이 제외된다.",
        grid(pr, (a) => gcd(...a) > 1, "서로소가 아닌 일곱 쌍", 7),
      ),
      step(
        "서로소인 쌍",
        R`P=\frac{21-7}{21}=\frac23`,
        "각 쌍의 최대공약수를 직접 계산해 검산한다.",
        grid(pr, (a) => gcd(...a) === 1, "서로소인 열네 쌍", 7),
      ),
    ],
    [
      check(
        "최대공약수 전수검산",
        pr.filter((a) => gcd(...a) === 1).length,
        14,
      ),
    ],
  );
  const d = compositions(4, 4).map((a) => a.map((x) => x + 1));
  add(
    "2019-a-12",
    "대칭을 이용한 초콜릿 배분",
    "초콜릿 8개를 네 학생에게 하나 이상씩 주고 A가 B보다 많이 받게 한다.",
    "13",
    [
      step(
        "모두 하나 이상인 배분",
        R`\binom73=35`,
        "각자 하나씩 먼저 주고 남은 네 개를 나눈다.",
        grid(d, () => true, "실제 양의 정수 배분 35개", 7),
      ),
      S(
        "A와 B가 같은 경우",
        R`A=B=1,2,3:\quad5+3+1=9`,
        "두 학생에게 같은 수를 준 뒤 C,D에게 남은 양을 양수로 나눈다.",
        ["A=B=1", "A=B=2", "A=B=3"],
        [5, 3, 1],
      ),
      step(
        "서로 바꾸는 일대일 대응",
        R`N(A>B)=\frac{35-9}{2}=13`,
        "A,B를 바꾸면 A>B와 A<B가 짝지어진다.",
        grid(d, (a) => a[0] > a[1], "A가 더 많이 받는 13개", 7),
      ),
    ],
    [
      check("동수 배분", d.filter((a) => a[0] === a[1]).length, 9),
      check("대소 조건", d.filter((a) => a[0] > a[1]).length, 13),
    ],
  );
  add(
    "2019-a-15",
    "정규분포로 나눈 두 교통수단 비율",
    "출근시간 N(66.4,15²). 73분 이상은 40%, 미만은 20%가 지하철을 이용했다.",
    "0.266",
    [
      step(
        "73분의 표준화 위치",
        R`z=\frac{73-66.4}{15}=0.44`,
        "주어진 표에서 0~0.44 넓이는 0.17이다.",
        normal(66.4, 15, 73, 118.9, "73분 이상인 오른쪽 꼬리"),
      ),
      S(
        "출근시간 두 집단",
        R`P(T\ge73)=0.33,\quad P(T<73)=0.67`,
        "정규분포에서 한 경계점의 확률은 0이다.",
        ["73분 이상", "73분 미만"],
        [0.33, 0.67],
      ),
      S(
        "집단별 지하철 기여",
        R`0.33\cdot0.4+0.67\cdot0.2`,
        "비율 40%,20%의 단순 평균이 아니라 집단 크기로 가중한다.",
        ["긴 출근 집단 기여", "짧은 출근 집단 기여"],
        [0.132, 0.134],
      ),
      S(
        "전체 확률",
        R`P(\text{지하철})=0.266`,
        "서로 배반인 두 집단의 기여를 합한다.",
        ["지하철", "다른 교통수단"],
        [0.266, 0.734],
        0,
      ),
    ],
    [
      check("표준화", (73 - 66.4) / 15, 0.44),
      check("전확률", 0.33 * 0.4 + 0.67 * 0.2, 0.266),
    ],
  );
  const ff = product(6, 6),
    ffn = ff.filter((a) => new Set(a.map((v) => a[v - 1])).size === 5).length;
  add(
    "2019-a-17",
    "합성함수의 치역 다섯 개",
    "6원소 집합에서 f∘f의 치역이 5원소일 때 풀이 빈칸의 합을 구한다.",
    "131",
    [
      S(
        "원래 치역도 다섯 개",
        R`|f(X)|=5`,
        "치역이 6개면 순열이므로 합성도 6개다. 4개 이하면 합성 치역도 4개 이하이다.",
        ["원래 치역", "합성 치역"],
        [5, 5],
      ),
      S(
        "빠질 원소 선택",
        R`p=\binom65=6`,
        "치역 A에서 빠지는 입력 k 하나를 정한다.",
        ["치역 선택"],
        [6],
      ),
      S(
        "k의 상과 A 안의 순열",
        R`q=5,\quad r=5!=120`,
        "f(A)=A여야 하므로 A 위에서 f는 일대일 대응이다. k의 상은 A 안의 다섯 원소 중 하나다.",
        ["k의 상", "A 위 순열"],
        [5, 120],
      ),
      S(
        "함수 수와 요구값 구별",
        R`N=6\cdot5\cdot120=3600,\quad p+q+r=6+5+120=131`,
        "문항은 함수 수의 곱이 아니라 빈칸 세 수의 합을 묻는다.",
        ["함수 수", "요구한 합"],
        [ffn, 131],
        1,
      ),
    ],
    [
      check("합성함수 전수 열거", ffn, 3600),
      check("빈칸 합", 6 + 5 + factorial(5), 131),
    ],
  );
  add(
    "2019-a-22",
    "순열에서 조합 빼기",
    "₆P₂−₆C₂를 계산한다.",
    "15",
    [
      S(
        "순서 있는 선택",
        R`{}_6P_2=6\cdot5=30`,
        "서로 다른 두 원소의 순서를 구별한다.",
        ["순열"],
        [30],
      ),
      S(
        "순서 없는 선택",
        R`\binom62=\frac{30}{2}=15`,
        "각 쌍을 두 번 센 중복을 제거한다.",
        ["조합"],
        [15],
      ),
      S(
        "차 계산",
        R`30-15=15`,
        "순열은 조합의 두 배이므로 차도 조합과 같다.",
        ["순열", "조합", "차"],
        [30, 15, 15],
        2,
      ),
    ],
    [check("차", 6 * 5 - choose(6, 2), 15)],
  );
  add(
    "2019-a-26",
    "두 신뢰구간 상한의 차",
    "표본 크기 16, 첫 평균 75와 95% 구간, 둘째 평균 77과 99% 구간의 상한 차가 3.86이다.",
    "12",
    [
      S(
        "상한을 평균과 오차로",
        R`b=75+1.96\frac\sigma4,\quad d=77+2.58\frac\sigma4`,
        "표본 크기가 같아 표준오차는 같다.",
        ["첫 평균", "둘째 평균"],
        [75, 77],
      ),
      S(
        "평균 이동을 먼저 제외",
        R`3.86=2+0.62\frac\sigma4`,
        "상한 차에는 평균 차 2와 오차 한계 차가 함께 들어 있다.",
        ["중심 차", "오차 차"],
        [2, 1.86],
      ),
      step(
        "표준편차 복원과 첫 구간",
        R`\sigma=\frac{1.86\cdot4}{0.62}=12`,
        "첫 구간은 중심 75에서 양쪽 5.88이다.",
        interval(75, 5.88, "95% 신뢰구간"),
      ),
      step(
        "둘째 구간의 실제 상한",
        R`d=84.74,\quad b=80.88,\quad d-b=3.86`,
        "둘째 구간은 중심 77에서 양쪽 7.74다.",
        interval(77, 7.74, "99% 신뢰구간"),
      ),
    ],
    [
      check("모표준편차", (1.86 * 4) / 0.62, 12),
      check("상한 차", 77 + 2.58 * 3 - (75 + 1.96 * 3), 3.86),
    ],
  );
  const divisors = Array.from({ length: 6 }, (_, i) =>
      Array.from({ length: i + 1 }, (_, j) => j + 1).filter(
        (d) => (i + 1) % d === 0,
      ),
    ),
    ratios = divisors.map((a) => a.filter((v) => v % 2).length / a.length),
    ms = ratios.map((v, i) => (v === 0.5 ? i + 1 : 0)).filter(Boolean);
  add(
    "2019-a-27",
    "약수 사건과 홀수의 독립",
    "주사위 홀수 사건 A와 m의 약수 사건 B가 독립인 m≤6을 찾는다.",
    "8",
    [
      S(
        "독립 조건의 뜻",
        R`P(A\mid B)=P(A)=\frac12`,
        "m은 자연수여서 약수 1이 포함되고 P(B)>0이다. 약수 중 홀수 비율이 절반이어야 한다.",
        ["홀수 눈", "짝수 눈"],
        [3, 3],
      ),
      S(
        "각 m의 약수 수",
        R`d(m)=(1,2,2,3,2,4)`,
        "m=1부터 6까지 실제 약수를 열거한다.",
        ["m=1", "2", "3", "4", "5", "6"],
        divisors.map((a) => a.length),
      ),
      S(
        "약수 중 홀수 비율",
        R`(1,1/2,1,1/3,1,1/2)`,
        "독립 조건 1/2를 만족하는 m은 2와 6이다.",
        ["m=1", "2", "3", "4", "5", "6"],
        ratios,
      ),
      S(
        "해의 합",
        R`2+6=8`,
        "가능한 m을 모두 더한다.",
        ["m=2", "m=6", "합"],
        [2, 6, 8],
        2,
      ),
    ],
    [
      check(
        "해의 합",
        ms.reduce((a, b) => a + b),
        8,
      ),
    ],
  );
  add(
    "2019-b-6",
    "일곱 괄호에서 x 네 번",
    "(1+x)⁷의 x⁴ 계수다.",
    "35",
    [
      S(
        "x 선택 횟수",
        R`r=4`,
        "x항의 지수 합이 4가 되려면 네 괄호에서 x를 고른다.",
        ["x 선택", "1 선택"],
        [4, 3],
      ),
      S(
        "네 위치 선택",
        R`\binom74=\frac{7\cdot6\cdot5}{3\cdot2\cdot1}`,
        "선택 순서를 구별하지 않는다.",
        ["분자 곱", "중복 배수"],
        [210, 6],
      ),
      S(
        "계수",
        R`\binom74=35`,
        "각 위치 선택의 상수 곱은 1이다.",
        ["계수"],
        [35],
      ),
    ],
    [check("이항계수", choose(7, 4), 35)],
  );
  const de = (x) => (x < 1 / 3 ? (9 * x) / 4 : x <= 1 ? 0.75 : 0.75 * (2 - x)),
    dm = (lo, hi) =>
      frame({
        range: [-0.15, 2.15, -0.08, 0.95],
        lines: [curve(de, 0, 1 / 3), curve(de, 1 / 3, 1), curve(de, 1, 2)],
        surfaces: [
          surface(
            [p(lo), ...curve(de, lo, hi, C.blue, 120).points, p(hi)],
            C.green,
            0.25,
          ),
        ],
        description: "원문 꼭짓점 (0,0),(1/3,3/4),(1,3/4),(2,0)",
      });
  add(
    "2019-b-10",
    "사다리꼴 밀도의 평평한 부분",
    "밀도 높이 3/4, 왼쪽 꺾임 1/3, 오른쪽 꺾임 a, 범위 0~2다.",
    "1/2",
    [
      step(
        "전체 넓이가 1",
        R`\frac12\left(2+a-\frac13\right)\frac34=1`,
        "그림은 풀이로 결정되는 a=1을 반영한다. 전체 도형은 사다리꼴이다.",
        dm(0, 2),
      ),
      S(
        "꺾이는 위치 결정",
        R`2+a-\frac13=\frac83\Rightarrow a=1`,
        "양쪽 평행변 길이의 합을 이용한다.",
        ["a", "평평한 구간 길이"],
        [1, 2 / 3],
      ),
      step(
        "질문 구간의 직사각형",
        R`P\left(\frac13\le X\le a\right)=\left(1-\frac13\right)\frac34=\frac12`,
        "평평한 부분의 폭과 높이를 곱한다.",
        dm(1 / 3, 1),
      ),
    ],
    [
      check("전체 넓이", 0.5 * (2 + 1 - 1 / 3) * 0.75, 1),
      check("직사각형 넓이", (1 - 1 / 3) * 0.75, 0.5),
    ],
  );
  add(
    "2019-b-12",
    "신뢰구간 상한에서 하한으로",
    "모표준편차 1.4, 표본 크기 49, 95% 신뢰구간의 상한은 7.992다.",
    "7.208",
    [
      S(
        "표준오차",
        R`\frac{1.4}{\sqrt{49}}=0.2`,
        "표준편차를 7로 나눈다.",
        ["모표준편차", "표준오차"],
        [1.4, 0.2],
      ),
      S(
        "전체 길이",
        R`2\cdot1.96\cdot0.2=0.784`,
        "한쪽 오차 0.392를 두 배 한다.",
        ["반길이", "전체 길이"],
        [0.392, 0.784],
      ),
      step(
        "상한에서 길이 빼기",
        R`a=7.992-0.784=7.208`,
        "중심은 7.6이다.",
        interval(7.6, 0.392, "실제 95% 신뢰구간"),
      ),
    ],
    [check("하한", 7.992 - (2 * 1.96 * 1.4) / 7, 7.208)],
  );
  const leaves = [];
  function walk(x, y, a) {
    if (x === 3 || y === 3) {
      leaves.push({ x, y, a, prob: 2 ** -a.length });
      return;
    }
    walk(x + 1, y, [...a, 1]);
    walk(x, y + 1, [...a, 0]);
  }
  walk(0, 0, []);
  const py = leaves.filter((o) => o.y === 3).reduce((s, o) => s + o.prob, 0),
    p13 = leaves
      .filter((o) => o.y === 3 && o.x === 1)
      .reduce((s, o) => s + o.prob, 0);
  const lattice = (highlight) =>
    frame({
      range: [-0.4, 3.4, -0.4, 3.4],
      lines: leaves.flatMap((o) => {
        if (!highlight(o)) return [];
        let x = 0,
          y = 0;
        const pts = [p(0, 0)];
        for (const h of o.a) {
          h ? x++ : y++;
          pts.push(p(x, y));
        }
        return [
          { points: pts, color: o.x === 1 && o.y === 3 ? C.green : C.blue },
        ];
      }),
      dots: [dot(p(1, 3), "(1,3)", C.orange)],
      description: "x 또는 y가 처음 3이 되면 멈추는 실제 격자 경로",
      equalAspect: true,
    });
  add(
    "2019-b-18",
    "경계에서 멈추는 동전 경로",
    "앞면은 x+1, 뒷면은 y+1. 어느 좌표든 처음 3이 되면 멈춘다. y=3인 조건에서 x=1일 확률이다.",
    "3/8",
    [
      step(
        "실제 종료 경로",
        R`\tau=\min\{n:x_n=3\text{ 또는 }y_n=3\}`,
        "경로 길이가 3,4,5로 달라 각 경로 확률은 2의 음의 길이 제곱이다.",
        lattice(() => true),
      ),
      step(
        "위 경계로 끝나는 조건",
        R`P(y_\tau=3)=\frac12`,
        "x와 y를 바꾸면 오른쪽 경계와 위 경계가 일대일 대응한다. 동시에 3이 될 수 없다.",
        lattice((o) => o.y === 3),
      ),
      step(
        "종점 (1,3)의 경로",
        R`P((x_\tau,y_\tau)=(1,3))=\binom31 2^{-4}=\frac3{16}`,
        "마지막은 반드시 뒷면이다. 앞의 세 번에 앞면이 한 번 나와야 한다.",
        lattice((o) => o.y === 3 && o.x === 1),
      ),
      S(
        "조건 내부 비율",
        R`\frac{3/16}{1/2}=\frac38`,
        "종료 경로 수를 단순히 나누지 않고 길이에 따른 확률을 합한다.",
        ["교집합", "조건 확률", "조건부확률"],
        [p13, py, p13 / py],
        2,
      ),
    ],
    [
      check(
        "모든 종료경로 확률 합",
        leaves.reduce((s, o) => s + o.prob, 0),
        1,
      ),
      check("조건 확률", py, 0.5),
      check("교집합 확률", p13, 3 / 16),
    ],
  );
  const pos = product(7, 2).filter((a) => a[0] !== a[1]),
    nonadj = (a) => Math.abs(a[0] - a[1]) !== 1;
  add(
    "2019-b-28",
    "같은 숫자 두 공을 떼어 놓기",
    "흰 공 1,2,3,4와 검은 공 4,5,6을 나열할 때 두 4가 이웃하지 않아야 한다.",
    "12",
    [
      step(
        "두 4의 서로 다른 위치",
        R`7\cdot6=42`,
        "두 4는 색으로 구별된다. 나머지 다섯 공 배열 5!는 모든 위치쌍에 공통이다.",
        grid(pos, () => true, "두 4의 순서 있는 위치쌍", 7),
      ),
      step(
        "이웃한 위치쌍 제외",
        R`6\cdot2=12`,
        "이웃한 칸 여섯 쌍과 두 색의 순서 두 가지다.",
        grid(pos, (a) => !nonadj(a), "이웃한 위치쌍 12개", 7),
      ),
      step(
        "이웃하지 않는 확률",
        R`1-\frac{12}{42}=\frac57`,
        "전체 순열로 세어도 1−2·6!/7!과 같다.",
        grid(pos, nonadj, "이웃하지 않는 위치쌍 30개", 7),
      ),
      S(
        "분모와 분자 합",
        R`p+q=7+5=12`,
        "기약분수의 분모와 분자를 더한다.",
        ["답"],
        [12],
      ),
    ],
    [
      check("위치쌍 열거", pos.filter(nonadj).length, 30),
      check("확률", 30 / 42, 5 / 7),
    ],
  );
}

// 2018학년도.
{
  add(
    "2018-a-4",
    "독립 사건의 합집합 방정식",
    "P(A)=2/3, P(A∪B)=5/6이고 두 사건은 독립이다.",
    "1/2",
    [
      S(
        "독립으로 교집합 표현",
        R`p=P(B),\quad P(A\cap B)=\frac23p`,
        "합집합 공식을 미지수 p 하나로 쓴다.",
        ["A 확률", "A 여사건"],
        [2 / 3, 1 / 3],
      ),
      S(
        "합집합 식 풀기",
        R`\frac23+p-\frac23p=\frac56\Rightarrow p=\frac12`,
        "A 밖에서 B가 새로 더하는 확률은 p/3이다.",
        ["A", "A 밖의 B"],
        [2 / 3, 1 / 6],
      ),
      S(
        "네 영역 확인",
        R`P(B)=\frac12`,
        "독립 교집합은 1/3이다.",
        ["A만", "교집합", "B만", "바깥"],
        [1 / 3, 1 / 3, 1 / 6, 1 / 6],
        1,
      ),
    ],
    [check("합집합", 2 / 3 + 0.5 - (2 / 3) * 0.5, 5 / 6)],
  );
  add(
    "2018-a-6",
    "역수 항 두 개 선택",
    "(x+2/x)⁸의 x⁴ 계수를 구한다.",
    "112",
    [
      S(
        "일반항의 지수",
        R`\binom8r x^{8-r}(2x^{-1})^r=\binom8r2^r x^{8-2r}`,
        "역수 항을 선택할 때마다 최종 지수가 2씩 줄어든다.",
        ["r=0", "r=1", "r=2"],
        [8, 6, 4],
      ),
      S(
        "지수 4에 대응하는 r",
        R`8-2r=4\Rightarrow r=2`,
        "여덟 위치 중 역수 항의 위치 두 개를 고른다.",
        ["위치 수"],
        [28],
      ),
      S(
        "계수의 곱",
        R`\binom82 2^2=112`,
        "각 위치 선택은 계수 4를 만든다.",
        ["조합", "상수 곱", "계수"],
        [28, 4, 112],
        2,
      ),
    ],
    [check("계수", choose(8, 2) * 4, 112)],
  );
  add(
    "2018-a-10",
    "아홉 화장품 평균의 확률",
    "개별 내용량 N(201.5,1.8²)에서 9개 표본평균이 200g 이상일 확률이다.",
    "0.9938",
    [
      step(
        "개별 제품의 분포",
        R`X\sim N(201.5,1.8^2)`,
        "개별 제품 표준편차는 1.8g이다.",
        normal(201.5, 1.8, 200, 207.8, "개별 내용량 분포"),
      ),
      step(
        "표본평균 분포로 축소",
        R`\sigma_{\bar X}=1.8/3=0.6`,
        "평균의 표준편차를 사용해야 한다.",
        normal(201.5, 0.6, 200, 203.6, "9개 표본평균의 분포"),
      ),
      step(
        "200g의 표준화",
        R`P(\bar X\ge200)=P(Z\ge-2.5)`,
        "경계는 평균보다 2.5 표준편차 왼쪽이다.",
        normal(0, 1, -2.5, 3.5, "표준화한 오른쪽 넓이"),
      ),
      S(
        "표 값 적용",
        R`0.5+0.4938=0.9938`,
        "대칭성으로 왼쪽 2.5 구간과 오른쪽 절반을 더한다.",
        ["확률"],
        [0.9938],
      ),
    ],
    [
      check("표준화", (200 - 201.5) / 0.6, -2.5),
      check("표 계산", 0.5 + 0.4938, 0.9938),
    ],
  );
  const dice = product(6, 2),
    E = (a) => a.every((v) => v !== 6),
    F = (a) => (a[0] + a[1]) % 4 === 0;
  add(
    "2018-a-13",
    "6을 제외한 주사위 표본공간",
    "두 번 모두 6이 아닌 조건에서 두 눈의 합이 4의 배수일 확률이다.",
    "6/25",
    [
      step(
        "두 눈의 전체 배열",
        R`6^2=36`,
        "주사위 두 번의 순서를 구별한다.",
        grid(dice, () => true, "36개의 실제 눈 배열", 6),
      ),
      step(
        "6이 없는 조건",
        R`|E|=5^2=25`,
        "각 눈을 1~5로 제한한다.",
        grid(dice, E, "조건 사건 25개", 6),
      ),
      S(
        "합은 4 또는 8",
        R`4:(1,3),(2,2),(3,1);\quad8:(3,5),(4,4),(5,3)`,
        "가능한 합 2~10 중 4의 배수는 4와 8이다.",
        ["합 4", "합 8"],
        [3, 3],
      ),
      step(
        "조건부확률",
        R`P(F\mid E)=\frac6{25}`,
        "조건 25개 중 여섯 개를 고른다.",
        grid(dice, E, "조건 내부의 성공 결과", 6, F),
      ),
    ],
    [check("교집합 전수검산", dice.filter((a) => E(a) && F(a)).length, 6)],
  );
  const alloc = product(4, 4),
    single = (a) =>
      [1, 2, 3, 4].some((v) => a.filter((x) => x === v).length === 1);
  add(
    "2018-a-18",
    "공 하나인 상자가 적어도 하나",
    "서로 다른 공 네 개를 서로 다른 상자 네 개에 모두 넣는다.",
    "216",
    [
      step(
        "각 공의 상자 선택",
        R`4^4=256`,
        "각 점은 공 1~4가 들어간 상자 번호 배열이다.",
        grid(alloc, () => true, "실제 공 배치 256개", 16),
      ),
      S(
        "한 공 상자가 없는 유형",
        R`(4,0,0,0),\quad(2,2,0,0)`,
        "공 네 개를 0 또는 2 이상인 상자 개수로 분할하면 두 유형뿐이다.",
        ["한 상자에 네 개", "두 상자에 두 개씩"],
        [4, 36],
      ),
      S(
        "여사건 세기",
        R`4+\binom42\binom42=40`,
        "두 상자를 고른 다음 번호가 작은 상자에 갈 공 두 개를 고르면 중복이 없다.",
        ["여사건", "원하는 배치"],
        [40, 216],
        0,
      ),
      step(
        "하나 이상 조건 완성",
        R`256-40=216`,
        "공 하나인 상자가 두 개 이상인 배치도 한 번만 센다.",
        grid(alloc, single, "한 공 상자가 있는 216개", 16),
      ),
    ],
    [check("배치 전수검산", alloc.filter(single).length, 216)],
  );
  const stopped = [];
  function loadWeights(sum, seq, prob) {
    if (sum >= 6) {
      stopped.push({ sum, seq, prob });
      return;
    }
    loadWeights(sum + 1, [...seq, 1], prob / 3);
    loadWeights(sum + 2, [...seq, 2], (prob * 2) / 3);
  }
  loadWeights(0, [], 1);
  const mass = [3, 4, 5, 6].map((n) =>
    stopped.filter((o) => o.seq.length === n).reduce((s, o) => s + o.prob, 0),
  );
  add(
    "2018-a-19",
    "무게 6에 처음 도달하는 시각",
    "주사위 1·2면 1g, 3~6이면 2g을 넣고 총무게가 처음 6g 이상이면 멈춘다.",
    "4/9",
    [
      S(
        "한 번의 무게 분포",
        R`P(W=1)=\frac13,\quad P(W=2)=\frac23`,
        "종료 전까지 두 종류 추의 준비 수량은 충분하다.",
        ["1g", "2g"],
        [1 / 3, 2 / 3],
      ),
      S(
        "세 개에서 종료",
        R`a=P(X=3)=\left(\frac23\right)^3=\frac8{27}`,
        "처음 세 개가 모두 2g일 때만 6g에 도달한다.",
        ["X=3"],
        [8 / 27],
      ),
      S(
        "세 번 합 4에서 다음 2g",
        R`b=\binom31\left(\frac13\right)^2\frac23\frac23=\frac4{27}`,
        "첫 세 번이 1,1,2의 순열이어야 한다. 이것은 X=4 전체 확률의 한 부분이다.",
        ["빈칸 b", "X=4의 다른 부분"],
        [4 / 27, 4 / 9],
      ),
      S(
        "네 번 합 5인 경우",
        R`c=\binom41\left(\frac13\right)^3\frac23=\frac8{81}`,
        "1,1,1,2의 순열이면 다음 추 종류에 관계없이 다섯 번째에 멈춘다.",
        ["빈칸 c", "X=5의 다른 부분"],
        [8 / 81, 2 / 243],
      ),
      S(
        "전체 정지시각 분포 검산",
        R`P(X=3,4,5,6)=\left(\frac8{27},\frac{16}{27},\frac{26}{243},\frac1{243}\right)`,
        "종료 경로를 재귀적으로 열거해 확률을 더했다.",
        ["3개", "4개", "5개", "6개"],
        mass,
      ),
      S(
        "빈칸의 요구 연산",
        R`\frac{ab}{c}=\frac{(8/27)(4/27)}{8/81}=\frac49`,
        "전체 확률이 아닌 각 빈칸 a,b,c를 사용한다.",
        ["a", "b", "c", "ab/c"],
        [8 / 27, 4 / 27, 8 / 81, 4 / 9],
        3,
      ),
    ],
    [
      check(
        "정지확률 합",
        mass.reduce((a, b) => a + b),
        1,
      ),
      check("X=4 검산", mass[1], 16 / 27),
      check("요구값", ((8 / 27) * (4 / 27)) / (8 / 81), 4 / 9),
    ],
  );
  add(
    "2018-a-22",
    "다섯 개 중 세 개 선택",
    "₅C₃를 계산한다.",
    "10",
    [
      S(
        "순서 있게 세 개",
        R`5\cdot4\cdot3=60`,
        "세 번 선택의 순서를 먼저 구별한다.",
        ["순서 있는 선택"],
        [60],
      ),
      S(
        "같은 세 원소의 순서 제거",
        R`3!=6`,
        "같은 세 원소를 여섯 순서로 중복하여 셌다.",
        ["중복 배수"],
        [6],
      ),
      S(
        "조합",
        R`\binom53=60/6=10`,
        "고르는 순서를 없앤다.",
        ["조합 수"],
        [10],
      ),
    ],
    [check("조합", choose(5, 3), 10)],
  );
  add(
    "2018-a-26",
    "두 누적확률로 평균과 폭 찾기",
    "P(X≤3)=0.3, P(3≤X≤80)=0.3인 정규분포의 m+σ를 구한다.",
    "155",
    [
      step(
        "첫 경계의 표준점수",
        R`P(X\le3)=0.3\Rightarrow\frac{3-m}{\sigma}=-0.52`,
        "표의 0~0.52 넓이가 0.2이므로 왼쪽 누적 0.3은 −0.52다.",
        normal(0, 1, -3.5, -0.52, "첫 경계 −0.52"),
      ),
      step(
        "둘째 경계의 표준점수",
        R`P(X\le80)=0.6\Rightarrow\frac{80-m}{\sigma}=0.25`,
        "두 구간을 더하면 누적확률 0.6이다.",
        normal(0, 1, -3.5, 0.25, "둘째 경계 0.25"),
      ),
      S(
        "두 경계의 간격 비교",
        R`77=(0.25+0.52)\sigma\Rightarrow\sigma=100,\quad m=55`,
        "원래 단위 간격 77을 표준점수 간격 0.77로 나눈다.",
        ["평균", "표준편차"],
        [55, 100],
      ),
      step(
        "원래 단위로 복원",
        R`m+\sigma=55+100=155`,
        "복원한 분포에서 3~80 구간은 문제의 확률 0.3에 대응한다.",
        normal(55, 100, 3, 80, "실제 평균 55와 표준편차 100"),
      ),
    ],
    [
      check("첫 z", (3 - 55) / 100, -0.52),
      check("둘째 z", (80 - 55) / 100, 0.25),
      check("합", 55 + 100, 155),
    ],
  );
  const comp = compositions(10, 3),
    distinct = (a) => new Set(a).size === 3;
  add(
    "2018-a-28",
    "세 수가 모두 다른 정수 해",
    "x+y+z=10인 비음수 정수 해 중 (x−y)(y−z)(z−x)≠0인 비율이다.",
    "19",
    [
      step(
        "비음수 해 전체",
        R`\binom{12}2=66`,
        "순서쌍은 세 좌표를 구별한다.",
        grid(comp, () => true, "실제 정수 해 66개", 11),
      ),
      S(
        "두 수가 같은 경우",
        R`x=y=t:\quad t=0,1,2,3,4,5`,
        "2t+z=10에서 각 같은 좌표쌍마다 여섯 해다.",
        ["x=y", "y=z", "z=x"],
        [6, 6, 6],
      ),
      step(
        "겹침이 없는 여사건",
        R`x=y=z\Rightarrow3x=10\text{은 불가능}`,
        "두 등식이 동시에 성립하려면 세 값이 같아야 하므로 여사건 세 개는 겹치지 않는다.",
        grid(comp, (a) => !distinct(a), "두 값이 같은 18개 해", 11),
      ),
      step(
        "모두 다른 해의 확률",
        R`\frac{66-18}{66}=\frac8{11}`,
        "곱이 0이 아니라는 것은 세 차가 모두 0이 아니라는 뜻이다.",
        grid(comp, distinct, "서로 다른 세 값의 48개 해", 11),
      ),
      S(
        "분모와 분자 합",
        R`p+q=11+8=19`,
        "기약분수의 두 수를 더한다.",
        ["답"],
        [19],
      ),
    ],
    [
      check("전체 해", comp.length, 66),
      check("서로 다른 해", comp.filter(distinct).length, 48),
    ],
  );
  add(
    "2018-b-7",
    "A 희망자 안의 B 희망자",
    "500명 중 두 지역 모두 희망140, A만40, B만310, 둘 다 아님10명이다.",
    "7/9",
    [
      S(
        "표의 네 영역",
        R`140+40+310+10=500`,
        "행과 열 제목을 구별해 두 지역 교집합을 확인한다.",
        ["둘 다", "A만", "B만", "둘 다 아님"],
        [140, 40, 310, 10],
      ),
      S(
        "A 희망자로 조건 제한",
        R`N(A)=140+40=180`,
        "A를 희망한 180명이 새로운 표본공간이다.",
        ["A와 B", "A만"],
        [140, 40],
        0,
      ),
      S(
        "교집합의 조건 비율",
        R`P(B\mid A)=\frac{140}{180}=\frac79`,
        "B 전체 450명이 아닌 A 내부에서 B인 인원을 센다.",
        ["조건부확률"],
        [7 / 9],
      ),
    ],
    [check("조건부확률", 140 / 180, 7 / 9)],
  );
  const parts = [
    [4, 7],
    [5, 6],
    [3, 3, 5],
    [3, 4, 4],
  ];
  add(
    "2018-b-8",
    "11을 3부터 7까지로 분할",
    "순서를 구별하지 않고 각 부분이 3~7인 자연수 분할을 센다.",
    "4",
    [
      S(
        "부분의 개수 제한",
        R`2\le k\le3`,
        "한 부분으로는 최대 7이고 네 부분이면 최소 12이므로 두 개 또는 세 개다.",
        ["최소 부분 수", "최대 부분 수"],
        [2, 3],
      ),
      S(
        "두 부분인 경우",
        R`11=4+7=5+6`,
        "작은 수부터 쓰면 같은 분할의 순서 중복을 피한다.",
        ["4+7", "5+6"],
        [1, 1],
      ),
      S(
        "세 부분인 경우",
        R`11=3+3+5=3+4+4`,
        "각 부분에서 3을 빼면 합 2의 비음수 분할 두 가지다.",
        ["3+3+5", "3+4+4"],
        [1, 1],
      ),
      S(
        "서로 다른 분할 합",
        R`2+2=4`,
        "각 막대가 실제 분할 하나다.",
        ["4+7", "5+6", "3+3+5", "3+4+4"],
        [1, 1, 1, 1],
      ),
    ],
    [
      check(
        "분할의 합 검산",
        parts.filter(
          (a) =>
            a.reduce((s, v) => s + v) === 11 &&
            a.every((v) => v >= 3 && v <= 7),
        ).length,
        4,
      ),
    ],
  );
  add(
    "2018-b-17",
    "작은 소수를 정수 좌표로 옮기기",
    "X 값은 0.121,0.221,0.321, 확률은 a,b,2/3이고 E(X)=0.271이다.",
    "25/9",
    [
      step(
        "원래 확률분포",
        R`X\in\{0.121,0.221,0.321\}`,
        "문제 조건을 풀어 얻는 a=b=1/6을 반영한 실제 확률 막대다.",
        frame({
          range: [0.08, 0.36, -0.08, 0.8],
          lines: [
            line(p(0.121), p(0.121, 1 / 6)),
            line(p(0.221), p(0.221, 1 / 6)),
            line(p(0.321), p(0.321, 2 / 3)),
          ],
          description: "원래 소수 좌표의 확률 질량",
        }),
      ),
      step(
        "평행이동과 열 배 확대",
        R`Y=10X-2.21\in\{-1,0,1\},\quad E(Y)=0.5`,
        "확률 질량은 그대로 두고 가로 좌표만 변환한다.",
        frame({
          range: [-1.4, 1.4, -0.08, 0.8],
          lines: [
            line(p(-1), p(-1, 1 / 6)),
            line(p(0), p(0, 1 / 6)),
            line(p(1), p(1, 2 / 3)),
          ],
          description: "Y의 정수 좌표 −1,0,1",
        }),
      ),
      S(
        "확률 두 개 복원",
        R`-a+\frac23=\frac12\Rightarrow a=\frac16,\quad b=\frac16`,
        "전체 확률의 합 1을 함께 사용한다.",
        ["a", "b", "마지막 확률"],
        [1 / 6, 1 / 6, 2 / 3],
      ),
      S(
        "분산 배율과 요구 곱",
        R`V(Y)=100V(X),\quad pqr=\frac16\cdot\frac16\cdot100=\frac{25}9`,
        "상수 이동은 분산을 바꾸지 않고 열 배 확대는 분산을 백 배 한다.",
        ["a", "b", "분산 배율", "요구 곱"],
        [1 / 6, 1 / 6, 100, 25 / 9],
        3,
      ),
    ],
    [
      check("원래 평균", 0.121 / 6 + 0.221 / 6 + (0.321 * 2) / 3, 0.271),
      check("변환분산", 1 / 6 + 2 / 3 - 0.25, 7 / 12),
      check("요구 곱", 100 / 36, 25 / 9),
    ],
  );
  const coin = product(2, 6).map((a) => a.map((v) => v - 1)),
    heads = (a) => a.reduce((s, v) => s + v, 0);
  add(
    "2018-b-28",
    "동전 여섯 번의 엄격한 다수",
    "앞면 횟수가 뒷면 횟수보다 클 확률이다.",
    "43",
    [
      S(
        "앞면 수의 조건",
        R`H>6-H\iff H\ge4`,
        "동수인 H=3은 포함하지 않는다.",
        ["최소 앞면", "최대 앞면"],
        [4, 6],
      ),
      S(
        "앞면 4,5,6의 경우",
        R`\binom64+\binom65+\binom66=15+6+1=22`,
        "같은 확률의 64개 수열에서 앞면 위치를 선택한다.",
        ["H=4", "H=5", "H=6"],
        [15, 6, 1],
      ),
      step(
        "정확한 확률",
        R`P=\frac{22}{64}=\frac{11}{32}`,
        "전체 동전 수열을 직접 열거한다.",
        grid(coin, (a) => heads(a) >= 4, "앞면이 더 많은 22개", 8),
      ),
      S(
        "분모와 분자 합",
        R`p+q=32+11=43`,
        "분수를 약분한 뒤 두 수를 더한다.",
        ["답"],
        [43],
      ),
    ],
    [check("동전 전수검산", coin.filter((a) => heads(a) >= 4).length, 22)],
  );
}

// 2017학년도.
{
  add(
    "2017-a-4",
    "독립 조건에서 두 확률의 곱",
    "P(Bᶜ)=1/3, P(A|B)=1/2이며 A,B는 독립이다.",
    "1/3",
    [
      S(
        "B의 여사건 뒤집기",
        R`P(B)=1-\frac13=\frac23`,
        "B는 확률이 양수이므로 조건부확률이 정의된다.",
        ["B", "Bᶜ"],
        [2 / 3, 1 / 3],
      ),
      S(
        "독립으로 조건 제거",
        R`P(A)=P(A\mid B)=\frac12`,
        "독립이면 B의 발생 여부가 A의 확률을 바꾸지 않는다.",
        ["A", "Aᶜ"],
        [0.5, 0.5],
      ),
      S(
        "요구한 곱",
        R`P(A)P(B)=\frac12\cdot\frac23=\frac13`,
        "독립이므로 이 곱은 교집합 확률과도 같다.",
        ["A∩B", "A만", "B만", "바깥"],
        [1 / 3, 1 / 6, 1 / 3, 1 / 6],
        0,
      ),
    ],
    [check("곱", (0.5 * 2) / 3, 1 / 3)],
  );
  const words = product(5, 4);
  add(
    "2017-a-5",
    "끝자리로 5의 배수 만들기",
    "1~5를 중복하여 네 자리 자연수를 만들고 5의 배수만 센다.",
    "125",
    [
      S(
        "끝자리는 반드시 5",
        R`d_4=5`,
        "사용 가능한 숫자에 0이 없으므로 5의 배수의 일의 자리는 5다.",
        ["끝자리 선택"],
        [1],
      ),
      S(
        "나머지 세 자리의 독립 선택",
        R`5\cdot5\cdot5=125`,
        "앞의 세 자리는 각각 다섯 숫자를 중복 사용한다.",
        ["천의 자리", "백의 자리", "십의 자리"],
        [5, 5, 5],
      ),
      step(
        "실제 네 자리 수 필터",
        R`5^3\cdot1=125`,
        "전체 625개 숫자 배열에서 끝이 5인 125개를 강조한다.",
        grid(words, (a) => a[3] === 5, "실제 5의 배수", 25),
      ),
    ],
    [check("네 자리 수 전수검산", words.filter((a) => a[3] === 5).length, 125)],
  );
  const rolls = product(6, 3),
    once = (a) => a.filter((v) => v === 4).length === 1;
  add(
    "2017-a-7",
    "4가 정확히 한 번 나오는 위치",
    "주사위를 세 번 던져 4가 한 번만 나올 확률이다.",
    "25/72",
    [
      S(
        "4가 나오는 시각 선택",
        R`\binom31=3`,
        "첫째, 둘째, 셋째 중 어느 한 번인지 고른다.",
        ["위치 수"],
        [3],
      ),
      S(
        "나머지 두 눈 제한",
        R`1\cdot5^2=25`,
        "4가 아닌 눈은 1,2,3,5,6 다섯 가지다.",
        ["고정된 위치당 성공 결과"],
        [25],
      ),
      step(
        "전체 세 눈 배열과 비교",
        R`P=\frac{3\cdot25}{6^3}=\frac{25}{72}`,
        "세 경우는 4의 위치가 달라 서로 겹치지 않는다.",
        grid(rolls, once, "정확히 한 번 4인 75개", 18),
      ),
    ],
    [check("실제 눈 전수검산", rolls.filter(once).length, 75)],
  );
  add(
    "2017-a-13",
    "서로 다른 표본평균의 같은 꼬리",
    "N(0,4²)의 9개 평균 X̄와 N(3,2²)의 16개 평균 Ȳ에 대해 P(X̄≥1)=P(Ȳ≤a)다.",
    "21/8",
    [
      step(
        "첫 표본평균 분포",
        R`\sigma_{\bar X}=\frac43,\quad\frac{1-0}{4/3}=\frac34`,
        "X̄의 오른쪽 꼬리를 표준화한다.",
        normal(0, 4 / 3, 1, 14 / 3, "X̄≥1의 꼬리"),
      ),
      step(
        "대칭인 왼쪽 꼬리",
        R`P(Z\ge3/4)=P(Z\le-3/4)`,
        "같은 표준정규분포에서 좌우 대칭을 적용한다.",
        normal(0, 1, -3.5, -0.75, "같은 넓이의 왼쪽 꼬리"),
      ),
      step(
        "두 번째 평균의 경계 복원",
        R`\sigma_{\bar Y}=\frac12,\quad\frac{a-3}{1/2}=-\frac34\Rightarrow a=\frac{21}8`,
        "Ȳ의 평균 3에서 3/8만큼 왼쪽이다.",
        normal(3, 0.5, 1.25, 21 / 8, "Ȳ≤21/8의 실제 꼬리"),
      ),
    ],
    [check("경계 표준화", (21 / 8 - 3) / 0.5, -0.75)],
  );
  const paths = [];
  function jumps(x, y, seq) {
    if (x === 4 && y === 3) {
      paths.push(seq);
      return;
    }
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
      [1, 1],
    ])
      if (x + dx <= 4 && y + dy <= 3) jumps(x + dx, y + dy, [...seq, [dx, dy]]);
  }
  jumps(0, 0, []);
  const counts = [4, 5, 6, 7].map(
      (n) => paths.filter((a) => a.length === n).length,
    ),
    scene = (n) =>
      frame({
        range: [-0.3, 4.3, -0.3, 3.3],
        lines: paths
          .filter((a) => a.length === n)
          .map((a) => {
            let x = 0,
              y = 0;
            const pts = [p(0, 0)];
            for (const [dx, dy] of a) {
              x += dx;
              y += dy;
              pts.push(p(x, y));
            }
            return { points: pts, color: C.blue };
          }),
        dots: [dot(p(0, 0), "출발"), dot(p(4, 3), "(4,3)", C.green)],
        description: `실제 ${n}회 점프 경로 ${counts[n - 4]}개`,
        equalAspect: true,
      });
  add(
    "2017-a-17",
    "대각선 점프 수로 경로 분류",
    "오른쪽·위쪽·대각선 점프로 (0,0)에서 (4,3)까지 가는 모든 경로를 같은 확률로 선택한다.",
    "193",
    [
      step(
        "최소 점프 네 번",
        R`k=4,\quad N_4=\frac{4!}{3!}=4`,
        "대각선 세 번과 오른쪽 한 번이다. 매 점프 종류를 같은 확률로 고르는 시행이 아니라 전체 경로가 같은 확률이다.",
        scene(4),
      ),
      step(
        "다섯 번 점프",
        R`N_5=\frac{5!}{2!2!}=30`,
        "오른쪽 둘, 위쪽 하나, 대각선 둘을 배열한다.",
        scene(5),
      ),
      step(
        "여섯 번 점프",
        R`b=N_6=\frac{6!}{3!2!}=60`,
        "오른쪽 셋, 위쪽 둘, 대각선 하나를 배열한다.",
        scene(6),
      ),
      step(
        "일곱 번 점프",
        R`N_7=\frac{7!}{4!3!}=35`,
        "대각선 없이 오른쪽 네 번과 위쪽 세 번이다.",
        scene(7),
      ),
      S(
        "전체와 요구한 합",
        R`c=N=4+30+60+35=129,\quad a+b+c=4+60+129=193`,
        "분포의 기댓값은 257/43이지만 문항이 묻는 것은 세 빈칸의 합이다.",
        ["4회", "5회", "6회", "7회"],
        counts,
      ),
    ],
    [
      check("경로 총수", paths.length, 129),
      check("여섯 번 경로", counts[2], 60),
      check(
        "기댓값",
        counts.reduce((s, v, i) => s + (i + 4) * v, 0) / 129,
        257 / 43,
      ),
      check("요구값", 4 + counts[2] + paths.length, 193),
    ],
  );
  for (const [id, result, scale] of [
    ["2017-a-18", "0.062", false],
    ["2017-b-29", "62", true],
  ])
    add(
      id,
      "밀도 높이 두 조건으로 평균 결정",
      "X~N(m,5²), f(10)>f(20), f(4)<f(22)이며 m은 자연수다.",
      result,
      [
        S(
          "첫 높이 비교는 거리 비교",
          R`|10-m|<|20-m|\iff m<15`,
          "같은 정규밀도에서 평균에 가까운 점의 높이가 더 크다.",
          ["두 점의 중점"],
          [15],
        ),
        S(
          "둘째 높이 비교",
          R`|4-m|>|22-m|\iff m>13`,
          "22에 더 가까워야 하므로 중점 13 오른쪽이다.",
          ["하한", "상한", "가능한 자연수"],
          [13, 15, 14],
          2,
        ),
        step(
          "유일한 평균 14",
          R`13<m<15,\ m\in\mathbb N\Rightarrow m=14`,
          "원문 확률구간 17~18은 평균의 오른쪽에 있다.",
          normal(14, 5, 17, 18, "실제 N(14,25)의 질문 구간"),
        ),
        step(
          "두 경계를 표준화",
          R`P(17\le X\le18)=P(0.6\le Z\le0.8)`,
          "평균을 빼고 표준편차 5로 나눈다.",
          normal(0, 1, 0.6, 0.8, "표준정규 0.6~0.8"),
        ),
        S(
          "표의 넓이 차",
          R`a=0.288-0.226=0.062`,
          "원문 표의 세 자리 근삿값을 사용한다.",
          ["0~0.8", "0~0.6", "차"],
          [0.288, 0.226, 0.062],
          2,
        ),
        ...(scale
          ? [
              S(
                "요구한 배율",
                R`1000a=62`,
                "나형은 확률의 1000배를 묻는다.",
                ["답"],
                [62],
              ),
            ]
          : []),
      ],
      [
        check("표 계산", 0.288 - 0.226, 0.062),
        check(
          "평균의 첫 거리 조건",
          Number(Math.abs(10 - 14) < Math.abs(20 - 14)),
          1,
        ),
        check(
          "평균의 둘째 거리 조건",
          Number(Math.abs(4 - 14) > Math.abs(22 - 14)),
          1,
        ),
      ],
    );
  const choices = product(4, 2).filter((a) => a[0] <= a[1]);
  add(
    "2017-a-22",
    "네 종류에서 중복하여 두 개",
    "₄H₂를 계산한다.",
    "10",
    [
      S(
        "중복조합을 조합으로",
        R`{}_4H_2=\binom{4+2-1}2`,
        "네 종류의 비음수 개수 합이 2인 선택이다.",
        ["종류 수", "선택 수"],
        [4, 2],
      ),
      S(
        "같은 종류와 다른 종류",
        R`4+\binom42=4+6`,
        "두 개가 같으면 네 가지, 다르면 여섯 가지다.",
        ["같은 종류", "다른 종류"],
        [4, 6],
      ),
      step(
        "실제 비감소 배열",
        R`{}_4H_2=10`,
        "작은 것부터 나열한 두 값으로 순서 중복을 제거한다.",
        grid(choices, () => true, "중복조합 10개", 5),
      ),
    ],
    [check("중복조합 전수검산", choices.length, 10)],
  );
  const pair = pairs([1, 2, 3, 4]),
    out = pair.flatMap((a) => pair.map((b) => ({ a, b }))),
    same = (o) => o.a[0] + o.a[1] === o.b[0] + o.b[1];
  add(
    "2017-a-26",
    "두 주머니 카드 합이 같을 확률",
    "각 주머니에 1~4 카드가 있고 두 사람이 각각 두 장을 선택한다.",
    "11",
    [
      S(
        "각자의 두 장 조합",
        R`\binom42=6,\quad|\Omega|=6^2=36`,
        "각 사람의 카드 선택은 순서가 없고 두 사람은 구별된다.",
        ["한 사람 선택", "전체 선택쌍"],
        [6, 36],
      ),
      S(
        "합별 조합 수",
        R`s=3,4,5,6,7:\quad n_s=1,1,2,1,1`,
        "합 5에는 (1,4),(2,3) 두 조합이 있다.",
        ["합 3", "4", "5", "6", "7"],
        [1, 1, 2, 1, 1],
        2,
      ),
      step(
        "같은 합끼리 대응",
        R`N=1^2+1^2+2^2+1^2+1^2=8`,
        "각 합에서 갑의 선택과 을의 선택을 독립적으로 결합한다.",
        grid(out, same, "합이 같은 여덟 선택쌍", 6),
      ),
      S(
        "확률과 요구 합",
        R`P=\frac8{36}=\frac29,\quad p+q=9+2=11`,
        "약분한 후 분모와 분자를 더한다.",
        ["성공", "전체", "요구 합"],
        [8, 36, 11],
        2,
      ),
    ],
    [check("선택쌍 전수검산", out.filter(same).length, 8)],
  );
  const comp = compositions(7, 3),
    ok = (a) => a[0] + 2 * a[1] >= 3;
  add(
    "2017-a-27",
    "8의 배수 조건을 지수 부등식으로",
    "a+b+c=7인 비음수 정수 해에서 2ᵃ4ᵇ가 8의 배수다.",
    "32",
    [
      step(
        "합 조건의 전체 해",
        R`\binom92=36`,
        "비음수 정수 세 개의 합이 7인 해를 모두 만든다.",
        grid(comp, () => true, "전체 36개 해", 6),
      ),
      S(
        "같은 밑으로 지수 합치기",
        R`2^a4^b=2^{a+2b},\quad 8\mid2^{a+2b}\iff a+2b\ge3`,
        "a,b가 비음수 정수이므로 배수 여부는 지수 비교로 결정된다.",
        ["필요한 최소 지수"],
        [3],
      ),
      step(
        "제외되는 네 해",
        R`(a,b)=(0,0),(1,0),(2,0),(0,1)`,
        "a+2b≤2를 만족하는 네 쌍에서 c는 합 조건으로 유일하다.",
        grid(comp, (a) => !ok(a), "지수가 3보다 작은 네 해", 6),
      ),
      step(
        "여사건 제외",
        R`36-4=32`,
        "최종 32개는 원래 정수 조건과 배수 조건을 모두 만족한다.",
        grid(comp, ok, "최종 정수 해 32개", 6),
      ),
    ],
    [check("지수 조건 전수검산", comp.filter(ok).length, 32)],
  );
  add(
    "2017-b-4",
    "A를 B 안팎으로 분해",
    "P(A∩B)=1/8, P(A∩Bᶜ)=3/16에서 P(A)를 구한다.",
    "5/16",
    [
      S(
        "A의 B 안쪽",
        R`P(A\cap B)=\frac18`,
        "A 중 B에도 속한 부분이다.",
        ["A∩B"],
        [1 / 8],
      ),
      S(
        "A의 B 바깥쪽",
        R`P(A\cap B^c)=\frac3{16}`,
        "앞 부분과 서로 겹치지 않는다.",
        ["B 안의 A", "B 밖의 A"],
        [1 / 8, 3 / 16],
      ),
      S(
        "A 전체 복원",
        R`P(A)=\frac18+\frac3{16}=\frac5{16}`,
        "B 안팎이 A를 빠짐없이 나눈다.",
        ["A", "A 바깥"],
        [5 / 16, 11 / 16],
        0,
      ),
    ],
    [check("합", 1 / 8 + 3 / 16, 5 / 16)],
  );
  add(
    "2017-b-13",
    "조건부 비율로 표의 빈칸 채우기",
    "360명 중 A 선택 남90·여70명, B 선택자 중 남학생 비율이 2/5이다.",
    "190",
    [
      S(
        "B 선택자 수",
        R`N(B)=360-(90+70)=200`,
        "두 체험 중 하나씩 고르므로 A 이외는 모두 B다.",
        ["A", "B"],
        [160, 200],
      ),
      S(
        "B의 남학생과 여학생",
        R`N(B\cap\text{남})=200\cdot\frac25=80,\quad N(B\cap\text{여})=120`,
        "조건부확률의 분모는 B를 선택한 200명이다.",
        ["B 남", "B 여"],
        [80, 120],
        1,
      ),
      S(
        "여학생 전체 합",
        R`70+120=190`,
        "A를 선택한 여학생과 B를 선택한 여학생을 더한다.",
        ["A 여", "B 여", "전체 여"],
        [70, 120, 190],
        2,
      ),
    ],
    [
      check("조건부비율", 80 / 200, 2 / 5),
      check("전체 인원", 90 + 70 + 80 + 120, 360),
    ],
  );
  add(
    "2017-b-16",
    "99% 신뢰구간의 한쪽 폭",
    "모표준편차 40, 표본 크기 64일 때 x̄±c 형태의 99% 신뢰구간이다.",
    "12.9",
    [
      S(
        "표본평균의 표준편차",
        R`\sigma_{\bar X}=\frac{40}{\sqrt{64}}=5`,
        "모집단 표준편차를 8로 나눈다.",
        ["모표준편차", "표준오차"],
        [40, 5],
      ),
      S(
        "중앙 99%의 표준경계",
        R`P(|Z|\le2.58)=2(0.495)=0.99`,
        "표의 한쪽 넓이를 두 배 하면 중앙 99%가 된다.",
        ["왼쪽 절반", "오른쪽 절반", "중앙"],
        [0.495, 0.495, 0.99],
        2,
      ),
      step(
        "표준오차 배율 적용",
        R`c=2.58\cdot5=12.9`,
        "축은 실제 표본평균이 아닌 표본평균으로부터의 상대 위치다. c는 전체 길이의 절반이다.",
        interval(0, 12.9, "표본평균 기준 상대 신뢰구간"),
      ),
    ],
    [check("오차 한계", (2.58 * 40) / 8, 12.9)],
  );
  add(
    "2017-b-22",
    "순열과 조합 더하기",
    "₅P₂+₅C₂를 계산한다.",
    "30",
    [
      S(
        "순서 있는 두 선택",
        R`{}_5P_2=5\cdot4=20`,
        "첫째와 둘째 역할을 구별한다.",
        ["순열"],
        [20],
      ),
      S(
        "순서 없는 두 선택",
        R`\binom52=\frac{20}{2}=10`,
        "같은 두 원소의 두 순서를 합친다.",
        ["조합"],
        [10],
      ),
      S(
        "요구한 합",
        R`20+10=30`,
        "순열과 조합의 값을 더한다.",
        ["순열", "조합", "합"],
        [20, 10, 30],
        2,
      ),
    ],
    [check("합", 5 * 4 + choose(5, 2), 30)],
  );
}

// 복잡한 시행은 집계 막대와 함께 실제 배치·상태 전이를 보여 준다.
{
  const get = (id) => output.find((q) => q.id === id);
  const bagScene = (a, description) =>
    frame({
      range: [-0.65, 9.65, -0.6, 2.9],
      equalAspect: true,
      lines: a.flatMap((v, i) => [
        line(p(i - 0.38, 2.2), p(i - 0.38, 0), C.muted),
        line(p(i - 0.38, 0), p(i + 0.38, 0), C.muted),
        line(p(i + 0.38, 0), p(i + 0.38, 2.2), C.muted),
      ]),
      dots: a.flatMap((v, i) => [
        dot(p(i, -0.3), String(i + 1), C.muted),
        ...Array.from({ length: v }, (_, k) =>
          dot(p(i, 0.55 + k * 0.8), "", v === 2 ? C.green : C.blue, {
            size: 0.13,
          }),
        ),
      ]),
      surfaces: a.flatMap((v, i) =>
        v === 0 && ((i > 0 && a[i - 1] === 2) || (i < 9 && a[i + 1] === 2))
          ? [
              surface(
                [
                  p(i - 0.38, 0),
                  p(i + 0.38, 0),
                  p(i + 0.38, 2.2),
                  p(i - 0.38, 2.2),
                ],
                C.orange,
                0.12,
              ),
            ]
          : [],
      ),
      metrics: [
        { label: "공 총수", value: String(a.reduce((s, v) => s + v, 0)) },
        {
          label: "빈 / 한 공 / 두 공",
          value: [0, 1, 2]
            .map((v) => a.filter((x) => x === v).length)
            .join(" / "),
        },
      ],
      description,
    });
  const bags = get("2026-probability-30"),
    ba = [2, 0, 2, 0, 0, 0, 1, 1, 1, 1],
    bb = [2, 0, 0, 0, 1, 1, 1, 1, 1, 1];
  bags.steps[0].model = chart(
    ["빈 주머니", "한 공 주머니", "두 공 주머니"],
    [4, 4, 2],
    "첫 유형의 개수 관계 4+4+2=10; 둘째 유형은 다음 장면에서 표시",
  );
  bags.steps[1].model = bagScene(
    ba,
    "첫 유형의 실제 대표 배치. 초록 두 공 주머니의 이웃은 주황 빈칸이다. 전체 150개 중 한 배치를 표시한다.",
  );
  bags.steps[1].model.metrics.push({
    label: "이 유형의 모든 배치",
    value: "150",
  });
  bags.steps[2].model = bagScene(
    bb,
    "둘째 유형의 실제 대표 배치. 여섯 개의 한 공 주머니와 세 빈 주머니를 가진다. 전체 112개 중 하나다.",
  );
  bags.steps[2].model.metrics.push({
    label: "이 유형의 모든 배치",
    value: "112",
  });
  bags.checks.push(
    check(
      "표시한 첫 배치 공 합",
      ba.reduce((a, b) => a + b),
      8,
    ),
    check(
      "표시한 둘째 배치 공 합",
      bb.reduce((a, b) => a + b),
      8,
    ),
    check(
      "두 대표 배치의 이웃 조건",
      Number(
        [ba, bb].every((a) =>
          a.every(
            (v, i) =>
              v !== 2 ||
              ((i === 0 || a[i - 1] === 0) && (i === 9 || a[i + 1] === 0)),
          ),
        ),
      ),
      1,
    ),
  );

  const hats = get("2021-a-29"),
    hatScene = (black, white, label, n) =>
      frame({
        range: [-0.7, 3.7, -0.7, 6],
        equalAspect: true,
        lines: Array.from({ length: 3 }, (_, i) =>
          line(p(i + 0.5, -0.2), p(i + 0.5, 5.5), C.muted, { dashed: true }),
        ),
        dots: black.flatMap((v, i) => [
          dot(p(i, -0.35), "ABCD"[i], v > white[i] ? C.green : C.muted),
          ...Array.from({ length: v }, (_, k) =>
            dot(p(i - 0.16, 0.3 + k * 0.85), "", C.blue, { size: 0.11 }),
          ),
          ...Array.from({ length: white[i] }, (_, k) =>
            dot(p(i + 0.16, 0.3 + k * 0.85), "", C.orange, { size: 0.11 }),
          ),
        ]),
        metrics: [
          { label: "파랑: 검은 모자", value: black.join(", ") },
          { label: "주황: 흰 모자", value: white.join(", ") },
          {
            label: "검은색이 더 많은 학생",
            value: black
              .flatMap((v, i) => (v > white[i] ? ["ABCD"[i]] : []))
              .join(", "),
          },
          { label: "이 유형 전체 배분", value: String(n) },
        ],
        description: `${label}. 원문 조건을 만족하는 대표 배분 하나이며 전체 배분 수와 구별한다.`,
      });
  const hatExamples = [
    [[4, 2, 0, 0], [1, 0, 1, 4], 72],
    [[4, 1, 1, 0], [1, 0, 1, 4], 84],
    [[5, 1, 0, 0], [1, 0, 1, 4], 45],
  ];
  for (let i = 0; i < 3; i++) {
    const [b, w, n] = hatExamples[i];
    hats.steps[i + 1].model = hatScene(
      b,
      w,
      ["검은 모자 4+2 배분", "검은 모자 4+1+1 배분", "검은 모자 5+1 배분"][i],
      n,
    );
    hats.checks.push(
      check(
        `대표 배분 ${i + 1} 검은 총수`,
        b.reduce((s, v) => s + v),
        6,
      ),
      check(
        `대표 배분 ${i + 1} 흰 총수`,
        w.reduce((s, v) => s + v),
        6,
      ),
      check(
        `대표 배분 ${i + 1} 대소 인원`,
        b.filter((v, j) => v > w[j]).length,
        2,
      ),
    );
  }

  const balls = get("2022-probability-30"),
    paths = product(2, 5).map((a) => {
      let w = 0,
        b = 0,
        hit = false;
      const pts = [p(0, 0)];
      for (const k of a) {
        k === 1 ? b++ : (w += 2);
        if (w === b) hit = true;
        pts.push(p(w, b));
      }
      return { pts, w, b, hit, prob: (1 / 3) ** (w / 2) * (2 / 3) ** b };
    });
  const ballScene = (predicate) =>
    frame({
      range: [-0.4, 10.5, -0.4, 5.5],
      equalAspect: true,
      lines: [
        line(p(0, 0), p(5, 5), C.orange, { dashed: true }),
        ...paths
          .filter(predicate)
          .map((o) => ({ points: o.pts, color: o.hit ? C.green : C.blue })),
      ],
      dots: [dot(p(2, 2), "3회: 흰 2 = 검은 2", C.orange)],
      metrics: [
        {
          label: "표시한 W/B 경로 수",
          value: String(paths.filter(predicate).length),
        },
        {
          label: "표시 경로의 확률 합",
          value: fmt(paths.filter(predicate).reduce((s, o) => s + o.prob, 0)),
        },
      ],
      description:
        "가로축 흰 공 수, 세로축 검은 공 수. W는 오른쪽 2칸, B는 위쪽 1칸. 경로의 확률은 W,B 횟수에 따른 가중치로 계산한다.",
    });
  balls.steps[1].model = ballScene((o) => o.w + o.b >= 7);
  balls.steps[2].model = ballScene((o) => o.hit);
  balls.steps[3].model = ballScene((o) => o.hit && o.w + o.b >= 7);
  balls.checks.push(
    check(
      "표시 경로의 조건 확률",
      paths.filter((o) => o.w + o.b >= 7).reduce((s, o) => s + o.prob, 0),
      131 / 243,
    ),
    check(
      "표시 경로의 교집합 확률",
      paths
        .filter((o) => o.hit && o.w + o.b >= 7)
        .reduce((s, o) => s + o.prob, 0),
      60 / 243,
    ),
  );

  const coins = get("2025-probability-30"),
    coinStory = (seq) => {
      let state = [1, 1, 0, 0, 0];
      const rows = [state];
      for (const k of seq) {
        state = state.map((v, i) => (k === 6 || i === k - 1 ? 1 - v : v));
        rows.push(state);
      }
      return frame({
        range: [-0.8, 4.8, -0.7, 4],
        equalAspect: true,
        dots: rows.flatMap((a, t) =>
          a.map((v, i) =>
            dot(p(i, 3 - t), v ? "H" : "T", v ? C.green : C.muted, {
              size: 0.16,
            }),
          ),
        ),
        lines: seq.flatMap((k, t) =>
          Array.from({ length: 5 }, (_, i) =>
            i === k - 1 || k === 6
              ? line(p(i, 2.8 - t), p(i, 2.2 - t), C.orange)
              : null,
          ).filter(Boolean),
        ),
        metrics: [
          { label: "위→아래 시행 순서", value: seq.join(" → ") },
          {
            label: "최종 앞면 수",
            value: String(rows[3].reduce((s, v) => s + v, 0)),
          },
        ],
        description:
          "실제 동전 다섯 개의 상태. 위부터 초기 상태, 1회 후, 2회 후, 3회 후. 주황선은 그 시행에서 뒤집힌 동전이다.",
      });
    };
  coins.steps.splice(
    2,
    0,
    step(
      "6 없이 성공하는 실제 전이",
      R`HHTTT\xrightarrow{3}HHHTT\xrightarrow{4}HHHHT\xrightarrow{5}HHHHH`,
      "3,4,5를 한 번씩 뒤집는 대표 순서다. 세 눈의 순열 여섯 개가 모두 성공한다.",
      coinStory([3, 4, 5]),
    ),
    step(
      "6을 한 번 포함하는 실제 전이",
      R`HHTTT\xrightarrow{1}THTTT\xrightarrow{2}TTTTT\xrightarrow{6}HHHHH`,
      "1,2,6을 한 번씩 사용하는 대표 순서다. 전체 뒤집기와 개별 뒤집기는 교환되므로 순서 여섯 개가 모두 성공한다.",
      coinStory([1, 2, 6]),
    ),
  );
  get("2023-probability-30").summary =
    "1~10에서 비감소하는 함수에 f(x)≤x 또는 ≥x와 f(6)=f(5)+6을 적용한다.";
}

fs.mkdirSync(path.join(root, "src/data/question-visuals"), { recursive: true });
fs.writeFileSync(
  path.join(root, "src/data/question-visuals/probability.json"),
  JSON.stringify(output, null, 2) + "\n",
);
console.log(`Probability verified visuals: ${output.length}/${catalog.length}`);
