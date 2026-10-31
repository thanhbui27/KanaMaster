import radicalLists from "@/data/kanji/radicals.json";

export const KANJI_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;
export type KanjiLevel = (typeof KANJI_LEVELS)[number];

export type KanjiEntry = {
  id: string;
  level: KanjiLevel;
  chapter: number;
  order: number;
  sequence: number;
  kanji: string;
  radical: string;
  radicalNumber: number;
  hanViet: string;
  meaning: string;
  meaningLanguage: "vi" | "en";
  kunyomi: string;
  onyomi: string;
  mnemonicText: string[];
  strokes: number | null;
  exampleWord: string;
  exampleReading: string;
  exampleMeaningEnglish: string;
};

export const kanjiRadicals = radicalLists;
