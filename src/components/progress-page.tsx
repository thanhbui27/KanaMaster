"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { WRITING_KANA } from "@/data/writing-kana";
import { demoProgress, readProgress, type LearningProgress } from "@/lib/progress-storage";

export function ProgressPage() {
  const [progress, setProgress] = useState<LearningProgress>(demoProgress);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setProgress(readProgress()));
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <main className="standard-page">
      <header className="standard-header"><Link href="/">KanaMaster</Link><span>Progress</span></header>
      <section className="standard-intro"><span>WRITING MASTERY</span><h1>Your kana, at a glance.</h1><p>Tap any character to practice it immediately.</p></section>
      <section className="progress-kana-grid">
        {WRITING_KANA.map((kana) => {
          const item = progress.writingProgress[kana.id];
          const accuracy = item ? Math.round(item.writingAccuracy * 100) : 0;
          return <Link href={`/practice/handwriting?kana=${kana.romaji}`} key={kana.id}><strong>{kana.character}</strong><span>{kana.romaji.toUpperCase()}</span><i>{accuracy}%</i></Link>;
        })}
      </section>
      <MobileNav />
    </main>
  );
}
