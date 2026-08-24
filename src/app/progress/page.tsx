import { ProgressPage } from "@/components/progress-page";
import type { KanaScript } from "@/data/kana";

export default async function ProgressRoute({ searchParams }: { searchParams: Promise<{ script?: string }> }) {
  const { script } = await searchParams;
  return <ProgressPage initialScript={(script === "katakana" ? "katakana" : "hiragana") as KanaScript} />;
}
