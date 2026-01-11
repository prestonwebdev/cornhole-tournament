import { getAllTeams, getUnassignedPlayers, getUserTeam } from "@/lib/actions/team";
import { TeamsContent } from "@/components/teams/teams-content";

export default async function TeamsPage() {
  const [teams, unassignedPlayers, userTeam] = await Promise.all([
    getAllTeams(),
    getUnassignedPlayers(),
    getUserTeam(),
  ]);

  const takenTeamNames = teams.map((team) => team.name);

  return (
    <TeamsContent
      teams={teams}
      unassignedPlayers={unassignedPlayers}
      userHasTeam={!!userTeam}
      takenTeamNames={takenTeamNames}
    />
  );
}
