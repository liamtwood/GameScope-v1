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
    <header className="bg-white border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-2 gap-8 flex-1">
          {/* Left Column */}
          <div className="space-y-2">
            {/* Row 1: Empty space to align with Polk State */}
            <div className="h-16"></div>
            
            {/* Row 2: Women's Soccer */}
            <div>
              <h3 className="font-semibold text-sm text-foreground">WOMEN'S SOCCER</h3>
              <p className="text-xs text-muted-foreground">{CLUB_NAME}</p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-2">
            {/* Row 1: Polk State College */}
            <div className="flex items-center space-x-3">
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
            
            {/* Row 2: Dashboard */}
            <div className="pl-16">
              <h2 className="text-xl font-bold text-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>
        </div>
        
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
          <Button data-testid="button-quick-add">
            <Plus className="mr-2 h-4 w-4" />
            Quick Add
          </Button>
          <Button variant="ghost" size="sm" data-testid="button-notifications">
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
