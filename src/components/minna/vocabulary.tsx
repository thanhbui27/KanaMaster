"use client";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, RotateCcw, Shuffle, Eye, EyeOff, Search } from "lucide-react";
import type { MinnaProgress, Vocabulary } from "@/lib/minna/types";
import { shuffled } from "@/lib/minna/quiz";

type Props = { words: Vocabulary[]; progress: MinnaProgress; mark: (id: string, state: "learned" | "review") => void };
export function VocabularyList({ words, progress, mark }: Props) {
  const [search, setSearch] = useState("");
  const [hide, setHide] = useState(false);
  const [filter, setFilter] = useState("all");
  const visible = words.filter(w => `${w.kana} ${w.kanji} ${w.meaning}`.toLowerCase().includes(search.toLowerCase()) && (filter === "all" || (filter === "review" ? progress.review.includes(w.id) : progress.learned.includes(w.id))));
  return <><div className="mn-toolbar"><label className="mn-search"><Search size={17} /><input aria-label="Tìm từ vựng" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kana, kanji hoặc nghĩa…" /></label><button className="mn-button" onClick={() => setHide(!hide)}>{hide ? <Eye size={16} /> : <EyeOff size={16} />}{hide ? "Hiện nghĩa" : "Ẩn nghĩa"}</button><select aria-label="Lọc từ vựng" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Tất cả từ</option><option value="learned">Đã nhớ</option><option value="review">Cần ôn lại</option></select></div><p className="mn-muted">{visible.length} / {words.length} từ · Đánh dấu những từ bạn muốn ôn ở lần học tiếp theo.</p>
    <div className="mn-word-grid">{visible.map((w, i) => <article key={w.id} className={`mn-word-card ${progress.learned.includes(w.id) ? "learned" : ""}`}><small>{String(i + 1).padStart(2, "0")}{progress.learned.includes(w.id) && <span>Đã nhớ ✓</span>}</small><strong lang="ja">{w.kanji || w.kana}</strong>{w.kanji && <span lang="ja" className="mn-kana">{w.kana}</span>}<p className={hide ? "mn-hidden-meaning" : ""}>{hide ? "Nghĩa đang ẩn" : w.meaning}</p><div className="mn-word-actions"><button aria-pressed={progress.review.includes(w.id)} onClick={() => mark(w.id, "review")}><RotateCcw size={14} /> Cần ôn</button><button aria-pressed={progress.learned.includes(w.id)} onClick={() => mark(w.id, "learned")}><Check size={14} /> Đã nhớ</button></div></article>)}</div>{!visible.length && <div className="mn-empty">Chưa có từ phù hợp với bộ lọc này.</div>}</>;
}

export function Flashcards({ words, progress, mark }: Props) {
  const [deck, setDeck] = useState(words);
  const [index, setIndex] = useState(0);
  const [back, setBack] = useState(false);
  if (!deck.length) return <div className="mn-empty">Không có từ trong bộ ôn này.</div>;
  const word = deck[index];
  const move = (offset: number) => { setIndex((index + offset + deck.length) % deck.length); setBack(false); };
  return <div className="mn-flash-session"><div className="mn-heading"><span className="mn-pill">{index + 1} / {deck.length}</span><button className="mn-button" onClick={() => { setDeck(shuffled(deck)); setIndex(0); setBack(false); }}><Shuffle size={16} /> Trộn thẻ</button></div>
    <button className={`mn-flashcard ${back ? "flipped" : ""}`} onClick={() => setBack(!back)} aria-label={back ? "Lật về mặt trước" : "Lật thẻ để xem nghĩa"}><span className="mn-kicker">{back ? "NGHĨA & CÁCH ĐỌC" : "BẠN CÒN NHỚ TỪ NÀY?"}</span><strong lang="ja">{word.kanji || word.kana}</strong>{back ? <><span className="mn-kana" lang="ja">{word.kana}</span><p>{word.meaning}</p></> : <p>Chạm để lật thẻ</p>}<small>{progress.learned.includes(word.id) ? "✓ Đã nhớ" : progress.review.includes(word.id) ? "↻ Cần ôn lại" : "Chưa đánh dấu"}</small></button>
    <div className="mn-flash-actions"><button className="mn-button" onClick={() => { mark(word.id, "review"); move(1); }}><RotateCcw size={17} /> Cần ôn lại</button><button className="mn-button primary" onClick={() => { mark(word.id, "learned"); move(1); }}><Check size={17} /> Đã nhớ</button></div><div className="mn-flash-pagination"><button className="mn-button" onClick={() => move(-1)}><ArrowLeft size={16} /> Trước</button><span className="mn-muted">Tự đánh giá để xây dựng bộ ôn của bạn</span><button className="mn-button" onClick={() => move(1)}>Tiếp <ArrowRight size={16} /></button></div></div>;
}
