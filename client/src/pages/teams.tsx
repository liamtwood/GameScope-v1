import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
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

// Team card statistics type
type TeamCardStats = {
  players: number;
  matches: number;
  processing: number;
};

// Hook to fetch team card statistics
const useTeamCardStats = (teamId: string) => {
  return useQuery<TeamCardStats>({
    queryKey: ["/api/teams", teamId, "card-stats"],
    enabled: !!teamId,
  });
};

// Team statistics display component
const TeamStatsDisplay = ({ teamId }: { teamId: string }) => {
  const { data: stats, isLoading } = useTeamCardStats(teamId);
  const { selectedClub } = useClub();
  const clubPrimaryColor = (selectedClub?.colors as any)?.primary || '#dc2626';
  
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center">
            <div className="h-6 w-8 bg-gray-200 rounded animate-pulse mb-1"></div>
            <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-6 w-8 bg-gray-200 rounded animate-pulse mb-1"></div>
            <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-6 w-8 bg-gray-200 rounded animate-pulse mb-1"></div>
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="w-full">
      {/* Grid layout for perfect alignment - full width centered */}
      <div className="grid grid-cols-3 gap-4 text-center">
        {/* Column 1: Players */}
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-foreground" data-testid={`text-team-players-${teamId}`}>
            {stats.players}
          </span>
          <span className="text-xs font-medium mt-1 text-muted-foreground">Players</span>
        </div>
        
        {/* Column 2: Matches */}
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-foreground" data-testid={`text-team-matches-${teamId}`}>
            {stats.matches}
          </span>
          <span className="text-xs font-medium mt-1 text-muted-foreground">Matches</span>
        </div>
        
        {/* Column 3: Processing */}
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-foreground" data-testid={`text-team-processing-${teamId}`}>
            {stats.processing}
          </span>
          <span className="text-xs font-medium mt-1 text-muted-foreground">Processing</span>
        </div>
      </div>
    </div>
  );
};

export default function Teams() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedTeam, selectTeam, teams, isLoading: teamsLoading } = useTeam();
  const { selectedClub: currentClub, isLoading: clubsLoading } = useClub();
  
  // Get club primary color for styling
  const clubPrimaryColor = (currentClub?.colors as any)?.primary || '#dc2626';
  
  // Filter teams by current club and group by gender
  console.log('Teams Page Debug:', {
    currentClubId: currentClub?.id,
    currentClubName: currentClub?.name,
    allTeams: teams.map(t => ({ 
      name: t.name, 
      clubId: t.clubId, 
      gender: t.gender,
      status: t.status 
    })),
    filteredTeams: teams.filter(team => team.clubId && team.clubId === currentClub?.id).map(t => ({
      name: t.name,
      gender: t.gender,
      status: t.status
    }))
  });
  
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
  const genderOrder = ['FEMALE', 'MALE', 'MIXED', 'UNSPECIFIED'] as const;
  const genderLabels: Record<string, string> = {
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
      <div>
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1"></div>
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
        </div>
        <div>
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
                            <CardContent className="p-6">
                              {/* Header with Age Group Circle, Team Info, and Edit Button */}
                              <div className="flex items-start justify-between mb-4">
                                {/* Left side - Large Age Group Circle */}
                                <div className="flex items-start space-x-4">
                                  <div 
                                    className="h-16 w-16 rounded-full flex items-center justify-center text-lg font-bold text-white"
                                    style={{ backgroundColor: clubPrimaryColor }}
                                  >
                                    {team.ageGroup || team.name.substring(0, 3).toUpperCase()}
                                  </div>
                                  
                                  {/* Team Information */}
                                  <div className="flex-1">
                                    <h4 
                                      className="text-xl font-bold mb-2" 
                                      style={{ color: clubPrimaryColor }}
                                      data-testid={`text-team-name-${team.id}`}
                                    >
                                      {team.name}
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-1">
                                      Coach: {team.coach || 'Not assigned'}
                                    </p>
                                    <Badge 
                                      className={team.status === 'ACTIVE' ? 'bg-green-500 text-white text-xs px-2 py-1' : 'bg-gray-500 text-white text-xs px-2 py-1'}
                                      data-testid={`text-team-status-${team.id}`}
                                    >
                                      {team.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </div>
                                </div>
                                
                                {/* Right side - Edit button */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditTeam(team);
                                  }}
                                  data-testid={`button-edit-team-${team.id}`}
                                  className="p-1 h-8 w-8"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              {/* Team Statistics - Full Width Centered */}
                              <TeamStatsDisplay teamId={team.id} />
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
        </div>
      </div>

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