"use client";

import { useEffect, useState } from "react";
import { WRITING_CHARACTERS, WRITING_KANA } from "@/data/writing-kana";
import { RECOGNITION_FIXTURES } from "@/lib/handwriting/regression-fixtures";
import { handwritingRecognizer, MIN_RECOGNITION_CONFIDENCE } from "@/lib/handwriting/template-recognizer";

type DiagnosticResult = {
  name: string;
  expected: string | null;
  detected: string | null;
  confidence: number;
  passed: boolean;
};

export function RecognitionDiagnostics() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const frame = requestAnimationFrame(async () => {
      const next: DiagnosticResult[] = [];
      for (const fixture of RECOGNITION_FIXTURES) {
        const expectedScript = WRITING_KANA.find((kana) => kana.character === fixture.expected)?.script;
        const allowedCharacters = expectedScript
          ? WRITING_KANA.filter((kana) => kana.script === expectedScript).map((kana) => kana.character)
          : WRITING_CHARACTERS;
        const recognition = await handwritingRecognizer.recognize({
          strokes: fixture.strokes,
          allowedCharacters,
          expectedCharacter: fixture.prompt ?? fixture.expected ?? undefined,
        });
        next.push({
          name: fixture.name,
          expected: fixture.expected,
          detected: recognition.detectedCharacter,
          confidence: recognition.confidence,
          passed: fixture.expected === null
            ? recognition.confidence < MIN_RECOGNITION_CONFIDENCE
            : recognition.detectedCharacter === fixture.expected && recognition.confidence >= MIN_RECOGNITION_CONFIDENCE,
        });
      }
      if (!cancelled) {
        setResults(next);
        setRunning(false);
      }
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, []);

  const passed = results.filter((result) => result.passed).length;

  return (
    <main className="diagnostics-page">
      <p>INTERNAL HANDWRITING REGRESSION</p>
      <h1>{running ? "Running…" : `${passed} / ${results.length} passed`}</h1>
      <div className="diagnostics-grid">
        {results.map((result) => (
          <article className={result.passed ? "passed" : "failed"} key={result.name}>
            <span>{result.name}</span>
            <strong>{result.detected ?? "?"}</strong>
            <small>expected {result.expected ?? "uncertain"} · {Math.round(result.confidence * 100)}%</small>
          </article>
        ))}
      </div>
    </main>
  );
}
