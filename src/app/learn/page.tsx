import { LearnPageClient } from "@/components/learn/learn-page-client";
import type { KanaScript } from "@/data/kana";

export default async function LearnPage({ searchParams }: { searchParams: Promise<{ script?: string }> }) {
  const { script } = await searchParams;
  const initialScript: KanaScript = script === "katakana" ? "katakana" : "hiragana";
  return <LearnPageClient initialScript={initialScript} />;
}
