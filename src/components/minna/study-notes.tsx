"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Search, Volume2 } from "lucide-react";
import { noteTopics, notesSources, type NoteRow } from "@/data/minna-notes";

const searchable = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d").toLowerCase();
export function StudyNotes() {
  const [active, setActive] = useState(noteTopics[0].id);
  const [query, setQuery] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [audioMessage, setAudioMessage] = useState("");
  useEffect(() => {
    const syncHash = () => { const id = window.location.hash.slice(1); if (noteTopics.some(t => t.id === id)) { setActive(id); setQuery(""); } };
    const frame = requestAnimationFrame(syncHash);
    window.addEventListener("hashchange", syncHash);
    if (!("speechSynthesis" in window)) return () => { cancelAnimationFrame(frame); window.removeEventListener("hashchange", syncHash); };
    const synth = window.speechSynthesis;
    const syncVoices = () => setVoices(synth.getVoices());
    const voiceFrame = requestAnimationFrame(syncVoices);
    synth.addEventListener("voiceschanged", syncVoices);
    return () => { cancelAnimationFrame(frame); cancelAnimationFrame(voiceFrame); window.removeEventListener("hashchange", syncHash); synth.removeEventListener("voiceschanged", syncVoices); synth.cancel(); };
  }, []);
  const voiceFor = (language: "ja" | "zh") => voices.find(v => v.lang.toLowerCase().replace("_", "-") === (language === "ja" ? "ja-jp" : "zh-cn"))
    ?? voices.find(v => language === "ja" ? /^ja(?:-|_|$)/i.test(v.lang) : /^(?:zh-(?:CN|TW|SG)|cmn)(?:-|_|$)/i.test(v.lang.replace("_", "-")));
  const speak = (row: NoteRow, language: "ja" | "zh") => {
    const voice = voiceFor(language);
    if (!voice || !("speechSynthesis" in window)) { setAudioMessage("Thiết bị chưa có giọng đọc phù hợp. Bạn vẫn có thể xem phiên âm bên dưới."); return; }
    window.speechSynthesis.cancel();
    // Kana disambiguates standalone dates/numbers; full sentences preserve grammatical context.
    const text = language === "ja" ? (/[。？！]$/.test(row.ja) ? row.ja : row.kana).replace(/ → /g, "。") : row.zh.replace(/（[^）]*）/g, "");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice; utterance.lang = voice.lang; utterance.rate = 0.85;
    utterance.onerror = event => { if (!["canceled", "interrupted"].includes(event.error)) setAudioMessage("Không phát được giọng đọc trên thiết bị này. Hãy dùng kana/romaji hoặc pinyin để đối chiếu."); };
    setAudioMessage(`Giọng tổng hợp ${language === "ja" ? "tiếng Nhật" : "tiếng Trung"}; đọc chậm để luyện theo.`);
    window.speechSynthesis.speak(utterance);
  };
  const topic = noteTopics.find(t => t.id === active)!;
  const needle = searchable(query.trim());
  const sections = topic.sections.map(section => ({ ...section, rows: section.rows.filter(row => !needle || searchable(Object.values(row).join(" ")).includes(needle)) })).filter(section => section.rows.length);
  const count = sections.reduce((sum, section) => sum + section.rows.length, 0);
  const choose = (id: string) => { setActive(id); setQuery(""); window.history.replaceState(null, "", `#${id}`); if ("speechSynthesis" in window) window.speechSynthesis.cancel(); };
  return <div className="nt-page">
    <Link className="nt-back" href="/minna"><ArrowLeft size={16} /> Trở lại Minna</Link>
    <header className="nt-hero"><div><span className="mn-kicker">SỔ TAY HỌC TẬP · NHẬT – TRUNG – VIỆT</span><h1>Nhớ quy tắc.<br /><em>Hiểu cả ngoại lệ.</em></h1><p>Tra nhanh cách đọc, so sánh những dạng dễ nhầm và học qua ví dụ. Một chỗ để quay lại mỗi khi bạn cần chắc chắn hơn.</p></div><div className="nt-hero-mark" aria-hidden="true"><span>学習メモ</span><strong>覚える</strong><small>5 CHỦ ĐỀ · CÓ PHIÊN ÂM</small></div></header>
    <div className="nt-layout"><nav className="nt-nav" aria-label="Chủ đề lưu ý"><span className="mn-kicker">BẠN MUỐN TRA GÌ?</span>{noteTopics.map((item, i) => <button key={item.id} aria-pressed={active === item.id} onClick={() => choose(item.id)}><span>{String(i + 1).padStart(2, "0")}</span><div><strong>{item.title}</strong><small lang="ja">{item.ja}</small></div></button>)}<p>Nhật: kana + romaji<br />Trung giản thể: pinyin<br />Việt: nghĩa + lưu ý</p></nav>
      <section className="nt-content" aria-label={topic.title}>
        <div className="nt-title"><div><span className="mn-kicker" lang="ja">{topic.ja}</span><h2>{topic.title}</h2><p>{topic.description}</p></div><BookOpen size={28} /></div>
        <aside className="nt-tips"><h3>Điểm cần nhớ</h3><ul>{topic.tips.map(tip => <li key={tip}>{tip}</li>)}</ul></aside>
        <div className="nt-tools"><label className="mn-search"><Search size={18} /><input aria-label="Tìm trong chủ đề" placeholder="Tìm từ, nghĩa, kana, romaji hoặc pinyin…" value={query} onChange={event => setQuery(event.target.value)} /></label><span aria-live="polite">{count} mục</span></div>
        <p className="nt-audio-note">Phát âm: kana/romaji và pinyin luôn hiển thị. Nút nghe dùng giọng tổng hợp trên thiết bị; không phải bản thu giáo viên.{(!voiceFor("ja") || !voiceFor("zh")) && " Nút bị mờ nghĩa là chưa tìm thấy giọng của ngôn ngữ đó."}</p>
        {audioMessage && <p className="nt-audio-note" role="status">{audioMessage}</p>}
        <div key={active + (needle ? "-search" : "-all")} className="nt-sections">{sections.map((section, index) => <details className="nt-section" key={section.title} open={!!needle || index === 0}><summary><span>{section.title}</span><small>{section.rows.length} mục</small></summary><div className="nt-section-body"><p>{section.intro}</p><div className="nt-table-scroll" role="region" aria-label={section.title} tabIndex={0}><table><thead><tr><th scope="col">Tiếng Nhật · phát âm</th><th scope="col">Tiếng Trung · pinyin</th><th scope="col">Nghĩa & lưu ý</th></tr></thead><tbody>{section.rows.map(row => <tr key={row.ja}><td><strong lang="ja">{row.ja}</strong><span lang="ja">{row.kana}</span><small>{row.romaji}</small><button className="nt-speak" disabled={!voiceFor("ja")} aria-label={`Nghe tiếng Nhật: ${row.ja}`} onClick={() => speak(row, "ja")}><Volume2 size={14} />Nghe Nhật</button></td><td><strong lang="zh-Hans">{row.zh}</strong><small lang="zh-Latn-pinyin">{row.pinyin}</small><button className="nt-speak" disabled={!voiceFor("zh")} aria-label={`Nghe tiếng Trung: ${row.zh}`} onClick={() => speak(row, "zh")}><Volume2 size={14} />Nghe Trung</button></td><td><strong>{row.vi}</strong>{row.note && <p>{row.note}</p>}</td></tr>)}</tbody></table></div></div></details>)}</div>
        {!count && <div className="mn-empty">Không tìm thấy mục phù hợp trong chủ đề này.<button className="mn-button" onClick={() => setQuery("")}>Xóa tìm kiếm</button></div>}
        <footer className="nt-sources"><strong>Nguồn đối chiếu & cách sử dụng</strong><p>Nội dung biên soạn để tra cứu cùng giáo trình. Bản dịch Trung–Việt theo ngữ cảnh, không phải đáp án chính thức của Riki. Romaji hỗ trợ đọc âm, không thể hiện đầy đủ cao độ tiếng Nhật. Pinyin ghi thanh từ điển, không ghi mọi biến điệu khi nói.</p>{notesSources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>)}</footer>
      </section>
    </div>
  </div>;
}
