"use client";

import { useState } from "react";
import Link from "next/link";
import { joinTeam } from "@/lib/actions/team";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Users, UserPlus, AlertCircle, CheckCircle2, User } from "lucide-react";
import { CornholeIcon } from "@/components/icons/cornhole-icon";

interface TeamData {
  id: string;
  name: string;
  player1: { display_name: string | null; email: string } | null;
  player2: { display_name: string | null; email: string } | null;
}

interface JoinTeamHandlerProps {
  team: TeamData | null;
  token: string;
  isLoggedIn: boolean;
  currentUserId?: string;
  currentUserTeamId?: string | null;
}

export function JoinTeamHandler({
  team,
  token,
  isLoggedIn,
  currentUserTeamId,
}: JoinTeamHandlerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const { toast } = useToast();

  // Team not found
  if (!team) {
    return (
      <div className="w-full max-w-sm mx-auto bg-white/5 rounded-2xl p-6 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="h-7 w-7 text-red-400" />
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">Invalid Invite Link</h1>
        <p className="text-white/60 text-sm mb-6">
          This invite link is invalid or has expired.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
        >
          Go Home
        </Link>
      </div>
    );
  }

  // Team is already full
  if (team.player2) {
    return (
      <div className="w-full max-w-sm mx-auto bg-white/5 rounded-2xl p-6 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-4">
          <Users className="h-7 w-7 text-white/60" />
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">Team is Full</h1>
        <p className="text-white/60 text-sm mb-6">
          {team.name} already has two players.
        </p>
        <div className="bg-white/5 rounded-xl p-4 space-y-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <User className="h-4 w-4 text-white/60" />
            </div>
            <span className="text-white">{team.player1?.display_name || team.player1?.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <User className="h-4 w-4 text-white/60" />
            </div>
            <span className="text-white">{team.player2?.display_name || team.player2?.email}</span>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  // User already on a team
  if (isLoggedIn && currentUserTeamId) {
    return (
      <div className="w-full max-w-sm mx-auto bg-white/5 rounded-2xl p-6 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-4">
          <AlertCircle className="h-7 w-7 text-white/60" />
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">Already on a Team</h1>
        <p className="text-white/60 text-sm mb-6">
          You&apos;re already on a team. Contact an admin if you need to switch teams.
        </p>
        <Link
          href="/dashboard"
          className="inline-block w-full py-4 bg-white text-[#1a1a1a] rounded-xl font-medium hover:bg-white/90 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  // Successfully joined
  if (joined) {
    return (
      <div className="w-full max-w-sm mx-auto bg-white/5 rounded-2xl p-6 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
          <CheckCircle className="h-7 w-7 text-green-400" />
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">You&apos;re on the team!</h1>
        <p className="text-white/60 text-sm mb-6">
          Welcome to {team.name}. Your team is now complete.
        </p>
        <Link
          href={`/team/${team.id}`}
          className="inline-block w-full py-4 bg-white text-[#1a1a1a] rounded-xl font-medium hover:bg-white/90 transition-colors"
        >
          View Your Team
        </Link>
      </div>
    );
  }

  // Not logged in - show auth options
  if (!isLoggedIn) {
    return (
      <div className="w-full max-w-sm mx-auto bg-white/5 rounded-2xl p-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-4">
            <CornholeIcon className="h-7 w-7 text-white/60" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Play in the Copperbend Cornhole Tournament</h1>
          <p className="text-white/60 text-sm">
            {team.player1?.display_name || "A player"} has invited you to play on their team, &quot;{team.name}&quot;
          </p>
        </div>

        <div className="mb-6">
          <p className="font-semibold text-white mb-3">{team.name}</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-white/60 font-medium">1</span>
              </div>
              <span className="flex-1 text-white">{team.player1?.display_name || team.player1?.email}</span>
              <CheckCircle2 className="h-6 w-6 text-green-400" />
            </div>
            <div className="flex items-center gap-3 border-2 border-dashed border-white/20 rounded-xl p-3">
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center">
                <span className="text-white/40 font-medium">2</span>
              </div>
              <span className="text-white/40">Waiting for teammate...</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-white/40 text-center mb-6">
          Log in or create an account to join this team
        </p>

        <div className="space-y-3">
          <Link
            href={`/login?token=${token}`}
            className="block w-full py-4 bg-white text-[#1a1a1a] rounded-xl font-medium text-center hover:bg-white/90 transition-colors"
          >
            Log In
          </Link>
          <Link
            href={`/signup?token=${token}`}
            className="block w-full py-4 bg-transparent border border-white/20 text-white rounded-xl font-medium text-center hover:bg-white/5 transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  // Logged in and can join
  async function handleJoin() {
    setIsLoading(true);
    const result = await joinTeam(token);
    setIsLoading(false);

    if (result.error) {
      toast({
        title: "Failed to join team",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    setJoined(true);
  }

  return (
    <div className="w-full max-w-sm mx-auto bg-white/5 rounded-2xl p-6">
      <div className="text-center mb-6">
        <div className="mx-auto w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-4">
          <CornholeIcon className="h-7 w-7 text-white/60" />
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">Play in the Copperbend Cornhole Tournament</h1>
        <p className="text-white/60 text-sm">
          {team.player1?.display_name || "A player"} has invited you to play on their team, &quot;{team.name}&quot;
        </p>
      </div>

      <div className="mb-6">
        <p className="font-semibold text-white mb-3">{team.name}</p>
        <div className="space-y-2">
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-white/60 font-medium">1</span>
            </div>
            <span className="flex-1 text-white">{team.player1?.display_name || team.player1?.email}</span>
            <CheckCircle2 className="h-6 w-6 text-green-400" />
          </div>
          <div className="flex items-center gap-3 border-2 border-dashed border-white/20 rounded-xl p-3">
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center">
              <span className="text-white/40 font-medium">2</span>
            </div>
            <span className="text-white/40">Waiting for teammate...</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleJoin}
        disabled={isLoading}
        className="w-full py-4 bg-white text-[#1a1a1a] rounded-xl font-medium hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Joining...
          </>
        ) : (
          <>
            <UserPlus className="h-5 w-5" />
            Accept & Join Team
          </>
        )}
      </button>
    </div>
  );
}
