import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Bell, Menu, Crosshair, Home } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { useQuery } from "@tanstack/react-query";
import { OppositionTeam, Club } from "@shared/schema";
import { useClub } from "@/contexts/club-context";

interface HeaderProps {
  title: string;
  subtitle: string;
  onToggleSidebar?: () => void;
  isMobile?: boolean;
}

export function Header({ title, subtitle, onToggleSidebar, isMobile }: HeaderProps) {
  const { data: oppositionTeams } = useQuery<OppositionTeam[]>({ 
    queryKey: ["/api/opposition-teams"] 
  });

  // Use club context for active club
  const { selectedClub: currentClub } = useClub();

  // Use current club's logo instead of hardcoded GameScope
  const logoSrc = currentClub?.logoPath || "/assets/logos/polk-state-logo-transparent.png";

  return (
    <header className="bg-background border-b border-border">
      <div className="px-6" style={{ paddingTop: '16.25px', paddingBottom: '16.25px' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleSidebar}
                data-testid="button-mobile-menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            
            <div className="flex items-center space-x-3 px-3">
              <div className="h-16 w-16 flex items-center justify-center">
                <img 
                  src={logoSrc}
                  alt={`${currentClub?.name || 'Club'} Logo`} 
                  className="h-14 w-14 object-contain"
                />
              </div>
              <div>
                <h1 className="text-3xl text-foreground">
                  {currentClub ? currentClub.name : "Loading..."}
                </h1>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <ModeToggle />
            <Button variant="ghost" size="sm" data-testid="button-notifications">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Container below Polk State College - displays current page */}
      <div className="px-6 bg-muted border-t border-l border-border" style={{ paddingTop: '12.5px', paddingBottom: '12.5px' }}>
        <div className="bg-muted p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {title.toLowerCase() === 'home' && (
                <Home className="h-8 w-8 text-foreground" />
              )}
              <div>
                <h3 className="font-semibold text-base text-foreground">{title.toUpperCase()}</h3>
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              </div>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </header>
  );
}
