import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLesson, lessonIds } from "@/lib/minna/server";
import { LessonDetail } from "@/components/minna/lesson-detail";
type Props = { params: Promise<{ lessonId: string }> };
export function generateStaticParams() { return lessonIds().map(id => ({ lessonId: String(id) })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { lessonId } = await params; const lesson = getLesson(Number(lessonId)); return { title: lesson ? `Minna · Bài ${lesson.id}` : "Không tìm thấy bài học" }; }
export default async function MinnaLessonPage({ params }: Props) {
  const { lessonId } = await params;
  if (!/^\d+$/.test(lessonId)) notFound();
  const lesson = getLesson(Number(lessonId));
  if (!lesson) notFound();
  const ids = lessonIds(); const index = ids.indexOf(lesson.id);
  return <LessonDetail key={lesson.id} lesson={lesson} previous={ids[index - 1] ?? null} next={ids[index + 1] ?? null} />;
}
