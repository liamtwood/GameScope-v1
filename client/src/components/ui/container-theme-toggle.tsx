import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContainerThemeToggleProps {
  containerId: string;
  className?: string;
  size?: "sm" | "default";
}

export function ContainerThemeToggle({ 
  containerId, 
  className,
  size = "sm" 
}: ContainerThemeToggleProps) {
  const [containerTheme, setContainerTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    const newTheme = containerTheme === 'light' ? 'dark' : 'light';
    setContainerTheme(newTheme);
    
    // Store the preference in localStorage for this specific container
    localStorage.setItem(`container-theme-${containerId}`, newTheme);
    
    // Dispatch a custom event to notify other components
    window.dispatchEvent(new CustomEvent('container-theme-change', {
      detail: { containerId, theme: newTheme }
    }));
  };

  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={toggleTheme}
      className={cn(
        "p-1 hover:bg-accent hover:text-accent-foreground transition-colors",
        className
      )}
      data-testid={`button-theme-toggle-${containerId}`}
    >
      {containerTheme === 'light' ? (
        <Sun className={iconSize} />
      ) : (
        <Moon className={iconSize} />
      )}
    </Button>
  );
}

// Hook to get the current theme for a container
export function useContainerTheme(containerId: string) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(`container-theme-${containerId}`);
    return (saved as 'light' | 'dark') || 'light';
  });

  // Listen for theme changes
  useState(() => {
    const handleThemeChange = (event: CustomEvent) => {
      if (event.detail.containerId === containerId) {
        setTheme(event.detail.theme);
      }
    };

    window.addEventListener('container-theme-change', handleThemeChange as EventListener);
    
    return () => {
      window.removeEventListener('container-theme-change', handleThemeChange as EventListener);
    };
  });

  return theme;
}