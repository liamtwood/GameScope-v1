import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, Calendar, Trophy, Edit, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Competition } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";

const fixtureSettingsSchema = z.object({});

type FixtureSettingsFormData = z.infer<typeof fixtureSettingsSchema>;

interface FixtureSettingsDialogProps {
  children: React.ReactNode;
}

export function FixtureSettingsDialog({ children }: FixtureSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
  const [editCompetitionName, setEditCompetitionName] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const { toast } = useToast();

  const { data: competitions = [] } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"]
  });

  const form = useForm<FixtureSettingsFormData>({
    resolver: zodResolver(fixtureSettingsSchema),
    defaultValues: {},
  });

  // Mutations for competition management
  const updateCompetitionMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return apiRequest("PUT", `/api/competitions/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
      setEditingCompetition(null);
      setEditCompetitionName("");
      toast({
        title: "Success",
        description: "Competition updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadCompetitionLogoMutation = useMutation({
    mutationFn: async ({ competitionId, logoFile }: { competitionId: string; logoFile: File }) => {
      const formData = new FormData();
      formData.append('logo', logoFile);
      formData.append('competitionId', competitionId);
      return apiRequest("POST", `/api/competitions/${competitionId}/logo`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
      toast({
        title: "Success",
        description: "Competition logo has been updated successfully.",
      });
      setIsUploadingLogo(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsUploadingLogo(false);
    },
  });

  const handleEditCompetition = (competition: Competition) => {
    setEditingCompetition(competition);
    setEditCompetitionName(competition.name);
  };

  const handleSaveCompetitionName = () => {
    if (editingCompetition && editCompetitionName.trim()) {
      updateCompetitionMutation.mutate({ id: editingCompetition.id, name: editCompetitionName.trim() });
    }
  };

  const handleLogoUpload = (competitionId: string, file: File) => {
    setIsUploadingLogo(true);
    uploadCompetitionLogoMutation.mutate({ competitionId, logoFile: file });
  };

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
          <DialogDescription>
            Configure fixture preferences and manage competitions.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Competitions Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Competitions</h3>
              <div className="space-y-4">
                {competitions.length > 0 ? (
                  competitions.map((competition) => (
                    <Card key={competition.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            {competition.logoPath ? (
                              <img 
                                src={competition.logoPath} 
                                alt={competition.name}
                                className="h-5 w-5 object-contain"
                              />
                            ) : (
                              <Trophy className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            {editingCompetition?.id === competition.id ? (
                              <div className="flex items-center space-x-2">
                                <Input
                                  value={editCompetitionName}
                                  onChange={(e) => setEditCompetitionName(e.target.value)}
                                  className="h-8"
                                  data-testid={`input-edit-competition-${competition.id}`}
                                />
                                <Button
                                  size="sm"
                                  onClick={handleSaveCompetitionName}
                                  disabled={!editCompetitionName.trim()}
                                  data-testid={`button-save-competition-${competition.id}`}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingCompetition(null);
                                    setEditCompetitionName("");
                                  }}
                                  data-testid={`button-cancel-competition-${competition.id}`}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <h4 className="font-medium text-foreground">{competition.name}</h4>
                            )}
                            {competition.shortName && editingCompetition?.id !== competition.id && (
                              <p className="text-xs text-muted-foreground mt-1">{competition.shortName}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Badge variant="outline" className="text-xs">
                            Competition
                          </Badge>
                          {editingCompetition?.id !== competition.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditCompetition(competition)}
                              data-testid={`button-edit-competition-${competition.id}`}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No competitions found</p>
                  </div>
                )}
              </div>
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