"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Check, Download, Plus, RotateCcw } from "lucide-react";
import { calendarFile, decodeRepeat, EMPTY_REPEAT, importWords, localDate, REPEAT_KEY, scheduleDates, sessionWords, type RepeatStore, type StudyPlan, type StudyWord } from "@/lib/repeat";

function download(name: string, text: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const csvTemplate = '\uFEFForder,term,meaning,reading,phonetic:Romaji,phonetic:IPA UK,phonetic:IPA US,wordType,language,group\r\n1,学校,trường học,がっこう,gakkou,,,danh từ,ja,Trường học\r\n2,hello,xin chào,,,həˈləʊ,həˈloʊ,thán từ,en,Giao tiếp\r\n';
const jsonTemplate = JSON.stringify([{ order: "1", term: "学校", meaning: "trường học", reading: "がっこう", phonetics: [{ label: "Romaji", value: "gakkou" }], wordType: "danh từ", language: "ja", group: "Trường học" }, { order: "2", term: "hello", meaning: "xin chào", reading: "", phonetics: [{ label: "IPA UK", value: "həˈləʊ" }, { label: "IPA US", value: "həˈloʊ" }], wordType: "thán từ", language: "en", group: "Giao tiếp" }], null, 2);

export function RepeatClient({ catalog }: { catalog: StudyWord[] }) {
  const [data, setData] = useState<RepeatStore>(EMPTY_REPEAT);
  const [ready, setReady] = useState(false), [message, setMessage] = useState("");
  const [tab, setTab] = useState<"plans" | "setup" | "import">("plans");
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("Lịch học của tôi");
  const [start, setStart] = useState(""), [end, setEnd] = useState("");
  const [mode, setMode] = useState<"interval" | "month" | "custom">("interval"), [value, setValue] = useState("2");
  const [perSession, setPerSession] = useState(10), [time, setTime] = useState("20:00");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [group, setGroup] = useState(""), [query, setQuery] = useState("");
  const [draft, setDraft] = useState<StudyWord[]>([]);
  const [active, setActive] = useState<{ plan: string; date: string } | null>(null);
  useEffect(() => {
    const sync = () => {
      try { setData(decodeRepeat(localStorage.getItem(REPEAT_KEY))); setReady(true); }
      catch (e) { setMessage((e as Error).message); setReady(false); }
    };
    const frame = requestAnimationFrame(() => { sync(); const today = localDate(); setStart(today); const last = new Date(); last.setDate(last.getDate() + 30); setEnd(localDate(last)); });
    window.addEventListener("storage", sync);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("storage", sync); };
  }, []);
  function persist(next: RepeatStore) {
    try { localStorage.setItem(REPEAT_KEY, JSON.stringify(next)); setData(next); setReady(true); window.dispatchEvent(new Event("repeat-updated")); return true; }
    catch { setMessage("Không thể lưu: trình duyệt chặn lưu trữ hoặc đã hết dung lượng. Hãy tải bản sao lưu."); return false; }
  }
  const words = useMemo(() => [...catalog, ...data.custom], [catalog, data.custom]);
  const groups = [...new Set(words.map(w => w.group))];
  const filtered = words.filter(w => (!group || w.group === group) && `${w.term} ${w.meaning} ${w.reading} ${w.wordType} ${w.phonetics.map(p => p.value).join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  let dates: string[] = [], dateError = "";
  try { dates = scheduleDates(start, end, mode, value); } catch (e) { dateError = (e as Error).message; }
  const currentPlan = active ? data.plans.find(p => p.id === active.plan && p.dates.includes(active.date)) : undefined;
  function savePlan() {
    if (dateError) return setMessage(dateError);
    const chosen = words.filter(w => selected.has(w.id));
    if (!name.trim() || !chosen.length || !Number.isInteger(perSession) || perSession < 1 || perSession > 5000 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return setMessage("Nhập tên lịch, chọn ít nhất 1 mục, giờ hợp lệ và số từ mới từ 1–5.000.");
    const old = data.plans.find(p => p.id === editing);
    const plan: StudyPlan = { id: editing ?? crypto.randomUUID(), name: name.trim(), dates, perSession, time, words: chosen, completed: [], reminder: old?.reminder ?? false };
    if (persist({ ...data, plans: editing ? data.plans.map(p => p.id === editing ? plan : p) : [...data.plans, plan] })) { setTab("plans"); setEditing(null); setMessage("Đã lưu lịch học."); }
  }
  function edit(plan: StudyPlan) {
    setEditing(plan.id); setName(plan.name); setStart(plan.dates[0]); setEnd(plan.dates.at(-1)!); setMode("custom"); setValue(plan.dates.join(", ")); setPerSession(plan.perSession); setTime(plan.time); setSelected(new Set(plan.words.map(w => w.id))); setTab("setup"); setMessage("");
  }
  async function enableReminder(plan: StudyPlan) {
    if (plan.reminder) { persist({ ...data, plans: data.plans.map(p => p.id === plan.id ? { ...p, reminder: false } : p) }); return; }
    if (!("Notification" in window)) return setMessage("Trình duyệt này chưa hỗ trợ thông báo. Bạn có thể xuất lịch .ics.");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setMessage("Chưa được cấp quyền thông báo. Hãy bật trong cài đặt trình duyệt hoặc xuất lịch .ics.");
      if (persist({ ...data, plans: data.plans.map(p => p.id === plan.id ? { ...p, reminder: true } : p) })) setMessage("Đã bật nhắc học khi app đang mở. Xuất lịch .ics để nhắc khi đóng app.");
    } catch { setMessage("Không bật được thông báo trên trình duyệt này. Hãy dùng lịch .ics."); }
  }
  return <main className="repeat-page" lang="vi">
    <header className="rp-header"><Link href="/"><ArrowLeft size={18} /> KanaMaster</Link><span>HỌC ĐỀU · NHỚ LÂU</span></header>
    <section className="rp-hero"><div><span className="rp-kicker">KHÔNG GIAN ÔN TẬP</span><h1>Repeat<span>.</span></h1><p>Mỗi buổi thêm một chút mới.<br />Ôn lại tất cả những gì đã học.</p></div><div className="rp-example"><CalendarDays size={26} /><strong>01 → 03 → 05 → 07</strong><span>10 từ → 20 từ → 30 từ → 40 từ</span><small>Bạn chọn ngày. Repeat cộng dồn phần ôn.</small></div></section>
    <nav className="rp-tabs" aria-label="Repeat">{([["plans", "Lịch của tôi"], ["setup", "Thiết lập lịch"], ["import", "Từ tùy chỉnh"]] as const).map(([id, label]) => <button key={id} aria-current={tab === id ? "page" : undefined} onClick={() => { setTab(id); setActive(null); }}>{label}</button>)}</nav>
    {message && <div className="rp-message" role="status">{message}<button aria-label="Đóng thông báo" onClick={() => setMessage("")}>×</button></div>}
    {!ready && <p>Đang chờ dữ liệu hợp lệ. Nếu có lỗi lưu trữ, bạn có thể khôi phục bản sao lưu trong Từ tùy chỉnh.</p>}
    {tab === "plans" && (currentPlan && active ? <StudySession key={`${active.plan}:${active.date}:${currentPlan.perSession}:${currentPlan.words.length}`} plan={currentPlan} date={active.date} onBack={() => setActive(null)} onComplete={() => {
      persist({ ...data, plans: data.plans.map(p => p.id === currentPlan.id ? { ...p, completed: [...new Set([...p.completed, active.date])] } : p) });
    }} /> : <>
      <div className="rp-heading"><div><h2>Lịch của bạn</h2><p>{data.plans.length} lịch · Tiến độ lưu trên trình duyệt này</p></div><button className="rp-primary" disabled={!ready} onClick={() => { setEditing(null); setTab("setup"); }}><Plus size={17} /> Tạo lịch</button></div>
      {!data.plans.length && <section className="rp-empty"><RotateCcw size={40} /><h3>Bắt đầu một nhịp học mới</h3><p>Chọn khoảng ngày, nguồn từ và số từ mới mỗi buổi.<br />Các buổi sau tự bao gồm phần ôn của những buổi trước.</p></section>}
      {data.plans.map(plan => {
        const due = plan.dates.filter(d => d <= localDate() && !plan.completed.includes(d));
        const remaining = Math.max(0, plan.words.length - plan.dates.length * plan.perSession);
        return <article className="rp-panel" key={plan.id}><div className="rp-heading"><div><h2>{plan.name}</h2><p>{plan.words.length} mục · {plan.perSession} từ mới/buổi · {plan.time} · {plan.completed.length}/{plan.dates.length} buổi hoàn thành</p></div><span className="rp-badge">{due.length ? `${due.length} buổi đến hạn` : "Theo nhịp của bạn"}</span></div>
          {remaining > 0 && <p className="rp-warning">Còn {remaining} mục chưa được xếp vào buổi nào. Hãy thêm ngày hoặc tăng số từ mới.</p>}
          <div className="rp-actions"><button onClick={() => edit(plan)}>Sửa lịch</button><button onClick={() => enableReminder(plan)}>{plan.reminder ? "Tắt nhắc học" : "Bật nhắc học"}</button><button onClick={() => download("repeat.ics", calendarFile(plan), "text/calendar;charset=utf-8")}><Download size={15} /> Xuất lịch .ics</button><button onClick={() => { if (window.confirm(`Xóa lịch “${plan.name}” và tiến độ của lịch này?`)) persist({ ...data, plans: data.plans.filter(p => p.id !== plan.id) }); }}>Xóa</button></div>
          <div className="rp-sessions">{plan.dates.map((date, i) => { const s = sessionWords(plan, i), done = plan.completed.includes(date); return <button key={date} className={done ? "done" : date <= localDate() ? "due" : ""} onClick={() => setActive({ plan: plan.id, date })}><strong>{done && <Check size={15} />}{date.split("-").reverse().join("/")}</strong><span>{s.newCount} mới + {s.oldCount} ôn</span><small>{done ? "Đã hoàn thành · Ôn lại" : date > localDate() ? "Học trước" : "Bắt đầu học"}</small></button>; })}</div>
        </article>;
      })}
      <p className="rp-note">Nhắc trên trình duyệt cần app đang mở và quyền thông báo. File .ics có lời nhắc trước 10 phút, theo giờ địa phương; ứng dụng lịch có thể yêu cầu bật thông báo riêng.</p>
    </>)}
    {tab === "setup" && <div className="rp-setup"><section className="rp-panel"><span className="rp-kicker">01 / NHỊP HỌC</span><h2>{editing ? "Chỉnh sửa lịch" : "Thiết lập ngày học"}</h2>
      <label>Tên lịch<input value={name} maxLength={120} onChange={e => setName(e.target.value)} /></label>
      <div className="rp-fields"><label>Từ ngày<input type="date" value={start} onInput={e => setStart(e.currentTarget.value)} onChange={e => setStart(e.target.value)} /></label><label>Đến ngày<input type="date" value={end} onInput={e => setEnd(e.currentTarget.value)} onChange={e => setEnd(e.target.value)} /></label></div>
      <label>Cách chọn ngày<select value={mode} onChange={e => { const m = e.target.value as typeof mode; setMode(m); setValue(m === "interval" ? "2" : m === "month" ? "1,3,5,7" : start); }}><option value="interval">Cách nhau N ngày</option><option value="month">Các ngày trong mỗi tháng</option><option value="custom">Chọn các ngày riêng</option></select></label>
      <label>{mode === "interval" ? "Khoảng cách (ngày)" : mode === "month" ? "Ngày trong tháng (ví dụ 1,3,5,7)" : "Các ngày YYYY-MM-DD, cách nhau bằng dấu phẩy"}<input value={value} onChange={e => setValue(e.target.value)} /></label>
      <div className="rp-fields"><label>Từ mới mỗi buổi<input type="number" min={1} max={5000} value={perSession || ""} onChange={e => setPerSession(+e.target.value)} /></label><label>Giờ nhắc học<input type="time" value={time} onChange={e => setTime(e.target.value)} /></label></div>
      <p className="rp-note">Ngày không tồn tại (như 31/2) được bỏ qua. Mỗi buổi ôn toàn bộ từ của các buổi trước, kể cả buổi chưa đánh dấu hoàn thành.</p>
      <div className="rp-preview"><strong>{dateError || `${dates.length} buổi · Đã chọn ${selected.size} mục`}</strong>{dates.slice(0, 4).map((d, i) => <p key={d}>{d.split("-").reverse().join("/")}<span>{Math.min((i + 1) * perSession, selected.size)} mục</span></p>)}{selected.size > dates.length * perSession && <p className="rp-warning">Còn {selected.size - dates.length * perSession} mục chưa có buổi học.</p>}</div>
      {editing && <p className="rp-warning">Lưu thay đổi sẽ đặt lại trạng thái hoàn thành của lịch này. Nếu đã nhập .ics, cần cập nhật lại trong ứng dụng lịch.</p>}
      <button className="rp-primary rp-wide" disabled={!ready || !!dateError || !selected.size} onClick={savePlan}>Lưu lịch học</button>
    </section><section className="rp-panel"><span className="rp-kicker">02 / NỘI DUNG</span><h2>Chọn điều bạn muốn nhớ</h2><p>Chọn cả bài, nhóm hoặc từng từ. Thứ tự học theo danh sách nguồn, bộ custom theo thứ tự dòng nhập.</p>
      <label>Nguồn / bài / nhóm<select value={group} onChange={e => setGroup(e.target.value)}><option value="">Tất cả nguồn ({words.length})</option>{groups.map(g => <option key={g}>{g}</option>)}</select></label>
      <label>Tìm từ, ý nghĩa, cách đọc<input placeholder="学校, trường học, hello…" value={query} onChange={e => setQuery(e.target.value)} /></label>
      <div className="rp-actions"><button onClick={() => setSelected(new Set([...selected, ...filtered.map(w => w.id)]))}>Chọn {filtered.length} mục đang lọc</button><button onClick={() => { const next = new Set(selected); filtered.forEach(w => next.delete(w.id)); setSelected(next); }}>Bỏ nhóm đang lọc</button><button onClick={() => setSelected(new Set())}>Bỏ tất cả ({selected.size})</button></div>
      <div className="rp-picker">{filtered.slice(0, 300).map(w => <label key={w.id} className="rp-word-check"><input type="checkbox" checked={selected.has(w.id)} onChange={e => { const next = new Set(selected); if (e.target.checked) next.add(w.id); else next.delete(w.id); setSelected(next); }} /><span><strong>{w.term}</strong><small>{w.meaning || w.reading} · {w.group}</small></span></label>)}{filtered.length > 300 && <p>Hiển thị 300/{filtered.length} mục. Lọc theo nhóm hoặc tìm kiếm để chọn chi tiết; nút chọn nhóm áp dụng cho toàn bộ kết quả.</p>}{!filtered.length && <p>Không tìm thấy mục phù hợp.</p>}</div>
    </section></div>}
    {tab === "import" && <section className="rp-panel"><span className="rp-kicker">TỪ CỦA BẠN · NGÔN NGỮ CỦA BẠN</span><h2>Nhập bộ từ tùy chỉnh</h2><p>{data.custom.length} mục tùy chỉnh đã lưu. Hỗ trợ tiếng Nhật, tiếng Anh và các ngôn ngữ khác.</p>
      <div className="rp-actions"><button onClick={() => download("repeat-template.csv", csvTemplate, "text/csv;charset=utf-8")}>Tải mẫu CSV</button><button onClick={() => download("repeat-template.json", jsonTemplate, "application/json")}>Tải mẫu JSON</button></div>
      <p className="rp-note">order = STT · term = tên từ · meaning = ý nghĩa · reading = cách đọc · wordType = loại từ · language = ja/en · group = nhóm. Bắt buộc tên từ và ý nghĩa. Thêm cột phonetic:Tên phiên âm tùy ý (IPA UK, IPA US, Romaji, On, Kun…). JSON dùng mảng phonetics gồm label/value. Lưu CSV dạng UTF-8; STT dùng để hiển thị, thứ tự dòng quyết định thứ tự học.</p>
      <label className="rp-upload">Chọn file CSV hoặc JSON (tối đa 5 MB)<input type="file" accept=".csv,.json" disabled={!ready} onChange={async e => {
        const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
        setDraft([]);
        try { if (file.size > 5 * 1024 * 1024) throw new Error("File vượt quá 5 MB."); if (!/\.(csv|json)$/i.test(file.name)) throw new Error("Hãy chọn file CSV hoặc JSON."); setDraft(importWords(await file.text(), file.name.toLowerCase().endsWith(".json") ? "json" : "csv", crypto.randomUUID())); setMessage("Đã đọc file. Kiểm tra bản xem trước rồi nhấn Nhập bộ từ."); }
        catch (error) { setMessage((error as Error).message); }
      }} /></label>
      {!!draft.length && <><h3>Xem trước {draft.length} mục</h3><WordList words={draft.slice(0, 20)} /><p>Hiển thị tối đa 20 mục đầu. Nhập file sẽ thêm bộ mới, không thay thế bộ cũ.</p><button className="rp-primary" onClick={() => { if (persist({ ...data, custom: [...data.custom, ...draft] })) { setDraft([]); setMessage("Đã nhập bộ từ. Bạn có thể chọn chúng trong Thiết lập lịch."); } }}>Nhập {draft.length} mục</button></>}
      <hr /><h3>Sao lưu và khôi phục</h3><p className="rp-note">Lưu file dự phòng để chuyển thiết bị hoặc tránh mất dữ liệu khi xóa dữ liệu trình duyệt.</p>
      <button disabled={!ready} onClick={() => download("repeat-backup.json", JSON.stringify(data, null, 2), "application/json")}>Tải bản sao lưu</button>
      <label>Khôi phục toàn bộ lịch và từ tùy chỉnh<input type="file" accept=".json" onChange={async e => { const file = e.target.files?.[0]; e.target.value = ""; if (!file) return; try { if (file.size > 20 * 1024 * 1024) throw new Error("Bản sao lưu vượt quá 20 MB."); const restored = decodeRepeat(await file.text()); if (window.confirm(`Thay thế dữ liệu Repeat hiện tại bằng ${restored.plans.length} lịch và ${restored.custom.length} từ tùy chỉnh?`)) { if (persist(restored)) { setActive(null); setSelected(new Set()); setEditing(null); setDraft([]); setMessage("Đã khôi phục bản sao lưu."); } } } catch (error) { setMessage((error as Error).message); } }} /></label>
    </section>}
  </main>;
}

function WordList({ words }: { words: StudyWord[] }) {
  return <div className="rp-table-wrap"><table><thead><tr><th>STT</th><th>Từ / cụm</th><th>Ý nghĩa</th><th>Cách đọc & phiên âm</th><th>Loại từ</th></tr></thead><tbody>{words.map(w => <tr key={w.id}><td>{w.order}</td><td lang={w.language}><strong>{w.term}</strong></td><td>{w.meaning || "Chưa có nghĩa trong nguồn"}</td><td>{w.reading}{w.phonetics.map((p, i) => <small key={i}>{p.label}: {p.value}</small>)}</td><td>{w.wordType || "—"}</td></tr>)}</tbody></table></div>;
}
function StudySession({ plan, date, onBack, onComplete }: { plan: StudyPlan; date: string; onBack: () => void; onComplete: () => void }) {
  const words = sessionWords(plan, plan.dates.indexOf(date)).words;
  const [mode, setMode] = useState<"list" | "flashcard" | "quiz">("list");
  const [index, setIndex] = useState(0), [flipped, setFlipped] = useState(false);
  const [answer, setAnswer] = useState(""), [checked, setChecked] = useState(false), [correct, setCorrect] = useState(0), [finished, setFinished] = useState(false);
  const word = words[index];
  const expected = word.meaning || word.reading;
  const normalize = (s: string) => s.normalize("NFKC").toLocaleLowerCase().trim().replace(/\s+/g, " ");
  const right = normalize(answer) === normalize(expected);
  function reset(nextMode: typeof mode) { setMode(nextMode); setIndex(0); setFlipped(false); setAnswer(""); setChecked(false); setCorrect(0); setFinished(false); }
  return <section className="rp-panel"><button onClick={onBack}>← Danh sách lịch</button><div className="rp-heading"><div><h2>{plan.name}</h2><p>{date.split("-").reverse().join("/")} · {words.length} mục cộng dồn</p></div><button className="rp-primary" onClick={onComplete} disabled={plan.completed.includes(date)}>{plan.completed.includes(date) ? "Đã hoàn thành" : "Đánh dấu hoàn thành buổi"}</button></div>
    <div className="rp-tabs" role="group" aria-label="Chế độ học">{(["list", "flashcard", "quiz"] as const).map(m => <button key={m} aria-pressed={mode === m} onClick={() => reset(m)}>{m === "list" ? "Danh sách" : m === "flashcard" ? "Flashcard" : "Quiz"}</button>)}</div>
    {mode === "list" ? <WordList words={words} /> : mode === "flashcard" ? <><p>{index + 1} / {words.length} · Chạm thẻ để lật</p><button className="rp-flashcard" onClick={() => setFlipped(!flipped)} aria-label={flipped ? "Xem mặt trước" : "Lật xem đáp án"}>{flipped ? <><strong>{word.meaning || word.reading}</strong><span>{word.reading}</span>{word.phonetics.map((p, i) => <small key={i}>{p.label}: {p.value}</small>)}<small>{word.wordType}</small></> : <><small>{word.group}</small><strong lang={word.language}>{word.term}</strong><span>Xem ý nghĩa & cách đọc</span></>}</button><div className="rp-actions"><button disabled={index === 0} onClick={() => { setIndex(index - 1); setFlipped(false); }}>← Trước</button><button disabled={index === words.length - 1} onClick={() => { setIndex(index + 1); setFlipped(false); }}>Tiếp →</button></div></> : finished ? <div className="rp-empty"><h3>Kết quả: {correct}/{words.length}</h3><p>Đã kiểm tra hết các mục của buổi này.</p><button onClick={() => reset("quiz")}>Làm lại quiz</button></div> : <form className="rp-quiz" onSubmit={e => { e.preventDefault(); if (!checked) { setChecked(true); if (right) setCorrect(correct + 1); } else if (index === words.length - 1) setFinished(true); else { setIndex(index + 1); setAnswer(""); setChecked(false); } }}><p>Câu {index + 1}/{words.length} · Nhập {word.meaning ? "ý nghĩa" : "cách đọc"} theo nguồn</p><h3 lang={word.language}>{word.term}</h3><label>Câu trả lời<input autoComplete="off" value={answer} disabled={checked} onChange={e => setAnswer(e.target.value)} /></label>{checked && <div role="status" className="rp-preview"><strong>{right ? "Chính xác!" : "Chưa khớp đáp án trong nguồn."}</strong><p>Đáp án: {expected}</p>{!right && <small>Quiz so khớp văn bản, chưa chấm được các cách diễn đạt đồng nghĩa.</small>}</div>}<button className="rp-primary" disabled={!checked && !answer.trim()}>{checked ? index === words.length - 1 ? "Xem kết quả" : "Câu tiếp theo" : "Kiểm tra"}</button></form>}
  </section>;
}
