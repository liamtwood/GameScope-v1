import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

const fixtureSettingsSchema = z.object({
  defaultVenue: z.string().min(1, "Default venue is required"),
  defaultMatchDuration: z.string().default("90"),
  enableNotifications: z.boolean().default(true),
  enablePublicResults: z.boolean().default(true),
  teamNotes: z.string().optional(),
  warmupTime: z.string().default("15"),
  cooldownTime: z.string().default("15"),
});

type FixtureSettingsFormData = z.infer<typeof fixtureSettingsSchema>;

interface FixtureSettingsDialogProps {
  children: React.ReactNode;
}

export function FixtureSettingsDialog({ children }: FixtureSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<FixtureSettingsFormData>({
    resolver: zodResolver(fixtureSettingsSchema),
    defaultValues: {
      defaultVenue: "",
      defaultMatchDuration: "90",
      enableNotifications: true,
      enablePublicResults: true,
      teamNotes: "",
      warmupTime: "15",
      cooldownTime: "15",
    },
  });

  const onSubmit = async (data: FixtureSettingsFormData) => {
    try {
      // TODO: API call to save fixture settings
      console.log("Fixture settings:", data);
      
      toast({
        title: "Settings saved",
        description: "Fixture settings have been updated successfully.",
      });
      
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save fixture settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fixture Settings</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Settings</h3>
              
              <FormField
                control={form.control}
                name="defaultVenue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Home Venue</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter default home venue"
                        {...field}
                        data-testid="input-default-venue"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="defaultMatchDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Match Duration (minutes)</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger data-testid="select-match-duration">
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="45">45 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                            <SelectItem value="90">90 minutes</SelectItem>
                            <SelectItem value="120">120 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="warmupTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warm-up Time (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="60"
                          {...field}
                          data-testid="input-warmup-time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="cooldownTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cool-down Time (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="60"
                        {...field}
                        data-testid="input-cooldown-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Preferences</h3>
              
              <FormField
                control={form.control}
                name="enableNotifications"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Enable Fixture Notifications</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Receive notifications for fixture updates and reminders
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-enable-notifications"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enablePublicResults"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Public Results</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Allow fixture results to be publicly visible
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-enable-public-results"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Team Notes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Team Notes</h3>
              
              <FormField
                control={form.control}
                name="teamNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Team Instructions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter default instructions or notes for fixtures..."
                        className="min-h-[100px]"
                        {...field}
                        data-testid="textarea-team-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                data-testid="button-cancel-settings"
              >
                Cancel
              </Button>
              <Button type="submit" data-testid="button-save-settings">
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}