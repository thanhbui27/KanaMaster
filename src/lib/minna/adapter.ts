import type { Block, Exercise, ExercisePart, Lesson, RawLesson, Section, Vocabulary } from "./types";

export const cleanText = (value: string) => value.replace(/[\u200b-\u200d\ufeff\u00ad]/g, "").replace(/[\t\r\n\u00a0 ]+/g, " ").trim();

export function blockText(block: Block): string {
  if (block.type === "text" || block.type === "heading") return block.text;
  if (block.type === "table") return block.rows.map(row => row.map(c => c.text).join("　")).join("\n");
  if (block.type === "list") return block.items.map(items => items.map(blockText).join("\n")).join("\n");
  return "";
}

export function parseVocabulary(sections: Section[], lesson: number): Vocabulary[] {
  const words: Vocabulary[] = [];
  for (const section of sections) for (const block of section.blocks) {
    if (block.type !== "table") continue;
    const header = block.rows.findIndex(row => row.some(c => /kanji/i.test(c.text)) && row.some(c => /nghĩa/i.test(c.text)));
    if (header < 0) continue;
    const headings = block.rows[header].map(c => cleanText(c.text).toLowerCase());
    const kanjiIndex = headings.findIndex(h => h.includes("kanji"));
    const meaningIndex = headings.findIndex(h => h.includes("nghĩa"));
    const kanaIndex = headings.findIndex(h => /hiragana|katakana|từ vựng/.test(h));
    if (kanaIndex < 0) continue;
    for (const row of block.rows.slice(header + 1)) {
      const kana = cleanText(row[kanaIndex]?.text ?? "");
      const meaning = cleanText(row[meaningIndex]?.text ?? "");
      if (!kana || !meaning) continue;
      words.push({ id: `${lesson}-word-${words.length + 1}`, kana, kanji: cleanText(row[kanjiIndex]?.text ?? ""), meaning });
    }
  }
  return words;
}

// Preserve all source text. Recognize only explicit gaps and bracketed alternatives.
export function exerciseParts(question: string): ExercisePart[] {
  const parts: ExercisePart[] = [];
  const pattern = /[（(［\[｛{「]([^（）()［］\[\]｛｝{}「」]*?)[）)］\]｝}」]|[_＿]{2,}/g;
  let cursor = 0;
  let field = 0;
  for (const match of question.matchAll(pattern)) {
    const inner = match[1];
    let options: string[] | undefined;
    let prefix = "";
    let suffix = "";
    let isInput = inner === undefined || /^[\s_＿]*$/.test(inner);
    if (inner !== undefined && /[、,，]/.test(inner) && !/[。！？!?]/.test(inner) && !/[→…]/.test(inner)) {
      const candidates = [...new Set(inner.split(/[、,，]/).map(cleanText).filter(Boolean))];
      if (candidates.length >= 2 && candidates.length <= 8) { options = candidates; isInput = true; }
    }
    if (!isInput && inner !== undefined && /^\s*a[.．]/i.test(inner) && /\s+b[.．]/i.test(inner)) {
      const candidates = inner.split(/\s+(?=[a-z][.．])/i).map(cleanText).filter(Boolean);
      if (candidates.length >= 2 && candidates.length <= 8) { options = candidates; isInput = true; }
    }
    if (!isInput && inner !== undefined) {
      const transform = inner.match(/^([\s\S]*?(?:→|…|・|\.{3}))[\s_＿]*$/);
      if (transform) { prefix = `${match[0][0]}${transform[1]} `; suffix = match[0].slice(-1); isInput = true; }
    }
    if (!isInput) continue;
    if (match.index! > cursor) parts.push({ type: "text", text: question.slice(cursor, match.index) });
    if (prefix) parts.push({ type: "text", text: prefix });
    parts.push({ type: "input", id: `field-${++field}`, ...(options ? { options } : {}) });
    if (suffix) parts.push({ type: "text", text: suffix });
    cursor = match.index! + match[0].length;
  }
  if (cursor < question.length) parts.push({ type: "text", text: question.slice(cursor) });
  return parts;
}

export function parseExercises(section: Section, lesson: number): Exercise[] {
  const exercises: Exercise[] = [];
  let group = 1;
  let context = "";
  let question = "";
  const flush = () => {
    if (!question.trim()) return;
    const parts = exerciseParts(question);
    const fields = parts.filter(p => p.type === "input");
    if (!fields.length) parts.push({ type: "input", id: "field-1" });
    exercises.push({ id: `${lesson}-${section.id}-exercise-${exercises.length + 1}`, sectionId: section.id, group,
      question, context, parts, manualCheck: true,
      type: fields.some(p => p.type === "input" && p.options) ? "multiple-choice" : !fields.length ? "short-answer" : /[_＿]{4,}/.test(question) ? "sentence-completion" : "fill-blank" });
    question = "";
  };
  for (const block of section.blocks) {
    const text = blockText(block).trim();
    if (!text) continue;
    const normalized = text.normalize("NFKC");
    const groupMatch = normalized.match(/^(\d+)\s*[.．]\s*(?:例|$)/);
    if (groupMatch || /^例\s*\d*[:：]/.test(normalized)) {
      flush();
      if (groupMatch) { group = Number(groupMatch[1]); context = text; }
      else context += `\n${text}`;
    } else if (/^\d+\s*[)）.．、]/.test(normalized)) {
      flush(); question = text;
    } else if (question) question += `\n${text}`;
    else context += `\n${text}`;
  }
  flush();
  return exercises;
}

export function normalizeLesson(raw: RawLesson): Lesson {
  const vocabularySections = raw.sections.filter(s => s.kind === "vocabulary");
  const practiceSections = raw.sections.filter(s => s.kind === "practice");
  return { id: raw.lesson, title: raw.title, sourceUrl: raw.sourceUrl,
    vocabulary: parseVocabulary(vocabularySections, raw.lesson), vocabularySections,
    grammar: raw.sections.filter(s => s.kind !== "vocabulary" && s.kind !== "practice"),
    practiceSections, exercises: practiceSections.flatMap(s => parseExercises(s, raw.lesson)) };
}
