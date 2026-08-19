export type StrokePoint = {
  x: number;
  y: number;
  timestamp: number;
  pressure: number;
};

export type Stroke = {
  points: StrokePoint[];
};

export type RecognitionAlternative = {
  character: string;
  confidence: number;
};

export type RecognitionResult = {
  detectedCharacter: string | null;
  confidence: number;
  expectedMatch?: number;
  alternatives: RecognitionAlternative[];
  normalizedImage: ImageData;
};

export type RecognitionInput = {
  strokes: Stroke[];
  allowedCharacters: string[];
  expectedCharacter?: string;
};

export interface HandwritingRecognizer {
  recognize(input: RecognitionInput): Promise<RecognitionResult>;
}
