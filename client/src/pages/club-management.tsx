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
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
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
  colors: z.object({
    primary: z.string().min(1, "Primary color is required"),
    secondary: z.string().optional(),
  }).optional(),
});

type CreateTeamFormData = z.infer<typeof createTeamSchema>;
type EditClubFormData = z.infer<typeof editClubSchema>;

// Common data for dropdowns
const COMMON_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
  "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const COMMON_COUNTRIES = [
  "United States", "Canada", "United Kingdom", "Australia", "Germany", "France", "Spain", "Italy", "Netherlands", "Belgium",
  "Ireland", "Mexico", "Brazil", "Argentina", "Japan", "South Korea", "New Zealand", "South Africa", "India", "Other"
];

const SAMPLE_OWNERS = [
  "John Smith", "Sarah Johnson", "Michael Brown", "Emma Davis", "David Wilson", "Lisa Garcia", "Robert Martinez", "Jennifer Anderson"
];

// Club card statistics type
type ClubCardStats = {
  players: number;
  matches: number;
  processing: number;
};

// Hook to fetch club card statistics
const useClubCardStats = (clubId: string) => {
  return useQuery<ClubCardStats>({
    queryKey: ["/api/clubs", clubId, "card-stats"],
    enabled: !!clubId,
  });
};

// Club statistics display component
const ClubStatsDisplay = ({ clubId }: { clubId: string }) => {
  const { data: stats, isLoading } = useClubCardStats(clubId);
  const { selectedClub } = useClub();
  const clubPrimaryColor = (selectedClub?.colors as any)?.primary || '#dc2626';
  
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center">
            <div className="h-6 w-8 bg-gray-200 rounded animate-pulse mb-1"></div>
            <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-6 w-8 bg-gray-200 rounded animate-pulse mb-1"></div>
            <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-6 w-8 bg-gray-200 rounded animate-pulse mb-1"></div>
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="w-full">
      {/* Grid layout for perfect alignment - full width centered */}
      <div className="grid grid-cols-3 gap-4 text-center">
        {/* Column 1: Players */}
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-gray-900" data-testid={`text-club-players-${clubId}`}>
            {stats.players}
          </span>
          <span className="text-xs font-medium mt-1" style={{ color: clubPrimaryColor }}>Players</span>
        </div>
        
        {/* Column 2: Teams (labeled as Matches per request) */}
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-gray-900" data-testid={`text-club-teams-${clubId}`}>
            {stats.matches}
          </span>
          <span className="text-xs font-medium mt-1" style={{ color: clubPrimaryColor }}>Teams</span>
        </div>
        
        {/* Column 3: Total Fixtures (labeled as Processing) */}
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-gray-900" data-testid={`text-club-fixtures-${clubId}`}>
            {stats.processing}
          </span>
          <span className="text-xs font-medium mt-1" style={{ color: clubPrimaryColor }}>Fixtures</span>
        </div>
      </div>
    </div>
  );
};

export default function ClubManagement() {
  const [, setLocation] = useLocation();
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false);
  const [isEditClubDialogOpen, setIsEditClubDialogOpen] = useState(false);
  const [isCreateOwnerDialogOpen, setIsCreateOwnerDialogOpen] = useState(false);
  const [newOwnerName, setNewOwnerName] = useState("");
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const { toast } = useToast();
  const { selectTeam } = useTeam();
  const { selectedClub, clubs, isLoading: clubsLoading } = useClub();
  
  // Get club primary color for styling
  const clubPrimaryColor = (selectedClub?.colors as any)?.primary || '#dc2626';

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
      state: "",
      country: "",
      phone: "",
      email: "",
      subscriptionStatus: "",
      colors: {
        primary: "#dc2626", // Default red
        secondary: "#000000", // Default black
      },
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
      setEditingClub(selectedClub);
      const clubColors = selectedClub.colors as { primary?: string; secondary?: string } | null;
      editClubForm.reset({
        name: selectedClub.name,
        shortName: selectedClub.shortName,
        owner: selectedClub.owner,
        address: selectedClub.address || "",
        city: selectedClub.city || "",
        state: selectedClub.state || "",
        country: selectedClub.country || "",
        phone: selectedClub.phone || "",
        email: selectedClub.email || "",
        subscriptionStatus: selectedClub.subscriptionStatus || "active",
        colors: {
          primary: clubColors?.primary || "#dc2626",
          secondary: clubColors?.secondary || "#000000",
        },
      });
      setIsEditClubDialogOpen(true);
    }
  };

  const logoUploadMutation = useMutation({
    mutationFn: async (data: { id: string; logoURL: string }) => {
      return apiRequest("PUT", `/api/clubs/${data.id}/logo`, { logoURL: data.logoURL });
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
      
      // Update the editingClub state so the UI immediately reflects the new logo
      if (editingClub && response?.logoPath) {
        setEditingClub({
          ...editingClub,
          logoPath: response.logoPath
        });
      }
      
      toast({
        title: "Logo Updated",
        description: "Club logo has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update club logo.",
        variant: "destructive",
      });
    },
  });

  const handleLogoGetUploadParameters = async () => {
    const response = await fetch("/api/objects/upload", {
      method: "POST",
    });
    const { uploadURL } = await response.json();
    return {
      method: "PUT" as const,
      url: uploadURL,
    };
  };

  const handleLogoUploadComplete = (result: { successful: Array<{ uploadURL: string }> }) => {
    if (result.successful && result.successful[0]?.uploadURL && editingClub) {
      logoUploadMutation.mutate({
        id: editingClub.id,
        logoURL: result.successful[0].uploadURL,
      });
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
      {/* Club Information Card - Team Card Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card className="border-2 hover:shadow-md transition-all">
        <CardContent className="p-6">
          {/* Header with Club Circle, Club Info, and Edit Button */}
          <div className="flex items-start justify-between mb-4">
            {/* Left side - Large Club Logo Circle */}
            <div className="flex items-start space-x-4">
              <div className="h-16 w-16 rounded-full overflow-hidden flex items-center justify-center">
                {selectedClub.logoPath ? (
                  <img 
                    src={selectedClub.logoPath} 
                    alt={`${selectedClub.name} logo`}
                    className="h-full w-full object-contain"
                    data-testid={`img-club-logo-${selectedClub.id}`}
                  />
                ) : (
                  <div 
                    className="h-full w-full flex items-center justify-center text-lg font-bold text-white"
                    style={{ backgroundColor: clubPrimaryColor }}
                  >
                    {selectedClub.shortName || selectedClub.name.substring(0, 3).toUpperCase()}
                  </div>
                )}
              </div>
              
              {/* Club Information */}
              <div className="flex-1">
                <h4 
                  className="text-xl font-bold mb-2" 
                  style={{ color: clubPrimaryColor }}
                  data-testid={`text-club-name-${selectedClub.id}`}
                >
                  {selectedClub.name}
                </h4>
                <p className="text-sm text-gray-600 mb-1">
                  Owner: {selectedClub.owner}
                </p>
                <Badge 
                  className={selectedClub.subscriptionStatus === 'active' ? 'bg-green-500 text-white text-xs px-2 py-1' : 'bg-gray-500 text-white text-xs px-2 py-1'}
                  data-testid={`text-club-status-${selectedClub.id}`}
                >
                  {selectedClub.subscriptionStatus === 'active' ? 'Active' : selectedClub.subscriptionStatus || 'Active'}
                </Badge>
              </div>
            </div>
            
            {/* Right side - Edit button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditClub}
              data-testid="button-edit-club"
              className="p-1 h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Club Statistics - Full Width Centered */}
          <ClubStatsDisplay clubId={selectedClub.id} />
        </CardContent>
        </Card>
      </div>

      {/* Edit Club Dialog */}
      <Dialog open={isEditClubDialogOpen} onOpenChange={setIsEditClubDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Edit Club</DialogTitle>
          </DialogHeader>
          <Form {...editClubForm}>
            <form onSubmit={editClubForm.handleSubmit(onEditClubSubmit)} className="space-y-6 text-sm">
              <div className="grid grid-cols-2 gap-8">
                {/* Left Column - Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-4">BASIC INFORMATION</h3>
                  
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
                        <div className="flex gap-2">
                          <FormControl className="flex-1">
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <SelectTrigger data-testid="select-edit-club-owner">
                                <SelectValue placeholder="Select owner" />
                              </SelectTrigger>
                              <SelectContent>
                                {SAMPLE_OWNERS.map((owner) => (
                                  <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setIsCreateOwnerDialogOpen(true)}
                            data-testid="button-add-owner"
                            className="shrink-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
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
                  
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mt-6 mb-3">ADDRESS</h4>
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
                  
                  <div className="grid grid-cols-2 gap-4">
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
                    <FormField
                      control={editClubForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State/County</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <SelectTrigger data-testid="select-edit-club-state">
                                <SelectValue placeholder="Select state/county" />
                              </SelectTrigger>
                              <SelectContent>
                                {COMMON_STATES.map((state) => (
                                  <SelectItem key={state} value={state}>{state}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={editClubForm.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <SelectTrigger data-testid="select-edit-club-country">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              {COMMON_COUNTRIES.map((country) => (
                                <SelectItem key={country} value={country}>{country}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mt-6 mb-3">CONTACT INFORMATION</h4>
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
                </div>
                
                {/* Right Column - Logo and Colors */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-4">BRANDING</h3>
                  
                  {/* Logo Upload Section */}
                  <div className="space-y-4">
                    <FormLabel>Club Logo</FormLabel>
                    <div className="flex flex-col items-center space-y-4">
                      {editingClub?.logoPath && (
                        <div className="h-24 w-24 bg-muted rounded-lg flex items-center justify-center overflow-hidden border-2 border-gray-200">
                          <img 
                            src={editingClub?.logoPath || ''} 
                            alt="Current logo" 
                            className="h-full w-full object-contain"
                          />
                        </div>
                      )}
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={5242880}
                        onGetUploadParameters={handleLogoGetUploadParameters}
                        onComplete={handleLogoUploadComplete}
                        buttonClassName="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {editingClub?.logoPath ? "Change Logo" : "Upload Logo"}
                      </ObjectUploader>
                    </div>
                  </div>
                  
                  {/* Club Colors */}
                  <div className="space-y-4">
                    <FormLabel className="text-xs font-semibold text-gray-600 uppercase tracking-wide">CLUB COLORS</FormLabel>
                    <FormField
                      control={editClubForm.control}
                      name="colors.primary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Color</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="color"
                                className="w-12 h-10 p-1 border rounded cursor-pointer"
                                data-testid="input-edit-club-primary-color"
                                {...field}
                              />
                              <Input
                                type="text"
                                placeholder="#dc2626"
                                className="flex-1"
                                data-testid="input-edit-club-primary-color-text"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editClubForm.control}
                      name="colors.secondary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secondary Color</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="color"
                                className="w-12 h-10 p-1 border rounded cursor-pointer"
                                data-testid="input-edit-club-secondary-color"
                                {...field}
                                value={field.value || "#000000"}
                              />
                              <Input
                                type="text"
                                placeholder="#000000"
                                className="flex-1"
                                data-testid="input-edit-club-secondary-color-text"
                                {...field}
                                value={field.value || ""}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-6 border-t">
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

      {/* Create Owner Dialog */}
      <Dialog open={isCreateOwnerDialogOpen} onOpenChange={setIsCreateOwnerDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add New Owner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <FormLabel>Owner Name</FormLabel>
              <Input
                placeholder="Enter owner name"
                value={newOwnerName}
                onChange={(e) => setNewOwnerName(e.target.value)}
                data-testid="input-new-owner-name"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateOwnerDialogOpen(false);
                  setNewOwnerName("");
                }}
                data-testid="button-cancel-new-owner"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (newOwnerName.trim()) {
                    // Add to the list and select it
                    SAMPLE_OWNERS.push(newOwnerName.trim());
                    editClubForm.setValue("owner", newOwnerName.trim());
                    setIsCreateOwnerDialogOpen(false);
                    setNewOwnerName("");
                  }
                }}
                disabled={!newOwnerName.trim()}
                data-testid="button-add-new-owner"
              >
                Add Owner
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </MainLayout>
  );
}