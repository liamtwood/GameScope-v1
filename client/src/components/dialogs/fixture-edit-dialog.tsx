import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Fixture, Competition } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
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

  // Fetch existing competitions
  const { data: competitions = [] } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });

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
                      <Input {...field} data-testid="input-opponent" />
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