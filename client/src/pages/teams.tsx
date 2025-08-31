import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Trophy } from "lucide-react";
import type { Club, Team } from "@shared/schema";

export default function Teams() {
  // Fetch clubs data
  const { data: clubs = [], isLoading: clubsLoading } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
  });

  // Fetch teams data
  const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const currentClub = clubs[0]; // For now, we're working with the first club

  if (clubsLoading || teamsLoading) {
    return (
      <MainLayout title="Teams" subtitle="Manage and view all teams in your club">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading teams...</p>
        </div>
      </MainLayout>
    );
  }

  if (!currentClub) {
    return (
      <MainLayout title="Teams" subtitle="Manage and view all teams in your club">
        <div className="text-center py-8">
          <p className="text-muted-foreground">No club found. Please contact support.</p>
        </div>
      </MainLayout>
    );
  }

  const clubTeams = teams.filter((team) => team.clubId === currentClub?.id);

  return (
    <MainLayout title="Teams" subtitle="Manage and view all teams in your club">
      {/* Teams Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-muted-foreground" />
            <div>
              <CardTitle className="text-xl">Teams in Club</CardTitle>
              <p className="text-sm text-muted-foreground">Overview of all teams under this club</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {clubTeams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clubTeams.map((team: Team) => (
                <Card key={team.id} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold" data-testid={`text-team-name-${team.id}`}>
                          {team.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{team.shortName}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Coach:</span>
                        <span data-testid={`text-team-coach-${team.id}`}>{team.coach || "Not assigned"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Season:</span>
                        <span data-testid={`text-team-season-${team.id}`}>{team.season || "Not set"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span 
                          className={`font-medium ${team.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-600'}`}
                          data-testid={`text-team-status-${team.id}`}
                        >
                          {team.status}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No teams found in this club</p>
              <p className="text-sm text-muted-foreground mt-2">
                Teams will appear here once they are created and linked to this club
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}