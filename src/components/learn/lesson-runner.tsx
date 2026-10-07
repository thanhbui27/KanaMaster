"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eraser,
  Keyboard,
  LockKeyhole,
  Pencil,
  RotateCcw,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { HandwritingCanvas } from "@/components/handwriting/handwriting-canvas";
import { KANA_BY_SCRIPT, type KanaEntry } from "@/data/kana";
import {
  LEARN_LESSONS,
  isLessonUnlocked,
  type LearnLesson,
} from "@/lib/learn-lessons";
import {
  collectHandwritingAttempt,
  handwritingRecognizer,
} from "@/lib/handwriting/template-recognizer";
import {
  readProgress,
  recordLearnLessonComplete,
  type LearningProgress,
} from "@/lib/progress-storage";
import type { Stroke } from "@/types/handwriting";
import { calculateWritingScores } from "@/lib/handwriting/scoring";

type LessonRunnerProps = {
  lesson: LearnLesson;
};

type LessonStep = "choice" | "typing" | "writing";
type AnswerState = "idle" | "correct" | "wrong";

const steps: Array<{
  id: LessonStep;
  label: string;
  icon: typeof CheckCircle2;
}> = [
  { id: "choice", label: "Choose", icon: CheckCircle2 },
  { id: "typing", label: "Type", icon: Keyboard },
  { id: "writing", label: "Write", icon: Pencil },
];

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed: number) {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithSeed<T>(values: T[], seed: number) {
  const shuffled = [...values];
  const random = createRandom(seed);
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

function createChoices(kana: KanaEntry, token: string) {
  const distractors = Array.from(
    new Set(
      KANA_BY_SCRIPT[kana.script].filter((item) => item.romaji !== kana.romaji).map(
        (item) => item.romaji,
      ),
    ),
  );
  const selected = shuffleWithSeed(
    distractors,
    hashSeed(`${token}:distractors`),
  ).slice(0, 3);
  return shuffleWithSeed(
    [...selected, kana.romaji],
    hashSeed(`${token}:answers`),
  );
}

export function LessonRunner({ lesson }: LessonRunnerProps) {
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [kanaIndex, setKanaIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [checkingWriting, setCheckingWriting] = useState(false);
  const [writingMatch, setWritingMatch] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setProgress(readProgress()));
    return () => cancelAnimationFrame(frame);
  }, []);

  const completedLessonIds = useMemo(
    () =>
      new Set(
        Object.keys(progress?.lessonProgress ?? {}).filter(
          (id) => progress?.lessonProgress[id]?.completedAt,
        ),
      ),
    [progress],
  );
  const lessonIndex = LEARN_LESSONS.findIndex((item) => item.id === lesson.id);
  const unlocked =
    progress !== null && isLessonUnlocked(completedLessonIds, lessonIndex);
  const activeSteps = lesson.supportsWriting ? steps : steps.filter((step) => step.id !== "writing");
  const currentStep = activeSteps[stepIndex];
  const currentKana = lesson.kana[kanaIndex];
  const stepProgress = Math.round(
    ((stepIndex * lesson.kana.length + kanaIndex) /
      (activeSteps.length * lesson.kana.length)) *
      100,
  );
  const choices = createChoices(currentKana, `${lesson.id}:${currentStep.id}:${kanaIndex}`);
  const nextLesson = LEARN_LESSONS.slice(lessonIndex + 1).find((item) => item.script === lesson.script);

  const resetQuestion = () => {
    setSelected(null);
    setTypedAnswer("");
    setAnswerState("idle");
    setStrokes([]);
    setWritingMatch(null);
  };

  const advance = () => {
    if (kanaIndex < lesson.kana.length - 1) {
      setKanaIndex((value) => value + 1);
      resetQuestion();
      return;
    }

    if (stepIndex < activeSteps.length - 1) {
      setStepIndex((value) => value + 1);
      setKanaIndex(0);
      resetQuestion();
      return;
    }

    const nextProgress = recordLearnLessonComplete(lesson.id, lesson.kana.map((kana) => kana.id));
    setProgress(nextProgress);
    setCompleted(true);
  };

  const chooseAnswer = (value: string) => {
    if (answerState === "correct") return;
    setSelected(value);
    setAnswerState(value === currentKana.romaji ? "correct" : "wrong");
  };

  const submitTyping = (event: FormEvent) => {
    event.preventDefault();
    if (!typedAnswer.trim() || answerState === "correct") return;
    setAnswerState(
      typedAnswer.trim().toLowerCase() === currentKana.romaji
        ? "correct"
        : "wrong",
    );
  };

  const checkWriting = async () => {
    if (strokes.length === 0 || checkingWriting || answerState === "correct")
      return;
    setCheckingWriting(true);
    try {
      const recognition = await handwritingRecognizer.recognize({
        strokes,
        allowedCharacters: [currentKana.character],
        expectedCharacter: currentKana.character,
      });
      const { correct } =
        calculateWritingScores(
          recognition,
          currentKana.character,
          strokes.length,
          currentKana.strokeCount ?? strokes.length,
        );
      const match = recognition.expectedMatch ?? recognition.confidence;
      // const isCorrect = match >= TARGET_MATCH_PASS_THRESHOLD;
      setWritingMatch(match);
      setAnswerState(correct ? "correct" : "wrong");
      collectHandwritingAttempt({
        expectedCharacter: currentKana.character,
        recognition,
        status: correct ? "correct" : "incorrect",
        strokes,
      });
    } finally {
      setCheckingWriting(false);
    }
  };

  if (progress === null) {
    return (
      <main className="lesson-session-page">
        <header className="subpage-topbar">
          <Link href="/learn" aria-label="Về bảng chữ">
            <ArrowLeft size={20} />
          </Link>
          <strong>{lesson.title}</strong>
          <span>Đang tải</span>
        </header>
        <section className="lesson-locked-card">
          <CheckCircle2 size={38} />
          <h1>Đang tải bài học…</h1>
          <p>Đang đọc tiến độ đã lưu trên thiết bị này.</p>
        </section>
        
      </main>
    );
  }

  if (!unlocked) {
    return (
      <main className="lesson-session-page">
        <header className="subpage-topbar">
          <Link href="/learn" aria-label="Về bảng chữ">
            <ArrowLeft size={20} />
          </Link>
          <strong>{lesson.title}</strong>
          <span>Chưa mở</span>
        </header>
        <section className="lesson-locked-card">
          <LockKeyhole size={38} />
          <h1>Hoàn thành bài trước để tiếp tục.</h1>
          <p>
            Lessons unlock one by one after every Kana in the current lesson is
            completed.
          </p>
          <Link href="/learn">Về bảng chữ</Link>
        </section>
        
      </main>
    );
  }

  if (completed) {
    return (
      <main className="lesson-session-page">
        <header className="subpage-topbar">
          <Link href="/learn" aria-label="Về bảng chữ">
            <ArrowLeft size={20} />
          </Link>
          <strong>{lesson.title}</strong>
          <span>Đã xong</span>
        </header>
        <section className="lesson-complete-card">
          <Check size={38} />
          <h1>Đã hoàn thành bài học</h1>
          <p>
            {lesson.kana.map((kana) => kana.character).join(" ")} is now
            unlocked for review and practice.
          </p>
          <div>
            <Link href="/learn">Tất cả bài học</Link>
            {nextLesson && (
              <Link
                className="primary-next-link"
                href={`/learn/${nextLesson.id}`}
              >
                Bài tiếp theo <ArrowRight size={17} />
              </Link>
            )}
          </div>
        </section>
        
      </main>
    );
  }

  return (
    <main className="lesson-session-page">
      <header className="subpage-topbar">
        <Link href="/learn" aria-label="Về bảng chữ">
          <ArrowLeft size={20} />
        </Link>
        <strong>{lesson.title}</strong>
        <span>
          {kanaIndex + 1} / {lesson.kana.length}
        </span>
      </header>

      <section className="lesson-runner-card">
        <div className="lesson-stepper" aria-label="Lesson stages">
          {activeSteps.map((step, index) => {
            const Icon = step.icon;
            const state =
              index < stepIndex ? "done" : index === stepIndex ? "active" : "";
            return (
              <span className={state} key={step.id}>
                <Icon size={15} /> {step.label}
              </span>
            );
          })}
        </div>

        <div
          className="lesson-progress-line"
          aria-label={`${stepProgress}% complete`}
        >
          <i style={{ width: `${stepProgress}%` }} />
        </div>

        <div className="lesson-prompt">
          <span>
            {currentStep.id === "writing"
              ? "WRITE THE KANA"
              : currentStep.id === "typing"
                ? "NHẬP CÁCH ĐỌC"
                : "CHỌN CÁCH ĐỌC"}
          </span>
          <h1>
            {currentStep.id === "writing"
              ? currentKana.romaji.toUpperCase()
              : currentKana.character}
          </h1>
          <p>
            {currentStep.id === "writing"
              ? "Write the Japanese character in the box."
              : "Chữ này đọc như thế nào?"}
          </p>
        </div>

        {currentStep.id === "choice" && (
          <div className="answer-grid lesson-answer-grid">
            {choices.map((choice) => {
              const state =
                answerState !== "idle" && choice === currentKana.romaji
                  ? "correct"
                  : answerState === "wrong" && choice === selected
                    ? "wrong"
                    : "";
              return (
                <button
                  className={state}
                  disabled={answerState === "correct"}
                  key={choice}
                  onClick={() => chooseAnswer(choice)}
                  type="button"
                >
                  {choice.toUpperCase()}
                </button>
              );
            })}
          </div>
        )}

        {currentStep.id === "typing" && (
          <form
            className="typing-form lesson-typing-form"
            onSubmit={submitTyping}
          >
            <input
              autoCapitalize="none"
              autoCorrect="off"
              aria-label="Cách đọc Kana"
              disabled={answerState === "correct"}
              onChange={(event) => setTypedAnswer(event.target.value)}
              placeholder="Type romaji..."
              value={typedAnswer}
            />
            <button
              disabled={!typedAnswer.trim() || answerState === "correct"}
              type="submit"
            >
              Kiểm tra
            </button>
          </form>
        )}

        {currentStep.id === "writing" && (
          <div className="lesson-writing-area">
            <HandwritingCanvas
              disabled={answerState === "correct"}
              gridVisible
              guideCharacter={currentKana.character}
              onStrokeComplete={(stroke) =>
                setStrokes((value) => [...value, stroke])
              }
              strokes={strokes}
            />
            <div className="lesson-writing-actions">
              <button
                disabled={strokes.length === 0 || answerState === "correct"}
                onClick={() => setStrokes((value) => value.slice(0, -1))}
                type="button"
              >
                <RotateCcw size={16} /> Undo
              </button>
              <button
                disabled={strokes.length === 0 || answerState === "correct"}
                onClick={() => {
                  setStrokes([]);
                  setWritingMatch(null);
                  setAnswerState("idle");
                }}
                type="button"
              >
                <Eraser size={16} /> Clear
              </button>
              <button
                disabled={
                  strokes.length === 0 ||
                  checkingWriting ||
                  answerState === "correct"
                }
                onClick={checkWriting}
                type="button"
              >
                {checkingWriting ? "Checking..." : "Check writing"}
              </button>
            </div>
          </div>
        )}

        {answerState !== "idle" && (
          <div
            className={`answer-feedback ${answerState === "correct" ? "correct" : "wrong"}`}
            role="status"
          >
            {answerState === "correct" ? <Check size={20} /> : <X size={20} />}
            <div>
              <strong>
                {answerState === "correct"
                  ? "Good"
                  : `Answer: ${currentKana.romaji.toUpperCase()}`}
              </strong>
              <span>
                {currentKana.character} = {currentKana.romaji.toUpperCase()}
                {writingMatch !== null
                  ? ` · ${Math.round(writingMatch * 100)}% match`
                  : ""}
              </span>
            </div>
            {answerState === "correct" ? (
              <button type="button" onClick={advance}>
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button type="button" onClick={resetQuestion}>
                Thử lại
              </button>
            )}
          </div>
        )}
      </section>
      
    </main>
  );
}
