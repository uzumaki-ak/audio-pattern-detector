"use client";

import { useState } from "react";
import { createClient } from "../lib/supabase";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage("Check your email for verification link!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setMessage("Signed in successfully!");
      }
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 rounded-lg shadow-lg border transition-colors bg-white dark:bg-gray-800 border-stone-300 dark:border-gray-600">
      <h2 className="text-2xl font-bold mb-6 text-center text-stone-800 dark:text-white">
        {isSignUp ? "Sign Up" : "Sign In"}
      </h2>

      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-stone-700 dark:text-gray-300">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors
              bg-white dark:bg-gray-700 
              border-stone-300 dark:border-gray-600 
              text-stone-900 dark:text-white
              placeholder-stone-500 dark:placeholder-gray-400"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-stone-700 dark:text-gray-300">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors
              bg-white dark:bg-gray-700 
              border-stone-300 dark:border-gray-600 
              text-stone-900 dark:text-white
              placeholder-stone-500 dark:placeholder-gray-400"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
        </button>
      </form>

      {message && (
        <div
          className={`mt-4 p-3 rounded-md text-sm transition-colors ${
            message.includes("error")
              ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300"
              : "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
          }`}
        >
          {message}
        </div>
      )}

      <div className="mt-4 text-center">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 text-sm transition-colors"
        >
          {isSignUp
            ? "Already have an account? Sign In"
            : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}
