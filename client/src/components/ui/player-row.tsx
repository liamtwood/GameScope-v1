import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, Star } from "lucide-react";
import { Player } from "@shared/schema";
import { POSITION_COLORS } from "@/lib/constants";

interface PlayerRowProps {
  player: Player;
  onEdit?: (player: Player) => void;
  onView?: (player: Player) => void;
  onToggleKeyPlayer?: (player: Player) => void;
}

export function PlayerRow({ player, onEdit, onView, onToggleKeyPlayer }: PlayerRowProps) {
  const getPositionCategory = (position: string) => {
    if (['GK'].includes(position)) return 'GK';
    if (['CB', 'LB', 'RB'].includes(position)) return 'DEF';
    if (['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(position)) return 'MID';
    if (['ST', 'LW', 'RW', 'CF'].includes(position)) return 'FWD';
    return 'DEF';
  };

  return (
    <TableRow 
      className="hover:bg-muted/30" 
      data-position={getPositionCategory(player.position)}
      data-testid={`row-player-${player.id}`}
    >
      <TableCell>
        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
          {player.jerseyNumber}
        </div>
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
