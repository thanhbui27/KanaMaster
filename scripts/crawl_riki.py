"""Import public Riki Minna lessons. Requires beautifulsoup4; no browser or Docker."""
import argparse
import copy
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import time
from urllib.parse import urljoin
from urllib.request import Request, urlopen
from urllib.robotparser import RobotFileParser

from bs4 import BeautifulSoup, NavigableString, Tag

BASE = "https://riki.edu.vn"
AGENT = "KanaMaster-study-import/1.0"
ROOT = Path(__file__).resolve().parents[1]


def fetch(url):
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={"User-Agent": AGENT}), timeout=40) as response:
                return response.read().decode("utf-8"), response.url
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 ** (attempt + 1))


def plain(node):
    # Keep adjacent inline spans together (Japanese words often span several tags).
    return re.sub(r"[\t\r\n ]+", " ", node.get_text("", strip=False).replace("\xa0", " ")).strip()


def link(url, base):
    absolute = urljoin(base, url or "")
    return absolute if absolute.startswith(("https://", "http://")) else None


def blocks(node, url):
    result = []
    pending = []

    def flush():
        value = "".join(pending).strip()
        pending.clear()
        if value:
            result.append({"type": "text", "text": value})

    for child in node.children:
        if isinstance(child, NavigableString):
            pending.append(str(child))
            continue
        if not isinstance(child, Tag) or child.name in {"script", "style", "noscript"}:
            continue
        if child.name == "br":
            pending.append("\n")
            continue
        if child.name in {"span", "b", "strong", "em", "i", "u", "ruby", "sup", "sub", "a"} and not child.find(["img", "iframe", "audio", "video"]):
            pending.append(child.get_text("", strip=False).replace("\xa0", " "))
            continue
        flush()
        if child.name == "table":
            result.append({"type": "table", "rows": [
                [{"text": plain(cell), "rowSpan": cell.get("rowspan", "1"),
                  "colSpan": cell.get("colspan", "1")}
                 for cell in row.find_all(["td", "th"], recursive=False)]
                for row in child.find_all("tr") if row.find_parent("table") is child
            ]})
        elif child.name in {"img", "iframe", "audio", "video", "source"}:
            src = child.get("data-src") or child.get("src")
            if src and link(src, url):
                result.append({"type": "media", "kind": child.name,
                               "url": link(src, url), "alt": child.get("alt", "")})
            if child.name in {"audio", "video"}:
                result.extend(blocks(child, url))
        elif child.name in {"ul", "ol"}:
            result.append({"type": "list", "ordered": child.name == "ol",
                           "items": [blocks(li, url) for li in child.find_all("li", recursive=False)]})
        elif re.fullmatch(r"h[1-6]", child.name):
            result.append({"type": "heading", "level": int(child.name[1]), "text": plain(child)})
        else:
            result.extend(blocks(child, url))
    flush()
    return result


def parse_lesson(html, number, url):
    soup = BeautifulSoup(html, "html.parser")
    title = soup.select_one("h1.rikiDetailBlockTop_heading")
    if not title or not re.search(rf"bài\s*{number}\b", plain(title), re.I):
        raise ValueError("Unexpected lesson title or page layout")
    sections = []
    for box in soup.select("section.pageDetailContent .box_content_write"):
        heading = box.select_one("h2.titleH2") or box.select_one(".heading")
        body = box.select_one(".pageDetailContent_post")
        if body is None:
            body = copy.deepcopy(box)
            for decoration in body.select(".heading, h2.titleH2"):
                decoration.decompose()
        name = plain(heading) if heading else ""
        kind = "vocabulary" if "từ vựng" in name.lower() else "practice" if re.search("luyện tập|bài tập", name, re.I) else "lesson"
        sections.append({"id": f"section-{len(sections)+1}", "sourceId": box.get("id"),
                         "title": name, "kind": kind, "blocks": blocks(body, url),
                         "text": body.get_text("\n", strip=True),
                         "ruby": [{"text": plain(r), "readings": [plain(rt) for rt in r.select("rt")]}
                                  for r in body.select("ruby")],
                         "links": [{"text": plain(a), "url": link(a.get("href"), url)}
                                   for a in body.select("a[href]") if link(a.get("href"), url)],
                         "media": [{"kind": m.name, "url": link(m.get("data-src") or m.get("src"), url),
                                    "alt": m.get("alt", "")}
                                   for m in body.select("img, iframe, audio, video, source")
                                   if (m.get("data-src") or m.get("src")) and link(m.get("data-src") or m.get("src"), url)]})
    if not sections:
        raise ValueError("No lesson sections found")
    # Fail instead of silently dropping article containers with a new layout.
    if any(not post.find_parent(class_="box_content_write")
           for post in soup.select("section.pageDetailContent .pageDetailContent_post")):
        raise ValueError("Unmatched article container")
    return {"schemaVersion": 1, "lesson": number, "title": plain(title), "sourceUrl": url,
            "fetchedAt": datetime.now(timezone.utc).isoformat(),
            "sourceSha256": hashlib.sha256(html.encode()).hexdigest(), "sections": sections}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--start", type=int, default=1)
    parser.add_argument("--end", type=int, default=50)
    parser.add_argument("--refresh", action="store_true")
    parser.add_argument("--offline", action="store_true", help="Only parse cached HTML; no network requests")
    args = parser.parse_args()
    if not 1 <= args.start <= args.end <= 50:
        parser.error("Expected 1 <= start <= end <= 50")
    if args.offline and args.refresh:
        parser.error("--offline and --refresh cannot be combined")
    out = ROOT / "src/data/minna-riki"
    cache = ROOT / ".cache/riki"
    out.mkdir(parents=True, exist_ok=True)
    cache.mkdir(parents=True, exist_ok=True)
    robots = RobotFileParser()
    if not args.offline:
        robot_text, _ = fetch(BASE + "/robots.txt")
        robots.parse(robot_text.splitlines())
    failures = []
    for number in range(args.start, args.end + 1):
        url = f"{BASE}/minna-no-nihongo/bai-{number}"
        try:
            if not args.offline and not robots.can_fetch(AGENT, url):
                raise ValueError("Disallowed by robots.txt")
            cached = cache / f"lesson-{number:02}.html"
            if cached.exists() and not args.refresh:
                html = cached.read_text(encoding="utf-8")
            else:
                if args.offline:
                    raise ValueError("No cached HTML; download required")
                time.sleep(max(1, robots.crawl_delay(AGENT) or 0))
                html, final_url = fetch(url)
                if final_url.rstrip("/") != url:
                    raise ValueError(f"Unexpected redirect: {final_url}")
                cached.write_text(html, encoding="utf-8")
            lesson = parse_lesson(html, number, url)
            (out / f"lesson-{number:02}.json").write_text(json.dumps(lesson, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(f"Lesson {number}: {len(lesson['sections'])} sections", flush=True)
        except Exception as error:
            failures.append({"lesson": number, "error": str(error)})
            print(f"Lesson {number}: FAILED {error}", flush=True)
    entries = []
    for path in sorted(out.glob("lesson-*.json")):
        lesson = json.loads(path.read_text(encoding="utf-8"))
        entries.append({"lesson": lesson["lesson"], "title": lesson["title"], "file": path.name,
                        "sections": len(lesson["sections"]),
                        "vocabularySections": sum(s["kind"] == "vocabulary" for s in lesson["sections"]),
                        "practiceSections": sum(s["kind"] == "practice" for s in lesson["sections"])})
    (out / "index.json").write_text(json.dumps({"source": BASE, "lessons": entries, "failures": failures}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
