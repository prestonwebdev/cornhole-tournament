"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { User, Users, BookOpen, ChevronRight, FlaskConical, Zap, Loader2, Calendar, Clock, Trash2, Eye, EyeOff } from "lucide-react";
import { LeaveTeamButton } from "@/components/menu/leave-team-button";
import { SignOutButton } from "@/components/menu/sign-out-button";
import { RulesSheet } from "@/components/menu/rules-sheet";
import { useDemoMode } from "@/lib/hooks/use-demo-mode";
import { startTournament, stopTournament, toggleBracketVisibility, resetBracket } from "@/lib/actions/match";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface Profile {
  id: string;
  display_name: string | null;
  email: string;
  is_admin?: boolean;
}

interface Player {
  id: string;
  display_name: string | null;
  email: string;
}

interface Team {
  name: string;
  player1: Player | null;
  player2: Player | null;
}

interface MenuContentProps {
  profile: Profile | null;
  team: Team | null;
  isTournamentLive?: boolean;
  scheduledEventDate?: string | null;
  bracketPublished?: boolean;
}

export function MenuContent({ profile, team, isTournamentLive = false, scheduledEventDate, bracketPublished = false }: MenuContentProps) {
  const [rulesSheetOpen, setRulesSheetOpen] = useState(false);
  const [scheduleSheetOpen, setScheduleSheetOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const demoMode = useDemoMode();
  const isAdmin = profile?.is_admin ?? false;

  // Check if tournament is scheduled for the future
  const isScheduled = scheduledEventDate && new Date(scheduledEventDate).getTime() > Date.now();

  const handleStartNow = () => {
    startTransition(async () => {
      await startTournament();
      setScheduleSheetOpen(false);
    });
  };

  const handleSchedule = () => {
    if (!scheduleDate || !scheduleTime) return;
    startTransition(async () => {
      const dateTime = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      await startTournament(dateTime);
      setScheduleSheetOpen(false);
    });
  };

  const handleStopTournament = () => {
    startTransition(async () => {
      await stopTournament();
    });
  };

  const [bracketError, setBracketError] = useState<string | null>(null);

  const handleToggleBracketVisibility = () => {
    setBracketError(null);
    startTransition(async () => {
      const result = await toggleBracketVisibility();
      if (result.error) {
        setBracketError(result.error);
      }
    });
  };

  const handleResetBracket = () => {
    setBracketError(null);
    startTransition(async () => {
      const result = await resetBracket();
      if (result.error) {
        setBracketError(result.error);
      }
    });
  };

  // Get display name with multiple fallbacks
  // Priority: team player data (most reliable) -> profile -> email username
  const getDisplayName = () => {
    // First try team player data
    if (team && profile) {
      if (team.player1?.id === profile.id) {
        if (team.player1.display_name) return team.player1.display_name;
        if (team.player1.email) return team.player1.email.split("@")[0];
      }
      if (team.player2?.id === profile.id) {
        if (team.player2.display_name) return team.player2.display_name;
        if (team.player2.email) return team.player2.email.split("@")[0];
      }
    }
    // Then try profile data
    if (profile?.display_name) return profile.display_name;
    if (profile?.email) return profile.email.split("@")[0];
    return "Player";
  };
  const displayName = getDisplayName();

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.1 }
        }
      }}
    >
      {/* Header */}
      <motion.div
        className="pt-4"
        variants={{
          hidden: { opacity: 0, y: -10 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
        }}
      >
        <h1 className="text-2xl font-bold text-white">More</h1>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        className="bg-white/5 rounded-2xl p-6"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
        }}
      >
        <div className="flex items-center gap-4">
          <motion.div
            className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          >
            <User className="h-8 w-8 text-white/60" />
          </motion.div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">{displayName}</h2>
            <p className="text-white/60 text-sm">{profile?.email}</p>
          </div>
        </div>
      </motion.div>

      {/* Team Section */}
      {team && (
        <motion.div
          className="bg-white/5 rounded-2xl overflow-hidden"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1 } }
          }}
        >
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-white/60" />
              <div>
                <p className="text-sm text-white/60">Your Team</p>
                <p className="font-semibold text-white">{team.name}</p>
              </div>
            </div>
          </div>
          <LeaveTeamButton />
        </motion.div>
      )}

      {/* Rules */}
      <motion.div
        className="bg-white/5 rounded-2xl overflow-hidden"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } }
        }}
      >
        <button
          onClick={() => setRulesSheetOpen(true)}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-white/60" />
            <span className="text-white">Cornhole Rules</span>
          </div>
          <ChevronRight className="h-5 w-5 text-white/40" />
        </button>
      </motion.div>

      {/* Admin Section */}
      {isAdmin && demoMode.isLoaded && (
        <motion.div
          className="bg-white/5 rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-300">Admin Controls</span>
            </div>
          </div>

          {/* Tournament Status */}
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className={`h-5 w-5 ${isTournamentLive ? "text-green-400" : isScheduled ? "text-yellow-400" : "text-white/60"}`} />
                <div>
                  <span className="text-white">Tournament Status</span>
                  <p className="text-xs text-white/40">
                    {isTournamentLive
                      ? "Live now"
                      : isScheduled
                        ? `Scheduled: ${new Date(scheduledEventDate!).toLocaleString()}`
                        : "Not scheduled"}
                  </p>
                </div>
              </div>
              {isTournamentLive ? (
                <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">
                  LIVE
                </span>
              ) : isScheduled ? (
                <span className="px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded-full">
                  SCHEDULED
                </span>
              ) : null}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mt-3">
              {!isTournamentLive && !isScheduled && (
                <button
                  onClick={() => setScheduleSheetOpen(true)}
                  disabled={isPending}
                  className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  Start Tournament
                </button>
              )}
              {(isTournamentLive || isScheduled) && (
                <button
                  onClick={handleStopTournament}
                  disabled={isPending}
                  className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isTournamentLive ? "Stop Tournament" : "Cancel Schedule"}
                </button>
              )}
              {isScheduled && !isTournamentLive && (
                <button
                  onClick={() => setScheduleSheetOpen(true)}
                  disabled={isPending}
                  className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Calendar className="h-4 w-4" />
                  Reschedule
                </button>
              )}
            </div>
          </div>

          {/* Bracket Controls */}
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {bracketPublished ? (
                  <Eye className="h-5 w-5 text-green-400" />
                ) : (
                  <EyeOff className="h-5 w-5 text-white/60" />
                )}
                <div>
                  <span className="text-white">Bracket Visibility</span>
                  <p className="text-xs text-white/40">
                    {bracketPublished ? "Visible to all players" : "Hidden from players"}
                  </p>
                </div>
              </div>
              {bracketPublished && (
                <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">
                  PUBLIC
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleToggleBracketVisibility}
                disabled={isPending}
                className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${
                  bracketPublished
                    ? "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : bracketPublished ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {bracketPublished ? "Unpublish" : "Publish Bracket"}
              </button>
              <button
                onClick={handleResetBracket}
                disabled={isPending}
                className="py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Reset
              </button>
            </div>
            {bracketError && (
              <p className="text-red-400 text-xs mt-2">{bracketError}</p>
            )}
          </div>

          {/* Demo Mode Toggle */}
          <button
            onClick={demoMode.toggle}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FlaskConical className="h-5 w-5 text-white/60" />
              <div>
                <span className="text-white">Demo Mode</span>
                <p className="text-xs text-white/40">Test bracket with mock data</p>
              </div>
            </div>
            <div
              className={`w-12 h-7 rounded-full p-1 transition-colors ${
                demoMode.isEnabled ? "bg-purple-500" : "bg-white/20"
              }`}
            >
              <motion.div
                className="w-5 h-5 rounded-full bg-white"
                animate={{ x: demoMode.isEnabled ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </div>
          </button>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        className="bg-white/5 rounded-2xl overflow-hidden"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.3 } }
        }}
      >
        <SignOutButton />
      </motion.div>

      {/* App Info */}
      <motion.div
        className="text-center pt-4"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: 0.5, delay: 0.4 } }
        }}
      >
        <p className="text-white/30 text-xs">Copperbend Cornhole Tournament</p>
        <p className="text-white/20 text-xs mt-1">Version 1.0</p>
      </motion.div>

      <RulesSheet open={rulesSheetOpen} onOpenChange={setRulesSheetOpen} />

      {/* Schedule Tournament Sheet */}
      <Sheet open={scheduleSheetOpen} onOpenChange={setScheduleSheetOpen}>
        <SheetContent side="bottom" className="bg-zinc-900 border-t border-white/10 rounded-t-3xl">
          <SheetHeader className="text-left pb-4">
            <SheetTitle className="text-white text-xl">Start Tournament</SheetTitle>
            <SheetDescription className="text-white/60">
              Start the tournament now or schedule it for later
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4">
            {/* Start Now Option */}
            <button
              onClick={handleStartNow}
              disabled={isPending}
              className="w-full p-4 bg-green-500 hover:bg-green-600 disabled:opacity-50 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Zap className="h-5 w-5" />
              )}
              Start Now
            </button>

            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/40 text-sm">or schedule for later</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Schedule Option */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-white/60 text-xs mb-1 block">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 rounded-lg py-3 pl-10 pr-3 text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-white/60 text-xs mb-1 block">Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 rounded-lg py-3 pl-10 pr-3 text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSchedule}
                disabled={isPending || !scheduleDate || !scheduleTime}
                className="w-full p-4 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Calendar className="h-5 w-5" />
                )}
                Schedule Tournament
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}
