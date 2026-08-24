"use client";

import { ArrowRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { getKanaById, type KanaScript } from "@/data/kana";
import { demoProgress, getTrackAccuracy, getWeakKanaIds, readProgress, type LearningProgress } from "@/lib/progress-storage";

function ReviewTrack({ script, progress }: { script: KanaScript; progress: LearningProgress }) {
  const track = progress.tracks[script];
  const label = script === "hiragana" ? "Hiragana" : "Katakana";
  const today = new Date().toISOString().slice(0, 10);
  const done = track.lastReviewDate === today ? track.reviewsDone : 0;
  const weak = getWeakKanaIds(track).map(getKanaById).filter(Boolean);
  return (
    <article className={`review-track-card ${script}`}>
      <span className="review-big-icon">{script === "hiragana" ? "ひ" : "カ"}</span>
      <p>{label.toUpperCase()} REVIEW</p><h2>{Math.max(0, track.dailyReviewGoal - done)} characters waiting</h2>
      <div className="review-bar"><i style={{ width: `${Math.min(100, (done / Math.max(1, track.dailyReviewGoal)) * 100)}%` }} /></div>
      <small>{done} / {track.dailyReviewGoal} today · {getTrackAccuracy(track)}% accuracy</small>
      <div className="weak-preview"><span>Weak:</span><strong>{weak.length ? weak.map((kana) => kana?.character).join(" · ") : "No data yet"}</strong></div>
      <Link href={`/test/${script}/review`}>Start smart review <ArrowRight size={17} /></Link>
    </article>
  );
}

export function ReviewPage() {
  const [progress, setProgress] = useState<LearningProgress>(demoProgress);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setProgress(readProgress()));
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <main className="standard-page">
      <header className="standard-header"><Link href="/">KanaMaster</Link><span>Review</span></header>
      <section className="standard-intro"><span><RotateCcw size={13} /> SMART REVIEW</span><h1>Review each alphabet separately.</h1><p>Wrong, new and overdue Kana receive priority; strong characters appear less often.</p></section>
      <section className="review-track-grid"><ReviewTrack script="hiragana" progress={progress} /><ReviewTrack script="katakana" progress={progress} /></section>
      <MobileNav />
    </main>
  );
}
