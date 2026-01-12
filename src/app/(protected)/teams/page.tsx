import { getAllTeams, getUserTeam } from "@/lib/actions/team";
import { TeamsContent } from "@/components/teams/teams-content";

export default async function TeamsPage() {
  const [teams, userTeam] = await Promise.all([
    getAllTeams(),
    getUserTeam(),
  ]);

  const takenTeamNames = teams.map((team) => team.name);

  return (
    <TeamsContent
      teams={teams}
      userHasTeam={!!userTeam}
      takenTeamNames={takenTeamNames}
    />
  );
}
