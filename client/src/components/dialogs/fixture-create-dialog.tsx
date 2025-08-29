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

const fixtureCreateSchema = z.object({
  opponent: z.string().min(1, "Opponent is required"),
  venue: z.string().optional(),
  date: z.date(),
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
  const [open, setOpen] = useState(false);
  const [showNewOpponentInput, setShowNewOpponentInput] = useState(false);
  const [showNewCompetitionInput, setShowNewCompetitionInput] = useState(false);
  const [showLogoUpload, setShowLogoUpload] = useState(false);
  const [selectedOpponentForLogo, setSelectedOpponentForLogo] = useState<OppositionTeam | null>(null);

  // Fetch existing opposition teams and competitions
  const { data: oppositionTeams = [] } = useQuery<OppositionTeam[]>({
    queryKey: ["/api/opposition-teams"],
  });

  const { data: competitions = [] } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });

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
      type: "HOME",
      competition: "FCSAA League",
      notes: "",
    },
  });

  const handleSubmit = (data: FixtureCreateFormData) => {
    onSave({ ...data, teamId });
    setOpen(false);
    form.reset();
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
            <div className="grid grid-cols-2 gap-4">
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
                              // Find the selected team for logo upload
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
                            onClick={() => setShowNewOpponentInput(true)}
                            data-testid="button-add-new-opponent"
                            title="Add new opponent"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          {selectedOpponentForLogo && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowLogoUpload(true)}
                              data-testid="button-upload-logo"
                              title="Upload logo for selected opponent"
                            >
                              📷
                            </Button>
                          )}
                        </div>
                      )}
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
                      <Input {...field} placeholder="Enter venue name" data-testid="input-new-venue" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                            data-testid="button-new-date-picker"
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
                          data-testid="input-new-datetime"
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
            </div>

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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Additional notes about this fixture..."
                      data-testid="textarea-new-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Logo Upload Section */}
            {showLogoUpload && selectedOpponentForLogo && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">Upload Logo for {selectedOpponentForLogo.name}</h4>
                <LogoUpload
                  teamName={selectedOpponentForLogo.name}
                  currentLogo={selectedOpponentForLogo.logoPath || undefined}
                  onUploadComplete={(logoPath: string) => {
                    updateOppositionTeamMutation.mutate({
                      teamId: selectedOpponentForLogo.id,
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