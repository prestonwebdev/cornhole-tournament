import { getProfile } from "@/lib/actions/auth";
import { getUserTeam, getAllTeams, getRegisteredTeams } from "@/lib/actions/team";
import { getUserNextMatch, getTournamentStatus, ensureBracketGenerated, getMatchRecords } from "@/lib/actions/match";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Auto-generate bracket matches if they don't exist
  await ensureBracketGenerated();

  const [profile, team, allTeams, nextMatch, tournamentStatus, registeredTeams] = await Promise.all([
    getProfile(),
    getUserTeam(),
    getAllTeams(),
    getUserNextMatch(),
    getTournamentStatus(),
    getRegisteredTeams(),
  ]);

  const takenTeamNames = allTeams.map((t) => t.name);
  const openTeamsCount = allTeams.filter((t) => t.is_open && !t.player2_id).length;

  // Get records if user has a next match
  let matchRecords: { userRecord: { wins: number; losses: number } | null; opponentRecord: { wins: number; losses: number } | null } | null = null;
  if (nextMatch && profile?.team_id) {
    matchRecords = await getMatchRecords(nextMatch, profile.team_id);
  }

  return (
    <DashboardContent
      profile={profile}
      team={team}
      takenTeamNames={takenTeamNames}
      openTeamsCount={openTeamsCount}
      nextMatch={nextMatch}
      tournamentStatus={tournamentStatus}
      registeredTeams={registeredTeams}
      userRecord={matchRecords?.userRecord || undefined}
      opponentRecord={matchRecords?.opponentRecord || undefined}
    />
  );
}
