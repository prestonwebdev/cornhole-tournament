-- Allow team owner (player1) to delete their team when they're the only member
-- This fixes the bug where invite-only teams weren't deleted when the creator left

CREATE POLICY "Team owner can delete empty team"
  ON public.teams FOR DELETE
  USING (
    -- User must be player1 (the team owner/creator)
    auth.uid() = player1_id
    -- Team must have no player2 (owner is the only member)
    AND player2_id IS NULL
  );
