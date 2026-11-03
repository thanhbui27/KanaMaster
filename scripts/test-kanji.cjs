const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "../src/data/kanji");
const index = JSON.parse(fs.readFileSync(path.join(root, "index.json"), "utf8"));
const levelLists = JSON.parse(fs.readFileSync(path.join(root, "jlpt-levels.json"), "utf8"));
const radicals = JSON.parse(fs.readFileSync(path.join(root, "radicals.json"), "utf8"));
const imported = JSON.parse(fs.readFileSync(path.join(root, "openjlpt.json"), "utf8"));
const n5Additions = JSON.parse(fs.readFileSync(path.join(root, "n5-additions.json"), "utf8"));
const hanViet = JSON.parse(fs.readFileSync(path.join(root, "hanviet.json"), "utf8"));
const levels = ["N5", "N4", "N3", "N2", "N1"];
assert.deepEqual(Object.keys(levelLists), levels);
const levelByCharacter = new Map();
for (const level of levels) for (const character of levelLists[level]) {
  assert(!levelByCharacter.has(character), `duplicate level for ${character}`);
  levelByCharacter.set(character, level);
}
const ids = new Set();
const characters = new Set();
let total = 0;

for (const chapter of index) {
  const entries = JSON.parse(fs.readFileSync(path.join(root, chapter.file), "utf8"));
  assert.equal(entries.length, chapter.count, `chapter ${chapter.chapter}: count`);
  assert.deepEqual(entries.map(entry => entry.kanji), chapter.kanji, `chapter ${chapter.chapter}: index`);
  entries.forEach((entry, position) => {
    assert.equal(entry.chapter, chapter.chapter);
    assert.equal(entry.order, position + 1);
    assert.equal(entry.id, `ch${String(chapter.chapter).padStart(2, "0")}-${String(position + 1).padStart(2, "0")}`);
    assert(!ids.has(entry.id), `duplicate id ${entry.id}`);
    assert(!characters.has(entry.kanji), `duplicate kanji ${entry.kanji}`);
    assert(levelByCharacter.has(entry.kanji), `missing JLPT study level ${entry.kanji}`);
    assert(entry.meaning.trim() && entry.kunyomi.trim() && entry.onyomi.trim(), `missing study field ${entry.id}`);
    assert(!/・\s|\s・|、\s/.test(entry.kunyomi), `broken reading spacing ${entry.id}`);
    assert(Array.isArray(entry.mnemonicText) && entry.mnemonicText.every(line => line.trim() && !/^(?:KUN|ON|Ý nghĩa):/.test(line)), `unreviewed mnemonic ${entry.id}`);
    ids.add(entry.id);
    characters.add(entry.kanji);
  });
  total += entries.length;
}

assert.equal(index.length, 8);
assert.equal(total, 95);
assert.equal(total, 95);
assert.equal(levelLists.N5.length, 139);
assert.equal(Object.keys(n5Additions).length, 44);
for (const character of characters) assert.equal(levelByCharacter.get(character), "N5", `${character} must remain N5`);
for (const [character, addition] of Object.entries(n5Additions)) {
  assert.equal(levelByCharacter.get(character), "N5", `${character} addition level`);
  assert(addition.hanViet.trim() && addition.meaning.trim(), `missing Vietnamese study content for ${character}`);
}
assert.equal(imported.length, 2383);
assert.equal(Object.keys(hanViet).length, 2134);
assert.equal(levelByCharacter.size, imported.length);
const importedCharacters = new Set();
for (const entry of imported) {
  assert(!importedCharacters.has(entry.kanji), `duplicate import ${entry.kanji}`);
  importedCharacters.add(entry.kanji);
  assert(levelByCharacter.has(entry.kanji), `missing level ${entry.kanji}`);
  assert(entry.meaningEnglish && entry.radical && entry.radicalNumber, `missing dictionary data ${entry.kanji}`);
  assert(!entry.exampleWord || entry.exampleReading, `missing example reading ${entry.kanji}`);
}
for (const [character, reading] of Object.entries(hanViet)) {
  assert(importedCharacters.has(character), `unknown Hán Việt entry ${character}`);
  assert(reading.trim(), `empty Hán Việt reading ${character}`);
}
const radicalCharacters = new Set();
let previousNumber = 0;
for (const group of radicals) {
  assert(Number.isInteger(group.number) && group.number > previousNumber && group.number <= 214, `invalid radical number ${group.number}`);
  assert.equal([...group.radical].length, 1, `invalid radical glyph ${group.radical}`);
  assert(group.kanji.length > 0, `empty radical ${group.radical}`);
  for (const character of group.kanji) {
    assert(importedCharacters.has(character), `unknown radical entry ${character}`);
    assert(!radicalCharacters.has(character), `duplicate radical entry ${character}`);
    radicalCharacters.add(character);
  }
  previousNumber = group.number;
}
assert.equal(radicals.length, 199);
assert.equal(radicalCharacters.size, imported.length);
console.log(`Kanji data valid: ${total} original N5, ${levelLists.N5.length} total N5, ${imported.length} total N5–N1, ${radicals.length} radicals.`);
