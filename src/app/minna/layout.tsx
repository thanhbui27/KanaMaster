import Link from "next/link";
import { BookOpen } from "lucide-react";
import { MobileNav } from "@/components/mobile-nav";
import "./minna.css";

export default function MinnaLayout({ children }: { children: React.ReactNode }) {
  return <div className="app-shell mn-app" lang="vi"><header className="mn-topbar"><Link className="brand" href="/">Kana<span className="mn-brand-accent">Master</span><span className="mn-brand-divider" /></Link><Link className="mn-module-name" href="/minna"><BookOpen size={18} />Minna no Nihongo</Link><Link className="mn-back-kana" href="/learn">Học Kana ↗</Link></header><main className="mn-container">{children}</main><MobileNav /></div>;
}
