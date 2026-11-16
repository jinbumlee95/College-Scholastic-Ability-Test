import { useRef } from "react";
import { BookOpen, Shapes } from "lucide-react";
import { Button } from "./ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from "./ui/select";
import { stories } from "../visuals/models";
import catalog from "../data/questions.json";
import { subjects, type Question, type Subject } from "../types";

const available = (catalog.questions as Question[]).flatMap((q) => {
  const story = stories.find((s) => s.problemId === q.id);
  return story ? [{ ...q, scene: story.id }] : [];
});
const examples = stories.filter((s) => !s.problemId);
export const questionVisualCount = available.length;
export function QuestionPicker({
  id,
  onChange,
}: {
  id: string;
  onChange: (id: string) => void;
}) {
  const active = available.find((q) => q.scene === id),
    last = useRef(available[0]?.scene);
  if (active) last.current = active.scene;
  const subject = active?.subject ?? "calculus",
    year = active?.year ?? 2026;
  const years = [
    ...new Set(
      available.filter((q) => q.subject === subject).map((q) => q.year),
    ),
  ];
  const questions = available
    .filter((q) => q.subject === subject && q.year === year)
    .sort((a, b) => a.track.localeCompare(b.track) || a.number - b.number);
  const changeSubject = (s: Subject) => {
    const q =
      available.find((q) => q.subject === s && q.year === year) ||
      available.find((q) => q.subject === s);
    if (q) onChange(q.scene);
  };
  return (
    <div className="question-picker">
      <div className="picker-heading">
        <div className="picker-modes" role="group" aria-label="시각화 종류">
          <Button
            variant={active ? "secondary" : "ghost"}
            aria-pressed={!!active}
            onClick={() => last.current && onChange(last.current)}
          >
            <BookOpen size={16} />
            기출 풀이
          </Button>
          <Button
            variant={!active ? "secondary" : "ghost"}
            aria-pressed={!active}
            onClick={() => onChange(examples[0].id)}
          >
            <Shapes size={16} />
            원리 예제
          </Button>
        </div>
        <span className="coverage-label">
          문항별 시각화 {questionVisualCount} / {catalog.questionCount}
        </span>
      </div>
      {active ? (
        <div className="question-picker-fields">
          <div>
            <label id="visual-subject-label">과목</label>
            <Select
              value={subject}
              onValueChange={(s) => changeSubject(s as Subject)}
            >
              <SelectTrigger aria-labelledby="visual-subject-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(subjects) as Subject[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {subjects[s].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label id="visual-year-label">학년도</label>
            <Select
              value={String(year)}
              onValueChange={(y) => {
                const q = available.find(
                  (q) => q.subject === subject && q.year === Number(y),
                );
                if (q) onChange(q.scene);
              }}
            >
              <SelectTrigger aria-labelledby="visual-year-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}학년도
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label id="visual-question-label">문항</label>
            <Select value={id} onValueChange={onChange}>
              <SelectTrigger aria-labelledby="visual-question-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {questions.map((q) => (
                  <SelectItem key={q.id} value={q.scene}>
                    {q.track === "통합" ? "" : q.track + " · "}
                    {q.number}번 · {q.topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <div
          className="scene-selectors"
          role="group"
          aria-label="원리 예제 선택"
        >
          {examples.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`scene-selector ${s.id === id ? "active" : ""}`}
              aria-pressed={s.id === id}
              onClick={() => onChange(s.id)}
            >
              {s.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
