import type { Metadata } from "next";
import { WritingPractice } from "@/components/handwriting/writing-practice";

export const metadata: Metadata = {
  title: "Handwriting Practice",
  description: "Recall and handwrite Japanese kana with on-device recognition.",
};

export default async function HandwritingPage({ searchParams }: { searchParams: Promise<{ kana?: string }> }) {
  const { kana } = await searchParams;
  return <WritingPractice initialKana={kana} />;
}
