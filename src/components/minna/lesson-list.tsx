"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BookOpen, Search, Sparkles } from "lucide-react";
import type { LessonSummary } from "@/lib/minna/types";
import { decodeProgress } from "@/lib/minna/progress";
import { useMinnaStore } from "./use-progress";

export function LessonList({ lessons }: { lessons: LessonSummary[] }) {
  const [search, setSearch] = useState("");
  const [range, setRange] = useState("all");
  const { data, ready } = useMinnaStore();
  const available = lessons.filter(l => l.available);
  const visible = lessons.filter(l => (range === "all" || (range === "first" ? l.id <= 25 : l.id > 25)) && `${l.id} ${l.title} ${l.topics.join(" ")}`.toLowerCase().includes(search.toLowerCase()));
  const started = available.filter(l => { const p = decodeProgress(data[l.id]); return p.learned.length || p.grammar.length || p.quiz.attempts || Object.keys(p.answers).length; });
  return <>
    <section className="mn-hero">
      <div><span className="mn-kicker"><Sparkles size={15} /> MỖI NGÀY, MỘT BƯỚC TIẾN</span><h1>Từ bảng chữ cái<br />đến <em>những câu đầu tiên.</em></h1><p>Học Minna no Nihongo theo từng bài: ghi nhớ từ vựng, hiểu ngữ pháp và thực hành ngay. Chọn nhịp học phù hợp với bạn.</p><Link className="mn-button primary" href={`/minna/${started[0]?.id ?? 1}`}>{started.length ? "Tiếp tục học" : "Bắt đầu từ bài 1"}<ArrowRight size={17} /></Link></div>
      <div className="mn-hero-art" aria-hidden="true"><span>みんなの</span><strong>日本語</strong><small>HỌC · HIỂU · GHI NHỚ</small><i>あ</i></div>
    </section>
    <div className="mn-stat-grid"><div><strong>{available.length}<small> / {lessons.length}</small></strong><span>Bài học có dữ liệu</span></div><div><strong>{available.reduce((n, l) => n + l.vocabulary, 0).toLocaleString("vi-VN")}</strong><span>Mục từ vựng</span></div><div><strong>{ready ? started.length : "—"}</strong><span>Bài đã bắt đầu</span></div></div>
    <section className="mn-catalog"><div className="mn-heading"><div><span className="mn-kicker">LỘ TRÌNH CỦA BẠN</span><h2>Chọn một bài để học</h2></div><span className="mn-muted">Tự do học theo thứ tự bạn muốn</span></div>
      <div className="mn-toolbar"><label className="mn-search"><Search size={18} /><input aria-label="Tìm bài học" placeholder="Tìm số bài hoặc chủ điểm ngữ pháp…" value={search} onChange={e => setSearch(e.target.value)} /></label><div className="mn-segment" aria-label="Nhóm bài">{[["all", "Tất cả"], ["first", "Bài 1–25"], ["last", "Bài 26–50"]].map(([key, label]) => <button key={key} aria-pressed={range === key} onClick={() => setRange(key)}>{label}</button>)}</div></div>
      <div className="mn-lesson-grid">{visible.map(lesson => {
        const p = decodeProgress(data[lesson.id]);
        const ratios = [...(lesson.vocabulary ? [Math.min(p.learned.length, lesson.vocabulary) / lesson.vocabulary, p.quiz.bestTotal ? p.quiz.bestCorrect / p.quiz.bestTotal : 0] : []), ...(lesson.grammar ? [Math.min(p.grammar.length, lesson.grammar) / lesson.grammar] : []), ...(lesson.exercises ? [Math.min(p.completed.length, lesson.exercises) / lesson.exercises] : [])];
        const percent = ratios.length ? Math.round(ratios.reduce((a, b) => a + b, 0) / ratios.length * 100) : 0;
        return <article className={`mn-lesson-card ${!lesson.available ? "unavailable" : ""}`} key={lesson.id}><div className="mn-card-top"><span className="mn-lesson-number">{String(lesson.id).padStart(2, "0")}</span><span className="mn-pill">{!lesson.available ? "Chưa có dữ liệu" : percent === 100 ? "Đã hoàn thành" : percent ? "Đang học" : "Sẵn sàng học"}</span></div><h3>Bài {lesson.id}</h3><p className="mn-card-topic">{lesson.topics[0]?.replace(/^\d+[.．]\s*/, "") || lesson.title}</p>{lesson.available ? <><div className="mn-card-counts"><span><BookOpen size={14} /> {lesson.vocabulary} từ vựng</span><span>{lesson.grammar} ngữ pháp</span><span>{lesson.exercises} bài tập</span></div><div className="mn-meter"><span style={{ width: `${percent}%` }} /></div><div className="mn-card-bottom"><small>{percent}% tiến độ</small><Link href={`/minna/${lesson.id}`}>{percent || Object.keys(p.answers).length ? "Tiếp tục học" : "Bắt đầu học"}<ArrowRight size={15} /></Link></div></> : <p className="mn-muted">Nguồn Riki chưa tải được. Bài sẽ mở khi có dữ liệu.</p>}</article>;
      })}</div>{!visible.length && <div className="mn-empty">Không tìm thấy bài phù hợp. Thử số bài hoặc từ khóa khác.</div>}
    </section>
    <p className="mn-footnote">Nội dung từ Riki · Bài 12 chưa tải được. Bài 39, 48, 49, 50 hiện có ngữ pháp và bài tập, chưa có bảng từ vựng trong nguồn.</p>
  </>;
}
