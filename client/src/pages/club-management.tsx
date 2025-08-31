import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Pencil, Building2, Users, Trophy } from "lucide-react";
import type { Club, Team } from "@shared/schema";

export default function ClubManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<{ name: string; owner: string }>({
    name: "",
    owner: "",
  });

  // Fetch clubs
  const { data: clubs = [], isLoading: clubsLoading } = useQuery({
    queryKey: ["/api/clubs"],
  });

  // Fetch teams for the club
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ["/api/teams"],
  });

  const currentClub = clubs[0]; // For now, we're working with the first club

  // Update club mutation
  const updateClubMutation = useMutation({
    mutationFn: async (data: { name: string; owner: string }) => {
      return apiRequest("PATCH", `/api/clubs/${currentClub.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Club updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update club",
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    if (currentClub) {
      setEditForm({
        name: currentClub.name,
        owner: currentClub.owner,
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateClubMutation.mutate(editForm);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({ name: "", owner: "" });
  };

  if (clubsLoading || teamsLoading) {
    return (
      <MainLayout title="Club Management" subtitle="Manage your club information and teams">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading club information...</p>
        </div>
      </MainLayout>
    );
  }

  if (!currentClub) {
    return (
      <MainLayout title="Club Management" subtitle="Manage your club information and teams">
        <div className="text-center py-8">
          <p className="text-muted-foreground">No club found. Please contact support.</p>
        </div>
      </MainLayout>
    );
  }

  const clubTeams = teams.filter((team: Team) => team.clubId === currentClub.id);

  return (
    <MainLayout title="Club Management" subtitle="Manage your club information and teams">
      {/* Club Information Card */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl">Club Information</CardTitle>
              <p className="text-sm text-muted-foreground">Basic club details and settings</p>
            </div>
          </div>
          {!isEditing && (
            <Button
              onClick={handleEdit}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              data-testid="button-edit-club"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="club-name">Club Name</Label>
                <Input
                  id="club-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  data-testid="input-club-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="club-owner">Club Owner</Label>
                <Input
                  id="club-owner"
                  value={editForm.owner}
                  onChange={(e) => setEditForm({ ...editForm, owner: e.target.value })}
                  data-testid="input-club-owner"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={updateClubMutation.isPending}
                  data-testid="button-save-club"
                >
                  {updateClubMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  data-testid="button-cancel-club"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Club Name</Label>
                <p className="text-lg font-semibold" data-testid="text-club-name">
                  {currentClub.name}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Owner</Label>
                <p className="text-lg font-semibold" data-testid="text-club-owner">
                  {currentClub.owner}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teams Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
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