"use client";

import { useState, useRef, useEffect } from "react";
import { Detection } from "@/types";

interface AudioPlayerProps {
  targetFilename: string;
  detections: Detection[];
  analysisId: string;
  isDark: boolean;
  targetUrl?: string;
}

export default function AudioPlayer({
  targetFilename,
  detections,
  analysisId,
  isDark,
  targetUrl,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(
    null
  );

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, []);

  const playFromTime = (time: number, detection?: Detection) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      audioRef.current.play();
      setIsPlaying(true);
      if (detection) {
        setSelectedDetection(detection);
      }
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Use targetUrl if available, otherwise fall back to API endpoint
  const audioSrc = targetUrl || `${API_URL}/api/audio/${analysisId}`;

  return (
    <div
      className={`rounded-lg p-4 border ${
        isDark
          ? "bg-gray-800/50 border-gray-700"
          : "bg-stone-100 border-stone-300"
      }`}
    >
      <h3 className="text-lg font-medium mb-3">Audio Player</h3>

      {/* Selected Detection Info */}
      {selectedDetection && (
        <div
          className={`mb-3 p-3 rounded border ${
            isDark
              ? "bg-blue-900/20 border-blue-700"
              : "bg-blue-50 border-blue-300"
          }`}
        >
          <h4 className="font-medium mb-1">Currently Playing Detection</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className={isDark ? "text-blue-400" : "text-blue-600"}>
                Time:{" "}
              </span>
              <strong>{formatTime(selectedDetection.time)}</strong>
            </div>
            <div>
              <span className={isDark ? "text-blue-400" : "text-blue-600"}>
                Confidence:{" "}
              </span>
              <strong>
                {(selectedDetection.confidence * 100).toFixed(1)}%
              </strong>
            </div>
            {selectedDetection.methods && (
              <div className="col-span-2">
                <span className={isDark ? "text-blue-400" : "text-blue-600"}>
                  Methods:{" "}
                </span>
                <div className="flex gap-1 mt-1">
                  {selectedDetection.methods.map((method: string) => (
                    <span
                      key={method}
                      className={`px-2 py-1 rounded text-xs ${
                        isDark
                          ? "bg-blue-900/30 text-blue-300"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audio Player Controls */}
      <div
        className={`rounded p-3 border ${
          isDark
            ? "bg-gray-900/50 border-gray-600"
            : "bg-white border-stone-300"
        }`}
      >
        <audio ref={audioRef} src={audioSrc} className="hidden" />

        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={togglePlay}
            className={`px-3 py-2 rounded flex items-center justify-center transition-all border ${
              isDark
                ? "bg-amber-600 hover:bg-amber-700 border-amber-700 text-white"
                : "bg-amber-500 hover:bg-amber-600 border-amber-600 text-white"
            }`}
          >
            {isPlaying ? "⏸️ Pause" : "▶️ Play"}
          </button>

          <div className="flex-1">
            <div
              className={`text-sm mb-1 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {targetFilename}
            </div>
            <div className="flex justify-between text-xs mb-1">
              <span className={isDark ? "text-gray-400" : "text-gray-500"}>
                {formatTime(currentTime)}
              </span>
              <span className={isDark ? "text-gray-400" : "text-gray-500"}>
                {formatTime(duration)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className={`w-full h-1 rounded appearance-none cursor-pointer ${
                isDark ? "bg-gray-600" : "bg-gray-300"
              }`}
            />
          </div>
        </div>

        {/* Quick Play Buttons */}
        <div className="mt-3">
          <h4
            className={`text-sm font-medium mb-2 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Quick Play Detections:
          </h4>
          <div className="flex flex-wrap gap-2">
            {detections.slice(0, 6).map((detection, index) => (
              <button
                key={index}
                onClick={() => playFromTime(detection.time, detection)}
                className={`px-2 py-1 rounded text-sm transition-all border ${
                  isDark
                    ? "bg-emerald-700 hover:bg-emerald-600 border-emerald-600 text-white"
                    : "bg-emerald-500 hover:bg-emerald-600 border-emerald-600 text-white"
                }`}
              >
                #{index + 1} {formatTime(detection.time)} (
                {(detection.confidence * 100).toFixed(0)}%)
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
