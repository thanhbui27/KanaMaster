/* eslint-disable @typescript-eslint/no-require-imports -- Standalone content checks. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, filename);
const { noteTopics } = require('../src/data/minna-notes.ts');
assert.deepEqual(noteTopics.map(t => t.id), ['numbers', 'clock', 'duration', 'counters', 'verbs']);
let count = 0;
for (const topic of noteTopics) for (const section of topic.sections) {
  assert.equal(new Set(section.rows.map(row => row.ja)).size, section.rows.length, `Unique entries in ${section.title}`);
  for (const row of section.rows) {
    for (const field of ['ja', 'kana', 'romaji', 'zh', 'pinyin', 'vi']) assert.ok(row[field]?.trim(), `${section.title}: missing ${field}`);
    assert.ok(!/[\u3400-\u9fff]/.test(row.kana), `Reading must not contain unread kanji: ${row.ja}`);
    count++;
  }
}
const get = (topic, ja) => noteTopics.find(t => t.id === topic).sections.flatMap(s => s.rows).find(r => r.ja === ja);
assert.equal(get('clock', '四時').kana, 'よじ');
assert.equal(get('clock', '九月').kana, 'くがつ');
assert.equal(get('clock', '一日').kana, 'ついたち');
assert.equal(get('duration', '一日').kana, 'いちにち');
assert.equal(get('duration', '三か月').zh, '三个月');
assert.equal(get('counters', '二十歳').kana, 'はたち');
assert.equal(get('counters', '四人').kana, 'よにん');
assert.equal(get('numbers', '六百').kana, 'ろっぴゃく');
assert.equal(get('verbs', '行く → 行って → 行った').kana, 'いく → いって → いった');
assert.equal(get('verbs', '来る → 来られる').kana, 'くる → こられる');
console.log(`PASS: 5 topics, ${count} multilingual entries; required readings/translations and key exceptions. Content still requires linguistic review, not just structural tests.`);
