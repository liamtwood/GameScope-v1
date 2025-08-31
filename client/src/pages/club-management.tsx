import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Users, Trophy, Calendar, Edit, Shield, ArrowLeft, Plus, User, MapPin, Phone, Mail, Globe, Settings } from "lucide-react";
import { useTeam } from "@/contexts/team-context";
import type { Club, Team } from "@shared/schema";
import { insertTeamSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

const createTeamSchema = insertTeamSchema.extend({
  name: z.string().min(1, "Team name is required"),
});

type CreateTeamFormData = z.infer<typeof createTeamSchema>;

export default function ClubManagement() {
  const [, setLocation] = useLocation();
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false);
  const { toast } = useToast();
  const { selectTeam } = useTeam();

  // Get club ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const clubId = urlParams.get("clubId");

  // Fetch clubs to get selected club details
  const { data: clubs = [], isLoading: clubsLoading } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
  });

  // Fetch teams for the selected club
  const { data: allTeams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const selectedClub = clubs.find(club => club.id === clubId) || clubs[0];
  const clubTeams = allTeams.filter(team => team.clubId === selectedClub?.id);

  const form = useForm<CreateTeamFormData>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      shortName: "",
      clubId: selectedClub?.id || "",
      status: "ACTIVE",
      coach: "",
      assistantCoach: "",
      ageGroup: "",
      gender: "",
      season: "2025/26",
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: async (teamData: CreateTeamFormData) => {
      return apiRequest("POST", "/api/teams", { ...teamData, clubId: selectedClub?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setIsCreateTeamDialogOpen(false);
      form.reset();
      toast({
        title: "Team Created",
        description: "New team has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create team.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateTeamFormData) => {
    createTeamMutation.mutate(data);
  };

  const handleTeamSelect = (team: Team) => {
    selectTeam(team);
    setLocation("/");
  };

  if (clubsLoading || teamsLoading) {
    return (
      <MainLayout title="Club Management" subtitle="Manage club information and teams">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading club information...</div>
        </div>
      </MainLayout>
    );
  }

  if (!selectedClub) {
    return (
      <MainLayout title="Club Management" subtitle="Manage club information and teams">
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No club selected</h3>
          <p className="text-muted-foreground mb-4">
            Please select a club to manage.
          </p>
          <Button onClick={() => setLocation("/clubs")} data-testid="button-back-to-clubs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clubs
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title={`${selectedClub.name} Management`} 
      subtitle="Manage club information and teams"
    >
      {/* Back Navigation */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => setLocation("/clubs")}
          data-testid="button-back-to-clubs"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clubs
        </Button>
      </div>

      {/* Club Information Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span>{selectedClub.name}</span>
            <Badge variant="secondary">{selectedClub.shortName}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Contact</h4>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Owner: {selectedClub.owner}</span>
              </div>
              {selectedClub.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedClub.phone}</span>
                </div>
              )}
              {selectedClub.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedClub.email}</span>
                </div>
              )}
              {selectedClub.website && (
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedClub.website}</span>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Location</h4>
              {selectedClub.address && (
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div>{selectedClub.address}</div>
                    {selectedClub.city && <div>{selectedClub.city}{selectedClub.state && `, ${selectedClub.state}`}</div>}
                    {selectedClub.country && <div>{selectedClub.country}</div>}
                  </div>
                </div>
              )}
              {selectedClub.established && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Est. {selectedClub.established}</span>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Club Info</h4>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{clubTeams.length} teams</span>
              </div>
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {selectedClub.subscriptionTier || 'Basic'} • {selectedClub.subscriptionStatus || 'Active'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Created: {selectedClub.createdAt ? new Date(selectedClub.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          {selectedClub.description && (
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{selectedClub.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teams Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-semibold">Teams</h2>
          </div>
          <Dialog open={isCreateTeamDialogOpen} onOpenChange={setIsCreateTeamDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-team">
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter team name"
                            data-testid="input-team-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="shortName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., WSC"
                            data-testid="input-team-short-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-team-gender">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Men">Men</SelectItem>
                              <SelectItem value="Women">Women</SelectItem>
                              <SelectItem value="Mixed">Mixed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ageGroup"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age Group</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., U21, Senior"
                              data-testid="input-team-age-group"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="coach"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coach</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter coach name"
                            data-testid="input-team-coach"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="season"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Season</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 2025/26"
                            data-testid="input-team-season"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateTeamDialogOpen(false)}
                      data-testid="button-cancel-team"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createTeamMutation.isPending}
                      data-testid="button-submit-team"
                    >
                      {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubTeams.map((team) => (
            <Card key={team.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <span>{team.name}</span>
                  </div>
                  <Badge variant="outline">{team.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium bg-secondary px-2 py-1 rounded text-xs">
                      {team.shortName}
                    </span>
                    <span className="text-muted-foreground">{team.season}</span>
                  </div>
                  {team.coach && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Coach: </span>
                      <span className="font-medium">{team.coach}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{team.gender}</span>
                    <span>{team.ageGroup}</span>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleTeamSelect(team)}
                      data-testid={`button-select-team-${team.id}`}
                    >
                      Select & Manage Team
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {clubTeams.length === 0 && (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No teams found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first team for {selectedClub.name}.
            </p>
            <Dialog open={isCreateTeamDialogOpen} onOpenChange={setIsCreateTeamDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-first-team">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Team
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        )}
      </div>
    </MainLayout>
  );
}