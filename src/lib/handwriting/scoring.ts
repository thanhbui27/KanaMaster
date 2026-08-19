import type { RecognitionResult } from "@/types/handwriting";

export type WritingScores = {
  correct: boolean;
  shapeScore: number;
  strokeScore: number;
  writingScore: number;
};

export function calculateWritingScores(
  recognition: RecognitionResult,
  expectedCharacter: string,
  actualStrokeCount: number,
  expectedStrokeCount: number,
): WritingScores {
  const correct = recognition.detectedCharacter === expectedCharacter;
  const expectedConfidence = correct
    ? recognition.confidence
    : recognition.alternatives.find((item) => item.character === expectedCharacter)?.confidence ?? 0;
  const shapeScore = Math.round(expectedConfidence * 100);
  const connectedKi = expectedCharacter === "き" && actualStrokeCount === 3 && expectedStrokeCount === 4;
  const strokeScore = connectedKi
    ? 90
    : Math.max(20, 100 - Math.abs(actualStrokeCount - expectedStrokeCount) * 24);
  const recognitionScore = correct ? 100 : 0;

  // Recognition is the core task. A wrong character can receive partial credit
  // for shape/stroke discipline, but can never look like a passing result.
  const rawScore = Math.round(recognitionScore * 0.5 + shapeScore * 0.3 + strokeScore * 0.2);
  const writingScore = correct ? rawScore : Math.min(rawScore, 49);

  return { correct, shapeScore, strokeScore, writingScore };
}
