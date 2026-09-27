import type { QuizMode, QuizQuestion, Vocabulary } from "./types";

export function shuffled<T>(items: T[], random = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}
const key = (s: string) => s.normalize("NFKC").replace(/\s+/g, " ").trim().toLocaleLowerCase();
export const hasKanji = (word: Vocabulary) => /[\u3400-\u9fff]/.test(word.kanji);
const promptFor = (w: Vocabulary, mode: Exclude<QuizMode, "mixed">) => mode === "vi-ja" ? w.meaning : mode === "kana-kanji" ? w.kana : (w.kanji || w.kana);
const answerFor = (w: Vocabulary, mode: Exclude<QuizMode, "mixed">) => mode === "ja-vi" ? w.meaning : mode === "kana-kanji" ? w.kanji : w.kana;

export function createQuiz(words: Vocabulary[], mode: QuizMode, count: number, focusIds?: string[], random = Math.random): QuizQuestion[] {
  const focus = focusIds ? new Set(focusIds) : null;
  const modes: Exclude<QuizMode, "mixed">[] = mode === "mixed" ? ["ja-vi", "vi-ja", "kana-kanji"] : [mode];
  const questions: QuizQuestion[] = [];
  for (const word of shuffled(words.filter(w => !focus || focus.has(w.id)), random)) {
    for (const kind of shuffled(modes, random)) {
      if (kind === "kana-kanji" && !hasKanji(word)) continue;
      const prompt = promptFor(word, kind);
      const answer = answerFor(word, kind);
      // Homophones or repeated meanings must not create several valid answers.
      const ambiguous = words.some(w => w.id !== word.id && (kind !== "kana-kanji" || hasKanji(w)) && key(promptFor(w, kind)) === key(prompt) && key(answerFor(w, kind)) !== key(answer));
      if (ambiguous) continue;
      const seen = new Set([key(answer)]);
      const wrong: string[] = [];
      for (const other of shuffled(words, random)) {
        if (other.id === word.id || (kind === "kana-kanji" && !hasKanji(other))) continue;
        const value = answerFor(other, kind);
        if (seen.has(key(value))) continue;
        seen.add(key(value)); wrong.push(value);
        if (wrong.length === 3) break;
      }
      if (wrong.length < 3) continue;
      questions.push({ id: `${word.id}-${kind}`, word, mode: kind, prompt, answer, options: shuffled([answer, ...wrong], random) });
      break;
    }
    if (questions.length >= count) break;
  }
  return questions;
}
