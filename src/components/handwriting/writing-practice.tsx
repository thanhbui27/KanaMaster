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
import { KanaScopeSelector } from "@/components/tests/kana-scope-selector";
import { filterKanaByScope, getKanaEntriesInText } from "@/data/kana";
import { WORDS_BY_SCRIPT } from "@/data/test-content";
import { WRITING_KANA } from "@/data/writing-kana";
import { collectHandwritingAttempt, handwritingRecognizer, MIN_RECOGNITION_CONFIDENCE } from "@/lib/handwriting/template-recognizer";
import { calculateWritingScores } from "@/lib/handwriting/scoring";
import { readProgress, recordWritingAttempt, type WritingKanaProgress } from "@/lib/progress-storage";
import { buildRandomSession } from "@/lib/test-randomization";
import { DEFAULT_TEST_SETTINGS, readTestSettings, writeTestSettings, type TestSettings } from "@/lib/test-settings";
import type { RecognitionResult, Stroke } from "@/types/handwriting";

type ResultState = {
  recognition: RecognitionResult;
  status: "correct" | "incorrect" | "uncertain";
  writingScore: number;
  strokeScore: number;
  shapeScore: number;
};

type WritingKana = (typeof WRITING_KANA)[number];
type HandwritingQuestion = {
  id: string;
  kana: WritingKana;
  word?: { text: string; romaji: string; position: number; length: number; question: number; questionCount: number };
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
  const [currentIndex, setCurrentIndex] = useState(requestedIndex >= 0 ? requestedIndex : 0);
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
  const [testPhase, setTestPhase] = useState<"setup" | "running" | "finished">("setup");
  const [testSettings, setTestSettings] = useState<TestSettings>(DEFAULT_TEST_SETTINGS);
  const [testQuestions, setTestQuestions] = useState<HandwritingQuestion[]>([]);
  const [testQuestionIndex, setTestQuestionIndex] = useState(0);
  const [testCorrect, setTestCorrect] = useState(0);
  const [testAnswered, setTestAnswered] = useState(0);
  const [testValidation, setTestValidation] = useState("");
  const [testRemaining, setTestRemaining] = useState(DEFAULT_TEST_SETTINGS.secondsPerQuestion);
  const [questionCounted, setQuestionCounted] = useState(false);

  const activeTestQuestion = testQuestions[testQuestionIndex];
  const currentKana = sessionMode === "test" && testPhase === "running" && activeTestQuestion
    ? activeTestQuestion.kana
    : currentCatalogue[currentIndex] ?? currentCatalogue[0];
  const displayedGuide = sessionMode === "practice" && guideVisible ? currentKana.character : undefined;
  const handwritingAvailableCount = useMemo(() => {
    if (!testSettings.categories.length || !testSettings.rows.length) return 0;
    const scoped = filterKanaByScope(scriptMode, testSettings.categories, testSettings.rows)
      .filter((kana) => typeof kana.strokeCount === "number");
    if (testSettings.handwritingMode === "character") return scoped.length;
    const allowedIds = new Set(scoped.map((kana) => kana.id));
    const writingIds = new Set(WRITING_KANA.map((kana) => kana.id));
    return WORDS_BY_SCRIPT[scriptMode].filter((word) => {
      if (testSettings.difficulty !== "all" && word.difficulty !== testSettings.difficulty) return false;
      const parsed = getKanaEntriesInText(word.text, scriptMode);
      return parsed.complete && parsed.entries.length > 0 && parsed.entries.every((kana) => allowedIds.has(kana.id) && writingIds.has(kana.id));
    }).length;
  }, [scriptMode, testSettings.categories, testSettings.difficulty, testSettings.handwritingMode, testSettings.rows]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = readProgress().writingProgress[currentKana.id] ?? emptyWritingProgress();
      setWritingProgress(saved);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [currentKana.id]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setTestSettings(readTestSettings(scriptMode, "handwriting")));
    return () => window.cancelAnimationFrame(frame);
  }, [scriptMode]);

  useEffect(() => {
    if (sessionMode !== "test" || testPhase !== "running" || result || checking || !testSettings.timerEnabled) return;
    if (testRemaining <= 0) return;
    const timer = window.setTimeout(() => setTestRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [checking, result, sessionMode, testPhase, testRemaining, testSettings.timerEnabled]);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 780px)");
    const syncScrollLock = () => {
      document.body.classList.toggle("writing-result-modal-open", Boolean(result) && mobileQuery.matches);
    };
    syncScrollLock();
    mobileQuery.addEventListener("change", syncScrollLock);
    return () => {
      mobileQuery.removeEventListener("change", syncScrollLock);
      document.body.classList.remove("writing-result-modal-open");
    };
  }, [result]);

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
        if (sessionMode === "test" && !questionCounted) {
          setTestAnswered((value) => value + 1);
          if (correct) setTestCorrect((value) => value + 1);
          setQuestionCounted(true);
        }
      }
    } finally {
      setChecking(false);
    }
  };

  const tryAgain = () => {
    clear();
    setShowStrokeOrder(false);
  };

  const nextCharacter = (skipCurrentWord = false) => {
    if (sessionMode === "test" && testPhase === "running") {
      let nextIndex = testQuestionIndex + 1;
      if (skipCurrentWord && activeTestQuestion?.word) {
        while (nextIndex < testQuestions.length && testQuestions[nextIndex].word?.question === activeTestQuestion.word.question) nextIndex += 1;
      }
      if (nextIndex >= testQuestions.length) {
        setTestPhase("finished");
      } else {
        const staysInWord = activeTestQuestion?.word && testQuestions[nextIndex].word?.question === activeTestQuestion.word.question;
        setTestQuestionIndex(nextIndex);
        if (!staysInWord) setTestRemaining(Math.max(5, testSettings.secondsPerQuestion));
        setQuestionCounted(false);
      }
      clear();
      setShowStrokeOrder(false);
      return;
    }
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
      setTestPhase("setup");
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

  const startHandwritingTest = () => {
    if (!testSettings.categories.length || !testSettings.rows.length) {
      setTestValidation("Select at least one Kana category and row.");
      return;
    }
    const scopedKana = filterKanaByScope(scriptMode, testSettings.categories, testSettings.rows)
      .filter((kana) => typeof kana.strokeCount === "number");
    const writingById = new Map(WRITING_KANA.map((kana) => [kana.id, kana]));
    let nextQuestions: HandwritingQuestion[] = [];

    if (testSettings.handwritingMode === "character") {
      nextQuestions = buildRandomSession(scopedKana, { limit: testSettings.questionCount })
        .flatMap((kana) => {
          const writingKana = writingById.get(kana.id);
          return writingKana ? [{ id: kana.id, kana: writingKana }] : [];
        });
    } else {
      const allowedIds = new Set(scopedKana.map((kana) => kana.id));
      const eligibleWords = WORDS_BY_SCRIPT[scriptMode].filter((word) => {
        if (testSettings.difficulty !== "all" && word.difficulty !== testSettings.difficulty) return false;
        const parsed = getKanaEntriesInText(word.text, scriptMode);
        return parsed.complete && parsed.entries.length > 0 && parsed.entries.every((kana) => allowedIds.has(kana.id) && writingById.has(kana.id));
      });
      const selectedWords = buildRandomSession(eligibleWords, { limit: testSettings.questionCount });
      nextQuestions = selectedWords.flatMap((word, wordIndex) => {
        const kana = getKanaEntriesInText(word.text, scriptMode).entries
          .map((entry) => writingById.get(entry.id))
          .filter((entry): entry is WritingKana => Boolean(entry));
        return kana.map((entry, index) => ({
          id: `${word.id}:${index}`,
          kana: entry,
          word: { text: word.text, romaji: word.romaji, position: index + 1, length: kana.length, question: wordIndex + 1, questionCount: selectedWords.length },
        }));
      });
    }

    if (!nextQuestions.length) {
      setTestValidation("No handwriting questions match this scope. Select more Basic Kana rows or another difficulty.");
      return;
    }
    writeTestSettings(scriptMode, "handwriting", testSettings);
    setTestQuestions(nextQuestions);
    setTestQuestionIndex(0);
    setTestCorrect(0);
    setTestAnswered(0);
    setQuestionCounted(false);
    setTestRemaining(Math.max(5, testSettings.secondsPerQuestion));
    setTestValidation("");
    setTestPhase("running");
    clear();
  };

  useEffect(() => {
    if (sessionMode !== "test" || testPhase !== "running" || !testSettings.timerEnabled || testRemaining > 0 || result) return;
    const timer = window.setTimeout(() => {
      const unansweredKana = activeTestQuestion?.word
        ? activeTestQuestion.word.length - activeTestQuestion.word.position + 1
        : 1;
      setTestAnswered((value) => value + unansweredKana);
      setQuestionCounted(true);
      nextCharacter(true);
    }, 350);
    return () => window.clearTimeout(timer);
  // nextCharacter intentionally follows the active queue position.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTestQuestion, result, sessionMode, testPhase, testRemaining, testSettings.timerEnabled]);

  return (
    <main className="writing-page">
      <header className="writing-topbar">
        <Link href="/practice" className="icon-link" aria-label="Back to practice modes"><ArrowLeft size={21} /></Link>
        <div className="writing-brand"><Image src="/icons/icon-48x48.png" alt="" width={34} height={34} priority /><span>KanaMaster</span></div>
        <span className="lesson-count">{sessionMode === "test" && testPhase === "running" ? activeTestQuestion?.word ? `${activeTestQuestion.word.question} / ${activeTestQuestion.word.questionCount}` : `${testQuestionIndex + 1} / ${testQuestions.length}` : `${currentIndex + 1} / ${currentCatalogue.length}`}</span>
      </header>

      <div className={`writing-layout ${sessionMode === "test" && testPhase !== "running" ? "setup-only" : ""}`}>
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

          {sessionMode === "test" && testPhase === "setup" ? (
            <div className="handwriting-test-setup">
              <span className="panel-kicker">HANDWRITING TEST SETUP</span>
              <h1>Build a random writing test.</h1>
              <p>Questions are filtered by your Kana rows first, then shuffled without repeats.</p>
              <div className="settings-grid">
                <label><span>Mode</span><select value={testSettings.handwritingMode} onChange={(event) => setTestSettings({ ...testSettings, handwritingMode: event.target.value as TestSettings["handwritingMode"] })}><option value="character">Character</option><option value="word">Word · one Kana at a time</option></select></label>
                <label><span>{testSettings.handwritingMode === "word" ? "Words" : "Questions"}</span><select value={testSettings.questionCount} onChange={(event) => setTestSettings({ ...testSettings, questionCount: event.target.value === "unlimited" ? "unlimited" : Number(event.target.value) as 10 | 20 | 50 })}><option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="unlimited">Unlimited</option></select></label>
                <label><span>Timer</span><select value={testSettings.timerEnabled ? "on" : "off"} onChange={(event) => setTestSettings({ ...testSettings, timerEnabled: event.target.value === "on" })}><option value="on">On</option><option value="off">Off</option></select></label>
                <label><span>Seconds / {testSettings.handwritingMode === "word" ? "word" : "question"}</span><input type="number" min="5" max="300" disabled={!testSettings.timerEnabled} value={testSettings.secondsPerQuestion} onChange={(event) => setTestSettings({ ...testSettings, secondsPerQuestion: Number(event.target.value) })} /></label>
                {testSettings.handwritingMode === "word" && <label><span>Difficulty</span><select value={testSettings.difficulty} onChange={(event) => setTestSettings({ ...testSettings, difficulty: event.target.value as TestSettings["difficulty"] })}><option value="all">All</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>}
              </div>
              <KanaScopeSelector script={scriptMode} settings={testSettings} allowedCategories={["basic"]} onChange={(next) => { setTestSettings(next); setTestValidation(""); }} />
              <p className="handwriting-scope-note">Stroke recognition currently supports Basic Kana rows; Hiragana and Katakana remain separate.</p>
              {handwritingAvailableCount > 0 && <p className="scope-availability">{handwritingAvailableCount} matching {testSettings.handwritingMode === "word" ? "words" : "characters"} available{testSettings.questionCount !== "unlimited" && testSettings.questionCount > handwritingAvailableCount ? ` · this test will use all ${handwritingAvailableCount}` : ""}.</p>}
              {testSettings.categories.length > 0 && testSettings.rows.length > 0 && handwritingAvailableCount === 0 && <p className="form-error" role="alert">No handwriting questions match this scope. Select more Basic Kana rows.</p>}
              {testValidation && <p className="form-error" role="alert">{testValidation}</p>}
              <button className="check-writing-button" type="button" disabled={handwritingAvailableCount === 0} onClick={startHandwritingTest}>Start random test <ArrowRight size={19} /></button>
            </div>
          ) : sessionMode === "test" && testPhase === "finished" ? (
            <div className="handwriting-test-finished">
              <span className="panel-kicker">TEST COMPLETE</span>
              <strong>{testAnswered ? Math.round((testCorrect / testAnswered) * 100) : 0}%</strong>
              <h1>{testCorrect} of {testAnswered} {testSettings.handwritingMode === "word" ? "Kana" : "questions"} correct</h1>
              <p>The next test will create a fresh shuffled queue from the same selected scope.</p>
              <div>
                <button type="button" onClick={startHandwritingTest}><RotateCcw size={17} /> New test</button>
                <button type="button" onClick={() => setTestPhase("setup")}>Change setup</button>
              </div>
            </div>
          ) : (
          <>

          <div className="writing-prompt">
            <p>{activeTestQuestion?.word ? `Write Kana ${activeTestQuestion.word.position} of ${activeTestQuestion.word.length} in` : promptMode === "audio" ? "Listen, then write the kana" : "Write the Japanese character for"}</p>
            {promptMode === "romaji" ? (
              <h1 id="writing-title">{activeTestQuestion?.word ? activeTestQuestion.word.romaji.toUpperCase() : currentKana.romaji.toUpperCase()}</h1>
            ) : (
              <button className="audio-prompt" type="button" onClick={speak} aria-label="Play pronunciation"><Volume2 size={28} /><span>Play sound</span></button>
            )}
            <span className="prompt-note">{activeTestQuestion?.word ? `${activeTestQuestion.word.text} · write one character per canvas` : sessionMode === "test" ? "No hints in test mode" : "Draw one character in the box"}{sessionMode === "test" && testSettings.timerEnabled ? ` · ${testRemaining}s` : ""}</span>
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
          </>
          )}
        </section>

        {(sessionMode !== "test" || testPhase === "running") && <aside className={`writing-side-panel ${result ? "has-result" : ""}`}>
          {result ? (
            <div className={`writing-result ${result.status}`} role="status">
              <button className="writing-result-close" type="button" onClick={tryAgain} aria-label="Close result"><X size={19} /></button>
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
                {result.status !== "uncertain" && <button className="next-button" type="button" onClick={() => nextCharacter()}>Next <ArrowRight size={17} /></button>}
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
        </aside>}
      </div>
      <MobileNav />
    </main>
  );
}
