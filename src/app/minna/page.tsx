import type { Metadata } from "next";
import { LessonList } from "@/components/minna/lesson-list";
import { getLessonSummaries } from "@/lib/minna/server";
export const metadata: Metadata = { title: "Minna no Nihongo", description: "Học Minna no Nihongo theo bài: từ vựng, flashcard, quiz, ngữ pháp và bài tập." };
export default function MinnaPage() { return <LessonList lessons={getLessonSummaries()} />; }
