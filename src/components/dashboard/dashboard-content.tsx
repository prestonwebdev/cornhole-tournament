"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { InviteLinkShare } from "@/components/team/invite-link-share";
import { CountdownTimer } from "@/components/countdown/countdown-timer";
import { CreateTeamSheet } from "@/components/team/create-team-sheet";
import { TeamManagementSheet } from "@/components/team/team-management-sheet";
import { Users, UserPlus, CheckCircle, Settings, Globe } from "lucide-react";
import Link from "next/link";

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

interface DashboardContentProps {
  profile: Profile | null;
  team: Team | null;
  takenTeamNames: string[];
  openTeamsCount: number;
}

export function DashboardContent({ profile, team, takenTeamNames, openTeamsCount }: DashboardContentProps) {
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [teamManagementSheetOpen, setTeamManagementSheetOpen] = useState(false);

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

      {/* Countdown Timer (becomes Next Match card once tournament starts) */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
        }}
      >
        <CountdownTimer />
      </motion.div>

      {/* Team status */}
      {team ? (
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
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-white">0-0</p>
                <p className="text-white/40 text-xs">Record</p>
              </div>
              <motion.button
                onClick={() => setTeamManagementSheetOpen(true)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <Settings className="h-5 w-5 text-white/70" />
              </motion.button>
            </div>
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
            <h2 className="text-xl font-semibold text-white">No Team Yet</h2>
            <p className="text-white/60 text-sm mt-1">
              Create a team or join one using an invite link
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
                <Globe className="h-4 w-4" />
                <span className="text-sm">{openTeamsCount} open team{openTeamsCount !== 1 ? 's' : ''}</span>
              </Link>
            </motion.div>
          )}
        </motion.div>
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
