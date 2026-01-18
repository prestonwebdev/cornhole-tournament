"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { updateTeamName, removeTeammate, leaveTeam } from "@/lib/actions/team";
import { useToast } from "@/components/ui/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Loader2, Pencil, UserMinus, AlertTriangle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface Player {
  id: string;
  display_name: string | null;
  email: string;
}

interface TeamManagementSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  teamName: string;
  player2: Player | null;
  isPlayer1: boolean;
}

export function TeamManagementSheet({
  open,
  onOpenChange,
  teamId,
  teamName,
  player2,
  isPlayer1,
}: TeamManagementSheetProps) {
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isRemovingPlayer, setIsRemovingPlayer] = useState(false);
  const [isLeavingTeam, setIsLeavingTeam] = useState(false);
  const [newName, setNewName] = useState(teamName);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleUpdateName(e: React.FormEvent) {
    e.preventDefault();
    if (newName.trim() === teamName) {
      onOpenChange(false);
      return;
    }

    setIsUpdatingName(true);
    const result = await updateTeamName(teamId, newName);
    setIsUpdatingName(false);

    if (result.error) {
      toast({
        title: "Failed to update team name",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Team name updated",
        description: `Your team is now called "${newName.trim()}"`,
      });
      onOpenChange(false);
      router.refresh();
    }
  }

  async function handleRemoveTeammate() {
    setIsRemovingPlayer(true);
    const result = await removeTeammate(teamId);
    setIsRemovingPlayer(false);

    if (result.error) {
      toast({
        title: "Failed to remove teammate",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Teammate removed",
        description: "Your teammate has been removed from the team",
      });
      setShowRemoveConfirm(false);
      onOpenChange(false);
      router.refresh();
    }
  }

  async function handleLeaveTeam() {
    setIsLeavingTeam(true);
    const result = await leaveTeam();
    setIsLeavingTeam(false);

    if (result.error) {
      toast({
        title: "Failed to leave team",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Left team",
        description: player2 ? "You have left the team" : "Team has been deleted",
      });
      setShowLeaveConfirm(false);
      onOpenChange(false);
      router.refresh();
    }
  }

  const player2Name = player2?.display_name || player2?.email?.split("@")[0] || "Teammate";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetHeader className="pb-4">
          <SheetTitle>Team Settings</SheetTitle>
          <SheetDescription>
            Manage your team name and members
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Edit Team Name */}
          <form onSubmit={handleUpdateName} className="space-y-3">
            <label className="block text-sm font-medium text-white/80">
              <div className="flex items-center gap-2 mb-2">
                <Pencil className="h-4 w-4" />
                Team Name
              </div>
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter team name"
              required
              minLength={2}
              maxLength={50}
              disabled={isUpdatingName}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent disabled:opacity-50"
            />
            <motion.button
              type="submit"
              disabled={isUpdatingName || newName.trim() === teamName}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              whileTap={{ scale: 0.98 }}
            >
              {isUpdatingName ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Name"
              )}
            </motion.button>
          </form>

          {/* Remove Teammate (only for player1 when there's a player2) */}
          {isPlayer1 && player2 && (
            <div className="pt-4 border-t border-white/10">
              {!showRemoveConfirm ? (
                <motion.button
                  onClick={() => setShowRemoveConfirm(true)}
                  className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.98 }}
                >
                  <UserMinus className="h-4 w-4" />
                  Remove Teammate
                </motion.button>
              ) : (
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-start gap-3 p-4 bg-red-500/10 rounded-xl">
                    <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-medium text-sm">Remove {player2Name}?</p>
                      <p className="text-red-400/70 text-xs mt-1">
                        They will be removed from the team and will need to join again.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => setShowRemoveConfirm(false)}
                      className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={handleRemoveTeammate}
                      disabled={isRemovingPlayer}
                      className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      whileTap={{ scale: 0.98 }}
                    >
                      {isRemovingPlayer ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Removing...
                        </>
                      ) : (
                        "Remove"
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Leave Team */}
          <div className="pt-4 border-t border-white/10">
            {!showLeaveConfirm ? (
              <motion.button
                onClick={() => setShowLeaveConfirm(true)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                whileTap={{ scale: 0.98 }}
              >
                <LogOut className="h-4 w-4" />
                Leave Team
              </motion.button>
            ) : (
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-start gap-3 p-4 bg-red-500/10 rounded-xl">
                  <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-medium text-sm">Leave {teamName}?</p>
                    <p className="text-red-400/70 text-xs mt-1">
                      {isPlayer1 && !player2
                        ? "You are the only member. The team will be deleted."
                        : isPlayer1 && player2
                        ? `${player2Name} will become the team owner.`
                        : "You will be removed from this team."}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => setShowLeaveConfirm(false)}
                    className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleLeaveTeam}
                    disabled={isLeavingTeam}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLeavingTeam ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Leaving...
                      </>
                    ) : (
                      "Leave"
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
