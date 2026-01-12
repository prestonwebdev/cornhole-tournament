"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, BookOpen, Target, Trophy, ChevronDown, ChevronUp } from "lucide-react";

interface RulesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RulesSheet({ open, onOpenChange }: RulesSheetProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>("basics");

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />

          {/* Sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 top-0 z-50 bg-[#1a1a1a] overflow-hidden flex flex-col"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-white" />
                <h2 className="text-xl font-bold text-white">Cornhole Rules</h2>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Basic Rules */}
              <div className="bg-white/5 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection("basics")}
                  className="w-full flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-green-400" />
                    <span className="font-semibold text-white">Basic Rules</span>
                  </div>
                  {expandedSection === "basics" ? (
                    <ChevronUp className="h-5 w-5 text-white/60" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-white/60" />
                  )}
                </button>
                <AnimatePresence>
                  {expandedSection === "basics" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-4 text-white/70 text-sm">
                        <div>
                          <h4 className="font-medium text-white mb-2">Setup</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Two boards are placed 27 feet apart (front to front)</li>
                            <li>Each team has 4 bags of a distinct color</li>
                            <li>Teammates stand at opposite boards</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-white mb-2">Gameplay</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Teams alternate throws, one bag at a time</li>
                            <li>Players must throw from behind the front of the board</li>
                            <li>All 8 bags (4 per team) are thrown each round</li>
                            <li>After all bags are thrown, the round is scored</li>
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Scoring */}
              <div className="bg-white/5 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection("scoring")}
                  className="w-full flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🎯</span>
                    <span className="font-semibold text-white">Scoring</span>
                  </div>
                  {expandedSection === "scoring" ? (
                    <ChevronUp className="h-5 w-5 text-white/60" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-white/60" />
                  )}
                </button>
                <AnimatePresence>
                  {expandedSection === "scoring" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-4 text-white/70 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-green-400">3</p>
                            <p className="text-xs text-white/60">Bag in hole</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-yellow-400">1</p>
                            <p className="text-xs text-white/60">Bag on board</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-white mb-2">Cancellation Scoring</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Only the team with the higher score earns points each round</li>
                            <li>Points earned = higher score minus lower score</li>
                            <li>Example: Team A scores 5, Team B scores 3 → Team A gets 2 points</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-white mb-2">Winning</h4>
                          <p>First team to reach exactly <span className="text-white font-bold">21 points</span> wins!</p>
                          <p className="text-white/50 mt-1">If you go over 21, your score resets to 15.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Double Elimination */}
              <div className="bg-white/5 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection("bracket")}
                  className="w-full flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    <span className="font-semibold text-white">Double Elimination Bracket</span>
                  </div>
                  {expandedSection === "bracket" ? (
                    <ChevronUp className="h-5 w-5 text-white/60" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-white/60" />
                  )}
                </button>
                <AnimatePresence>
                  {expandedSection === "bracket" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-4 text-white/70 text-sm">
                        <div>
                          <h4 className="font-medium text-white mb-2">How It Works</h4>
                          <p>In double elimination, you must lose <span className="text-white font-bold">twice</span> to be eliminated from the tournament.</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-white mb-2">The Two Brackets</h4>
                          <ul className="list-disc list-inside space-y-2">
                            <li>
                              <span className="text-green-400 font-medium">Winners Bracket:</span> All teams start here. Win and you stay, lose and you drop to the Losers Bracket.
                            </li>
                            <li>
                              <span className="text-yellow-400 font-medium">Losers Bracket:</span> Your second chance! Win to stay alive, lose and you&apos;re out.
                            </li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-white mb-2">Championship</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Winners Bracket champion faces Losers Bracket champion</li>
                            <li>If the Losers Bracket team wins, a second finals game is played</li>
                            <li>Winner takes it all!</li>
                          </ul>
                        </div>
                        <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                          <p className="text-green-400 text-xs">
                            <span className="font-bold">Pro tip:</span> Staying in the Winners Bracket gives you an advantage — fewer games to play and you&apos;re always one win away from the finals!
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Quick Reference */}
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-semibold text-white mb-3">Quick Reference</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-white/50 text-xs mb-1">Distance</p>
                    <p className="text-white font-medium">27 feet</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-white/50 text-xs mb-1">Winning Score</p>
                    <p className="text-white font-medium">21 points</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-white/50 text-xs mb-1">Bags per Team</p>
                    <p className="text-white font-medium">4 bags</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-white/50 text-xs mb-1">Bust Score</p>
                    <p className="text-white font-medium">Back to 15</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
