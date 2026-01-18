"use server";

import { createClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// Types for team with players
export type PlayerInfo = {
  id: string;
  display_name: string | null;
  email: string;
};

export type TeamWithPlayers = {
  id: string;
  name: string;
  player1_id: string | null;
  player2_id: string | null;
  invite_token: string;
  seed_number: number | null;
  is_open: boolean;
  created_at: string;
  updated_at: string;
  player1: PlayerInfo | null;
  player2: PlayerInfo | null;
};

const createTeamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters").max(50),
});

export async function createTeam(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check registration is open
  const { data: tournament } = await supabase
    .from("tournament")
    .select("registration_status")
    .single();

  const tournamentData = tournament as { registration_status: string } | null;
  if (tournamentData?.registration_status !== "open") {
    return { error: "Registration is closed" };
  }

  // Check user not already on a team
  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", user.id)
    .single();

  const profileData = profile as { team_id: string | null } | null;
  if (profileData?.team_id) {
    return { error: "You are already on a team" };
  }

  const result = createTeamSchema.safeParse({
    name: formData.get("name"),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const inviteToken = nanoid(12);
  const isOpen = formData.get("isOpen") === "true";

  // Create team
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({
      name: result.data.name,
      player1_id: user.id,
      invite_token: inviteToken,
      is_open: isOpen,
    } as never)
    .select()
    .single();

  if (teamError || !team) {
    return { error: teamError?.message || "Failed to create team" };
  }

  const teamData = team as { id: string };

  // Update user's team_id
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ team_id: teamData.id } as never)
    .eq("id", user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/teams");

  return { success: true };
}

export async function joinTeam(token: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated", requiresAuth: true };
  }

  // Check registration is open
  const { data: tournament } = await supabase
    .from("tournament")
    .select("registration_status")
    .single();

  const tournamentData = tournament as { registration_status: string } | null;
  if (tournamentData?.registration_status !== "open") {
    return { error: "Registration is closed" };
  }

  // Check user not already on a team
  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", user.id)
    .single();

  const profileData = profile as { team_id: string | null } | null;
  if (profileData?.team_id) {
    return { error: "You are already on a team. Contact an admin to change teams." };
  }

  // Find team by token
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select(`
      *,
      player1:profiles!teams_player1_id_fkey(id, display_name, email),
      player2:profiles!teams_player2_id_fkey(id, display_name, email)
    `)
    .eq("invite_token", token)
    .single();

  if (teamError || !team) {
    return { error: "Invalid invite link" };
  }

  const teamData = team as unknown as TeamWithPlayers;

  if (teamData.player2_id) {
    return { error: "This team is already full" };
  }

  // Join team as player2
  const { error: updateTeamError } = await supabase
    .from("teams")
    .update({ player2_id: user.id } as never)
    .eq("id", teamData.id);

  if (updateTeamError) {
    return { error: updateTeamError.message };
  }

  // Verify the team update actually happened (RLS can silently fail)
  const { data: verifyTeam } = await supabase
    .from("teams")
    .select("player2_id")
    .eq("id", teamData.id)
    .single();

  const verifyData = verifyTeam as { player2_id: string | null } | null;
  if (!verifyData || verifyData.player2_id !== user.id) {
    return { error: "Failed to join team. Please contact an admin." };
  }

  // Update user's team_id
  const { error: updateProfileError } = await supabase
    .from("profiles")
    .update({ team_id: teamData.id } as never)
    .eq("id", user.id);

  if (updateProfileError) {
    return { error: updateProfileError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/teams");
  return { success: true, teamId: teamData.id };
}

export async function joinOpenTeam(teamId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check registration is open
  const { data: tournament } = await supabase
    .from("tournament")
    .select("registration_status")
    .single();

  const tournamentData = tournament as { registration_status: string } | null;
  if (tournamentData?.registration_status !== "open") {
    return { error: "Registration is closed" };
  }

  // Check user not already on a team
  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", user.id)
    .single();

  const profileData = profile as { team_id: string | null } | null;
  if (profileData?.team_id) {
    return { error: "You are already on a team" };
  }

  // Find team by id and verify it's open
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (teamError || !team) {
    return { error: "Team not found" };
  }

  const teamData = team as { id: string; player2_id: string | null; is_open: boolean };

  if (!teamData.is_open) {
    return { error: "This team is invite-only" };
  }

  if (teamData.player2_id) {
    return { error: "This team is already full" };
  }

  // Join team as player2
  const { error: updateTeamError } = await supabase
    .from("teams")
    .update({ player2_id: user.id } as never)
    .eq("id", teamData.id);

  if (updateTeamError) {
    return { error: updateTeamError.message };
  }

  // Update user's team_id
  const { error: updateProfileError } = await supabase
    .from("profiles")
    .update({ team_id: teamData.id } as never)
    .eq("id", user.id);

  if (updateProfileError) {
    return { error: updateProfileError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/teams");
  return { success: true, teamId: teamData.id };
}

export async function getTeamByToken(token: string): Promise<TeamWithPlayers | null> {
  const supabase = await createClient();

  const { data: team, error } = await supabase
    .from("teams")
    .select(`
      *,
      player1:profiles!teams_player1_id_fkey(id, display_name, email),
      player2:profiles!teams_player2_id_fkey(id, display_name, email)
    `)
    .eq("invite_token", token)
    .single();

  if (error || !team) {
    return null;
  }

  return team as unknown as TeamWithPlayers;
}

export async function getTeamById(id: string): Promise<TeamWithPlayers | null> {
  const supabase = await createClient();

  const { data: team, error } = await supabase
    .from("teams")
    .select(`
      *,
      player1:profiles!teams_player1_id_fkey(id, display_name, email),
      player2:profiles!teams_player2_id_fkey(id, display_name, email)
    `)
    .eq("id", id)
    .single();

  if (error || !team) {
    return null;
  }

  return team as unknown as TeamWithPlayers;
}

export async function getUserTeam(): Promise<TeamWithPlayers | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", user.id)
    .single();

  const profileData = profile as { team_id: string | null } | null;
  if (!profileData?.team_id) return null;

  return getTeamById(profileData.team_id);
}

export async function getAllTeams(): Promise<TeamWithPlayers[]> {
  const supabase = await createClient();

  const { data: teams, error } = await supabase
    .from("teams")
    .select(`
      *,
      player1:profiles!teams_player1_id_fkey(id, display_name, email),
      player2:profiles!teams_player2_id_fkey(id, display_name, email)
    `)
    .order("created_at", { ascending: false });

  if (error || !teams) {
    return [];
  }

  return teams as unknown as TeamWithPlayers[];
}

export type UnassignedPlayer = {
  id: string;
  display_name: string | null;
  email: string;
};

export async function getUnassignedPlayers(): Promise<UnassignedPlayer[]> {
  const supabase = await createClient();

  const { data: players, error } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .is("team_id", null)
    .order("display_name");

  if (error || !players) {
    return [];
  }

  return players as UnassignedPlayer[];
}

export async function updateTeamName(teamId: string, newName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Validate name
  if (!newName || newName.trim().length < 2) {
    return { error: "Team name must be at least 2 characters" };
  }

  if (newName.trim().length > 50) {
    return { error: "Team name must be less than 50 characters" };
  }

  // Check user is on this team
  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  const teamData = team as { id: string; player1_id: string | null; player2_id: string | null } | null;
  if (!teamData) {
    return { error: "Team not found" };
  }

  if (teamData.player1_id !== user.id && teamData.player2_id !== user.id) {
    return { error: "You are not a member of this team" };
  }

  // Update team name
  const { error } = await supabase
    .from("teams")
    .update({ name: newName.trim() } as never)
    .eq("id", teamId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/teams");
  revalidatePath(`/team/${teamId}`);

  return { success: true };
}

export async function removeTeammate(teamId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get team
  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  const teamData = team as { id: string; player1_id: string | null; player2_id: string | null } | null;
  if (!teamData) {
    return { error: "Team not found" };
  }

  // Only player1 (team creator) can remove player2
  if (teamData.player1_id !== user.id) {
    return { error: "Only the team creator can remove teammates" };
  }

  if (!teamData.player2_id) {
    return { error: "No teammate to remove" };
  }

  const removedPlayerId = teamData.player2_id;

  // Remove player2 from team
  const { error: teamError } = await supabase
    .from("teams")
    .update({ player2_id: null } as never)
    .eq("id", teamId);

  if (teamError) {
    return { error: teamError.message };
  }

  // Clear removed player's team_id
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ team_id: null } as never)
    .eq("id", removedPlayerId);

  if (profileError) {
    return { error: profileError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/teams");
  revalidatePath(`/team/${teamId}`);

  return { success: true };
}

export type RegisteredTeam = {
  id: string;
  name: string;
  seed_number: number | null;
  player1_id: string | null;
  player2_id: string | null;
};

export async function getRegisteredTeams(): Promise<RegisteredTeam[]> {
  const supabase = await createClient();

  const { data: teams, error } = await supabase
    .from("teams")
    .select("id, name, seed_number, player1_id, player2_id")
    .not("player1_id", "is", null)
    .not("player2_id", "is", null)
    .order("seed_number", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error || !teams) {
    return [];
  }

  return teams as RegisteredTeam[];
}

export async function leaveTeam() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get user's current team
  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", user.id)
    .single();

  const profileData = profile as { team_id: string | null } | null;
  if (!profileData?.team_id) {
    return { error: "You're not on a team" };
  }

  // Get team to check if user is player1 or player2
  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", profileData.team_id)
    .single();

  const teamData = team as { id: string; player1_id: string | null; player2_id: string | null } | null;
  if (!teamData) {
    return { error: "Team not found" };
  }

  // Remove user from team
  if (teamData.player1_id === user.id) {
    // If player1 leaves and there's a player2, promote player2
    if (teamData.player2_id) {
      await supabase
        .from("teams")
        .update({ player1_id: teamData.player2_id, player2_id: null } as never)
        .eq("id", teamData.id);
    } else {
      // Delete team if no player2
      await supabase
        .from("teams")
        .delete()
        .eq("id", teamData.id);
    }
  } else {
    // Player2 leaving
    await supabase
      .from("teams")
      .update({ player2_id: null } as never)
      .eq("id", teamData.id);
  }

  // Clear user's team_id
  await supabase
    .from("profiles")
    .update({ team_id: null } as never)
    .eq("id", user.id);

  revalidatePath("/dashboard");
  revalidatePath("/teams");
  revalidatePath("/menu");

  return { success: true };
}
