import { AnalysisResult } from "types";
import WaveformChart from "./WaveformChart";
import CorrelationChart from "./CorrelationChart";
import DetectionList from "./DetectionList";
import AudioPlayer from "./AudioPlayer";

interface ResultsDisplayProps {
  results: AnalysisResult;
  isDark: boolean;
}

export default function ResultsDisplay({
  results,
  isDark,
}: ResultsDisplayProps) {
  const downloadResults = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audio_analysis_${results.analysis_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`frosted-glass rounded-2xl shadow-lg border p-6 space-y-6 ${
        isDark ? "border-gray-700" : "border-stone-300"
      } transition-colors`}
    >
      {/* Stats Header */}
      <div className="text-center">
        <h2 className="text-2xl font-heading font-bold text-foreground mb-1">
          Analysis Results
        </h2>
        <p className="text-foreground/80">Analysis ID: {results.analysis_id}</p>
        <div className="mt-2 flex justify-center gap-2 flex-wrap">
          {results.analysis_methods?.map((method: string) => (
            <span
              key={method}
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                isDark
                  ? "bg-blue-900/30 text-blue-300 border border-blue-700"
                  : "bg-blue-100 text-blue-800 border border-blue-300"
              }`}
            >
              {method}
            </span>
          ))}
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          className={`rounded-lg p-3 text-center border ${
            isDark
              ? "bg-amber-900/20 border-amber-700"
              : "bg-amber-100 border-amber-300"
          }`}
        >
          <div className="text-xl font-bold text-foreground mb-1">
            {results.detection_count}
          </div>
          <div className="text-xs text-foreground/80">Total Matches</div>
        </div>
        <div
          className={`rounded-lg p-3 text-center border ${
            isDark
              ? "bg-amber-900/20 border-amber-700"
              : "bg-amber-100 border-amber-300"
          }`}
        >
          <div className="text-xl font-bold text-foreground mb-1">
            {results.pattern_duration.toFixed(1)}s
          </div>
          <div className="text-xs text-foreground/80">Pattern</div>
        </div>
        <div
          className={`rounded-lg p-3 text-center border ${
            isDark
              ? "bg-amber-900/20 border-amber-700"
              : "bg-amber-100 border-amber-300"
          }`}
        >
          <div className="text-xl font-bold text-foreground mb-1">
            {results.target_duration.toFixed(1)}s
          </div>
          <div className="text-xs text-foreground/80">Target</div>
        </div>
        <div
          className={`rounded-lg p-3 text-center border ${
            isDark
              ? "bg-amber-900/20 border-amber-700"
              : "bg-amber-100 border-amber-300"
          }`}
        >
          <div className="text-xl font-bold text-foreground mb-1">
            {results.sample_rate}Hz
          </div>
          <div className="text-xs text-foreground/80">Sample Rate</div>
        </div>
      </div>
      {/* Audio Player */}
      {/* // In the AudioPlayer section, add targetUrl prop: */}
      <AudioPlayer
        targetFilename={results.target_filename}
        detections={results.detections}
        analysisId={results.analysis_id}
        isDark={isDark}
        targetUrl={results.target_url} // ADD THIS LINE
      />
      {/* Download Button */}
      <button
        onClick={downloadResults}
        className={`w-full py-3 rounded-lg font-medium border transition-all ${
          isDark
            ? "bg-emerald-700 hover:bg-emerald-600 border-emerald-600 text-white"
            : "bg-emerald-500 hover:bg-emerald-600 border-emerald-600 text-white"
        }`}
      >
        Download Full Results (JSON)
      </button>
      {/* Charts */}
      <WaveformChart
        data={results.waveform_data}
        detections={results.detections}
        //@ts-ignore
        targetDuration={results.target_duration}
        isDark={isDark}
      />
      <CorrelationChart data={results.correlation_data} isDark={isDark} />
      {/* Detection List */}
      <DetectionList detections={results.detections} isDark={isDark} />
    </div>
  );
}
