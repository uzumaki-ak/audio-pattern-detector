"use client";
import { useState } from "react";

interface FileUploadProps {
  label: string;
  description: string;
  file: File | null;
  onFileSelect: (file: File | null) => void;
  isDark: boolean;
}

export default function FileUpload({
  label,
  description,
  file,
  onFileSelect,
  isDark,
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type.startsWith("audio/")) {
        onFileSelect(droppedFile);
      } else {
        alert("Please upload only audio files");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type.startsWith("audio/")) {
        onFileSelect(selectedFile);
      } else {
        alert("Please upload only audio files");
        e.target.value = "";
      }
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer ${
        file
          ? isDark
            ? "border-emerald-600 bg-emerald-900/20"
            : "border-emerald-500 bg-emerald-50"
          : dragOver
          ? isDark
            ? "border-amber-500 bg-amber-900/20 scale-105"
            : "border-amber-400 bg-amber-50 scale-105"
          : isDark
          ? "border-gray-600 hover:border-amber-500 hover:bg-gray-800/50"
          : "border-stone-300 hover:border-amber-400 hover:bg-stone-200/50"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById(label)?.click()}
    >
      <input
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
        onChange={handleFileSelect}
        className="hidden"
        id={label}
      />

      <div className="cursor-pointer">
        <h3
          className={`text-lg font-medium mb-1 ${
            isDark ? "text-gray-200" : "text-gray-800"
          }`}
        >
          {label}
        </h3>
        <p
          className={`text-sm mb-2 ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {description}
        </p>

        {file ? (
          <div
            className={
              isDark
                ? "bg-emerald-900/30 border-emerald-700"
                : "bg-emerald-100 border-emerald-300 " + "rounded-lg p-3 border"
            }
          >
            <div className="flex items-center justify-between">
              <div className="text-left flex-1 ">
                <p
                  className={
                    (isDark ? "text-emerald-200" : "text-emerald-800") +
                    " px-2 py-1 rounded"
                  }
                >
                  {file.name}
                </p>
                <p
                  className={`text-xs ${
                    isDark ? "text-emerald-400" : "text-emerald-600"
                  } px-2`}
                >
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>

              <button
                onClick={removeFile}
                className={
                  (isDark
                    ? "text-rose-400 hover:text-rose-300"
                    : "text-rose-500 hover:text-rose-700") +
                  " px-2 py-1 rounded"
                }
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}
          >
            <p>Click to browse or drag & drop</p>
            <p className="mt-1">Supports: MP3, WAV, OGG, M4A, AAC, FLAC</p>
          </div>
        )}
      </div>
    </div>
  );
}
