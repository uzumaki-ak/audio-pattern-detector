"use client";

import { useState, useEffect, useCallback } from "react";
import FileUpload from "../components/FileUpload";
import ResultsDisplay from "../components/ResultsDisplay";
import { analyzeAudio, testConnection } from "../lib/api";
import { AnalysisResult } from "types";
import ThemeToggle from "components/ThemeToggle";
import Auth from "components/Auth";
import UserMenu from "components/UserMenu";
import HistoryPanel from "components/HistoryPanel";
import { createClient } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function Home() {
  const [patternFile, setPatternFile] = useState<File | null>(null);
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(
    null
  );
  const [progress, setProgress] = useState<string>("");
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showDocs, setShowDocs] = useState(false);
  const [apiDocs, setApiDocs] = useState<any>(null);

  const supabase = createClient();

  // Centralized theme toggle
  const toggleTheme = useCallback(() => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    try {
      localStorage.setItem("theme", newTheme ? "dark" : "light");
    } catch {
      /* ignore (SSR protective) */
    }
    document.documentElement.classList.toggle("dark", newTheme);
  }, [isDark]);

  useEffect(() => {
    // initial theme calculation
    const isDarkMode =
      (typeof window !== "undefined" &&
        (localStorage.getItem("theme") === "dark" ||
          (!localStorage.getItem("theme") &&
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches))) ||
      false;
    setIsDark(isDarkMode);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", isDarkMode);
    }

    // Auth: subscribe to changes & get initial user
    let unsubscribeFn: (() => void) | undefined;
    (async () => {
      try {
        // try to read current session/user
        const { data: sessionData } = await supabase.auth.getSession();
        setUser(sessionData?.session?.user ?? null);
      } catch {
        // ignore
      }

      try {
        // onAuthStateChange may return different shapes; handle safely
        const subResponse: any = supabase.auth.onAuthStateChange(
          (_event: string, session: any) => {
            setUser(session?.user ?? null);
          }
        );
        // subResponse could be { data: { subscription } } or { subscription }
        if (subResponse?.data?.subscription?.unsubscribe) {
          unsubscribeFn = () => subResponse.data.subscription.unsubscribe();
        } else if (subResponse?.subscription?.unsubscribe) {
          unsubscribeFn = () => subResponse.subscription.unsubscribe();
        } else if (typeof subResponse === "function") {
          // rare shape
          unsubscribeFn = subResponse;
        }
      } catch {
        // ignore
      }
    })();

    // kick off backend check + docs load
    checkBackend();
    loadApiDocs();

    return () => {
      if (unsubscribeFn) unsubscribeFn();
    };
    // intentionally empty deps except supabase is stable (createClient returns same client)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkBackend = async () => {
    const connected = await testConnection();
    setBackendConnected(connected);
    if (!connected) {
      setError(
        "Backend server not connected. Make sure Python backend is running on port 8000."
      );
    }
  };

  const loadApiDocs = async () => {
    try {
      const { getApiDocs } = await import("../lib/api");
      if (getApiDocs) {
        const docs = await getApiDocs();
        setApiDocs(docs);
      }
    } catch (err) {
      // it's optional; ignore silently and leave apiDocs null
      console.warn("Could not load API docs:", err);
      setApiDocs(null);
    }
  };

  const handleAnalyze = async () => {
    if (!patternFile || !targetFile) {
      setError("Please upload both pattern and target audio files");
      return;
    }

    if (!user) {
      setError("You must be signed in to analyze audio");
      return;
    }

    setLoading(true);
    setError(null);
    setProgress("Starting analysis...");

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev.includes("Processing")) {
            // basic dot spinner
            const dots = (prev.match(/\./g) || []).length;
            const next = (dots + 1) % 4;
            return `Processing audio${".".repeat(next)}`;
          }
          return "Processing audio.";
        });
      }, 1500);

      const data = await analyzeAudio(patternFile, targetFile);

      clearInterval(progressInterval);
      setProgress("Complete!");
      setResults(data);

      // Clear progress after a short delay
      setTimeout(() => setProgress(""), 1500);
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(err?.message || "Analysis failed. Please try again.");
      setProgress("");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPatternFile(null);
    setTargetFile(null);
    setResults(null);
    setError(null);
    setProgress("");
  };

  const handleLoadAnalysis = (analysis: AnalysisResult) => {
    setResults(analysis);
    setError(null);
  };

  // If user is not authenticated, show auth component
  if (!user) {
    return (
      <main
        className={`min-h-screen grain-texture transition-colors duration-300 ${
          isDark ? "bg-gray-900" : "bg-stone-100"
        } py-8 px-4 flex items-center justify-center`}
      >
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-heading font-bold text-foreground mb-2">
              Audio Pattern Detection
            </h1>
            <p className="text-foreground/80">
              Sign in to start analyzing audio patterns
            </p>
            <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
          </div>
          <Auth />
        </div>
      </main>
    );
  }

  return (
    <main
      className={`min-h-screen grain-texture transition-colors duration-300 ${
        isDark ? "bg-gray-900" : "bg-stone-100"
      } py-8 px-4`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-6">
            <UserMenu isDark={isDark} />
            <h1 className="text-4xl font-heading font-bold text-foreground">
              Audio Pattern Detection
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDocs(!showDocs)}
                className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                  isDark
                    ? "bg-blue-700 hover:bg-blue-600 border-blue-600 text-white"
                    : "bg-blue-500 hover:bg-blue-600 border-blue-600 text-white"
                }`}
              >
                {showDocs ? "Hide Docs" : "API Docs"}
              </button>
              <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
            </div>
          </div>
          <p className="text-lg text-foreground/80 font-light">
            Industry-grade pattern matching using cross-correlation analysis
          </p>

          <div
            className={`mt-4 inline-block px-4 py-2 rounded-full border ${
              backendConnected === null
                ? "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200"
                : backendConnected
                ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200"
                : "bg-rose-100 dark:bg-rose-900/30 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200"
            } transition-colors`}
          >
            {backendConnected === null
              ? "Checking backend connection"
              : backendConnected
              ? "Backend Connected"
              : "Backend Disconnected"}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* API Docs */}
            {showDocs && apiDocs && (
              <div
                className={`frosted-glass rounded-2xl shadow-lg border p-6 ${
                  isDark ? "border-gray-700" : "border-stone-300"
                }`}
              >
                <h3 className="text-xl font-bold mb-4">API Documentation</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Endpoints:</h4>
                    <pre className="bg-black/20 p-3 rounded text-sm overflow-x-auto">
                      {JSON.stringify(apiDocs.endpoints ?? apiDocs, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-semibold">Authentication:</h4>
                    <p>{apiDocs.authentication ?? "Supabase auth (JWT)"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">File Limits:</h4>
                    <p>
                      {apiDocs.file_limits ??
                        "No explicit limits (enforced by backend)"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div
              className={`frosted-glass rounded-2xl shadow-lg border ${
                isDark ? "border-gray-700" : "border-stone-300"
              } p-6 transition-colors`}
            >
              {/* Progress Display */}
              {loading && progress && (
                <div
                  className={`mb-6 border-l-4 p-4 rounded ${
                    isDark
                      ? "bg-blue-900/20 border-blue-600"
                      : "bg-blue-50 border-blue-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`animate-spin rounded-full h-5 w-5 border-b-2 ${
                        isDark ? "border-blue-400" : "border-blue-600"
                      }`}
                    ></div>
                    <div>
                      <p className={isDark ? "text-blue-300" : "text-blue-700"}>
                        {progress}
                      </p>
                      <p
                        className={`text-sm ${
                          isDark ? "text-blue-400" : "text-blue-600"
                        }`}
                      >
                        This may take 1-3 minutes for longer files
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tutorial */}
              <div
                className={`border-l-4 p-4 rounded-lg mb-6 ${
                  isDark
                    ? "bg-amber-900/20 border-amber-600"
                    : "bg-amber-50 border-amber-400"
                }`}
              >
                <h3 className="font-bold mb-2">How It Works</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>
                    <strong>Pattern Audio:</strong> The specific sound/phrase
                    you want to find
                  </li>
                  <li>
                    <strong>Target Audio:</strong> The full audio file where you
                    want to search
                  </li>
                  <li>Upload both files and click "Analyze"</li>
                  <li>
                    <strong>Note:</strong> Processing may take 1-3 minutes for
                    longer files
                  </li>
                </ol>
              </div>

              {/* File Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <FileUpload
                  label="Pattern Audio"
                  description="Upload the sound pattern to detect"
                  file={patternFile}
                  onFileSelect={setPatternFile}
                  isDark={isDark}
                />
                <FileUpload
                  label="Target Audio"
                  description="Upload the audio to analyze"
                  file={targetFile}
                  onFileSelect={setTargetFile}
                  isDark={isDark}
                />
              </div>

              {/* File Info */}
              {(patternFile || targetFile) && (
                <div
                  className={`border-l-4 p-3 rounded mb-4 ${
                    isDark
                      ? "bg-blue-900/20 border-blue-600"
                      : "bg-blue-50 border-blue-400"
                  }`}
                >
                  <h4 className="font-bold mb-1 text-sm">Selected Files</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs">
                    {patternFile && (
                      <div>
                        Pattern: <strong>{patternFile.name}</strong> (
                        {(patternFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </div>
                    )}
                    {targetFile && (
                      <div>
                        Target: <strong>{targetFile.name}</strong> (
                        {(targetFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAnalyze}
                  disabled={
                    !patternFile ||
                    !targetFile ||
                    loading ||
                    backendConnected === false
                  }
                  className={`flex-1 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border ${
                    isDark
                      ? "bg-amber-600 hover:bg-amber-700 border-amber-700 text-white"
                      : "bg-amber-500 hover:bg-amber-600 border-amber-600 text-white"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Analyzing... (Please wait)
                    </div>
                  ) : (
                    "Analyze Audio"
                  )}
                </button>
                <button
                  onClick={handleReset}
                  className={`px-6 py-3 rounded-lg font-medium border transition-all ${
                    isDark
                      ? "bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-200"
                      : "bg-stone-200 hover:bg-stone-300 border-stone-300 text-stone-700"
                  }`}
                >
                  Clear
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div
                  className={`mt-4 border-l-4 p-3 rounded ${
                    isDark
                      ? "bg-rose-900/20 border-rose-600"
                      : "bg-rose-50 border-rose-400"
                  }`}
                >
                  <div className="flex items-start">
                    <div>
                      <p className={isDark ? "text-rose-300" : "text-rose-700"}>
                        Error
                      </p>
                      <p
                        className={`text-sm ${
                          isDark ? "text-rose-400" : "text-rose-600"
                        }`}
                      >
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Results */}
            {results && <ResultsDisplay results={results} isDark={isDark} />}
          </div>

          {/* Sidebar - History */}
          <div className="space-y-6 max-h-[80vh] overflow-y-auto history-scroll">
            <HistoryPanel isDark={isDark} onLoadAnalysis={handleLoadAnalysis} />
          </div>
        </div>
      </div>
    </main>
  );
}
