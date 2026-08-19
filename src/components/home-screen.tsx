"use client";

import { ArrowRight, Flame, Sparkles, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { demoProgress, readProgress, writeProgress, type LearningProgress } from "@/lib/progress-storage";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { MobileNav } from "@/components/mobile-nav";

const lessons = [
  { number: 1, kana: "あ い う え お", state: "MASTERED", href: "/learn#lesson-1" },
  { number: 2, kana: "か き く け こ", state: "LEARNING", href: "/learn#lesson-2" },
  { number: 3, kana: "さ し す せ そ", state: "AVAILABLE", href: "/learn#lesson-3" },
];

export function HomeScreen() {
  const [progress, setProgress] = useState<LearningProgress>(demoProgress);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = readProgress();
      const next = { ...stored, lastOpenedAt: new Date().toISOString() };
      setProgress(next);
      writeProgress(next);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const completeReview = () => {
    setProgress((current) => {
      const next = { ...current, reviewsDone: Math.min(current.dailyReviewGoal, current.reviewsDone + 1) };
      writeProgress(next);
      return next;
    });
    setSavedMessage(true);
    window.setTimeout(() => setSavedMessage(false), 1800);
  };

  const reviewPercent = Math.round((progress.reviewsDone / progress.dailyReviewGoal) * 100);

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
            <h2 id="daily-title">{progress.dailyReviewGoal - progress.reviewsDone} characters waiting</h2>
            <p>Keep your streak alive with a quick recall session.</p>
            <div className="review-progress" aria-label={`${progress.reviewsDone} of ${progress.dailyReviewGoal} reviews complete`}>
              <div style={{ width: `${reviewPercent}%` }} />
            </div>
            <span className="progress-label">{progress.reviewsDone} / {progress.dailyReviewGoal} reviewed</span>
            <button className="primary-button" type="button" onClick={completeReview} disabled={progress.reviewsDone >= progress.dailyReviewGoal}>
              {progress.reviewsDone >= progress.dailyReviewGoal ? "Daily review complete" : "Continue learning"}
              {progress.reviewsDone < progress.dailyReviewGoal && <ArrowRight size={19} />}
            </button>
            {savedMessage && <span className="save-toast" role="status">Progress saved on this device ✓</span>}
          </div>
          <div className="kana-focus" aria-label="Hiragana character a">
            <span>あ</span>
            <small>A</small>
          </div>
        </section>

        <section id="progress" className="stats-grid" aria-label="Learning progress">
          <article className="stat-card">
            <div><span>Hiragana</span><strong>{progress.hiraganaMastered} / 46</strong></div>
            <div className="stat-bar"><i style={{ width: `${(progress.hiraganaMastered / 46) * 100}%` }} /></div>
            <small>mastered</small>
          </article>
          <article className="stat-card katakana">
            <div><span>Katakana</span><strong>{progress.katakanaMastered} / 46</strong></div>
            <div className="stat-bar"><i style={{ width: `${(progress.katakanaMastered / 46) * 100}%` }} /></div>
            <small>mastered</small>
          </article>
        </section>

        <section id="learning-path" className="learning-path" aria-labelledby="path-title">
          <div className="section-heading">
            <div><span className="section-kicker">HIRAGANA</span><h2 id="path-title">Learning path</h2></div>
            <Link href="/learn">See all</Link>
          </div>
          <div className="lesson-list">
            {lessons.map((lesson) => (
              <Link className={`lesson-card ${lesson.state.toLowerCase()}`} href={lesson.href} key={lesson.number}>
                <span className="lesson-number">{lesson.state === "MASTERED" ? "✓" : lesson.number}</span>
                <span className="lesson-copy"><small>LESSON {lesson.number}</small><strong>{lesson.kana}</strong></span>
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
