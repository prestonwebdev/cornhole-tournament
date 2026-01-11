"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOut, Trophy, User, Menu } from "lucide-react";
import type { Profile } from "@/lib/types/database";
import { useState } from "react";

interface HeaderProps {
  profile: (Profile & { team: unknown }) | null;
}

export function Header({ profile }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Trophy className="h-5 w-5" />
          <span className="hidden sm:inline">Cornhole Tournament</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">Dashboard</Button>
          </Link>
          <Link href="/bracket">
            <Button variant="ghost" size="sm">Bracket</Button>
          </Link>
          {profile?.is_admin && (
            <Link href="/admin">
              <Button variant="ghost" size="sm">Admin</Button>
            </Link>
          )}
          <div className="flex items-center gap-2 pl-4 border-l">
            <span className="text-sm text-muted-foreground">
              {profile?.display_name || profile?.email}
            </span>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </nav>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="md:hidden border-t px-4 py-4 space-y-2 bg-background">
          <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
            <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
          </Link>
          <Link href="/bracket" onClick={() => setMenuOpen(false)}>
            <Button variant="ghost" className="w-full justify-start">Bracket</Button>
          </Link>
          {profile?.is_admin && (
            <Link href="/admin" onClick={() => setMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">Admin</Button>
            </Link>
          )}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-sm text-muted-foreground">
                {profile?.display_name || profile?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
