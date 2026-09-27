import Link from "next/link";
export default function NotFound() { return <div className="mn-empty"><h1>Bài học chưa có dữ liệu</h1><p>Chọn một bài đã sẵn sàng trong danh sách Minna.</p><Link className="mn-button primary" href="/minna">Về danh sách bài học</Link></div>; }
