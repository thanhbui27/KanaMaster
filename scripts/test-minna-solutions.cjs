/* eslint-disable @typescript-eslint/no-require-imports -- Standalone TypeScript test runner. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, filename);
};
const { normalizeLesson } = require('../src/lib/minna/adapter.ts');
const { attachSolutions, matchesReference, cleanSourceDisplay } = require('../src/lib/minna/solutions.ts');
const root = path.join(__dirname, '../src/data');
const stats = { reference: 0, sample: 0, 'source-issue': 0 };
const lessons = new Map();
for (const filename of fs.readdirSync(path.join(root, 'minna-riki')).filter(f => /^lesson-\d+\.json$/.test(f))) {
  const lesson = normalizeLesson(JSON.parse(fs.readFileSync(path.join(root, 'minna-riki', filename), 'utf8')));
  const file = JSON.parse(fs.readFileSync(path.join(root, 'minna-solutions', filename), 'utf8'));
  const attached = attachSolutions(lesson, file);
  assert.match(file.provenance, /không phải đáp án chính thức/);
  lessons.set(lesson.id, attached);
  for (const exercise of attached.exercises) {
    const s = exercise.solution;
    stats[s.status]++;
    assert.ok(s.explanation.trim().length > 0, `Explanation for ${exercise.id}`);
    assert.ok(exercise.manualCheck, 'Reference comparison must not silently become grading');
  }
  const stale = structuredClone(file);
  stale.solutions[0].question += ' changed';
  assert.throws(() => attachSolutions(lesson, stale), /Stale/);
  stale.solutions[0].question = file.solutions[0].question;
  stale.solutions[0].context += ' changed';
  assert.throws(() => attachSolutions(lesson, stale), /Stale/);
  assert.throws(() => attachSolutions(lesson, { ...file, solutions: file.solutions.slice(1) }), /mismatch/);
}
assert.equal(lessons.size, 49);
assert.equal(Object.values(stats).reduce((a, b) => a + b), 949);
assert.ok(matchesReference('ｂ.　寝ました。', ['寝ました']));
assert.ok(matchesReference(' あの 人は学生です。 ', ['あの人は学生です']));
assert.ok(!matchesReference('学生でした', ['学生です']), 'Do not erase tense');
assert.ok(!matchesReference('に', ['で']), 'Do not collapse particles');
assert.ok(!matchesReference('', ['X']), 'No attempt is not no-particle answer');
assert.ok(!matchesReference('食べます', ['食べません']), 'Do not erase negation');
const solution = (id, index) => lessons.get(id).exercises[index - 1].solution;
assert.deepEqual(solution(14, 7).answers, [['して'], ['泳いでい']], 'Respect suffix already outside the gap');
assert.deepEqual(solution(24, 7).answers, [['×', 'X']], 'Receiving/giving roles reversed in source statement');
assert.deepEqual(solution(47, 22).answers, [['使いやす'], ['複雑だ']], 'Appearance versus hearsay');
assert.deepEqual(solution(48, 13).answers, [['考えさせて']], 'Permission uses causative');
assert.deepEqual(solution(50, 7).answers, [['お貸しし']], 'Honorific stem retains し before ましょう');
assert.equal(solution(28, 13).status, 'source-issue');
const broken = lessons.get(28).exercises[12].question;
assert.ok(broken.length > 1000);
const display = cleanSourceDisplay(broken);
assert.ok(display.length < 1000, 'Hide imported Word payload');
assert.ok(!display.includes('v:shape'));
assert.ok(display.includes('習慣'));
assert.ok(lessons.get(24).exercises[0].parts.some(p => p.type === 'input' && p.options?.length === 2));
assert.ok(lessons.get(40).exercises[26].parts.some(p => p.type === 'input' && p.options?.length === 3));
console.log('PASS: full solution coverage, exact prompt/context binding, field and choice integrity, typo guards, conjugation regressions and typography comparison.', stats);
