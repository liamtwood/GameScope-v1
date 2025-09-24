import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Home, 
  Calendar, 
  Users as UsersIcon, 
  BarChart3, 
  Video, 
  Settings, 
  Shield, 
  Crosshair, 
  Menu,
  Landmark,
  Camera,
  LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAVIGATION_SECTIONS } from "@/lib/constants";
import { useTeam } from "@/contexts/team-context";
import { useClub } from "@/contexts/club-context";
import type { Club, Team } from "@shared/schema";

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [location] = useLocation();
  const currentPath = location === "/" ? "home" : location.slice(1);
  const { selectedTeam } = useTeam();
  const { selectedClub: currentClub } = useClub();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Get club primary color for menu highlighting
  const clubPrimaryColor = (currentClub?.colors as any)?.primary || '#dc2626';

  // Fetch all teams for the dropdown
  const { data: allTeams = [] } = useQuery<Team[]>({
    queryKey: ['/api/teams']
  });

  const iconMap = {
    Home,
    Calendar,
    Users: UsersIcon,
    BarChart3,
    Video,
    Settings,
    Shield,
    Landmark,
    Camera,
    'layout-dashboard': LayoutDashboard,
  };

  // Get current section based on the path
  const getCurrentSection = () => {
    for (const section of NAVIGATION_SECTIONS) {
      const currentItem = section.items.find(item => 
        currentPath === item.id || 
        (item.id === 'home' && currentPath === 'home')
      );
      if (currentItem) {
        return { section, item: currentItem };
      }
    }
    return null;
  };

  const currentSection = getCurrentSection();

  const renderNavigationItems = (items: any[]) => {
    return items.map((item) => {
      const IconComponent = iconMap[item.icon as keyof typeof iconMap];
      const isActive = currentPath === item.id || (item.id === 'home' && currentPath === 'home');
      
      return (
        <Link key={item.id} href={item.id === 'home' ? '/' : `/${item.id}`}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-left px-4 py-3 h-auto",
              isActive && "bg-accent text-accent-foreground font-medium"
            )}
            style={isActive ? { backgroundColor: clubPrimaryColor + '20', color: clubPrimaryColor } : {}}
            onClick={() => setIsMenuOpen(false)}
            data-testid={`link-${item.id}`}
          >
            {IconComponent && (
              <IconComponent className="mr-3 h-5 w-5" style={isActive ? { color: clubPrimaryColor } : {}} />
            )}
            <div>
              <div className="font-medium">{item.label}</div>
              {item.tooltip && (
                <div className="text-xs text-muted-foreground mt-0.5">{item.tooltip}</div>
              )}
            </div>
          </Button>
        </Link>
      );
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-3">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="border-b p-4">
                  <div className="flex items-center space-x-3">
                    <Crosshair className="h-8 w-8" style={{ color: '#486D8D' }} />
                    <div className="text-left">
                      <SheetTitle className="text-lg" style={{ color: '#486D8D' }}>GameScope</SheetTitle>
                      <p className="text-xs text-muted-foreground">AI Video Analysis</p>
                    </div>
                  </div>
                </SheetHeader>
                
                <div className="overflow-y-auto p-4 space-y-6">
                  {/* Team Selection */}
                  {selectedTeam && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Current Team</h3>
                      <div className="flex items-center space-x-2 p-2 rounded-lg bg-accent/50">
                        <Badge variant="outline" className="text-xs">
                          {selectedTeam.name}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Navigation Sections */}
                  {NAVIGATION_SECTIONS.map((section, index) => (
                    <div key={index} className="space-y-2">
                      {section.title && (
                        <h3 className="text-sm font-medium text-muted-foreground">{section.title}</h3>
                      )}
                      <div className="space-y-1">
                        {renderNavigationItems(section.items)}
                      </div>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
            
            <div className="flex items-center space-x-2">
              <Crosshair className="h-6 w-6" style={{ color: '#486D8D' }} />
              <h1 className="text-lg font-bold" style={{ color: '#486D8D' }}>GameScope</h1>
            </div>
          </div>

          {/* Current Page Title */}
          <div className="text-center">
            <h2 className="text-sm font-medium">
              {currentSection?.item.label || 'GameScope'}
            </h2>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6">
        {children}
      </main>

      {/* Bottom Navigation (Alternative to hamburger menu) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
        <div className="grid grid-cols-4 h-16">
          {NAVIGATION_SECTIONS[1].items.slice(0, 4).map((item) => {
            const IconComponent = iconMap[item.icon as keyof typeof iconMap];
            const isActive = currentPath === item.id || (item.id === 'home' && currentPath === 'home');
            
            return (
              <Link key={item.id} href={item.id === 'home' ? '/' : `/${item.id}`}>
                <Button
                  variant="ghost"
                  className={cn(
                    "h-full w-full rounded-none flex flex-col items-center justify-center space-y-1 p-2",
                    isActive && "bg-accent text-accent-foreground"
                  )}
                  style={isActive ? { backgroundColor: clubPrimaryColor + '20', color: clubPrimaryColor } : {}}
                  data-testid={`bottom-nav-${item.id}`}
                >
                  {IconComponent && (
                    <IconComponent className="h-5 w-5" style={isActive ? { color: clubPrimaryColor } : {}} />
                  )}
                  <span className="text-xs">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom padding to account for fixed bottom navigation */}
      <div className="h-16"></div>
    </div>
  );
}