import { filterKanaByScope, getKanaEntriesInText, getKanaIdsInText, type KanaScript } from "@/data/kana";
import { PHRASES_BY_SCRIPT, WORDS_BY_SCRIPT } from "@/data/test-content";
import type { TrackProgress } from "@/lib/progress-storage";
import type { TestKind, TestSettings } from "@/lib/test-settings";
import { buildRandomSession, limitSession } from "@/lib/test-randomization";

export type TestQuestion = {
  id: string;
  prompt: string;
  answer: string;
  acceptedAnswers: string[];
  kanaIds: string[];
  direction: "kana-to-romaji" | "romaji-to-kana";
};

function smartReviewOrder(questions: TestQuestion[], track?: TrackProgress) {
  const now = Date.now();
  return questions
    .map((question) => {
      const stat = track?.kana[question.kanaIds[0]];
      const attempts = stat ? stat.correct + stat.wrong : 0;
      const errorRate = attempts > 0 && stat ? stat.wrong / attempts : 0;
      const daysSinceReview = stat?.lastReviewedAt ? Math.max(0, (now - new Date(stat.lastReviewedAt).getTime()) / 86_400_000) : 14;
      const newBoost = !stat?.learnedAt ? 2 : 0;
      const weight = Math.max(0.35, 1 + errorRate * 5 + Math.min(3, daysSinceReview / 7) + newBoost - (stat?.correctStreak ?? 0) * 0.12);
      return { question, key: Math.pow(Math.random(), 1 / weight) };
    })
    .sort((a, b) => b.key - a.key)
    .map(({ question }) => question);
}

export function buildTestQuestions(script: KanaScript, kind: Exclude<TestKind, "handwriting">, settings: TestSettings, track?: TrackProgress) {
  if (kind === "character" || kind === "review") {
    const kana = filterKanaByScope(script, settings.categories, settings.rows);
    const questions = kana.map<TestQuestion>((item, index) => {
      const requestedDirection = kind === "review" ? "kana-to-romaji" : settings.direction;
      const direction = requestedDirection === "random"
        ? (index % 2 === Math.floor(Math.random() * 2) ? "kana-to-romaji" : "romaji-to-kana")
        : requestedDirection;
      const matchingReadings = kana.filter((candidate) => candidate.romaji === item.romaji);
      return direction === "romaji-to-kana"
        ? { id: `${script}:reverse:${item.romaji}`, prompt: item.romaji, answer: matchingReadings.map((candidate) => candidate.character).join(" / "), acceptedAnswers: matchingReadings.map((candidate) => candidate.character), kanaIds: matchingReadings.map((candidate) => candidate.id), direction }
        : { id: `${item.id}:forward`, prompt: item.character, answer: item.romaji, acceptedAnswers: [item.romaji, ...item.aliases], kanaIds: [item.id], direction };
    });
    const uniqueQuestions = [...new Map(questions.map((question) => [question.id, question])).values()];
    return kind === "review"
      ? limitSession(smartReviewOrder(uniqueQuestions, track), settings.questionCount)
      : buildRandomSession(uniqueQuestions, { limit: settings.questionCount });
  }

  const source = kind === "word" ? WORDS_BY_SCRIPT[script] : PHRASES_BY_SCRIPT[script];
  const allowedIds = new Set(filterKanaByScope(script, settings.categories, settings.rows).map((kana) => kana.id));
  const filtered = source.filter((item) => {
    if (settings.difficulty !== "all" && item.difficulty !== settings.difficulty) return false;
    const parsed = getKanaEntriesInText(item.text, script);
    return parsed.complete && parsed.entries.length > 0 && parsed.entries.every((kana) => allowedIds.has(kana.id));
  });
  const questions = filtered.map<TestQuestion>((item) => ({
    id: item.id,
    prompt: item.text,
    answer: item.romaji,
    acceptedAnswers: [item.romaji],
    kanaIds: getKanaIdsInText(item.text, script),
    direction: "kana-to-romaji",
  }));
  return buildRandomSession(questions, { limit: settings.questionCount });
}

export function normalizeTestAnswer(value: string) {
  return value.normalize("NFKC").trim().toLowerCase().replace(/[\s'’_-]+/g, "");
}
