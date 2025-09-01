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
    // Navigate to teams page for the selected club
    setLocation(`/teams?clubId=${club.id}`);
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
        {/* Club Selection */}
        <div className="max-w-6xl mx-auto">

          {clubs && clubs.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 justify-center">
              {clubs.map((club) => (
                <div 
                  key={club.id} 
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => handleClubSelect(club)}
                  data-testid={`card-club-${club.id}`}
                >
                  <div className="w-32 h-32 mb-4 rounded-full bg-background border-4 border-border group-hover:border-primary/50 transition-all duration-200 flex items-center justify-center overflow-hidden group-hover:scale-105">
                    {club.logoPath ? (
                      <img 
                        src={club.logoPath}
                        alt={`${club.name} Logo`}
                        className="w-24 h-24 object-contain"
                      />
                    ) : (
                      <Building2 className="h-16 w-16 text-muted-foreground" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-center group-hover:text-primary transition-colors">
                    {club.name}
                  </h3>
                </div>
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