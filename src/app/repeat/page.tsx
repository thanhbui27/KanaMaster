import type { Metadata } from "next";
import { RepeatClient } from "@/components/repeat/repeat-client";
import { getLesson, lessonIds } from "@/lib/minna/server";
import { LEARN_LESSONS } from "@/lib/learn-lessons";
import { WORDS_BY_SCRIPT, PHRASES_BY_SCRIPT } from "@/data/test-content";
import { noteTopics } from "@/data/minna-notes";
import type { StudyWord } from "@/lib/repeat";
import "./repeat.css";

export const metadata: Metadata = { title: "Repeat · Lịch học cộng dồn" };
export default function RepeatPage() {
  const words: StudyWord[] = lessonIds().flatMap(id => (getLesson(id)?.vocabulary ?? []).map((w, i) => ({
    id: `minna:${w.id}`, order: String(i + 1), term: w.kanji || w.kana, reading: w.kana, meaning: w.meaning,
    phonetics: [], wordType: "", language: "ja", group: `Minna · Bài ${id}`,
  })));
  for (const lesson of LEARN_LESSONS) words.push(...lesson.kana.map((k, i) => ({
    id: `kana:${k.id}`, order: String(i + 1), term: k.character, reading: k.romaji, meaning: "",
    phonetics: [{ label: "Romaji", value: k.romaji }], wordType: "Kana", language: "ja", group: lesson.title,
  })));
  for (const [kind, source] of [["Từ luyện đọc", WORDS_BY_SCRIPT], ["Cụm luyện đọc", PHRASES_BY_SCRIPT]] as const) {
    for (const script of ["hiragana", "katakana"] as const) words.push(...source[script].map((w, i) => ({
      id: `${kind}:${w.id}`, order: String(i + 1), term: w.text, reading: w.romaji, meaning: "",
      phonetics: [{ label: "Romaji", value: w.romaji }], wordType: kind, language: "ja", group: `${kind} · ${script}`,
    })));
  }
  for (const topic of noteTopics) for (const [sectionIndex, section] of topic.sections.entries()) {
    for (const [i, row] of section.rows.entries()) {
      for (const language of ["ja", "zh"] as const) words.push({
        id: `notes:${topic.id}:${sectionIndex}:${i}:${language}`, order: String(i + 1),
        term: row[language], meaning: row.vi, reading: language === "ja" ? row.kana : row.pinyin,
        phonetics: [{ label: language === "ja" ? "Romaji" : "Pinyin", value: language === "ja" ? row.romaji : row.pinyin }],
        wordType: "", language, group: `Sổ tay · ${topic.title} · ${section.title} · ${language === "ja" ? "Nhật" : "Trung"}`,
      });
    }
  }
  return <RepeatClient catalog={words} />;
}
