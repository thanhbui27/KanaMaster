export type StudyWord = {
  id: string; order: string; term: string; meaning: string; reading: string;
  phonetics: { label: string; value: string }[]; wordType: string; language: string; group: string;
};
export type StudyPlan = {
  id: string; name: string; dates: string[]; perSession: number; time: string;
  words: StudyWord[]; completed: string[]; reminder: boolean; sessionSizes?: number[]; sessionGroups?: string[][];
};
export type RepeatStore = { version: 1; custom: StudyWord[]; plans: StudyPlan[] };
export const REPEAT_KEY = "kanamaster-repeat-v1";
export const EMPTY_REPEAT: RepeatStore = { version: 1, custom: [], plans: [] };
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value + "T12:00:00Z").toISOString().slice(0, 10) === value;
}
export function scheduleDates(start: string, end: string, mode: "interval" | "month" | "custom", value: string): string[] {
  if (!validDate(start) || !validDate(end) || start > end) throw new Error("Chọn khoảng ngày hợp lệ, ngày kết thúc không trước ngày bắt đầu.");
  const span = (Date.parse(end) - Date.parse(start)) / 86400000;
  if (span > 1095) throw new Error("Mỗi lịch tối đa 3 năm.");
  const tokens = value.split(/[,;\s]+/).filter(Boolean);
  const numbers = tokens.map(Number);
  if (mode === "interval" && (!/^\d+$/.test(value) || +value < 1 || +value > 366)) throw new Error("Khoảng cách phải là số nguyên từ 1 đến 366 ngày.");
  if (mode === "month" && (!numbers.length || numbers.some(n => !Number.isInteger(n) || n < 1 || n > 31))) throw new Error("Nhập các ngày trong tháng từ 1 đến 31, ví dụ 1,3,5,7.");
  if (mode === "custom") {
    if (!tokens.length || tokens.some(d => !validDate(d) || d < start || d > end)) throw new Error("Các ngày riêng phải có dạng YYYY-MM-DD và nằm trong khoảng đã chọn.");
    return [...new Set(tokens)].sort();
  }
  const dates: string[] = [];
  for (let i = 0; i <= span; i++) {
    const day = new Date(Date.parse(start) + i * 86400000).toISOString().slice(0, 10);
    if (mode === "interval" ? i % +value === 0 : numbers.includes(+day.slice(-2))) dates.push(day);
  }
  if (!dates.length) throw new Error("Không có buổi học trong khoảng đã chọn.");
  return dates;
}
export function sessionWords(plan: StudyPlan, index: number) {
  if (plan.sessionGroups?.length === plan.dates.length) {
    const previousGroups = new Set(plan.sessionGroups.slice(0, index).flat());
    const currentGroups = new Set(plan.sessionGroups.slice(0, index + 1).flat());
    const previousWords = plan.words.filter(w => previousGroups.has(`group:${w.group}`) || previousGroups.has(`word:${w.id}`));
    const words = plan.words.filter(w => currentGroups.has(`group:${w.group}`) || currentGroups.has(`word:${w.id}`));
    const ids = new Set(previousWords.map(w => w.id));
    return { words, oldCount: previousWords.length, newCount: words.filter(w => !ids.has(w.id)).length };
  }
  const sizes = plan.sessionSizes?.length === plan.dates.length ? plan.sessionSizes : plan.dates.map(() => plan.perSession);
  const previous = Math.min(sizes.slice(0, index).reduce((a, b) => a + b, 0), plan.words.length);
  const total = Math.min(previous + sizes[index], plan.words.length);
  return { words: plan.words.slice(0, total), oldCount: previous, newCount: total - previous };
}
// Handles quoted commas, escaped quotes and multiline cells (including Excel BOM).
export function csvRows(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], cell = "", quoted = false, closed = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else cell += c;
    } else if (c === '"' && !cell && !closed) quoted = true;
    else if (c === "," || c === "\n" || c === "\r") {
      row.push(cell); cell = ""; closed = false;
      if (c !== ",") { if (row.some(v => v.trim())) rows.push(row); row = []; if (c === "\r" && text[i + 1] === "\n") i++; }
    } else { if (closed || c === '"') throw new Error("CSV có dấu ngoặc kép không hợp lệ."); cell += c; }
  }
  if (quoted) throw new Error("CSV thiếu dấu ngoặc kép đóng.");
  row.push(cell); if (row.some(v => v.trim())) rows.push(row);
  return rows;
}
export function importWords(text: string, format: "csv" | "json", batch: string): StudyWord[] {
  let records: Record<string, unknown>[];
  if (format === "json") {
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed) || parsed.some(r => !r || typeof r !== "object" || Array.isArray(r))) throw new Error("JSON phải là một mảng các từ theo mẫu.");
    records = parsed;
  } else {
    const [headers, ...rows] = csvRows(text);
    if (!headers || !headers.includes("term") || !headers.includes("meaning")) throw new Error("CSV cần cột term và meaning. Hãy tải mẫu bên dưới.");
    if (new Set(headers).size !== headers.length) throw new Error("CSV có tên cột trùng nhau.");
    records = rows.map((row, i) => {
      if (row.length !== headers.length) throw new Error(`Dòng ${i + 2}: số cột không khớp mẫu.`);
      return Object.fromEntries(headers.map((h, j) => [h, row[j]]));
    });
  }
  if (!records.length || records.length > 5000) throw new Error("Mỗi lần nhập cần từ 1 đến 5.000 mục.");
  return records.map((r, i) => {
    const field = (key: string) => {
      if (r[key] == null) return "";
      if (typeof r[key] !== "string" && typeof r[key] !== "number") throw new Error(`Mục ${i + 1}: ${key} phải là văn bản.`);
      return String(r[key]).trim();
    };
    const term = field("term"), meaning = field("meaning");
    if (!term || !meaning) throw new Error(`Mục ${i + 1}: thiếu tên từ hoặc ý nghĩa.`);
    const phonetics: StudyWord["phonetics"] = [];
    if (r.phonetics != null) {
      if (!Array.isArray(r.phonetics)) throw new Error(`Mục ${i + 1}: phonetics phải là mảng label/value.`);
      for (const p of r.phonetics) {
        if (!p || typeof p.label !== "string" || typeof p.value !== "string") throw new Error(`Mục ${i + 1}: phiên âm cần label và value.`);
        if (p.value.trim()) phonetics.push({ label: p.label.trim(), value: p.value.trim() });
      }
    }
    for (const key of Object.keys(r).filter(k => k.startsWith("phonetic:"))) {
      const value = field(key); if (value) phonetics.push({ label: key.slice(9), value });
    }
    return { id: `custom:${batch}:${i}`, order: field("order") || String(i + 1), term, meaning, reading: field("reading"),
      phonetics, wordType: field("wordType"), language: field("language") || "ja", group: field("group") || "Từ tùy chỉnh" };
  });
}
function isWord(v: unknown): v is StudyWord {
  if (!v || typeof v !== "object") return false;
  const w = v as StudyWord;
  return [w.id, w.order, w.term, w.meaning, w.reading, w.wordType, w.language, w.group].every(s => typeof s === "string") && Array.isArray(w.phonetics) && w.phonetics.every(p => p && typeof p.label === "string" && typeof p.value === "string");
}
export function decodeRepeat(raw: string | null): RepeatStore {
  if (!raw) return { version: 1, custom: [], plans: [] };
  const data = JSON.parse(raw) as RepeatStore;
  if (data.version !== 1 || !Array.isArray(data.custom) || !data.custom.every(isWord) || !Array.isArray(data.plans) || !data.plans.every(p =>
    p && typeof p.id === "string" && typeof p.name === "string" && typeof p.reminder === "boolean" && /^([01]\d|2[0-3]):[0-5]\d$/.test(p.time) &&
    Number.isInteger(p.perSession) && p.perSession > 0 && Array.isArray(p.dates) && p.dates.length > 0 && p.dates.every(d => typeof d === "string" && validDate(d)) && new Set(p.dates).size === p.dates.length && p.dates.join() === [...p.dates].sort().join() &&
    (p.sessionSizes === undefined || Array.isArray(p.sessionSizes) && p.sessionSizes.length === p.dates.length && p.sessionSizes.every(n => Number.isInteger(n) && n > 0)) &&
    (p.sessionGroups === undefined || Array.isArray(p.sessionGroups) && p.sessionGroups.length === p.dates.length && p.sessionGroups.every(groups => Array.isArray(groups) && groups.every(g => typeof g === "string"))) && Array.isArray(p.words) && p.words.length > 0 && p.words.every(isWord) &&
    Array.isArray(p.completed) && p.completed.every(d => p.dates.includes(d)))) throw new Error("Dữ liệu Repeat không hợp lệ. Dữ liệu cũ được giữ nguyên; hãy khôi phục bản sao lưu hợp lệ.");
  return data;
}
export function calendarFile(plan: StudyPlan) {
  const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//KanaMaster//Repeat//VI", "CALSCALE:GREGORIAN"];
  plan.dates.forEach((date, i) => {
    const session = sessionWords(plan, i);
    lines.push("BEGIN:VEVENT", `UID:${plan.id}-${date}@kanamaster`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
      `DTSTART:${date.replaceAll("-", "")}T${plan.time.replace(":", "")}00`, "DURATION:PT30M", `SUMMARY:${escape(plan.name)}`,
      `DESCRIPTION:${escape(`${session.newCount} từ mới + ${session.oldCount} từ ôn. Mở KanaMaster /repeat để học.`)}`,
      "BEGIN:VALARM", "TRIGGER:-PT10M", "ACTION:DISPLAY", `DESCRIPTION:${escape(plan.name)}`, "END:VALARM", "END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  // RFC 5545: fold by UTF-8 octets, without splitting a Unicode code point.
  return lines.map(line => {
    let result = "", size = 0;
    for (const char of line) { const bytes = new TextEncoder().encode(char).length; if (size + bytes > 75) { result += "\r\n "; size = 1; } result += char; size += bytes; }
    return result;
  }).join("\r\n") + "\r\n";
}
