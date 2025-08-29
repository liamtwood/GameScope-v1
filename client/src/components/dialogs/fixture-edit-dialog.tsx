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
import { Calendar, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const fixtureEditSchema = z.object({
  opponent: z.string().min(1, "Opponent is required"),
  venue: z.string().optional(),
  date: z.date(),
  type: z.enum(["HOME", "AWAY"]),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_CONTEST"]),
  competition: z.string().min(1, "Competition is required"),
  homeScore: z.coerce.number().optional(),
  awayScore: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type FixtureEditFormData = z.infer<typeof fixtureEditSchema>;

interface FixtureEditDialogProps {
  fixture: Fixture;
  onSave: (data: FixtureEditFormData) => void;
  children: React.ReactNode;
}

export function FixtureEditDialog({ fixture, onSave, children }: FixtureEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [showLogoUpload, setShowLogoUpload] = useState(false);

  // Fetch existing competitions and opposition teams
  const { data: competitions = [] } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });

  const { data: oppositionTeams = [] } = useQuery<OppositionTeam[]>({
    queryKey: ["/api/opposition-teams"],
  });

  // Find the current opposition team, or create one if it doesn't exist
  const [currentOppositionTeam, setCurrentOppositionTeam] = useState<OppositionTeam | null>(
    () => oppositionTeams.find(team => team.name === fixture.opponent) || null
  );

  // Create opposition team mutation
  const createOppositionTeamMutation = useMutation({
    mutationFn: async (name: string): Promise<OppositionTeam> => {
      const response = await apiRequest("POST", "/api/opposition-teams", { name });
      return response as unknown as OppositionTeam;
    },
    onSuccess: (newTeam: OppositionTeam) => {
      queryClient.invalidateQueries({ queryKey: ["/api/opposition-teams"] });
      setCurrentOppositionTeam(newTeam);
      setShowLogoUpload(true); // Show upload dialog immediately after team creation
    },
  });

  const updateOppositionTeamMutation = useMutation({
    mutationFn: async ({ teamId, logoPath }: { teamId: string; logoPath: string }) => {
      return apiRequest("PUT", `/api/opposition-teams/${teamId}`, { logoPath });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opposition-teams"] });
      setShowLogoUpload(false);
    },
  });

  // Handle opponent name changes
  const handleOpponentChange = (opponentName: string) => {
    const existingTeam = oppositionTeams.find(team => team.name === opponentName);
    if (existingTeam) {
      setCurrentOppositionTeam(existingTeam);
    } else {
      setCurrentOppositionTeam(null);
    }
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
      type: fixture.type as "HOME" | "AWAY",
      status: fixture.status as "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_CONTEST",
      competition: fixture.competition || "",
      homeScore: fixture.homeScore || undefined,
      awayScore: fixture.awayScore || undefined,
      notes: fixture.notes || "",
    },
  });

  // Keep currentOppositionTeam in sync with the latest opposition teams data
  useEffect(() => {
    if (oppositionTeams.length > 0) {
      const opponentName = form.watch("opponent");
      const foundTeam = oppositionTeams.find(team => team.name === opponentName);
      if (foundTeam && (!currentOppositionTeam || currentOppositionTeam.id !== foundTeam.id)) {
        setCurrentOppositionTeam(foundTeam);
      }
    }
  }, [oppositionTeams, form, currentOppositionTeam]);

  const handleSubmit = (data: FixtureEditFormData) => {
    onSave(data);
    setOpen(false);
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="opponent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opponent</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          handleOpponentChange(e.target.value);
                        }}
                        data-testid="input-opponent" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-venue" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Opposition Team Logo Section */}
            {(currentOppositionTeam || (form.watch("opponent") && form.watch("opponent").trim())) && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center border border-gray-200 p-2">
                      {currentOppositionTeam?.logoPath ? (
                        <img 
                          src={currentOppositionTeam.logoPath} 
                          alt={`${currentOppositionTeam.name} logo`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center text-sm font-medium text-gray-600">
                          {currentOppositionTeam?.shortName || 
                           (currentOppositionTeam?.name || form.watch("opponent"))
                             .split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {currentOppositionTeam?.name || form.watch("opponent")}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {createOppositionTeamMutation.isPending 
                          ? 'Creating team...' 
                          : currentOppositionTeam?.logoPath 
                            ? 'Logo uploaded' 
                            : 'No logo uploaded'}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLogoUploadClick}
                    disabled={createOppositionTeamMutation.isPending || !form.watch("opponent")?.trim()}
                    data-testid="button-edit-logo"
                  >
                    {currentOppositionTeam?.logoPath ? 'Change Logo' : 'Add Logo'}
                  </Button>
                </div>
              </div>
            )}

            {/* Logo Upload Section */}
            {showLogoUpload && currentOppositionTeam && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">Upload Logo for {currentOppositionTeam.name}</h4>
                <LogoUpload
                  teamName={currentOppositionTeam.name}
                  currentLogo={currentOppositionTeam.logoPath || undefined}
                  onUploadComplete={(logoPath: string) => {
                    console.log("Upload complete, currentOppositionTeam:", currentOppositionTeam);
                    if (!currentOppositionTeam?.id) {
                      console.error("No currentOppositionTeam or ID found:", currentOppositionTeam);
                      return;
                    }
                    updateOppositionTeamMutation.mutate({
                      teamId: currentOppositionTeam.id,
                      logoPath
                    });
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLogoUpload(false)}
                  className="mt-2"
                >
                  Cancel Logo Upload
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date & Time</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="button-date-picker"
                          >
                            {field.value ? (
                              format(field.value, "PPP p")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Input
                          type="datetime-local"
                          value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ""}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                          data-testid="input-datetime"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="competition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competition</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        data-testid="select-competition"
                      >
                        <SelectTrigger>
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Match Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-type">
                          <SelectValue placeholder="Select type" />
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

            {form.watch("status") === "COMPLETED" && (
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