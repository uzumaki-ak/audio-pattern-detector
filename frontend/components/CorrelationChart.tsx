
"use client";
import { useEffect, useRef } from "react";

interface Props {
  data: number[];
  isDark: boolean;
}

export default function CorrelationChart({ data, isDark }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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

    // Draw correlation line
    ctx.strokeStyle = isDark ? "#10b981" : "#059669";
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    data.forEach((value, i) => {
      const x = (i / data.length) * rect.width;
      const y = 180 - value * 160;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw threshold line
    ctx.strokeStyle = isDark ? "#ef4444" : "#dc2626";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, 160); // 0.1 threshold line
    ctx.lineTo(rect.width, 160);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw labels
    ctx.fillStyle = isDark ? "#9ca3af" : "#6b7280";
    ctx.font = "10px Arial";
    ctx.fillText("Threshold", 10, 155);
    ctx.fillText("High Correlation", rect.width - 80, 40);
  }, [data, isDark]);

  return (
    <div
      className={`rounded-lg p-4 border ${
        isDark
          ? "bg-gray-800/50 border-gray-700"
          : "bg-stone-100 border-stone-300"
      }`}
    >
      <h3 className="text-lg font-medium mb-3">Cross-Correlation Analysis</h3>
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
        className={`mt-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
      >
        Peaks above the red threshold line indicate pattern matches
      </div>
    </div>
  );
}
