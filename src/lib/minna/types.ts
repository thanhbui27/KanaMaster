export type Ruby = { text: string; readings: string[] };
export type Media = { kind: string; url: string; alt: string };
export type Block =
  | { type: "text" | "heading"; text: string; level?: number }
  | { type: "table"; rows: { text: string; rowSpan: string; colSpan: string }[][] }
  | { type: "list"; ordered: boolean; items: Block[][] }
  | { type: "media"; kind: string; url: string; alt: string };
export type Section = { id: string; title: string; kind: string; blocks: Block[]; text: string; ruby: Ruby[]; media: Media[]; links: { text: string; url: string }[] };
export type RawLesson = { lesson: number; title: string; sourceUrl: string; sections: Section[] };
export type Vocabulary = { id: string; kana: string; kanji: string; meaning: string };
export type ExercisePart = { type: "text"; text: string } | { type: "input"; id: string; options?: string[] };
export type ExerciseSolution = { exerciseId: string; question: string; context: string; status: "reference" | "sample" | "source-issue"; answers: string[][]; explanation: string };
export type SolutionFile = { lesson: number; sourceUrl: string; provenance: string; solutions: ExerciseSolution[] };
export type Exercise = { id: string; sectionId: string; group: number; question: string; context: string; parts: ExercisePart[]; type: "fill-blank" | "multiple-choice" | "short-answer" | "sentence-completion"; manualCheck: boolean; answer?: string[]; solution?: ExerciseSolution };
export type Lesson = { id: number; title: string; sourceUrl: string; vocabulary: Vocabulary[]; vocabularySections: Section[]; grammar: Section[]; practiceSections: Section[]; exercises: Exercise[] };
export type LessonSummary = { id: number; title: string; vocabulary: number; grammar: number; exercises: number; topics: string[]; available: boolean };
export type QuizMode = "ja-vi" | "vi-ja" | "kana-kanji" | "mixed";
export type QuizQuestion = { id: string; word: Vocabulary; mode: Exclude<QuizMode, "mixed">; prompt: string; options: string[]; answer: string };
export type MinnaProgress = {
  learned: string[]; review: string[]; grammar: string[]; completed: string[];
  answers: Record<string, string>; notes: Record<string, string>;
  quiz: { attempts: number; bestCorrect: number; bestTotal: number; lastCorrect: number; lastTotal: number; wrong: string[] };
};
