"use client";

import { useState } from "react";
import { signOut } from "@/lib/actions/auth";
import { LogOut, Loader2, ChevronRight } from "lucide-react";

export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    setIsLoading(true);
    await signOut();
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isLoading}
      className="w-full p-4 flex items-center gap-3 text-white/60 hover:bg-white/5 transition-colors"
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <LogOut className="h-5 w-5" />
      )}
      <span className="flex-1 text-left">Sign Out</span>
      <ChevronRight className="h-5 w-5 text-white/30" />
    </button>
  );
}
