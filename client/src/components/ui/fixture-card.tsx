import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Video, Home, Plane } from "lucide-react";
import { Fixture } from "@shared/schema";
import { STATUS_COLORS } from "@/lib/constants";
import { format } from "date-fns";

interface FixtureCardProps {
  fixture: Fixture;
  onViewDetails?: (fixture: Fixture) => void;
}

export function FixtureCard({ fixture, onViewDetails }: FixtureCardProps) {
  const getResultDisplay = () => {
    if (fixture.status === 'COMPLETED') {
      if (fixture.homeScore !== null && fixture.awayScore !== null) {
        const isHome = fixture.type === 'HOME';
        const ourScore = isHome ? fixture.homeScore : fixture.awayScore;
        const theirScore = isHome ? fixture.awayScore : fixture.homeScore;
        return `${ourScore}-${theirScore}`;
      }
    } else if (fixture.status === 'NO_CONTEST') {
      return 'NO CONTEST';
    } else if (fixture.status === 'SCHEDULED') {
      return 'VS';
    }
    return 'TBD';
  };

  const getStatusBadge = () => {
    if (fixture.status === 'COMPLETED') {
      if (fixture.homeScore !== null && fixture.awayScore !== null) {
        const isHome = fixture.type === 'HOME';
        const ourScore = isHome ? fixture.homeScore : fixture.awayScore;
        const theirScore = isHome ? fixture.awayScore : fixture.homeScore;
        
        if (ourScore > theirScore) {
          return <Badge className="bg-green-100 text-green-800">WIN {getResultDisplay()}</Badge>;
        } else if (ourScore < theirScore) {
          return <Badge className="bg-red-100 text-red-800">LOSS {getResultDisplay()}</Badge>;
        } else {
          return <Badge className="bg-yellow-100 text-yellow-800">DRAW {getResultDisplay()}</Badge>;
        }
      }
    } else if (fixture.status === 'NO_CONTEST') {
      return <Badge className="bg-gray-100 text-gray-800">NO CONTEST</Badge>;
    } else if (fixture.status === 'SCHEDULED') {
      return <Badge className="bg-blue-100 text-blue-800">UPCOMING</Badge>;
    }
    return <Badge className={STATUS_COLORS[fixture.status]}>{fixture.status}</Badge>;
  };

  return (
    <Card data-testid={`card-fixture-${fixture.id}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                {format(new Date(fixture.date), 'MMM').toUpperCase()}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {format(new Date(fixture.date), 'd')}
              </p>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="font-semibold text-foreground">Polk State College</p>
                <p className="text-sm text-muted-foreground">Women's Soccer</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="font-bold text-primary">PSC</span>
                </div>
                
                <div className="text-center px-3 py-1 rounded-lg bg-muted">
                  <span className="font-medium text-foreground">{getResultDisplay()}</span>
                </div>
                
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="font-bold text-gray-600">
                    {fixture.opponent.split(' ').map(word => word[0]).join('').slice(0, 3)}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="font-semibold text-foreground">{fixture.opponent}</p>
                <p className="text-sm text-muted-foreground">Away Team</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-1">
                {getStatusBadge()}
              </div>
              <p className="text-sm font-medium text-foreground">
                {format(new Date(fixture.date), 'h:mm a')}
              </p>
              <p className="text-xs text-muted-foreground">
                {fixture.type === 'HOME' ? <Home className="inline w-3 h-3 mr-1" /> : <Plane className="inline w-3 h-3 mr-1" />}
                {fixture.type} • {fixture.competition}
              </p>
              {fixture.hasVideo && (
                <div className="flex items-center space-x-1 mt-1">
                  <Video className="w-3 h-3 text-blue-600" />
                  <span className="text-xs text-blue-600">Video Available</span>
                </div>
              )}
              {fixture.notes && (
                <p className="text-xs text-yellow-600 mt-1">{fixture.notes}</p>
              )}
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onViewDetails?.(fixture)}
              data-testid={`button-view-fixture-${fixture.id}`}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
