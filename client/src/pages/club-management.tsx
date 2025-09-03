import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Users, Trophy, Calendar, Edit, Shield, ArrowLeft, Plus, User, MapPin, Phone, Mail, Globe, Settings, Upload, Landmark } from "lucide-react";
import { useTeam } from "@/contexts/team-context";
import { useClub } from "@/contexts/club-context";
import type { Club, Team } from "@shared/schema";
import { insertTeamSchema, insertClubSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

const createTeamSchema = insertTeamSchema.extend({
  name: z.string().min(1, "Team name is required"),
});

const editClubSchema = insertClubSchema.extend({
  name: z.string().min(1, "Club name is required"),
});

type CreateTeamFormData = z.infer<typeof createTeamSchema>;
type EditClubFormData = z.infer<typeof editClubSchema>;

export default function ClubManagement() {
  const [, setLocation] = useLocation();
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false);
  const [isEditClubDialogOpen, setIsEditClubDialogOpen] = useState(false);
  const { toast } = useToast();
  const { selectTeam } = useTeam();
  const { selectedClub, clubs, isLoading: clubsLoading } = useClub();

  // Fetch teams for the selected club
  const { data: allTeams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const clubTeams = allTeams.filter(team => team.clubId === selectedClub?.id);

  const editClubForm = useForm<EditClubFormData>({
    resolver: zodResolver(editClubSchema),
    defaultValues: {
      name: "",
      shortName: "",
      owner: "",
      address: "",
      city: "",
      phone: "",
      email: "",
      description: "",
      subscriptionStatus: "",
    },
  });

  const form = useForm<CreateTeamFormData>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      shortName: "",
      clubId: selectedClub?.id || "",
      status: "ACTIVE",
      coach: "",
      assistantCoach: "",
      ageGroup: "",
      gender: "",
      season: "2025/26",
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: async (teamData: CreateTeamFormData) => {
      return apiRequest("POST", "/api/teams", { ...teamData, clubId: selectedClub?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setIsCreateTeamDialogOpen(false);
      form.reset();
      toast({
        title: "Team Created",
        description: "New team has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create team.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateTeamFormData) => {
    createTeamMutation.mutate(data);
  };

  const handleTeamSelect = (team: Team) => {
    selectTeam(team);
    setLocation("/");
  };

  const updateClubMutation = useMutation({
    mutationFn: async (data: { id: string; clubData: EditClubFormData }) => {
      return apiRequest("PATCH", `/api/clubs/${data.id}`, data.clubData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
      setIsEditClubDialogOpen(false);
      editClubForm.reset();
      toast({
        title: "Club Updated",
        description: "Club has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update club.",
        variant: "destructive",
      });
    },
  });

  const handleEditClub = () => {
    if (selectedClub) {
      editClubForm.reset({
        name: selectedClub.name,
        shortName: selectedClub.shortName,
        owner: selectedClub.owner,
        address: selectedClub.address || "",
        city: selectedClub.city || "",
        phone: selectedClub.phone || "",
        email: selectedClub.email || "",
        description: selectedClub.description || "",
        subscriptionStatus: selectedClub.subscriptionStatus || "active",
      });
      setIsEditClubDialogOpen(true);
    }
  };

  const onEditClubSubmit = (data: EditClubFormData) => {
    if (selectedClub) {
      updateClubMutation.mutate({ id: selectedClub.id, clubData: data });
    }
  };

  if (clubsLoading || teamsLoading) {
    return (
      <MainLayout title="Club Management" subtitle="Manage club information and teams">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading club information...</div>
        </div>
      </MainLayout>
    );
  }

  if (!selectedClub) {
    return (
      <MainLayout title="Club Management" subtitle="Manage club information and teams">
        <div className="text-center py-12">
          <Landmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No club selected</h3>
          <p className="text-muted-foreground mb-4">
            Please select a club to manage.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Club Management" 
      subtitle="Manage club information, logo and status"
    >
      {/* Club Information Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {selectedClub.logoPath ? (
                <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  <img 
                    src={selectedClub.logoPath} 
                    alt={`${selectedClub.name} logo`} 
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <Landmark className="h-6 w-6 text-primary" />
              )}
              <span>{selectedClub.name}</span>
              <Badge variant="secondary">{selectedClub.shortName}</Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleEditClub}
              data-testid="button-edit-club"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Contact</h4>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Owner: {selectedClub.owner}</span>
              </div>
              {selectedClub.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedClub.phone}</span>
                </div>
              )}
              {selectedClub.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedClub.email}</span>
                </div>
              )}
              {selectedClub.website && (
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedClub.website}</span>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Location</h4>
              {selectedClub.address && (
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div>{selectedClub.address}</div>
                    {selectedClub.city && <div>{selectedClub.city}{selectedClub.state && `, ${selectedClub.state}`}</div>}
                    {selectedClub.country && <div>{selectedClub.country}</div>}
                  </div>
                </div>
              )}
              {selectedClub.established && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Est. {selectedClub.established}</span>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Club Info</h4>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{clubTeams.length} teams</span>
              </div>
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {selectedClub.subscriptionTier || 'Basic'} • {selectedClub.subscriptionStatus || 'Active'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Created: {selectedClub.createdAt ? new Date(selectedClub.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          {selectedClub.description && (
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{selectedClub.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Club Dialog */}
      <Dialog open={isEditClubDialogOpen} onOpenChange={setIsEditClubDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Club</DialogTitle>
          </DialogHeader>
          <Form {...editClubForm}>
            <form onSubmit={editClubForm.handleSubmit(onEditClubSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editClubForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Club Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter club name"
                          data-testid="input-edit-club-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editClubForm.control}
                  name="shortName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., PSC"
                          data-testid="input-edit-club-short-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editClubForm.control}
                name="owner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter club owner"
                        data-testid="input-edit-club-owner"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editClubForm.control}
                name="subscriptionStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Club Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-club-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editClubForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter address"
                          data-testid="input-edit-club-address"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editClubForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter city"
                          data-testid="input-edit-club-city"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editClubForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Phone number"
                          data-testid="input-edit-club-phone"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editClubForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="contact@club.com"
                          data-testid="input-edit-club-email"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editClubForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the club"
                        data-testid="input-edit-club-description"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditClubDialogOpen(false)}
                  data-testid="button-cancel-edit-club"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateClubMutation.isPending}
                  data-testid="button-submit-edit-club"
                >
                  {updateClubMutation.isPending ? "Updating..." : "Update Club"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

    </MainLayout>
  );
}