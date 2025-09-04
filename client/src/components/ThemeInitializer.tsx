import { useClubTheme } from "@/hooks/use-club-theme";

/**
 * Component that initializes club theming
 * This ensures CSS variables are updated when club context changes
 */
export function ThemeInitializer() {
  useClubTheme(); // This hook updates CSS variables automatically
  return null; // This is a utility component with no UI
}