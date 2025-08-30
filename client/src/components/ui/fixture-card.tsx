import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, MoreHorizontal, Video, ChartSpline } from "lucide-react";
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
  onViewAnalysis?: (fixture: Fixture) => void;
  showAnimatedBorder?: boolean;
}

export function FixtureCard({ fixture, onViewDetails, onEdit, onDelete, onViewAnalysis, showAnimatedBorder = false }: FixtureCardProps) {
  // Fetch opposition teams to get logo information
  const { data: oppositionTeams = [] } = useQuery<OppositionTeam[]>({
    queryKey: ["/api/opposition-teams"],
  });

  // Find the opposition team for this fixture
  const oppositionTeam = oppositionTeams.find(team => team.name === fixture.opponent);

  const getResultDisplay = () => {
    if (fixture.status === 'COMPLETED' || fixture.status === 'NO_CONTEST') {
      if (fixture.homeScore !== null && fixture.awayScore !== null) {
        const isHome = fixture.type === 'HOME';
        const ourScore = isHome ? fixture.homeScore : fixture.awayScore;
        const theirScore = isHome ? fixture.awayScore : fixture.homeScore;
        
        if (fixture.status === 'NO_CONTEST') {
          return `${ourScore}-${theirScore} NO CONTEST`;
        } else if (ourScore > theirScore) {
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
    if (fixture.status === 'COMPLETED' || fixture.status === 'NO_CONTEST') {
      if (fixture.homeScore !== null && fixture.awayScore !== null) {
        const isHome = fixture.type === 'HOME';
        const ourScore = isHome ? fixture.homeScore : fixture.awayScore;
        const theirScore = isHome ? fixture.awayScore : fixture.homeScore;
        
        if (fixture.status === 'NO_CONTEST') {
          return 'bg-orange-500 text-white';
        } else if (ourScore > theirScore) {
          return 'bg-green-500 text-white';
        } else if (ourScore < theirScore) {
          return 'bg-red-500 text-white';
        } else {
          return 'bg-yellow-500 text-white';
        }
      }
      return fixture.status === 'NO_CONTEST' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white';
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
          className="h-16 w-16 object-contain"
        />
      );
    }
    
    // Show team initials if no logo
    const initials = oppositionTeam?.shortName || 
      fixture.opponent.split(' ').map(word => word[0]).join('').slice(0, 3).toUpperCase();
    
    return (
      <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center text-sm font-medium text-gray-600">
        {initials}
      </div>
    );
  };

  return (
    <Card 
      data-testid={`card-fixture-${fixture.id}`} 
      className={`border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
        showAnimatedBorder ? 'relative overflow-hidden group' : ''
      }`}
      onClick={() => onViewDetails?.(fixture)}
    >
      {showAnimatedBorder && (
        <div className="absolute inset-0 rounded-lg border-2 border-red-500 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity pointer-events-none" />
      )}
      <CardContent className="p-4">
        <div className="flex items-center justify-between min-h-[80px]">
          {/* Opposition Team Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-24 h-24 flex items-center justify-center">
              {getOpponentDisplay()}
            </div>
            
            {/* Main Content */}
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-foreground">{fixture.opponent}</h3>
              <p className="text-sm text-muted-foreground">
                {format(new Date(fixture.date), 'EEEE, d MMM yyyy, h:mm a')}
              </p>
              {/* Competition display under date/time */}
              {fixture.competition && (
                <p className="text-xs text-muted-foreground mt-1">
                  {fixture.competition}
                </p>
              )}
              {/* Home/Away moved under competition */}
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
            
            {/* Video Indicator */}
            {fixture.hasVideo && (
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full" title="Videos available">
                <Video className="h-4 w-4 text-blue-600" />
              </div>
            )}

            {/* Analysis Icon */}
            {fixture.status === 'COMPLETED' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="View GameScope Analysis"
                data-testid={`button-analysis-fixture-${fixture.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onViewAnalysis?.(fixture);
                }}
              >
                <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                  <ChartSpline className="h-4 w-4 text-red-600" />
                </div>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
