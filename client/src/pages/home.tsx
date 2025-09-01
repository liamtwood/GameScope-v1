import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight, Users, Trophy } from "lucide-react";
import { Club } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();

  const { data: clubs, isLoading } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
  });

  const handleClubSelect = (club: Club) => {
    // Navigate to club management page for the selected club
    setLocation(`/club-management?clubId=${club.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground">Loading clubs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold text-foreground">GameScope</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive sports team management for soccer clubs. 
            Choose your club to get started managing teams, fixtures, and performance analytics.
          </p>
        </div>

        {/* Club Selection */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-8">
            <Building2 className="h-6 w-6 text-primary mr-2" />
            <h2 className="text-2xl font-semibold text-foreground">Select Your Club</h2>
          </div>

          {clubs && clubs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clubs.map((club) => (
                <Card 
                  key={club.id} 
                  className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/50"
                  onClick={() => handleClubSelect(club)}
                  data-testid={`card-club-${club.id}`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <span className="text-lg">{club.name}</span>
                      </div>
                      <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                        {club.shortName}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Owner: {club.owner}</span>
                      </div>
                      
                      {club.city && (
                        <div className="text-sm text-muted-foreground">
                          📍 {club.city}
                        </div>
                      )}
                      
                      {club.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {club.description}
                        </p>
                      )}
                      
                      <div className="pt-4">
                        <Button 
                          className="w-full" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClubSelect(club);
                          }}
                          data-testid={`button-select-club-${club.id}`}
                        >
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Enter Club
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-4">No Clubs Available</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                It looks like there are no clubs set up yet. You'll need to create a club first to get started.
              </p>
              <Button 
                onClick={() => setLocation('/clubs')}
                data-testid="button-create-first-club"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Create Your First Club
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            GameScope - Professional sports team management system
          </p>
        </div>
      </div>
    </div>
  );
}