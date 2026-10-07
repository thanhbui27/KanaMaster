import { ArrowRight, BookOpen, ChartNoAxesColumnIncreasing, Keyboard, Languages, MessageSquareText, PencilLine, RotateCcw, ScanText, WholeWord } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import Link from "next/link";
import type { KanaScript } from "@/data/kana";

const testModes = [
  { name: "Nhận diện chữ", description: "Kana và Romaji theo nhóm âm.", icon: Languages, path: "character" },
  { name: "Đọc từ", description: "Luyện đọc các từ tiếng Nhật.", icon: WholeWord, path: "word" },
  { name: "Đọc cụm từ", description: "Cụm ngắn với ba mức độ.", icon: MessageSquareText, path: "phrase" },
  { name: "Ôn Kana", description: "Ưu tiên chữ còn hay nhầm.", icon: RotateCcw, path: "review" },
];

const quickModes = [
  { name: "Nhận diện", icon: ScanText, path: "recognition" },
  { name: "Gõ cách đọc", icon: Keyboard, path: "typing" },
];

function TrackPanel({ script }: { script: KanaScript }) {
  const label = script === "hiragana" ? "Hiragana" : "Katakana";
  return (
    <article className={`track-panel ${script}`}>
      <header><span>{script === "hiragana" ? "ひ" : "カ"}</span><div><small>BẢNG CHỮ CÁI</small><h2>{label}</h2></div></header>
      <div className="track-primary-links">
        <Link href={`/learn?script=${script}`}><BookOpen size={17} /> Bài học</Link>
        <Link href={`/progress?script=${script}`}><ChartNoAxesColumnIncreasing size={17} /> Tiến độ</Link>
      </div>
      <div className="track-test-grid">
        {testModes.map(({ name, description, icon: Icon, path }) => (
          <Link href={`/test/${script}/${path}`} key={path}><Icon size={20} /><span><strong>{name}</strong><small>{description}</small></span><ArrowRight size={15} /></Link>
        ))}
      </div>
      <div className="quick-links"><span>Luyện nhanh</span>{quickModes.map(({ name, icon: Icon, path }) => <Link key={path} href={`/practice/${path}?script=${script}`}><Icon size={14} /> {name}</Link>)}</div>
    </article>
  );
}

export default function PracticePage() {
  return (
    <main className="practice-page">
<PageHeading eyebrow="LUYỆN TẬP & KIỂM TRA" title="Một chút luyện tập, nhớ thêm một chút." description="Chọn bảng chữ và cách luyện phù hợp. Kết quả được lưu riêng cho Hiragana và Katakana." />
      <nav className="ui-feature-links" aria-label="Các cách ôn tập"><Link href="/repeat"><RotateCcw size={16} /> Repeat · Ôn theo lịch</Link><Link href="/minna">Từ vựng & quiz Minna</Link><Link href="/practice/speed">Thử thách 30 giây</Link></nav>
      <section className="track-panel-grid"><TrackPanel script="hiragana" /><TrackPanel script="katakana" /></section>
      <section className="featured-writing-card compact-feature">
        <div className="featured-icon"><PencilLine size={28} /></div>
        <div><span className="new-pill">LUYỆN VIẾT KANA</span><h2>Luyện viết tay</h2><p>Luyện từng nét và nhận phản hồi trực tiếp. Chọn Hiragana hoặc Katakana để bắt đầu.</p></div>
        <Link href="/practice/handwriting">Bắt đầu viết <ArrowRight size={18} /></Link>
      </section>
      
    </main>
  );
}
