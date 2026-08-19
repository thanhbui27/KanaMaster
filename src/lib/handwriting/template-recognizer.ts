import { normalizeStrokes } from "@/lib/handwriting/normalize";
import { WRITING_KANA } from "@/data/writing-kana";
import { GENERATED_KANA_STROKES } from "@/lib/handwriting/generated-kana-strokes";
import type { HandwritingRecognizer, RecognitionInput, RecognitionResult, Stroke } from "@/types/handwriting";

const SIZE = 64;
export const MIN_RECOGNITION_CONFIDENCE = 0.46;
const TEMPLATE_VARIANTS = 3;
const TEMPLATE_SPRITE_COLUMNS = 16;
const COLLECTED_ATTEMPTS_KEY = "kanamaster-handwriting-attempts-v1";
const SPECIAL_STRUCTURE_CHARACTERS = new Set(["あ", "い", "う", "え", "お", "か", "き", "く", "け", "こ", "さ"]);
const FONT_VARIANTS = [
  '500 52px "Yu Gothic", "Hiragino Sans", "Noto Sans JP", sans-serif',
  '400 54px "Yu Mincho", "Hiragino Mincho ProN", "Noto Serif JP", serif',
];

type Bitmap = Float32Array;
type PreparedBitmap = { bitmap: Bitmap; wide: Bitmap };
let generatedTemplatesPromise: Promise<Map<string, PreparedBitmap[]>> | null = null;

function imageToInk(image: ImageData): Bitmap {
  const output = new Float32Array(image.width * image.height);
  for (let index = 0; index < output.length; index += 1) {
    const pixel = index * 4;
    const luminance = (image.data[pixel] + image.data[pixel + 1] + image.data[pixel + 2]) / (255 * 3);
    output[index] = 1 - luminance;
  }
  return output;
}

function renderTemplate(character: string, font: string): Bitmap {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas is not supported by this browser.");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, SIZE, SIZE);
  context.fillStyle = "#000000";
  context.font = font;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(character, SIZE / 2, SIZE / 2 + 2);
  return imageToInk(context.getImageData(0, 0, SIZE, SIZE));
}

function dilate(bitmap: Bitmap, radius = 2): Bitmap {
  const output = new Float32Array(bitmap.length);
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      let value = 0;
      for (let offsetY = -radius; offsetY <= radius && value < 0.6; offsetY += 1) {
        for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
          const sourceX = x + offsetX;
          const sourceY = y + offsetY;
          if (sourceX < 0 || sourceX >= SIZE || sourceY < 0 || sourceY >= SIZE) continue;
          value = Math.max(value, bitmap[sourceY * SIZE + sourceX]);
        }
      }
      output[y * SIZE + x] = value;
    }
  }
  return output;
}

function diceSimilarity(leftWide: Bitmap, rightWide: Bitmap) {
  let intersection = 0;
  let total = 0;
  for (let index = 0; index < leftWide.length; index += 1) {
    intersection += Math.min(leftWide[index], rightWide[index]);
    total += leftWide[index] + rightWide[index];
  }
  return total === 0 ? 0 : (2 * intersection) / total;
}

function projectionSimilarity(left: Bitmap, right: Bitmap) {
  const leftRows = new Float32Array(SIZE);
  const rightRows = new Float32Array(SIZE);
  const leftColumns = new Float32Array(SIZE);
  const rightColumns = new Float32Array(SIZE);

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const index = y * SIZE + x;
      leftRows[y] += left[index];
      rightRows[y] += right[index];
      leftColumns[x] += left[index];
      rightColumns[x] += right[index];
    }
  }

  const similarity = (first: Float32Array, second: Float32Array) => {
    const firstMax = Math.max(...first, 1);
    const secondMax = Math.max(...second, 1);
    let difference = 0;
    for (let index = 0; index < SIZE; index += 1) {
      difference += Math.abs(first[index] / firstMax - second[index] / secondMax);
    }
    return Math.max(0, 1 - difference / SIZE);
  };

  return (similarity(leftRows, rightRows) + similarity(leftColumns, rightColumns)) / 2;
}

function distanceField(bitmap: Bitmap) {
  const distance = new Float32Array(bitmap.length);
  for (let index = 0; index < bitmap.length; index += 1) distance[index] = bitmap[index] >= 0.18 ? 0 : SIZE * 2;
  const diagonal = Math.SQRT2;
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const index = y * SIZE + x;
      if (x > 0) distance[index] = Math.min(distance[index], distance[index - 1] + 1);
      if (y > 0) distance[index] = Math.min(distance[index], distance[index - SIZE] + 1);
      if (x > 0 && y > 0) distance[index] = Math.min(distance[index], distance[index - SIZE - 1] + diagonal);
      if (x < SIZE - 1 && y > 0) distance[index] = Math.min(distance[index], distance[index - SIZE + 1] + diagonal);
    }
  }
  for (let y = SIZE - 1; y >= 0; y -= 1) {
    for (let x = SIZE - 1; x >= 0; x -= 1) {
      const index = y * SIZE + x;
      if (x < SIZE - 1) distance[index] = Math.min(distance[index], distance[index + 1] + 1);
      if (y < SIZE - 1) distance[index] = Math.min(distance[index], distance[index + SIZE] + 1);
      if (x < SIZE - 1 && y < SIZE - 1) distance[index] = Math.min(distance[index], distance[index + SIZE + 1] + diagonal);
      if (x > 0 && y < SIZE - 1) distance[index] = Math.min(distance[index], distance[index + SIZE - 1] + diagonal);
    }
  }
  return distance;
}

function elasticShapeSimilarity(left: Bitmap, right: Bitmap) {
  const leftField = distanceField(left);
  const rightField = distanceField(right);
  const directed = (source: Bitmap, targetField: Float32Array) => {
    let total = 0;
    let count = 0;
    for (let index = 0; index < source.length; index += 1) {
      if (source[index] < 0.18) continue;
      total += targetField[index];
      count += 1;
    }
    return total / Math.max(count, 1);
  };
  const averageDistance = (directed(left, rightField) + directed(right, leftField)) / 2;
  return clamp(1 - averageDistance / 6.5);
}

function prepareBitmap(bitmap: Bitmap): PreparedBitmap {
  return { bitmap, wide: dilate(bitmap) };
}

function compare(input: Bitmap, inputWide: Bitmap, template: PreparedBitmap) {
  return diceSimilarity(inputWide, template.wide) * 0.5
    + projectionSimilarity(input, template.bitmap) * 0.15
    + elasticShapeSimilarity(input, template.bitmap) * 0.35;
}

function loadGeneratedTemplates(): Promise<Map<string, PreparedBitmap[]>> {
  if (generatedTemplatesPromise) return generatedTemplatesPromise;
  generatedTemplatesPromise = new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        reject(new Error("Canvas is not supported by this browser."));
        return;
      }
      context.drawImage(image, 0, 0);
      const templates = new Map<string, PreparedBitmap[]>();
      WRITING_KANA.forEach((kana, kanaIndex) => {
        const variants: PreparedBitmap[] = [];
        for (let variant = 0; variant < TEMPLATE_VARIANTS; variant += 1) {
          const index = kanaIndex * TEMPLATE_VARIANTS + variant;
          const x = (index % TEMPLATE_SPRITE_COLUMNS) * SIZE;
          const y = Math.floor(index / TEMPLATE_SPRITE_COLUMNS) * SIZE;
          variants.push(prepareBitmap(imageToInk(context.getImageData(x, y, SIZE, SIZE))));
        }
        templates.set(kana.character, variants);
      });
      resolve(templates);
    };
    image.onerror = () => reject(new Error("Kana recognition templates could not be loaded."));
    image.src = "/handwriting/kana-templates.png?v=2";
  });
  return generatedTemplatesPromise;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function countHorizontalBands(bitmap: Bitmap) {
  const activeRows: boolean[] = [];
  for (let y = 0; y < SIZE; y += 1) {
    let ink = 0;
    for (let x = 0; x < SIZE; x += 1) ink += bitmap[y * SIZE + x];
    activeRows.push(ink >= SIZE * 0.18);
  }

  let bands = 0;
  let active = false;
  let quietRows = 0;
  for (const rowActive of activeRows) {
    if (rowActive && !active) {
      bands += 1;
      active = true;
      quietRows = 0;
    } else if (rowActive) {
      quietRows = 0;
    } else if (active) {
      quietRows += 1;
      if (quietRows >= 3) active = false;
    }
  }
  return bands;
}

function strokeOrientation(stroke: Stroke) {
  const first = stroke.points[0];
  const last = stroke.points.at(-1);
  if (!first || !last) return { horizontal: 0.5, vertical: 0.5, downward: 0.5, startX: 0, length: 0 };
  const deltaX = Math.abs(last.x - first.x);
  const deltaY = Math.abs(last.y - first.y);
  const total = Math.max(deltaX + deltaY, 1);
  let length = 0;
  for (let index = 1; index < stroke.points.length; index += 1) {
    length += Math.hypot(
      stroke.points[index].x - stroke.points[index - 1].x,
      stroke.points[index].y - stroke.points[index - 1].y,
    );
  }
  return {
    horizontal: deltaX / total,
    vertical: deltaY / total,
    downward: last.y >= first.y ? 1 : 0,
    startX: first.x,
    length,
  };
}

function singleStrokeKuCompatibility(stroke: Stroke | undefined) {
  if (!stroke || stroke.points.length < 3) return 0;
  const first = stroke.points[0];
  const last = stroke.points.at(-1)!;
  const xs = stroke.points.map((point) => point.x);
  const ys = stroke.points.map((point) => point.y);
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanY = Math.max(...ys) - Math.min(...ys);
  let pathLength = 0;
  for (let index = 1; index < stroke.points.length; index += 1) {
    pathLength += Math.hypot(
      stroke.points[index].x - stroke.points[index - 1].x,
      stroke.points[index].y - stroke.points[index - 1].y,
    );
  }
  const directDistance = Math.hypot(last.x - first.x, last.y - first.y);
  const endpointRatio = directDistance / Math.max(pathLength, 1);
  const ratioScore = clamp(1 - Math.abs(endpointRatio - 0.68) / 0.26);
  const verticalShare = spanY / Math.max(spanX + spanY, 1);
  const verticalScore = clamp((verticalShare - 0.45) / 0.35);
  const leftmostIndex = xs.indexOf(Math.min(...xs));
  const cornerIsInternal = leftmostIndex > 0 && leftmostIndex < stroke.points.length - 1;
  const endpointsAligned = clamp(1 - Math.abs(first.x - last.x) / Math.max(spanX, 1));
  const cornerScore = cornerIsInternal ? endpointsAligned : 0;
  return ratioScore * 0.55 + verticalScore * 0.25 + cornerScore * 0.2;
}

function invalidSingleStrokeShape(stroke: Stroke | undefined) {
  if (!stroke || stroke.points.length < 3) return true;
  const first = stroke.points[0];
  const last = stroke.points.at(-1)!;
  const xs = stroke.points.map((point) => point.x);
  const ys = stroke.points.map((point) => point.y);
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanY = Math.max(...ys) - Math.min(...ys);
  let pathLength = 0;
  for (let index = 1; index < stroke.points.length; index += 1) {
    pathLength += Math.hypot(
      stroke.points[index].x - stroke.points[index - 1].x,
      stroke.points[index].y - stroke.points[index - 1].y,
    );
  }
  const endpointRatio = Math.hypot(last.x - first.x, last.y - first.y) / Math.max(pathLength, 1);
  const verticalShare = spanY / Math.max(spanX + spanY, 1);
  return verticalShare < 0.12 || endpointRatio < 0.08;
}

function structuralCompatibility(character: string, strokes: Stroke[], horizontalBands: number) {
  const orientations = strokes.map(strokeOrientation);
  const first = orientations[0];
  const second = orientations[1];
  const horizontalStrokes = orientations.filter((stroke) => stroke.horizontal >= 0.64).length;
  const verticalStrokes = orientations.filter((stroke) => stroke.vertical >= 0.58).length;
  const maxStrokeLength = Math.max(...orientations.map((stroke) => stroke.length), 1);
  const third = orientations[2];
  const thirdLengthRatio = third ? third.length / maxStrokeLength : 0;
  const thirdStartsRight = third ? third.startX > Math.min(...orientations.map((stroke) => stroke.startX)) + 55 : false;

  if (character === "く") {
    return strokes.length === 1 ? singleStrokeKuCompatibility(strokes[0]) : 0.1;
  }

  if (character === "き") {
    // Both accepted forms of き start with two distinct, parallel horizontal
    // strokes. Counting horizontal-looking segments anywhere in the glyph was
    // too permissive and caused あ / お / け to be forced into き.
    const startsWithParallelHorizontals = Boolean(
      first
      && second
      && first.horizontal >= 0.64
      && second.horizontal >= 0.64,
    );
    if (!startsWithParallelHorizontals) return 0.08;
    const bandScore = clamp(horizontalBands / 2);
    const countScore = strokes.length === 3 || strokes.length === 4 ? 1 : 0.25;
    return bandScore * 0.6 + clamp(verticalStrokes) * 0.15 + countScore * 0.25;
  }

  if (character === "あ") {
    // The lower loop naturally creates multiple dense horizontal bands after
    // rasterization. Penalizing those bands made あ lose to を and ま.
    const bandPenalty = horizontalBands >= 3 ? 0.06 : 0;
    const thirdStroke = strokes[2];
    const thirdFirst = thirdStroke?.points[0];
    const thirdLast = thirdStroke?.points.at(-1);
    const thirdDirectDistance = thirdFirst && thirdLast
      ? Math.hypot(thirdLast.x - thirdFirst.x, thirdLast.y - thirdFirst.y)
      : Number.POSITIVE_INFINITY;
    const thirdClosure = third
      ? clamp(1 - thirdDirectDistance / Math.max(third.length * 0.45, 1))
      : 0;
    const thirdIsMainLoop = thirdLengthRatio >= 0.8 ? thirdClosure * 0.35 : 0;
    const missingLoopPenalty = thirdClosure < 0.35 ? 0.25 : 0;
    return clamp(
      0.35
      + (strokes.length === 3 ? 0.15 : 0)
      + (horizontalStrokes === 1 ? 0.12 : 0)
      + (verticalStrokes >= 1 ? 0.1 : 0)
      + thirdIsMainLoop
      - bandPenalty
      - missingLoopPenalty,
    );
  }

  if (character === "お") {
    const rightDot = third && thirdLengthRatio <= 0.48 && thirdStartsRight ? 0.38 : 0;
    return clamp(
      0.2
      + (strokes.length === 3 ? 0.15 : 0)
      + (horizontalStrokes >= 1 ? 0.12 : 0)
      + (verticalStrokes >= 1 ? 0.1 : 0)
      + rightDot,
    );
  }

  if (character === "か") {
    return clamp(
      0.2
      + (strokes.length === 3 ? 0.18 : 0)
      + (horizontalStrokes === 0 ? 0.22 : 0)
      + (verticalStrokes >= 2 ? 0.22 : 0)
      + (thirdStartsRight ? 0.1 : 0),
    );
  }

  if (character === "け") {
    return clamp(
      0.2
      + (strokes.length === 3 ? 0.18 : 0)
      + (horizontalStrokes === 1 ? 0.22 : 0)
      + (verticalStrokes >= 2 ? 0.25 : 0)
      + (thirdLengthRatio >= 0.7 ? 0.1 : 0),
    );
  }

  if (character === "さ") {
    const glyphPoints = strokes.flatMap((stroke) => stroke.points);
    const glyphHeight = Math.max(...glyphPoints.map((point) => point.y)) - Math.min(...glyphPoints.map((point) => point.y));
    const firstStrokePoints = strokes[0]?.points ?? [];
    const firstStrokeHeight = firstStrokePoints.length > 0
      ? Math.max(...firstStrokePoints.map((point) => point.y)) - Math.min(...firstStrokePoints.map((point) => point.y))
      : 0;
    const connectedDiagonal = strokes.length === 2 && firstStrokeHeight / Math.max(glyphHeight, 1) >= 0.3;
    const separatedDiagonal = strokes.length === 3 && Boolean(second && second.vertical >= 0.45);
    if (!connectedDiagonal && !separatedDiagonal) return 0.12;
    const finalStroke = strokes.at(-1);
    const finalOrientation = orientations.at(-1);
    if (!finalOrientation || finalOrientation.horizontal < 0.38) return 0.12;
    const finalFirst = finalStroke?.points[0];
    const finalLast = finalStroke?.points.at(-1);
    const finalDirectDistance = finalFirst && finalLast
      ? Math.hypot(finalLast.x - finalFirst.x, finalLast.y - finalFirst.y)
      : 0;
    const finalOpenCurve = finalOrientation
      ? clamp(finalDirectDistance / Math.max(finalOrientation.length * 0.58, 1))
      : 0;
    const finalMovesRight = finalFirst && finalLast && finalLast.x > finalFirst.x + 35 ? 1 : 0;
    return clamp(
      0.18
      + (strokes.length === 2 || strokes.length === 3 ? 0.2 : 0)
      + clamp(horizontalBands / 2) * 0.18
      + (finalOrientation && finalOrientation.length / maxStrokeLength >= 0.72 ? 0.2 : 0)
      + finalOpenCurve * 0.14
      + finalMovesRight * 0.1,
    );
  }

  if (strokes.length !== 2 || !first || !second) return 0.5;

  switch (character) {
    case "い":
      return clamp(
        first.vertical * 0.3
        + second.vertical * 0.3
        + first.downward * 0.1
        + second.downward * 0.1
        + (first.startX < second.startX ? 0.2 : 0),
      );
    case "こ":
      return clamp(
        first.horizontal * 0.3
        + second.horizontal * 0.35
        + clamp(first.length / Math.max(second.length, 1)) * 0.35,
      );
    case "う":
      return clamp(
        first.horizontal * 0.25
        + second.vertical * 0.55
        + second.downward * 0.1
        + (second.vertical >= 0.58 ? 0.1 : 0),
      );
    case "え":
      return clamp(
        first.horizontal * 0.25
        + second.horizontal * 0.55
        + clamp(1 - first.length / Math.max(second.length * 0.62, 1)) * 0.2,
      );
    default:
      return 0.5;
  }
}

type PathPoint = { x: number; y: number };

function normalizeStrokePaths(paths: PathPoint[][]) {
  const points = paths.flat();
  if (points.length === 0) return paths;
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const width = Math.max(maxX - minX, 1);
  const height = Math.max(maxY - minY, 1);
  const scale = 1 / Math.max(width, height);
  const offsetX = (1 - width * scale) / 2 - minX * scale;
  const offsetY = (1 - height * scale) / 2 - minY * scale;
  return paths.map((path) => path.map((point) => ({
    x: point.x * scale + offsetX,
    y: point.y * scale + offsetY,
  })));
}

function resamplePath(path: PathPoint[], targetCount = 24) {
  if (path.length === 0) return Array.from({ length: targetCount }, () => ({ x: 0.5, y: 0.5 }));
  if (path.length === 1) return Array.from({ length: targetCount }, () => path[0]);
  const distances = [0];
  for (let index = 1; index < path.length; index += 1) {
    distances.push(distances[index - 1] + Math.hypot(path[index].x - path[index - 1].x, path[index].y - path[index - 1].y));
  }
  const total = distances.at(-1) ?? 0;
  if (total === 0) return Array.from({ length: targetCount }, () => path[0]);
  return Array.from({ length: targetCount }, (_, sampleIndex) => {
    const target = total * sampleIndex / (targetCount - 1);
    let segment = 1;
    while (segment < distances.length - 1 && distances[segment] < target) segment += 1;
    const startDistance = distances[segment - 1];
    const endDistance = distances[segment];
    const progress = (target - startDistance) / Math.max(endDistance - startDistance, 0.0001);
    return {
      x: path[segment - 1].x + (path[segment].x - path[segment - 1].x) * progress,
      y: path[segment - 1].y + (path[segment].y - path[segment - 1].y) * progress,
    };
  });
}

function pathSimilarity(left: PathPoint[], right: PathPoint[]) {
  const leftSamples = resamplePath(left);
  const rightSamples = resamplePath(right);
  const averageDistance = (rightPath: PathPoint[]) => leftSamples.reduce((sum, point, index) => (
    sum + Math.hypot(point.x - rightPath[index].x, point.y - rightPath[index].y)
  ), 0) / leftSamples.length;
  const forward = clamp(1 - averageDistance(rightSamples) / 0.34);
  const reverse = clamp(1 - averageDistance([...rightSamples].reverse()) / 0.34) * 0.78;
  return Math.max(forward, reverse);
}

function bestUnorderedStrokeScore(inputPaths: PathPoint[][], referencePaths: PathPoint[][]) {
  let best = 0;
  const visit = (inputIndex: number, used: Set<number>, total: number) => {
    if (inputIndex === inputPaths.length) {
      best = Math.max(best, total / inputPaths.length);
      return;
    }
    for (let referenceIndex = 0; referenceIndex < referencePaths.length; referenceIndex += 1) {
      if (used.has(referenceIndex)) continue;
      used.add(referenceIndex);
      visit(inputIndex + 1, used, total + pathSimilarity(inputPaths[inputIndex], referencePaths[referenceIndex]));
      used.delete(referenceIndex);
    }
  };
  visit(0, new Set(), 0);
  return best;
}

function pointCloudSimilarity(inputPaths: PathPoint[][], referencePaths: PathPoint[][]) {
  const sampleCloud = (paths: PathPoint[][]) => paths.flatMap((path) => resamplePath(path, 18));
  const inputCloud = sampleCloud(inputPaths);
  const referenceCloud = sampleCloud(referencePaths);
  const directedDistance = (source: PathPoint[], target: PathPoint[]) => source.reduce((sum, point) => {
    const nearest = Math.min(...target.map((candidate) => Math.hypot(point.x - candidate.x, point.y - candidate.y)));
    return sum + nearest;
  }, 0) / Math.max(source.length, 1);
  const chamferDistance = (directedDistance(inputCloud, referenceCloud) + directedDistance(referenceCloud, inputCloud)) / 2;
  return clamp(1 - chamferDistance / 0.2);
}

function trajectorySimilarity(inputStrokes: Stroke[], character: string) {
  const reference = GENERATED_KANA_STROKES[character];
  if (!reference) return 0;
  const inputPaths = normalizeStrokePaths(inputStrokes.map((stroke) => stroke.points));
  const referencePaths = normalizeStrokePaths(reference.map((path) => path.map(([x, y]) => ({ x, y }))));
  const cloudScore = pointCloudSimilarity(inputPaths, referencePaths);
  if (inputStrokes.length !== reference.length) {
    const countDifference = Math.abs(inputStrokes.length - reference.length);
    return cloudScore * (countDifference === 1 ? 0.94 : 0.72);
  }
  const ordered = inputPaths.reduce((sum, path, index) => sum + pathSimilarity(path, referencePaths[index]), 0) / inputPaths.length;
  const unordered = bestUnorderedStrokeScore(inputPaths, referencePaths);
  return Math.max(ordered, unordered * 0.88, cloudScore * 0.92);
}

export function collectHandwritingAttempt(input: {
  expectedCharacter: string;
  recognition: RecognitionResult;
  status: "correct" | "incorrect" | "uncertain";
  strokes: Stroke[];
}) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(COLLECTED_ATTEMPTS_KEY) ?? "[]") as unknown[];
    const attempt = {
      expectedCharacter: input.expectedCharacter,
      detectedCharacter: input.recognition.detectedCharacter,
      confidence: input.recognition.confidence,
      expectedMatch: input.recognition.expectedMatch ?? 0,
      status: input.status,
      createdAt: new Date().toISOString(),
      strokes: input.strokes.map((stroke) => ({ points: stroke.points.map((point) => ({ ...point })) })),
    };
    window.localStorage.setItem(COLLECTED_ATTEMPTS_KEY, JSON.stringify([...saved, attempt].slice(-500)));
  } catch {
    // Recognition must continue even when storage is unavailable or full.
  }
}

export class TemplateHandwritingRecognizer implements HandwritingRecognizer {
  async recognize(input: RecognitionInput): Promise<RecognitionResult> {
    const normalizedImage = normalizeStrokes(input.strokes, SIZE);
    const inputBitmap = imageToInk(normalizedImage);
    const inputWide = dilate(inputBitmap);
    const horizontalBands = countHorizontalBands(inputBitmap);
    const inkAmount = inputBitmap.reduce((sum, value) => sum + value, 0) / inputBitmap.length;

    if (input.strokes.length === 0 || inkAmount < 0.006) {
      return { detectedCharacter: null, confidence: 0, alternatives: [], normalizedImage };
    }

    let generatedTemplates: Map<string, PreparedBitmap[]> | null = null;
    try {
      generatedTemplates = await loadGeneratedTemplates();
    } catch {
      // Font rendering keeps recognition available if the generated asset is
      // unavailable, while the PWA normally uses the deterministic sprite.
    }

    const unsortedScores = input.allowedCharacters.map((character) => {
      const templates = generatedTemplates?.get(character)
        ?? FONT_VARIANTS.map((font) => prepareBitmap(renderTemplate(character, font)));
      const visualScore = Math.max(...templates.map((template) => compare(inputBitmap, inputWide, template)));
      const expectedStrokes = WRITING_KANA.find((kana) => kana.character === character)?.strokeCount;
      const acceptedStrokeCounts = character === "き" ? [3, 4] : expectedStrokes === undefined ? [input.strokes.length] : [expectedStrokes];
      const strokeDifference = Math.min(...acceptedStrokeCounts.map((count) => Math.abs(input.strokes.length - count)));
      const strokeCompatibility = 1 / (1 + strokeDifference * strokeDifference * 1.5);
      const structureScore = structuralCompatibility(character, input.strokes, horizontalBands);
      const trajectoryScore = trajectorySimilarity(input.strokes, character);
      const hasSpecialStructure = SPECIAL_STRUCTURE_CHARACTERS.has(character);
      const characteristicBoost = character === "さ" && structureScore >= 0.72
        ? 0.16
        : character === "こ" && structureScore >= 0.65
          ? 0.12
          : 0;
      const score = (hasSpecialStructure
        ? visualScore * 0.24 + strokeCompatibility * 0.05 + structureScore * 0.46 + trajectoryScore * 0.25
        : visualScore * 0.42 + strokeCompatibility * 0.14 + trajectoryScore * 0.44) + characteristicBoost;
      const qualitySignal = hasSpecialStructure
        ? visualScore * 0.3 + structureScore * 0.35 + trajectoryScore * 0.35
        : visualScore * 0.45 + trajectoryScore * 0.55;
      return { character, score, visualScore, qualitySignal, structureScore, trajectoryScore };
    });

    const expectedScore = unsortedScores.find((candidate) => candidate.character === input.expectedCharacter);
    let expectedMatch = 0;
    if (expectedScore) {
      const expectedEvidence = expectedScore.visualScore * 0.46
        + expectedScore.trajectoryScore * 0.34
        + expectedScore.structureScore * 0.2;
      expectedMatch = clamp(expectedEvidence);
      const bestUnpromptedScore = Math.max(...unsortedScores.map((candidate) => candidate.score));
      const expectedStrokeCount = WRITING_KANA.find((kana) => kana.character === input.expectedCharacter)?.strokeCount;
      const countDifference = expectedStrokeCount === undefined
        ? 0
        : Math.abs(input.strokes.length - expectedStrokeCount);
      if (expectedEvidence >= 0.62 && countDifference <= 1 && expectedScore.score >= bestUnpromptedScore - 0.06) {
        // The prompt may only break a near tie backed by strong geometry.
        expectedScore.score += 0.045;
        expectedScore.qualitySignal = Math.max(expectedScore.qualitySignal, expectedEvidence);
      }
    }

    const scores = unsortedScores.sort((left, right) => right.score - left.score);

    const temperature = 0.085;
    const exponentials = scores.map(({ score }) => Math.exp(score / temperature));
    const sum = exponentials.reduce((total, value) => total + value, 0);
    const quality = clamp((scores[0].qualitySignal - 0.22) / 0.4);
    const probabilities = exponentials.map((value) => value / sum);
    const margin = probabilities[0] - (probabilities[1] ?? 0);
    let calibratedConfidence = clamp(0.18 + quality * 0.65 + margin * 1.8, 0, 0.97);
    if (input.strokes.length === 1 && scores[0]?.character === "く" && scores[0].structureScore < 0.55) {
      calibratedConfidence = Math.min(calibratedConfidence, 0.35);
    }
    if (input.strokes.length === 1 && invalidSingleStrokeShape(input.strokes[0])) {
      calibratedConfidence = Math.min(calibratedConfidence, 0.35);
    }
    const remainingProbability = Math.max(1 - probabilities[0], 0.001);
    const alternatives = scores.slice(0, 3).map(({ character }, index) => ({
      character,
      confidence: index === 0
        ? calibratedConfidence
        : clamp((probabilities[index] / remainingProbability) * (1 - calibratedConfidence)),
    }));

    return {
      detectedCharacter: alternatives[0]?.character ?? null,
      confidence: alternatives[0]?.confidence ?? 0,
      alternatives,
      expectedMatch,
      normalizedImage,
    };
  }
}

export const handwritingRecognizer: HandwritingRecognizer = new TemplateHandwritingRecognizer();
