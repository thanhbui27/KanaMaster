"use client";

import { ArrowLeft, ArrowRight, Check, RotateCcw, Timer, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { CHARACTER_TEST_KANA, type KanaScript } from "@/data/kana";
import { recordQuestionResult } from "@/lib/progress-storage";

type QuickPracticeProps = { mode: "recognition" | "typing" | "speed"; initialScript?: KanaScript };

const titles = {
  recognition: "Nhận diện",
  typing: "Typing recall",
  speed: "Speed round",
};

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

function createChoices(catalogue: typeof CHARACTER_TEST_KANA.hiragana, currentIndex: number, questionNumber: number) {
  const current = catalogue[currentIndex];
  const distractors = Array.from(
    new Set(
      catalogue
        .filter((kana) => kana.romaji !== current.romaji)
        .map((kana) => kana.romaji),
    ),
  );
  const seedBase = `${current.id}:${questionNumber}`;
  const selectedDistractors = shuffleWithSeed(distractors, hashSeed(`${seedBase}:distractors`)).slice(0, 3);
  return shuffleWithSeed([...selectedDistractors, current.romaji], hashSeed(`${seedBase}:answers`));
}

export function QuickPractice({ mode, initialScript = "hiragana" }: QuickPracticeProps) {
  const [script, setScript] = useState<KanaScript>(initialScript);
  const catalogue = CHARACTER_TEST_KANA[script];
  const [index, setIndex] = useState(6);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [seconds, setSeconds] = useState(30);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const current = catalogue[index % catalogue.length];
  const answered = selected !== null;
  const isCorrect = selected === current.romaji;

  const choices = useMemo(() => createChoices(catalogue, index % catalogue.length, questionNumber), [catalogue, index, questionNumber]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const next = () => {
    setIndex((value) => (value + 1) % catalogue.length);
    setQuestionNumber((value) => value + 1);
    setSelected(null);
    setInput("");
  };

  const answer = (value: string) => {
    if (answered || (mode === "speed" && !running)) return;
    const correct = value.toLowerCase().trim() === current.romaji;
    setSelected(value.toLowerCase().trim());
    if (correct) setScore((value) => value + 1);
    else setWrong((value) => value + 1);
    recordQuestionResult(script, [current.id], correct);

    if (mode === "speed") window.setTimeout(next, 180);
  };

  const submitTyping = (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;
    answer(input);
  };

  const startRound = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setScore(0);
    setWrong(0);
    setSeconds(30);
    setRunning(true);
    setSelected(null);
    setQuestionNumber((value) => value + 1);
    const deadline = Date.now() + 30_000;
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0 && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setRunning(false);
      }
    }, 250);
  };

  const finishedSpeedRound = mode === "speed" && !running && seconds === 0;
  const canAnswer = mode !== "speed" || running;
  const changeScript = (nextScript: KanaScript) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setScript(nextScript);
    setIndex(0);
    setQuestionNumber(0);
    setSelected(null);
    setInput("");
    setScore(0);
    setWrong(0);
    setSeconds(30);
    setRunning(false);
  };

  return (
    <main className="quick-practice-page">
      <header className="subpage-topbar">
        <Link href="/practice" aria-label="Về luyện tập"><ArrowLeft size={20} /></Link>
        <strong>{titles[mode]}</strong>
        {mode === "speed" ? <span className="timer-chip"><Timer size={14} /> {seconds}s</span> : <span>{score} đúng</span>}
      </header>

      <div className="track-switch compact" role="group" aria-label="Practice alphabet">
        <button className={script === "hiragana" ? "active" : ""} type="button" onClick={() => changeScript("hiragana")}>ひ Hiragana</button>
        <button className={script === "katakana" ? "active" : ""} type="button" onClick={() => changeScript("katakana")}>カ Katakana</button>
      </div>

      <section className="quick-quiz-card">
        {mode === "speed" && !running && !finishedSpeedRound ? (
          <div className="round-start">
            <Timer size={36} />
            <h1>Thử thách 30 giây</h1>
            <p>Chọn cách đọc chính xác trong thời gian ngắn nhất.</p>
            <button type="button" onClick={startRound}>Bắt đầu <ArrowRight size={18} /></button>
          </div>
        ) : finishedSpeedRound ? (
          <div className="round-start">
            <span className="round-score">{score}</span>
            <h1>Hoàn thành lượt luyện</h1>
            <p>{score} đúng · {wrong} sai · {score + wrong === 0 ? 0 : Math.round((score / (score + wrong)) * 100)}% chính xác</p>
            <button type="button" onClick={startRound}><RotateCcw size={17} /> Thử lại</button>
          </div>
        ) : (
          <>
            <div className="quiz-prompt">
              <span>{mode === "typing" ? "NHẬP CÁCH ĐỌC" : "CHỌN CÁCH ĐỌC"}</span>
              <h1>{current.character}</h1>
              <p>Chữ này đọc như thế nào?</p>
            </div>

            {mode === "typing" ? (
              <form className="typing-form" onSubmit={submitTyping}>
                <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Nhập Romaji…" autoCapitalize="none" autoCorrect="off" disabled={answered} aria-label="Cách đọc Kana" />
                {!answered && <button type="submit" disabled={!input.trim()}>Kiểm tra</button>}
              </form>
            ) : (
              <div className="answer-grid">
                {choices.map((choice) => {
                  const state = answered && choice === current.romaji ? "correct" : answered && choice === selected ? "wrong" : "";
                  return <button className={state} type="button" key={choice} onClick={() => answer(choice)} disabled={!canAnswer || answered}>{choice.toUpperCase()}</button>;
                })}
              </div>
            )}

            {answered && mode !== "speed" && (
              <div className={`answer-feedback ${isCorrect ? "correct" : "wrong"}`} role="status">
                {isCorrect ? <Check size={20} /> : <X size={20} />}
                <div><strong>{isCorrect ? "Chính xác!" : `Đáp án: ${current.romaji.toUpperCase()}`}</strong><span>{current.character} = {current.romaji.toUpperCase()}</span></div>
                <button type="button" onClick={next}>Tiếp theo <ArrowRight size={16} /></button>
              </div>
            )}
          </>
        )}
      </section>
      
    </main>
  );
}
