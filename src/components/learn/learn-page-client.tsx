"use client";
import { PageHeading } from "@/components/page-heading";

import { ArrowRight, Check, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { KANA_BY_SCRIPT, KANA_CATEGORY_LABELS, type KanaScript } from "@/data/kana";
import { LEARN_LESSONS, countCompletedKana, getLessonsForScript, isLessonUnlocked } from "@/lib/learn-lessons";
import { demoProgress, readProgress, type LearningProgress } from "@/lib/progress-storage";

function lessonState(completed: boolean, unlocked: boolean) {
  if (completed) return "Đã xong";
  if (unlocked) return "Đang học";
  return "Chưa mở";
}

export function LearnPageClient({ initialScript = "hiragana" }: { initialScript?: KanaScript }) {
  const [script, setScript] = useState<KanaScript>(initialScript);
  const [progress, setProgress] = useState<LearningProgress>(demoProgress);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setProgress(readProgress()));
    return () => cancelAnimationFrame(frame);
  }, []);

  const completedLessonIds = useMemo(() => new Set(Object.keys(progress.lessonProgress ?? {}).filter((id) => progress.lessonProgress[id]?.completedAt)), [progress]);
  const activeLessons = getLessonsForScript(script);
  const hiraganaDone = countCompletedKana(completedLessonIds, "hiragana");
  const katakanaDone = countCompletedKana(completedLessonIds, "katakana");

  return (
    <main className="standard-page">
      <PageHeading eyebrow="BẢNG CHỮ CÁI" title="Học Kana theo từng nhóm âm." description="Chọn Hiragana hoặc Katakana. Hoàn thành từng bài để mở nhóm chữ tiếp theo." />

      <nav className="ui-feature-links" aria-label="Nguồn học"><Link href="/learn" aria-current="page">Bảng chữ cái</Link><Link href="/minna">Minna no Nihongo</Link><Link href="/minna/notes">Sổ tay ngôn ngữ</Link></nav>
      <div className="track-switch" role="group" aria-label="Kana learning track">
        <button className={script === "hiragana" ? "active" : ""} onClick={() => setScript("hiragana")} type="button">ひ Hiragana</button>
        <button className={script === "katakana" ? "active" : ""} onClick={() => setScript("katakana")} type="button">カ Katakana</button>
      </div>

      <section className="learn-summary-grid" aria-label="Learning summary">
        <article className={script === "hiragana" ? "selected" : ""}><span>Hiragana</span><strong>{hiraganaDone} / {KANA_BY_SCRIPT.hiragana.length}</strong></article>
        <article className={script === "katakana" ? "selected" : ""}><span>Katakana</span><strong>{katakanaDone} / {KANA_BY_SCRIPT.katakana.length}</strong></article>
      </section>

      <section className="full-lesson-list learn-path-list">
        {activeLessons.map((lesson, localIndex) => {
          const globalIndex = LEARN_LESSONS.findIndex((item) => item.id === lesson.id);
          const completed = completedLessonIds.has(lesson.id);
          const unlocked = isLessonUnlocked(completedLessonIds, globalIndex);
          const state = lessonState(completed, unlocked);
          const className = `full-lesson-card ${completed ? "complete" : ""} ${unlocked ? "" : "locked"}`;
          const previous = activeLessons[localIndex - 1];
          const content = (
            <>
              <span className="full-lesson-number">{completed ? <Check size={20} /> : unlocked ? lesson.number : <LockKeyhole size={18} />}</span>
              <span>
                <small>BÀI {lesson.number} · {state.toUpperCase()}</small>
                <strong>{lesson.kana.map((kana) => kana.character).join(" ")}</strong>
                <em>{lesson.kana.length} chữ · {lesson.supportsWriting ? "Nhận diện, gõ, viết" : "Nhận diện và gõ"}</em>
              </span>
              {unlocked && <ArrowRight size={20} />}
            </>
          );
          return (
            <Fragment key={lesson.id}>
              {(!previous || previous.category !== lesson.category) && (
                <div className="lesson-group-heading"><strong>{KANA_CATEGORY_LABELS[lesson.category]}</strong><span>{lesson.description}</span></div>
              )}
              <div className="lesson-row-heading"><strong>{lesson.rowLabel}</strong><span>{lesson.kana.map((kana) => kana.romaji).join(" · ")}</span></div>
              {unlocked
                ? <Link className={className} href={`/learn/${lesson.id}`} id={`lesson-${script}-${lesson.number}`}>{content}</Link>
                : <div className={className} id={`lesson-${script}-${lesson.number}`}>{content}</div>}
            </Fragment>
          );
        })}
      </section>
      
    </main>
  );
}
