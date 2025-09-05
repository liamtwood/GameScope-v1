import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Team } from "@shared/schema";

interface TeamContextType {
  selectedTeam: Team | null;
  selectTeam: (team: Team) => void;
  teams: Team[];
  isLoading: boolean;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

interface TeamProviderProps {
  children: ReactNode;
}

export function TeamProvider({ children }: TeamProviderProps) {
  // Fetch all teams to find WOMEN'S SOCCER
  const { data: teams = [], isLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  // Hardcoded to always select WOMEN'S SOCCER team
  const selectedTeam = teams.find(team => team.name === "WOMEN'S SOCCER") || null;

  // No-op function since selection is hardcoded
  const selectTeam = (team: Team) => {
    // Team selection is hardcoded to WOMEN'S SOCCER
    // This function is kept for compatibility but does nothing
  };

  return (
    <TeamContext.Provider
      value={{
        selectedTeam,
        selectTeam,
        teams,
        isLoading,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return context;
}