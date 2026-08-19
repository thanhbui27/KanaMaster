import type { Stroke } from "@/types/handwriting";

const OUTPUT_SIZE = 64;

export function normalizeStrokes(strokes: Stroke[], size = OUTPUT_SIZE): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas is not supported by this browser.");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size, size);

  const points = strokes.flatMap((stroke) => stroke.points);
  if (points.length === 0) return context.getImageData(0, 0, size, size);

  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const width = Math.max(maxX - minX, 1);
  const height = Math.max(maxY - minY, 1);
  const drawable = size * 0.76;
  const scale = Math.min(drawable / width, drawable / height);
  const offsetX = (size - width * scale) / 2 - minX * scale;
  const offsetY = (size - height * scale) / 2 - minY * scale;

  context.strokeStyle = "#000000";
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = Math.max(3.5, size * 0.068);

  for (const stroke of strokes) {
    if (stroke.points.length === 0) continue;
    context.beginPath();
    const first = stroke.points[0];
    context.moveTo(first.x * scale + offsetX, first.y * scale + offsetY);

    if (stroke.points.length === 1) {
      context.lineTo(first.x * scale + offsetX + 0.01, first.y * scale + offsetY + 0.01);
    } else {
      for (let index = 1; index < stroke.points.length - 1; index += 1) {
        const point = stroke.points[index];
        const next = stroke.points[index + 1];
        const middleX = ((point.x + next.x) / 2) * scale + offsetX;
        const middleY = ((point.y + next.y) / 2) * scale + offsetY;
        context.quadraticCurveTo(point.x * scale + offsetX, point.y * scale + offsetY, middleX, middleY);
      }
      const last = stroke.points.at(-1)!;
      context.lineTo(last.x * scale + offsetX, last.y * scale + offsetY);
    }
    context.stroke();
  }

  return context.getImageData(0, 0, size, size);
}
