import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowRight, Users, Star, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useClubTheme } from "@/hooks/use-club-theme";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber?: number | null;
  position?: string;
  starPlayer?: boolean;
}

interface Team {
  id: string;
  name: string;
  shortName?: string;
  clubId: string;
}

interface PlayerTransferDialogProps {
  children: React.ReactNode;
  currentTeamId: string;
  clubId: string;
  onTransferComplete?: () => void;
}

type TransferMode = "out" | "in";

export function PlayerTransferDialog({ 
  children, 
  currentTeamId, 
  clubId, 
  onTransferComplete 
}: PlayerTransferDialogProps) {
  const [open, setOpen] = useState(false);
  const [transferMode, setTransferMode] = useState<TransferMode>("in");
  const [selectedSourceTeamId, setSelectedSourceTeamId] = useState<string>("");
  const [selectedTargetTeamId, setSelectedTargetTeamId] = useState<string>("");
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [keepOnBothTeams, setKeepOnBothTeams] = useState<boolean | null>(null);
  const { toast } = useToast();
  const { clubPrimary } = useClubTheme();

  // Fetch teams in the same club (excluding current team)
  const { data: allTeams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    enabled: open && !!clubId,
  });

  const clubTeams = allTeams.filter(team => 
    team.clubId === clubId && team.id !== currentTeamId
  );

  // Determine source and target team IDs based on mode
  const actualSourceTeamId = transferMode === "out" ? currentTeamId : selectedSourceTeamId;
  const actualTargetTeamId = transferMode === "out" ? selectedTargetTeamId : currentTeamId;
  
  // Check if selecting players from "not in any team"
  const isNoTeamSource = transferMode === "in" && selectedSourceTeamId === "NO_TEAM";

  // Fetch source team's players or club players without teams
  const { data: sourceTeamPlayers = [] } = useQuery<any[]>({
    queryKey: isNoTeamSource 
      ? ["/api/club", clubId, "users", "unassigned"] 
      : ["/api/team", actualSourceTeamId, "users"],
    enabled: open && (!!actualSourceTeamId || isNoTeamSource),
    queryFn: async () => {
      if (isNoTeamSource) {
        // Fetch all club users and filter out those already in teams
        const allClubUsersResponse = await fetch(`/api/club/${clubId}/users?role=Player`);
        const allClubUsers = await allClubUsersResponse.json();
        
        // Get all teams in club and their users to filter out assigned players
        const allTeamsResponse = await fetch("/api/teams");
        const allTeams = await allTeamsResponse.json();
        const clubTeamIds = allTeams.filter((team: any) => team.clubId === clubId).map((team: any) => team.id);
        
        // Get all users assigned to any team in this club
        const assignedUserIds = new Set();
        for (const teamId of clubTeamIds) {
          const teamUsersResponse = await fetch(`/api/team/${teamId}/users`);
          const teamUsers = await teamUsersResponse.json();
          teamUsers.forEach((tu: any) => assignedUserIds.add(tu.user.id));
        }
        
        // Filter out assigned users and return unassigned ones in the expected format
        return allClubUsers
          .filter((user: any) => !assignedUserIds.has(user.id))
          .map((user: any) => ({
            user: user,
            jerseyNumber: null,
            position: "Unassigned",
            starPlayer: false,
            fitnessStatus: "Fit"
          }));
      } else {
        // Regular team users fetch
        const response = await fetch(`/api/team/${actualSourceTeamId}/users`);
        return await response.json();
      }
    },
  });

  // Convert to player format and sort by jersey number
  const sortByJersey = (a: Player, b: Player) => {
    if (a.jerseyNumber == null && b.jerseyNumber == null) return 0;
    if (a.jerseyNumber == null) return 1;
    if (b.jerseyNumber == null) return -1;
    return a.jerseyNumber - b.jerseyNumber;
  };

  const sourcePlayers: Player[] = sourceTeamPlayers.map(tp => ({
    ...tp.user,
    id: tp.user.id,
    jerseyNumber: tp.jerseyNumber,
    position: tp.position,
    starPlayer: tp.starPlayer,
  })).sort(sortByJersey);

  // Fetch target team's players to show existing squad
  const { data: targetTeamPlayers = [] } = useQuery<any[]>({
    queryKey: ["/api/team", actualTargetTeamId, "users"],
    enabled: open && !!actualTargetTeamId,
  });

  const targetPlayers: Player[] = targetTeamPlayers.map(tp => ({
    ...tp.user,
    id: tp.user.id,
    jerseyNumber: tp.jerseyNumber,
    position: tp.position,
    starPlayer: tp.starPlayer,
  })).sort(sortByJersey);

  const transferPlayersMutation = useMutation({
    mutationFn: async (data: {
      playerIds: string[];
      sourceTeamId: string;
      targetTeamId: string;
      keepOnSourceTeam: boolean;
    }) => {
      return apiRequest("POST", "/api/players/transfer", data);
    },
    onSuccess: async (response: any) => {
      const data = await response.json();
      const successCount = data.summary?.successful ?? data.results?.filter((r: any) => r.success).length ?? 0;
      const failCount = data.summary?.failed ?? data.results?.filter((r: any) => !r.success).length ?? 0;

      queryClient.invalidateQueries({ queryKey: ["/api/team", actualSourceTeamId, "users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team", actualTargetTeamId, "users"] });

      if (successCount === 0) {
        const firstError = data.results?.find((r: any) => !r.success)?.error;
        toast({
          title: "Transfer Failed",
          description: firstError || "No players were transferred. Please check player data and try again.",
          variant: "destructive",
        });
      } else if (failCount > 0) {
        toast({
          title: "Partial Transfer",
          description: `${successCount} player(s) transferred, ${failCount} failed.`,
          variant: "destructive",
        });
        handleClose();
        onTransferComplete?.();
      } else {
        toast({
          title: "Transfer Complete",
          description: `Successfully transferred ${successCount} player(s).`,
        });
        handleClose();
        onTransferComplete?.();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Transfer Failed",
        description: error.message || "Failed to transfer players.",
        variant: "destructive",
      });
    },
  });

  const handlePlayerToggle = (playerId: string) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else {
      newSelected.add(playerId);
    }
    setSelectedPlayers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPlayers.size === sourcePlayers.length) {
      setSelectedPlayers(new Set());
    } else {
      setSelectedPlayers(new Set(sourcePlayers.map(p => p.id)));
    }
  };

  const handleTransfer = () => {
    if (selectedPlayers.size === 0) {
      toast({
        title: "No Players Selected",
        description: "Please select at least one player to transfer.",
        variant: "destructive",
      });
      return;
    }

    if (transferMode === "out" && !selectedTargetTeamId) {
      toast({
        title: "No Target Team",
        description: "Please select a target team.",
        variant: "destructive",
      });
      return;
    }

    if (transferMode === "in" && !selectedSourceTeamId) {
      toast({
        title: "No Source Team",
        description: "Please select a source team.",
        variant: "destructive",
      });
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmTransfer = (keepOnBothTeams: boolean) => {
    setKeepOnBothTeams(keepOnBothTeams);
    setShowConfirmDialog(false);
    
    transferPlayersMutation.mutate({
      playerIds: Array.from(selectedPlayers),
      sourceTeamId: actualSourceTeamId,
      targetTeamId: actualTargetTeamId,
      keepOnSourceTeam: keepOnBothTeams,
    });
  };

  const handleClose = () => {
    setOpen(false);
    setTransferMode("out");
    setSelectedSourceTeamId("");
    setSelectedTargetTeamId("");
    setSelectedPlayers(new Set());
    setShowConfirmDialog(false);
    setKeepOnBothTeams(null);
  };

  const selectedSourceTeam = allTeams.find(team => team.id === actualSourceTeamId);
  const selectedTargetTeam = allTeams.find(team => team.id === actualTargetTeamId);
  const currentTeam = allTeams.find(team => team.id === currentTeamId);

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {children}
      </div>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              Transfer Players
            </DialogTitle>
            <DialogDescription>
              Transfer players out of your team or into your team to another team in the club.
            </DialogDescription>
          </DialogHeader>

          {/* Transfer Mode Tabs */}
          <Tabs 
            value={transferMode} 
            onValueChange={(value: string) => {
              setTransferMode(value as TransferMode);
              setSelectedPlayers(new Set());
              setSelectedSourceTeamId("");
              setSelectedTargetTeamId("");
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="out" data-testid="tab-transfer-out">Transfer Out</TabsTrigger>
              <TabsTrigger value="in" data-testid="tab-transfer-in">Transfer In</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 mt-4">
            {/* Source Team */}
            <Card className="flex flex-col min-h-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {transferMode === "out" ? 
                    `Current Squad - ${currentTeam?.name || 'Unknown Team'}` : 
                    isNoTeamSource ? "Players Not in Any Team" : `Source Team Squad - ${selectedSourceTeam?.name || 'Select Team'}`
                  } ({sourcePlayers.length} players)
                </CardTitle>
                {transferMode === "in" && (
                  <div className="space-y-2">
                    <Select
                      value={selectedSourceTeamId}
                      onValueChange={(value) => {
                        setSelectedSourceTeamId(value);
                        setSelectedPlayers(new Set());
                      }}
                    >
                      <SelectTrigger data-testid="select-source-team">
                        <SelectValue placeholder="Select source team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NO_TEAM">
                          Not in any Team
                        </SelectItem>
                        {clubTeams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={sourcePlayers.length === 0}
                  >
                    {selectedPlayers.size === sourcePlayers.length ? "Deselect All" : "Select All"}
                  </Button>
                  <span>{selectedPlayers.size} selected</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-3 pt-0">
                <ScrollArea className="h-[300px]">
                  {sourcePlayers.length > 0 ? (
                    <div className="space-y-2">
                      {sourcePlayers.map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-accent transition-colors"
                        >
                          <Checkbox
                            checked={selectedPlayers.has(player.id)}
                            onCheckedChange={() => handlePlayerToggle(player.id)}
                            data-testid={`checkbox-player-${player.id}`}
                          />
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                              style={{ backgroundColor: clubPrimary }}
                            >
                              {player.jerseyNumber || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {player.firstName} {player.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">{player.position}</p>
                            </div>
                            {player.starPlayer && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm text-center">
                      {transferMode === "in" && !selectedSourceTeamId ? 
                        "Select a source team to view its players" : 
                        "No players available"
                      }
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Target Team */}
            <Card className="flex flex-col min-h-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {transferMode === "out" ? <ArrowRight className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                  {transferMode === "out" ? 
                    "Transfer To" : 
                    `Current Squad - ${currentTeam?.name || 'Unknown Team'}`
                  }
                </CardTitle>
                {transferMode === "out" && (
                  <div className="space-y-2">
                    <Select
                      value={selectedTargetTeamId}
                      onValueChange={setSelectedTargetTeamId}
                    >
                      <SelectTrigger data-testid="select-target-team">
                        <SelectValue placeholder="Select target team" />
                      </SelectTrigger>
                      <SelectContent>
                        {clubTeams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-3 pt-0">
                {actualTargetTeamId ? (
                  <>
                    <div className="mb-3 text-xs text-muted-foreground">
                      {transferMode === "out" ? 
                        `Current squad in ${selectedTargetTeam?.name} (${targetPlayers.length} players)` :
                        `Current squad (${targetPlayers.length} players)`
                      }
                    </div>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {targetPlayers.map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center gap-3 p-2 rounded-lg border bg-muted/50"
                          >
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                              style={{ backgroundColor: clubPrimary }}
                            >
                              {player.jerseyNumber || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {player.firstName} {player.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">{player.position}</p>
                            </div>
                            {player.starPlayer && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                    {transferMode === "out" ? "Select a target team to view its current squad" : "Current team squad will appear here"}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} data-testid="button-cancel-transfer">
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={
                selectedPlayers.size === 0 || 
                (transferMode === "out" && !selectedTargetTeamId) ||
                (transferMode === "in" && !selectedSourceTeamId) ||
                transferPlayersMutation.isPending
              }
              data-testid="button-transfer-players"
            >
              {transferPlayersMutation.isPending ? "Transferring..." : 
               `${transferMode === "out" ? "Transfer Out" : "Transfer In"} ${selectedPlayers.size} Player${selectedPlayers.size !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {transferMode === "out" ? "Transfer Players Out" : "Transfer Players In"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {transferMode === "out" ? 
                  `You are about to transfer ${selectedPlayers.size} player${selectedPlayers.size !== 1 ? 's' : ''} from your current team to ${selectedTargetTeam?.name}.` :
                  `You are about to bring ${selectedPlayers.size} player${selectedPlayers.size !== 1 ? 's' : ''} from ${isNoTeamSource ? 'unassigned players' : selectedSourceTeam?.name} to your current team.`
                }
              </p>
              <p className="font-medium">
                Are these players going to play for both teams?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleConfirmTransfer(false)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-transfer-remove"
            >
              {transferMode === "out" ? "No - Remove from current team" : "No - Remove from source team"}
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => handleConfirmTransfer(true)}
              data-testid="button-transfer-keep"
            >
              Yes - Keep on both teams
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}