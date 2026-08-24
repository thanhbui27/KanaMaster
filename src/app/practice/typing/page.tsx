import { QuickPractice } from "@/components/practice/quick-practice";
import type { KanaScript } from "@/data/kana";

export default async function TypingPage({ searchParams }: { searchParams: Promise<{ script?: string }> }) {
  const { script } = await searchParams;
  return <QuickPractice mode="typing" initialScript={(script === "katakana" ? "katakana" : "hiragana") as KanaScript} />;
}
