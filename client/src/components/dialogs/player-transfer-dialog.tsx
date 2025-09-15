import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowRight, Users, UserCheck, ArrowLeft } from "lucide-react";
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

type TransferMode = "out" | "in";

export function PlayerTransferDialog({ 
  children, 
  currentTeamId, 
  clubId, 
  onTransferComplete 
}: PlayerTransferDialogProps) {
  const [open, setOpen] = useState(false);
  const [transferMode, setTransferMode] = useState<TransferMode>("out");
  const [selectedSourceTeamId, setSelectedSourceTeamId] = useState<string>("");
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

  // Determine source and target team IDs based on mode
  const actualSourceTeamId = transferMode === "out" ? currentTeamId : selectedSourceTeamId;
  const actualTargetTeamId = transferMode === "out" ? selectedTargetTeamId : currentTeamId;

  // Fetch source team's players
  const { data: sourceTeamPlayers = [] } = useQuery<any[]>({
    queryKey: ["/api/team", actualSourceTeamId, "users"],
    enabled: open && !!actualSourceTeamId,
  });

  // Convert to player format
  const sourcePlayers: Player[] = sourceTeamPlayers.map(tp => ({
    ...tp.user,
    id: tp.user.id,
    jerseyNumber: tp.jerseyNumber,
    position: tp.position,
    starPlayer: tp.starPlayer,
  }));

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
      queryClient.invalidateQueries({ queryKey: ["/api/team", actualSourceTeamId, "users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team", actualTargetTeamId, "users"] });
      
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

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {children}
      </div>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {transferMode === "out" ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
              Transfer Players
            </DialogTitle>
          </DialogHeader>

          {/* Transfer Mode Selection */}
          <div className="mb-4">
            <RadioGroup
              value={transferMode}
              onValueChange={(value: TransferMode) => {
                setTransferMode(value);
                setSelectedPlayers(new Set());
                setSelectedSourceTeamId("");
                setSelectedTargetTeamId("");
              }}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="out" id="transfer-out" data-testid="radio-transfer-out" />
                <Label htmlFor="transfer-out">Transfer Out (from current team)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="in" id="transfer-in" data-testid="radio-transfer-in" />
                <Label htmlFor="transfer-in">Transfer In (to current team)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
            {/* Source Team */}
            <Card className="flex flex-col min-h-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {transferMode === "out" ? "Current Squad" : "Source Team Squad"} ({sourcePlayers.length} players)
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
                  {transferMode === "out" ? "Transfer To" : "Current Squad"}
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
                      Current squad in {selectedTargetTeam?.name} ({targetPlayers.length} players)
                    </div>
                    <ScrollArea className="h-[300px]">
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
                  `You are about to bring ${selectedPlayers.size} player${selectedPlayers.size !== 1 ? 's' : ''} from ${selectedSourceTeam?.name} to your current team.`
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