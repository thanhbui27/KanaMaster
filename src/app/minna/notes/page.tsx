import type { Metadata } from "next";
import { StudyNotes } from "@/components/minna/study-notes";
import "./notes.css";

export const metadata: Metadata = { title: "Lưu ý học tiếng Nhật · Nhật – Trung – Việt", description: "Số đếm, giờ, khoảng thời gian, trợ số từ và biến đổi động từ. Có kana, romaji, pinyin và ví dụ tiếng Việt." };
export default function NotesPage() { return <StudyNotes />; }
