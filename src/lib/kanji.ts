import levelLists from "@/data/kanji/jlpt-levels.json";
import openJlpt from "@/data/kanji/openjlpt.json";
import n5Additions from "@/data/kanji/n5-additions.json";
import hanVietList from "@/data/kanji/hanviet.json";
import { KANJI_LEVELS, kanjiRadicals, type KanjiEntry, type KanjiLevel } from "@/lib/kanji-shared";
import chapter01 from "@/data/kanji/chapter-01.json";
import chapter02 from "@/data/kanji/chapter-02.json";
import chapter03 from "@/data/kanji/chapter-03.json";
import chapter04 from "@/data/kanji/chapter-04.json";
import chapter05 from "@/data/kanji/chapter-05.json";
import chapter06 from "@/data/kanji/chapter-06.json";
import chapter07 from "@/data/kanji/chapter-07.json";
import chapter08 from "@/data/kanji/chapter-08.json";

export { KANJI_LEVELS } from "@/lib/kanji-shared";
export type { KanjiEntry, KanjiLevel } from "@/lib/kanji-shared";

const chapters = [chapter01, chapter02, chapter03, chapter04, chapter05, chapter06, chapter07, chapter08];
const levelByKanji = new Map<string, KanjiLevel>(KANJI_LEVELS.flatMap(level => levelLists[level].map(character => [character, level] as const)));
const sequenceByKanji = new Map<string, number>(KANJI_LEVELS.flatMap(level => levelLists[level].map((character, index) => [character, index + 1] as const)));
const radicalByKanji = new Map(kanjiRadicals.flatMap(group => group.kanji.map(character => [character, group] as const)));
const sourceByKanji = new Map(openJlpt.map(entry => [entry.kanji, entry] as const));
const additions = n5Additions as Record<string, { hanViet: string; meaning: string }>;
const hanVietByKanji = hanVietList as Record<string, string>;

const originalEntries: KanjiEntry[] = chapters.flat().map(({ id, chapter, order, kanji, hanViet, meaning, kunyomi, onyomi, mnemonicText }) => {
  const level = levelByKanji.get(kanji);
  if (!level) throw new Error(`Missing JLPT study level for ${kanji}`);
  const radical = radicalByKanji.get(kanji);
  if (!radical) throw new Error(`Missing radical for ${kanji}`);
  const source = sourceByKanji.get(kanji);
  return { id, level, chapter, order, sequence: sequenceByKanji.get(kanji)!, kanji, radical: radical.radical, radicalNumber: radical.number, hanViet, meaning, meaningLanguage: "vi", kunyomi, onyomi, mnemonicText, strokes: source?.strokes ?? null, exampleWord: source?.exampleWord ?? "", exampleReading: source?.exampleReading ?? "", exampleMeaningEnglish: source?.exampleMeaningEnglish ?? "" };
});
const originalKanji = new Set(originalEntries.map(entry => entry.kanji));
const importedEntries: KanjiEntry[] = openJlpt.filter(source => !originalKanji.has(source.kanji)).map(source => {
  const level = levelByKanji.get(source.kanji);
  if (!level) throw new Error(`Missing study level for ${source.kanji}`);
  const addition = additions[source.kanji];
  return {
    id: `openjlpt:${source.kanji}`, level, chapter: 0, order: sequenceByKanji.get(source.kanji)!, sequence: sequenceByKanji.get(source.kanji)!, kanji: source.kanji,
    radical: source.radical, radicalNumber: source.radicalNumber, hanViet: addition?.hanViet ?? hanVietByKanji[source.kanji] ?? "", meaning: addition?.meaning ?? source.meaningEnglish,
    meaningLanguage: addition ? "vi" : "en", kunyomi: source.kunyomi, onyomi: source.onyomi, mnemonicText: [], strokes: source.strokes,
    exampleWord: source.exampleWord, exampleReading: source.exampleReading, exampleMeaningEnglish: source.exampleMeaningEnglish,
  };
});

export const kanjiEntries: KanjiEntry[] = [...originalEntries, ...importedEntries].sort((a, b) => KANJI_LEVELS.indexOf(a.level) - KANJI_LEVELS.indexOf(b.level) || a.sequence - b.sequence);

export function firstReading(entry: KanjiEntry) {
  const reading = entry.kunyomi !== "---" ? entry.kunyomi : entry.onyomi;
  return reading.split("、")[0].replaceAll("・", "").replaceAll("-", "").replaceAll(/\s/g, "");
}
