import { Detection } from "@/types";

interface Props {
  detections: Detection[];
  isDark: boolean;
}

export default function DetectionList({ detections, isDark }: Props) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, "0")}`;
  };

  return (
    <div
      className={`rounded-lg p-4 border ${
        isDark
          ? "bg-gray-800/50 border-gray-700"
          : "bg-stone-100 border-stone-300"
      }`}
    >
      <h3 className="text-lg font-medium mb-3">Detection Timestamps</h3>
      <div className="space-y-2 max-h-80 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {detections.length === 0 ? (
          <div className="text-center py-6">
            <p className={isDark ? "text-gray-400" : "text-gray-500"}>
              No patterns detected in the target audio
            </p>
            <p
              className={`text-sm mt-1 ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
            >
              Try adjusting the pattern or using a different target audio
            </p>
          </div>
        ) : (
          detections.map((det, i) => (
            <div
              key={i}
              className={`rounded-lg p-3 flex justify-between items-center border-l-4 transition-all ${
                isDark
                  ? "bg-gray-900/50 border-amber-600 hover:bg-gray-800/50"
                  : "bg-white border-amber-500 hover:bg-stone-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isDark ? "bg-amber-900/30" : "bg-amber-100"
                  }`}
                >
                  <span
                    className={isDark ? "text-amber-300" : "text-amber-700"}
                  >
                    {i + 1}
                  </span>
                </div>
                <div>
                  <div className="font-medium">Pattern Match</div>
                  <div
                    className={`text-xs ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Confidence:{" "}
                    <span className="font-medium">
                      {(det.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={isDark ? "text-amber-300" : "text-amber-600"}>
                  {formatTime(det.time)}
                </div>
                <div
                  className={`text-xs ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {det.time.toFixed(2)} seconds
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
