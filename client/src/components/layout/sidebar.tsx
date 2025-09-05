import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronLeft, Home, Calendar, Users as UsersIcon, BarChart3, Video, Settings, Shield, Crosshair, ChevronDown, Landmark, Camera } from "lucide-react";
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
  const { selectedTeam, selectTeam } = useTeam();
  const { selectedClub: currentClub, selectClub } = useClub();
  
  // Get club primary color for menu highlighting
  const clubPrimaryColor = (currentClub?.colors as any)?.primary || '#dc2626';

  // Fetch all teams for the dropdown
  const { data: allTeams = [] } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
    enabled: !collapsed
  });

  // Fetch all clubs to show proper club names in dropdown
  const { data: allClubs = [] } = useQuery<Club[]>({
    queryKey: ['/api/clubs'],
    enabled: !collapsed
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

      {/* Team Selector */}
      {!collapsed && (
        <div className="p-4 border-b border-border">
          <label className="text-[10px] font-bold uppercase tracking-wide mb-2 block text-muted-foreground">
            Select Team
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full p-0 h-auto hover:bg-accent/50"
                data-testid="button-team-selector"
              >
                <div className="bg-secondary rounded-lg p-3 w-full">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <h3 className="font-semibold text-xs text-foreground">
                        {selectedTeam ? selectedTeam.name : "No Team Selected"}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${selectedTeam ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="start">
              {allTeams
                .filter(team => team.clubId === currentClub?.id)
                .map((team) => {
                const teamClub = allClubs.find(club => club.id === team.clubId);
                return (
                  <DropdownMenuItem
                    key={team.id}
                    onClick={() => {
                      selectTeam(team);
                    }}
                    className={cn(
                      "cursor-pointer",
                      selectedTeam?.id === team.id && "bg-accent"
                    )}
                    data-testid={`option-team-${team.id}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{team.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {teamClub ? `${teamClub.name} (${teamClub.shortName})` : 'Unknown Club'}
                      </span>
                    </div>
                  </DropdownMenuItem>
                );
              })}
              {allTeams.filter(team => team.clubId === currentClub?.id).length === 0 && (
                <DropdownMenuItem disabled>
                  <span className="text-muted-foreground">No teams available for this club</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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

    </div>
  );
}
