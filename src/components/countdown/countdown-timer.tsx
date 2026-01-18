"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { useSimulatedTournamentStart } from "@/lib/hooks/use-demo-mode";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownTimerProps {
  eventDate?: string | null;
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const now = new Date();
  const difference = targetDate.getTime() - now.getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function formatEventDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }) + " at " + date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function CountdownBox({ value, label, delay }: { value: number; label: string; delay: number }) {
  return (
    <motion.div
      className="bg-white/5 rounded-xl p-3 flex flex-col items-center min-w-[70px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <motion.span
        key={value}
        className="font-mono text-3xl font-bold text-white tabular-nums"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {value.toString().padStart(2, "0")}
      </motion.span>
      <span className="text-xs text-white/50 uppercase tracking-wide mt-1">
        {label}
      </span>
    </motion.div>
  );
}

// Default fallback date if none provided
const DEFAULT_EVENT_DATE = new Date("2026-01-29T18:30:00");

export function CountdownTimer({ eventDate }: CountdownTimerProps) {
  const simulatedStart = useSimulatedTournamentStart();
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [mounted, setMounted] = useState(false);

  // Parse the event date or use default
  const targetDate = useMemo(() => {
    if (eventDate) {
      return new Date(eventDate);
    }
    return DEFAULT_EVENT_DATE;
  }, [eventDate]);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(calculateTimeLeft(targetDate));

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted || !timeLeft || !simulatedStart.isLoaded) {
    return (
      <div className="bg-white/5 rounded-2xl p-5">
        <div className="h-[88px] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Check if tournament has started (considering simulation)
  const hasStarted = simulatedStart.hasTournamentStarted(eventDate || targetDate.toISOString());

  // If simulating "not started", always show countdown (even if time has passed)
  if (simulatedStart.simulatedStart === "not_started") {
    return (
      <motion.div
        className="bg-white/5 rounded-2xl p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-xs text-yellow-400 font-medium">Simulating Pre-Start</span>
        </div>
        <motion.p
          className="text-white/60 text-sm text-center mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Time to start practicing! The tournament starts in
        </motion.p>
        <div className="flex justify-center gap-2">
          <CountdownBox value={timeLeft.days} label="Days" delay={0.1} />
          <CountdownBox value={timeLeft.hours} label="Hours" delay={0.15} />
          <CountdownBox value={timeLeft.minutes} label="Mins" delay={0.2} />
          <CountdownBox value={timeLeft.seconds} label="Secs" delay={0.25} />
        </div>
        <motion.p
          className="text-white/40 text-xs text-center mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {formatEventDate(targetDate)}
        </motion.p>
      </motion.div>
    );
  }

  // If tournament has started (real or simulated), return null - parent will show NextMatchCard
  if (hasStarted) {
    return null;
  }

  // Normal countdown display
  return (
    <motion.div
      className="bg-white/5 rounded-2xl p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.p
        className="text-white/60 text-sm text-center mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Time to start practicing! The tournament starts in
      </motion.p>
      <div className="flex justify-center gap-2">
        <CountdownBox value={timeLeft.days} label="Days" delay={0.1} />
        <CountdownBox value={timeLeft.hours} label="Hours" delay={0.15} />
        <CountdownBox value={timeLeft.minutes} label="Mins" delay={0.2} />
        <CountdownBox value={timeLeft.seconds} label="Secs" delay={0.25} />
      </div>
      <motion.p
        className="text-white/40 text-xs text-center mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {formatEventDate(targetDate)}
      </motion.p>
    </motion.div>
  );
}
