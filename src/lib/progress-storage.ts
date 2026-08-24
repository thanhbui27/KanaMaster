import type { KanaScript } from "@/data/kana";

export const PROGRESS_STORAGE_KEY = "kanamaster.progress.v1";

export type LearnLessonProgress = { completedAt: string | null };

export type WritingKanaProgress = {
  writingAttempts: number;
  writingCorrect: number;
  writingAccuracy: number;
  lastWritingAttempt: string | null;
};

export type KanaAnswerProgress = {
  correct: number;
  wrong: number;
  correctStreak: number;
  lastReviewedAt: string | null;
  learnedAt: string | null;
};

export type TrackProgress = {
  totalTests: number;
  correctAnswers: number;
  wrongAnswers: number;
  bestScore: number;
  currentStreak: number;
  reviewsDone: number;
  dailyReviewGoal: number;
  lastReviewDate: string | null;
  kana: Record<string, KanaAnswerProgress>;
};

export type LearningProgress = {
  streak: number;
  hiraganaMastered: number;
  katakanaMastered: number;
  reviewsDone: number;
  dailyReviewGoal: number;
  lastOpenedAt: string;
  lessonProgress: Record<string, LearnLessonProgress>;
  writingProgress: Record<string, WritingKanaProgress>;
  tracks: Record<KanaScript, TrackProgress>;
};

function emptyTrack(): TrackProgress {
  return { totalTests: 0, correctAnswers: 0, wrongAnswers: 0, bestScore: 0, currentStreak: 0, reviewsDone: 0, dailyReviewGoal: 12, lastReviewDate: null, kana: {} };
}

export const demoProgress: LearningProgress = {
  streak: 0,
  hiraganaMastered: 0,
  katakanaMastered: 0,
  reviewsDone: 0,
  dailyReviewGoal: 12,
  lastOpenedAt: new Date(0).toISOString(),
  lessonProgress: {},
  writingProgress: {},
  tracks: { hiragana: emptyTrack(), katakana: emptyTrack() },
};

function mergeTrack(value?: Partial<TrackProgress>): TrackProgress {
  return { ...emptyTrack(), ...value, kana: typeof value?.kana === "object" && value.kana ? value.kana : {} };
}

export function readProgress(): LearningProgress {
  if (typeof window === "undefined") return demoProgress;
  try {
    const saved = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!saved) return demoProgress;
    const parsed = JSON.parse(saved) as Partial<LearningProgress>;
    return {
      ...demoProgress,
      ...parsed,
      lessonProgress: typeof parsed.lessonProgress === "object" && parsed.lessonProgress ? parsed.lessonProgress : {},
      writingProgress: typeof parsed.writingProgress === "object" && parsed.writingProgress ? parsed.writingProgress : {},
      tracks: { hiragana: mergeTrack(parsed.tracks?.hiragana), katakana: mergeTrack(parsed.tracks?.katakana) },
    };
  } catch {
    return demoProgress;
  }
}

export function writeProgress(progress: LearningProgress) {
  if (typeof window !== "undefined") window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
}

export function recordWritingAttempt(kanaId: string, correct: boolean) {
  const progress = readProgress();
  const current = progress.writingProgress[kanaId] ?? { writingAttempts: 0, writingCorrect: 0, writingAccuracy: 0, lastWritingAttempt: null };
  const writingAttempts = current.writingAttempts + 1;
  const writingCorrect = current.writingCorrect + (correct ? 1 : 0);
  const next: LearningProgress = {
    ...progress,
    writingProgress: { ...progress.writingProgress, [kanaId]: { writingAttempts, writingCorrect, writingAccuracy: writingCorrect / writingAttempts, lastWritingAttempt: new Date().toISOString() } },
  };
  writeProgress(next);
  return next.writingProgress[kanaId];
}

function emptyKanaProgress(): KanaAnswerProgress {
  return { correct: 0, wrong: 0, correctStreak: 0, lastReviewedAt: null, learnedAt: null };
}

export function recordLearnLessonComplete(lessonId: string, kanaIds: string[] = []) {
  const progress = readProgress();
  const completedAt = progress.lessonProgress[lessonId]?.completedAt ?? new Date().toISOString();
  const script: KanaScript = lessonId.startsWith("katakana-") ? "katakana" : "hiragana";
  const track = progress.tracks[script];
  const kana = { ...track.kana };
  kanaIds.forEach((kanaId) => {
    const current = kana[kanaId] ?? emptyKanaProgress();
    kana[kanaId] = { ...current, learnedAt: current.learnedAt ?? completedAt };
  });
  const next: LearningProgress = {
    ...progress,
    lessonProgress: { ...progress.lessonProgress, [lessonId]: { completedAt } },
    tracks: { ...progress.tracks, [script]: { ...track, kana } },
  };
  writeProgress(next);
  return next;
}

export function recordQuestionResult(script: KanaScript, kanaIds: string[], correct: boolean) {
  const progress = readProgress();
  const track = progress.tracks[script];
  const kana = { ...track.kana };
  const reviewedAt = new Date().toISOString();
  [...new Set(kanaIds)].forEach((kanaId) => {
    const current = kana[kanaId] ?? emptyKanaProgress();
    kana[kanaId] = {
      ...current,
      correct: current.correct + (correct ? 1 : 0),
      wrong: current.wrong + (correct ? 0 : 1),
      correctStreak: correct ? current.correctStreak + 1 : 0,
      lastReviewedAt: reviewedAt,
      learnedAt: current.learnedAt ?? reviewedAt,
    };
  });
  const next: LearningProgress = {
    ...progress,
    tracks: {
      ...progress.tracks,
      [script]: {
        ...track,
        correctAnswers: track.correctAnswers + (correct ? 1 : 0),
        wrongAnswers: track.wrongAnswers + (correct ? 0 : 1),
        currentStreak: correct ? track.currentStreak + 1 : 0,
        kana,
      },
    },
  };
  writeProgress(next);
  return next;
}

export function recordTestComplete(script: KanaScript, correct: number, total: number) {
  const progress = readProgress();
  const track = progress.tracks[script];
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const next: LearningProgress = {
    ...progress,
    tracks: { ...progress.tracks, [script]: { ...track, totalTests: track.totalTests + 1, bestScore: Math.max(track.bestScore, score) } },
  };
  writeProgress(next);
  return next;
}

export function recordReviewComplete(script: KanaScript) {
  const progress = readProgress();
  const track = progress.tracks[script];
  const today = new Date().toISOString().slice(0, 10);
  const reviewsDone = track.lastReviewDate === today ? track.reviewsDone + 1 : 1;
  const next: LearningProgress = {
    ...progress,
    reviewsDone: progress.reviewsDone + 1,
    tracks: { ...progress.tracks, [script]: { ...track, reviewsDone, lastReviewDate: today } },
  };
  writeProgress(next);
  return next;
}

export function getTrackAccuracy(track: TrackProgress) {
  const total = track.correctAnswers + track.wrongAnswers;
  return total === 0 ? 0 : Math.round((track.correctAnswers / total) * 100);
}

export function getWeakKanaIds(track: TrackProgress, limit = 5) {
  return Object.entries(track.kana)
    .filter(([, value]) => value.wrong > 0)
    .sort(([, a], [, b]) => {
      const aRate = a.wrong / (a.correct + a.wrong);
      const bRate = b.wrong / (b.correct + b.wrong);
      return bRate - aRate || b.wrong - a.wrong;
    })
    .slice(0, limit)
    .map(([id]) => id);
}
