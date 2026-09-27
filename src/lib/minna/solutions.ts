import type { Lesson, SolutionFile } from "./types";

// Only normalize typography, never replace Japanese words or particles.
export function normalizeAnswer(value: string): string {
  return value.normalize("NFKC").trim().replace(/^[a-z][.]\s*/i, "")
    .replace(/[\s\u200b-\u200d\ufeff\u00ad]/g, "").replace(/[。．.!！?？]+$/, "");
}

export function matchesReference(value: string, alternatives: string[]): boolean {
  const normalized = normalizeAnswer(value);
  return !!normalized && alternatives.some(answer => normalizeAnswer(answer) === normalized);
}

export function attachSolutions(lesson: Lesson, file: SolutionFile): Lesson {
  if (file.lesson !== lesson.id || file.sourceUrl !== lesson.sourceUrl || file.solutions.length !== lesson.exercises.length) {
    throw new Error(`Solution inventory mismatch for lesson ${lesson.id}`);
  }
  const entries = new Map(file.solutions.map(solution => [solution.exerciseId, solution]));
  if (entries.size !== file.solutions.length) throw new Error(`Duplicate solutions for lesson ${lesson.id}`);
  return { ...lesson, exercises: lesson.exercises.map(exercise => {
    const solution = entries.get(exercise.id);
    const fields = exercise.parts.filter(part => part.type === "input");
    // Refuse to publish a key against a changed question/context or different gaps.
    if (!solution || solution.question !== exercise.question || solution.context !== exercise.context || !solution.explanation.trim()
      || !["reference", "sample", "source-issue"].includes(solution.status)
      || (solution.status === "source-issue" ? solution.answers.length !== 0
        : solution.answers.length !== fields.length || solution.answers.some(answers => !answers.length || answers.some(a => !a.trim())))) {
      throw new Error(`Stale or incomplete solution: ${exercise.id}`);
    }
    for (const [index, field] of fields.entries()) {
      if (solution.status !== "source-issue" && field.options
        && !solution.answers[index].every(answer => field.options!.some(option => matchesReference(option, [answer])))) {
        throw new Error(`Solution not in choices: ${exercise.id}, field ${index + 1}`);
      }
    }
    return { ...exercise, solution };
  }) };
}

export function cleanSourceDisplay(text: string): string {
  // Word's conditional VML includes binary payloads; it is not learning content.
  return text.replace(/\[if gte vml[^]*?\[if !vml\]\s*\[endif\]/gi, " [Đã ẩn mã Word lỗi trong nguồn] ");
}
