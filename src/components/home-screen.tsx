"use client";

import { ArrowRight, Flame, Sparkles, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { KANA_BY_SCRIPT } from "@/data/kana";
import { LEARN_LESSONS, countCompletedKana, isLessonUnlocked } from "@/lib/learn-lessons";
import { demoProgress, readProgress, writeProgress, type LearningProgress } from "@/lib/progress-storage";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { MobileNav } from "@/components/mobile-nav";

export function HomeScreen() {
  const [progress, setProgress] = useState<LearningProgress>(demoProgress);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = readProgress();
      const next = { ...stored, lastOpenedAt: new Date().toISOString() };
      setProgress(next);
      writeProgress(next);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const completedLessonIds = new Set(Object.keys(progress.lessonProgress ?? {}).filter((id) => progress.lessonProgress[id]?.completedAt));
  const hiraganaDone = countCompletedKana(completedLessonIds, "hiragana");
  const katakanaDone = countCompletedKana(completedLessonIds, "katakana");
  const previewLessons = LEARN_LESSONS.slice(0, 3).map((lesson, index) => {
    const completed = completedLessonIds.has(lesson.id);
    const unlocked = isLessonUnlocked(completedLessonIds, index);
    return {
      ...lesson,
      state: completed ? "COMPLETE" : unlocked ? "LEARNING" : "LOCKED",
      href: unlocked ? `/learn/${lesson.id}` : "/learn",
    };
  });

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="KanaMaster home">
          <Image src="/icons/icon-48x48.png" alt="" width={38} height={38} priority />
          <span>KanaMaster</span>
        </a>
        <div className="streak-pill"><Flame size={18} fill="currentColor" /> {progress.streak} days</div>
      </header>

      <main id="top" className="home-content">
        <section className="welcome-row">
          <div>
            <p className="eyebrow">WEDNESDAY · DAILY PRACTICE</p>
            <h1>おかえり!</h1>
            <p>Welcome back. A few minutes today keeps your kana fresh.</p>
          </div>
          <div className="xp-chip"><Star size={16} fill="currentColor" /> 1,240 XP</div>
        </section>

        <section className="daily-card" aria-labelledby="daily-title">
          <div className="daily-card-copy">
            <span className="section-kicker"><Sparkles size={16} /> TODAY’S REVIEW</span>
            <h2 id="daily-title">Choose a review track</h2>
            <p>Smart Review keeps Hiragana and Katakana results completely separate.</p>
            <div className="home-review-links">
              <Link className="primary-button" href="/test/hiragana/review">ひ Hiragana <ArrowRight size={18} /></Link>
              <Link className="primary-button secondary" href="/test/katakana/review">カ Katakana <ArrowRight size={18} /></Link>
            </div>
          </div>
          <div className="kana-focus" aria-label="Hiragana character a">
            <span>あ</span>
            <small>A</small>
          </div>
        </section>

        <section id="progress" className="stats-grid" aria-label="Learning progress">
          <article className="stat-card">
            <div><span>Hiragana</span><strong>{hiraganaDone} / {KANA_BY_SCRIPT.hiragana.length}</strong></div>
            <div className="stat-bar"><i style={{ width: `${(hiraganaDone / KANA_BY_SCRIPT.hiragana.length) * 100}%` }} /></div>
            <small>mastered</small>
          </article>
          <article className="stat-card katakana">
            <div><span>Katakana</span><strong>{katakanaDone} / {KANA_BY_SCRIPT.katakana.length}</strong></div>
            <div className="stat-bar"><i style={{ width: `${(katakanaDone / KANA_BY_SCRIPT.katakana.length) * 100}%` }} /></div>
            <small>mastered</small>
          </article>
        </section>

        <section id="learning-path" className="learning-path" aria-labelledby="path-title">
          <div className="section-heading">
            <div><span className="section-kicker">HIRAGANA</span><h2 id="path-title">Learning path</h2></div>
            <Link href="/learn?script=hiragana">See Hiragana</Link>
          </div>
          <div className="lesson-list">
            {previewLessons.map((lesson) => (
              <Link className={`lesson-card ${lesson.state.toLowerCase()}`} href={lesson.href} key={lesson.number}>
                <span className="lesson-number">{lesson.state === "COMPLETE" ? "✓" : lesson.number}</span>
                <span className="lesson-copy"><small>LESSON {lesson.number}</small><strong>{lesson.kana.map((kana) => kana.character).join(" ")}</strong></span>
                <span className="lesson-state">{lesson.state}</span>
                <ArrowRight size={19} />
              </Link>
            ))}
          </div>
        </section>
      </main>

      <InstallPrompt />
      <MobileNav />
    </div>
  );
}
