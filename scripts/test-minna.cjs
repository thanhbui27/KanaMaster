/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS runner installs a TypeScript require hook for tests. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  module._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
};
const { normalizeLesson, exerciseParts } = require('../src/lib/minna/adapter.ts');
const { createQuiz, hasKanji } = require('../src/lib/minna/quiz.ts');
const { decodeProgress, emptyProgress, recordQuiz, progressMetrics } = require('../src/lib/minna/progress.ts');
const directory = path.join(__dirname, '../src/data/minna-riki');
const lessons = fs.readdirSync(directory).filter(f => /^lesson-\d+\.json$/.test(f)).map(file => {
  const raw = JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8'));
  const lesson = normalizeLesson(raw);
  assert.equal(lesson.grammar.length + lesson.vocabularySections.length + lesson.practiceSections.length, raw.sections.length, `No dropped sections in lesson ${lesson.id}`);
  if (lesson.practiceSections.length) assert.ok(lesson.exercises.length > 0, `Exercises available in ${lesson.id}`);
  for (const exercise of lesson.exercises) {
    assert.ok(exercise.manualCheck);
    assert.equal(exercise.answer, undefined);
    assert.ok(exercise.parts.some(p => p.type === 'input'));
  }
  const rows = raw.sections.filter(s => s.kind === 'vocabulary').flatMap(s => s.blocks.filter(b => b.type === 'table').flatMap(b => b.rows.slice(1))).filter(row => row[1]?.text.trim() && row[3]?.text.trim());
  assert.equal(lesson.vocabulary.length, rows.length, `All vocabulary rows in ${lesson.id}`);
  return lesson;
});
const first = lessons.find(l => l.id === 1);
assert.equal(first.vocabulary.length, 48);
assert.equal(first.grammar.length, 5);
assert.equal(first.exercises.length, 11);
assert.equal(first.exercises[0].parts.filter(p => p.type === 'input').length, 4, 'Keep multi-line dialogue together');
assert.equal(first.exercises[6].parts.filter(p => p.type === 'input').length, 2, 'Both bracketed choices remain interactive');
assert.deepEqual(first.vocabulary[0], { id: '1-word-1', kana: 'わたし', kanji: '私', meaning: 'Tôi' });
assert.ok(exerciseParts('（台風です…　　　）').some(p => p.type === 'input'));
assert.ok(exerciseParts('（これ、その、ここ）').some(p => p.type === 'input' && p.options.length === 3));
assert.ok(exerciseParts('（例です）').every(p => p.type === 'text'), 'Do not turn normal parentheticals into blanks');
for (const lesson of lessons) for (const mode of ['ja-vi', 'vi-ja', 'kana-kanji', 'mixed']) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const quiz = createQuiz(lesson.vocabulary, mode, 20);
    assert.ok(quiz.length <= 20);
    assert.equal(new Set(quiz.map(q => q.word.id)).size, quiz.length);
    for (const q of quiz) {
      assert.equal(q.options.length, 4);
      assert.equal(new Set(q.options).size, 4);
      assert.ok(q.options.includes(q.answer));
      if (q.mode === 'kana-kanji') assert.ok(hasKanji(q.word));
      const sourceValues = lesson.vocabulary.map(w => q.mode === 'ja-vi' ? w.meaning : q.mode === 'vi-ja' ? w.kana : w.kanji);
      assert.ok(q.options.every(option => sourceValues.includes(option)));
    }
  }
}
const homophones = [{ id: 'a', kana: 'みます', kanji: '見る', meaning: 'xem' }, { id: 'b', kana: 'みます', kanji: '診る', meaning: 'khám' }, { id: 'c', kana: 'きます', kanji: '来る', meaning: 'đến' }, { id: 'd', kana: 'いきます', kanji: '行く', meaning: 'đi' }];
assert.ok(createQuiz(homophones, 'kana-kanji', 99).every(q => q.word.id !== 'a' && q.word.id !== 'b'), 'Ambiguous homophones excluded');
const focus = [first.vocabulary[0].id];
assert.ok(createQuiz(first.vocabulary, 'mixed', 99, focus).every(q => focus.includes(q.word.id)));
assert.deepEqual(decodeProgress(null), emptyProgress());
assert.deepEqual(decodeProgress({ learned: 'bad', answers: { bad: 12 }, quiz: { attempts: -1 } }), emptyProgress());
let p = recordQuiz(emptyProgress(), 8, 10, [focus[0]]);
p = recordQuiz(p, 15, 20, []);
assert.equal(p.quiz.attempts, 2);
assert.equal(p.quiz.bestCorrect, 8, 'Compare percentages across quiz lengths');
assert.equal(p.quiz.bestTotal, 10);
assert.ok(p.review.includes(focus[0]));
assert.deepEqual(decodeProgress(JSON.parse(JSON.stringify(p))), p, 'Progress survives JSON round trip');
assert.equal(progressMetrics(first, emptyProgress()).overall, 0);
const complete = { ...emptyProgress(), learned: first.vocabulary.map(w => w.id), grammar: first.grammar.map(s => s.id), completed: first.exercises.map(e => e.id), quiz: { ...emptyProgress().quiz, bestCorrect: 10, bestTotal: 10 } };
assert.equal(progressMetrics(first, complete).overall, 100);
assert.equal(progressMetrics(first, { ...complete, learned: ['unknown'] }).learned, 0);
console.log(`PASS: ${lessons.length} lessons, ${lessons.reduce((n,l) => n + l.vocabulary.length, 0)} vocabulary items, ${lessons.reduce((n,l) => n + l.exercises.length, 0)} exercises; quiz integrity, ambiguity, progress and source coverage.`);
