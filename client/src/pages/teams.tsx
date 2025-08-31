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
import { Shield, Trophy, Plus, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTeam } from "@/contexts/team-context";
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
  season: z.string().optional(),
  status: z.string().default("ACTIVE"),
});

type CreateTeamFormData = z.infer<typeof createTeamSchema>;

export default function Teams() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedTeam, selectTeam, teams, isLoading: teamsLoading } = useTeam();

  // Fetch clubs data
  const { data: clubs = [], isLoading: clubsLoading } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
  });

  const currentClub = clubs[0]; // For now, we're working with the first club

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
      season: "",
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

  const handleTeamSelect = (team: Team) => {
    selectTeam(team);
    toast({
      title: "Team Selected",
      description: `${team.name} is now the active team`,
    });
  };

  return (
    <MainLayout title="Teams" subtitle="Manage and view all teams in your club">
      {/* Teams Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-muted-foreground" />
              <div>
                <CardTitle className="text-xl">Teams in Club</CardTitle>
                <p className="text-sm text-muted-foreground">Overview of all teams under this club</p>
              </div>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-team">
                  <Plus className="h-4 w-4 mr-2" />
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
                            <FormControl>
                              <Input placeholder="e.g., 2025/26" {...field} data-testid="input-team-season" />
                            </FormControl>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clubTeams.map((team: Team) => {
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
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            isSelected ? "bg-primary/20" : "bg-primary/10"
                          )}>
                            <Trophy className={cn(
                              "h-5 w-5",
                              isSelected ? "text-primary" : "text-primary"
                            )} />
                          </div>
                          <div>
                            <h3 className="font-semibold" data-testid={`text-team-name-${team.id}`}>
                              {team.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">{team.shortName}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Active
                          </Badge>
                        )}
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