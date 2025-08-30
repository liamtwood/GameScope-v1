import { ReactNode } from "react";
import { ContainerThemeToggle, useContainerTheme } from "./container-theme-toggle";
import { cn } from "@/lib/utils";

interface ThemedLogoContainerProps {
  containerId: string;
  children: ReactNode;
  className?: string;
  showThemeToggle?: boolean;
}

export function ThemedLogoContainer({ 
  containerId, 
  children, 
  className,
  showThemeToggle = true 
}: ThemedLogoContainerProps) {
  const containerTheme = useContainerTheme(containerId);

  return (
    <div className="relative group">
      {/* Theme Toggle Button (appears on hover) */}
      {showThemeToggle && (
        <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <ContainerThemeToggle 
            containerId={containerId}
            size="sm"
            className="bg-white/90 dark:bg-black/90 shadow-sm"
          />
        </div>
      )}
      
      {/* Container with theme-based styling */}
      <div 
        className={cn(
          "transition-all duration-300",
          containerTheme === 'light' 
            ? "bg-white text-black border-gray-200" 
            : "bg-gray-900 text-white border-gray-700",
          className
        )}
        data-container-theme={containerTheme}
        data-testid={`themed-container-${containerId}`}
      >
        {children}
      </div>
    </div>
  );
}