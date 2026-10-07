"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { RepeatReminders } from "@/components/repeat/repeat-reminders";
import { ArrowUpRight, BookOpen, CalendarDays, ChartNoAxesColumnIncreasing, ChevronRight, Dumbbell, House, Library, Menu, NotebookPen, PencilLine, RotateCcw, X } from "lucide-react";

const destinations = [
  { href: "/", label: "Tổng quan", icon: House, group: "Không gian học" },
  { href: "/learn", label: "Bảng chữ cái", icon: BookOpen, group: "Không gian học" },
  { href: "/minna", label: "Minna no Nihongo", icon: Library, group: "Không gian học" },
  { href: "/minna/notes", label: "Sổ tay ngôn ngữ", icon: NotebookPen, group: "Không gian học" },
  { href: "/repeat", label: "Repeat · Lịch học", icon: CalendarDays, group: "Luyện tập & ghi nhớ" },
  { href: "/practice", label: "Luyện tập", icon: Dumbbell, group: "Luyện tập & ghi nhớ" },
  { href: "/review", label: "Ôn Kana", icon: RotateCcw, group: "Luyện tập & ghi nhớ" },
  { href: "/progress", label: "Tiến độ", icon: ChartNoAxesColumnIncreasing, group: "Luyện tập & ghi nhớ" },
];
function activeDestination(path: string) {
  if (path.startsWith("/test/")) return path.endsWith("/review") ? "/review" : "/practice";
  return [...destinations].reverse().find(d => d.href !== "/" && (path === d.href || path.startsWith(`${d.href}/`)))?.href ?? "/";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = activeDestination(pathname);
  const current = destinations.find(d => d.href === active)!;
  const [menu, setMenu] = useState(false);
  const groups = [...new Set(destinations.map(d => d.group))];
  const navigation = <>{groups.map(group => <div className="ui-nav-group" key={group}><p>{group}</p>{destinations.filter(d => d.group === group).map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={active === href ? "is-active" : ""} aria-current={active === href ? "page" : undefined} onClick={() => setMenu(false)}><Icon size={19} /><span>{label}</span>{href === "/repeat" && <span className="ui-nav-tag">Lịch</span>}</Link>)}</div>)}</>;
  return <div className="ui-shell">
    <a href="#app-content" className="ui-skip">Đến nội dung chính</a>
    <aside className="ui-sidebar"><Link href="/" className="ui-brand"><span className="ui-brand-mark" lang="ja">か</span><span>Kana<span>Master</span><small>HỌC ĐỀU, NHỚ LÂU</small></span></Link><nav aria-label="Điều hướng chính">{navigation}</nav><Link href="/practice/handwriting" className="ui-sidebar-tip"><PencilLine size={20} /><strong>Một nét mỗi ngày</strong><span>Luyện viết và ghi nhớ Kana.</span><span>Bắt đầu luyện viết <ArrowUpRight size={14} /></span></Link><p className="ui-storage-note">Tiến độ lưu trên trình duyệt này.</p></aside>
    <div className="ui-workspace"><header className="ui-topbar"><div className="ui-breadcrumb"><span className="ui-desktop-label">Không gian học</span><ChevronRight size={14} className="ui-desktop-label" /><current.icon size={18} /><span>{current.label}</span></div><RepeatReminders /></header>
      <div id="app-content" tabIndex={-1} className="ui-content">{children}</div>
      <footer className="ui-footer"><span>KanaMaster</span><span>Mỗi ngày một chút, mỗi lần tiến bộ.</span></footer>
    </div>
    {menu && <nav id="mobile-more" className="ui-mobile-menu" aria-label="Tất cả tính năng"><div className="ui-menu-heading"><strong>Khám phá KanaMaster</strong><button onClick={() => setMenu(false)} aria-label="Đóng menu"><X size={20} /></button></div>{navigation}</nav>}
    <nav className="ui-bottom-nav" aria-label="Điều hướng nhanh">{[
      { href: "/", label: "Trang chủ", icon: House }, { href: "/learn", label: "Học", icon: BookOpen },
      { href: "/practice", label: "Luyện tập", icon: Dumbbell }, { href: "/repeat", label: "Repeat", icon: CalendarDays },
    ].map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={active === href ? "page" : undefined} onClick={() => setMenu(false)}><Icon size={21} /><span>{label}</span></Link>)}<button aria-expanded={menu} aria-controls="mobile-more" onClick={() => setMenu(!menu)}><Menu size={21} /><span>Thêm</span></button></nav>
  </div>;
}
