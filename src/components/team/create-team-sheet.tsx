"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { createTeam } from "@/lib/actions/team";
import { useToast } from "@/components/ui/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Loader2, Users, Link2, Globe, Shuffle, Sparkles } from "lucide-react";

// 50 creative cornhole team names
const TEAM_NAME_SUGGESTIONS = [
  "Corn Stars",
  "Bag Daddies",
  "Hole in One",
  "Toss Masters",
  "The Kernel's Army",
  "Bags to Riches",
  "Cornholio's Revenge",
  "Holy Cornhole",
  "Sack Attack",
  "Board Certified",
  "Corn on the Lob",
  "The Tossholes",
  "Bag Street Boys",
  "Corny Jokes",
  "Slide & Glide",
  "Bean Bag Bandits",
  "Air Mail Express",
  "The Sliders",
  "Hole Diggers",
  "Corn Dawgs",
  "Baggin' Dragons",
  "The Underdogs",
  "Kernel Sanders",
  "Maize Runners",
  "Pitch Perfect",
  "Husker Tosses",
  "Bag Ladies & Gents",
  "The Corn Huskers",
  "Toss Salad",
  "Hole Hearted",
  "Bags of Fun",
  "Cornhole Commandos",
  "The Flying Bags",
  "Hole Patrol",
  "Bag It Up",
  "Corn Fed Champions",
  "The Board Walkers",
  "Ace Holes",
  "Toss the Boss",
  "Maize & Blue Crew",
  "Bag Lunch Bunch",
  "The 4 Pointers",
  "Cob Mob",
  "Slide Rule",
  "Bean There Done That",
  "Cornucopia Kings",
  "No Holes Barred",
  "Popcorn Posse",
  "The Bag Whisperers",
  "Golden Kernels",
];

interface CreateTeamSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  takenTeamNames: string[];
}

export function CreateTeamSheet({ open, onOpenChange, takenTeamNames }: CreateTeamSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [currentSuggestion, setCurrentSuggestion] = useState("");
  const { toast } = useToast();

  // Filter out taken names
  const availableNames = TEAM_NAME_SUGGESTIONS.filter(
    (name) => !takenTeamNames.some((taken) => taken.toLowerCase() === name.toLowerCase())
  );

  // Get a random available name
  const getRandomName = () => {
    if (availableNames.length === 0) return "";
    const randomIndex = Math.floor(Math.random() * availableNames.length);
    return availableNames[randomIndex];
  };

  // Set initial suggestion when sheet opens
  useEffect(() => {
    if (open) {
      setCurrentSuggestion(getRandomName());
      setTeamName("");
      setIsOpen(false);
    }
  }, [open]);

  const shuffleSuggestion = () => {
    const newName = getRandomName();
    setCurrentSuggestion(newName);
  };

  const useSuggestion = () => {
    setTeamName(currentSuggestion);
    shuffleSuggestion();
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("isOpen", isOpen.toString());
    const result = await createTeam(formData);

    setIsLoading(false);

    if (result?.error) {
      toast({
        title: "Failed to create team",
        description: result.error,
        variant: "destructive",
      });
    } else {
      onOpenChange(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-white/60" />
            </div>
          </div>
          <SheetTitle className="text-center">Create a Team</SheetTitle>
          <SheetDescription className="text-center">
            Choose how you want teammates to join
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="sheet-name" className="block text-sm font-medium text-white/80">
              Team Name
            </label>
            <input
              id="sheet-name"
              name="name"
              type="text"
              placeholder="Enter team name"
              required
              minLength={2}
              maxLength={50}
              disabled={isLoading}
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent disabled:opacity-50"
            />

            {/* Name Suggestion */}
            {availableNames.length > 0 && currentSuggestion && (
              <motion.div
                className="flex items-center gap-2 mt-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
                  <Sparkles className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                  <span className="text-white/80 text-sm truncate">{currentSuggestion}</span>
                </div>
                <motion.button
                  type="button"
                  onClick={useSuggestion}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  Use
                </motion.button>
                <motion.button
                  type="button"
                  onClick={shuffleSuggestion}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/60 transition-colors"
                  whileTap={{ scale: 0.95, rotate: 180 }}
                >
                  <Shuffle className="h-4 w-4" />
                </motion.button>
              </motion.div>
            )}
          </div>

          {/* Join Method Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-white/80">
              How can teammates join?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`p-4 rounded-xl border-2 transition-colors text-left ${
                  !isOpen
                    ? "border-white bg-white/10"
                    : "border-white/10 bg-white/5"
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <Link2 className={`h-5 w-5 mb-2 ${!isOpen ? "text-white" : "text-white/40"}`} />
                <p className={`text-sm font-medium ${!isOpen ? "text-white" : "text-white/60"}`}>
                  Invite Only
                </p>
                <p className="text-xs text-white/40 mt-1">
                  Share a link
                </p>
              </motion.button>

              <motion.button
                type="button"
                onClick={() => setIsOpen(true)}
                className={`p-4 rounded-xl border-2 transition-colors text-left ${
                  isOpen
                    ? "border-white bg-white/10"
                    : "border-white/10 bg-white/5"
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <Globe className={`h-5 w-5 mb-2 ${isOpen ? "text-white" : "text-white/40"}`} />
                <p className={`text-sm font-medium ${isOpen ? "text-white" : "text-white/60"}`}>
                  Open Team
                </p>
                <p className="text-xs text-white/40 mt-1">
                  Anyone can join
                </p>
              </motion.button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-white text-[#1a1a1a] rounded-xl font-medium text-lg hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating team...
              </>
            ) : (
              "Create Team"
            )}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
