import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";
import { normalizeLesson } from "./adapter";
import { attachSolutions } from "./solutions";
import type { LessonSummary, RawLesson, SolutionFile } from "./types";

const directory = join(process.cwd(), "src/data/minna-riki");
export const lessonIds = () => readdirSync(directory).filter(n => /^lesson-\d+\.json$/.test(n)).map(n => Number(n.match(/\d+/)![0])).sort((a, b) => a - b);
export const getLesson = cache((id: number) => {
  if (!Number.isInteger(id) || !lessonIds().includes(id)) return null;
  const raw = JSON.parse(readFileSync(join(directory, `lesson-${String(id).padStart(2, "0")}.json`), "utf8")) as RawLesson;
  const solutions = JSON.parse(readFileSync(join(process.cwd(), "src/data/minna-solutions", `lesson-${String(id).padStart(2, "0")}.json`), "utf8")) as SolutionFile;
  return attachSolutions(normalizeLesson(raw), solutions);
});
export const getLessonSummaries = cache((): LessonSummary[] => {
  const ids = lessonIds();
  return Array.from({ length: Math.max(50, ...ids) }, (_, i) => {
    const lesson = getLesson(i + 1);
    return lesson ? { id: lesson.id, title: lesson.title, vocabulary: lesson.vocabulary.length, grammar: lesson.grammar.length,
      exercises: lesson.exercises.length, topics: lesson.grammar.map(s => s.title), available: true }
      : { id: i + 1, title: "Chưa có dữ liệu từ nguồn", vocabulary: 0, grammar: 0, exercises: 0, topics: [], available: false };
  });
});
