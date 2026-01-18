"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { InviteLinkShare } from "@/components/team/invite-link-share";
import { CountdownTimer } from "@/components/countdown/countdown-timer";
import { CreateTeamSheet } from "@/components/team/create-team-sheet";
import { TeamManagementSheet } from "@/components/team/team-management-sheet";
import { NextMatchCard } from "@/components/dashboard/next-match-card";
import { TournamentStatus } from "@/components/dashboard/tournament-status";
import { startMatch } from "@/lib/actions/match";
import { generateDynamicBracket } from "@/lib/test-data";
import { Users, UserPlus, CheckCircle, Settings } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

interface Profile {
  id: string;
  display_name: string | null;
  email: string;
}

interface Player {
  id: string;
  display_name: string | null;
  email: string;
}

interface Team {
  id: string;
  name: string;
  player1: Player | null;
  player2: Player | null;
  invite_token: string;
}

interface MatchTeamInfo {
  id: string;
  name: string;
  player1_name?: string | null;
  player2_name?: string | null;
}

interface NextMatch {
  id: string;
  bracket_type: "winners" | "consolation";
  round_number: number;
  match_number: number;
  team_a_id: string | null;
  team_b_id: string | null;
  team_a: MatchTeamInfo | null;
  team_b: MatchTeamInfo | null;
  status: "pending" | "in_progress" | "complete";
  is_finals: boolean;
}

interface TournamentStatusData {
  status: "registration" | "in_progress" | "complete";
  userPlacement: 1 | 2 | 3 | 4 | null;
  isEliminated: boolean;
  teamId: string | null;
  eventDate: string | null;
}

interface RegisteredTeam {
  id: string;
  name: string;
  seed_number: number | null;
  player1_id: string | null;
  player2_id: string | null;
}

interface DashboardContentProps {
  profile: Profile | null;
  team: Team | null;
  takenTeamNames: string[];
  openTeamsCount: number;
  nextMatch: NextMatch | null;
  tournamentStatus: TournamentStatusData;
  registeredTeams: RegisteredTeam[];
  userRecord?: { wins: number; losses: number };
  opponentRecord?: { wins: number; losses: number };
}

export function DashboardContent({
  profile,
  team,
  takenTeamNames,
  openTeamsCount,
  nextMatch,
  tournamentStatus,
  registeredTeams,
  userRecord,
  opponentRecord,
}: DashboardContentProps) {
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [teamManagementSheetOpen, setTeamManagementSheetOpen] = useState(false);
  const { toast } = useToast();

  // Determine if tournament has started based on event_date
  const tournamentHasStarted = tournamentStatus.eventDate
    ? new Date(tournamentStatus.eventDate).getTime() <= Date.now()
    : false;

  // Generate mock next match from registered teams when no real match exists
  const mockNextMatch = useMemo(() => {
    // Only generate mock if tournament has started, no real nextMatch, and user has a team
    if (!tournamentHasStarted || nextMatch || !tournamentStatus.teamId) {
      return null;
    }

    // Find user's team in registered teams
    const userTeamIndex = registeredTeams.findIndex(t => t.id === tournamentStatus.teamId);

    // If user's team isn't in registered teams, use the team prop data
    const userTeam = userTeamIndex >= 0
      ? registeredTeams[userTeamIndex]
      : team ? { id: team.id, name: team.name, seed_number: null, player1_id: null, player2_id: null } : null;

    if (!userTeam) return null;

    // Generate bracket to find user's first match (use at least 2 teams for bracket generation)
    const teamCountForBracket = Math.max(registeredTeams.length, 2);
    const bracketMatches = generateDynamicBracket(teamCountForBracket);

    // Find the user's team mock ID
    const userTeamMockId = userTeamIndex >= 0 ? `t${userTeamIndex + 1}` : "t1";

    // Find all matches that include the user's team, sorted by round
    const userMatches = bracketMatches
      .filter(m => m.team_a_id === userTeamMockId || m.team_b_id === userTeamMockId)
      .sort((a, b) => a.round_number - b.round_number);

    // Find the first match where user has a real opponent (skip byes)
    let targetMatch = null;
    for (const match of userMatches) {
      const opponentMockId = match.team_a_id === userTeamMockId
        ? match.team_b_id
        : match.team_a_id;

      const opponentIndex = opponentMockId ? parseInt(opponentMockId.replace("t", "")) - 1 : -1;
      const hasRealOpponent = opponentIndex >= 0 && opponentIndex < registeredTeams.length;

      if (hasRealOpponent) {
        targetMatch = match;
        break;
      }
    }

    // If no match with real opponent found, use the first match (bye)
    if (!targetMatch && userMatches.length > 0) {
      targetMatch = userMatches[0];
    }

    if (!targetMatch) return null;

    // Get opponent team
    const opponentMockId = targetMatch.team_a_id === userTeamMockId
      ? targetMatch.team_b_id
      : targetMatch.team_a_id;

    const opponentIndex = opponentMockId ? parseInt(opponentMockId.replace("t", "")) - 1 : -1;
    const opponentTeam = opponentIndex >= 0 && opponentIndex < registeredTeams.length
      ? registeredTeams[opponentIndex]
      : null;

    // Create mock match object
    const isTeamA = targetMatch.team_a_id === userTeamMockId;
    return {
      id: targetMatch.id,
      bracket_type: targetMatch.bracket_type,
      round_number: targetMatch.round_number,
      match_number: targetMatch.match_number,
      team_a_id: isTeamA ? userTeam.id : (opponentTeam?.id || null),
      team_b_id: isTeamA ? (opponentTeam?.id || null) : userTeam.id,
      team_a: isTeamA ? { id: userTeam.id, name: userTeam.name } : (opponentTeam ? { id: opponentTeam.id, name: opponentTeam.name } : null),
      team_b: isTeamA ? (opponentTeam ? { id: opponentTeam.id, name: opponentTeam.name } : null) : { id: userTeam.id, name: userTeam.name },
      status: "pending" as const,
      is_finals: targetMatch.is_finals,
    };
  }, [tournamentHasStarted, nextMatch, tournamentStatus.teamId, registeredTeams, team]);

  // Use real match if available, otherwise use mock
  const effectiveNextMatch = nextMatch || mockNextMatch;

  const handleStartMatch = async (matchId: string) => {
    const result = await startMatch(matchId);
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Match Started!",
        description: "Good luck!",
      });
    }
  };

  // Get display name with multiple fallbacks
  // Priority: team player data (most reliable) -> profile -> email username
  const getDisplayName = () => {
    // First try team player data (this is working correctly per user feedback)
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
        <p className="text-white/60 text-sm">Welcome back,</p>
        <h1 className="text-2xl font-bold text-white">{displayName}</h1>
      </motion.div>

      {/* Tournament Status / Next Match / Countdown */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
        }}
      >
        {/* Show placement/elimination status if applicable */}
        {(tournamentStatus.userPlacement || tournamentStatus.isEliminated) ? (
          <TournamentStatus
            placement={tournamentStatus.userPlacement}
            isEliminated={tournamentStatus.isEliminated}
            teamName={team?.name}
          />
        ) : tournamentHasStarted && effectiveNextMatch && tournamentStatus.teamId ? (
          /* Show next match card if tournament has started */
          <NextMatchCard
            match={effectiveNextMatch}
            userTeamId={tournamentStatus.teamId}
            userRecord={userRecord}
            opponentRecord={opponentRecord}
            onStartMatch={nextMatch ? handleStartMatch : undefined}
          />
        ) : (
          /* Show countdown until tournament starts */
          <CountdownTimer eventDate={tournamentStatus.eventDate} />
        )}
      </motion.div>

      {/* Team status - only show before tournament starts */}
      {!tournamentHasStarted && (
        team ? (
          <motion.div
            className="bg-white/5 rounded-2xl p-6 space-y-4"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">{team.name}</h2>
                <p className="text-white/60 text-sm">Your team</p>
              </div>
              <motion.button
                onClick={() => setTeamManagementSheetOpen(true)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <Settings className="h-5 w-5 text-white/50" />
              </motion.button>
            </div>

            {/* Team members */}
            <div className="space-y-2">
              <motion.div
                className="flex items-center gap-3 p-3 bg-white/5 rounded-xl"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">
                    {team.player1?.display_name || team.player1?.email?.split("@")[0] || "Player 1"}
                  </p>
                  {team.player1?.id === profile?.id && (
                    <p className="text-xs text-white/50">You</p>
                  )}
                </div>
                <CheckCircle className="h-5 w-5 text-green-400" />
              </motion.div>

              {team.player2 ? (
                <motion.div
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-xl"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">
                      {team.player2?.display_name || team.player2?.email?.split("@")[0] || "Player 2"}
                    </p>
                    {team.player2?.id === profile?.id && (
                      <p className="text-xs text-white/50">You</p>
                    )}
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </motion.div>
              ) : (
                <motion.div
                  className="flex items-center gap-3 p-3 border-2 border-dashed border-white/20 rounded-xl"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center text-sm text-white/50">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-white/50">Waiting for teammate...</p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Invite link if team not full */}
            {!team.player2 && (
              <motion.div
                className="pt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <InviteLinkShare inviteToken={team.invite_token} teamName={team.name} />
              </motion.div>
            )}

            {/* Team complete message */}
            {team.player2 && (
              <motion.div
                className="flex items-center gap-2 p-4 bg-green-500/10 rounded-xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 20 }}
              >
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-sm text-green-400 font-medium">
                  Team complete! You&apos;re ready to compete.
                </span>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="bg-white/5 rounded-2xl p-8 text-center space-y-4"
            variants={{
              hidden: { opacity: 0, scale: 0.95 },
              visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
            }}
          >
            <motion.div
              className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            >
              <Users className="h-8 w-8 text-white/60" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-xl font-semibold text-white">You aren&apos;t on a team yet!</h2>
              <p className="text-white/60 text-sm mt-1">
                Join a team or create a new one.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => setCreateSheetOpen(true)}
                className="w-full bg-white text-[#1a1a1a] hover:bg-white/90 rounded-xl py-6 text-base font-medium"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Create a Team
              </Button>
            </motion.div>
            {openTeamsCount > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Link
                  href="/teams?filter=open"
                  className="flex items-center justify-center gap-2 text-white/60 hover:text-white transition-colors py-2"
                >
                  <div className="w-4 h-4 rounded-full border-2 border-dashed border-current" />
                  <span className="text-sm">Join an open team ({openTeamsCount} Open)</span>
                </Link>
              </motion.div>
            )}
          </motion.div>
        )
      )}

      <CreateTeamSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        takenTeamNames={takenTeamNames}
      />

      {team && (
        <TeamManagementSheet
          open={teamManagementSheetOpen}
          onOpenChange={setTeamManagementSheetOpen}
          teamId={team.id}
          teamName={team.name}
          player2={team.player2}
          isPlayer1={team.player1?.id === profile?.id}
        />
      )}
    </motion.div>
  );
}
