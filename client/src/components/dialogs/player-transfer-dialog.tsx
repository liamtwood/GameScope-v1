import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowRight, Users, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

export function PlayerTransferDialog({ 
  children, 
  currentTeamId, 
  clubId, 
  onTransferComplete 
}: PlayerTransferDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedTargetTeamId, setSelectedTargetTeamId] = useState<string>("");
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [keepOnBothTeams, setKeepOnBothTeams] = useState<boolean | null>(null);
  const { toast } = useToast();

  // Fetch teams in the same club (excluding current team)
  const { data: allTeams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    enabled: open && !!clubId,
  });

  const clubTeams = allTeams.filter(team => 
    team.clubId === clubId && team.id !== currentTeamId
  );

  // Fetch current team's players
  const { data: currentTeamPlayers = [] } = useQuery<any[]>({
    queryKey: ["/api/team", currentTeamId, "users"],
    enabled: open && !!currentTeamId,
  });

  // Convert to player format
  const players: Player[] = currentTeamPlayers.map(tp => ({
    ...tp.user,
    id: tp.user.id,
    jerseyNumber: tp.jerseyNumber,
    position: tp.position,
    starPlayer: tp.starPlayer,
  }));

  // Fetch target team's players to show existing squad
  const { data: targetTeamPlayers = [] } = useQuery<any[]>({
    queryKey: ["/api/team", selectedTargetTeamId, "users"],
    enabled: open && !!selectedTargetTeamId,
  });

  const targetPlayers: Player[] = targetTeamPlayers.map(tp => ({
    ...tp.user,
    id: tp.user.id,
    jerseyNumber: tp.jerseyNumber,
    position: tp.position,
    starPlayer: tp.starPlayer,
  }));

  const transferPlayersMutation = useMutation({
    mutationFn: async (data: {
      playerIds: string[];
      sourceTeamId: string;
      targetTeamId: string;
      keepOnSourceTeam: boolean;
    }) => {
      return apiRequest("POST", "/api/players/transfer", data);
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/team", currentTeamId, "users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team", selectedTargetTeamId, "users"] });
      
      toast({
        title: "Transfer Complete",
        description: `Successfully transferred ${selectedPlayers.size} player(s).`,
      });
      
      handleClose();
      onTransferComplete?.();
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
    if (selectedPlayers.size === players.length) {
      setSelectedPlayers(new Set());
    } else {
      setSelectedPlayers(new Set(players.map(p => p.id)));
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

    if (!selectedTargetTeamId) {
      toast({
        title: "No Target Team",
        description: "Please select a target team.",
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
      sourceTeamId: currentTeamId,
      targetTeamId: selectedTargetTeamId,
      keepOnSourceTeam: keepOnBothTeams,
    });
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedTargetTeamId("");
    setSelectedPlayers(new Set());
    setShowConfirmDialog(false);
    setKeepOnBothTeams(null);
  };

  const selectedTargetTeam = clubTeams.find(team => team.id === selectedTargetTeamId);

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {children}
      </div>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Transfer Players
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
            {/* Source Team (Current) */}
            <Card className="flex flex-col min-h-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Current Squad ({players.length} players)
                </CardTitle>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedPlayers.size === players.length ? "Deselect All" : "Select All"}
                  </Button>
                  <span>{selectedPlayers.size} selected</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-3 pt-0">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {players.map((player) => (
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
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            {player.jerseyNumber || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {player.firstName} {player.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{player.position}</p>
                          </div>
                          {player.starPlayer && (
                            <UserCheck className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Target Team Selection */}
            <Card className="flex flex-col min-h-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Transfer To
                </CardTitle>
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
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-3 pt-0">
                {selectedTargetTeamId ? (
                  <>
                    <div className="mb-3 text-xs text-muted-foreground">
                      Current squad in {selectedTargetTeam?.name} ({targetPlayers.length} players)
                    </div>
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-2">
                        {targetPlayers.map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center gap-3 p-2 rounded-lg border bg-muted/50"
                          >
                            <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-xs font-medium">
                              {player.jerseyNumber || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {player.firstName} {player.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">{player.position}</p>
                            </div>
                            {player.starPlayer && (
                              <UserCheck className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                    Select a target team to view its current squad
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={selectedPlayers.size === 0 || !selectedTargetTeamId || transferPlayersMutation.isPending}
              data-testid="button-transfer-players"
            >
              {transferPlayersMutation.isPending ? "Transferring..." : `Transfer ${selectedPlayers.size} Player${selectedPlayers.size !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer Confirmation</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to transfer {selectedPlayers.size} player{selectedPlayers.size !== 1 ? 's' : ''} to{' '}
                <span className="font-semibold">{selectedTargetTeam?.name}</span>.
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
              No - Remove from current team
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