"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Check, ChevronLeft, ChevronRight, RotateCcw, Volume2 } from "lucide-react";
import { useJapaneseSpeech } from "@/components/minna/use-japanese-speech";
import { KANJI_LEVELS, kanjiRadicals, type KanjiEntry, type KanjiLevel } from "@/lib/kanji-shared";

const STORAGE_KEY = "kanamaster.kanji.v1";
const LESSON_SIZE = 12;
type Progress = { learned: string[]; review: string[] };
type Mode = "learn" | "cards" | "quiz";
type Question = { entry: KanjiEntry; options: string[] };
const emptyProgress: Progress = { learned: [], review: [] };

function readProgress(raw: string | null, validIds: Set<string>): Progress {
  if (!raw) return emptyProgress;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return emptyProgress;
    const data = value as Record<string, unknown>;
    const ids = (key: string) => Array.isArray(data[key]) ? [...new Set(data[key].filter((id): id is string => typeof id === "string" && validIds.has(id)))] : [];
    const learned = ids("learned");
    return { learned, review: ids("review").filter(id => !learned.includes(id)) };
  } catch { return emptyProgress; }
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeQuiz(entries: KanjiEntry[], distractorPool: KanjiEntry[]): Question[] {
  return shuffle(entries).slice(0, Math.min(10, entries.length)).map(entry => ({
    entry,
    options: shuffle([entry.meaning, ...shuffle([...new Set(distractorPool.filter(other => other.id !== entry.id && other.meaning !== entry.meaning).map(other => other.meaning))]).slice(0, 3)]),
  }));
}

function cleanReading(reading: string) { return reading === "---" ? "Không có trong tài liệu" : reading; }

export function KanjiStudy({ entries }: { entries: KanjiEntry[] }) {
  const [level, setLevel] = useState<KanjiLevel>("N5");
  const [mode, setMode] = useState<Mode>("learn");
  const [selection, setSelection] = useState<"lesson" | "radical" | "review">("lesson");
  const [lessonIndex, setLessonIndex] = useState(0);
  const [radicalFilter, setRadicalFilter] = useState<number | null>(null);
  const [radicalsExpanded, setRadicalsExpanded] = useState(true);
  const [radicalSearch, setRadicalSearch] = useState("");
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [search, setSearch] = useState("");
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const speech = useJapaneseSpeech();
  const validIds = useMemo(() => new Set(entries.map(entry => entry.id)), [entries]);
  const levelEntries = useMemo(() => entries.filter(entry => entry.level === level), [entries, level]);
  const radicalGroups = kanjiRadicals.filter(group => levelEntries.some(entry => entry.radicalNumber === group.number));
  const selectedRadical = radicalFilter ?? radicalGroups[0]?.number;
  const lessonCount = Math.ceil(levelEntries.length / LESSON_SIZE);
  const studyEntries = selection === "lesson" ? levelEntries.slice(lessonIndex * LESSON_SIZE, (lessonIndex + 1) * LESSON_SIZE) : selection === "radical" ? levelEntries.filter(entry => entry.radicalNumber === selectedRadical) : levelEntries.filter(entry => progress.review.includes(entry.id));
  const visible = studyEntries.filter(entry => `${entry.kanji} ${entry.hanViet} ${entry.meaning} ${entry.kunyomi} ${entry.onyomi} ${entry.exampleWord}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const visibleGroups = selection !== "radical" ? [{ number: 0, radical: "", entries: visible }] : radicalGroups.filter(group => group.number === selectedRadical).map(group => ({ ...group, entries: visible.filter(entry => entry.radicalNumber === group.number) }));
  const learnedCount = entries.filter(entry => progress.learned.includes(entry.id)).length;

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try { setProgress(readProgress(localStorage.getItem(STORAGE_KEY), validIds)); }
      catch { setStorageError(true); }
      setLoaded(true);
    });
    return () => { active = false; };
  }, [validIds]);

  function save(next: Progress) {
    setProgress(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
    catch { setStorageError(true); }
  }

  function mark(id: string, kind: "learned" | "review") {
    const next = { learned: progress.learned.filter(value => value !== id), review: progress.review.filter(value => value !== id) };
    if (!progress[kind].includes(id)) next[kind].push(id);
    save(next);
    if (selection === "review") { setCardIndex(0); setRevealed(false); }
  }

  function selectLevel(next: KanjiLevel) {
    setLevel(next); setSelection("lesson"); setLessonIndex(0); setRadicalFilter(null); setRadicalsExpanded(true); setRadicalSearch(""); setSearch(""); setCardIndex(0); setRevealed(false); setMode("learn"); setQuestions([]); setQuizDone(false);
  }

  function selectRadical(next: number) {
    setSelection("radical"); setRadicalFilter(next); setRadicalsExpanded(false); setSearch(""); setCardIndex(0); setRevealed(false); setMode("learn"); setQuestions([]); setQuizDone(false);
  }

  function selectLesson(next: number) {
    setSelection("lesson"); setLessonIndex(next); setSearch(""); setCardIndex(0); setRevealed(false); setMode("learn"); setQuestions([]); setQuizDone(false);
  }

  function startQuiz() {
    if (!studyEntries.length) return;
    setQuestions(makeQuiz(studyEntries, levelEntries)); setQuestionIndex(0); setSelected(null); setCorrect(0); setQuizDone(false); setMode("quiz");
  }

  function chooseAnswer(answer: string) {
    if (selected !== null || quizDone) return;
    setSelected(answer);
    const entry = questions[questionIndex].entry;
    if (answer === entry.meaning) setCorrect(value => value + 1);
    else if (!progress.review.includes(entry.id)) save({ learned: progress.learned.filter(id => id !== entry.id), review: [...progress.review, entry.id] });
  }

  function nextQuestion() {
    if (questionIndex + 1 >= questions.length) setQuizDone(true);
    else { setQuestionIndex(value => value + 1); setSelected(null); }
  }

  const card = studyEntries[cardIndex];
  const question = questions[questionIndex];
  return <main className="kj-page" lang="vi">
    <header className="kj-hero"><div><span className="ui-eyebrow">KANJI · N5–N1</span><h1>Học từng bài, nhớ từng chữ.</h1><p>Học 12 chữ một bài, xem bộ thủ và từ ví dụ, rồi lật thẻ và tự kiểm tra. Chữ cần ôn được giữ lại trong tiến độ trên trình duyệt này.</p></div><div className="kj-total"><strong>{loaded ? learnedCount : "—"}<span> / {entries.length}</span></strong><small>chữ đã nhớ</small><div className="kj-meter"><i style={{ width: `${learnedCount / entries.length * 100}%` }} /></div></div></header>
    {storageError && <p className="kj-notice" role="status">Không lưu được tiến độ trên trình duyệt. Các đánh dấu chỉ còn trong phiên này.</p>}
    <section className="kj-levels" aria-label="Chọn bộ Kanji">{KANJI_LEVELS.map(item => {
      const levelItems = entries.filter(entry => entry.level === item);
      const count = levelItems.filter(entry => progress.learned.includes(entry.id)).length;
      return <button key={item} type="button" className={level === item ? "active" : ""} aria-pressed={level === item} onClick={() => selectLevel(item)}><strong>{item}</strong><span>{levelItems.length} chữ<small>{!levelItems.length ? "Chưa có chữ" : loaded ? `${count} đã nhớ` : "Đang tải"}</small></span></button>;
    })}</section>
    <div className="kj-toolbar"><div><h2>{level} · {levelEntries.length} chữ</h2><p>{selection === "lesson" ? `Bài ${lessonIndex + 1}/${lessonCount} · ${studyEntries.length} chữ · từ cơ bản đến phức tạp` : selection === "radical" ? `Bộ ${radicalGroups.find(group => group.number === selectedRadical)?.radical} · ${studyEntries.length} chữ` : `${studyEntries.length} chữ cần ôn`}</p></div><div className="kj-modes" role="group" aria-label="Chế độ học"><button type="button" className={mode === "learn" ? "active" : ""} onClick={() => setMode("learn")}>Học chữ</button><button type="button" disabled={!studyEntries.length} className={mode === "cards" ? "active" : ""} onClick={() => { setCardIndex(0); setRevealed(false); setMode("cards"); }}>Flashcard</button><button type="button" disabled={!studyEntries.length} className={mode === "quiz" ? "active" : ""} onClick={startQuiz}>Kiểm tra</button></div></div>
    {levelEntries.length > 0 && <div className="kj-scope-switch" role="group" aria-label="Cách chọn chữ"><button type="button" className={selection === "lesson" ? "active" : ""} aria-pressed={selection === "lesson"} onClick={() => selectLesson(lessonIndex)}>Theo bài học</button><button type="button" className={selection === "radical" ? "active" : ""} aria-pressed={selection === "radical"} onClick={() => { setSelection("radical"); setRadicalsExpanded(true); setMode("learn"); setCardIndex(0); setQuestions([]); }}>Theo bộ thủ</button><button type="button" className={selection === "review" ? "active" : ""} aria-pressed={selection === "review"} onClick={() => { setSelection("review"); setMode("learn"); setCardIndex(0); setQuestions([]); }}>Cần ôn ({levelEntries.filter(entry => progress.review.includes(entry.id)).length})</button></div>}
    {selection === "lesson" && lessonCount > 0 && <nav className="kj-lesson-nav" aria-label="Chọn bài Kanji"><button type="button" disabled={lessonIndex === 0} onClick={() => selectLesson(lessonIndex - 1)}><ChevronLeft size={16} /> Bài trước</button><label>Bài học <select value={lessonIndex} onChange={event => selectLesson(Number(event.target.value))}>{Array.from({ length: lessonCount }, (_, index) => <option value={index} key={index}>Bài {index + 1} · {Math.min(LESSON_SIZE, levelEntries.length - index * LESSON_SIZE)} chữ</option>)}</select></label><button type="button" disabled={lessonIndex >= lessonCount - 1} onClick={() => selectLesson(lessonIndex + 1)}>Bài sau <ChevronRight size={16} /></button></nav>}
    {selection === "radical" && radicalGroups.length > 0 && <section className="kj-radicals" aria-label="Chọn bộ thủ"><div className="kj-radicals-heading"><h3>Học theo bộ thủ</h3><p>Mỗi chữ thuộc một bộ chính để tra từ điển; bộ có thể đổi dạng trong chữ, như 水 → 氵 và 人 → 亻.</p></div>{radicalsExpanded ? <><input className="kj-radical-search" value={radicalSearch} onChange={event => setRadicalSearch(event.target.value)} placeholder="Tìm bộ thủ, số bộ hoặc chữ Kanji" aria-label="Tìm bộ thủ" /><div className="kj-radical-picker">{radicalGroups.filter(group => `${group.radical} ${group.number} ${group.kanji.join("")}`.includes(radicalSearch.trim())).map(group => <button type="button" key={group.number} className={selectedRadical === group.number ? "active" : ""} aria-pressed={selectedRadical === group.number} onClick={() => selectRadical(group.number)} aria-label={`Bộ ${group.radical}, số ${group.number}, ${levelEntries.filter(entry => entry.radicalNumber === group.number).length} chữ`}><strong lang="ja">{group.radical}</strong><span>{levelEntries.filter(entry => entry.radicalNumber === group.number).length} chữ</span></button>)}</div></> : <button type="button" className="kj-radical-reopen" onClick={() => setRadicalsExpanded(true)}>Bộ <strong lang="ja">{radicalGroups.find(group => group.number === selectedRadical)?.radical}</strong> · {studyEntries.length} chữ <span>Đổi bộ thủ</span></button>}</section>}
    {mode === "learn" && <><label className="kj-search">Tìm trong nhóm<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Kanji, Hán Việt, nghĩa hoặc cách đọc" /></label>{visibleGroups.filter(group => group.entries.length > 0).map(group => <section className="kj-radical-section" key={group.number}><div className="kj-radical-title"><h3>{selection === "lesson" ? `Bài ${lessonIndex + 1}` : selection === "review" ? "Chữ cần ôn" : <>Bộ <span lang="ja">{group.radical}</span> <small>#{group.number}</small></>}</h3><span>{group.entries.length} chữ</span></div><div className="kj-grid">{group.entries.map(entry => <article className="kj-item" key={entry.id}><div className="kj-item-top"><span className="kj-order">{entry.chapter ? `Chương ${entry.chapter} · ${String(entry.order).padStart(2, "0")}` : `${entry.level} · ${String(entry.sequence).padStart(3, "0")}`}</span><span className="kj-status">{progress.learned.includes(entry.id) ? "✓ Đã nhớ" : progress.review.includes(entry.id) ? "↻ Cần ôn" : "Chưa học"}</span></div><strong className="kj-glyph" lang="ja">{entry.kanji}</strong><div className="kj-han">{entry.hanViet || "Kanji Nhật"}</div><h3>{entry.meaning}{entry.meaningLanguage === "en" && <small className="kj-language">EN</small>}</h3><dl><div><dt>Kunyomi · 訓読み</dt><dd lang="ja">{cleanReading(entry.kunyomi)}</dd></div><div><dt>Onyomi · 音読み</dt><dd lang="ja">{cleanReading(entry.onyomi)}</dd></div></dl>{entry.exampleWord && <p className="kj-example"><span>VÍ DỤ</span><strong lang="ja">{entry.exampleWord}</strong><span lang="ja">{entry.exampleReading}</span>{entry.exampleMeaningEnglish && <small>EN: {entry.exampleMeaningEnglish}</small>}</p>}{entry.mnemonicText.length > 0 && <p className="kj-mnemonic"><BookOpen size={15} />{entry.mnemonicText.join(" ")}</p>}<div className="kj-actions"><button type="button" aria-pressed={progress.learned.includes(entry.id)} onClick={() => mark(entry.id, "learned")}><Check size={15} />Đã nhớ</button><button type="button" aria-pressed={progress.review.includes(entry.id)} onClick={() => mark(entry.id, "review")}><RotateCcw size={15} />Cần ôn</button></div></article>)}</div></section>)}{visible.length === 0 && <p className="kj-empty">{levelEntries.length ? "Không tìm thấy chữ phù hợp hoặc chưa có chữ cần ôn." : `Chưa có Kanji ${level} trong bộ dữ liệu hiện tại.`}</p>}</>}
    {mode === "cards" && card && <section className="kj-card-area"><div className="kj-card-head"><span>{selection === "lesson" ? `Bài ${lessonIndex + 1}` : selection === "review" ? "Cần ôn" : `Bộ ${card.radical}`} · Thẻ {cardIndex + 1} / {studyEntries.length}</span><span>{progress.learned.includes(card.id) ? "✓ Đã nhớ" : progress.review.includes(card.id) ? "↻ Cần ôn" : "Chưa học"}</span></div><button type="button" className="kj-flashcard" onClick={() => setRevealed(value => !value)} aria-label={revealed ? "Ẩn đáp án" : "Lật thẻ xem đáp án"}><span>{revealed ? "NGHĨA & CÁCH ĐỌC" : "BẠN CÒN NHỚ CHỮ NÀY?"}</span><strong lang="ja">{card.kanji}</strong>{revealed ? <div><b>{card.hanViet || "Kanji Nhật"}</b><p>{card.meaning}{card.meaningLanguage === "en" && <small className="kj-language">EN</small>}</p><small lang="ja">Kun: {cleanReading(card.kunyomi)} · On: {cleanReading(card.onyomi)}</small></div> : <small>Chạm để lật thẻ</small>}</button>{revealed && card.exampleWord && <p className="kj-card-hint">Ví dụ: <span lang="ja">{card.exampleWord} · {card.exampleReading}</span>{card.exampleMeaningEnglish && ` · ${card.exampleMeaningEnglish} (EN)`}</p>}{revealed && card.mnemonicText.length > 0 && <p className="kj-card-hint">{card.mnemonicText.join(" ")}</p>}<div className="kj-card-controls"><button type="button" disabled={cardIndex === 0} onClick={() => { setCardIndex(value => value - 1); setRevealed(false); }}><ChevronLeft size={17} />Trước</button><button type="button" onClick={() => speech.speak((card.kunyomi !== "---" ? card.kunyomi : card.onyomi).split("、")[0].replaceAll("・", "").trim())}><Volume2 size={17} />Nghe</button><button type="button" aria-pressed={progress.review.includes(card.id)} onClick={() => mark(card.id, "review")}>Cần ôn</button><button type="button" aria-pressed={progress.learned.includes(card.id)} onClick={() => mark(card.id, "learned")}>Đã nhớ</button><button type="button" disabled={cardIndex === studyEntries.length - 1} onClick={() => { setCardIndex(value => value + 1); setRevealed(false); }}>Tiếp<ChevronRight size={17} /></button></div>{speech.message && <p className="kj-speech" role="status">{speech.message}</p>}</section>}
    {mode === "quiz" && question && <section className="kj-quiz">{quizDone ? <><span className="ui-eyebrow">HOÀN THÀNH</span><h2>{correct} / {questions.length} câu đúng</h2><p>Chữ trả lời sai đã được đánh dấu cần ôn. Bạn có thể học lại rồi làm bộ câu mới.</p><div className="kj-quiz-controls"><button type="button" onClick={() => setMode("learn")}>Xem lại chữ</button><button type="button" onClick={startQuiz}>Làm bộ mới</button></div></> : <><div className="kj-quiz-top"><span>Câu {questionIndex + 1} / {questions.length}</span><span>{correct} đúng</span></div><div className="kj-quiz-glyph" lang="ja">{question.entry.kanji}</div><h2>Chữ này có nghĩa là gì?{question.entry.meaningLanguage === "en" && <small className="kj-language">EN</small>}</h2><div className="kj-options">{question.options.map(option => <button type="button" key={option} disabled={selected !== null} className={selected !== null && option === question.entry.meaning ? "correct" : selected === option ? "wrong" : ""} onClick={() => chooseAnswer(option)}>{option}</button>)}</div>{selected !== null && <div className="kj-feedback" role="status"><strong>{selected === question.entry.meaning ? "Chính xác!" : `Đáp án: ${question.entry.meaning}`}</strong><span lang="ja">{question.entry.kanji} · {question.entry.kunyomi} · {question.entry.onyomi}</span><button type="button" onClick={nextQuestion}>{questionIndex + 1 === questions.length ? "Xem kết quả" : "Câu tiếp theo"}<ChevronRight size={17} /></button></div>}</>}</section>}
    <p className="kj-footnote">N5 gồm 95 chữ gốc của bạn và các chữ bổ sung từ danh sách tham khảo; JLPT không công bố danh sách Kanji cố định. Dữ liệu N4–N1 hiện giữ nghĩa tiếng Anh từ <a href="https://github.com/evanclan/OpenJLPT" target="_blank" rel="noreferrer">OpenJLPT</a> (CC BY-SA 4.0; dùng dữ liệu JMdict và KANJIDIC2 từ EDRDG). Âm Hán Việt tham khảo từ <a href="https://github.com/NVL4826/kanji-data-hanviet" target="_blank" rel="noreferrer">kanji-data-hanviet</a>. Dấu “・” chỉ ranh giới phần hiragana viết sau Kanji, như おお・きい → 大きい. Mẹo nhớ trong 95 chữ gốc là liên tưởng học tập, không phải giải thích nguồn gốc chữ.</p>
  </main>;
}
