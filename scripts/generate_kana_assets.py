"""Generate the complete basic-kana catalogue and offline bitmap templates.

Stroke counts are derived from KanjiVG's ordered SVG paths. The recognition
sprite is rendered once with two Japanese schoolbook-style system fonts so the
PWA can compare handwriting without a Python server or a network request.
"""

from __future__ import annotations

import re
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DATA = ROOT / "src" / "data" / "writing-kana.ts"
OUTPUT_DIR = ROOT / "public" / "handwriting"
OUTPUT_SPRITE = OUTPUT_DIR / "kana-templates.png"
OUTPUT_STROKES = ROOT / "src" / "lib" / "handwriting" / "generated-kana-strokes.ts"
CELL_SIZE = 64
COLUMNS = 16
FONT_SIZE = 52
FONTS = [
    Path(r"C:\Windows\Fonts\YuGothM.ttc"),
    Path(r"C:\Windows\Fonts\msgothic.ttc"),
]
NUMBER = re.compile(r"[MmCcSs]|-?\d+(?:\.\d+)?")


@dataclass(frozen=True)
class Kana:
    script: str
    row: str
    character: str
    romaji: str


ROWS = [
    ("vowels", "あいうえお", "アイウエオ", ["a", "i", "u", "e", "o"]),
    ("k", "かきくけこ", "カキクケコ", ["ka", "ki", "ku", "ke", "ko"]),
    ("s", "さしすせそ", "サシスセソ", ["sa", "shi", "su", "se", "so"]),
    ("t", "たちつてと", "タチツテト", ["ta", "chi", "tsu", "te", "to"]),
    ("n", "なにぬねの", "ナニヌネノ", ["na", "ni", "nu", "ne", "no"]),
    ("h", "はひふへほ", "ハヒフヘホ", ["ha", "hi", "fu", "he", "ho"]),
    ("m", "まみむめも", "マミムメモ", ["ma", "mi", "mu", "me", "mo"]),
    ("y", "やゆよ", "ヤユヨ", ["ya", "yu", "yo"]),
    ("r", "らりるれろ", "ラリルレロ", ["ra", "ri", "ru", "re", "ro"]),
    ("w", "わを", "ワヲ", ["wa", "wo"]),
    ("n-final", "ん", "ン", ["n"]),
]


def catalogue() -> list[Kana]:
    output: list[Kana] = []
    for row, hiragana, katakana, romaji in ROWS:
        output.extend(Kana("hiragana", row, char, sound) for char, sound in zip(hiragana, romaji))
    for row, hiragana, katakana, romaji in ROWS:
        output.extend(Kana("katakana", row, char, sound) for char, sound in zip(katakana, romaji))
    return output


def sample_cubic(start: tuple[float, float], control1: tuple[float, float], control2: tuple[float, float], end: tuple[float, float]) -> list[tuple[float, float]]:
    points = []
    for step in range(1, 11):
        t = step / 10
        inverse = 1 - t
        x = inverse**3 * start[0] + 3 * inverse**2 * t * control1[0] + 3 * inverse * t**2 * control2[0] + t**3 * end[0]
        y = inverse**3 * start[1] + 3 * inverse**2 * t * control1[1] + 3 * inverse * t**2 * control2[1] + t**3 * end[1]
        points.append((x, y))
    return points


def sample_svg_path(path: str) -> list[tuple[float, float]]:
    tokens = NUMBER.findall(path)
    output: list[tuple[float, float]] = []
    current = (0.0, 0.0)
    previous_control = current
    command = ""
    index = 0
    while index < len(tokens):
        if tokens[index].isalpha():
            command = tokens[index]
            index += 1
        relative = command.islower()
        operation = command.upper()
        if operation == "M":
            x, y = float(tokens[index]), float(tokens[index + 1])
            index += 2
            current = (current[0] + x, current[1] + y) if relative else (x, y)
            output.append(current)
            previous_control = current
            command = "l" if relative else "L"
        elif operation == "C":
            values = [float(value) for value in tokens[index:index + 6]]
            index += 6
            c1 = (values[0], values[1])
            c2 = (values[2], values[3])
            end = (values[4], values[5])
            if relative:
                c1 = (current[0] + c1[0], current[1] + c1[1])
                c2 = (current[0] + c2[0], current[1] + c2[1])
                end = (current[0] + end[0], current[1] + end[1])
            output.extend(sample_cubic(current, c1, c2, end))
            current = end
            previous_control = c2
        elif operation == "S":
            values = [float(value) for value in tokens[index:index + 4]]
            index += 4
            c1 = (2 * current[0] - previous_control[0], 2 * current[1] - previous_control[1])
            c2 = (values[0], values[1])
            end = (values[2], values[3])
            if relative:
                c2 = (current[0] + c2[0], current[1] + c2[1])
                end = (current[0] + end[0], current[1] + end[1])
            output.extend(sample_cubic(current, c1, c2, end))
            current = end
            previous_control = c2
        else:
            raise RuntimeError(f"Unsupported SVG command {command!r} in {path}")
    return output


def fetch_strokes(character: str) -> list[list[tuple[float, float]]]:
    codepoint = f"{ord(character):05x}"
    url = f"https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/{codepoint}.svg"
    with urllib.request.urlopen(url, timeout=20) as response:
        root = ET.fromstring(response.read())
    stroke_pattern = re.compile(rf"kvg:{codepoint}-s(\d+)$")
    ordered_paths: list[tuple[int, str]] = []
    for element in root.iter():
        match = stroke_pattern.match(element.attrib.get("id", ""))
        if match and "d" in element.attrib:
            ordered_paths.append((int(match.group(1)), element.attrib["d"]))
    ordered_paths.sort()
    if not ordered_paths:
        raise RuntimeError(f"No ordered strokes found for {character} ({url})")
    return [sample_svg_path(path) for _, path in ordered_paths]


def render_centered(draw: ImageDraw.ImageDraw, character: str, font: ImageFont.FreeTypeFont, box_x: int, box_y: int) -> None:
    left, top, right, bottom = draw.textbbox((0, 0), character, font=font)
    x = box_x + CELL_SIZE / 2 - (left + right) / 2
    y = box_y + CELL_SIZE / 2 - (top + bottom) / 2
    draw.text((x, y), character, fill="black", font=font)


def write_sprite(items: list[Kana], strokes: dict[str, list[list[tuple[float, float]]]]) -> None:
    fonts = [ImageFont.truetype(str(path), FONT_SIZE) for path in FONTS]
    variants = len(fonts) + 1
    template_count = len(items) * variants
    rows = (template_count + COLUMNS - 1) // COLUMNS
    image = Image.new("L", (COLUMNS * CELL_SIZE, rows * CELL_SIZE), "white")
    draw = ImageDraw.Draw(image)
    for kana_index, kana in enumerate(items):
        index = kana_index * variants
        box_x = index % COLUMNS * CELL_SIZE
        box_y = index // COLUMNS * CELL_SIZE
        all_points = [point for kana_stroke in strokes[kana.character] for point in kana_stroke]
        min_x = min(point[0] for point in all_points)
        max_x = max(point[0] for point in all_points)
        min_y = min(point[1] for point in all_points)
        max_y = max(point[1] for point in all_points)
        width = max(max_x - min_x, 1)
        height = max(max_y - min_y, 1)
        drawable = CELL_SIZE * 0.76
        scale = min(drawable / width, drawable / height)
        offset_x = (CELL_SIZE - width * scale) / 2 - min_x * scale
        offset_y = (CELL_SIZE - height * scale) / 2 - min_y * scale
        for kana_stroke in strokes[kana.character]:
            points = [(box_x + x * scale + offset_x, box_y + y * scale + offset_y) for x, y in kana_stroke]
            draw.line(points, fill="black", width=4, joint="curve")
        for font_index, font in enumerate(fonts, start=1):
            index = kana_index * variants + font_index
            box_x = index % COLUMNS * CELL_SIZE
            box_y = index // COLUMNS * CELL_SIZE
            render_centered(draw, kana.character, font, box_x, box_y)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    image.save(OUTPUT_SPRITE, optimize=True)


def write_stroke_fixtures(items: list[Kana], strokes: dict[str, list[list[tuple[float, float]]]]) -> None:
    lines = [
        "// Generated by scripts/generate_kana_assets.py from KanjiVG paths.",
        "export const GENERATED_KANA_STROKES: Record<string, Array<Array<[number, number]>>> = {",
    ]
    for kana in items:
        serialized_strokes = []
        for kana_stroke in strokes[kana.character]:
            points = ", ".join(f"[{x / 109 * 300:.1f}, {y / 109 * 300:.1f}]" for x, y in kana_stroke)
            serialized_strokes.append(f"[{points}]")
        lines.append(f'  "{kana.character}": [{", ".join(serialized_strokes)}],')
    lines.extend(["};", ""])
    OUTPUT_STROKES.write_text("\n".join(lines), encoding="utf-8")


def write_typescript(items: list[Kana], counts: dict[str, int]) -> None:
    lines = [
        "export type WritingKana = {",
        "  id: string;",
        "  character: string;",
        "  romaji: string;",
        '  script: "hiragana" | "katakana";',
        "  row: string;",
        "  strokeCount: number;",
        "};",
        "",
        "// Generated by scripts/generate_kana_assets.py from the 46 basic",
        "// Hiragana and 46 basic Katakana. Stroke counts come from KanjiVG.",
        "export const WRITING_KANA: WritingKana[] = [",
    ]
    for kana in items:
        identifier = f"{kana.script}-{kana.romaji}"
        lines.append(
            f'  {{ id: "{identifier}", character: "{kana.character}", romaji: "{kana.romaji}", '
            f'script: "{kana.script}", row: "{kana.row}", strokeCount: {counts[kana.character]} }},'
        )
    lines.extend([
        "];",
        "",
        "export const WRITING_CHARACTERS = WRITING_KANA.map((kana) => kana.character);",
        "export const HIRAGANA_WRITING_KANA = WRITING_KANA.filter((kana) => kana.script === \"hiragana\");",
        "export const KATAKANA_WRITING_KANA = WRITING_KANA.filter((kana) => kana.script === \"katakana\");",
        "",
    ])
    OUTPUT_DATA.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    items = catalogue()
    if len(items) != 92 or len({item.character for item in items}) != 92:
        raise RuntimeError("The basic kana catalogue must contain 92 unique characters")
    strokes = {item.character: fetch_strokes(item.character) for item in items}
    counts = {character: len(character_strokes) for character, character_strokes in strokes.items()}
    write_typescript(items, counts)
    write_sprite(items, strokes)
    write_stroke_fixtures(items, strokes)
    print(f"Generated {len(items)} Kana, {sum(counts.values())} reference strokes, and {len(items) * (len(FONTS) + 1)} templates")


if __name__ == "__main__":
    main()
