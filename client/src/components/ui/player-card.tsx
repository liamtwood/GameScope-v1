import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, MoreHorizontal, Star, User } from "lucide-react";
import { Player } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PlayerCardProps {
  player: Player;
  onEdit?: (player: Player) => void;
  onDelete?: (player: Player) => void;
  onToggleKeyPlayer?: (player: Player) => void;
}

export function PlayerCard({ player, onEdit, onDelete, onToggleKeyPlayer }: PlayerCardProps) {
  
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
    return (
      <div className="h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
        {player.jerseyNumber}
      </div>
    );
  };

  return (
    <Card 
      data-testid={`card-player-${player.id}`} 
      className="border rounded-lg shadow-sm hover:shadow-md transition-shadow"
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between min-h-[80px]">
          {/* Player Avatar */}
          <div className="flex items-center space-x-3">
            <div className="w-24 h-24 flex items-center justify-center">
              {getPlayerDisplay()}
            </div>
            
            {/* Main Content */}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-lg text-foreground">{player.name}</h3>
                {player.keyPlayer && (
                  <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {player.position}
              </p>
            </div>
          </div>

          {/* Right side - Status and Stats */}
          <div className="flex items-center space-x-3">
            {/* Status */}
            <Badge className={`text-xs px-3 py-1 ${getStatusColor()}`}>
              {player.status}
            </Badge>
            

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(player)}>
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
        </div>
      </CardContent>
    </Card>
  );
}