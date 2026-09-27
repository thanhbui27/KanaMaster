"use client";
import { useState } from "react";
import { ArrowRight, Check, RotateCcw, Trophy, X } from "lucide-react";
import { createQuiz } from "@/lib/minna/quiz";
import type { QuizMode, QuizQuestion, Vocabulary } from "@/lib/minna/types";

const labels: Record<QuizMode, string> = { "ja-vi": "Nhật → Việt", "vi-ja": "Việt → Nhật", "kana-kanji": "Kana → Kanji", mixed: "Trộn các dạng" };
export function VocabularyQuiz({ words, onFinish, onReview }: { words: Vocabulary[]; onFinish: (correct: number, total: number, wrong: string[]) => void; onReview: (ids: string[]) => void }) {
  const [mode, setMode] = useState<QuizMode>("mixed");
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase] = useState<"setup" | "playing" | "result">("setup");
  const [message, setMessage] = useState("");
  const start = () => {
    const next = createQuiz(words, mode, count);
    if (!next.length) { setMessage("Không đủ 4 đáp án khác nhau hoặc câu hỏi rõ nghĩa cho dạng này. Hãy chọn dạng khác."); return; }
    setQuestions(next); setAnswers([]); setSelected(null); setMessage(""); setPhase("playing");
  };
  if (phase === "setup") return <section className="mn-panel mn-quiz-setup"><span className="mn-round-icon"><Trophy size={28} /></span><span className="mn-kicker">KIỂM TRA KHẢ NĂNG GHI NHỚ</span><h2>Hôm nay bạn nhớ được bao nhiêu?</h2><p>Quiz được tạo từ từ vựng của bài này. Mỗi câu có 4 lựa chọn, kèm đáp án và giải nghĩa ngay sau khi trả lời.</p><div className="mn-quiz-settings"><label>Dạng câu hỏi<select value={mode} onChange={e => { setMode(e.target.value as QuizMode); setMessage(""); }}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Số câu<select value={count} onChange={e => setCount(Number(e.target.value))}><option value={10}>10 câu</option><option value={20}>20 câu</option><option value={9999}>Tất cả từ hợp lệ</option></select></label></div><p className="mn-footnote">Chỉ dùng Kanji khi nguồn có Kanji. Câu có nhiều đáp án hợp lệ được bỏ qua; số câu thực tế có thể ít hơn số đã chọn.</p>{message && <p role="status" className="mn-notice">{message}</p>}<button className="mn-button primary" onClick={start}>Bắt đầu quiz <ArrowRight size={17} /></button></section>;
  const correct = answers.filter((a, i) => a === questions[i].answer).length;
  const wrong = questions.filter((q, i) => answers[i] !== q.answer);
  if (phase === "result") return <section className="mn-panel mn-results"><span className="mn-round-icon"><Trophy size={30} /></span><span className="mn-kicker">HOÀN THÀNH QUIZ</span><h2>Mỗi lần ôn, nhớ thêm một chút.</h2><strong className="mn-big-score">{correct}<small> / {questions.length}</small></strong><p>Chính xác {Math.round(correct / questions.length * 100)}% · {correct} câu đúng · {wrong.length} câu sai</p><div className="mn-actions"><button className="mn-button" onClick={() => { setAnswers([]); setSelected(null); setPhase("playing"); }}><RotateCcw size={16} /> Làm lại bộ câu</button><button className="mn-button primary" onClick={() => setPhase("setup")}>Quiz mới <ArrowRight size={16} /></button>{wrong.length > 0 && <button className="mn-button" onClick={() => onReview(wrong.map(q => q.word.id))}>Ôn lại {wrong.length} từ sai</button>}</div><div className="mn-result-list">{questions.map((q, i) => <article key={q.id}><span className={answers[i] === q.answer ? "mn-success" : "mn-error"}>{answers[i] === q.answer ? <Check size={18} /> : <X size={18} />}</span><div><strong lang="ja">{q.word.kanji || q.word.kana}</strong><span>{q.word.kana} · {q.word.meaning}</span><small>Bạn chọn: {answers[i]}{answers[i] !== q.answer && ` · Đáp án: ${q.answer}`}</small></div></article>)}</div></section>;
  const question = questions[answers.length];
  const next = () => {
    if (selected === null) return;
    const nextAnswers = [...answers, selected];
    setAnswers(nextAnswers); setSelected(null);
    if (nextAnswers.length === questions.length) {
      onFinish(nextAnswers.filter((a, i) => a === questions[i].answer).length, questions.length, questions.filter((q, i) => nextAnswers[i] !== q.answer).map(q => q.word.id));
      setPhase("result");
    }
  };
  return <section className="mn-panel mn-quiz-play"><div className="mn-heading"><span className="mn-pill">Câu {answers.length + 1} / {questions.length}</span><button className="mn-text-button" onClick={() => { if (window.confirm("Kết thúc lượt quiz đang làm? Điểm chỉ được lưu khi hoàn thành cả lượt.")) setPhase("setup"); }}>Kết thúc lượt</button></div><div className="mn-meter"><span style={{ width: `${answers.length / questions.length * 100}%` }} /></div><div className="mn-question"><span className="mn-kicker">{labels[question.mode]}</span><h2 lang={question.mode === "vi-ja" ? "vi" : "ja"}>{question.prompt}</h2><p>Chọn một đáp án phù hợp</p></div><div className="mn-options">{question.options.map((option, i) => <button key={option} disabled={selected !== null} className={selected !== null && option === question.answer ? "correct" : selected === option ? "incorrect" : ""} onClick={() => setSelected(option)}><span>{String.fromCharCode(65 + i)}</span>{option}{selected !== null && option === question.answer && <Check size={18} />}</button>)}</div>{selected !== null && <div className={`mn-feedback ${selected === question.answer ? "correct" : "incorrect"}`} role="status"><strong>{selected === question.answer ? "Chính xác!" : "Chưa đúng — cùng ghi nhớ lại nhé."}</strong><p>{question.word.kanji || question.word.kana} · {question.word.kana}<br />{question.word.meaning}</p><span>Đáp án: {question.answer}</span></div>}<button className="mn-button primary" disabled={selected === null} onClick={next}>{answers.length + 1 === questions.length ? "Xem kết quả" : "Câu tiếp theo"}<ArrowRight size={17} /></button></section>;
}
