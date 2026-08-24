import { notFound } from "next/navigation";
import { TestRunner } from "@/components/tests/test-runner";
import type { KanaScript } from "@/data/kana";
import type { TestKind } from "@/lib/test-settings";

const scripts: KanaScript[] = ["hiragana", "katakana"];
type RoutedTestKind = Exclude<TestKind, "handwriting">;
const kinds: RoutedTestKind[] = ["character", "word", "phrase", "review"];

export function generateStaticParams() {
  return scripts.flatMap((script) => kinds.map((kind) => ({ script, kind })));
}

export default async function TestPage({ params }: { params: Promise<{ script: string; kind: string }> }) {
  const { script, kind } = await params;
  if (!scripts.includes(script as KanaScript) || !kinds.includes(kind as RoutedTestKind)) notFound();
  return <TestRunner script={script as KanaScript} kind={kind as RoutedTestKind} />;
}
