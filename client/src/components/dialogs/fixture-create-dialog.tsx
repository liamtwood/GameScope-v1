import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useToast } from "@/hooks/use-toast";

const fixtureCreateSchema = z.object({
  opponent: z.string().min(1, "Opponent is required"),
  oppositionTeamId: z.string().optional(),
  venue: z.string().optional(),
  date: z.date(),
  timeSlot: z.enum(["MORNING", "AFTERNOON", "EVENING"]),
  kickoffTime: z.string().min(1, "Kick-off time is required"),
  location: z.string().optional(),
  type: z.enum(["HOME", "AWAY"]),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "POSTPONED", "CANCELLED"]).default("SCHEDULED"),
  homeScore: z.coerce.number().optional(),
  awayScore: z.coerce.number().optional(),
  competitionId: z.string().min(1, "Competition is required"),
  notes: z.string().optional(),
});

const opponentCreateSchema = z.object({
  primaryColor: z.string().min(1, "Primary color is required"),
  logoPath: z.string().optional(),
});

type FixtureCreateFormData = z.infer<typeof fixtureCreateSchema>;
type OpponentCreateFormData = z.infer<typeof opponentCreateSchema>;

interface FixtureCreateDialogProps {
  teamId: string;
  onSave: (data: FixtureCreateFormData & { teamId: string }) => void;
  children: React.ReactNode;
}

export function FixtureCreateDialog({ teamId, onSave, children }: FixtureCreateDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("fixture-details");
  const [newCompetitionName, setNewCompetitionName] = useState("");
  const [newOpponentName, setNewOpponentName] = useState("");
  const [showNewOpponentInput, setShowNewOpponentInput] = useState(false);
  const [previousOpponentId, setPreviousOpponentId] = useState<string | undefined>("");

  const { data: oppositionTeams = [] } = useQuery<OppositionTeam[]>({
    queryKey: ["/api/opposition-teams"],
  });

  const { data: competitions = [] } = useQuery<Competition[]>({
    queryKey: ["/api/teams", teamId, "competitions/enabled"],
    enabled: !!teamId,
  });

  const createCompetitionMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest("POST", "/api/competitions", { name }) as any as Competition;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
    },
  });

  const createOpponentMutation = useMutation({
    mutationFn: async (data: OpponentCreateFormData & { name: string }) => {
      const shortName = data.name.substring(0, 3).toUpperCase();
      return apiRequest("POST", "/api/opposition-teams", {
        name: data.name,
        shortName,
        logoPath: data.logoPath || null,
        websiteUrl: "",
        colors: {
          primary: data.primaryColor,
        },
      }) as any as OppositionTeam;
    },
    onSuccess: (newTeam) => {
      queryClient.invalidateQueries({ queryKey: ["/api/opposition-teams"] });
      form.setValue("oppositionTeamId", newTeam.id);
      form.setValue("opponent", newTeam.name);
      setActiveTab("fixture-details");
      setNewOpponentName("");
      setShowNewOpponentInput(false);
      opponentForm.reset();
      toast({
        title: "Success",
        description: "Opponent created successfully",
      });
    },
  });

  const form = useForm<FixtureCreateFormData>({
    resolver: zodResolver(fixtureCreateSchema),
    defaultValues: {
      opponent: "",
      oppositionTeamId: "",
      venue: "",
      date: new Date(),
      timeSlot: "AFTERNOON" as const,
      kickoffTime: "15:00",
      location: "",
      type: "HOME",
      status: "SCHEDULED",
      homeScore: undefined,
      awayScore: undefined,
      competitionId: competitions.length > 0 ? competitions[0].id : "",
      notes: "",
    },
  });

  const opponentForm = useForm<OpponentCreateFormData>({
    resolver: zodResolver(opponentCreateSchema),
    defaultValues: {
      primaryColor: "#000000",
      logoPath: "",
    },
  });


  const handleSubmit = async (data: FixtureCreateFormData) => {
    try {
      if (data.competitionId === "__new__") {
        if (!newCompetitionName.trim()) {
          toast({
            title: "Error",
            description: "Please enter a competition name",
            variant: "destructive",
          });
          return;
        }
        const newCompetition = await createCompetitionMutation.mutateAsync(newCompetitionName);
        data.competitionId = newCompetition.id;
      }

      if (showNewOpponentInput) {
        toast({
          title: "Error",
          description: "Please complete opponent creation or cancel to select an existing opponent",
          variant: "destructive",
        });
        return;
      }

      if (!data.oppositionTeamId) {
        toast({
          title: "Error",
          description: "Please select an opponent",
          variant: "destructive",
        });
        return;
      }

      const [hours, minutes] = data.kickoffTime.split(':').map(Number);
      const updatedDate = new Date(data.date);
      updatedDate.setHours(hours, minutes, 0, 0);
      
      const formattedData = {
        ...data,
        date: updatedDate,
        venue: data.location || "",
      };
      
      onSave({ ...formattedData, teamId });
      
      setOpen(false);
      form.reset();
      setNewCompetitionName("");
      setNewOpponentName("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create fixture. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOpponentSubmit = (data: OpponentCreateFormData) => {
    if (!newOpponentName.trim()) {
      toast({
        title: "Error",
        description: "Opponent name is required",
        variant: "destructive",
      });
      return;
    }
    createOpponentMutation.mutate({ ...data, name: newOpponentName });
  };

  const handleContinueToOpponentDetails = () => {
    if (!newOpponentName.trim()) {
      toast({
        title: "Error",
        description: "Please enter opponent name",
        variant: "destructive",
      });
      return;
    }
    setActiveTab("add-opponent");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Fixture</DialogTitle>
          <DialogDescription>
            Schedule a new match against an opposition team.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fixture-details">Fixture Details</TabsTrigger>
            <TabsTrigger value="add-opponent">Add New Opponent</TabsTrigger>
          </TabsList>

          <TabsContent value="fixture-details">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {/* Row 1: Competition */}
                <FormField
                  control={form.control}
                  name="competitionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Competition</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          {field.value === "__new__" ? (
                            <>
                              <Input 
                                value={newCompetitionName}
                                onChange={(e) => setNewCompetitionName(e.target.value)}
                                placeholder="Enter new competition name" 
                                data-testid="input-new-competition"
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  field.onChange("");
                                  setNewCompetitionName("");
                                }}
                                data-testid="button-cancel-new-competition"
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
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
                                  <SelectItem key={comp.id} value={comp.id}>
                                    {comp.name}
                                  </SelectItem>
                                ))}
                                <SelectItem value="__new__">+ New Competition</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Row 2: Opposition */}
                <FormField
                  control={form.control}
                  name="oppositionTeamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opposition</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          {showNewOpponentInput ? (
                            <>
                              <Input 
                                value={newOpponentName}
                                onChange={(e) => setNewOpponentName(e.target.value)}
                                placeholder="Enter opponent name" 
                                data-testid="input-new-opponent-name"
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleContinueToOpponentDetails}
                                data-testid="button-continue-opponent"
                              >
                                Continue
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setShowNewOpponentInput(false);
                                  setNewOpponentName("");
                                  if (previousOpponentId) {
                                    form.setValue("oppositionTeamId", previousOpponentId);
                                    const selectedTeam = oppositionTeams.find(team => team.id === previousOpponentId);
                                    if (selectedTeam) {
                                      form.setValue("opponent", selectedTeam.name);
                                    }
                                  }
                                }}
                                data-testid="button-cancel-new-opponent"
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <Select
                              value={field.value || ""}
                              onValueChange={(value) => {
                                if (value === "__new__") {
                                  setPreviousOpponentId(field.value);
                                  setShowNewOpponentInput(true);
                                } else {
                                  setShowNewOpponentInput(false);
                                  field.onChange(value);
                                  const selectedTeam = oppositionTeams.find(team => team.id === value);
                                  if (selectedTeam) {
                                    form.setValue("opponent", selectedTeam.name);
                                  }
                                }
                              }}
                              data-testid="select-opponent"
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select opponent" />
                              </SelectTrigger>
                              <SelectContent>
                                {oppositionTeams.map((team) => (
                                  <SelectItem key={team.id} value={team.id}>
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
                                <SelectItem value="__new__">+ New Opponent</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Row 3: Date, Time Slot, Kick-off Time */}
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
                                data-testid="button-new-date-picker"
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
                              onChange={(e) => {
                                const selectedDate = new Date(e.target.value + 'T12:00:00');
                                field.onChange(selectedDate);
                              }}
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
                        <FormLabel>Time Slot</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
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

                {/* Row 4: Match Type, Status, Home Score, Away Score */}
                <div className="grid grid-cols-4 gap-4">
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
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="POSTPONED">Postponed</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="homeScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home Score</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            placeholder="-"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
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
                            {...field} 
                            type="number" 
                            placeholder="-"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
                            data-testid="input-away-score"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Hidden opponent name field */}
                <FormField
                  control={form.control}
                  name="opponent"
                  render={({ field }) => (
                    <input type="hidden" {...field} />
                  )}
                />

                {/* Row 4: Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Add any additional notes or details about this fixture..."
                          className="min-h-[100px]"
                          data-testid="textarea-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Hidden fields for form compatibility */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <input type="hidden" {...field} value="" />
                  )}
                />

                <FormField
                  control={form.control}
                  name="venue"
                  render={({ field }) => (
                    <input type="hidden" {...field} value="" />
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" data-testid="button-save-fixture">
                    Create Fixture
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="add-opponent">
            <Form {...opponentForm}>
              <form onSubmit={opponentForm.handleSubmit(handleOpponentSubmit)} className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Creating opponent: {newOpponentName}</p>
                  <p className="text-xs text-muted-foreground mt-1">Add a logo and primary color for this team</p>
                </div>

                <div className="space-y-2">
                  <FormLabel>Logo</FormLabel>
                  <LogoUpload
                    teamName={newOpponentName || "Opponent"}
                    currentLogo={opponentForm.watch("logoPath")}
                    onUploadComplete={(logoPath: string) => {
                      opponentForm.setValue("logoPath", logoPath);
                      toast({
                        title: "Logo Uploaded",
                        description: "Logo has been uploaded successfully",
                      });
                    }}
                  />
                </div>

                <FormField
                  control={opponentForm.control}
                  name="logoPath"
                  render={({ field }) => (
                    <input type="hidden" {...field} />
                  )}
                />

                <FormField
                  control={opponentForm.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Color</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="color" 
                          className="h-10 w-full cursor-pointer"
                          data-testid="input-opponent-color"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setActiveTab("fixture-details");
                      form.setValue("oppositionTeamId", "");
                      setNewOpponentName("");
                      opponentForm.reset();
                    }}
                    data-testid="button-cancel-opponent"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createOpponentMutation.isPending}
                    data-testid="button-save-opponent"
                  >
                    {createOpponentMutation.isPending ? "Creating..." : "Create Opponent"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
