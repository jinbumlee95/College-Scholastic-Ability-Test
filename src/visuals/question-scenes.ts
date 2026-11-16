import manifest from "../data/question-visuals.json";
import type { Model, Point, Story } from "./models";

export interface QuestionVisual {
  id: string;
  subject: Story["subject"];
  title: string;
  summary: string;
  answer: string;
  result: string;
  steps: (Story["steps"][number] & { model: Model })[];
  verified: boolean;
}
export const questionManifest = manifest as (Omit<QuestionVisual, "steps"> & {
  steps: Story["steps"];
})[];
const cache = new Map<string, QuestionVisual>();
export const questionSceneId = (id: string) => `q:${id}`;
export const isQuestionScene = (id: string) => id.startsWith("q:");
export const isQuestionLoaded = (id: string) => cache.has(id.slice(2));
export function registerQuestionVisual(visual: QuestionVisual) {
  cache.set(visual.id, visual);
}
export function questionBounds(id: string) {
  const q = cache.get(id.slice(2));
  if (!q) return null;
  const points = q.steps
    .filter((s) => s.model.threeD)
    .flatMap((s) => [
      ...s.model.lines.flatMap((l) => l.points),
      ...s.model.surfaces.flatMap((s) => s.points),
      ...s.model.dots.map((d) => d.at),
    ]);
  if (!points.length) return null;
  const min = [0, 1, 2].map((i) =>
      Math.min(...points.map((p) => p[i])),
    ) as Point,
    max = [0, 1, 2].map((i) => Math.max(...points.map((p) => p[i]))) as Point;
  const center = min.map((v, i) => (v + max[i]) / 2) as Point;
  const radius = Math.max(
    1,
    ...points.map((p) => Math.hypot(...p.map((v, i) => v - center[i]))),
  );
  return { min, max, center, radius };
}
export async function loadQuestionVisual(id: string, signal?: AbortSignal) {
  if (!isQuestionScene(id) || isQuestionLoaded(id)) return;
  const key = id.slice(2);
  if (!questionManifest.some((q) => q.id === key))
    throw Error("수록되지 않은 문항입니다.");
  const response = await fetch(
    new URL(`./data/visuals/${encodeURIComponent(key)}.json`, document.baseURI),
    { signal },
  );
  if (!response.ok) throw Error("문항 시각화를 불러오지 못했습니다.");
  const data = (await response.json()) as QuestionVisual;
  if (data.id !== key || !data.verified || data.steps.length < 3)
    throw Error("문항 데이터가 올바르지 않습니다.");
  cache.set(key, data);
}
export const questionStories: Story[] = (
  manifest as unknown as QuestionVisual[]
)
  .filter((q) => q.verified)
  .map((q) => ({
    id: questionSceneId(q.id),
    problemId: q.id,
    subject: q.subject,
    title: q.title,
    subtitle: q.summary,
    parameters: [],
    steps: q.steps.map(({ title, formula, body }) => ({
      title,
      formula,
      body,
    })),
  }));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function coordinates(a: Point[], b: Point[], t: number): Point[] {
  const n = Math.max(a.length, b.length);
  const sample = (ps: Point[], i: number) => {
    if (ps.length === 1) return ps[0];
    const u = (i / (n - 1)) * (ps.length - 1),
      lo = Math.floor(u),
      hi = Math.min(ps.length - 1, lo + 1);
    return ps[lo].map((v, j) => lerp(v, ps[hi][j], u - lo)) as Point;
  };
  return Array.from({ length: n }, (_, i) => {
    const u = sample(a, i),
      v = sample(b, i);
    return u.map((x, j) => lerp(x, v[j], t)) as Point;
  });
}
export function questionModel(id: string, progress: number): Model {
  const visual = cache.get(id.slice(2));
  if (!visual) throw Error(`문항 데이터 로딩 전 렌더링: ${id}`);
  progress = Math.max(0, Math.min(visual.steps.length - 1, progress));
  const lo = Math.floor(progress),
    hi = Math.ceil(progress),
    a = visual.steps[lo].model,
    b = visual.steps[hi].model,
    t = progress - lo;
  if (lo === hi) return a;
  const geometry = <T extends { points: Point[]; opacity?: number }>(
    aa: T[],
    bb: T[],
  ) =>
    Array.from({ length: Math.max(aa.length, bb.length) }, (_, i) => {
      const x = aa[i],
        y = bb[i];
      if (!x) return { ...y, opacity: (y.opacity ?? 1) * t };
      if (!y) return { ...x, opacity: (x.opacity ?? 1) * (1 - t) };
      return {
        ...(t < 0.5 ? x : y),
        points: coordinates(x.points, y.points, t),
        opacity: lerp(x.opacity ?? 1, y.opacity ?? 1, t),
      };
    });
  return {
    ...(t < 0.5 ? a : b),
    range: a.range.map((v, i) => lerp(v, b.range[i], t)) as Model["range"],
    lines: geometry(a.lines, b.lines),
    surfaces: geometry(a.surfaces, b.surfaces) as Model["surfaces"],
    dots: Array.from(
      { length: Math.max(a.dots.length, b.dots.length) },
      (_, i) => {
        const x = a.dots[i],
          y = b.dots[i];
        if (!x) return { ...y, opacity: t };
        if (!y) return { ...x, opacity: 1 - t };
        return {
          ...(t < 0.5 ? x : y),
          at: x.at.map((v, j) => lerp(v, y.at[j], t)) as Point,
          size: lerp(x.size ?? 0.065, y.size ?? 0.065, t),
        };
      },
    ),
  };
}
