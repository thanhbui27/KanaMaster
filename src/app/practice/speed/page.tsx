import { QuickPractice } from "@/components/practice/quick-practice";
import type { KanaScript } from "@/data/kana";

export default async function SpeedPage({ searchParams }: { searchParams: Promise<{ script?: string }> }) {
  const { script } = await searchParams;
  return <QuickPractice mode="speed" initialScript={(script === "katakana" ? "katakana" : "hiragana") as KanaScript} />;
}
