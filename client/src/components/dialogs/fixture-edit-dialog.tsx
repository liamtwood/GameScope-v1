import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { Calendar, CalendarIcon, Plus } from "lucide-react";
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
    mutationFn: async ({ teamId, logoPath, shortName }: { teamId: string; logoPath?: string; shortName?: string }) => {
      const updateData: any = {};
      if (logoPath !== undefined) updateData.logoPath = logoPath;
      if (shortName !== undefined) updateData.shortName = shortName;
      return apiRequest("PUT", `/api/opposition-teams/${teamId}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opposition-teams"] });
      setShowLogoUpload(false);
    },
  });

  // Handle opponent name changes - don't reset team if we're just editing the name
  const handleOpponentChange = (opponentName: string) => {
    // Only look for a different team if the name exactly matches another team
    const existingTeam = oppositionTeams.find(team => team.name === opponentName);
    if (existingTeam && existingTeam.id !== currentOppositionTeam?.id) {
      setCurrentOppositionTeam(existingTeam);
      form.setValue("shortName", existingTeam.shortName || "");
    }
    // Don't reset currentOppositionTeam to null when typing - keep the existing team
  };

  // Handle logo upload click - create team if needed
  const handleLogoUploadClick = () => {
    const opponentName = form.watch("opponent");
    if (!currentOppositionTeam && opponentName && opponentName.trim()) {
      // Create the team first, then show upload
      createOppositionTeamMutation.mutate(opponentName.trim());
    } else {
      // Team already exists, show upload immediately
      setShowLogoUpload(true);
    }
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
      homeScore: fixture.homeScore || undefined,
      awayScore: fixture.awayScore || undefined,
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
                  buttonText="Upload Logo"
                  className="w-full"
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

            {/* Additional Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter venue" data-testid="input-venue" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </div>

            {(form.watch("status") === "COMPLETED" || form.watch("status") === "NO_CONTEST") && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="homeScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home Score</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          value={field.value || ""} 
                          data-testid="input-home-score" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="awayScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Away Score</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          value={field.value || ""} 
                          data-testid="input-away-score" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Additional notes about this fixture..."
                      data-testid="textarea-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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