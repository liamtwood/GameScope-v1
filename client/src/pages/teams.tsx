import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Trophy, Plus, Check, Edit, Trash2, Building2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTeam } from "@/contexts/team-context";
import { useClub } from "@/contexts/club-context";
import { cn } from "@/lib/utils";
import type { Club, Team } from "@shared/schema";

// Form schema for creating teams
const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  shortName: z.string().min(1, "Short name is required").max(10, "Short name must be 10 characters or less"),
  coach: z.string().optional(),
  assistantCoach: z.string().optional(),
  ageGroup: z.string().optional(),
  gender: z.string().optional(),
  season: z.string().default("2025/26"),
  status: z.string().default("ACTIVE"),
});

type CreateTeamFormData = z.infer<typeof createTeamSchema>;

export default function Teams() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedTeam, selectTeam, teams, isLoading: teamsLoading } = useTeam();
  const { selectedClub: currentClub, isLoading: clubsLoading } = useClub();
  
  // Filter teams by current club and group by gender
  const clubTeams = teams
    .filter(team => team.clubId && team.clubId === currentClub?.id)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Group teams by gender
  const teamsByGender = clubTeams.reduce((groups, team) => {
    const gender = team.gender || 'UNSPECIFIED';
    if (!groups[gender]) {
      groups[gender] = [];
    }
    groups[gender].push(team);
    return groups;
  }, {} as Record<string, Team[]>);

  // Define gender display order and labels
  const genderOrder = ['FEMALE', 'MALE', 'MIXED', 'UNSPECIFIED'];
  const genderLabels = {
    'FEMALE': 'Women\'s Teams',
    'MALE': 'Men\'s Teams', 
    'MIXED': 'Mixed Teams',
    'UNSPECIFIED': 'Other Teams'
  };

  // Form setup
  const form = useForm<CreateTeamFormData>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      shortName: "",
      coach: "",
      assistantCoach: "",
      ageGroup: "",
      gender: "",
      season: "2025/26",
      status: "ACTIVE",
    },
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (data: CreateTeamFormData) => {
      const teamData = {
        ...data,
        clubId: currentClub!.id,
      };
      return apiRequest("POST", "/api/teams", teamData);
    },
    onSuccess: (newTeam) => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Success",
        description: "Team created successfully",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create team",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateTeamFormData) => {
    createTeamMutation.mutate(data);
  };

  // Edit form setup
  const editForm = useForm<CreateTeamFormData>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      shortName: "",
      coach: "",
      assistantCoach: "",
      ageGroup: "",
      gender: "",
      season: "2025/26",
      status: "ACTIVE",
    },
  });

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: async (data: { id: string; teamData: CreateTeamFormData }) => {
      return apiRequest("PUT", `/api/teams/${data.id}`, data.teamData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Success",
        description: "Team updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingTeam(null);
      editForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update team",
        variant: "destructive",
      });
    },
  });

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    editForm.reset({
      name: team.name,
      shortName: team.shortName,
      coach: team.coach || "",
      assistantCoach: team.assistantCoach || "",
      ageGroup: team.ageGroup || "",
      gender: team.gender || "",
      season: team.season || "",
      status: team.status || "ACTIVE",
    });
    setIsEditDialogOpen(true);
  };

  const onEditSubmit = (data: CreateTeamFormData) => {
    if (editingTeam) {
      updateTeamMutation.mutate({ id: editingTeam.id, teamData: data });
    }
  };

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


  const handleTeamSelect = (team: Team) => {
    selectTeam(team);
    toast({
      title: "Team Selected",
      description: `${team.name} is now the active team`,
    });
  };

  return (
    <MainLayout 
      title={currentClub ? `${currentClub.name} - Teams` : "Teams"}
      subtitle={currentClub ? `Manage teams for ${currentClub.name}` : "Manage and organize your teams"}
    >
      {/* Teams Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{clubTeams.length === 1 ? 'Team' : 'Teams'} in Club</CardTitle>
              <p className="text-sm text-muted-foreground">Overview of all teams under this club</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-white text-black hover:bg-gray-100 border border-gray-300" data-testid="button-add-team">
                  <Shield className="h-4 w-4 mr-2" />
                  Add Team
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Team</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Team Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Women's Soccer" {...field} data-testid="input-team-name" />
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
                            <FormLabel>Short Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., WSC" maxLength={10} {...field} data-testid="input-team-short-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="coach"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Head Coach</FormLabel>
                            <FormControl>
                              <Input placeholder="Coach name" {...field} data-testid="input-team-coach" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="assistantCoach"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assistant Coach</FormLabel>
                            <FormControl>
                              <Input placeholder="Assistant coach name" {...field} data-testid="input-team-assistant-coach" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-team-gender">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="MALE">Male</SelectItem>
                                <SelectItem value="FEMALE">Female</SelectItem>
                                <SelectItem value="MIXED">Mixed</SelectItem>
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
                              <Input placeholder="e.g., U21" {...field} data-testid="input-team-age-group" />
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
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-team-season">
                                  <SelectValue placeholder="Select season" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="2024/25">2024/25</SelectItem>
                                <SelectItem value="2025/26">2025/26</SelectItem>
                                <SelectItem value="2026/27">2026/27</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                        data-testid="button-cancel-team"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createTeamMutation.isPending}
                        data-testid="button-save-team"
                      >
                        {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {clubTeams.length > 0 ? (
            <div className="space-y-8">
              {genderOrder.map(gender => {
                const teamsInGender = teamsByGender[gender];
                if (!teamsInGender || teamsInGender.length === 0) return null;
                
                return (
                  <div key={gender}>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {genderLabels[gender]}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {teamsInGender.length} {teamsInGender.length === 1 ? 'team' : 'teams'}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {teamsInGender.map((team: Team) => {
                        const isSelected = selectedTeam?.id === team.id;
                        return (
                          <Card 
                            key={team.id} 
                            className={cn(
                              "border-2 cursor-pointer transition-all hover:shadow-md",
                              isSelected 
                                ? "border-primary bg-primary/5 shadow-md" 
                                : "border-border hover:border-primary/50"
                            )}
                            onClick={() => handleTeamSelect(team)}
                            data-testid={`card-team-${team.id}`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h4 className="font-semibold" data-testid={`text-team-name-${team.id}`}>
                                    {team.name}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">{team.shortName}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditTeam(team);
                                    }}
                                    data-testid={`button-edit-team-${team.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  {isSelected && (
                                    <Badge variant="default" className="flex items-center gap-1">
                                      <Check className="h-3 w-3" />
                                      Active
                                    </Badge>
                                  )}
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
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No teams found in this club</p>
              <p className="text-sm text-muted-foreground mt-2">
                Teams will appear here once they are created and linked to this club
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Team Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Women's Soccer" {...field} data-testid="input-edit-team-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="shortName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., WSC" maxLength={10} {...field} data-testid="input-edit-team-short-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="coach"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coach</FormLabel>
                      <FormControl>
                        <Input placeholder="Coach name" {...field} data-testid="input-edit-team-coach" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="assistantCoach"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assistant Coach</FormLabel>
                      <FormControl>
                        <Input placeholder="Assistant coach name" {...field} data-testid="input-edit-team-assistant-coach" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-team-gender">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="MIXED">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="ageGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age Group</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., U21" {...field} data-testid="input-edit-team-age-group" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="season"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Season</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-team-season">
                            <SelectValue placeholder="Select season" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="2024/25">2024/25</SelectItem>
                          <SelectItem value="2025/26">2025/26</SelectItem>
                          <SelectItem value="2026/27">2026/27</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-team-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="INACTIVE">Inactive</SelectItem>
                          <SelectItem value="SUSPENDED">Suspended</SelectItem>
                          <SelectItem value="ARCHIVED">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  data-testid="button-cancel-edit-team"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateTeamMutation.isPending}
                  data-testid="button-save-edit-team"
                >
                  {updateTeamMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}