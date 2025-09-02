import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CalendarIcon, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { OppositionTeam, Competition } from "@shared/schema";
import { LogoUpload } from "@/components/logo-upload";
import { LogoDiscovery } from "@/utils/logoDiscovery";
import { useToast } from "@/hooks/use-toast";

const fixtureCreateSchema = z.object({
  opponent: z.string().min(1, "Opponent is required"),
  venue: z.string().optional(),
  date: z.date(),
  timeSlot: z.enum(["MORNING", "AFTERNOON", "EVENING"]),
  location: z.string().min(1, "Location is required"),
  type: z.enum(["HOME", "AWAY"]),
  competition: z.string().min(1, "Competition is required"),
  notes: z.string().optional(),
});

type FixtureCreateFormData = z.infer<typeof fixtureCreateSchema>;

interface FixtureCreateDialogProps {
  teamId: string;
  onSave: (data: FixtureCreateFormData & { teamId: string }) => void;
  children: React.ReactNode;
}

export function FixtureCreateDialog({ teamId, onSave, children }: FixtureCreateDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [showNewOpponentInput, setShowNewOpponentInput] = useState(false);
  const [showNewCompetitionInput, setShowNewCompetitionInput] = useState(false);
  const [showLogoUpload, setShowLogoUpload] = useState(false);
  const [selectedOpponentForLogo, setSelectedOpponentForLogo] = useState<OppositionTeam | null>(null);
  const [newOpponentWebsite, setNewOpponentWebsite] = useState("");
  const [isDiscoveringLogo, setIsDiscoveringLogo] = useState(false);
  const [discoveredLogoUrl, setDiscoveredLogoUrl] = useState<string | null>(null);

  // Fetch existing opposition teams and competitions
  const { data: oppositionTeams = [], isLoading: isLoadingTeams } = useQuery<OppositionTeam[]>({
    queryKey: ["/api/opposition-teams"],
  });

  const { data: competitions = [], isLoading: isLoadingCompetitions } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });

  // Debug logging
  console.log('Opposition teams data:', oppositionTeams);
  console.log('Opposition teams count:', oppositionTeams.length);
  console.log('Loading teams:', isLoadingTeams);

  const updateOppositionTeamMutation = useMutation({
    mutationFn: async ({ teamId, logoPath }: { teamId: string; logoPath: string }) => {
      return apiRequest("PUT", `/api/opposition-teams/${teamId}`, { logoPath });
    },
    onSuccess: () => {
      // Refresh opposition teams list
      queryClient.invalidateQueries({ queryKey: ["/api/opposition-teams"] });
      setShowLogoUpload(false);
      setSelectedOpponentForLogo(null);
    },
  });

  const form = useForm<FixtureCreateFormData>({
    resolver: zodResolver(fixtureCreateSchema),
    defaultValues: {
      opponent: "",
      venue: "",
      date: new Date(),
      timeSlot: "AFTERNOON" as const,
      location: "",
      type: "HOME",
      competition: "FCSAA League",
      notes: "",
    },
  });

  const handleDiscoverLogo = async () => {
    const opponentName = form.getValues("opponent");
    if (!opponentName || !newOpponentWebsite) {
      toast({
        title: "Missing Information",
        description: "Please enter both opponent name and website URL",
        variant: "destructive",
      });
      return;
    }

    setIsDiscoveringLogo(true);
    
    try {
      const logoDiscovery = new LogoDiscovery();
      const result = await logoDiscovery.findLogoFromWebsite(newOpponentWebsite);
      
      if (result.success && (result.logoUrl || result.faviconUrl)) {
        const logoUrl = result.logoUrl || result.faviconUrl;
        
        toast({
          title: "Logo Found!",
          description: `Found a logo for ${opponentName}. It will be saved when you create the fixture.`,
        });
        
        // Store the discovered logo URL for use when creating the team
        setDiscoveredLogoUrl(logoUrl || null);
      } else {
        toast({
          title: "No Logo Found",
          description: result.error || "Could not find a logo at the provided website",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Discovery Failed",
        description: "An error occurred while searching for the logo",
        variant: "destructive",
      });
    } finally {
      setIsDiscoveringLogo(false);
    }
  };

  const handleSubmit = async (data: FixtureCreateFormData) => {
    // Map time slot to actual kick-off time
    const timeMapping = {
      MORNING: 10, // 10:00 AM
      AFTERNOON: 15, // 3:00 PM  
      EVENING: 20, // 8:00 PM
    };
    
    const kickOffHour = timeMapping[data.timeSlot];
    const updatedDate = new Date(data.date);
    updatedDate.setHours(kickOffHour, 0, 0, 0); // Set to exact hour with 0 minutes/seconds
    
    const formattedData = {
      ...data,
      date: updatedDate,
      venue: data.location, // Map location to venue for backend compatibility
    };
    
    // If we're creating a new opponent and have a website URL, pass that along
    if (showNewOpponentInput && newOpponentWebsite) {
      onSave({ 
        ...formattedData, 
        teamId, 
        newOpponentWebsite, 
        discoveredLogoUrl 
      } as any);
    } else {
      onSave({ ...formattedData, teamId });
    }
    
    setOpen(false);
    form.reset();
    setNewOpponentWebsite("");
    setDiscoveredLogoUrl(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Fixture</DialogTitle>
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
                        <SelectTrigger data-testid="select-new-type">
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
            </div>

            {/* Row 2 - Opponent */}
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
                          onClick={() => setShowNewOpponentInput(false)}
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
                          disabled={isLoadingTeams}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder={isLoadingTeams ? "Loading opponents..." : "Select opponent"} />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingTeams ? (
                              <SelectItem value="loading" disabled>Loading teams...</SelectItem>
                            ) : oppositionTeams.length === 0 ? (
                              <SelectItem value="no-teams" disabled>No opponents available</SelectItem>
                            ) : (
                              oppositionTeams.map((team) => (
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
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowNewOpponentInput(true)}
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

            {/* Row 3 - Date, Time */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="button-new-date-picker"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
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
                          data-testid="input-new-date"
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
                    <FormLabel>Time</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-time-slot">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MORNING">Morning (10:00 AM)</SelectItem>
                        <SelectItem value="AFTERNOON">Afternoon (3:00 PM)</SelectItem>
                        <SelectItem value="EVENING">Evening (8:00 PM)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 4 - Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter location" data-testid="input-location" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            {/* Notes field - hidden but still part of form for database */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <input type="hidden" {...field} value="" />
              )}
            />


            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" data-testid="button-create-fixture">
                Create Fixture
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}