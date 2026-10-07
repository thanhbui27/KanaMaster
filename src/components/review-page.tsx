"use client";
import { PageHeading } from "@/components/page-heading";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
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
      <p>{label.toUpperCase()} · ÔN TẬP</p><h2>{Math.max(0, track.dailyReviewGoal - done)} chữ cần ôn</h2>
      <div className="review-bar"><i style={{ width: `${Math.min(100, (done / Math.max(1, track.dailyReviewGoal)) * 100)}%` }} /></div>
      <small>{done} / {track.dailyReviewGoal} hôm nay · {getTrackAccuracy(track)}% chính xác</small>
      <div className="weak-preview"><span>Cần ôn:</span><strong>{weak.length ? weak.map((kana) => kana?.character).join(" · ") : "Chưa có dữ liệu"}</strong></div>
      <Link href={`/test/${script}/review`}>Bắt đầu ôn tập <ArrowRight size={17} /></Link>
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
      <PageHeading eyebrow="ÔN TẬP THÔNG MINH" title="Nhớ chắc hơn, từng chữ một." description="Ưu tiên chữ mới, chữ hay nhầm và chữ đã lâu chưa ôn trong từng bảng chữ." />
      <nav className="ui-feature-links" aria-label="Chọn cách ôn"><Link href="/review" aria-current="page">Ôn Kana</Link><Link href="/repeat">Repeat · Ôn từ theo lịch</Link><Link href="/minna">Flashcard & quiz Minna</Link></nav>
      <section className="review-track-grid"><ReviewTrack script="hiragana" progress={progress} /><ReviewTrack script="katakana" progress={progress} /></section>
      
    </main>
  );
}
