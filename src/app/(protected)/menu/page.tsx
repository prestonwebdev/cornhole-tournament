import { getProfile } from "@/lib/actions/auth";
import { getUserTeam } from "@/lib/actions/team";
import { getTournamentStatus } from "@/lib/actions/match";
import { MenuContent } from "@/components/menu/menu-content";

export const dynamic = 'force-dynamic';

export default async function MenuPage() {
  const [profile, team, tournamentStatus] = await Promise.all([
    getProfile(),
    getUserTeam(),
    getTournamentStatus(),
  ]);

  // Tournament is live if event_date is set and in the past
  const isTournamentLive = tournamentStatus.eventDate
    ? new Date(tournamentStatus.eventDate).getTime() <= Date.now()
    : false;

  return (
    <MenuContent
      profile={profile ? {
        id: profile.id,
        display_name: profile.display_name,
        email: profile.email,
        is_admin: profile.is_admin,
      } : null}
      team={team}
      isTournamentLive={isTournamentLive}
    />
  );
}
