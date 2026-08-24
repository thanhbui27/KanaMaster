"use client";

import { ArrowLeft, ArrowRight, Check, Clock3, RotateCcw, Settings2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { KanaScopeSelector } from "@/components/tests/kana-scope-selector";
import type { KanaScript } from "@/data/kana";
import { buildTestQuestions, normalizeTestAnswer, type TestQuestion } from "@/lib/test-engine";
import { demoProgress, readProgress, recordQuestionResult, recordReviewComplete, recordTestComplete, type LearningProgress } from "@/lib/progress-storage";
import { buildRandomSession } from "@/lib/test-randomization";
import { DEFAULT_TEST_SETTINGS, readTestSettings, writeTestSettings, type TestKind, type TestSettings } from "@/lib/test-settings";

type Phase = "loading" | "setup" | "running" | "finished";
type AnswerResult = { question: TestQuestion; userAnswer: string; correct: boolean; timedOut: boolean };
type StandardTestKind = Exclude<TestKind, "handwriting">;

const kindLabels: Record<StandardTestKind, string> = { character: "Character Test", word: "Word Test", phrase: "Phrase Test", review: "Smart Review" };

export function TestRunner({ script, kind }: { script: KanaScript; kind: StandardTestKind }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [settings, setSettings] = useState<TestSettings>(DEFAULT_TEST_SETTINGS);
  const [progress, setProgress] = useState<LearningProgress>(demoProgress);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<AnswerResult | null>(null);
  const [results, setResults] = useState<AnswerResult[]>([]);
  const [remaining, setRemaining] = useState(DEFAULT_TEST_SETTINGS.secondsPerQuestion);
  const [startedAt, setStartedAt] = useState(0);
  const [finishedAt, setFinishedAt] = useState(0);
  const [validation, setValidation] = useState("");
  const answerLocked = useRef(false);
  const timeoutAdvance = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeQuestionToken = useRef(0);
  const gradeRef = useRef<(rawAnswer: string, timedOut?: boolean, token?: number) => void>(() => undefined);
  const currentQuestion = questions[questionIndex];
  const setupQuestionCount = useMemo(() => buildTestQuestions(
    script,
    kind,
    { ...settings, questionCount: "unlimited" },
    progress.tracks[script],
  ).length, [kind, progress.tracks, script, settings]);
  const canStart = settings.categories.length > 0 && settings.rows.length > 0 && setupQuestionCount > 0;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setSettings(readTestSettings(script, kind));
      setProgress(readProgress());
      setPhase("setup");
    });
    return () => cancelAnimationFrame(frame);
  }, [kind, script]);

  useEffect(() => () => {
    if (timeoutAdvance.current) clearTimeout(timeoutAdvance.current);
  }, []);

  const finish = useCallback((nextResults: AnswerResult[]) => {
    setResults(nextResults);
    setFinishedAt(Date.now());
    setPhase("finished");
    const correct = nextResults.filter((item) => item.correct).length;
    setProgress(recordTestComplete(script, correct, nextResults.length));
    if (kind === "review") setProgress(recordReviewComplete(script));
  }, [kind, script]);

  const moveNext = useCallback((nextResults = results, token = activeQuestionToken.current) => {
    if (token !== activeQuestionToken.current) return;
    if (timeoutAdvance.current) {
      clearTimeout(timeoutAdvance.current);
      timeoutAdvance.current = null;
    }
    if (questionIndex >= questions.length - 1) {
      activeQuestionToken.current += 1;
      finish(nextResults);
      return;
    }
    activeQuestionToken.current += 1;
    answerLocked.current = false;
    setRemaining(Math.max(5, settings.secondsPerQuestion));
    setQuestionIndex((value) => value + 1);
    setInput("");
    setFeedback(null);
    setValidation("");
  }, [finish, questionIndex, questions.length, results, settings.secondsPerQuestion]);

  const grade = useCallback((rawAnswer: string, timedOut = false, token = activeQuestionToken.current) => {
    if (token !== activeQuestionToken.current || !currentQuestion || answerLocked.current) return;
    if (!timedOut && !rawAnswer.trim()) {
      setValidation("Enter an answer, or use Skip.");
      return;
    }
    answerLocked.current = true;
    const normalized = normalizeTestAnswer(rawAnswer);
    const correct = !timedOut && currentQuestion.acceptedAnswers.some((answer) => normalizeTestAnswer(answer) === normalized);
    const result: AnswerResult = { question: currentQuestion, userAnswer: rawAnswer.trim() || "—", correct, timedOut };
    const nextResults = [...results, result];
    setResults(nextResults);
    setFeedback(result);
    setValidation("");
    setProgress(recordQuestionResult(script, currentQuestion.kanaIds, correct));
    if (timedOut) {
      if (timeoutAdvance.current) clearTimeout(timeoutAdvance.current);
      timeoutAdvance.current = setTimeout(() => moveNext(nextResults, token), 1200);
    }
  }, [currentQuestion, moveNext, results, script]);

  useEffect(() => {
    gradeRef.current = grade;
  }, [grade]);

  useEffect(() => {
    if (phase !== "running" || feedback || !settings.timerEnabled || !currentQuestion) return;
    const seconds = Math.max(5, settings.secondsPerQuestion);
    const timerToken = activeQuestionToken.current;
    const questionDeadline = Date.now() + seconds * 1000;
    const timer = window.setInterval(() => {
      if (timerToken !== activeQuestionToken.current) {
        window.clearInterval(timer);
        return;
      }
      const next = Math.max(0, Math.ceil((questionDeadline - Date.now()) / 1000));
      setRemaining(next);
      if (next === 0) {
        window.clearInterval(timer);
        gradeRef.current("", true, timerToken);
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [currentQuestion, feedback, phase, questionIndex, settings.secondsPerQuestion, settings.timerEnabled]);

  const start = (retryQuestions?: TestQuestion[]) => {
    if (timeoutAdvance.current) clearTimeout(timeoutAdvance.current);
    activeQuestionToken.current += 1;
    if (!retryQuestions && (!settings.categories.length || !settings.rows.length)) {
      setValidation("Select at least one Kana category and row.");
      return;
    }
    writeTestSettings(script, kind, settings);
    const nextQuestions = retryQuestions
      ? buildRandomSession(retryQuestions, { limit: "unlimited" })
      : buildTestQuestions(script, kind, settings, progress.tracks[script]);
    setQuestions(nextQuestions);
    setQuestionIndex(0);
    setResults([]);
    setFeedback(null);
    setInput("");
    setValidation("");
    answerLocked.current = false;
    setStartedAt(Date.now());
    setRemaining(Math.max(5, settings.secondsPerQuestion));
    setFinishedAt(0);
    setPhase(nextQuestions.length ? "running" : "setup");
    if (!nextQuestions.length) setValidation("No questions match these settings. Choose another group or difficulty.");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    grade(input);
  };

  const correctCount = useMemo(() => results.filter((item) => item.correct).length, [results]);
  const wrongResults = useMemo(() => results.filter((item) => !item.correct), [results]);
  const elapsedSeconds = Math.max(0, Math.round((finishedAt - startedAt) / 1000));
  const scriptLabel = script === "hiragana" ? "Hiragana" : "Katakana";

  if (phase === "loading") return <main className="test-page"><section className="test-card empty-state"><h1>Loading…</h1></section></main>;

  return (
    <main className="test-page">
      <header className="subpage-topbar test-topbar">
        <Link href="/practice" aria-label="Exit test"><ArrowLeft size={20} /></Link>
        <strong>{scriptLabel} · {kindLabels[kind]}</strong>
        {phase === "running" ? <span className="timer-chip"><Clock3 size={14} /> {settings.timerEnabled ? `${remaining}s` : "No timer"}</span> : <span>{scriptLabel}</span>}
      </header>

      {phase === "setup" && (
        <section className="test-card settings-card">
          <Settings2 size={32} />
          <span className="track-badge">{script === "hiragana" ? "ひ" : "カ"} {scriptLabel.toUpperCase()} ONLY</span>
          <h1>{kindLabels[kind]}</h1>
          <p>Questions and statistics stay inside the {scriptLabel} track.</p>
          <div className="settings-grid">
            <label><span>Test type</span><select value={kind} onChange={(event) => { const next = event.target.value; router.push(next === "handwriting" ? "/practice/handwriting" : `/test/${script}/${next}`); }}><option value="character">Character</option><option value="word">Word</option><option value="phrase">Phrase</option><option value="handwriting">Handwriting</option><option value="review">Smart Review</option></select></label>
            <label><span>Kana script</span><select value={script} onChange={(event) => router.push(`/test/${event.target.value}/${kind}`)}><option value="hiragana">Hiragana only</option><option value="katakana">Katakana only</option></select></label>
            <label><span>Timer</span><select value={settings.timerEnabled ? "on" : "off"} onChange={(event) => setSettings({ ...settings, timerEnabled: event.target.value === "on" })}><option value="on">On</option><option value="off">Off</option></select></label>
            <label><span>Seconds / question</span><input type="number" min="5" max="300" disabled={!settings.timerEnabled} value={settings.secondsPerQuestion} onChange={(event) => setSettings({ ...settings, secondsPerQuestion: Number(event.target.value) })} /></label>
            <label><span>Questions</span><select value={settings.questionCount} onChange={(event) => setSettings({ ...settings, questionCount: event.target.value === "unlimited" ? "unlimited" : Number(event.target.value) as 10 | 20 | 50 })}><option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="unlimited">Unlimited</option></select></label>
            {kind === "character" && <label><span>Direction</span><select value={settings.direction} onChange={(event) => setSettings({ ...settings, direction: event.target.value as TestSettings["direction"] })}><option value="kana-to-romaji">Kana → Romaji</option><option value="romaji-to-kana">Romaji → Kana</option><option value="random">Both</option></select></label>}
            {(kind === "word" || kind === "phrase") && <label><span>Difficulty</span><select value={settings.difficulty} onChange={(event) => setSettings({ ...settings, difficulty: event.target.value as TestSettings["difficulty"] })}><option value="all">All</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>}
          </div>
          <KanaScopeSelector script={script} settings={settings} onChange={(next) => { setSettings(next); setValidation(""); }} />
          {setupQuestionCount > 0 && <p className="scope-availability">{setupQuestionCount} matching questions available{settings.questionCount !== "unlimited" && settings.questionCount > setupQuestionCount ? ` · this test will use all ${setupQuestionCount}` : ""}.</p>}
          {settings.categories.length > 0 && settings.rows.length > 0 && setupQuestionCount === 0 && <p className="form-error" role="alert">No questions match this scope and difficulty. Select more Kana rows.</p>}
          {validation && <p className="form-error" role="alert">{validation}</p>}
          <button className="primary-button test-start-button" type="button" disabled={!canStart} onClick={() => start()}>Start {scriptLabel} test <ArrowRight size={18} /></button>
        </section>
      )}

      {phase === "running" && currentQuestion && (
        <section className="test-card running-test-card">
          <div className="test-progress"><span>{questionIndex + 1} / {questions.length}</span><i><b style={{ width: `${((questionIndex + (feedback ? 1 : 0)) / questions.length) * 100}%` }} /></i><span>{correctCount} correct</span></div>
          <div className="test-question">
            <span>{currentQuestion.direction === "romaji-to-kana" ? "TYPE THE KANA" : "TYPE THE ROMAJI"}</span>
            <h1 className={currentQuestion.prompt.length > 8 ? "long" : ""}>{currentQuestion.prompt}</h1>
            <p>{currentQuestion.direction === "romaji-to-kana" ? `Which ${scriptLabel} character is this?` : "What is the reading?"}</p>
          </div>
          <form className="typing-form test-answer-form" onSubmit={submit}>
            <input autoFocus value={input} onChange={(event) => setInput(event.target.value)} disabled={Boolean(feedback)} placeholder={currentQuestion.direction === "romaji-to-kana" ? `Type ${scriptLabel}…` : "Type romaji…"} autoCapitalize="none" autoCorrect="off" />
            {!feedback && <div className="test-submit-row"><button type="button" className="skip-button" onClick={() => grade("", true)}>Skip</button><button type="submit">Check answer</button></div>}
          </form>
          {validation && <p className="form-error" role="alert">{validation}</p>}
          {feedback && (
            <div className={`answer-feedback ${feedback.correct ? "correct" : "wrong"}`} role="status">
              {feedback.correct ? <Check size={20} /> : <X size={20} />}
              <div><strong>{feedback.correct ? "Correct!" : feedback.timedOut ? "Time’s up" : "Not quite"}</strong><span>Correct answer: {feedback.question.answer}</span></div>
              {!feedback.timedOut && <button type="button" onClick={() => moveNext()}>Next <ArrowRight size={16} /></button>}
            </div>
          )}
        </section>
      )}

      {phase === "finished" && (
        <section className="test-card results-card">
          <span className="track-badge">{scriptLabel.toUpperCase()} COMPLETE</span>
          <div className="result-score">{results.length ? Math.round((correctCount / results.length) * 100) : 0}%</div>
          <h1>Test complete</h1>
          <div className="result-stats"><span><b>{correctCount}</b>Correct</span><span><b>{wrongResults.length}</b>Wrong</span><span><b>{elapsedSeconds}s</b>Time</span><span><b>{progress.tracks[script].bestScore}%</b>Best</span></div>
          {wrongResults.length > 0 ? (
            <div className="mistake-list"><h2>Answers to review</h2>{wrongResults.map((item, index) => <article key={`${item.question.id}-${index}`}><strong>{item.question.prompt}</strong><span>Your answer: {item.userAnswer}</span><b>{item.question.answer}</b></article>)}</div>
          ) : <p className="perfect-message">No mistakes this time. Nice work!</p>}
          <div className="result-buttons">
            <button type="button" onClick={() => start()}><RotateCcw size={16} /> New test</button>
            <button type="button" disabled={!wrongResults.length} onClick={() => start(wrongResults.map((item) => item.question))}>Retry mistakes <ArrowRight size={16} /></button>
          </div>
        </section>
      )}
      <MobileNav />
    </main>
  );
}
