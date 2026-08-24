import { ArrowRight, BookOpen, ChartNoAxesColumnIncreasing, Keyboard, Languages, MessageSquareText, PencilLine, RotateCcw, ScanText, WholeWord } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MobileNav } from "@/components/mobile-nav";
import type { KanaScript } from "@/data/kana";

const testModes = [
  { name: "Character Test", description: "Kana ↔ Romaji by sound group.", icon: Languages, path: "character" },
  { name: "Word Test", description: "Read randomized Japanese words.", icon: WholeWord, path: "word" },
  { name: "Phrase Test", description: "Short phrases in three difficulties.", icon: MessageSquareText, path: "phrase" },
  { name: "Smart Review", description: "Focus on weak and overdue Kana.", icon: RotateCcw, path: "review" },
];

const quickModes = [
  { name: "Recognition", icon: ScanText, path: "recognition" },
  { name: "Typing", icon: Keyboard, path: "typing" },
];

function TrackPanel({ script }: { script: KanaScript }) {
  const label = script === "hiragana" ? "Hiragana" : "Katakana";
  return (
    <article className={`track-panel ${script}`}>
      <header><span>{script === "hiragana" ? "ひ" : "カ"}</span><div><small>LEARNING TRACK</small><h2>{label}</h2></div></header>
      <div className="track-primary-links">
        <Link href={`/learn?script=${script}`}><BookOpen size={17} /> Lessons</Link>
        <Link href={`/progress?script=${script}`}><ChartNoAxesColumnIncreasing size={17} /> Progress</Link>
      </div>
      <div className="track-test-grid">
        {testModes.map(({ name, description, icon: Icon, path }) => (
          <Link href={`/test/${script}/${path}`} key={path}><Icon size={20} /><span><strong>{name}</strong><small>{description}</small></span><ArrowRight size={15} /></Link>
        ))}
      </div>
      <div className="quick-links"><span>Quick practice</span>{quickModes.map(({ name, icon: Icon, path }) => <Link key={path} href={`/practice/${path}?script=${script}`}><Icon size={14} /> {name}</Link>)}</div>
    </article>
  );
}

export default function PracticePage() {
  return (
    <main className="practice-page">
      <header className="practice-header">
        <Link href="/" className="writing-brand"><Image src="/icons/icon-48x48.png" alt="" width={34} height={34} priority /><span>KanaMaster</span></Link>
        <Link href="/" className="practice-home-link">Home</Link>
      </header>
      <section className="practice-intro">
        <span>PRACTICE & TESTS</span>
        <h1>Choose one Kana track.</h1>
        <p>Every session, result and weak-character statistic stays separate. There is no mixed mode.</p>
      </section>
      <section className="track-panel-grid"><TrackPanel script="hiragana" /><TrackPanel script="katakana" /></section>
      <section className="featured-writing-card compact-feature">
        <div className="featured-icon"><PencilLine size={28} /></div>
        <div><span className="new-pill">BASIC KANA · ON-DEVICE</span><h2>Handwriting</h2><p>Practice stroke recognition with an explicit Hiragana or Katakana selector.</p></div>
        <Link href="/practice/handwriting">Start writing <ArrowRight size={18} /></Link>
      </section>
      <MobileNav />
    </main>
  );
}
