import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Player, Team, PlayerTeam } from "@shared/schema";
import { ArrowLeft, Star, Users, Plus } from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { useTeam } from "@/contexts/team-context";
import { useClub } from "@/contexts/club-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PlayerReadOnlyViewProps {
  player: Player;
  onBack: () => void;
}

export function PlayerReadOnlyView({ player, onBack }: PlayerReadOnlyViewProps) {
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [squadNumber, setSquadNumber] = useState<number | undefined>(undefined);
  const [position, setPosition] = useState<string>("");
  const { teams } = useTeam();
  const { selectedClub } = useClub();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all teams for this player
  const { data: playerTeams = [] } = useQuery<(PlayerTeam & { team: Team })[]>({
    queryKey: ["/api/player", player.id, "teams"],
    enabled: !!player.id
  });

  // Get primary team (for backwards compatibility)
  const primaryTeam = playerTeams.find(pt => pt.isPrimary)?.team || playerTeams[0]?.team;

  const calculateAge = (dateOfBirth: string | Date | null) => {
    if (!dateOfBirth) return null;
    return differenceInYears(new Date(), new Date(dateOfBirth));
  };

  const age = calculateAge(player.dateOfBirth);

  // Mutation to add player to a new team
  const addPlayerToTeamMutation = useMutation({
    mutationFn: async ({ teamId, isPrimary, squadNumber, position }: {
      teamId: string;
      isPrimary: boolean;
      squadNumber?: number;
      position?: string;
    }) => {
      const response = await fetch(`/api/player/${player.id}/teams`, {
        method: 'POST',
        body: JSON.stringify({ teamId, isPrimary, squadNumber, position }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to add player to team');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player", player.id, "teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: "Team Added",
        description: "Player has been successfully added to the team.",
      });
      setIsTeamDialogOpen(false);
      setSelectedTeamId("");
      setSquadNumber(undefined);
      setPosition("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add player to team. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to remove player from team
  const removePlayerFromTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const response = await fetch(`/api/player/${player.id}/teams/${teamId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to remove player from team');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player", player.id, "teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: "Team Removed",
        description: "Player has been successfully removed from the team.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove player from team. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddTeam = () => {
    if (selectedTeamId && !playerTeams.some(pt => pt.teamId === selectedTeamId)) {
      addPlayerToTeamMutation.mutate({
        teamId: selectedTeamId,
        isPrimary: playerTeams.length === 0,
        squadNumber,
        position: position || undefined
      });
    }
  };

  const handleRemoveTeam = (teamId: string) => {
    removePlayerFromTeamMutation.mutate(teamId);
  };

  const getAvailableTeams = () => {
    // Filter teams to only those in the current club and not already assigned to player
    return teams.filter(team => 
      team.clubId === selectedClub?.id && 
      !playerTeams.some(pt => pt.teamId === team.id)
    );
  };

  const getStatusColor = () => {
    switch (player.status) {
      case 'Fit':
        return 'bg-green-500 text-white';
      case 'Injured':
        return 'bg-red-500 text-white';
      case 'Retired':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getAccountStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Suspended": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "Retired": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default: return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"; // Draft
    }
  };

  const getPositionCategory = (position: string): string => {
    if (position.includes('GK') || position.includes('Goalkeeper')) return 'GK';
    if (position.includes('CB') || position.includes('LB') || position.includes('RB') || 
        position.includes('LWB') || position.includes('RWB') || position.includes('Defense')) return 'DEF';
    if (position.includes('CM') || position.includes('CDM') || position.includes('CAM') || 
        position.includes('LM') || position.includes('RM') || position.includes('Midfield')) return 'MID';
    if (position.includes('ST') || position.includes('CF') || position.includes('LW') || 
        position.includes('RW') || position.includes('Forward')) return 'FWD';
    return position;
  };

  const getPositionColor = () => {
    const positionCategory = getPositionCategory(player.position);
    switch (positionCategory) {
      case 'GK':
        return 'bg-purple-100 text-purple-800';
      case 'DEF':
        return 'bg-blue-100 text-blue-800';
      case 'MID':
        return 'bg-green-100 text-green-800';
      case 'FWD':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6" data-testid={`player-read-only-view-${player.id}`}>
      {/* Player Header Card */}
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {/* Player Info */}
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold">
                {player.jerseyNumber}
              </div>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-foreground" data-testid={`text-player-name-${player.id}`}>
                    {player.firstName} {player.lastName}
                  </h1>
                  {player.keyPlayer && (
                    <Star className="h-6 w-6 text-orange-500 fill-orange-500" />
                  )}
                </div>
                <div className="flex items-center space-x-3 mt-2">
                  <Badge 
                    className={`text-sm px-3 py-1 ${getPositionColor()}`}
                    data-testid={`badge-position-${player.id}`}
                  >
                    {player.position}
                  </Badge>
                  <Badge 
                    className={`text-sm px-3 py-1 ${getStatusColor()}`}
                    data-testid={`badge-status-${player.id}`}
                  >
                    {player.status || 'Fit'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Player Details Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="player" className="w-full">
            {/* Back Button and Tabs on same row */}
            <div className="flex items-center justify-between gap-4 p-4 border-b">
              <Button 
                variant="ghost" 
                onClick={onBack}
                data-testid="button-back-to-cards"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Player Cards
              </Button>
              
              <TabsList className="grid grid-cols-3 w-auto">
                <TabsTrigger value="player" data-testid="tab-player">Player Details</TabsTrigger>
                <TabsTrigger value="account" data-testid="tab-account">Account</TabsTrigger>
                <TabsTrigger value="teams" data-testid="tab-teams">Teams</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="player" className="p-6 mt-0">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Player Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Jersey Number</label>
                      <p className="text-lg" data-testid={`text-jersey-number-${player.id}`}>{player.jerseyNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Position</label>
                      <p className="text-lg" data-testid={`text-position-${player.id}`}>{player.position}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Player Status</label>
                      <p className="text-lg" data-testid={`text-player-status-${player.id}`}>{player.status || 'Fit'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Key Player</label>
                      <p className="text-lg" data-testid={`text-key-player-${player.id}`}>
                        {player.keyPlayer ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="account" className="p-6 mt-0">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Account Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                      <p className="text-lg" data-testid={`text-email-${player.id}`}>
                        {player.email || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Gender</label>
                      <p className="text-lg" data-testid={`text-gender-${player.id}`}>
                        {player.gender || "Not set"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                      <p className="text-lg" data-testid={`text-date-of-birth-${player.id}`}>
                        {player.dateOfBirth 
                          ? `${format(new Date(player.dateOfBirth), "d MMM yyyy")} (Age: ${age})`
                          : "Not provided"
                        }
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Account Status</label>
                      <div>
                        <Badge 
                          className={`text-sm px-3 py-1 ${getAccountStatusColor(player.accountStatus || "Draft")}`}
                          data-testid={`badge-account-status-${player.id}`}
                        >
                          {player.accountStatus || "Draft"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="teams" className="p-6 mt-0">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Team Assignments</h3>
                  {getAvailableTeams().length > 0 && (
                    <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          data-testid="button-add-team"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Team
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add to Team</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Select Team</label>
                            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                              <SelectTrigger data-testid="select-team">
                                <SelectValue placeholder="Choose a team" />
                              </SelectTrigger>
                              <SelectContent>
                                {getAvailableTeams().map((team) => (
                                  <SelectItem key={team.id} value={team.id} data-testid={`option-team-${team.id}`}>
                                    {team.name} ({team.shortName})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Squad Number</label>
                              <Input
                                type="number"
                                placeholder="e.g. 1"
                                value={squadNumber || ""}
                                onChange={(e) => setSquadNumber(e.target.value ? parseInt(e.target.value) : undefined)}
                                data-testid="input-squad-number"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Position</label>
                              <Select value={position} onValueChange={setPosition}>
                                <SelectTrigger data-testid="select-position">
                                  <SelectValue placeholder="Select position" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Goalkeeper">Goalkeeper</SelectItem>
                                  <SelectItem value="Defender">Defender</SelectItem>
                                  <SelectItem value="Midfielder">Midfielder</SelectItem>
                                  <SelectItem value="Forward">Forward</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              onClick={() => setIsTeamDialogOpen(false)}
                              data-testid="button-cancel-team"
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleAddTeam}
                              disabled={!selectedTeamId || addPlayerToTeamMutation.isPending}
                              data-testid="button-add-to-team"
                            >
                              {addPlayerToTeamMutation.isPending ? "Adding..." : "Add to Team"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {/* Team Cards */}
                <div className="space-y-3">
                  {playerTeams.length > 0 ? (
                    playerTeams.map((playerTeam) => (
                      <Card 
                        key={playerTeam.id} 
                        className={`border-2 ${playerTeam.isPrimary ? 'border-primary' : ''}`} 
                        data-testid={`card-team-${playerTeam.team.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="h-12 w-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-lg font-bold">
                                #{playerTeam.squadNumber || '?'}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="text-lg font-semibold" data-testid={`text-team-name-${playerTeam.team.id}`}>
                                    {playerTeam.team.name}
                                  </h4>
                                  {playerTeam.isPrimary && (
                                    <Badge variant="default" data-testid={`badge-primary-team-${playerTeam.team.id}`}>
                                      Primary
                                    </Badge>
                                  )}
                                  <Badge 
                                    className={playerTeam.team.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                                    data-testid={`badge-team-status-${playerTeam.team.id}`}
                                  >
                                    {playerTeam.team.status}
                                  </Badge>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-3">
                                    <div className="text-2xl font-bold text-primary" data-testid={`text-squad-number-${playerTeam.team.id}`}>
                                      #{playerTeam.squadNumber || '?'}
                                    </div>
                                    <div className="text-lg font-semibold text-gray-900" data-testid={`text-position-${playerTeam.team.id}`}>
                                      {playerTeam.position || 'Position not set'}
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted-foreground" data-testid={`text-joined-date-${playerTeam.team.id}`}>
                                    Joined: {playerTeam.joinedAt ? format(new Date(playerTeam.joinedAt), "d MMM yyyy") : 'Unknown'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveTeam(playerTeam.team.id)}
                              disabled={removePlayerFromTeamMutation.isPending}
                              data-testid={`button-remove-team-${playerTeam.team.id}`}
                            >
                              Remove
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="border-dashed border-2 border-gray-300">
                      <CardContent className="p-6 text-center">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No teams assigned</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Use the "Add Team" button to assign this player to a team.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}