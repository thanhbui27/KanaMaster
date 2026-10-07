# KanaMaster PWA

Mobile-first Next.js app shell for daily Japanese kana practice, with a complete installable PWA setup.

## Run locally

```bash
npm install
npm run dev
```

The service worker only registers in production, matching browser and Vercel behavior:

```bash
npm run build
npm start
```

Open `http://localhost:3000`. On a supported Chromium browser, use the in-app install banner or the browser's **Install app** action. On iOS Safari, the banner explains **Share → Add to Home Screen → Add**.

## Repeat: cumulative study plans

Open `/repeat` from the Repeat card on Home. Choose an inclusive date range (up to
three years), an every-N-days interval, days of each month, or explicit dates.
Missing month dates are skipped. Pick individual items or filtered groups from
Minna vocabulary, Kana lessons, reading words/phrases, the Japanese/Chinese study
handbook, and imported custom collections. Items follow source/file order.

Each session adds the configured number of new items and reviews every item from
earlier scheduled sessions, even if an earlier session was missed. Once all items
are introduced, remaining sessions are review-only. Insufficient schedule capacity
is shown explicitly. Each session supports a list, two-sided flashcards, and a
typed quiz (normalized text matching, not semantic grading). Completion is manual;
editing a plan resets its completion markers.

The custom tab provides UTF-8 CSV and JSON templates, validation, and an import
preview. Required fields: `term`, `meaning`. Optional: `order`, `reading`,
`wordType`, `language`, `group`. CSV supports any number of `phonetic:Label`
columns; JSON uses `phonetics: [{ "label": "IPA UK", "value": "..." }]`.
`order` is a display label; file row order controls the study sequence. Imports
append collections and are limited to 5 MB / 5,000 entries per file.

Plans and custom vocabulary use `kanamaster-repeat-v1` in localStorage, with
backup/restore from the custom tab. This is device/browser-local, without account
sync. Storage failures are surfaced without replacing the old saved data.
In-app due badges work without notification permission. Opt-in browser reminders
check every 30 seconds while the app is open, at most once per plan per local day;
they also catch up overdue sessions. The app has no server push scheduler.
Export `.ics` to a calendar app for closed-app reminders (floating local times,
30-minute events, 10-minute alarms; calendar permissions/settings still apply).
Reimport/update calendar entries after editing a plan.

Run `npm run test:repeat` for schedule, accumulation, import, persistence schema,
and calendar export regression checks.

## PWA assets

- Manifest: `public/manifest.webmanifest`
- Service worker: `public/sw.js`
- 1024px icon master and generated sizes: `public/icons/`
- iOS launch images: `public/splash/`
- Reproducible asset generator: `scripts/generate_pwa_assets.py`

Learning progress and install-banner dismissal are stored in browser `localStorage` and remain available when KanaMaster is launched in standalone mode.

## Handwriting practice

Open `/practice/handwriting` to use the on-device writing recognizer. It supports mouse, touch and stylus pointer events, per-stroke undo/redo, optional practice guides, a no-hint test mode, Audio → Writing prompts, confidence handling and separate writing-mastery storage. The recognizer implements a provider-independent `HandwritingRecognizer` interface, so a future vision API or on-device ML model can replace the current local template engine without changing the UI.

## Minna no Nihongo

The **Lưu ý học tập** handbook at `/minna/notes` is linked from Home and Minna.
It contains five topics and 257 Japanese–Chinese–Vietnamese entries: numbers,
clock/calendar time, durations, counters, and verb conjugation. Entries include
kana, romaji, simplified Chinese, pinyin, meanings, and exception notes. Search
works within the selected topic; topic hashes can be bookmarked. Mobile layouts
present each table row as a bilingual card.

Audio uses the browser's Speech Synthesis voices, selecting Japanese or Mandarin
explicitly. If a matching voice is unavailable, listening buttons are disabled
and written readings remain available. These are device-generated voices, not
teacher recordings; pronunciation quality depends on the installed voice.
`scripts/test-minna-notes.cjs` validates required language fields and important
reading/conjugation distinctions. Content is authored reference material with
grammar source links, not an official Riki supplement.

Open `/minna` or select **Minna** in the existing navigation. The module extends
the Kana app with 49 available lessons from Riki, 1,877 vocabulary entries, and
949 normalized exercises. Lesson 12 is unavailable because the source returned
HTTP 500. Lessons 39, 48, 49, and 50 contain grammar and practice but no vocabulary
table in the imported source.

Each lesson includes an overview, searchable vocabulary with hidden meanings,
learned/review flags, flashcards, vocabulary quizzes (Japanese–Vietnamese,
Vietnamese–Japanese, Kana–Kanji, or mixed), grammar with source examples and media,
interactive source exercises, and progress. Quiz distractors come from the same
lesson, are unique, and exclude ambiguous prompts. Quiz results support retry,
new quizzes, and flashcards restricted to incorrectly answered vocabulary.

Original exercises have no structured official answer key. A separately authored
reference set in `src/data/minna-solutions` covers all 949 parsed items: 880
reference answers, 53 open/sample answers, and 16 source-issue explanations.
Each exercise exposes a collapsible solution with per-gap alternatives and a
Vietnamese explanation. Comparison normalizes typography only; a different answer
is not automatically wrong. Completing an exercise records activity, not correctness.
Malformed questions show a correction note instead of unreliable input fields;
learners can mark the note as read. Existing drafts and completion IDs are retained.
Unrecognized exercise layouts remain readable in the full source section with a
notes field. Raw source content is not rewritten; imported Word/VML payloads are
hidden in the rendered text. Media require an
internet connection; YouTube embeds do not autoplay.

Progress and exercise drafts use `kanamaster.minna.v1` in localStorage, separate
from Kana progress. Progress is local to the browser and is not account-synced.
If browser storage fails, the UI reports that progress is only retained for the
current session. Raw JSON is loaded server-side through `src/lib/minna/server.ts`;
UI components consume the normalized adapter model. New raw lesson files use the
same components after adding matching reviewed solutions and a rebuild. The solution
loader checks exact question/context snapshots, field counts, and choice membership,
and refuses stale keys after a source/parser change. Tests verify coverage and
selected grammar regressions; they cannot establish linguistic correctness alone.

Validation:

```powershell
npm run test:minna
npm run lint
npm run build
```

Optional end-to-end checks use an existing Playwright installation and a running
app. Set `PLAYWRIGHT_MODULE` to its module path if it is outside the project;
`MINNA_TEST_URL` defaults to `http://127.0.0.1:3000`:

```powershell
node scripts/test-minna-browser.cjs
```

The browser suite uses an isolated context, checks quiz and persistence flows,
verifies existing Kana routes, and saves screenshots under ignored
`.cache/minna-qa/`. Import instructions are in `src/data/minna-riki/README.md`.
