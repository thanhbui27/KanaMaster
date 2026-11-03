import type { Metadata } from "next";
import { KanjiStudy } from "@/components/kanji/kanji-study";
import { kanjiEntries } from "@/lib/kanji";
import "./kanji.css";

export const metadata: Metadata = {
  title: "Học Kanji",
  description: "Học Kanji N5–N1 theo bài nhỏ và bộ thủ, với từ ví dụ, flashcard và quiz.",
};

export default function KanjiPage() {
  return <KanjiStudy entries={kanjiEntries} />;
}
