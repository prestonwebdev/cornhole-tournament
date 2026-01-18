"use client";

import { useMockBracket, type BracketScenario } from "@/lib/test-data";
import { RotateCcw } from "lucide-react";
import { BracketContent } from "@/components/bracket/bracket-content";

export default function BracketTestPage() {
  const bracket = useMockBracket("8-team-fresh");

  const pendingMatches = bracket.getPendingMatches();
  const completedMatches = bracket.getCompletedMatches();
  const inProgressMatches = bracket.matches.filter(m => m.status === "in_progress");

  const handleStartMatch = (matchId: string) => {
    bracket.startMatch(matchId);
  };

  const handleCompleteMatch = (matchId: string, scoreA: number, scoreB: number) => {
    const match = bracket.getMatch(matchId);
    if (!match) return;

    // Determine winner based on scores
    const winnerId = scoreA > scoreB ? match.team_a_id : match.team_b_id;
    if (!winnerId) return;

    bracket.recordResult(matchId, winnerId, scoreA, scoreB);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-white">Bracket Test Playground</h1>
        <p className="text-white/60 text-sm">
          Test bracket logic with mock data (no database changes)
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white/5 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-white">Scenario</h2>
          <button
            onClick={() => bracket.reset()}
            className="flex items-center gap-1 text-sm text-white/60 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {bracket.scenarios.map((s) => (
            <button
              key={s}
              onClick={() => bracket.loadScenario(s)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                bracket.scenario === s
                  ? "bg-white text-[#1a1a1a]"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm flex-wrap">
          <div className="bg-white/5 rounded-lg px-3 py-2">
            <span className="text-white/40">Pending:</span>{" "}
            <span className="text-white font-medium">{pendingMatches.length}</span>
          </div>
          <div className="bg-yellow-500/10 rounded-lg px-3 py-2">
            <span className="text-yellow-400/60">In Progress:</span>{" "}
            <span className="text-yellow-400 font-medium">{inProgressMatches.length}</span>
          </div>
          <div className="bg-green-500/10 rounded-lg px-3 py-2">
            <span className="text-green-400/60">Completed:</span>{" "}
            <span className="text-green-400 font-medium">{completedMatches.length}</span>
          </div>
          <div className="bg-white/5 rounded-lg px-3 py-2">
            <span className="text-white/40">Total:</span>{" "}
            <span className="text-white font-medium">{bracket.matches.length}</span>
          </div>
        </div>
      </div>

      {/* Bracket Display */}
      <BracketContent
        matches={bracket.matches}
        onStartMatch={handleStartMatch}
        onCompleteMatch={handleCompleteMatch}
        canUserInteract={true}
      />

      {/* Debug: Raw match data */}
      <details className="bg-white/5 rounded-xl p-4">
        <summary className="text-white/60 text-sm cursor-pointer hover:text-white">
          View Raw Match Data (JSON)
        </summary>
        <pre className="mt-4 text-xs text-white/40 overflow-auto max-h-96">
          {JSON.stringify(bracket.matches, null, 2)}
        </pre>
      </details>
    </div>
  );
}
