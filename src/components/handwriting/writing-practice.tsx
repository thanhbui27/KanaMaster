"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  Eraser,
  Eye,
  Grid2X2,
  LoaderCircle,
  Redo2,
  RotateCcw,
  Undo2,
  Volume2,
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { HandwritingCanvas } from "@/components/handwriting/handwriting-canvas";
import { MobileNav } from "@/components/mobile-nav";
import { WRITING_KANA } from "@/data/writing-kana";
import { collectHandwritingAttempt, handwritingRecognizer, MIN_RECOGNITION_CONFIDENCE } from "@/lib/handwriting/template-recognizer";
import { calculateWritingScores } from "@/lib/handwriting/scoring";
import { readProgress, recordWritingAttempt, type WritingKanaProgress } from "@/lib/progress-storage";
import type { RecognitionResult, Stroke } from "@/types/handwriting";

type ResultState = {
  recognition: RecognitionResult;
  status: "correct" | "incorrect" | "uncertain";
  writingScore: number;
  strokeScore: number;
  shapeScore: number;
};

function emptyWritingProgress(): WritingKanaProgress {
  return { writingAttempts: 0, writingCorrect: 0, writingAccuracy: 0, lastWritingAttempt: null };
}

export function WritingPractice({ initialKana }: { initialKana?: string }) {
  const requestedKana = WRITING_KANA.find((kana) => kana.character === initialKana)
    ?? WRITING_KANA.find((kana) => kana.romaji === initialKana);
  const [scriptMode, setScriptMode] = useState<"hiragana" | "katakana">(requestedKana?.script ?? "hiragana");
  const currentCatalogue = useMemo(
    () => WRITING_KANA.filter((kana) => kana.script === scriptMode),
    [scriptMode],
  );
  const requestedIndex = requestedKana?.script === scriptMode
    ? currentCatalogue.findIndex((kana) => kana.id === requestedKana.id)
    : -1;
  const defaultIndex = currentCatalogue.findIndex((kana) => kana.romaji === "ki");
  const [currentIndex, setCurrentIndex] = useState(requestedIndex >= 0 ? requestedIndex : Math.max(defaultIndex, 0));
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [gridVisible, setGridVisible] = useState(true);
  const [guideVisible, setGuideVisible] = useState(false);
  const [sessionMode, setSessionMode] = useState<"practice" | "test">("practice");
  const [promptMode, setPromptMode] = useState<"romaji" | "audio">("romaji");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [showStrokeOrder, setShowStrokeOrder] = useState(false);
  const [writingProgress, setWritingProgress] = useState<WritingKanaProgress>(emptyWritingProgress);

  const currentKana = currentCatalogue[currentIndex] ?? currentCatalogue[0];
  const displayedGuide = sessionMode === "practice" && guideVisible ? currentKana.character : undefined;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = readProgress().writingProgress[currentKana.id] ?? emptyWritingProgress();
      setWritingProgress(saved);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [currentKana.id]);

  const strokeFeedback = useMemo(() => {
    const difference = Math.abs(strokes.length - currentKana.strokeCount);
    if (difference === 0) return `Great — you used the expected ${currentKana.strokeCount} ${currentKana.strokeCount === 1 ? "stroke" : "strokes"}.`;
    if (currentKana.character === "き" && strokes.length === 3) return "Recognizable connected form. The standard teaching form uses 4 strokes.";
    if (strokes.length < currentKana.strokeCount) return `Try separating the character into ${currentKana.strokeCount} clear strokes.`;
    return `Try using fewer pen lifts. The standard form uses ${currentKana.strokeCount} strokes.`;
  }, [currentKana.character, currentKana.strokeCount, strokes.length]);

  const addStroke = (stroke: Stroke) => {
    setStrokes((current) => [...current, stroke]);
    setRedoStack([]);
    setResult(null);
  };

  const undo = () => {
    setStrokes((current) => {
      if (current.length === 0) return current;
      const removed = current.at(-1)!;
      setRedoStack((redo) => [...redo, removed]);
      return current.slice(0, -1);
    });
    setResult(null);
  };

  const redo = () => {
    setRedoStack((current) => {
      if (current.length === 0) return current;
      const restored = current.at(-1)!;
      setStrokes((drawn) => [...drawn, restored]);
      return current.slice(0, -1);
    });
  };

  const clear = () => {
    setStrokes([]);
    setRedoStack([]);
    setResult(null);
  };

  const speak = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentKana.romaji);
    utterance.lang = "ja-JP";
    utterance.rate = 0.78;
    window.speechSynthesis.speak(utterance);
  };

  const checkAnswer = async () => {
    if (strokes.length === 0 || checking) return;
    setChecking(true);
    setShowStrokeOrder(false);

    try {
      const recognition = await handwritingRecognizer.recognize({
        strokes,
        allowedCharacters: currentCatalogue.map((kana) => kana.character),
        expectedCharacter: currentKana.character,
      });
      const correctCharacter = recognition.detectedCharacter === currentKana.character;
      const plausibleExpected = !correctCharacter && (recognition.expectedMatch ?? 0) >= 0.54;
      const uncertain = recognition.confidence < MIN_RECOGNITION_CONFIDENCE || !recognition.detectedCharacter || plausibleExpected;
      const { correct, strokeScore, shapeScore, writingScore } = calculateWritingScores(
        recognition,
        currentKana.character,
        strokes.length,
        currentKana.strokeCount,
      );
      const status = uncertain ? "uncertain" : correct ? "correct" : "incorrect";

      setResult({ recognition, status, writingScore, strokeScore, shapeScore });
      collectHandwritingAttempt({ expectedCharacter: currentKana.character, recognition, status, strokes });
      if (!uncertain) {
        setWritingProgress(recordWritingAttempt(currentKana.id, correct));
      }
    } finally {
      setChecking(false);
    }
  };

  const tryAgain = () => {
    clear();
    setShowStrokeOrder(false);
  };

  const nextCharacter = () => {
    setCurrentIndex((index) => (index + 1) % currentCatalogue.length);
    clear();
    setShowStrokeOrder(false);
    setGuideVisible(false);
  };

  const changeSessionMode = (mode: "practice" | "test") => {
    setSessionMode(mode);
    if (mode === "test") {
      setGridVisible(false);
      setGuideVisible(false);
    } else {
      setGridVisible(true);
    }
    clear();
  };

  const changeScriptMode = (script: "hiragana" | "katakana") => {
    setScriptMode(script);
    setCurrentIndex(0);
    setSessionMode("practice");
    setGridVisible(true);
    setGuideVisible(false);
    clear();
    setShowStrokeOrder(false);
  };

  return (
    <main className="writing-page">
      <header className="writing-topbar">
        <Link href="/practice" className="icon-link" aria-label="Back to practice modes"><ArrowLeft size={21} /></Link>
        <div className="writing-brand"><Image src="/icons/icon-48x48.png" alt="" width={34} height={34} priority /><span>KanaMaster</span></div>
        <span className="lesson-count">{currentIndex + 1} / {currentCatalogue.length}</span>
      </header>

      <div className="writing-layout">
        <section className="writing-stage" aria-labelledby="writing-title">
          <div className="mode-controls">
            <div className="segmented-control script-control" aria-label="Kana alphabet">
              <button className={scriptMode === "hiragana" ? "active" : ""} type="button" onClick={() => changeScriptMode("hiragana")}>ひ Hiragana</button>
              <button className={scriptMode === "katakana" ? "active" : ""} type="button" onClick={() => changeScriptMode("katakana")}>カ Katakana</button>
            </div>
            <div className="segmented-control" aria-label="Session mode">
              <button className={sessionMode === "practice" ? "active" : ""} type="button" onClick={() => changeSessionMode("practice")}>Practice</button>
              <button className={sessionMode === "test" ? "active" : ""} type="button" onClick={() => changeSessionMode("test")}>Test</button>
            </div>
            <div className="segmented-control prompt-control" aria-label="Prompt type">
              <button className={promptMode === "romaji" ? "active" : ""} type="button" onClick={() => setPromptMode("romaji")}>Text</button>
              <button className={promptMode === "audio" ? "active" : ""} type="button" onClick={() => { setPromptMode("audio"); window.setTimeout(speak, 0); }}><Volume2 size={15} /> Audio</button>
            </div>
          </div>

          <div className="writing-prompt">
            <p>{promptMode === "audio" ? "Listen, then write the kana" : "Write the Japanese character for"}</p>
            {promptMode === "romaji" ? (
              <h1 id="writing-title">{currentKana.romaji.toUpperCase()}</h1>
            ) : (
              <button className="audio-prompt" type="button" onClick={speak} aria-label="Play pronunciation"><Volume2 size={28} /><span>Play sound</span></button>
            )}
            <span className="prompt-note">{sessionMode === "test" ? "No hints in test mode" : "Draw one character in the box"}</span>
          </div>

          <HandwritingCanvas
            strokes={strokes}
            onStrokeComplete={addStroke}
            gridVisible={gridVisible}
            guideCharacter={displayedGuide}
            disabled={checking || Boolean(result)}
          />

          {sessionMode === "practice" && !result && (
            <div className="guide-toggles">
              <button className={gridVisible ? "active" : ""} type="button" onClick={() => setGridVisible((value) => !value)}><Grid2X2 size={16} /> Guide grid</button>
              <button className={guideVisible ? "active" : ""} type="button" onClick={() => setGuideVisible((value) => !value)}><Eye size={16} /> Faint guide</button>
            </div>
          )}

          {!result && (
            <div className="canvas-actions">
              <button type="button" onClick={undo} disabled={strokes.length === 0} aria-label="Undo last stroke"><Undo2 size={20} /><span>Undo</span></button>
              <button type="button" onClick={redo} disabled={redoStack.length === 0} aria-label="Redo stroke"><Redo2 size={20} /><span>Redo</span></button>
              <button type="button" onClick={clear} disabled={strokes.length === 0} aria-label="Clear canvas"><Eraser size={20} /><span>Clear</span></button>
            </div>
          )}

          {!result && (
            <button className="check-writing-button" type="button" onClick={checkAnswer} disabled={strokes.length === 0 || checking}>
              {checking ? <><LoaderCircle className="spinner" size={20} /> Recognizing…</> : <>Check answer <ArrowRight size={19} /></>}
            </button>
          )}
        </section>

        <aside className="writing-side-panel">
          {result ? (
            <div className={`writing-result ${result.status}`} role="status">
              <div className="result-heading">
                <span className="result-icon">
                  {result.status === "correct" ? <Check /> : result.status === "incorrect" ? <X /> : <CircleHelp />}
                </span>
                <div>
                  <p>{result.status === "correct" ? "Correct!" : result.status === "incorrect" ? "Not quite" : "Low confidence"}</p>
                  <h2>{result.status === "uncertain" ? "I couldn’t confidently recognize that." : result.status === "correct" ? "Nicely remembered." : "Take another look and try again."}</h2>
                </div>
              </div>

              <div className="detected-grid">
                <div><span>You wrote</span><strong>{result.status === "uncertain" ? "?" : result.recognition.detectedCharacter ?? "?"}</strong><small>{Math.round(result.recognition.confidence * 100)}% confidence</small></div>
                <div><span>Expected</span><strong>{currentKana.character}</strong><small>{currentKana.romaji.toUpperCase()}</small></div>
              </div>

              {result.status !== "uncertain" && (
                <div className="writing-score-card">
                  <div><span>Writing score</span><strong>{result.writingScore}<small>/100</small></strong></div>
                  <ul>
                    <li><span>Recognition</span><b className={result.status === "correct" ? "pass" : "fail"}>{result.status === "correct" ? "✓" : "×"}</b></li>
                    <li><span>Shape</span><b>{result.shapeScore}%</b></li>
                    <li><span>Stroke count</span><b className={result.strokeScore >= 75 ? "pass" : "warn"}>{strokes.length} / {currentKana.strokeCount}</b></li>
                  </ul>
                  <p>{strokeFeedback}</p>
                </div>
              )}

              {result.status !== "uncertain" && result.recognition.alternatives.length > 1 && (
                <p className="alternatives">Other possibilities: {result.recognition.alternatives.slice(1).map((item) => `${item.character} ${Math.round(item.confidence * 100)}%`).join(" · ")}</p>
              )}

              {showStrokeOrder && (
                <div className="stroke-order-panel">
                  <span>STANDARD FORM · {currentKana.strokeCount} STROKES</span>
                  <strong>{currentKana.character}</strong>
                  <p>Start at the top and move left-to-right before the lower curved strokes.</p>
                </div>
              )}

              <div className="result-actions">
                <button type="button" onClick={tryAgain}><RotateCcw size={17} /> Try again</button>
                <button type="button" onClick={() => setShowStrokeOrder((value) => !value)}><Grid2X2 size={17} /> Stroke order</button>
                {result.status !== "uncertain" && <button className="next-button" type="button" onClick={nextCharacter}>Next <ArrowRight size={17} /></button>}
              </div>
            </div>
          ) : (
            <div className="writing-progress-panel">
              <span className="panel-kicker">WRITING MASTERY</span>
              <div className="mastery-character"><strong>{currentKana.character}</strong><span>{currentKana.romaji.toUpperCase()}</span></div>
              <div className="mastery-meter"><i style={{ width: `${Math.round(writingProgress.writingAccuracy * 100)}%` }} /></div>
              <div className="mastery-stats">
                <div><strong>{Math.round(writingProgress.writingAccuracy * 100)}%</strong><span>accuracy</span></div>
                <div><strong>{writingProgress.writingAttempts}</strong><span>attempts</span></div>
                <div><strong>{writingProgress.writingCorrect}</strong><span>correct</span></div>
              </div>
              <p>Writing progress is tracked separately from recognition. Weak characters return more often in review.</p>
            </div>
          )}
        </aside>
      </div>
      <MobileNav />
    </main>
  );
}
