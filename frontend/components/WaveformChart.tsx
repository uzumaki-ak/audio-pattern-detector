"use client";
import { Detection } from "types";
import { useEffect, useRef } from "react";

interface Props {
  data: number[];
  detections: Detection[];
  isDark: boolean;
}

export default function WaveformChart({ data, detections, isDark }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 200 * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, 200);

    // Draw background
    ctx.fillStyle = isDark ? "#1f2937" : "#f9fafb";
    ctx.fillRect(0, 0, rect.width, 200);

    // Draw waveform
    ctx.strokeStyle = isDark ? "#6366f1" : "#4f46e5";
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    data.forEach((value, i) => {
      const x = (i / data.length) * rect.width;
      const y = 100 - value * 80;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw detection markers
    ctx.strokeStyle = isDark ? "#ef4444" : "#dc2626";
    ctx.lineWidth = 2;
    detections.forEach((det) => {
      const x =
        (det.time / (data.length / 44100)) *
        (rect.width / data.length) *
        data.length;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 200);
      ctx.stroke();

      // Draw confidence indicator
      ctx.fillStyle = isDark ? "#ef4444" : "#dc2626";
      ctx.fillRect(x - 2, 180 - det.confidence * 40, 4, det.confidence * 40);
    });

    // Draw center line
    ctx.strokeStyle = isDark ? "#4b5563" : "#d1d5db";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, 100);
    ctx.lineTo(rect.width, 100);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [data, detections, isDark]);

  return (
    <div
      className={`rounded-lg p-4 border ${
        isDark
          ? "bg-gray-800/50 border-gray-700"
          : "bg-stone-100 border-stone-300"
      }`}
    >
      <h3 className="text-lg font-medium mb-3">Target Audio Waveform</h3>
      <div
        className={`rounded border ${
          isDark
            ? "bg-gray-900/50 border-gray-600"
            : "bg-white border-stone-300"
        }`}
      >
        <canvas
          ref={canvasRef}
          className="w-full rounded"
          style={{ height: "200px" }}
        />
      </div>
      <div
        className={`mt-2 text-sm flex justify-between ${
          isDark ? "text-gray-400" : "text-gray-600"
        }`}
      >
        <span>Red lines show detected pattern occurrences</span>
        <span>Height shows confidence level</span>
      </div>
    </div>
  );
}
