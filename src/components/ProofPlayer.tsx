import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Play,
  Pause,
  Check,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { MathText } from "./MathText";
import { defaults, stories, makeModel, type SceneId } from "../visuals/models";
import { format } from "../lib/math.mjs";
import {
  isQuestionScene,
  isQuestionLoaded,
  loadQuestionVisual,
} from "../visuals/question-scenes";
const MathScene = lazy(() => import("./MathScene"));
export function ProofPlayer({
  id,
  compact = false,
}: {
  id: SceneId;
  compact?: boolean;
}) {
  const [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0),
    [, refresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    loadQuestionVisual(id, controller.signal)
      .then(() => {
        if (!controller.signal.aborted) refresh((n) => n + 1);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [id, attempt]);
  if (isQuestionScene(id) && !isQuestionLoaded(id))
    return (
      <div className="question-visual-loading" role="status">
        <ShapesPlaceholder />
        <h3>{stories.find((s) => s.id === id)?.title}</h3>
        <p>{error || "이 문항의 그래프와 풀이를 불러오고 있습니다."}</p>
        {error && (
          <Button variant="outline" onClick={() => setAttempt((n) => n + 1)}>
            다시 불러오기
          </Button>
        )}
      </div>
    );
  return <LoadedProofPlayer key={id} id={id} compact={compact} />;
}
function ShapesPlaceholder() {
  return (
    <div className="loading-orbit" aria-hidden="true">
      ∫
    </div>
  );
}
function LoadedProofPlayer({
  id,
  compact = false,
}: {
  id: SceneId;
  compact?: boolean;
}) {
  const story = stories.find((x) => x.id === id)!,
    [step, setStep] = useState(0),
    [parameters, setParameters] = useState(() => defaults(id)),
    [playing, setPlaying] = useState(false),
    [resetKey, setResetKey] = useState(0);
  useEffect(() => {
    setStep(0);
    setParameters(defaults(id));
    setPlaying(false);
  }, [id]);
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      if (step === story.steps.length - 1) setPlaying(false);
      else setStep(Math.min(story.steps.length - 1, Math.floor(step) + 1));
    }, 3000);
    return () => clearTimeout(timer);
  }, [playing, step, story.steps.length]);
  const activeIndex = Math.min(Math.round(step), story.steps.length - 1);
  const active = story.steps[activeIndex],
    model = useMemo(
      () => makeModel(id, parameters, step),
      [id, parameters, step],
    );
  const jump = (index: number) => {
    setPlaying(false);
    setStep(index);
  };
  return (
    <div className={`proof-player ${compact ? "proof-compact" : ""}`}>
      <div className="proof-stage">
        <div className="proof-toolbar">
          <span className="lesson-category">
            {story.subject === "calculus"
              ? "미적분"
              : story.subject === "geometry"
                ? "기하·벡터"
                : "확률과 통계"}
          </span>
          <span className="step-count">
            {activeIndex + 1} / {story.steps.length} 단계
          </span>
        </div>
        <div className="formula-band" aria-live="polite">
          <MathText value={active.formula} block />
        </div>
        <Suspense
          fallback={<div className="scene-loading">시각화 불러오는 중…</div>}
        >
          <MathScene
            id={id}
            parameters={parameters}
            step={step}
            resetKey={resetKey}
            compact={compact}
          />
        </Suspense>
        {model.metrics.length>0&&<div className="metric-strip">
          {model.metrics.map((v) => (
            <div key={v.label}>
              <span>{v.label}</span>
              <strong>{v.value}</strong>
            </div>
          ))}
        </div>}
        {model.inspection && (
          <p className="outcome-inspection" aria-live="polite">
            {model.inspection}
          </p>
        )}
        <div className="playback-bar">
          <Button
            variant="ghost"
            size="icon"
            aria-label="시각화 초기화"
            onClick={() => {
              jump(0);
              setParameters(defaults(id));
              setResetKey((x) => x + 1);
            }}
          >
            <RotateCcw />
          </Button>
          <div className="playback-center">
            <Button
              variant="outline"
              size="icon"
              aria-label="이전 풀이 단계"
              disabled={step === 0}
              onClick={() => jump(Math.max(0, Math.ceil(step) - 1))}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="default"
              onClick={() => {
                if (step === story.steps.length - 1) setStep(0);
                setPlaying(!playing);
              }}
            >
              {playing ? <Pause /> : <Play />}
              {playing ? "일시정지" : "단계 재생"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="다음 풀이 단계"
              disabled={step === story.steps.length - 1}
              onClick={() =>
                jump(Math.min(story.steps.length - 1, Math.floor(step) + 1))
              }
            >
              <ChevronRight />
            </Button>
          </div>
          <span className="playback-duration">단계별 3초</span>
        </div>
        <div className="phase-scrubber">
          <label id={`phase-label-${id}`}>풀이 전환 살펴보기</label>
          <Slider
            aria-labelledby={`phase-label-${id}`}
            min={0}
            max={story.steps.length - 1}
            step={0.01}
            value={[step]}
            onValueChange={([value]) => jump(value)}
          />
        </div>
      </div>
      <div className="proof-reading">
        <h3>{story.title}</h3>
        <p className="proof-subtitle">{story.subtitle}</p>
        <ol className="proof-steps">
          {story.steps.map((s, i) => (
            <li key={s.title}>
              <button
                type="button"
                className={
                  activeIndex === i ? "proof-step active" : "proof-step"
                }
                aria-current={activeIndex === i ? "step" : undefined}
                onClick={() => jump(i)}
              >
                <span className="step-number">
                  {i < activeIndex ? (
                    <Check size={14} />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                <span>
                  <strong>{s.title}</strong>
                  {activeIndex === i && (
                    <span className="step-explanation">{s.body}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ol>
        {story.parameters.length > 0 && (
          <div className="parameter-panel">
            <h4>
              <SlidersHorizontal size={15} />{" "}
              {story.problemId ? "관찰하는 위치 바꾸기" : "조건 바꿔 보기"}
            </h4>
            {story.parameters.map((p) => (
              <div className="parameter" key={p.key}>
                <div>
                  <label id={`label-${id}-${p.key}`}>{p.label}</label>
                  <output>
                    {format(parameters[p.key])}
                    {p.unit}
                  </output>
                </div>
                <Slider
                  aria-labelledby={`label-${id}-${p.key}`}
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  value={[parameters[p.key] ?? p.initial]}
                  onValueChange={([v]) => {
                    setPlaying(false);
                    setParameters((prev) => ({ ...prev, [p.key]: v }));
                  }}
                />
              </div>
            ))}
            {id === "piecewise" && (
              <Button
                variant="outline"
                className="continuity-button"
                onClick={() => {
                  setParameters((p) => ({ ...p, b: p.c * p.c - 2 * p.c }));
                  jump(3);
                }}
              >
                연속 조건에 맞추기
              </Button>
            )}
            {id === "difference" && (
              <Button
                variant="outline"
                className="continuity-button"
                onClick={() => {
                  setParameters({ a: -0.25 });
                  jump(3);
                }}
              >
                중근이 되는 경계 보기
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
