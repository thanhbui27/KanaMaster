import { ArrowRight, Check, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { MobileNav } from "@/components/mobile-nav";

const lessons = [
  { number: 1, kana: "あ い う え お", state: "Mastered", href: "/practice/handwriting?kana=a" },
  { number: 2, kana: "か き く け こ", state: "Learning", href: "/practice/handwriting?kana=ki" },
  { number: 3, kana: "さ し す せ そ", state: "Available", href: "/practice/recognition" },
  { number: 4, kana: "た ち つ て と", state: "Locked", href: null },
  { number: 5, kana: "な に ぬ ね の", state: "Locked", href: null },
];

export default function LearnPage() {
  return (
    <main className="standard-page">
      <header className="standard-header"><Link href="/">KanaMaster</Link><span>Learn</span></header>
      <section className="standard-intro"><span>HIRAGANA PATH</span><h1>Learn five at a time.</h1><p>Complete short lessons, then reinforce them with active recall and handwriting.</p></section>
      <section className="full-lesson-list">
        {lessons.map((lesson) => {
          const content = <><span className="full-lesson-number">{lesson.state === "Mastered" ? <Check size={20} /> : lesson.state === "Locked" ? <LockKeyhole size={18} /> : lesson.number}</span><span><small>LESSON {lesson.number} · {lesson.state.toUpperCase()}</small><strong>{lesson.kana}</strong></span>{lesson.href && <ArrowRight size={20} />}</>;
          return lesson.href ? <Link id={`lesson-${lesson.number}`} href={lesson.href} className="full-lesson-card" key={lesson.number}>{content}</Link> : <div id={`lesson-${lesson.number}`} className="full-lesson-card locked" key={lesson.number}>{content}</div>;
        })}
      </section>
      <MobileNav />
    </main>
  );
}
