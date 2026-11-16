export type Subject = "calculus" | "geometry" | "probability";
export interface Question {
  id: string;
  year: number;
  track: string;
  number: number;
  subject: Subject;
  topic: string;
  lessonId: string;
  answer: string | number | null;
  questionUrl: string;
  answerUrl: string;
  solutionUrl: string;
  questionPage?: number;
  solutionPage?: number;
  aliases?: { year: number; track: string; number: number }[];
}
export interface LessonStep {
  title: string;
  body: string;
  math?: string;
}
export interface Lesson {
  id: string;
  title: string;
  subject: Subject;
  intro: string;
  formula: string;
  keyInsight: string;
  steps: LessonStep[];
  workedExample: { prompt: string; steps: LessonStep[]; answer: string };
  watchFor: string[] | string;
}
export const subjects: Record<
  Subject,
  { name: string; short: string; description: string; color: string }
> = {
  calculus: {
    name: "미적분",
    short: "미적분",
    description: "변화율부터 쌓이는 넓이까지",
    color: "#2563eb",
  },
  geometry: {
    name: "기하·벡터",
    short: "기하",
    description: "평면과 공간을 다른 시선으로",
    color: "#0f766e",
  },
  probability: {
    name: "확률과 통계",
    short: "확통",
    description: "경우의 수에서 분포까지",
    color: "#b45309",
  },
};
