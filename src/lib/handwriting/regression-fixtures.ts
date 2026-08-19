import type { Stroke } from "@/types/handwriting";
import { WRITING_KANA } from "@/data/writing-kana";
import { GENERATED_KANA_STROKES } from "@/lib/handwriting/generated-kana-strokes";

export type RecognitionFixture = {
  name: string;
  expected: string | null;
  prompt?: string;
  strokes: Stroke[];
};

function stroke(points: Array<[number, number]>): Stroke {
  return {
    points: points.map(([x, y], index) => ({
      x,
      y,
      timestamp: index * 16,
      pressure: 0.5,
    })),
  };
}

const STANDARD_FIXTURES: RecognitionFixture[] = [
  {
    name: "あ · standard",
    expected: "あ",
    strokes: [
      stroke([[75, 92], [115, 91], [160, 88], [205, 84]]),
      stroke([[145, 50], [146, 85], [143, 125], [146, 165], [158, 198]]),
      stroke([[218, 112], [205, 137], [180, 158], [146, 171], [112, 166], [91, 184], [91, 213], [111, 235], [145, 239], [181, 224], [211, 195], [223, 160], [215, 132], [194, 115]]),
    ],
  },
  {
    name: "い · natural",
    expected: "い",
    strokes: [
      stroke([[105, 65], [101, 100], [98, 142], [98, 183], [103, 213], [115, 221], [130, 212]]),
      stroke([[168, 101], [181, 122], [195, 148], [208, 178], [216, 207]]),
    ],
  },
  {
    name: "う · standard",
    expected: "う",
    strokes: [
      stroke([[122, 61], [150, 67], [180, 68]]),
      stroke([[92, 112], [127, 103], [165, 101], [201, 108], [220, 128], [220, 155], [210, 182], [192, 208], [165, 229], [139, 240]]),
    ],
  },
  {
    name: "え · standard",
    expected: "え",
    strokes: [
      stroke([[126, 59], [151, 66], [180, 67]]),
      stroke([[86, 111], [123, 105], [162, 103], [199, 110], [184, 129], [159, 146], [132, 166], [155, 163], [179, 165], [194, 184], [209, 199], [233, 196]]),
    ],
  },
  {
    name: "お · standard",
    expected: "お",
    strokes: [
      stroke([[72, 102], [113, 100], [157, 96], [199, 91]]),
      stroke([[142, 53], [142, 91], [139, 132], [136, 169], [112, 175], [91, 192], [85, 214], [98, 232], [121, 236], [145, 226], [160, 207], [159, 183], [147, 167], [131, 162]]),
      stroke([[211, 113], [226, 124], [238, 141]]),
    ],
  },
  {
    name: "か · standard",
    expected: "か",
    strokes: [
      stroke([[71, 109], [105, 104], [144, 100], [172, 103], [169, 126], [158, 158], [143, 190], [123, 218], [106, 224]]),
      stroke([[139, 58], [143, 91], [150, 128], [161, 166], [177, 197]]),
      stroke([[215, 105], [226, 129], [237, 157], [244, 187]]),
    ],
  },
  {
    name: "き · standard 4 strokes",
    expected: "き",
    strokes: [
      stroke([[78, 89], [118, 88], [165, 84], [210, 79]]),
      stroke([[72, 126], [116, 125], [165, 119], [214, 111]]),
      stroke([[148, 52], [150, 85], [155, 120], [168, 151], [192, 173]]),
      stroke([[112, 174], [91, 189], [90, 211], [108, 228], [137, 235], [171, 233], [204, 221]]),
    ],
  },
  {
    name: "き · connected 3 strokes",
    expected: "き",
    strokes: [
      stroke([[78, 89], [118, 88], [165, 84], [210, 79]]),
      stroke([[72, 126], [116, 125], [165, 119], [214, 111]]),
      stroke([[148, 52], [155, 83], [164, 116], [177, 145], [191, 166], [166, 166], [137, 167], [110, 179], [91, 197], [102, 216], [123, 232], [150, 238], [180, 233], [205, 220]]),
    ],
  },
  {
    name: "く · standard",
    expected: "く",
    strokes: [
      stroke([[202, 55], [181, 77], [155, 101], [128, 126], [105, 150], [127, 171], [151, 193], [176, 217], [198, 239]]),
    ],
  },
  {
    name: "け · standard",
    expected: "け",
    strokes: [
      stroke([[92, 55], [88, 91], [86, 132], [88, 175], [94, 214], [106, 197]]),
      stroke([[139, 105], [171, 102], [207, 98], [236, 94]]),
      stroke([[193, 53], [196, 91], [196, 132], [192, 171], [179, 205], [158, 230]]),
    ],
  },
  {
    name: "こ · standard",
    expected: "こ",
    strokes: [
      stroke([[91, 91], [126, 88], [166, 87], [206, 84]]),
      stroke([[78, 177], [90, 195], [116, 204], [150, 206], [184, 202], [215, 190]]),
    ],
  },
  {
    name: "け · user compact hook",
    expected: "け",
    strokes: [
      stroke([[88, 58], [83, 92], [82, 130], [84, 171], [84, 211], [102, 205]]),
      stroke([[128, 78], [159, 78], [181, 78]]),
      stroke([[165, 61], [166, 92], [166, 128], [163, 161], [150, 191], [133, 207]]),
    ],
  },
  {
    name: "こ · user squared second stroke",
    expected: "こ",
    strokes: [
      stroke([[83, 82], [124, 78], [168, 77], [207, 77]]),
      stroke([[72, 105], [72, 139], [77, 162], [99, 166], [137, 166], [180, 167], [226, 170]]),
    ],
  },
  {
    name: "あ · user rounded loop",
    expected: "あ",
    strokes: [
      stroke([[91, 77], [126, 76], [164, 76], [199, 76]]),
      stroke([[154, 54], [143, 83], [137, 116], [133, 151], [135, 184]]),
      stroke([[177, 105], [203, 119], [224, 140], [226, 163], [218, 184], [201, 200], [180, 205], [157, 197], [141, 180], [122, 203], [96, 211], [76, 205], [65, 185], [66, 163], [82, 142], [106, 123], [136, 108], [166, 102]]),
    ],
  },
  {
    name: "お · user rounded loop",
    expected: "お",
    strokes: [
      stroke([[83, 85], [121, 82], [158, 80], [190, 78]]),
      stroke([[149, 57], [147, 91], [142, 126], [136, 163], [126, 193], [102, 198], [79, 188], [68, 168], [80, 145], [103, 133], [132, 132], [157, 143], [176, 166], [174, 187], [161, 203], [143, 207]]),
      stroke([[211, 64], [224, 85], [238, 108], [248, 132]]),
    ],
  },
  {
    name: "か · user compact",
    expected: "か",
    strokes: [
      stroke([[79, 91], [116, 91], [151, 95], [174, 106], [174, 133], [162, 163], [145, 188], [126, 201]]),
      stroke([[133, 62], [125, 91], [115, 123], [104, 156], [94, 191]]),
      stroke([[187, 68], [201, 91], [215, 115], [220, 135]]),
    ],
  },
  {
    name: "さ · user angular",
    expected: "さ",
    strokes: [
      stroke([[88, 91], [126, 95], [165, 99], [202, 99], [234, 92]]),
      stroke([[145, 48], [154, 75], [166, 105], [184, 132], [198, 149], [170, 149], [141, 149]]),
      stroke([[141, 149], [116, 165], [105, 178], [105, 207], [113, 237], [135, 248], [166, 248], [199, 243], [225, 230]]),
    ],
  },
  {
    name: "さ · connected 2 strokes",
    expected: "さ",
    strokes: [
      stroke([[85, 82], [119, 82], [151, 82], [183, 82], [212, 76], [182, 82], [155, 83], [145, 62], [155, 91], [170, 116], [189, 142], [170, 142], [143, 142]]),
      stroke([[143, 142], [119, 151], [104, 165], [103, 190], [113, 220], [132, 231], [157, 229], [183, 217], [210, 199]]),
    ],
  },
  {
    name: "verification · う must not become prompted さ",
    expected: "う",
    prompt: "さ",
    strokes: [
      stroke([[122, 61], [150, 67], [180, 68]]),
      stroke([[92, 112], [127, 103], [165, 101], [201, 108], [220, 128], [220, 155], [210, 182], [192, 208], [165, 229], [139, 240]]),
    ],
  },
];

function leanFixture(fixture: RecognitionFixture, direction: "left" | "right"): RecognitionFixture {
  const factor = direction === "left" ? -0.09 : 0.09;
  return {
    ...fixture,
    name: `${fixture.name} · ${direction} lean`,
    strokes: fixture.strokes.map((item) => ({
      points: item.points.map((point) => ({
        ...point,
        x: point.x + (point.y - 150) * factor,
      })),
    })),
  };
}

const INVALID_FIXTURES: RecognitionFixture[] = [
  {
    name: "invalid · horizontal line",
    expected: null,
    strokes: [stroke([[70, 150], [110, 150], [160, 150], [210, 150], [245, 150]])],
  },
  {
    name: "invalid · loose circle",
    expected: null,
    strokes: [stroke([[160, 65], [205, 78], [230, 115], [232, 160], [213, 202], [175, 228], [130, 224], [92, 196], [76, 154], [84, 111], [116, 78], [160, 65]])],
  },
];

const GENERATED_FULL_CATALOGUE_FIXTURES: RecognitionFixture[] = WRITING_KANA.map((kana) => ({
  name: `${kana.character} · KanjiVG reference`,
  expected: kana.character,
  strokes: GENERATED_KANA_STROKES[kana.character].map((points) => stroke(points)),
}));

export const RECOGNITION_FIXTURES: RecognitionFixture[] = [
  ...STANDARD_FIXTURES,
  ...STANDARD_FIXTURES.map((fixture) => leanFixture(fixture, "left")),
  ...STANDARD_FIXTURES.map((fixture) => leanFixture(fixture, "right")),
  ...GENERATED_FULL_CATALOGUE_FIXTURES,
  ...INVALID_FIXTURES,
];
