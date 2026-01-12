"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, CheckCircle, Globe, Lock, Search, X, Plus } from "lucide-react";
import { JoinTeamSheet } from "@/components/teams/join-team-sheet";
import { CreateTeamSheet } from "@/components/team/create-team-sheet";

interface Player {
  id: string;
  display_name: string | null;
  email: string;
}

interface Team {
  id: string;
  name: string;
  player1_id: string | null;
  player2_id: string | null;
  player1: Player | null;
  player2: Player | null;
  is_open: boolean;
}

interface TeamsContentProps {
  teams: Team[];
  userHasTeam: boolean;
  takenTeamNames: string[];
}

type FilterType = "all" | "open" | "invite" | "complete" | "free-agents";

const filterOptions: { value: FilterType; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "All", icon: null },
  { value: "open", label: "Open", icon: <Globe className="h-3 w-3" /> },
  { value: "invite", label: "Pending Invites", icon: <Lock className="h-3 w-3" /> },
  { value: "complete", label: "Full Teams", icon: <CheckCircle className="h-3 w-3" /> },
];

export function TeamsContent({ teams, userHasTeam, takenTeamNames }: TeamsContentProps) {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [joinSheetOpen, setJoinSheetOpen] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // Helper to get player display name
  const getPlayerName = (player: Player | null) => {
    if (!player) return "";
    return player.display_name || player.email.split("@")[0] || "";
  };

  // Filter and search logic
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    // Filter teams
    const filteredTeams = teams.filter((team) => {
      // Search filter
      if (query) {
        const teamNameMatch = team.name.toLowerCase().includes(query);
        const player1Match = getPlayerName(team.player1).toLowerCase().includes(query);
        const player2Match = getPlayerName(team.player2).toLowerCase().includes(query);
        if (!teamNameMatch && !player1Match && !player2Match) return false;
      }

      // Type filter
      if (activeFilter === "open") return team.is_open && !team.player2_id;
      if (activeFilter === "invite") return !team.is_open && !team.player2_id;
      if (activeFilter === "complete") return team.player1_id && team.player2_id;

      return true;
    });

    // Categorize teams
    const completeTeams = filteredTeams.filter(t => t.player1_id && t.player2_id);
    const openTeams = filteredTeams.filter(t => t.is_open && !t.player2_id);
    const inviteOnlyTeams = filteredTeams.filter(t => !t.is_open && !t.player2_id);

    return {
      completeTeams,
      openTeams,
      inviteOnlyTeams,
      totalResults: completeTeams.length + openTeams.length + inviteOnlyTeams.length,
    };
  }, [teams, searchQuery, activeFilter]);

  function handleTeamClick(team: Team) {
    if (team.is_open && !team.player2_id) {
      setSelectedTeam(team);
      setJoinSheetOpen(true);
    }
  }

  function clearSearch() {
    setSearchQuery("");
  }

  return (
    <>
      {/* Sticky Header with Search and Filters */}
      <div className="sticky top-0 z-10 -mx-4 px-4 pt-4 pb-6 bg-gradient-to-b from-[#1a1a1a] from-85% to-transparent">
        <motion.div
          className="space-y-3"
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
            className="flex items-start justify-between"
            variants={{
              hidden: { opacity: 0, y: -10 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
            }}
          >
            <div>
              <h1 className="text-2xl font-bold text-white">Teams</h1>
              <p className="text-white/60 text-sm">
                {teams.length} team{teams.length !== 1 ? "s" : ""} registered
              </p>
            </div>
            <motion.button
              onClick={() => setCreateSheetOpen(true)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            >
              <Plus className="h-6 w-6 text-white" />
            </motion.button>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            className="relative"
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
            }}
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4 text-white/40" />
              </button>
            )}
          </motion.div>

          {/* Filter Pills */}
          <motion.div
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.05 } }
            }}
          >
            {filterOptions.map((option) => (
              <motion.button
                key={option.value}
                onClick={() => setActiveFilter(option.value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === option.value
                    ? "bg-white text-[#1a1a1a]"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {option.icon}
                {option.label}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        className="space-y-4 pt-2"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.1 }
          }
        }}
      >
        {/* Search Results Count */}
        {(searchQuery || activeFilter !== "all") && (
          <motion.p
            className="text-white/40 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {filteredData.totalResults} result{filteredData.totalResults !== 1 ? "s" : ""} found
            {searchQuery && ` for "${searchQuery}"`}
          </motion.p>
        )}

        {/* Complete Teams */}
        <AnimatePresence mode="popLayout">
          {filteredData.completeTeams.length > 0 && (
            <motion.section
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <h2 className="text-sm font-medium text-white/80">
                  Complete Teams ({filteredData.completeTeams.length})
                </h2>
              </div>
              <div className="space-y-2">
                {filteredData.completeTeams.map((team, index) => (
                  <motion.div
                    key={team.id}
                    className="bg-white/5 rounded-xl p-4 space-y-2"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                    layout
                  >
                    <h3 className="font-semibold text-white">{team.name}</h3>
                    <div className="flex gap-2 text-sm text-white/60">
                      <span>{getPlayerName(team.player1) || "Player 1"}</span>
                      <span>&</span>
                      <span>{getPlayerName(team.player2) || "Player 2"}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Open Teams */}
        <AnimatePresence mode="popLayout">
          {filteredData.openTeams.length > 0 && (
            <motion.section
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-green-400" />
                <h2 className="text-sm font-medium text-white/80">
                  Open Teams ({filteredData.openTeams.length})
                </h2>
              </div>
              <div className="space-y-2">
                {filteredData.openTeams.map((team, index) => (
                  <motion.button
                    key={team.id}
                    onClick={() => handleTeamClick(team)}
                    className="w-full text-left bg-white/5 border border-green-500/20 rounded-xl p-4 space-y-2"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.08)", scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    layout
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white">{team.name}</h3>
                      <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                        Join team
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-white/60">
                        {getPlayerName(team.player1) || "Player 1"}
                      </span>
                      <span className="text-white/30">+</span>
                      <span className="text-green-400/70 italic">Open spot</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Invite-Only Teams */}
        <AnimatePresence mode="popLayout">
          {filteredData.inviteOnlyTeams.length > 0 && (
            <motion.section
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-yellow-400" />
                <h2 className="text-sm font-medium text-white/80">
                  Pending Invites ({filteredData.inviteOnlyTeams.length})
                </h2>
              </div>
              <div className="space-y-2">
                {filteredData.inviteOnlyTeams.map((team, index) => (
                  <motion.div
                    key={team.id}
                    className="bg-white/5 border border-dashed border-white/20 rounded-xl p-4 space-y-2"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                    layout
                  >
                    <h3 className="font-semibold text-white">{team.name}</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-white/60">
                        {getPlayerName(team.player1) || "Player 1"}
                      </span>
                      <span className="text-white/30">·</span>
                      <span className="text-white/40 italic">Waiting for teammate to join</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {filteredData.totalResults === 0 && (
          <motion.div
            className="bg-white/5 rounded-2xl p-8 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            {searchQuery || activeFilter !== "all" ? (
              <>
                <Search className="h-12 w-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">No results found</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveFilter("all");
                  }}
                  className="mt-3 text-sm text-white/40 hover:text-white/60 transition-colors"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <Users className="h-12 w-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">No teams yet</p>
              </>
            )}
          </motion.div>
        )}
      </motion.div>

      <JoinTeamSheet
        team={selectedTeam}
        open={joinSheetOpen}
        onOpenChange={setJoinSheetOpen}
        userHasTeam={userHasTeam}
      />

      <CreateTeamSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        takenTeamNames={takenTeamNames}
      />
    </>
  );
}
