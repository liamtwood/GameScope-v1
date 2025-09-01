import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Club } from "@shared/schema";

interface ClubContextType {
  selectedClub: Club | null;
  selectClub: (club: Club) => void;
  clubs: Club[];
  isLoading: boolean;
}

const ClubContext = createContext<ClubContextType | undefined>(undefined);

interface ClubProviderProps {
  children: ReactNode;
}

export function ClubProvider({ children }: ClubProviderProps) {
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);

  // Fetch all clubs
  const { data: clubs = [], isLoading } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
  });

  // Get selected club from clubs array
  const selectedClub = clubs.find(club => club.id === selectedClubId) || clubs[0] || null;

  // Load selected club ID from localStorage on mount
  useEffect(() => {
    const storedClubId = localStorage.getItem("selectedClubId");
    if (storedClubId && clubs.some(club => club.id === storedClubId)) {
      setSelectedClubId(storedClubId);
    } else if (clubs.length > 0 && !selectedClubId) {
      // Default to first club if none selected
      setSelectedClubId(clubs[0].id);
    }
  }, [clubs, selectedClubId]);

  const selectClub = (club: Club) => {
    setSelectedClubId(club.id);
    localStorage.setItem("selectedClubId", club.id);
  };

  return (
    <ClubContext.Provider
      value={{
        selectedClub,
        selectClub,
        clubs,
        isLoading,
      }}
    >
      {children}
    </ClubContext.Provider>
  );
}

export function useClub() {
  const context = useContext(ClubContext);
  if (context === undefined) {
    throw new Error("useClub must be used within a ClubProvider");
  }
  return context;
}