import { HIRAGANA_WRITING_KANA, KATAKANA_WRITING_KANA, type WritingKana } from "@/data/writing-kana";

export type LearnLesson = {
  id: string;
  number: number;
  script: "hiragana" | "katakana";
  title: string;
  kana: WritingKana[];
};

function chunkLessons(script: LearnLesson["script"], items: WritingKana[], offset: number): LearnLesson[] {
  const scriptLabel = script === "hiragana" ? "Hiragana" : "Katakana";
  const lessons: LearnLesson[] = [];
  for (let index = 0; index < items.length; index += 5) {
    const number = offset + lessons.length + 1;
    lessons.push({
      id: `${script}-${lessons.length + 1}`,
      number,
      script,
      title: `${scriptLabel} ${lessons.length + 1}`,
      kana: items.slice(index, index + 5),
    });
  }
  return lessons;
}

const hiraganaLessons = chunkLessons("hiragana", HIRAGANA_WRITING_KANA, 0);
const katakanaLessons = chunkLessons("katakana", KATAKANA_WRITING_KANA, hiraganaLessons.length);

export const LEARN_LESSONS = [...hiraganaLessons, ...katakanaLessons];

export function getLearnLesson(id: string) {
  return LEARN_LESSONS.find((lesson) => lesson.id === id) ?? null;
}

export function isLessonUnlocked(completedLessonIds: Set<string>, lessonIndex: number) {
  return lessonIndex === 0 || LEARN_LESSONS.slice(0, lessonIndex).every((lesson) => completedLessonIds.has(lesson.id));
}

export function countCompletedKana(completedLessonIds: Set<string>, script: LearnLesson["script"]) {
  return LEARN_LESSONS
    .filter((lesson) => lesson.script === script && completedLessonIds.has(lesson.id))
    .reduce((sum, lesson) => sum + lesson.kana.length, 0);
}
