import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Bell, Menu, Crosshair } from "lucide-react";
import { CLUB_NAME } from "@/lib/constants";

interface HeaderProps {
  title: string;
  subtitle: string;
  onToggleSidebar?: () => void;
  isMobile?: boolean;
}

export function Header({ title, subtitle, onToggleSidebar, isMobile }: HeaderProps) {
  return (
    <header className="bg-white border-b border-border">
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
                  src="/assets/logos/polk-state-logo.jpg" 
                  alt="Polk State College Logo" 
                  className="h-14 w-14 object-contain"
                />
              </div>
              <div>
                <h1 className="text-3xl text-foreground">{CLUB_NAME}</h1>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" data-testid="button-notifications">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Container below Polk State College - displays current page */}
      <div className="px-6 bg-secondary" style={{ paddingTop: '4.0px', paddingBottom: '4.0px' }}>
        <div className="bg-secondary rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base text-foreground">{title.toUpperCase()}</h3>
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </header>
  );
}
