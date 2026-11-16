export const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
export function choose(n, k) {
  if (!Number.isInteger(n) || !Number.isInteger(k) || n < 0 || k < 0 || k > n)
    return 0;
  k = Math.min(k, n - k);
  let value = 1;
  for (let i = 1; i <= k; i++) value *= (n - k + i) / i;
  return Math.round(value);
}
export function binomial(n, p, k) {
  return choose(n, k) * p ** k * (1 - p) ** (n - k);
}
export function normalPdf(x, mean = 0, sd = 1) {
  return (
    Math.exp(-0.5 * ((x - mean) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI))
  );
}
export function normalCdf(x) {
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * z);
  const erf =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-z * z);
  return (1 + sign * erf) / 2;
}
export function midpointSquare(b, n) {
  let sum = 0;
  for (let i = 0; i < n; i++) sum += ((((i + 0.5) * b) / n) ** 2 * b) / n;
  return sum;
}
export function geometricSum(r, n) {
  return r === 1 ? n : (1 - r ** n) / (1 - r);
}
export function conditionalDice(sum) {
  const space = [];
  for (let a = 1; a <= 6; a++)
    for (let b = 1; b <= 6; b++) if (a + b === sum) space.push([a, b]);
  return {
    total: space.length,
    favorable: space.filter(([a]) => a % 2 === 0).length,
  };
}
export function samplePoints(fn, min, max, n = 200) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const x = min + ((max - min) * i) / n;
    return [x, fn(x), 0];
  });
}
export const format = (n, digits = 3) =>
  Number.isFinite(n) ? Number(n.toFixed(digits)).toString() : "정의되지 않음";
