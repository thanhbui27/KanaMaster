import { ArrowRight, Keyboard, PencilLine, ScanText, Timer, Volume2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { MobileNav } from "@/components/mobile-nav";

const modes = [
  { name: "Recognition", description: "See a kana and choose its reading.", icon: ScanText, color: "coral", href: "/practice/recognition" },
  { name: "Typing", description: "Type the reading from memory.", icon: Keyboard, color: "indigo", href: "/practice/typing" },
  { name: "Speed round", description: "Recall as many as you can in 30 seconds.", icon: Timer, color: "gold", href: "/practice/speed" },
];

export default function PracticePage() {
  return (
    <main className="practice-page">
      <header className="practice-header">
        <Link href="/" className="writing-brand"><Image src="/icons/icon-48x48.png" alt="" width={34} height={34} priority /><span>KanaMaster</span></Link>
        <Link href="/" className="practice-home-link">Home</Link>
      </header>
      <section className="practice-intro">
        <span>PRACTICE</span>
        <h1>Build recall from every direction.</h1>
        <p>Short focused sessions help you recognize, remember and write kana without relying on romaji.</p>
      </section>
      <section className="featured-writing-card">
        <div className="featured-icon"><PencilLine size={30} /></div>
        <div>
          <span className="new-pill">NEW · ON-DEVICE</span>
          <h2>Handwriting</h2>
          <p>See or hear a prompt, write the kana with your finger, mouse or stylus, and get instant recognition feedback.</p>
          <div className="feature-tags"><span><Volume2 size={14} /> Audio → writing</span><span>き Stroke feedback</span></div>
        </div>
        <Link href="/practice/handwriting">Start writing <ArrowRight size={18} /></Link>
      </section>
      <section className="practice-mode-grid" aria-label="Other practice modes">
        {modes.map(({ name, description, icon: Icon, color, href }) => (
          <article className={`practice-mode-card ${color}`} key={name}>
            <span><Icon size={23} /></span><h2>{name}</h2><p>{description}</p><Link href={href}>Start practice <ArrowRight size={15} /></Link>
          </article>
        ))}
      </section>
      <MobileNav />
    </main>
  );
}
