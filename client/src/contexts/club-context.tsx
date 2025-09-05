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
  // Fetch all clubs to find Polk State College
  const { data: clubs = [], isLoading } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
  });

  // Hardcoded to always select Polk State College
  const selectedClub = clubs.find(club => club.name === "Polk State College") || null;

  // No-op function since selection is hardcoded
  const selectClub = (club: Club) => {
    // Club selection is hardcoded to Polk State College
    // This function is kept for compatibility but does nothing
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