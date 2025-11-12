import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Fixture, Competition, OppositionTeam } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LogoUpload } from "@/components/logo-upload";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CalendarIcon, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const fixtureEditSchema = z.object({
  opponent: z.string().min(1, "Opponent is required"),
  venue: z.string().optional(),
  date: z.date(),
  timeSlot: z.enum(["MORNING", "AFTERNOON", "EVENING"]).optional(),
  kickoffTime: z.string().optional(),
  location: z.string().optional(),
  type: z.enum(["HOME", "AWAY"]),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_CONTEST"]),
  competitionId: z.string().min(1, "Competition is required"),
  homeScore: z.coerce.number().optional(),
  awayScore: z.coerce.number().optional(),
  notes: z.string().optional(),
  oppositionTeamId: z.string().optional(),
});

const opponentCreateSchema = z.object({
  name: z.string().min(1, "Opponent name is required"),
  shortName: z.string().min(1, "Short name is required"),
  primaryColor: z.string().min(1, "Primary color is required"),
  logoPath: z.string().optional(),
});

type FixtureEditFormData = z.infer<typeof fixtureEditSchema>;
type OpponentCreateFormData = z.infer<typeof opponentCreateSchema>;

interface FixtureEditDialogProps {
  fixture: Fixture;
  onSave: (data: FixtureEditFormData) => void;
  children: React.ReactNode;
}

export function FixtureEditDialog({ fixture, onSave, children }: FixtureEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("fixture-details");
  const [showNewCompetitionInput, setShowNewCompetitionInput] = useState(false);
  const { toast } = useToast();

  const { data: competitions = [] } = useQuery<Competition[]>({
    queryKey: ["/api/teams", fixture.teamId, "competitions/enabled"],
    enabled: !!fixture.teamId,
  });

  const { data: oppositionTeams = [] } = useQuery<OppositionTeam[]>({
    queryKey: ["/api/opposition-teams"],
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
    mutationFn: async (data: OpponentCreateFormData) => {
      return apiRequest("POST", "/api/opposition-teams", {
        name: data.name,
        shortName: data.shortName,
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
      opponentForm.reset();
      toast({
        title: "Success",
        description: "Opponent created successfully",
      });
    },
  });

  const form = useForm<FixtureEditFormData>({
    resolver: zodResolver(fixtureEditSchema),
    defaultValues: {
      opponent: fixture.opponent,
      venue: fixture.venue,
      date: (() => {
        const parsedDate = typeof fixture.date === 'string' ? parseISO(fixture.date) : new Date(fixture.date);
        parsedDate.setHours(12, 0, 0, 0);
        return parsedDate;
      })(),
      timeSlot: "AFTERNOON" as const,
      kickoffTime: "15:00",
      location: "",
      type: fixture.type as "HOME" | "AWAY",
      status: fixture.status as "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_CONTEST",
      competitionId: fixture.competitionId || "",
      homeScore: fixture.homeScore !== undefined && fixture.homeScore !== null ? fixture.homeScore : undefined,
      awayScore: fixture.awayScore !== undefined && fixture.awayScore !== null ? fixture.awayScore : undefined,
      notes: fixture.notes || "",
      oppositionTeamId: fixture.oppositionTeamId || undefined,
    },
  });

  const opponentForm = useForm<OpponentCreateFormData>({
    resolver: zodResolver(opponentCreateSchema),
    defaultValues: {
      name: "",
      shortName: "",
      primaryColor: "#000000",
      logoPath: "",
    },
  });

  useEffect(() => {
    const parsedDate = typeof fixture.date === 'string' ? parseISO(fixture.date) : new Date(fixture.date);
    parsedDate.setHours(12, 0, 0, 0);
    
    form.reset({
      opponent: fixture.opponent,
      venue: fixture.venue,
      date: parsedDate,
      timeSlot: "AFTERNOON" as const,
      kickoffTime: "15:00",
      location: "",
      type: fixture.type as "HOME" | "AWAY",
      status: fixture.status as "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_CONTEST",
      competitionId: fixture.competitionId || "",
      homeScore: fixture.homeScore !== undefined && fixture.homeScore !== null ? fixture.homeScore : undefined,
      awayScore: fixture.awayScore !== undefined && fixture.awayScore !== null ? fixture.awayScore : undefined,
      notes: fixture.notes || "",
      oppositionTeamId: fixture.oppositionTeamId || undefined,
    });
  }, [fixture, form]);

  useEffect(() => {
    const subscription = opponentForm.watch((value, { name }) => {
      if (name === "name" && value.name) {
        const shortName = value.name.substring(0, 3).toUpperCase();
        opponentForm.setValue("shortName", shortName);
      }
    });
    return () => subscription.unsubscribe();
  }, [opponentForm]);

  const handleSubmit = async (data: FixtureEditFormData) => {
    try {
      if (showNewCompetitionInput && data.competitionId) {
        const newCompetition = await createCompetitionMutation.mutateAsync(data.competitionId);
        data.competitionId = newCompetition.id;
      }

      onSave(data);
      setOpen(false);
      setShowNewCompetitionInput(false);
    } catch (error) {
      console.error("Error updating fixture:", error);
      toast({
        title: "Error",
        description: "Failed to update fixture. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOpponentSubmit = (data: OpponentCreateFormData) => {
    createOpponentMutation.mutate(data);
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
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fixture-details">Fixture Details</TabsTrigger>
            <TabsTrigger value="add-opponent">Add New Opponent</TabsTrigger>
          </TabsList>

          <TabsContent value="fixture-details">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {/* Row 1: Date, Time Slot, Kick-off Time */}
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
                              onChange={(e) => {
                                const selectedDate = new Date(e.target.value + 'T12:00:00');
                                field.onChange(selectedDate);
                              }}
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            type="time"
                            {...field}
                            data-testid="input-kickoff-time"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Row 2: Competition, Match Type */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="competitionId"
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
                                    <SelectItem key={comp.id} value={comp.id}>
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

                {/* Row 3: Opponent */}
                <FormField
                  control={form.control}
                  name="oppositionTeamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opponent</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Select
                            value={field.value || ""}
                            onValueChange={(value) => {
                              field.onChange(value);
                              const selectedTeam = oppositionTeams.find(team => team.id === value);
                              if (selectedTeam) {
                                form.setValue("opponent", selectedTeam.name);
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
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveTab("add-opponent")}
                            data-testid="button-add-new-opponent"
                            title="Add new opponent"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Row 4: Home Score - Away Score */}
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
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const value = e.target.value === "" ? undefined : Number(e.target.value);
                              field.onChange(value);
                            }}
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
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const value = e.target.value === "" ? undefined : Number(e.target.value);
                              field.onChange(value);
                            }}
                            data-testid="input-away-score"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Additional fields */}
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

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Add any notes" data-testid="textarea-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" data-testid="button-save-fixture">
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="add-opponent">
            <Form {...opponentForm}>
              <form onSubmit={opponentForm.handleSubmit(handleOpponentSubmit)} className="space-y-4">
                <FormField
                  control={opponentForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opponent Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter opponent name" data-testid="input-opponent-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={opponentForm.control}
                  name="shortName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Auto-derived from name" data-testid="input-opponent-short-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={opponentForm.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Color</FormLabel>
                      <FormControl>
                        <Input type="color" {...field} data-testid="input-opponent-color" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={opponentForm.control}
                  name="logoPath"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo</FormLabel>
                      <FormControl>
                        <LogoUpload
                          teamName={opponentForm.watch("name") || "New Opponent"}
                          currentLogo={field.value}
                          onUploadComplete={(logoPath: string) => {
                            field.onChange(logoPath);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("fixture-details")}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createOpponentMutation.isPending} data-testid="button-create-opponent">
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
