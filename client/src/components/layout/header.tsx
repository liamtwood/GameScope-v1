import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Bell, Menu } from "lucide-react";
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
          
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 flex items-center justify-center">
              <img 
                src="/assets/logos/polk-state-logo.jpg" 
                alt="Polk State College Logo" 
                className="h-10 w-10 object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{CLUB_NAME}</h1>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button data-testid="button-quick-add">
            <Plus className="mr-2 h-4 w-4" />
            Quick Add
          </Button>
          <Button variant="ghost" size="sm" data-testid="button-notifications">
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="mt-4">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </header>
  );
}
