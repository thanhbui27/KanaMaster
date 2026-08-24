import { getKanaRows, KANA_BY_SCRIPT, type KanaCategory, type KanaScript } from "@/data/kana";
import type { Difficulty } from "@/data/test-content";

export const TEST_SETTINGS_STORAGE_KEY = "kanamaster.test-settings.v1";
export type TestKind = "character" | "word" | "phrase" | "review" | "handwriting";
export type QuestionDirection = "kana-to-romaji" | "romaji-to-kana" | "random";
export type QuestionCount = 10 | 20 | 50 | "unlimited";
export type HandwritingMode = "character" | "word";

export type TestSettings = {
  timerEnabled: boolean;
  secondsPerQuestion: number;
  questionCount: QuestionCount;
  direction: QuestionDirection;
  categories: KanaCategory[];
  rows: string[];
  difficulty: Difficulty | "all";
  handwritingMode: HandwritingMode;
};

type LegacySettings = Partial<TestSettings> & { category?: KanaCategory | "all" };
type SavedSettings = Partial<Record<`${KanaScript}:${TestKind}`, LegacySettings>>;

export const DEFAULT_TEST_SETTINGS: TestSettings = {
  timerEnabled: true,
  secondsPerQuestion: 15,
  questionCount: 10,
  direction: "kana-to-romaji",
  categories: ["basic"],
  rows: [],
  difficulty: "all",
  handwritingMode: "character",
};

function normalize(script: KanaScript, value?: LegacySettings): TestSettings {
  const seconds = Number(value?.secondsPerQuestion);
  const validCounts: QuestionCount[] = [10, 20, 50, "unlimited"];
  const validDirections: QuestionDirection[] = ["kana-to-romaji", "romaji-to-kana", "random"];
  const availableCategories = [...new Set(KANA_BY_SCRIPT[script].map((kana) => kana.category))];
  const validDifficulties: TestSettings["difficulty"][] = ["easy", "medium", "hard", "all"];
  const legacyCategories = value?.category === "all"
    ? availableCategories
    : value?.category && availableCategories.includes(value.category) ? [value.category] : null;
  const categories = Array.isArray(value?.categories)
    ? value.categories.filter((category): category is KanaCategory => availableCategories.includes(category))
    : legacyCategories ?? DEFAULT_TEST_SETTINGS.categories;
  const availableRows = getKanaRows(script, categories).map((row) => row.key);
  const rows = Array.isArray(value?.rows)
    ? value.rows.filter((row) => availableRows.includes(row))
    : availableRows;
  return {
    timerEnabled: typeof value?.timerEnabled === "boolean" ? value.timerEnabled : DEFAULT_TEST_SETTINGS.timerEnabled,
    secondsPerQuestion: Number.isFinite(seconds) ? Math.min(300, Math.max(5, Math.round(seconds))) : DEFAULT_TEST_SETTINGS.secondsPerQuestion,
    questionCount: validCounts.includes(value?.questionCount as QuestionCount) ? value?.questionCount as QuestionCount : DEFAULT_TEST_SETTINGS.questionCount,
    direction: validDirections.includes(value?.direction as QuestionDirection) ? value?.direction as QuestionDirection : DEFAULT_TEST_SETTINGS.direction,
    categories,
    rows,
    difficulty: validDifficulties.includes(value?.difficulty as TestSettings["difficulty"]) ? value?.difficulty as TestSettings["difficulty"] : DEFAULT_TEST_SETTINGS.difficulty,
    handwritingMode: value?.handwritingMode === "word" ? "word" : "character",
  };
}

function readAll(): SavedSettings {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(TEST_SETTINGS_STORAGE_KEY) ?? "{}") as SavedSettings;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function readTestSettings(script: KanaScript, kind: TestKind) {
  return normalize(script, readAll()[`${script}:${kind}`]);
}

export function writeTestSettings(script: KanaScript, kind: TestKind, settings: TestSettings) {
  if (typeof window === "undefined") return;
  const all = readAll();
  all[`${script}:${kind}`] = normalize(script, settings);
  window.localStorage.setItem(TEST_SETTINGS_STORAGE_KEY, JSON.stringify(all));
}
