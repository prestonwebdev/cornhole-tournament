"use client";

import { useState, useEffect, useCallback } from "react";

const DEMO_MODE_KEY = "cornhole_demo_mode";
const SIMULATED_START_KEY = "cornhole_simulated_start";

export function useDemoMode() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(DEMO_MODE_KEY);
    setIsEnabled(stored === "true");
    setIsLoaded(true);
  }, []);

  // Toggle demo mode
  const toggle = useCallback(() => {
    setIsEnabled((prev) => {
      const newValue = !prev;
      localStorage.setItem(DEMO_MODE_KEY, String(newValue));
      return newValue;
    });
  }, []);

  // Explicitly set demo mode
  const setDemoMode = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    localStorage.setItem(DEMO_MODE_KEY, String(enabled));
  }, []);

  return {
    isEnabled,
    isLoaded,
    toggle,
    setDemoMode,
  };
}

// Hook for simulating tournament start time (admin testing)
export function useSimulatedTournamentStart() {
  const [simulatedStart, setSimulatedStartState] = useState<"none" | "started" | "not_started">("none");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SIMULATED_START_KEY);
    if (stored === "started" || stored === "not_started") {
      setSimulatedStartState(stored);
    } else {
      setSimulatedStartState("none");
    }
    setIsLoaded(true);
  }, []);

  // Set simulated start state
  const setSimulatedStart = useCallback((value: "none" | "started" | "not_started") => {
    setSimulatedStartState(value);
    if (value === "none") {
      localStorage.removeItem(SIMULATED_START_KEY);
    } else {
      localStorage.setItem(SIMULATED_START_KEY, value);
    }
  }, []);

  // Check if tournament has started (considering simulation)
  const hasTournamentStarted = useCallback((eventDate: string | null | undefined): boolean => {
    // If simulating, use simulated value
    if (simulatedStart === "started") return true;
    if (simulatedStart === "not_started") return false;

    // Otherwise, check actual time
    if (!eventDate) return false;
    const eventTime = new Date(eventDate).getTime();
    const now = Date.now();
    return now >= eventTime;
  }, [simulatedStart]);

  return {
    simulatedStart,
    setSimulatedStart,
    hasTournamentStarted,
    isLoaded,
  };
}
