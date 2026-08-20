"use client";

import { ArrowRight, Check, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { LEARN_LESSONS, countCompletedKana, isLessonUnlocked } from "@/lib/learn-lessons";
import { demoProgress, readProgress, type LearningProgress } from "@/lib/progress-storage";

function lessonState(completed: boolean, unlocked: boolean) {
  if (completed) return "Complete";
  if (unlocked) return "Learning";
  return "Locked";
}

export function LearnPageClient() {
  const [progress, setProgress] = useState<LearningProgress>(demoProgress);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setProgress(readProgress()));
    return () => cancelAnimationFrame(frame);
  }, []);

  const completedLessonIds = useMemo(() => new Set(Object.keys(progress.lessonProgress ?? {}).filter((id) => progress.lessonProgress[id]?.completedAt)), [progress]);
  const hiraganaDone = countCompletedKana(completedLessonIds, "hiragana");
  const katakanaDone = countCompletedKana(completedLessonIds, "katakana");

  return (
    <main className="standard-page">
      <header className="standard-header"><Link href="/">KanaMaster</Link><span>Learn</span></header>
      <section className="standard-intro">
        <span>KANA PATH</span>
        <h1>Learn every Kana with 3 passes.</h1>
        <p>Each lesson locks the next one until you finish choosing, typing, and writing every character in the set.</p>
      </section>

      <section className="learn-summary-grid" aria-label="Learning summary">
        <article><span>Hiragana</span><strong>{hiraganaDone} / 46</strong></article>
        <article><span>Katakana</span><strong>{katakanaDone} / 46</strong></article>
      </section>

      <section className="full-lesson-list learn-path-list">
        {LEARN_LESSONS.map((lesson, index) => {
          const completed = completedLessonIds.has(lesson.id);
          const unlocked = isLessonUnlocked(completedLessonIds, index);
          const state = lessonState(completed, unlocked);
          const className = `full-lesson-card ${completed ? "complete" : ""} ${unlocked ? "" : "locked"}`;
          const content = (
            <>
              <span className="full-lesson-number">{completed ? <Check size={20} /> : unlocked ? lesson.number : <LockKeyhole size={18} />}</span>
              <span>
                <small>LESSON {lesson.number} · {lesson.script.toUpperCase()} · {state.toUpperCase()}</small>
                <strong>{lesson.kana.map((kana) => kana.character).join(" ")}</strong>
                <em>{lesson.kana.length} characters · Choose, type, write</em>
              </span>
              {unlocked && <ArrowRight size={20} />}
            </>
          );

          return unlocked
            ? <Link className={className} href={`/learn/${lesson.id}`} id={`lesson-${lesson.number}`} key={lesson.id}>{content}</Link>
            : <div className={className} id={`lesson-${lesson.number}`} key={lesson.id}>{content}</div>;
        })}
      </section>
      <MobileNav />
    </main>
  );
}
