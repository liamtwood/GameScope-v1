import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Edit, Eye, Star, Check, X } from "lucide-react";
import { User } from "@shared/schema";
import { POSITION_COLORS } from "@/lib/constants";
import { useState } from "react";

// Extended player type that includes team-specific fields
type PlayerWithTeamData = User & {
  jerseyNumber?: number | null;
  position?: string;
  starPlayer?: boolean;
  keyPlayer?: boolean;
  fitnessStatus?: string;
  year?: string;
  appearances?: number;
  goals?: number;
  assists?: number;
};

interface PlayerRowProps {
  player: PlayerWithTeamData;
  teamId?: string;
  onEdit?: (player: PlayerWithTeamData) => void;
  onView?: (player: PlayerWithTeamData) => void;
  onToggleKeyPlayer?: (player: PlayerWithTeamData) => void;
  onUpdateJerseyNumber?: (playerId: string, teamId: string, jerseyNumber: number) => void;
}

export function PlayerRow({ player, teamId, onEdit, onView, onToggleKeyPlayer, onUpdateJerseyNumber }: PlayerRowProps) {
  const [isEditingJersey, setIsEditingJersey] = useState(false);
  const [editJerseyValue, setEditJerseyValue] = useState(player.jerseyNumber?.toString() || '');
  const getPositionCategory = (position?: string) => {
    if (!position) return 'MID';
    if (['GK'].includes(position)) return 'GK';
    if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(position)) return 'DEF';
    if (['CM', 'CDM', 'CAM', 'LM', 'RM', 'DM', 'AM'].includes(position)) return 'MID';
    if (['ST', 'LW', 'RW', 'CF'].includes(position)) return 'FWD';
    return 'MID'; // Default to midfield instead of defender
  };

  const handleSaveJersey = () => {
    const newJerseyNumber = parseInt(editJerseyValue);
    if (!isNaN(newJerseyNumber) && teamId && onUpdateJerseyNumber) {
      onUpdateJerseyNumber(player.id, teamId, newJerseyNumber);
    }
    setIsEditingJersey(false);
  };

  const handleCancelJersey = () => {
    setEditJerseyValue(player.jerseyNumber?.toString() || '');
    setIsEditingJersey(false);
  };

  return (
    <TableRow 
      className="hover:bg-muted/30" 
      data-position={getPositionCategory(player.position)}
      data-testid={`row-player-${player.id}`}
    >
      <TableCell>
        {isEditingJersey ? (
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={editJerseyValue}
              onChange={(e) => setEditJerseyValue(e.target.value)}
              className="w-16 h-8 text-center"
              min="1"
              max="99"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveJersey}
              className="h-6 w-6 p-0"
            >
              <Check className="h-3 w-3 text-green-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelJersey}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3 text-red-600" />
            </Button>
          </div>
        ) : (
          <div 
            className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold cursor-pointer hover:bg-primary/80"
            onClick={() => setIsEditingJersey(true)}
            title="Click to edit jersey number"
          >
            {player.jerseyNumber || '?'}
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <div>
            <p className="font-semibold text-foreground">{player.firstName} {player.lastName}</p>
            <p className="text-sm text-muted-foreground">{player.hometown}</p>
          </div>
          {onToggleKeyPlayer && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleKeyPlayer(player)}
              className="h-6 w-6 p-0"
              data-testid={`button-key-player-${player.id}`}
            >
              <Star 
                className={`h-4 w-4 transition-colors ${
                  player.keyPlayer 
                    ? 'text-orange-500 fill-orange-500' 
                    : 'text-gray-300 hover:text-orange-300'
                }`} 
              />
            </Button>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge className={POSITION_COLORS[player.position as keyof typeof POSITION_COLORS] || "bg-gray-100 text-gray-800"}>
          {player.position}
        </Badge>
      </TableCell>
      <TableCell className="text-foreground">{player.year}</TableCell>
      <TableCell className="text-foreground font-semibold">{player.appearances}</TableCell>
      <TableCell className="text-foreground font-semibold">{player.goals}</TableCell>
      <TableCell className="text-foreground font-semibold">{player.assists}</TableCell>
      <TableCell className="text-muted-foreground">{player.height}</TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onEdit?.(player)}
            data-testid={`button-edit-player-${player.id}`}
          >
            <Edit className="h-4 w-4 text-blue-600" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onView?.(player)}
            data-testid={`button-view-player-${player.id}`}
          >
            <Eye className="h-4 w-4 text-green-600" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
