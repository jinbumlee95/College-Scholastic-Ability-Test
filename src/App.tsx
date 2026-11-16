import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  FileText,
  Filter,
  FunctionSquare,
  Move3D,
  Search,
  Shapes,
  Sigma,
  X,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from "./components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./components/ui/dialog";
import { ProofPlayer } from "./components/ProofPlayer";
import {
  QuestionPicker,
  questionVisualCount,
} from "./components/QuestionPicker";
import { MathText } from "./components/MathText";
import { stories, type SceneId } from "./visuals/models";
import catalog from "./data/questions.json";
import lessonData from "./data/lessons.json";
import { subjects, type Subject, type Question, type Lesson } from "./types";

const questions = catalog.questions as Question[],
  lessons = lessonData as Lesson[];
const problemLibrary =
  "https://www.suneung.re.kr/boardCnts/list.do?boardID=1500234&m=0403&s=suneung";
const solutionLibrary =
  "https://www.ebsi.co.kr/ebs/xip/xipc/previousPaperList.ebs?targetCd=D300";
function loadBookmarks(): string[] {
  try {
    return JSON.parse(localStorage.getItem("math-bookmarks") || "[]");
  } catch {
    return [];
  }
}
function getRoute() {
  return new URLSearchParams(window.location.hash.slice(1));
}
function External({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <ArrowUpRight size={14} />
    </a>
  );
}
export default function App() {
  const [tab, setTab] = useState(getRoute().has("p") ? "archive" : "visuals"),
    [sceneId, setSceneId] = useState<SceneId>(
      (stories.some((s) => s.id === getRoute().get("scene"))
        ? getRoute().get("scene")
        : (stories.find((s) => s.problemId === questions[0]?.id)?.id ??
          "difference")) as SceneId,
    );
  const [selected, setSelected] = useState<string | null>(getRoute().get("p")),
    [year, setYear] = useState("all"),
    [subject, setSubject] = useState("all"),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(1),
    [savedOnly, setSavedOnly] = useState(false),
    [bookmarks, setBookmarks] = useState(loadBookmarks),
    [answerShown, setAnswerShown] = useState(false),
    [copied, setCopied] = useState(false),
    [copyFallback, setCopyFallback] = useState("");
  const question = questions.find((q) => q.id === selected),
    lesson = question
      ? lessons.find((l) => l.id === question.lessonId)
      : undefined;
  const activeStory = stories.find((s) => s.id === sceneId)!,
    activeSource = questions.find((q) => q.id === activeStory.problemId),
    questionStory = stories.find((s) => s.problemId === question?.id);
  useEffect(() => {
    const onHash = () => {
      const p = getRoute();
      setSelected(p.get("p"));
      if (p.has("p")) setTab("archive");
      const s = p.get("scene");
      if (stories.some((x) => x.id === s)) {
        setSceneId(s as SceneId);
        setTab("visuals");
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    setPage(1);
  }, [year, subject, query, savedOnly]);
  useEffect(() => {
    setAnswerShown(false);
    setCopied(false);
    setCopyFallback("");
  }, [selected]);
  const filtered = useMemo(
    () =>
      questions.filter(
        (q) =>
          (year === "all" || String(q.year) === year) &&
          (subject === "all" || q.subject === subject) &&
          (!savedOnly || bookmarks.includes(q.id)) &&
          query
            .trim()
            .split(/\s+/)
            .every((term) =>
              `${q.year} ${q.track} ${q.number} ${q.topic} ${subjects[q.subject].name}`.includes(
                term,
              ),
            ),
      ),
    [year, subject, query, savedOnly, bookmarks],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / 15)),
    visible = filtered.slice(
      (Math.min(page, pageCount) - 1) * 15,
      Math.min(page, pageCount) * 15,
    );
  function openQuestion(id: string | null) {
    setSelected(id);
    setAnswerShown(false);
    if (id) history.pushState(null, "", `#p=${id}`);
    else
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
  }
  function selectScene(id: SceneId) {
    setSceneId(id);
    setTab("visuals");
    history.replaceState(null, "", `#scene=${id}`);
  }
  function toggleSaved(id: string) {
    setBookmarks((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      try {
        localStorage.setItem("math-bookmarks", JSON.stringify(next));
      } catch {}
      return next;
    });
  }
  async function share() {
    const url = new URL(window.location.href);
    url.hash = `p=${question!.id}`;
    try {
      await navigator.clipboard.writeText(url.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyFallback(url.href);
    }
  }
  function goArchive(s?: Subject) {
    setTab("archive");
    if (s) setSubject(s);
    document.getElementById("workspace")?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
  }
  return (
    <>
      <header className="math-header" data-enter>
        <div className="math-breadcrumb">
          <a href="https://jblee.app/">공유 자료</a>
          <span>/</span>
          <span>수능 수학</span>
        </div>
        <div className="title-row">
          <div>
            <p className="math-overline">2017—2026학년도 · 본수능</p>
            <h1>수능 수학 시각화</h1>
            <p className="math-lead">
              식을 옮기고, 경계를 바꾸고, 공간을 돌려 봅니다.
              <br className="desktop-break" /> 풀이의 한 줄이 그래프에서 어떤
              변화인지 따라가 보세요.
            </p>
          </div>
          <Button variant="outline" onClick={() => goArchive()}>
            <BookOpen /> 기출 {catalog.questionCount}문항 <ArrowRight />
          </Button>
        </div>
      </header>
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="workspace"
        id="workspace"
      >
        <div className="workspace-tabs">
          <TabsList aria-label="수학 자료 종류">
            <TabsTrigger value="visuals">
              <Shapes size={16} />
              풀이 시각화
            </TabsTrigger>
            <TabsTrigger value="archive">
              <BookOpen size={16} />
              기출 자료
            </TabsTrigger>
            <TabsTrigger value="sources">
              <FileText size={16} />
              수록 기준
            </TabsTrigger>
          </TabsList>
          <span className="workspace-note">
            미적분 · 기하·벡터 · 확률과 통계
          </span>
        </div>
        <TabsContent value="visuals" className="visuals-content">
          <QuestionPicker id={sceneId} onChange={selectScene} />
          {activeSource && (
            <div className="worked-source">
              <span>
                <CheckCheck size={15} /> {activeSource.year}학년도{" "}
                {activeSource.track === "통합"
                  ? subjects[activeSource.subject].name
                  : activeSource.track}{" "}
                {activeSource.number}번 · {activeSource.topic}
              </span>
              <div>
                <External href={problemLibrary}>원문</External>
                <External href={solutionLibrary}>공식 해설</External>
              </div>
            </div>
          )}
          <ProofPlayer key={sceneId} id={sceneId} />
          <div className="learning-note">
            <span className="note-dot" />
            <p>
              장면의 번호를 눌러 풀이 순서를 바꿔 보세요. ‘조건 바꿔 보기’에서
              경계값을 움직이면 해의 개수나 도형의 관계가 달라집니다.
            </p>
          </div>
          <div className="source-disclosure">
            <span>
              {activeSource
                ? "현재 장면은 해당 기출의 수식과 좌표 조건을 사용합니다. 풀이 설명과 도형은 독립 작성했으며 공식 해설과 대조했습니다."
                : "현재 장면은 풀이 원리를 설명하는 독자 예제입니다. ‘기출’ 표시가 있는 장면은 해당 문항의 실제 조건과 연결됩니다."}
            </span>
            <Button variant="link" onClick={() => goArchive()}>
              기출 찾아보기 <ArrowRight />
            </Button>
          </div>
          <div className="subject-links">
            {(Object.keys(subjects) as Subject[]).map((s) => (
              <button key={s} onClick={() => goArchive(s)}>
                <span>
                  <strong>{subjects[s].name}</strong>
                  <small>{subjects[s].description}</small>
                </span>
                <span className="subject-count">
                  {questions.filter((q) => q.subject === s).length}
                  <ArrowUpRight size={18} />
                </span>
              </button>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="archive">
          <div className="archive-heading">
            <div>
              <h2>10개년 기출 자료</h2>
              <p>홀수형 기준 · 공통 영역 제외 · 같은 가·나형 문항은 한 번만</p>
            </div>
            <Button
              variant={savedOnly ? "secondary" : "outline"}
              onClick={() => setSavedOnly(!savedOnly)}
              aria-pressed={savedOnly}
            >
              <Bookmark fill={savedOnly ? "currentColor" : "none"} /> 저장{" "}
              {bookmarks.length}
            </Button>
          </div>
          <div className="archive-filters">
            <div className="search-field">
              <label htmlFor="question-search" className="sr-only">
                학년도, 번호 또는 주제 검색
              </label>
              <Search size={17} />
              <Input
                id="question-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="학년도, 문항 번호, 개념 검색"
              />
            </div>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger aria-label="학년도 선택">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 학년도</SelectItem>
                {catalog.years
                  .slice()
                  .reverse()
                  .map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}학년도
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger aria-label="과목 선택">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 과목</SelectItem>
                {(Object.keys(subjects) as Subject[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {subjects[s].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              aria-label="검색 조건 초기화"
              onClick={() => {
                setYear("all");
                setSubject("all");
                setQuery("");
                setSavedOnly(false);
              }}
            >
              <RotateFilter />
            </Button>
          </div>
          <div className="archive-results" role="status">
            <span>
              <strong>{filtered.length}</strong>문항
            </span>
            <span>공식 자료실 링크를 제공합니다</span>
          </div>
          <div className="question-table">
            <div className="question-table-head">
              <span>학년도 · 영역</span>
              <span>문항과 주제</span>
              <span>자료</span>
              <span className="sr-only">저장</span>
            </div>
            {visible.map((q) => (
              <div className="question-row" key={q.id}>
                <button
                  type="button"
                  className="question-open"
                  onClick={() => openQuestion(q.id)}
                >
                  <span className="question-year">
                    <strong>{q.year}</strong>
                    <span className={`subject-badge ${q.subject}`}>
                      {subjects[q.subject].short}
                      {q.track !== "통합" ? ` · ${q.track}` : ""}
                    </span>
                  </span>
                  <span className="question-topic">
                    <strong>
                      {q.number}번 <span>{q.topic}</span>
                    </strong>
                    <small>
                      {q.aliases?.length
                        ? `동일 문항: ${q.aliases.map((a) => `${a.track} ${a.number}번`).join(" · ")}`
                        : "본수능 · 홀수형"}
                    </small>
                  </span>
                  <span className="question-action">
                    {stories.some((s) => s.problemId === q.id)
                      ? "풀이·시각화"
                      : "원문·풀이"}{" "}
                    <ArrowRight size={16} />
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${q.year} ${q.number}번 ${bookmarks.includes(q.id) ? "저장 해제" : "저장"}`}
                  aria-pressed={bookmarks.includes(q.id)}
                  onClick={() => toggleSaved(q.id)}
                >
                  <Bookmark
                    size={17}
                    fill={bookmarks.includes(q.id) ? "currentColor" : "none"}
                  />
                </Button>
              </div>
            ))}
            {!visible.length && (
              <div className="empty-results">
                <Search size={30} />
                <h3>
                  {savedOnly
                    ? "조건에 맞는 저장 문항이 없습니다"
                    : "검색 결과가 없습니다"}
                </h3>
                <p>학년도나 과목 필터를 넓혀 보세요.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery("");
                    setYear("all");
                    setSubject("all");
                    setSavedOnly(false);
                  }}
                >
                  전체 문항 보기
                </Button>
              </div>
            )}
          </div>
          <div className="pagination">
            <span>
              {filtered.length ? (Math.min(page, pageCount) - 1) * 15 + 1 : 0}–
              {Math.min(Math.min(page, pageCount) * 15, filtered.length)} /{" "}
              {filtered.length}
            </span>
            <div>
              <Button
                variant="outline"
                size="icon"
                aria-label="이전 목록 페이지"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft />
              </Button>
              <span>
                {Math.min(page, pageCount)} / {pageCount}
              </span>
              <Button
                variant="outline"
                size="icon"
                aria-label="다음 목록 페이지"
                disabled={page >= pageCount}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="sources">
          <div className="source-page">
            <h2>무엇을 담았나요?</h2>
            <p>
              2026년 11월 16일 기준, 시행이 끝난 최근 10개년인 2017~2026학년도
              본수능을 수록했습니다. 6월·9월 모의평가와 짝수형은 포함하지
              않습니다.
            </p>
            <div className="coverage-numbers">
              <div>
                <strong>10</strong>
                <span>개 학년도</span>
              </div>
              <div>
                <strong>{catalog.questionCount}</strong>
                <span>개 고유 문항</span>
              </div>
              <div>
                <strong>{catalog.duplicateCount}</strong>
                <span>개 가·나형 중복 연결</span>
              </div>
            </div>
            <h3>교육과정별 선별 기준</h3>
            <table>
              <thead>
                <tr>
                  <th>학년도</th>
                  <th>포함 범위</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2022–2026</td>
                  <td>미적분·기하·확률과 통계 23–30번. 공통 1–22번 제외.</td>
                </tr>
                <tr>
                  <td>2021</td>
                  <td>
                    가형의 미적분·확률과 통계, 나형의 확률과 통계. 이 해에는
                    기하가 출제 범위에 없었습니다.
                  </td>
                </tr>
                <tr>
                  <td>2017–2020</td>
                  <td>
                    가형 미적분Ⅱ·기하와 벡터·확률과 통계, 나형 미적분Ⅰ·확률과
                    통계.
                  </td>
                </tr>
              </tbody>
            </table>
            <p>
              구 교육과정 미적분Ⅰ 문항은 현재 공통 수학Ⅱ와 일부 겹쳐도 당시의
              과목 기준으로 포함했습니다. 가·나형에서 같은 것을 묻는 문항은
              출처를 함께 연결하고 목록에서 중복을 줄였습니다.
            </p>
            <h3>원문과 해설의 출처</h3>
            <p>
              문제의 저작권은 한국교육과정평가원에, EBS 해설의 권리는 해당
              권리자에게 있습니다. 문제지·해설 PDF와 이미지를 이 사이트에
              재배포하지 않고 평가원과 EBSi의 공식 자료실 링크를 제공합니다.
            </p>
            <div className="source-links">
              <External href="https://www.suneung.re.kr/boardCnts/list.do?boardID=1500234&m=0403&s=suneung">
                평가원 기출문제 안내
              </External>
              <External href="https://www.ebsi.co.kr/ebs/xip/xipc/previousPaperList.ebs">
                EBSi 기출 자료실
              </External>
              <a href="./data/catalog.json" download>
                문항 목록 JSON 받기 <ArrowUpRight size={14} />
              </a>
            </div>
            <h3>시각화와 해설을 읽는 방법</h3>
            <p>
              수록 문항 {catalog.questionCount}개 중 {questionVisualCount}개에
              문항별 풀이와 시각화가 연결되어 있습니다. 과목·학년도·번호로
              선택하거나 기출 목록에서 바로 열 수 있습니다. 각 장면은 문제의
              실제 조건으로 작성했으며, 별도의 원리 예제는 ‘원리 예제’에서 볼 수
              있습니다.
            </p>
            <p>
              근사값은 화면에서 반올림했습니다. 그래프의 움직임은 식 사이의
              관계를 보여주며, 단계 사이의 중간 좌표는 장면을 연결하는
              전환입니다. 극한이나 연속성의 증명은 함께 적힌 수식으로
              확인합니다. 저장한 문항은 현재 브라우저에만 보관됩니다.
            </p>
            <h3>학년도별 공식 자료</h3>
            <div className="exam-source-list">
              {catalog.exams.map((e, i) => (
                <div key={i}>
                  <span>
                    {e.year} ·{" "}
                    {"subject" in e
                      ? subjects[e.subject as Subject].name
                      : e.track}
                  </span>
                  <External href={problemLibrary}>문제 자료실</External>
                  <External href={solutionLibrary}>해설 자료실</External>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <footer className="math-footer">
        <span>이진범 · 수학 학습 자료</span>
        <span>문제 한국교육과정평가원 · 공식 해설 EBSi</span>
        <a
          href="./third-party-notices.txt"
          target="_blank"
          rel="noopener noreferrer"
        >
          오픈소스 라이선스
        </a>
        <a href="https://jblee.app/">
          포트폴리오 <ArrowUpRight size={14} />
        </a>
      </footer>
      <Dialog
        open={Boolean(question)}
        onOpenChange={(open) => {
          if (!open) openQuestion(null);
        }}
      >
        <DialogContent className="question-dialog">
          <DialogHeader>
            <div className="question-dialog-meta">
              <Badge variant="secondary">
                {question ? subjects[question.subject].name : ""}
              </Badge>
              <span>
                {question?.year}학년도 · {question?.track} · 홀수형
              </span>
            </div>
            <DialogTitle>
              {question?.number}번 · {question?.topic}
            </DialogTitle>
            <DialogDescription>
              문항별 풀이와 시각화를 열고 공식 원문·해설을 함께 확인합니다.
            </DialogDescription>
          </DialogHeader>
          {question && (
            <>
              <div className="question-source-buttons">
                <Button asChild variant="outline">
                  <a
                    href={problemLibrary}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText />
                    문제 원문 <ExternalLink />
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a
                    href={solutionLibrary}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <BookOpen />
                    공식 풀이 <ExternalLink />
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="이 문항 공유 링크 복사"
                  onClick={share}
                >
                  {copied ? <Check /> : <Copy />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={
                    bookmarks.includes(question.id) ? "저장 해제" : "문항 저장"
                  }
                  onClick={() => toggleSaved(question.id)}
                >
                  <Bookmark
                    fill={
                      bookmarks.includes(question.id) ? "currentColor" : "none"
                    }
                  />
                </Button>
              </div>
              {questionStory && (
                <Button
                  className="open-worked"
                  variant="secondary"
                  onClick={() => {
                    setSelected(null);
                    selectScene(questionStory.id);
                  }}
                >
                  <Shapes />이 문항의 단계별 시각화 보기 <ArrowRight />
                </Button>
              )}
              {copied && (
                <p className="status-message" role="status">
                  문항 링크를 복사했습니다.
                </p>
              )}
              {copyFallback && (
                <div>
                  <label htmlFor="share-link">
                    이 주소를 복사해 공유하세요
                  </label>
                  <Input
                    id="share-link"
                    readOnly
                    value={copyFallback}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              )}
              <div className="answer-reveal">
                <span>홀수형 정답</span>
                {answerShown ? (
                  <strong>{question.answer}</strong>
                ) : (
                  <Button variant="ghost" onClick={() => setAnswerShown(true)}>
                    정답 확인하기
                  </Button>
                )}
              </div>
              {question.aliases?.length ? (
                <p className="duplicate-note">
                  같은 문항:{" "}
                  {question.aliases
                    .map((a) => `${a.year}학년도 ${a.track} ${a.number}번`)
                    .join(", ")}
                  . 선택지 순서가 다를 수 있으므로 해당 형의 정답표를
                  확인하세요.
                </p>
              ) : null}
              {lesson && (
                <div className="related-concept">
                  <div className="related-head">
                    <h3>풀이에 쓰이는 개념</h3>
                    <span>독자 개념 설명</span>
                  </div>
                  <h4>{lesson.title}</h4>
                  <p>{lesson.intro}</p>
                  <MathText value={lesson.formula} block />
                  <ol>
                    {lesson.steps.map((s, i) => (
                      <li key={i}>
                        <strong>{s.title}</strong>
                        <p>{s.body}</p>
                        {s.math && <MathText value={s.math} block />}
                      </li>
                    ))}
                  </ol>
                  <div className="concept-caution">
                    {typeof lesson.watchFor === "string"
                      ? lesson.watchFor
                      : lesson.watchFor.join(" ")}
                  </div>
                </div>
              )}
              <p className="source-detail">
                공식 자료실에서 {question.year - 1}년 시행 본수능 · 수학 ·
                홀수형을 선택하세요. 파일을 직접 내려받지 않고 자료실을 새
                탭으로 엽니다. 원문 {question.questionPage}쪽 · 해설{" "}
                {question.solutionPage}쪽은 PDF 뷰어 기준입니다.
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
function RotateFilter() {
  return <Filter size={17} />;
}
