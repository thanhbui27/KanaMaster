"use client";

import { ArrowRight, BookOpen, ChevronRight, Layers, PencilLine, RotateCcw, Sprout } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { KANA_BY_SCRIPT } from "@/data/kana";
import { LEARN_LESSONS, countCompletedKana, isLessonUnlocked } from "@/lib/learn-lessons";
import { demoProgress, readProgress, type LearningProgress } from "@/lib/progress-storage";
import { decodeProgress } from "@/lib/minna/progress";
import type { LessonSummary } from "@/lib/minna/types";
import { useMinnaStore } from "@/components/minna/use-progress";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { MobileNav } from "@/components/mobile-nav";

export function HomeScreen({ minnaLessons }: { minnaLessons: LessonSummary[] }) {
  const [progress, setProgress] = useState<LearningProgress>(demoProgress);
  const [ready, setReady] = useState(false);
  const { data: minna, ready: minnaReady } = useMinnaStore();
  useEffect(() => {
    const sync = () => { setProgress(readProgress()); setReady(true); };
    const frame = requestAnimationFrame(sync);
    window.addEventListener("storage", sync); window.addEventListener("focus", sync);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("storage", sync); window.removeEventListener("focus", sync); };
  }, []);
  const completed = new Set(Object.keys(progress.lessonProgress).filter(id => progress.lessonProgress[id]?.completedAt));
  const hiragana = countCompletedKana(completed, "hiragana");
  const katakana = countCompletedKana(completed, "katakana");
  const available = minnaLessons.filter(l => l.available);
  const started = available.filter(l => { const p = decodeProgress(minna[l.id]); return p.learned.length || p.grammar.length || p.quiz.attempts || Object.keys(p.answers).length; });
  const words = available.reduce((count, l) => count + Math.min(decodeProgress(minna[l.id]).learned.length, l.vocabulary), 0);
  const nextKana = LEARN_LESSONS.find((l, i) => !completed.has(l.id) && isLessonUnlocked(completed, i));
  const kanaStarted = LEARN_LESSONS.some(l => completed.has(l.id));
  const resume = started[0];
  const resumeHref = resume ? `/minna/${resume.id}` : nextKana ? `/learn/${nextKana.id}` : "/minna";
  const loaded = ready && minnaReady;
  const courses = [
    { key: "hiragana", name: "Hiragana", symbol: "ひ", subtitle: "BẢNG CHỮ CÁI CƠ BẢN", description: "Làm quen với âm tiếng Nhật qua từng nhóm chữ. Nhận diện, đọc và luyện viết.", count: hiragana, total: KANA_BY_SCRIPT.hiragana.length, color: "coral" },
    { key: "katakana", name: "Katakana", symbol: "カ", subtitle: "ĐỌC TÊN RIÊNG & TỪ MƯỢN", description: "Học từng nhóm âm, đọc từ mượn và phân biệt những chữ Katakana dễ nhầm.", count: katakana, total: KANA_BY_SCRIPT.katakana.length, color: "indigo" },
  ];
  return <div className="app-shell dashboard-home" lang="vi">
    <header className="dh-header"><Link href="/" className="dh-brand"><Image src="/icons/icon-48x48.png" alt="" width={34} height={34} priority /><span>Kana<span>Master</span></span></Link><span className="dh-header-note">Không gian học tiếng Nhật của bạn</span><Link href="/progress" className="dh-header-link">Tiến độ học tập <ChevronRight size={15} /></Link></header>
    <main className="dh-main">
      <section className="dh-welcome"><div><span className="dh-eyebrow">CHÀO MỪNG BẠN TRỞ LẠI</span><h1>Một chút mỗi ngày.<br /><span>Tiếng Nhật gần hơn.</span></h1><p>Từ những nét chữ đầu tiên đến những câu hoàn chỉnh.<br className="dh-desktop-break" /> Chọn bài học và tiếp tục theo nhịp của bạn.</p><div className="dh-hero-actions"><Link href={loaded ? resumeHref : "/learn"} className="dh-button">{kanaStarted || resume ? "Tiếp tục học" : "Bắt đầu học"}<ArrowRight size={17} /></Link><a href="#courses" className="dh-text-link">Khám phá lộ trình <ChevronRight size={16} /></a></div></div><div className="dh-visual" aria-hidden="true"><span>小さな一歩、大きな進歩。</span><div className="dh-symbols"><span>あ<small>HIRAGANA</small></span><span>ア<small>KATAKANA</small></span><span>語<small>MINNA</small></span></div><small>Học một điều mới. Nhớ thêm một chút.</small></div></section>
      <section className="dh-summary" aria-label="Tiến độ tổng quan"><div><span className="dh-icon coral"><BookOpen size={20} /></span><div><strong>{ready ? hiragana + katakana : "—"}<small> / {KANA_BY_SCRIPT.hiragana.length + KANA_BY_SCRIPT.katakana.length}</small></strong><p>Chữ Kana đã học</p></div></div><div><span className="dh-icon indigo"><Layers size={20} /></span><div><strong>{minnaReady ? words : "—"}</strong><p>Từ vựng đã nhớ</p></div></div><div><span className="dh-icon mint"><Sprout size={21} /></span><div><strong>{minnaReady ? started.length : "—"}<small> / {available.length}</small></strong><p>Bài Minna đã bắt đầu</p></div></div></section>
      <section id="courses"><div className="dh-section-heading"><div><span className="dh-eyebrow">HỌC TỪ NỀN TẢNG</span><h2>Ba lộ trình, một hành trình.</h2></div><p>Chọn nơi bạn muốn bắt đầu</p></div><div className="dh-course-grid">
        {courses.map(course => <article className={`dh-course ${course.color}`} key={course.key}><div className="dh-course-top"><span className="dh-course-symbol" lang="ja">{course.symbol}</span><span className="dh-tag">Kana</span></div><span className="dh-eyebrow">{course.subtitle}</span><h3>{course.name}</h3><p>{course.description}</p><div className="dh-course-progress"><span>{ready ? `${course.count} / ${course.total} chữ đã học` : "Đang tải tiến độ…"}</span><strong>{ready ? `${Math.round(course.count / course.total * 100)}%` : "—"}</strong></div><div className="dh-track"><i style={{ width: `${course.count / course.total * 100}%` }} /></div><Link className="dh-course-link" href={`/learn?script=${course.key}`}>{course.count ? "Tiếp tục lộ trình" : "Khám phá bảng chữ"}<ArrowRight size={17} /></Link></article>)}
        <article className="dh-course mint"><div className="dh-course-top"><span className="dh-course-symbol" lang="ja">日本語</span><span className="dh-tag">Từ vựng & ngữ pháp</span></div><span className="dh-eyebrow">TỪ VỰNG ĐẾN GIAO TIẾP</span><h3>Minna no Nihongo</h3><p>Học theo từng bài với flashcard, quiz từ vựng, ngữ pháp và bài tập thực hành.</p><div className="dh-minna-count"><strong>{available.length}</strong><span>bài học có dữ liệu<br /><small>{available.reduce((n, l) => n + l.vocabulary, 0).toLocaleString("vi-VN")} mục từ vựng</small></span></div><Link className="dh-course-link" href="/minna">Vào học Minna <ArrowRight size={17} /></Link></article>
      </div></section>
      <div className="dh-bottom-grid"><section className="dh-next"><div className="dh-section-heading"><div><span className="dh-eyebrow">TỪ NƠI BẠN ĐANG HỌC</span><h2>Bước tiếp theo</h2></div><BookOpen size={20} /></div><div className="dh-next-list">{courses.map(course => {
        const lessons = LEARN_LESSONS.filter(l => l.script === course.key);
        const next = lessons.find(l => !completed.has(l.id));
        return <Link href={next ? `/learn/${next.id}` : `/test/${course.key}/review`} key={course.key}><span className={`dh-icon ${course.color}`} lang="ja">{course.symbol}</span><div><small>{course.name.toUpperCase()} · {next ? `BÀI ${next.number}` : "ÔN TẬP"}</small><strong lang="ja">{next ? next.kana.map(k => k.character).join(" ") : "Ôn lại những chữ đã học"}</strong></div><ChevronRight size={18} /></Link>;
      })}<Link href={`/minna/${resume?.id ?? available[0]?.id ?? 1}`}><span className="dh-icon mint"><Layers size={21} /></span><div><small>MINNA NO NIHONGO · BÀI {resume?.id ?? available[0]?.id ?? 1}</small><strong>{resume ? "Tiếp tục từ vựng & ngữ pháp" : "Bắt đầu với từ vựng đầu tiên"}</strong></div><ChevronRight size={18} /></Link></div><p className="dh-resume-note">Học theo từng nhóm nhỏ, rồi ôn lại để ghi nhớ lâu hơn.</p></section>
      <aside className="dh-practice"><span className="dh-eyebrow">MỘT VÒNG ÔN TẬP NHANH</span><h2>Củng cố điều đã học</h2><p>Chọn một cách luyện tập phù hợp với bạn hôm nay.</p><div className="dh-practice-links"><Link href="/minna/notes"><BookOpen size={18} /><span>Lưu ý · Nhật – Trung – Việt</span><ArrowRight size={15} /></Link><Link href="/test/hiragana/review"><RotateCcw size={18} /><span>Ôn Hiragana</span><ArrowRight size={15} /></Link><Link href="/test/katakana/review"><RotateCcw size={18} /><span>Ôn Katakana</span><ArrowRight size={15} /></Link><Link href="/practice/handwriting"><PencilLine size={18} /><span>Luyện viết tay</span><ArrowRight size={15} /></Link></div><Link href="/practice" className="dh-text-link">Xem tất cả cách luyện tập <ChevronRight size={15} /></Link></aside></div>
      <p className="dh-footnote">Tiến độ được lưu trên trình duyệt này. Mỗi bước nhỏ đều là một phần của hành trình.</p>
    </main><InstallPrompt /><MobileNav />
  </div>;
}
