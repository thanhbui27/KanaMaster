export const PROGRESS_STORAGE_KEY = "kanamaster.progress.v1";

export type LearningProgress = {
  streak: number;
  hiraganaMastered: number;
  katakanaMastered: number;
  reviewsDone: number;
  dailyReviewGoal: number;
  lastOpenedAt: string;
  lessonProgress: Record<string, LearnLessonProgress>;
  writingProgress: Record<string, WritingKanaProgress>;
};

export type LearnLessonProgress = {
  completedAt: string | null;
};

export type WritingKanaProgress = {
  writingAttempts: number;
  writingCorrect: number;
  writingAccuracy: number;
  lastWritingAttempt: string | null;
};

export const demoProgress: LearningProgress = {
  streak: 6,
  hiraganaMastered: 27,
  katakanaMastered: 5,
  reviewsDone: 9,
  dailyReviewGoal: 12,
  lastOpenedAt: new Date(0).toISOString(),
  lessonProgress: {},
  writingProgress: {
    "hiragana-ki": {
      writingAttempts: 14,
      writingCorrect: 9,
      writingAccuracy: 9 / 14,
      lastWritingAttempt: null,
    },
  },
};

export function readProgress(): LearningProgress {
  if (typeof window === "undefined") return demoProgress;

  try {
    const saved = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!saved) return demoProgress;
    const parsed = JSON.parse(saved) as Partial<LearningProgress>;
    return {
      ...demoProgress,
      ...parsed,
      lessonProgress: { ...demoProgress.lessonProgress, ...parsed.lessonProgress },
      writingProgress: { ...demoProgress.writingProgress, ...parsed.writingProgress },
    };
  } catch {
    return demoProgress;
  }
}

export function writeProgress(progress: LearningProgress) {
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
}

export function recordWritingAttempt(kanaId: string, correct: boolean) {
  const progress = readProgress();
  const current = progress.writingProgress[kanaId] ?? {
    writingAttempts: 0,
    writingCorrect: 0,
    writingAccuracy: 0,
    lastWritingAttempt: null,
  };
  const writingAttempts = current.writingAttempts + 1;
  const writingCorrect = current.writingCorrect + (correct ? 1 : 0);
  const next: LearningProgress = {
    ...progress,
    writingProgress: {
      ...progress.writingProgress,
      [kanaId]: {
        writingAttempts,
        writingCorrect,
        writingAccuracy: writingCorrect / writingAttempts,
        lastWritingAttempt: new Date().toISOString(),
      },
    },
  };
  writeProgress(next);
  return next.writingProgress[kanaId];
}

export function recordLearnLessonComplete(lessonId: string) {
  const progress = readProgress();
  const next: LearningProgress = {
    ...progress,
    lessonProgress: {
      ...progress.lessonProgress,
      [lessonId]: {
        completedAt: progress.lessonProgress[lessonId]?.completedAt ?? new Date().toISOString(),
      },
    },
  };
  writeProgress(next);
  return next;
}
