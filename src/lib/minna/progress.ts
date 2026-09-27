import type { Lesson, MinnaProgress } from "./types";

export const MINNA_STORAGE_KEY = "kanamaster.minna.v1";
export const emptyProgress = (): MinnaProgress => ({ learned: [], review: [], grammar: [], completed: [], answers: {}, notes: {}, quiz: { attempts: 0, bestCorrect: 0, bestTotal: 0, lastCorrect: 0, lastTotal: 0, wrong: [] } });
const strings = (value: unknown): string[] => Array.isArray(value) ? [...new Set(value.filter((v): v is string => typeof v === "string"))] : [];
const dict = (value: unknown): Record<string, string> => value && typeof value === "object" && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).filter(([, v]) => typeof v === "string")) : {};
const num = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
export function decodeProgress(raw: unknown): MinnaProgress {
  if (!raw || typeof raw !== "object") return emptyProgress();
  const value = raw as Partial<MinnaProgress>;
  const q = value.quiz;
  return { learned: strings(value.learned), review: strings(value.review), grammar: strings(value.grammar), completed: strings(value.completed),
    answers: dict(value.answers), notes: dict(value.notes), quiz: { attempts: num(q?.attempts), bestCorrect: Math.min(num(q?.bestCorrect), num(q?.bestTotal)), bestTotal: num(q?.bestTotal), lastCorrect: Math.min(num(q?.lastCorrect), num(q?.lastTotal)), lastTotal: num(q?.lastTotal), wrong: strings(q?.wrong) } };
}
export function progressMetrics(lesson: Pick<Lesson, "vocabulary" | "grammar" | "exercises">, progress: MinnaProgress) {
  const learned = lesson.vocabulary.filter(v => progress.learned.includes(v.id)).length;
  const grammar = lesson.grammar.filter(s => progress.grammar.includes(s.id)).length;
  const practice = lesson.exercises.filter(e => progress.completed.includes(e.id)).length;
  const components = [
    ...(lesson.vocabulary.length ? [learned / lesson.vocabulary.length, progress.quiz.bestTotal ? progress.quiz.bestCorrect / progress.quiz.bestTotal : 0] : []),
    ...(lesson.grammar.length ? [grammar / lesson.grammar.length] : []),
    ...(lesson.exercises.length ? [practice / lesson.exercises.length] : []),
  ];
  return { learned, grammar, practice, overall: components.length ? Math.round(components.reduce((a, b) => a + b, 0) / components.length * 100) : 0 };
}
export function recordQuiz(progress: MinnaProgress, correct: number, total: number, wrong: string[]): MinnaProgress {
  if (!total) return progress;
  const prior = progress.quiz;
  const better = !prior.bestTotal || correct / total > prior.bestCorrect / prior.bestTotal || (correct / total === prior.bestCorrect / prior.bestTotal && total > prior.bestTotal);
  return { ...progress, review: [...new Set([...progress.review, ...wrong])], quiz: { attempts: prior.attempts + 1, bestCorrect: better ? correct : prior.bestCorrect, bestTotal: better ? total : prior.bestTotal, lastCorrect: correct, lastTotal: total, wrong } };
}
