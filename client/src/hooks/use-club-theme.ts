import { useEffect } from "react";
import { useClub } from "@/contexts/club-context";

/**
 * Hook that dynamically updates CSS variables for club branding colors
 * This allows using Tailwind classes like text-club-primary throughout the app
 */
export function useClubTheme() {
  const { selectedClub } = useClub();

  useEffect(() => {
    const root = document.documentElement;
    
    if (selectedClub?.colors) {
      const clubColors = selectedClub.colors as { primary?: string; secondary?: string };
      
      // Update CSS variables for club colors
      if (clubColors.primary) {
        root.style.setProperty('--club-primary', clubColors.primary);
      }
      
      if (clubColors.secondary) {
        root.style.setProperty('--club-secondary', clubColors.secondary);
      }
    } else {
      // Reset to defaults when no club selected
      root.style.setProperty('--club-primary', '#dc2626');
      root.style.setProperty('--club-secondary', '#000000');
    }
  }, [selectedClub]);

  // Return the current colors for components that need direct access
  const clubColors = selectedClub?.colors as { primary?: string; secondary?: string } | null;
  return {
    clubPrimary: clubColors?.primary || '#dc2626',
    clubSecondary: clubColors?.secondary || '#000000',
  };
}