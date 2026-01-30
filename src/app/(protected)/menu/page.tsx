import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/actions/auth";
import { getUserTeam } from "@/lib/actions/team";
import { getTournamentStatus } from "@/lib/actions/match";
import { MenuContent } from "@/components/menu/menu-content";

export const dynamic = 'force-dynamic';

export default async function MenuPage() {
  const supabase = await createClient();

  const [profile, team, tournamentStatus, tournamentResult] = await Promise.all([
    getProfile(),
    getUserTeam(),
    getTournamentStatus(),
    supabase.from("tournament").select("bracket_status").single(),
  ]);

  // Tournament is live if event_date is set and in the past
  const isTournamentLive = tournamentStatus.eventDate
    ? new Date(tournamentStatus.eventDate).getTime() <= Date.now()
    : false;

  const tournamentData = tournamentResult.data as { bracket_status: string } | null;
  const bracketPublished = tournamentData?.bracket_status === "published";

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
      scheduledEventDate={tournamentStatus.eventDate}
      bracketPublished={bracketPublished}
    />
  );
}
