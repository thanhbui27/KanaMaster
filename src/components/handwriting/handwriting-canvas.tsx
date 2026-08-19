"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Stroke, StrokePoint } from "@/types/handwriting";

type HandwritingCanvasProps = {
  strokes: Stroke[];
  onStrokeComplete: (stroke: Stroke) => void;
  gridVisible: boolean;
  guideCharacter?: string;
  disabled?: boolean;
};

function drawStroke(context: CanvasRenderingContext2D, stroke: Stroke) {
  if (stroke.points.length === 0) return;
  const first = stroke.points[0];
  context.beginPath();
  context.moveTo(first.x, first.y);

  if (stroke.points.length === 1) {
    context.lineTo(first.x + 0.01, first.y + 0.01);
  } else {
    for (let index = 1; index < stroke.points.length - 1; index += 1) {
      const point = stroke.points[index];
      const next = stroke.points[index + 1];
      context.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
    }
    const last = stroke.points.at(-1)!;
    context.lineTo(last.x, last.y);
  }
  context.stroke();
}

export function HandwritingCanvas({
  strokes,
  onStrokeComplete,
  gridVisible,
  guideCharacter,
  disabled = false,
}: HandwritingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeStroke = useRef<Stroke | null>(null);

  const prepareContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const width = Math.round(rect.width * dpr);
    const height = Math.round(rect.height * dpr);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const context = canvas.getContext("2d");
    if (!context) return null;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);
    context.strokeStyle = "#242b54";
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 8;
    return context;
  }, []);

  const redraw = useCallback(() => {
    const context = prepareContext();
    if (!context) return;
    strokes.forEach((stroke) => drawStroke(context, stroke));
    if (activeStroke.current) drawStroke(context, activeStroke.current);
  }, [prepareContext, strokes]);

  useEffect(() => {
    redraw();
    const onResize = () => redraw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [redraw]);

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>): StrokePoint => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      timestamp: performance.now(),
      pressure: event.pressure || 0.5,
    };
  };

  const startStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    activeStroke.current = { points: [pointFromEvent(event)] };
    redraw();
  };

  const extendStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activeStroke.current || disabled) return;
    activeStroke.current.points.push(pointFromEvent(event));
    redraw();
  };

  const finishStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activeStroke.current) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const completed = activeStroke.current;
    activeStroke.current = null;
    onStrokeComplete(completed);
  };

  return (
    <div className={`writing-canvas-frame ${gridVisible ? "grid-visible" : ""} ${disabled ? "disabled" : ""}`}>
      {guideCharacter && <span className="faint-kana-guide" aria-hidden="true">{guideCharacter}</span>}
      <canvas
        ref={canvasRef}
        className="writing-canvas"
        aria-label="Handwriting canvas"
        onPointerDown={startStroke}
        onPointerMove={extendStroke}
        onPointerUp={finishStroke}
        onPointerCancel={finishStroke}
      />
    </div>
  );
}
