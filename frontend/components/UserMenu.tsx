"use client";

import { useState, useEffect } from "react";
import { createClient } from "../lib/supabase";
import { User } from "@supabase/supabase-js";

export default function UserMenu({ isDark }: { isDark: boolean }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div
        className={`px-3 py-2 rounded-lg border ${
          isDark
            ? "bg-gray-800 border-gray-600"
            : "bg-stone-200 border-stone-300"
        }`}
      >
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className={`px-3 py-2 rounded-lg border ${
          isDark
            ? "bg-gray-800 border-gray-600 text-gray-200"
            : "bg-stone-200 border-stone-300 text-stone-700"
        }`}
      >
        <span className="text-sm">{user.email}</span>
      </div>
      <button
        onClick={handleSignOut}
        className={`px-3 py-2 rounded-lg border text-sm transition-all ${
          isDark
            ? "bg-rose-700 hover:bg-rose-600 border-rose-600 text-white"
            : "bg-rose-500 hover:bg-rose-600 border-rose-600 text-white"
        }`}
      >
        Sign Out
      </button>
    </div>
  );
}
