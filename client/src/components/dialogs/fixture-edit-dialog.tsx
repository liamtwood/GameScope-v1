import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Fixture, Competition, OppositionTeam } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LogoUpload } from "@/components/logo-upload";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar, CalendarIcon, Plus, Edit, Check, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const fixtureEditSchema = z.object({
  opponent: z.string().min(1, "Opponent is required"),
  venue: z.string().optional(),
  date: z.date(),
  timeSlot: z.enum(["MORNING", "AFTERNOON", "EVENING"]).optional(),
  kickoffTime: z.string().optional(),
  location: z.string().optional(),
  type: z.enum(["HOME", "AWAY"]),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_CONTEST"]),
  competition: z.string().min(1, "Competition is required"),
  homeScore: z.coerce.number().optional(),
  awayScore: z.coerce.number().optional(),
  notes: z.string().optional(),
  oppositionTeamId: z.string().optional(),
});

type FixtureEditFormData = z.infer<typeof fixtureEditSchema>;

interface FixtureEditDialogProps {
  fixture: Fixture;
  onSave: (data: FixtureEditFormData) => void;
  children: React.ReactNode;
}

export function FixtureEditDialog({ fixture, onSave, children }: FixtureEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [showNewOpponentInput, setShowNewOpponentInput] = useState(false);
  const [showNewCompetitionInput, setShowNewCompetitionInput] = useState(false);
  const [selectedOpponentForLogo, setSelectedOpponentForLogo] = useState<OppositionTeam | null>(null);
  const [isEditingOpponentName, setIsEditingOpponentName] = useState(false);
  const [editOpponentName, setEditOpponentName] = useState("");

  // Fetch existing competitions and opposition teams
  const { data: competitions = [] } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });

  const { data: oppositionTeams = [] } = useQuery<OppositionTeam[]>({
    queryKey: ["/api/opposition-teams"],
  });

  // Find the current opposition team, or create one if it doesn't exist
  const [currentOppositionTeam, setCurrentOppositionTeam] = useState<OppositionTeam | null>(null);


  const updateOppositionTeamMutation = useMutation({
    mutationFn: async ({ teamId, logoPath, name }: { teamId: string; logoPath?: string; name?: string }) => {
      const updateData: any = {};
      if (logoPath !== undefined) updateData.logoPath = logoPath;
      if (name !== undefined) updateData.name = name;
      return apiRequest("PUT", `/api/opposition-teams/${teamId}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opposition-teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fixtures"] });
    },
  });

  // Handle starting opponent name edit
  const handleStartEditOpponentName = () => {
    if (selectedOpponentForLogo) {
      setEditOpponentName(selectedOpponentForLogo.name);
      setIsEditingOpponentName(true);
    }
  };

  // Handle saving opponent name edit
  const handleSaveOpponentNameEdit = () => {
    if (selectedOpponentForLogo && editOpponentName.trim()) {
      updateOppositionTeamMutation.mutate({
        teamId: selectedOpponentForLogo.id,
        name: editOpponentName.trim()
      });
      // Update form with new name
      form.setValue("opponent", editOpponentName.trim());
      // Update local state
      setSelectedOpponentForLogo({
        ...selectedOpponentForLogo,
        name: editOpponentName.trim()
      });
    }
    setIsEditingOpponentName(false);
    setEditOpponentName("");
  };

  // Handle canceling opponent name edit
  const handleCancelOpponentNameEdit = () => {
    setIsEditingOpponentName(false);
    setEditOpponentName("");
  };


  const form = useForm<FixtureEditFormData>({
    resolver: zodResolver(fixtureEditSchema),
    defaultValues: {
      opponent: fixture.opponent,
      venue: fixture.venue,
      date: new Date(fixture.date),
      timeSlot: "AFTERNOON" as const,
      kickoffTime: "15:00",
      location: "",
      type: fixture.type as "HOME" | "AWAY",
      status: fixture.status as "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_CONTEST",
      competition: fixture.competition || "",
      homeScore: fixture.homeScore !== undefined && fixture.homeScore !== null ? fixture.homeScore : undefined,
      awayScore: fixture.awayScore !== undefined && fixture.awayScore !== null ? fixture.awayScore : undefined,
      notes: fixture.notes || "",
      oppositionTeamId: fixture.oppositionTeamId || undefined,
    },
  });

  // Initialize the selected opponent for logo
  useEffect(() => {
    if (fixture.oppositionTeamId) {
      const team = oppositionTeams.find(team => team.id === fixture.oppositionTeamId);
      setSelectedOpponentForLogo(team || null);
    }
  }, [fixture.oppositionTeamId, oppositionTeams]);

  const handleSubmit = async (data: FixtureEditFormData) => {
    try {
      // Check if the opponent exists
      let existingTeam = oppositionTeams.find(team => team.name === data.opponent);
      
      if (existingTeam) {
        data.oppositionTeamId = existingTeam.id;
      } else if (data.opponent && data.opponent.trim()) {
        // Create new opposition team if it doesn't exist
        const newTeam = await apiRequest("POST", "/api/opposition-teams", {
          name: data.opponent,
          shortName: data.opponent.substring(0, 3).toUpperCase(),
          logoPath: null,
          websiteUrl: ""
        }) as any;
        data.oppositionTeamId = newTeam.id;
        queryClient.invalidateQueries({ queryKey: ["/api/opposition-teams"] });
      }
      
      // Save fixture data
      onSave(data);
      setOpen(false);
    } catch (error) {
      console.error("Error updating fixture:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Fixture</DialogTitle>
          <DialogDescription>
            Update match details and manage results.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Row 1 - Competition, Match Type */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="competition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competition</FormLabel>
                    <FormControl>
                      {showNewCompetitionInput ? (
                        <div className="flex gap-2">
                          <Input {...field} placeholder="Enter new competition name" data-testid="input-new-competition" />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowNewCompetitionInput(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            data-testid="select-competition"
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select competition" />
                            </SelectTrigger>
                            <SelectContent>
                              {competitions.map((comp) => (
                                <SelectItem key={comp.id} value={comp.name}>
                                  {comp.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowNewCompetitionInput(true)}
                            data-testid="button-add-new-competition"
                            title="Add new competition"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Match Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-match-type">
                          <SelectValue placeholder="Select match type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="HOME">Home</SelectItem>
                        <SelectItem value="AWAY">Away</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 2 - Opponent with Logo Container */}
            <div className="grid grid-cols-[2fr,1fr] gap-4">
              <FormField
                control={form.control}
                name="opponent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opponent</FormLabel>
                    <FormControl>
                      {showNewOpponentInput ? (
                        <div className="flex gap-2">
                          <Input {...field} placeholder="Enter new opponent name" data-testid="input-new-opponent" />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowNewOpponentInput(false);
                              setSelectedOpponentForLogo(null);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : isEditingOpponentName && selectedOpponentForLogo ? (
                        <div className="flex gap-2">
                          <Input
                            value={editOpponentName}
                            onChange={(e) => setEditOpponentName(e.target.value)}
                            placeholder="Enter opponent name"
                            className="flex-1"
                            data-testid="input-edit-opponent-name"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleSaveOpponentNameEdit}
                            disabled={!editOpponentName.trim()}
                            title="Save changes"
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCancelOpponentNameEdit}
                            title="Cancel edit"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              const selectedTeam = oppositionTeams.find(team => team.name === value);
                              setSelectedOpponentForLogo(selectedTeam || null);
                            }}
                            data-testid="select-opponent"
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select opponent" />
                            </SelectTrigger>
                            <SelectContent>
                              {oppositionTeams.map((team) => (
                                <SelectItem key={team.id} value={team.name}>
                                  <div className="flex items-center gap-2">
                                    {team.logoPath ? (
                                      <img 
                                        src={team.logoPath} 
                                        alt={`${team.name} logo`}
                                        className="w-4 h-4 object-cover rounded"
                                      />
                                    ) : (
                                      <div className="w-4 h-4 bg-muted rounded flex items-center justify-center text-xs">
                                        {team.shortName}
                                      </div>
                                    )}
                                    {team.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedOpponentForLogo && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleStartEditOpponentName}
                              title="Edit opponent name"
                              data-testid="button-edit-opponent-name"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowNewOpponentInput(true);
                              // Clear the opponent field and logo states when adding new opponent
                              field.onChange("");
                              setSelectedOpponentForLogo(null);
                            }}
                            data-testid="button-add-new-opponent"
                            title="Add new opponent"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Logo Container */}
              <div className="space-y-2">
                <FormLabel>Logo</FormLabel>
                <div className="border rounded-lg p-4 h-24 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                  {selectedOpponentForLogo?.logoPath ? (
                    <img 
                      src={selectedOpponentForLogo.logoPath}
                      alt={`${selectedOpponentForLogo.name} logo`}
                      className="max-h-16 max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-sm text-muted-foreground text-center">
                      No Logo
                    </div>
                  )}
                </div>
                <LogoUpload
                  teamName={selectedOpponentForLogo?.name || "Selected Team"}
                  currentLogo={selectedOpponentForLogo?.logoPath || undefined}
                  onUploadComplete={async (logoPath: string) => {
                    const currentOpponent = form.getValues("opponent");
                    if (!currentOpponent) return;

                    // Find or create opponent team object
                    let opponentTeam = oppositionTeams.find(team => team.name === currentOpponent);
                    
                    if (!opponentTeam) {
                      // For new teams, create the team with the logo
                      try {
                        await apiRequest("POST", "/api/opposition-teams", {
                          name: currentOpponent,
                          shortName: currentOpponent.substring(0, 3).toUpperCase(),
                          logoPath: logoPath,
                          websiteUrl: ""
                        });
                        // Refresh opposition teams list
                        queryClient.invalidateQueries({ queryKey: ["/api/opposition-teams"] });
                      } catch (error) {
                        console.error("Error creating team:", error);
                      }
                    } else {
                      // For existing teams, just update the logo
                      updateOppositionTeamMutation.mutate({
                        teamId: opponentTeam.id,
                        logoPath
                      });
                    }
                    
                    // Update the selected opponent to show new logo
                    const updatedTeam = oppositionTeams.find(team => team.name === currentOpponent);
                    if (updatedTeam) {
                      setSelectedOpponentForLogo({...updatedTeam, logoPath});
                    }
                  }}
                />
              </div>
            </div>

            {/* Row 3 - Date, Time Slot, Kick-off Time */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal h-10",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="button-date-picker"
                          >
                            {field.value ? (
                              format(field.value, "d MMM yyyy")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Input
                          type="date"
                          value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                          data-testid="input-date"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeSlot"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Slot</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Update kick-off time based on time slot selection
                        const timeMapping = {
                          MORNING: "10:00",
                          AFTERNOON: "15:00", 
                          EVENING: "20:00"
                        };
                        form.setValue("kickoffTime", timeMapping[value as keyof typeof timeMapping]);
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-time-slot">
                          <SelectValue placeholder="Select time slot" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MORNING">Morning</SelectItem>
                        <SelectItem value="AFTERNOON">Afternoon</SelectItem>
                        <SelectItem value="EVENING">Evening</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="kickoffTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kick-off Time</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="time" 
                        data-testid="input-kickoff-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status and Scores Row */}
            <div className="grid grid-cols-[2fr,1.5fr] gap-6 items-end">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        <SelectItem value="NO_CONTEST">No Contest</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Score Section */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Score</div>
                <div className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name="homeScore"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            value={field.value !== undefined && field.value !== null ? String(field.value) : ""} 
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === "" ? undefined : Number(value));
                            }}
                            placeholder="Home"
                            data-testid="input-home-score"
                            className="text-center"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="text-xl font-semibold text-muted-foreground px-2">
                    -
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="awayScore"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            value={field.value !== undefined && field.value !== null ? String(field.value) : ""} 
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === "" ? undefined : Number(value));
                            }}
                            placeholder="Away"
                            data-testid="input-away-score"
                            className="text-center"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>


            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" data-testid="button-save-fixture">
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}