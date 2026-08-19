"""Generate KanaMaster PWA icons and iOS splash screens from one master image."""

from pathlib import Path
import sys

from PIL import Image, ImageDraw


SIZES = [16, 32, 48, 72, 96, 128, 144, 152, 180, 192, 384, 512]
CORAL = (243, 79, 63)
CREAM = (255, 250, 243)


def cover_square(image: Image.Image) -> Image.Image:
    edge = min(image.size)
    left = (image.width - edge) // 2
    top = (image.height - edge) // 2
    return image.crop((left, top, left + edge, top + edge)).convert("RGB")


def make_maskable(master: Image.Image, size: int) -> Image.Image:
    # Replace the white export corners with the brand background, then keep the
    # meaningful mark inside Android's recommended central safe zone.
    filled = master.copy()
    ImageDraw.floodfill(filled, (0, 0), CORAL, thresh=44)
    ImageDraw.floodfill(filled, (filled.width - 1, 0), CORAL, thresh=44)
    ImageDraw.floodfill(filled, (0, filled.height - 1), CORAL, thresh=44)
    ImageDraw.floodfill(filled, (filled.width - 1, filled.height - 1), CORAL, thresh=44)

    canvas = Image.new("RGB", (size, size), CORAL)
    safe_size = round(size * 0.82)
    mark = filled.resize((safe_size, safe_size), Image.Resampling.LANCZOS)
    offset = (size - safe_size) // 2
    canvas.paste(mark, (offset, offset))
    return canvas


def make_splash(icon: Image.Image, width: int, height: int, destination: Path) -> None:
    splash = Image.new("RGB", (width, height), CREAM)
    icon_size = round(width * 0.27)
    resized = icon.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
    x = (width - icon_size) // 2
    y = round(height * 0.41) - icon_size // 2
    splash.paste(resized, (x, y))
    splash.save(destination, optimize=True)


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: generate_pwa_assets.py <source-image>")

    project = Path(__file__).resolve().parents[1]
    public = project / "public"
    icons = public / "icons"
    splash = public / "splash"
    icons.mkdir(parents=True, exist_ok=True)
    splash.mkdir(parents=True, exist_ok=True)

    master = cover_square(Image.open(sys.argv[1]))
    master_1024 = master.resize((1024, 1024), Image.Resampling.LANCZOS)
    master_1024.save(icons / "app-icon-master-1024.png", optimize=True)

    for size in SIZES:
        resized = master_1024.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(icons / f"icon-{size}x{size}.png", optimize=True)

    for size in (192, 512):
        make_maskable(master_1024, size).save(
            icons / f"icon-maskable-{size}x{size}.png", optimize=True
        )

    master_1024.resize((180, 180), Image.Resampling.LANCZOS).save(
        public / "apple-touch-icon.png", optimize=True
    )
    master_1024.save(
        public / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)]
    )

    make_splash(master_1024, 1170, 2532, splash / "apple-splash-1170x2532.png")
    make_splash(master_1024, 1290, 2796, splash / "apple-splash-1290x2796.png")


if __name__ == "__main__":
    main()
