import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronLeft, Home, Calendar, Users, BarChart3, Video, Settings, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLUB_NAME, NAVIGATION_ITEMS } from "@/lib/constants";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const [location] = useLocation();
  const currentPath = location === "/" ? "dashboard" : location.slice(1);

  const iconMap = {
    Home,
    Calendar,
    Users,
    BarChart3,
    Video,
  };

  return (
    <div className={cn(
      "h-screen bg-white border-r border-border transition-all duration-300",
      collapsed ? "w-20" : "w-64"
    )}>
      {/* Header */}
      <div className={cn(
        "h-20 px-6 border-b border-border flex items-center",
        collapsed ? "justify-center px-4" : "justify-between"
      )}>
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <Crosshair className="h-6 w-6" style={{ color: '#486D8D' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#486D8D' }}>GameScope</h1>
              <p className="text-xs text-muted-foreground">AI Video Analysis</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-10 h-10 flex items-center justify-center">
            <Crosshair className="h-6 w-6" style={{ color: '#486D8D' }} />
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className={cn(
            "p-2 transition-transform",
            collapsed && "rotate-180"
          )}
          data-testid="button-toggle-sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Team Selector */}
      {!collapsed && (
        <div className="p-4 border-b border-border">
          <div className="bg-secondary rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-foreground">WOMEN'S SOCCER</h3>
                <p className="text-xs text-muted-foreground">{CLUB_NAME}</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {NAVIGATION_ITEMS.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const isActive = currentPath === item.id;
          
          return (
            <Link
              key={item.id}
              href={item.id === 'dashboard' ? '/' : `/${item.id}`}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors w-full",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                collapsed && "justify-center px-2"
              )}
              data-testid={`link-nav-${item.id}`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      {!collapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-white">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-blue-600 text-white font-bold text-sm">
                DS
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-sm text-foreground">Dee Shivraman</p>
              <p className="text-xs text-muted-foreground">Head Coach</p>
            </div>
            <Button variant="ghost" size="sm" data-testid="button-user-settings">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
