import type { Metadata } from "next";
import { RecognitionDiagnostics } from "@/components/handwriting/recognition-diagnostics";

export const metadata: Metadata = {
  title: "Handwriting Diagnostics",
  robots: { index: false, follow: false },
};

export default function DiagnosticsPage() {
  return <RecognitionDiagnostics />;
}
