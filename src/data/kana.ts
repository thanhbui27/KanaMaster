import { WRITING_KANA } from "@/data/writing-kana";

export type KanaScript = "hiragana" | "katakana";
export type KanaCategory = "basic" | "dakuten" | "yoon" | "small-tsu" | "long-vowel";

export type KanaEntry = {
  id: string;
  character: string;
  romaji: string;
  aliases: string[];
  script: KanaScript;
  category: KanaCategory;
  row: string;
  strokeCount?: number;
  audioKey: string | null;
};

const basicKana: KanaEntry[] = WRITING_KANA.map((kana) => ({
  ...kana,
  row: kana.row === "n-final" ? "w" : kana.row,
  category: "basic" as const,
  aliases: [],
  audioKey: kana.romaji,
}));

type Pair = [character: string, romaji: string, aliases?: string[]];

function entries(script: KanaScript, category: KanaCategory, row: string, values: Pair[]): KanaEntry[] {
  return values.map(([character, romaji, aliases = []], index) => ({
    id: `${script}-${category}-${row}-${romaji}-${index + 1}`,
    character,
    romaji,
    aliases,
    script,
    category,
    row,
    audioKey: category === "small-tsu" || category === "long-vowel" ? null : romaji,
  }));
}

const dakutenRows: Array<[string, Pair[]]> = [
  ["g", [["が", "ga"], ["ぎ", "gi"], ["ぐ", "gu"], ["げ", "ge"], ["ご", "go"]]],
  ["z", [["ざ", "za"], ["じ", "ji", ["zi"]], ["ず", "zu"], ["ぜ", "ze"], ["ぞ", "zo"]]],
  ["d", [["だ", "da"], ["ぢ", "ji", ["di"]], ["づ", "zu", ["du"]], ["で", "de"], ["ど", "do"]]],
  ["b", [["ば", "ba"], ["び", "bi"], ["ぶ", "bu"], ["べ", "be"], ["ぼ", "bo"]]],
  ["p", [["ぱ", "pa"], ["ぴ", "pi"], ["ぷ", "pu"], ["ぺ", "pe"], ["ぽ", "po"]]],
];

const hiraganaDakuten = dakutenRows.flatMap(([row, values]) => entries("hiragana", "dakuten", row, values));
const katakanaDakuten = dakutenRows.flatMap(([row, values]) => entries(
  "katakana",
  "dakuten",
  row,
  values.map(([character, romaji, aliases]) => [String.fromCharCode(character.charCodeAt(0) + 0x60), romaji, aliases]),
));

const yoonRomaji = [
  "kya", "kyu", "kyo", "sha", "shu", "sho", "cha", "chu", "cho",
  "nya", "nyu", "nyo", "hya", "hyu", "hyo", "mya", "myu", "myo",
  "rya", "ryu", "ryo", "gya", "gyu", "gyo", "ja", "ju", "jo",
  "bya", "byu", "byo", "pya", "pyu", "pyo",
];

const hiraganaYoonCharacters = [
  "きゃ", "きゅ", "きょ", "しゃ", "しゅ", "しょ", "ちゃ", "ちゅ", "ちょ",
  "にゃ", "にゅ", "にょ", "ひゃ", "ひゅ", "ひょ", "みゃ", "みゅ", "みょ",
  "りゃ", "りゅ", "りょ", "ぎゃ", "ぎゅ", "ぎょ", "じゃ", "じゅ", "じょ",
  "びゃ", "びゅ", "びょ", "ぴゃ", "ぴゅ", "ぴょ",
];

const katakanaYoonCharacters = [
  "キャ", "キュ", "キョ", "シャ", "シュ", "ショ", "チャ", "チュ", "チョ",
  "ニャ", "ニュ", "ニョ", "ヒャ", "ヒュ", "ヒョ", "ミャ", "ミュ", "ミョ",
  "リャ", "リュ", "リョ", "ギャ", "ギュ", "ギョ", "ジャ", "ジュ", "ジョ",
  "ビャ", "ビュ", "ビョ", "ピャ", "ピュ", "ピョ",
];

const yoonRows = ["k", "s", "t", "n", "h", "m", "r", "g", "j", "b", "p"];
const hiraganaYoon = yoonRows.flatMap((row, rowIndex) => entries(
  "hiragana",
  "yoon",
  row,
  hiraganaYoonCharacters.slice(rowIndex * 3, rowIndex * 3 + 3).map((value, index) => [value, yoonRomaji[rowIndex * 3 + index]]),
));
const katakanaYoon = yoonRows.flatMap((row, rowIndex) => entries(
  "katakana",
  "yoon",
  row,
  katakanaYoonCharacters.slice(rowIndex * 3, rowIndex * 3 + 3).map((value, index) => [value, yoonRomaji[rowIndex * 3 + index]]),
));

const specialKana: KanaEntry[] = [
  ...entries("hiragana", "small-tsu", "small-tsu", [["っ", "small tsu", ["tsu"]]]),
  ...entries("katakana", "small-tsu", "small-tsu", [["ッ", "small tsu", ["tsu"]]]),
  ...entries("katakana", "long-vowel", "long-vowel", [["ー", "long vowel", ["long vowel mark"]]]),
];

export const KANA_CATALOGUE: KanaEntry[] = [
  ...basicKana,
  ...hiraganaDakuten,
  ...katakanaDakuten,
  ...hiraganaYoon,
  ...katakanaYoon,
  ...specialKana,
];

export const KANA_BY_SCRIPT: Record<KanaScript, KanaEntry[]> = {
  hiragana: KANA_CATALOGUE.filter((kana) => kana.script === "hiragana"),
  katakana: KANA_CATALOGUE.filter((kana) => kana.script === "katakana"),
};

export const CHARACTER_TEST_KANA: Record<KanaScript, KanaEntry[]> = {
  hiragana: KANA_BY_SCRIPT.hiragana,
  katakana: KANA_BY_SCRIPT.katakana,
};

export type KanaRow = {
  key: string;
  category: KanaCategory;
  row: string;
  label: string;
  kana: KanaEntry[];
};

const BASIC_ROW_LABELS: Record<string, [string, string]> = {
  vowels: ["あ行 (Vowels)", "ア行 (Vowels)"],
  k: ["か行 (K-row)", "カ行 (K-row)"],
  s: ["さ行 (S-row)", "サ行 (S-row)"],
  t: ["た行 (T-row)", "タ行 (T-row)"],
  n: ["な行 (N-row)", "ナ行 (N-row)"],
  h: ["は行 (H-row)", "ハ行 (H-row)"],
  m: ["ま行 (M-row)", "マ行 (M-row)"],
  y: ["や行 (Y-row)", "ヤ行 (Y-row)"],
  r: ["ら行 (R-row)", "ラ行 (R-row)"],
  w: ["わ行 (W-row + N)", "ワ行 (W-row + N)"],
};

export function getKanaRowKey(category: KanaCategory, row: string) {
  return `${category}:${row}`;
}

export function getKanaRows(script: KanaScript, categories?: KanaCategory[]): KanaRow[] {
  const allowed = categories ? new Set(categories) : null;
  const groups = new Map<string, KanaRow>();
  KANA_BY_SCRIPT[script].forEach((kana) => {
    if (allowed && !allowed.has(kana.category)) return;
    const key = getKanaRowKey(kana.category, kana.row);
    const existing = groups.get(key);
    if (existing) {
      existing.kana.push(kana);
      return;
    }
    const label = kana.category === "basic"
      ? BASIC_ROW_LABELS[kana.row]?.[script === "hiragana" ? 0 : 1] ?? `${kana.row.toUpperCase()}-row`
      : kana.category === "dakuten" || kana.category === "yoon"
        ? `${kana.row.toUpperCase()}-row`
        : KANA_CATEGORY_LABELS[kana.category];
    groups.set(key, { key, category: kana.category, row: kana.row, label, kana: [kana] });
  });
  return [...groups.values()];
}

export function filterKanaByScope(script: KanaScript, categories: KanaCategory[], rows: string[]) {
  const categorySet = new Set(categories);
  const rowSet = new Set(rows);
  return KANA_BY_SCRIPT[script].filter((kana) => categorySet.has(kana.category) && rowSet.has(getKanaRowKey(kana.category, kana.row)));
}

export const KANA_CATEGORY_LABELS: Record<KanaCategory, string> = {
  basic: "Basic Kana",
  dakuten: "Dakuten / Handakuten",
  yoon: "Yōon",
  "small-tsu": "Small Tsu",
  "long-vowel": "Long Vowel",
};

export function getKanaById(id: string) {
  return KANA_CATALOGUE.find((kana) => kana.id === id) ?? null;
}

export function getKanaIdsInText(text: string, script: KanaScript) {
  return getKanaEntriesInText(text, script).entries.map((kana) => kana.id).filter((id, index, ids) => ids.indexOf(id) === index);
}

export function getKanaEntriesInText(text: string, script: KanaScript) {
  const catalogue = [...KANA_BY_SCRIPT[script]].sort((a, b) => b.character.length - a.character.length);
  const matched: KanaEntry[] = [];
  let complete = true;
  let cursor = 0;
  while (cursor < text.length) {
    const match = catalogue.find((kana) => text.startsWith(kana.character, cursor));
    if (match) {
      matched.push(match);
      cursor += match.character.length;
    } else {
      if (!/[\s。、！？!?]/u.test(text[cursor])) complete = false;
      cursor += 1;
    }
  }
  return { entries: matched, complete };
}
