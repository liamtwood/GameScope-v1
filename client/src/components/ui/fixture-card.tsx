import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Fixture } from "@shared/schema";
import { format } from "date-fns";
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

  return (
    <Card data-testid={`card-fixture-${fixture.id}`} className="border rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Team Logo/Badge */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-gray-200 p-1">
              <img 
                src="/assets/logos/polk-state-logo.jpg" 
                alt="Polk State College" 
                className="h-8 w-8 object-contain"
              />
            </div>
            
            {/* Main Content */}
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900">{fixture.opponent}</h3>
              <p className="text-sm text-gray-600">
                {format(new Date(fixture.date), 'EEEE, d MMM yyyy, h:mm a')}
              </p>
            </div>
          </div>

          {/* Right side - Status and Actions */}
          <div className="flex items-center space-x-3">
            {/* Home/Away Badge */}
            <Badge variant="outline" className="text-xs">
              {fixture.type}
            </Badge>

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
