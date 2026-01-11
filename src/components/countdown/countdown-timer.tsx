"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Trophy, Clock } from "lucide-react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Target: January 29th, 2026 at 7:00 PM (local time)
const TARGET_DATE = new Date("2026-01-29T19:00:00");

function calculateTimeLeft(): TimeLeft {
  const now = new Date();
  const difference = TARGET_DATE.getTime() - now.getTime();

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

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted || !timeLeft) {
    return (
      <div className="bg-white/5 rounded-2xl p-5">
        <div className="h-[88px] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const isEventStarted = timeLeft.days === 0 && timeLeft.hours === 0 &&
                          timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (isEventStarted) {
    return (
      <motion.div
        className="bg-white/5 rounded-2xl p-5"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-yellow-400/10 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-yellow-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Your Next Match</h2>
        </div>
        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
          <Clock className="h-5 w-5 text-white/40" />
          <div>
            <p className="text-white/60 text-sm">The bracket hasn&apos;t been created yet.</p>
            <p className="text-white/40 text-xs mt-1">Check back once the bracket is published!</p>
          </div>
        </div>
      </motion.div>
    );
  }

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
        January 29th, 2026 at 7:00 PM
      </motion.p>
    </motion.div>
  );
}
