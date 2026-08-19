"use client";

import { ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { demoProgress, readProgress, writeProgress, type LearningProgress } from "@/lib/progress-storage";

export function ReviewPage() {
  const [progress, setProgress] = useState<LearningProgress>(demoProgress);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setProgress(readProgress()));
    return () => cancelAnimationFrame(frame);
  }, []);
  const remaining = Math.max(0, progress.dailyReviewGoal - progress.reviewsDone);
  const complete = () => setProgress((current) => {
    const next = { ...current, reviewsDone: Math.min(current.dailyReviewGoal, current.reviewsDone + 1) };
    writeProgress(next);
    return next;
  });
  return (
    <main className="standard-page">
      <header className="standard-header"><Link href="/">KanaMaster</Link><span>Review</span></header>
      <section className="review-card">
        <span className="review-big-icon">{remaining ? <RotateCcw /> : <CheckCircle2 />}</span>
        <p>TODAY’S REVIEW</p><h1>{remaining ? `${remaining} characters waiting` : "All caught up!"}</h1>
        <div className="review-bar"><i style={{ width: `${(progress.reviewsDone / progress.dailyReviewGoal) * 100}%` }} /></div>
        <span>{progress.reviewsDone} / {progress.dailyReviewGoal} complete</span>
        {remaining > 0 && <button type="button" onClick={complete}>Complete one review <ArrowRight size={17} /></button>}
        <Link href="/practice/handwriting">Practice weak writing</Link>
      </section>
      <MobileNav />
    </main>
  );
}
