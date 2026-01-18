"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import { Trophy, Heart, Flag } from "lucide-react";

interface MatchResultProps {
  isWinner: boolean;
  teamName: string;
  opponentName: string;
  placement?: string;
  isEliminated?: boolean;
  onClose?: () => void;
}

const encouragingMessages = [
  "Every champion was once a contender. Keep your head up!",
  "The best players learn from every match. You've got this!",
  "Shake it off and come back stronger!",
  "That's cornhole - sometimes the bags just don't bounce your way.",
  "Winners never quit, and you're definitely a winner in our book!",
  "Next match is a fresh start. Let's go!",
];

const eliminationMessages = [
  "What a run! You gave it everything out there.",
  "Head held high - you competed hard!",
  "Great tournament! See you at the next one.",
  "Thanks for playing! Every tournament makes you better.",
  "You brought the heat! Can't wait to see you compete again.",
];

const winningMessages = [
  "Absolutely crushed it!",
  "That's how it's done!",
  "On fire! Keep it going!",
  "Unstoppable!",
  "Championship material right there!",
];

export function MatchResult({
  isWinner,
  teamName,
  opponentName,
  placement,
  isEliminated,
  onClose,
}: MatchResultProps) {
  const hasConfettiFired = useRef(false);

  useEffect(() => {
    if (isWinner && !hasConfettiFired.current) {
      hasConfettiFired.current = true;

      // Fire confetti
      const duration = 1500;
      const end = Date.now() + duration;

      const colors = ["#fbbf24", "#22c55e", "#ffffff"];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [isWinner]);

  const randomMessage = isWinner
    ? winningMessages[Math.floor(Math.random() * winningMessages.length)]
    : isEliminated
    ? eliminationMessages[Math.floor(Math.random() * eliminationMessages.length)]
    : encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className={`max-w-sm w-full rounded-2xl p-6 text-center ${
          isWinner
            ? "bg-gradient-to-b from-yellow-500/20 to-green-500/20 border border-yellow-400/30"
            : "bg-white/10 border border-white/20"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {isWinner ? (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-yellow-400/20 flex items-center justify-center mx-auto mb-4"
            >
              <Trophy className="h-10 w-10 text-yellow-400" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-white mb-2"
            >
              Victory!
            </motion.h2>
            {placement && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-yellow-400 font-medium mb-2"
              >
                {placement} Place!
              </motion.p>
            )}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-white/80 mb-4"
            >
              {teamName} defeats {opponentName}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-green-400 text-sm"
            >
              {randomMessage}
            </motion.p>
          </>
        ) : (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isEliminated ? "bg-orange-500/20" : "bg-white/10"
              }`}
            >
              {isEliminated ? (
                <Flag className="h-10 w-10 text-orange-400" />
              ) : (
                <Heart className="h-10 w-10 text-red-400" />
              )}
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-white mb-2"
            >
              {isEliminated ? "Tournament Over" : "Tough Break"}
            </motion.h2>
            {isEliminated && placement && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-orange-400 font-medium mb-2"
              >
                {placement} Place
              </motion.p>
            )}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/80 mb-4"
            >
              {isEliminated
                ? `${opponentName} advances`
                : `${opponentName} takes this one`}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-white/60 text-sm leading-relaxed"
            >
              {randomMessage}
            </motion.p>
          </>
        )}

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={onClose}
          className={`mt-6 w-full py-3 rounded-xl font-medium transition-colors ${
            isWinner
              ? "bg-yellow-400 text-black hover:bg-yellow-300"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          {isWinner ? "Continue" : (isEliminated ? "Done" : "Continue")}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
