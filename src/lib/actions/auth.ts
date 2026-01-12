"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Team } from "@/lib/types/database";

// Profile with team relation
export type ProfileWithTeam = {
  id: string;
  email: string;
  display_name: string | null;
  is_admin: boolean;
  team_id: string | null;
  created_at: string;
  updated_at: string;
  team: Team | null;
};

const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(50),
});

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const result = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { email, password, displayName } = result.data;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signIn(formData: FormData, redirectTo?: string) {
  const supabase = await createClient();

  const result = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { error } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    return { error: error.message };
  }

  redirect(redirectTo || "/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<ProfileWithTeam | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get the display name from auth metadata
  const authDisplayName = user.user_metadata?.display_name as string | undefined;

  let { data: profile } = await supabase
    .from("profiles")
    .select("*, team:teams!profiles_team_id_fkey(*)")
    .eq("id", user.id)
    .single();

  // If profile doesn't exist, create it
  if (!profile) {
    const { data: newProfile } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email!,
        display_name: authDisplayName || null,
      } as never)
      .select("*, team:teams!profiles_team_id_fkey(*)")
      .single();

    profile = newProfile;
  }

  if (!profile) return null;

  const profileData = profile as unknown as ProfileWithTeam;

  // Sync missing data from auth
  const updates: Record<string, string> = {};

  if (!profileData.display_name && authDisplayName) {
    updates.display_name = authDisplayName;
    profileData.display_name = authDisplayName;
  }

  if (!profileData.email && user.email) {
    updates.email = user.email;
    profileData.email = user.email;
  }

  // Update profile if we have any missing data
  if (Object.keys(updates).length > 0) {
    await supabase
      .from("profiles")
      .update(updates as never)
      .eq("id", user.id);
  }

  // Final fallback - always ensure email is set from auth
  if (!profileData.email && user.email) {
    profileData.email = user.email;
  }

  // Always ensure display_name has a value for UI display
  // Priority: profile display_name -> auth display_name -> email username
  if (!profileData.display_name) {
    profileData.display_name = authDisplayName || user.email?.split("@")[0] || null;
  }

  return profileData;
}
