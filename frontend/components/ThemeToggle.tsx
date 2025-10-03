"use client";

interface ThemeToggleProps {
  isDark: boolean;
  toggleTheme: () => void;
}

export default function ThemeToggle({ isDark, toggleTheme }: ThemeToggleProps) {
  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg border transition-all ${
        isDark
          ? "bg-gray-800 border-gray-600 hover:bg-gray-700"
          : "bg-stone-200 border-stone-300 hover:bg-stone-300"
      }`}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <span className="text-amber-200">Light</span>
      ) : (
        <span className="text-amber-700">Dark</span>
      )}
    </button>
  );
}
