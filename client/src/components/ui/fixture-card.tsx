import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Fixture, OppositionTeam } from "@shared/schema";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FixtureCardProps {
  fixture: Fixture;
  onViewDetails?: (fixture: Fixture) => void;
  onEdit?: (fixture: Fixture) => void;
  onDelete?: (fixture: Fixture) => void;
}

export function FixtureCard({ fixture, onViewDetails, onEdit, onDelete }: FixtureCardProps) {
  // Fetch opposition teams to get logo information
  const { data: oppositionTeams = [] } = useQuery<OppositionTeam[]>({
    queryKey: ["/api/opposition-teams"],
  });

  // Find the opposition team for this fixture
  const oppositionTeam = oppositionTeams.find(team => team.name === fixture.opponent);

  const getResultDisplay = () => {
    if (fixture.status === 'COMPLETED') {
      if (fixture.homeScore !== null && fixture.awayScore !== null) {
        const isHome = fixture.type === 'HOME';
        const ourScore = isHome ? fixture.homeScore : fixture.awayScore;
        const theirScore = isHome ? fixture.awayScore : fixture.homeScore;
        
        if (ourScore > theirScore) {
          return `${ourScore}-${theirScore} WIN`;
        } else if (ourScore < theirScore) {
          return `${ourScore}-${theirScore} LOSS`;
        } else {
          return `${ourScore}-${theirScore} DRAW`;
        }
      }
    } else if (fixture.status === 'CANCELLED') {
      return 'CANCELLED';
    } else if (fixture.status === 'NO_CONTEST') {
      return 'NO CONTEST';
    }
    return 'SCHEDULED';
  };

  const getStatusColor = () => {
    if (fixture.status === 'COMPLETED') {
      if (fixture.homeScore !== null && fixture.awayScore !== null) {
        const isHome = fixture.type === 'HOME';
        const ourScore = isHome ? fixture.homeScore : fixture.awayScore;
        const theirScore = isHome ? fixture.awayScore : fixture.homeScore;
        
        if (ourScore > theirScore) {
          return 'bg-green-500 text-white';
        } else if (ourScore < theirScore) {
          return 'bg-red-500 text-white';
        } else {
          return 'bg-yellow-500 text-white';
        }
      }
    } else if (fixture.status === 'CANCELLED') {
      return 'bg-gray-500 text-white';
    }
    return 'bg-gray-200 text-gray-700';
  };

  // Function to get opponent logo from database or fallback
  const getOpponentLogo = () => {
    if (oppositionTeam?.logoPath) {
      return oppositionTeam.logoPath;
    }
    
    // Fallback to a generic team icon or Polk logo
    return "/assets/logos/polk-state-logo.jpg";
  };

  // Function to get opponent display info
  const getOpponentDisplay = () => {
    if (oppositionTeam?.logoPath) {
      return (
        <img 
          src={oppositionTeam.logoPath}
          alt={fixture.opponent}
          className="h-8 w-8 object-contain"
        />
      );
    }
    
    // Show team initials if no logo
    const initials = oppositionTeam?.shortName || 
      fixture.opponent.split(' ').map(word => word[0]).join('').slice(0, 3).toUpperCase();
    
    return (
      <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center text-xs font-medium text-gray-600">
        {initials}
      </div>
    );
  };

  return (
    <Card data-testid={`card-fixture-${fixture.id}`} className="border rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between min-h-[80px]">
          {/* Opposition Team Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-gray-200 p-1">
              {getOpponentDisplay()}
            </div>
            
            {/* Main Content */}
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900">{fixture.opponent}</h3>
              <p className="text-sm text-gray-600">
                {format(new Date(fixture.date), 'EEEE, d MMM yyyy, h:mm a')}
              </p>
              {/* Home/Away moved under date/time */}
              <div className="mt-1">
                <Badge variant="outline" className="text-xs">
                  {fixture.type}
                </Badge>
              </div>
            </div>
          </div>

          {/* Right side - Status and Actions */}
          <div className="flex items-center space-x-3">

            {/* Result/Status */}
            <Badge className={`text-xs px-3 py-1 ${getStatusColor()}`}>
              {getResultDisplay()}
            </Badge>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0"
                  data-testid={`button-menu-fixture-${fixture.id}`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => onEdit?.(fixture)}
                  data-testid={`button-edit-fixture-${fixture.id}`}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete?.(fixture)}
                  data-testid={`button-delete-fixture-${fixture.id}`}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
