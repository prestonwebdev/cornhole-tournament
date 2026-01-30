"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Home, Users, Trophy, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/bracket", label: "Bracket", icon: Trophy },
  { href: "/menu", label: "More", icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-white/10 pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href === "/dashboard" && pathname.startsWith("/team/"));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 h-full"
            >
              <motion.div
                className={cn(
                  "flex flex-col items-center justify-center h-full gap-1 transition-colors",
                  isActive ? "text-white" : "text-white/50"
                )}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.1 }}
              >
                <motion.div
                  initial={false}
                  animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Icon className="h-6 w-6" />
                </motion.div>
                <span className="text-xs">{item.label}</span>
                {isActive && (
                  <motion.div
                    className="absolute bottom-1 w-1 h-1 bg-white rounded-full"
                    layoutId="activeTab"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
