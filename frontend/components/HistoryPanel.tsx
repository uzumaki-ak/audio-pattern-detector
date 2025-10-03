"use client";

import { useState, useEffect } from "react";
import { createClient } from "../lib/supabase";
import { AnalysisResult } from "types";

interface AnalysisHistory {
  id: string;
  analysis_id: string;
  pattern_filename: string;
  target_filename: string;
  detection_count: number;
  created_at: string;
}

interface HistoryPanelProps {
  isDark: boolean;
  onLoadAnalysis: (analysis: AnalysisResult) => void;
}

export default function HistoryPanel({
  isDark,
  onLoadAnalysis,
}: HistoryPanelProps) {
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("audio_analysis")
        .select(
          "id, analysis_id, pattern_filename, target_filename, detection_count, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysisResult = async (analysisId: string) => {
    try {
      const { data, error } = await supabase
        .from("audio_analysis")
        .select("*")
        .eq("analysis_id", analysisId)
        .single();

      if (error) throw error;

      // Convert back to AnalysisResult format
      const analysisResult: AnalysisResult = {
        analysis_id: data.analysis_id,
        timestamp: data.created_at,
        pattern_filename: data.pattern_filename,
        target_filename: data.target_filename,
        detection_count: data.detection_count,
        detections: data.detections,
        pattern_duration: data.pattern_duration,
        target_duration: data.target_duration,
        sample_rate: data.sample_rate,
        waveform_data: data.waveform_data,
        correlation_data: data.correlation_data,
        analysis_methods: data.analysis_methods,
        result_file: "",
      };

      onLoadAnalysis(analysisResult);
    } catch (error) {
      console.error("Error loading analysis:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div
        className={`rounded-lg p-4 border ${
          isDark
            ? "bg-gray-800/50 border-gray-700"
            : "bg-stone-100 border-stone-300"
        }`}
      >
        <div className="animate-pulse">Loading history...</div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`rounded-lg p-4 border ${
          isDark
            ? "bg-gray-800/50 border-gray-700"
            : "bg-stone-100 border-stone-300"
        }`}
      >
        <h3 className="text-lg font-medium mb-3">Analysis History</h3>

        {history.length === 0 ? (
          <p
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            No previous analyses found
          </p>
        ) : (
          // added 'history-scroll' to target scrollbar CSS
          <div className="space-y-2 max-h-80 overflow-y-auto history-scroll">
            {history.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded border cursor-pointer transition-all hover:scale-105 ${
                  isDark
                    ? "bg-gray-900/50 border-gray-600 hover:bg-gray-800/50"
                    : "bg-white border-stone-300 hover:bg-stone-50"
                }`}
                onClick={() => loadAnalysisResult(item.analysis_id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-medium text-sm truncate flex-1">
                    {item.pattern_filename}
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      isDark
                        ? "bg-amber-900/30 text-amber-300"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.detection_count} matches
                  </span>
                </div>
                <div
                  className={`text-xs ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Target: {item.target_filename}
                </div>
                <div
                  className={`text-xs ${
                    isDark ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {formatDate(item.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hide scrollbars but keep scroll functionality across browsers */}
      <style jsx>{`
        .history-scroll {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
        .history-scroll::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `}</style>
    </>
  );
}
