import { HomeScreen } from "@/components/home-screen";
import { getLessonSummaries } from "@/lib/minna/server";
import "./home.css";

export default function Home() {
  return <HomeScreen minnaLessons={getLessonSummaries()} />;
}
