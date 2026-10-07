"use client";

import { ArrowRight, BookOpen, CalendarDays, ChevronRight, Layers, PencilLine, RotateCcw, Sprout, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { KANA_BY_SCRIPT } from "@/data/kana";
import { LEARN_LESSONS, countCompletedKana, isLessonUnlocked } from "@/lib/learn-lessons";
import { demoProgress, readProgress, type LearningProgress } from "@/lib/progress-storage";
import { decodeProgress } from "@/lib/minna/progress";
import type { LessonSummary } from "@/lib/minna/types";
import { useMinnaStore } from "@/components/minna/use-progress";
import { PageHeading } from "@/components/page-heading";
import { decodeRepeat, localDate, REPEAT_KEY, type StudyPlan } from "@/lib/repeat";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export function HomeScreen({ minnaLessons }: { minnaLessons: LessonSummary[] }) {
  const [progress, setProgress] = useState<LearningProgress>(demoProgress);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [ready, setReady] = useState(false);
  const { data: minna, ready: minnaReady } = useMinnaStore();
  useEffect(() => {
    const sync = () => { setProgress(readProgress()); setReady(true); try { setPlans(decodeRepeat(localStorage.getItem(REPEAT_KEY)).plans); } catch { setPlans([]); } };
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
  const resume = started[0];
  const resumeHref = resume ? `/minna/${resume.id}` : nextKana ? `/learn/${nextKana.id}` : "/minna";
  const loaded = ready && minnaReady;
  const courses = [
    { key: "hiragana", name: "Hiragana", symbol: "ひ", subtitle: "BẢNG CHỮ CÁI CƠ BẢN", description: "Làm quen với âm tiếng Nhật qua từng nhóm chữ. Nhận diện, đọc và luyện viết.", count: hiragana, total: KANA_BY_SCRIPT.hiragana.length, color: "coral" },
    { key: "katakana", name: "Katakana", symbol: "カ", subtitle: "ĐỌC TÊN RIÊNG & TỪ MƯỢN", description: "Học từng nhóm âm, đọc từ mượn và phân biệt những chữ Katakana dễ nhầm.", count: katakana, total: KANA_BY_SCRIPT.katakana.length, color: "indigo" },
  ];
  const due = plans.reduce((n, p) => n + p.dates.filter(d => d <= localDate() && !p.completed.includes(d)).length, 0);
  return <div className="app-shell dashboard-home" lang="vi"><main className="dh-main">
    <PageHeading eyebrow="MỖI NGÀY, MỘT BƯỚC TIẾN" title="Hôm nay, mình học gì?" description="Tiếp tục bài đang học, ôn từ theo lịch hoặc dành vài phút luyện tập." action={<Link href={loaded ? resumeHref : "/learn"} className="ui-button primary">Tiếp tục học <ArrowRight size={17} /></Link>} />
    <section className="home-stats" aria-label="Tiến độ tổng quan">
      <div><span className="home-stat-icon coral"><BookOpen size={20} /></span><div><small>Chữ Kana đã học</small><strong>{ready ? hiragana + katakana : "—"}<span> / {KANA_BY_SCRIPT.hiragana.length + KANA_BY_SCRIPT.katakana.length}</span></strong></div></div>
      <div><span className="home-stat-icon mint"><Layers size={20} /></span><div><small>Từ vựng đã nhớ</small><strong>{minnaReady ? words : "—"}</strong></div></div>
      <div><span className="home-stat-icon indigo"><Sprout size={20} /></span><div><small>Bài Minna đã bắt đầu</small><strong>{minnaReady ? started.length : "—"}<span> / {available.length}</span></strong></div></div>
    </section>
    <section className="home-today" aria-label="Học và ôn hôm nay"><article className="home-resume"><span className="ui-eyebrow">TIẾP TỤC HÀNH TRÌNH</span><h2>{resume ? `Minna · Bài ${resume.id}` : nextKana ? `${nextKana.script === "hiragana" ? "Hiragana" : "Katakana"} · Bài ${nextKana.number}` : "Ôn lại những điều đã học"}</h2><p>{resume ? "Từ vựng, ngữ pháp và bài tập đang chờ bạn." : "Học theo nhóm nhỏ. Nhận diện, đọc và luyện viết."}</p><Link href={loaded ? resumeHref : "/learn"}>Vào bài học <ArrowRight size={17} /></Link><span className="home-resume-symbol" aria-hidden="true">{resume ? "語" : "あ"}</span></article>
    <article className="home-repeat"><div className="ui-section-heading"><span className="ui-eyebrow">REPEAT · LỊCH HỌC</span><CalendarDays size={22} /></div><h2>{ready && due ? `${due} buổi học đến hạn` : "Thêm từ mới. Ôn lại từ cũ."}</h2><p>{plans.length ? `${plans.length} lịch đã thiết lập. Mở lịch để học danh sách, flashcard hoặc quiz.` : "Chọn ngày, chọn bộ từ. Repeat tự cộng dồn phần ôn qua mỗi buổi."}</p><Link href="/repeat" className="ui-button">{plans.length ? "Mở lịch Repeat" : "Thiết lập lịch Repeat"}<ArrowRight size={16} /></Link></article></section>
    <section className="home-section" id="courses"><div className="ui-section-heading"><h2>Khóa học của bạn</h2><span className="home-caption">Bắt đầu từ nền tảng</span></div><div className="home-courses">
      {courses.map(course => <article className="home-course" key={course.key}><span className={`home-course-symbol ${course.color}`} lang="ja">{course.symbol}</span><h3>{course.name}</h3><p>{course.description}</p><div className="home-course-meta"><span>{ready ? `${course.count} / ${course.total} chữ` : "Đang tải…"}</span><span>{ready ? `${Math.round(course.count / course.total * 100)}%` : "—"}</span></div><div className="home-meter"><i style={{ width: `${course.count / course.total * 100}%` }} /></div><Link href={`/learn?script=${course.key}`}>Học bảng chữ <ArrowRight size={16} /></Link></article>)}
      <article className="home-course"><span className="home-course-symbol mint" lang="ja">語</span><h3>Minna no Nihongo</h3><p>Từ vựng, ngữ pháp và bài tập. Ghi nhớ bằng flashcard và kiểm tra với quiz.</p><div className="home-course-meta"><span>{available.length} bài học</span><span>{available.reduce((n,l) => n + l.vocabulary, 0).toLocaleString("vi-VN")} từ</span></div><div className="home-meter"><i style={{width:`${started.length / Math.max(1, available.length) * 100}%`}} /></div><Link href="/minna">Khám phá bài học <ArrowRight size={16} /></Link></article>
    </div></section>
    <section className="home-section"><div className="ui-section-heading"><h2>Luyện theo cách của bạn</h2><Link href="/practice">Tất cả chế độ <ChevronRight size={15} /></Link></div><div className="home-tools">{[
      {href:"/review",title:"Ôn Kana",description:"Tập trung vào chữ còn hay nhầm.",icon:RotateCcw},
      {href:"/practice/handwriting",title:"Luyện viết",description:"Luyện từng nét với chuột hoặc bút.",icon:PencilLine},
      {href:"/practice/speed",title:"Thử thách 30 giây",description:"Luyện phản xạ nhận diện nhanh.",icon:Zap},
      {href:"/minna/notes",title:"Sổ tay ngôn ngữ",description:"Số đếm, thời gian và cách dùng từ.",icon:BookOpen},
    ].map(({href,title,description,icon:Icon}) => <Link href={href} key={href}><span><Icon size={20}/></span><div><strong>{title}</strong><small>{description}</small></div><ArrowRight size={16}/></Link>)}</div></section>
  </main><InstallPrompt /></div>;
}
