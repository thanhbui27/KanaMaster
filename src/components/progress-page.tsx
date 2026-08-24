"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { getKanaRows, KANA_BY_SCRIPT, KANA_CATEGORY_LABELS, type KanaScript } from "@/data/kana";
import { countCompletedKana } from "@/lib/learn-lessons";
import { demoProgress, getTrackAccuracy, getWeakKanaIds, readProgress, type LearningProgress } from "@/lib/progress-storage";

export function ProgressPage({ initialScript = "hiragana" }: { initialScript?: KanaScript }) {
  const [script, setScript] = useState<KanaScript>(initialScript);
  const [progress, setProgress] = useState<LearningProgress>(demoProgress);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setProgress(readProgress()));
    return () => cancelAnimationFrame(frame);
  }, []);
  const completedLessonIds = useMemo(() => new Set(Object.keys(progress.lessonProgress).filter((id) => progress.lessonProgress[id]?.completedAt)), [progress.lessonProgress]);
  const track = progress.tracks[script];
  const catalogue = KANA_BY_SCRIPT[script];
  const learnedFromStats = Object.values(track.kana).filter((item) => item.learnedAt).length;
  const learned = Math.max(learnedFromStats, countCompletedKana(completedLessonIds, script));
  const weakIds = new Set(getWeakKanaIds(track, 8));
  const label = script === "hiragana" ? "Hiragana" : "Katakana";

  return (
    <main className="standard-page">
      <header className="standard-header"><Link href="/">KanaMaster</Link><span>Progress · {label}</span></header>
      <section className="standard-intro"><span>SEPARATE STATISTICS</span><h1>{label} progress.</h1><p>Learning, accuracy and weak-character history for this track only.</p></section>
      <div className="track-switch" role="group" aria-label="Progress alphabet">
        <button className={script === "hiragana" ? "active" : ""} onClick={() => setScript("hiragana")} type="button">ひ Hiragana</button>
        <button className={script === "katakana" ? "active" : ""} onClick={() => setScript("katakana")} type="button">カ Katakana</button>
      </div>
      <section className="progress-summary-grid">
        <article><span>Learned</span><strong>{learned} / {catalogue.length}</strong></article>
        <article><span>Accuracy</span><strong>{getTrackAccuracy(track)}%</strong></article>
        <article><span>Total tests</span><strong>{track.totalTests}</strong></article>
        <article><span>Best score</span><strong>{track.bestScore}%</strong></article>
        <article><span>Correct / Wrong</span><strong>{track.correctAnswers} / {track.wrongAnswers}</strong></article>
        <article><span>Current streak</span><strong>{track.currentStreak}</strong></article>
      </section>
      <div className="weak-summary"><span>Weak characters</span><strong>{weakIds.size ? catalogue.filter((kana) => weakIds.has(kana.id)).map((kana) => kana.character).join(" · ") : "Complete a test to find them"}</strong></div>
      <section className="progress-kana-sections">
        {getKanaRows(script).map((row, rowIndex, rows) => {
          const previous = rows[rowIndex - 1];
          return (
            <Fragment key={row.key}>
              {(!previous || previous.category !== row.category) && <h2>{KANA_CATEGORY_LABELS[row.category]}</h2>}
              <div className="progress-row-heading"><strong>{row.label}</strong><span>{row.kana.map((kana) => kana.romaji).join(" · ")}</span></div>
              <div className="progress-kana-grid extended">
                {row.kana.map((kana) => {
                  const item = track.kana[kana.id];
                  const attempts = item ? item.correct + item.wrong : 0;
                  const accuracy = attempts ? Math.round((item.correct / attempts) * 100) : 0;
                  const href = typeof kana.strokeCount === "number" ? `/practice/handwriting?kana=${encodeURIComponent(kana.character)}` : `/test/${script}/character`;
                  return <Link className={weakIds.has(kana.id) ? "weak" : ""} href={href} key={kana.id}><strong>{kana.character}</strong><span>{kana.romaji.toUpperCase()}</span><i>{attempts ? `${item.correct}✓ ${item.wrong}✕ · ${accuracy}%` : "NEW"}</i></Link>;
                })}
              </div>
            </Fragment>
          );
        })}
      </section>
      <MobileNav />
    </main>
  );
}
