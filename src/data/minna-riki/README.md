# Riki Minna lesson import

Source: https://riki.edu.vn/minna-no-nihongo/bai-1 through `bai-50`.

Each `lesson-NN.json` preserves all article sections in source order, including
vocabulary, grammar, examples, notes, and practice wherever the source includes
them. Site navigation, promotional banners, and footer content are excluded.
`index.json` records section counts and import failures. Missing vocabulary or
practice sections are not invented. Source mistakes are not automatically corrected.

Fields:

- `lesson`, `title`, `sourceUrl`: lesson identity and attribution.
- `fetchedAt`: import timestamp; cached imports can reuse an earlier downloaded page.
- `sourceSha256`: SHA-256 of the downloaded UTF-8 HTML.
- `sections`: source heading, source DOM ID, category, ordered `blocks`, plain
  `text`, and source `links` / `media`.
- Blocks include text, headings, tables (with row/column spans), lists, and media.
  Tables may contain examples as well as vocabulary. `text` is a fallback view,
  not additional content to render after the blocks.
- Media URLs are references only; media files and video transcripts are not
  downloaded. No generated answers are presented as source answers. Practice
  content is preserved, not yet converted into automatically graded questions.

Run from the repository root using Python 3:

```powershell
python -m pip install -r scripts/requirements-riki.txt
python scripts/crawl_riki.py
python scripts/crawl_riki.py --start 1 --end 2
python scripts/crawl_riki.py --refresh
python scripts/crawl_riki.py --offline
python -m unittest discover -s scripts -p test_crawl_riki.py
```

The importer checks robots.txt, downloads sequentially with at least a one-second
delay, retries transient failures, and caches HTML under ignored `.cache/riki/`.
Normal reruns parse the cache. `--refresh` downloads the selected range again.
`--offline` reparses the local cache without accessing the network.
Unexpected layouts and redirects fail visibly rather than silently producing
empty lessons. A failed refresh does not delete an older successful JSON file;
check the `failures` array and process exit status before consuming a new import.

The dataset powers the `/minna` module. `src/lib/minna/adapter.ts` normalizes raw
sections into vocabulary and exercises; the server loads only the selected
lesson's content into the lesson page. Adding another `lesson-NN.json` file and
rebuilding makes it available without adding UI components.

## Import coverage (2026-09-27)

49 of 50 lessons were downloaded, containing 341 article sections and 51 media
references. Lesson 12 repeatedly returned HTTP 500; the trailing-slash URL
returned HTTP 404. No content was fabricated for it. Retry with
`python scripts/crawl_riki.py --start 12 --end 12` when the source recovers.

All 49 downloaded lessons have a practice section. Lessons 39, 48, 49, and 50
have no section explicitly titled vocabulary in the downloaded source; their
available sections are preserved as published.
