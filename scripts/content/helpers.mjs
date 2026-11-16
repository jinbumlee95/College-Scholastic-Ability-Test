export const C = {
  blue: "#2563eb",
  green: "#0f766e",
  orange: "#d97706",
  red: "#dc2626",
  muted: "#a8a29e",
};
export const p = (x = 0, y = 0, z = 0) => [x, y, z];
export const line = (a, b, color = C.blue, extra = {}) => ({
  points: [a, b],
  color,
  ...extra,
});
export const path = (points, color = C.blue, extra = {}) => ({
  points,
  color,
  ...extra,
});
export const curve = (fn, a, b, color = C.blue, n = 64) =>
  path(
    Array.from({ length: n + 1 }, (_, i) => {
      const x = a + ((b - a) * i) / n;
      const y = fn(x);
      return Array.isArray(y) ? y : p(x, y);
    }),
    color,
  );
export const dot = (at, label = "", color = C.orange, extra = {}) => ({
  at,
  label,
  color,
  ...extra,
});
export const surface = (points, color = C.blue, opacity = 0.16) => ({
  points,
  color,
  opacity,
});
export const area = (fn, a, b, color = C.blue, n = 48) => ({
  ...surface([p(a), ...curve(fn, a, b, color, n).points, p(b)], color),
  triangulation: "strip-to-axis",
});
export const circle = (cx, cy, r, color = C.blue, n = 64) =>
  curve(
    (t) => p(cx + r * Math.cos(t), cy + r * Math.sin(t)),
    0,
    2 * Math.PI,
    color,
    n,
  );
export const frame = (args = {}) => ({
  lines: [],
  dots: [],
  surfaces: [],
  range: [-5, 5, -4, 4],
  threeD: false,
  metrics: [],
  description: "",
  ...args,
});
export const step = (title, formula, body, model) => ({
  title,
  formula,
  body,
  model,
});
export const choose = (n, r) => {
  if (r < 0 || r > n) return 0;
  let v = 1;
  for (let k = 1; k <= r; k++) v = (v * (n - k + 1)) / k;
  return v;
};
export const bars = (values, color = C.blue, offset = 0, width = 0.7) =>
  values.map((v, i) =>
    surface(
      [
        p(offset + i - width / 2),
        p(offset + i + width / 2),
        p(offset + i + width / 2, v),
        p(offset + i - width / 2, v),
      ],
      color,
      0.55,
    ),
  );
export const integrate = (fn, a, b, n = 2000) => {
  let s = 0;
  for (let i = 0; i < n; i++) s += fn(a + ((b - a) * (i + 0.5)) / n);
  return (s * (b - a)) / n;
};
export const round = (n) => Number(n.toFixed(7));
