"use client";

import { BookOpen, ChartNoAxesColumnIncreasing, Dumbbell, Home, RotateCcw, Library } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Learn", icon: BookOpen, href: "/learn" },
  { label: "Minna", icon: Library, href: "/minna" },
  { label: "Practice", icon: Dumbbell, href: "/practice" },
  { label: "Review", icon: RotateCcw, href: "/review" },
  { label: "Progress", icon: ChartNoAxesColumnIncreasing, href: "/progress" },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="mobile-nav" aria-label="Main navigation">
      {items.map(({ label, icon: Icon, href }) => {
        const isReviewTest = /^\/test\/(hiragana|katakana)\/review$/.test(pathname);
        const active = label === "Home"
          ? pathname === "/"
          : label === "Review"
            ? pathname.startsWith(href) || isReviewTest
            : label === "Practice"
              ? pathname.startsWith(href) || (pathname.startsWith("/test/") && !isReviewTest)
              : pathname.startsWith(href);
        return (
        <Link key={label} href={href} aria-label={label === "Minna" ? "Minna no Nihongo" : label} className={active ? "nav-item active" : "nav-item"} aria-current={active ? "page" : undefined}>
          <Icon size={21} strokeWidth={active ? 2.8 : 2.2} />
          <span>{label}</span>
        </Link>
      );})}
    </nav>
  );
}
