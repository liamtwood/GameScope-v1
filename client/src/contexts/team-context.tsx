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
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Fetch all teams
  const { data: teams = [], isLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  // Get selected team from teams array
  const selectedTeam = teams.find(team => team.id === selectedTeamId) || teams[0] || null;

  // Load selected team ID from localStorage on mount
  useEffect(() => {
    const storedTeamId = localStorage.getItem("selectedTeamId");
    if (storedTeamId && teams.some(team => team.id === storedTeamId)) {
      setSelectedTeamId(storedTeamId);
    } else if (teams.length > 0 && !selectedTeamId) {
      // Default to first team if none selected
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

  const selectTeam = (team: Team) => {
    setSelectedTeamId(team.id);
    localStorage.setItem("selectedTeamId", team.id);
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