import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, User, Menu, Crosshair, Home, Calendar, Users, Video, Shield, Landmark, Settings, LayoutDashboard } from "lucide-react";
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

  // Get the appropriate icon for each page
  const getPageIcon = (pageTitle: string) => {
    if (!pageTitle) return null;
    const titleLower = pageTitle.toLowerCase();
    // Handle exact matches first
    switch (titleLower) {
      case 'home':
        return <Home className="h-10 w-10 text-club-primary" />;
      case 'dashboard':
        return <LayoutDashboard className="h-10 w-10 text-club-primary" />;
      case 'fixtures':
        return <Calendar className="h-10 w-10 text-club-primary" />;
      case 'squad management':
        return <Users className="h-10 w-10 text-club-primary" />;
      case 'match videos':
        return <Video className="h-10 w-10 text-club-primary" />;
      case 'player profiles':
        return <Users className="h-10 w-10 text-club-primary" />;
      case 'club management':
        return <Landmark className="h-10 w-10 text-club-primary" />;
      case 'settings':
        return <Settings className="h-10 w-10 text-club-primary" />;
      case 'clubs':
        return <Landmark className="h-10 w-10 text-club-primary" />;
      default:
        // Handle pattern matches (like "Club Name - Teams")
        if (titleLower.includes('teams')) {
          return <Shield className="h-10 w-10 text-club-primary" />;
        }
        return null;
    }
  };

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
            <Button variant="ghost" size="sm" data-testid="button-user">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      {/* Container below Polk State College - displays current page */}
      <div className="px-6 bg-muted border-t border-l border-border" style={{ paddingTop: '12.5px', paddingBottom: '12.5px' }}>
        <div 
          className="bg-muted p-3 relative pt-[9px] pb-[9px]"
          style={title === "VIEW SQUAD MEMBER" ? {} : {}}
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-3">
              {getPageIcon(title)}
              <div>
                <h3 className="font-semibold text-foreground text-[18px]">{title?.toUpperCase() || ''}</h3>
                <p className="text-muted-foreground mt-1 text-[13px]">{subtitle}</p>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </header>
  );
}
