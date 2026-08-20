import type { Metadata } from "next";
import { LessonRunner } from "@/components/learn/lesson-runner";
import { LEARN_LESSONS, getLearnLesson } from "@/lib/learn-lessons";

export const metadata: Metadata = {
  title: "Learn Kana",
  description: "Complete Kana lessons through recognition, typing, and handwriting.",
};

export function generateStaticParams() {
  return LEARN_LESSONS.map((lesson) => ({ lessonId: lesson.id }));
}

export default async function LearnLessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const lesson = getLearnLesson(lessonId) ?? LEARN_LESSONS[0];
  return <LessonRunner lesson={lesson} />;
}
