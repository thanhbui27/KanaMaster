import { getKanaRows, type KanaCategory, type KanaEntry, type KanaScript } from "@/data/kana";

export type LearnLesson = {
  id: string;
  number: number;
  script: KanaScript;
  category: KanaCategory;
  row: string;
  rowLabel: string;
  title: string;
  description: string;
  kana: KanaEntry[];
  supportsWriting: boolean;
};

const categoryDescriptions: Record<KanaCategory, string> = {
  basic: "The core gojūon characters used in everyday Japanese.",
  dakuten: "Voiced and semi-voiced sounds marked with dakuten or handakuten.",
  yoon: "Contracted sounds made with small ya, yu and yo.",
  "small-tsu": "Use small tsu to double the following consonant, as in kitte and gakkou.",
  "long-vowel": "Use the long vowel mark in Katakana words such as keeki and koohii.",
};

function buildScriptLessons(script: KanaScript): LearnLesson[] {
  const lessons: LearnLesson[] = [];
  const categories: KanaCategory[] = script === "katakana"
    ? ["basic", "dakuten", "yoon", "small-tsu", "long-vowel"]
    : ["basic", "dakuten", "yoon", "small-tsu"];

  categories.forEach((category) => {
    const rows = getKanaRows(script, [category]);
    rows.forEach((row, index) => {
      const kana = row.kana;
      const categoryIndex = index + 1;
      const id = category === "basic" ? `${script}-${categoryIndex}` : `${script}-${category}-${categoryIndex}`;
      lessons.push({
        id,
        number: lessons.length + 1,
        script,
        category,
        row: row.row,
        rowLabel: row.label,
        title: `${script === "hiragana" ? "Hiragana" : "Katakana"} · ${row.label}`,
        description: categoryDescriptions[category],
        kana,
        supportsWriting: kana.every((item) => typeof item.strokeCount === "number"),
      });
    });
  });
  return lessons;
}

export const LEARN_LESSONS = [...buildScriptLessons("hiragana"), ...buildScriptLessons("katakana")];

export function getLearnLesson(id: string) {
  return LEARN_LESSONS.find((lesson) => lesson.id === id) ?? null;
}

export function getLessonsForScript(script: KanaScript) {
  return LEARN_LESSONS.filter((lesson) => lesson.script === script);
}

export function isLessonUnlocked(completedLessonIds: Set<string>, lessonIndex: number) {
  const lesson = LEARN_LESSONS[lessonIndex];
  if (!lesson) return false;
  return LEARN_LESSONS.slice(0, lessonIndex)
    .filter((item) => item.script === lesson.script)
    .every((item) => completedLessonIds.has(item.id));
}

export function countCompletedKana(completedLessonIds: Set<string>, script: KanaScript) {
  return LEARN_LESSONS
    .filter((lesson) => lesson.script === script && completedLessonIds.has(lesson.id))
    .reduce((sum, lesson) => sum + lesson.kana.length, 0);
}
