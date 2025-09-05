import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronLeft, Home, Calendar, Users as UsersIcon, BarChart3, Video, Settings, Shield, Crosshair, Landmark, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAVIGATION_SECTIONS } from "@/lib/constants";
import { useTeam } from "@/contexts/team-context";
import { useClub } from "@/contexts/club-context";
import type { Club, Team } from "@shared/schema";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const [location] = useLocation();
  const currentPath = location === "/" ? "home" : location.slice(1);
  const { selectedTeam } = useTeam();
  const { selectedClub: currentClub } = useClub();
  
  // Get club primary color for menu highlighting
  const clubPrimaryColor = (currentClub?.colors as any)?.primary || '#dc2626';

  // No need to fetch all teams/clubs since selection is hardcoded

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
  };

  return (
    <div className={cn(
      "h-screen bg-background border-r border-border transition-all duration-300",
      collapsed ? "w-20" : "w-64"
    )}>
      {/* Header */}
      <div className={cn(
        "px-6 border-b border-border flex items-center",
        collapsed ? "justify-center px-4" : "justify-between"
      )} style={{ paddingTop: '17px', paddingBottom: '17px' }}>
        {!collapsed && (
          <div className="flex items-center">
            <div className="h-16 w-16 flex items-center justify-center">
              <Crosshair className="h-8 w-8" style={{ color: '#486D8D' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#486D8D' }}>GameScope</h1>
              <p className="text-xs text-muted-foreground">AI Video Analysis</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="h-16 w-16 flex items-center justify-center">
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

      {/* Team Display (Hardcoded) */}
      {!collapsed && (
        <div className="p-4 border-b border-border">
          <label className="text-[10px] font-bold uppercase tracking-wide mb-2 block text-muted-foreground">
            Current Team
          </label>
          <div className="bg-secondary rounded-lg p-3 w-full">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h3 className="font-semibold text-sm text-foreground">
                  {selectedTeam ? selectedTeam.name : "WOMEN'S SOCCER"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {currentClub ? currentClub.name : "Polk State College"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="p-4 space-y-6">
        {NAVIGATION_SECTIONS.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <h3 
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: clubPrimaryColor }}
              >
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap];
                const isActive = currentPath === item.id;
                
                // Build href
                const href = item.id === 'home' ? '/' : `/${item.id}`;
                
                return (
                  <Link
                    key={item.id}
                    href={href}
                    className={cn(
                      "flex items-center space-x-3 py-2 transition-colors w-full -ml-4 pl-7 hover:text-accent-foreground",
                      isActive 
                        ? "text-white" 
                        : "",
                      collapsed && "justify-center px-2 mx-0"
                    )}
                    style={isActive ? { 
                      backgroundColor: clubPrimaryColor,
                      marginRight: '-2rem',
                      paddingRight: '2rem',
                      width: 'calc(100% + 2rem)'
                    } : {}}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.marginRight = '-2rem';
                        e.currentTarget.style.paddingRight = '2rem';
                        e.currentTarget.style.width = 'calc(100% + 2rem)';
                        e.currentTarget.style.backgroundColor = '#f1f5f9'; // Light gray hover
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.marginRight = '';
                        e.currentTarget.style.paddingRight = '';
                        e.currentTarget.style.width = '';
                        e.currentTarget.style.backgroundColor = '';
                      }
                    }}
                    data-testid={`link-nav-${item.id}`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span className="font-medium">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
            {!collapsed && section.items.length === 0 && (
              <p className="text-xs text-muted-foreground italic px-3">No items yet</p>
            )}
          </div>
        ))}
      </nav>

      {/* User Profile */}
      {!collapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback 
                className="text-white font-bold text-sm"
                style={{ backgroundColor: clubPrimaryColor }}
              >
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
