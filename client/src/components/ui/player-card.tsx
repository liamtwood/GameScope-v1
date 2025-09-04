import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, MoreHorizontal, Star, User } from "lucide-react";
import { Player } from "@shared/schema";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClubTheme } from "@/hooks/use-club-theme";

interface PlayerCardProps {
  player: Player;
  onEdit?: (player: Player) => void;
  onDelete?: (player: Player) => void;
  onToggleKeyPlayer?: (player: Player) => void;
  onUpdateStatus?: (player: Player, newStatus: string) => void;
}

export function PlayerCard({ player, onEdit, onDelete, onToggleKeyPlayer, onUpdateStatus }: PlayerCardProps) {
  const [, setLocation] = useLocation();
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const { clubPrimaryColor } = useClubTheme();
  
  const getStatusColor = () => {
    switch (player.status) {
      case 'Fit':
        return 'bg-green-500 text-white';
      case 'Injured':
        return 'bg-red-500 text-white';
      case 'Retired':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getPositionCategory = (position: string): string => {
    if (position.includes('GK') || position.includes('Goalkeeper')) return 'GK';
    if (position.includes('CB') || position.includes('LB') || position.includes('RB') || 
        position.includes('LWB') || position.includes('RWB') || position.includes('Defense')) return 'DEF';
    if (position.includes('CM') || position.includes('CDM') || position.includes('CAM') || 
        position.includes('LM') || position.includes('RM') || position.includes('Midfield')) return 'MID';
    if (position.includes('ST') || position.includes('CF') || position.includes('LW') || 
        position.includes('RW') || position.includes('Forward')) return 'FWD';
    return position;
  };

  const getPositionColor = () => {
    const positionCategory = getPositionCategory(player.position);
    switch (positionCategory) {
      case 'GK':
        return 'bg-purple-100 text-purple-800';
      case 'DEF':
        return 'bg-blue-100 text-blue-800';
      case 'MID':
        return 'bg-green-100 text-green-800';
      case 'FWD':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to get player display (jersey number)
  const getPlayerDisplay = () => {
    // Show squad number if available, otherwise jersey number, otherwise ?
    const displayNumber = player.jerseyNumber || '?';
    return (
      <div 
        className="h-16 w-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg"
        style={{ backgroundColor: clubPrimaryColor }}
      >
        {displayNumber}
      </div>
    );
  };

  return (
    <Card 
      data-testid={`card-player-${player.id}`} 
      className="border rounded-full cursor-pointer w-32 h-32 p-0 hover:shadow-lg transition-shadow"
      onClick={(e) => {
        // Only trigger navigation if not clicking on interactive elements
        if (!e.defaultPrevented) {
          setLocation(`/players/${player.id}`);
        }
      }}
    >
      <CardContent className="p-0 h-full w-full relative">
        <div className="flex flex-col items-center justify-center h-full w-full">
          {/* Central Jersey Number Circle */}
          <div className="relative">
            {getPlayerDisplay()}
            {/* Star player indicator */}
            {player.keyPlayer && (
              <div className="absolute -top-1 -right-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 bg-white rounded-full p-0.5" />
              </div>
            )}
          </div>
          
          {/* Player Name - positioned at bottom */}
          <div className="absolute bottom-2 left-0 right-0 text-center px-2">
            <p className="text-xs font-semibold text-foreground truncate">
              {player.firstName.charAt(0)}. {player.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {player.position}
            </p>
          </div>

          {/* Actions Menu - positioned at top right */}
          <div className="absolute top-1 right-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="h-6 w-6 p-0 bg-white/80 hover:bg-white rounded-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(player);
                  }}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Player
                  </DropdownMenuItem>
                )}
                {onToggleKeyPlayer && (
                  <DropdownMenuItem onClick={() => onToggleKeyPlayer(player)}>
                    <Star className="mr-2 h-4 w-4" />
                    {player.keyPlayer ? 'Remove Star' : 'Make Star Player'}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(player)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Player
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Status Badge - positioned at top left */}
          <div className="absolute top-1 left-1">
            {isEditingStatus ? (
              <Select
                value={player.status || "Fit"}
                onValueChange={(newStatus) => {
                  if (onUpdateStatus) {
                    onUpdateStatus(player, newStatus);
                  }
                  setIsEditingStatus(false);
                }}
              >
                <SelectTrigger className="w-16 h-6 text-xs bg-white/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fit">Fit</SelectItem>
                  <SelectItem value="Injured">Injured</SelectItem>
                  <SelectItem value="Retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge 
                className={`text-xs px-2 py-0.5 cursor-pointer hover:opacity-80 ${getStatusColor()}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingStatus(true);
                }}
                title="Click to edit status"
              >
                {player.status?.charAt(0) || 'F'}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}