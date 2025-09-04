import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Building2, Edit, Trash2, User, ArrowRight, MapPin, Phone, Mail, Upload, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Club, insertClubSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useClub } from "@/contexts/club-context";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { z } from "zod";

// Create a schema with required name validation and colors
const createClubSchema = insertClubSchema.extend({
  name: z.string().min(1, "Club name is required"),
  colors: z.object({
    primary: z.string().min(1, "Primary color is required"),
    secondary: z.string().optional(),
  }).optional(),
});

type CreateClubFormData = z.infer<typeof createClubSchema>;

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
const ClubStatsDisplay = ({ clubId, club }: { clubId: string; club: Club }) => {
  const { data: stats, isLoading } = useClubCardStats(clubId);
  const clubPrimaryColor = (club?.colors as any)?.primary || '#dc2626';
  
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
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-gray-900" data-testid={`text-club-players-${clubId}`}>
            {stats.players}
          </span>
          <span className="text-xs font-medium mt-1" style={{ color: clubPrimaryColor }}>Players</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-gray-900" data-testid={`text-club-teams-${clubId}`}>
            {stats.matches}
          </span>
          <span className="text-xs font-medium mt-1" style={{ color: clubPrimaryColor }}>Teams</span>
        </div>
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

export default function Clubs() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [isCreateOwnerDialogOpen, setIsCreateOwnerDialogOpen] = useState(false);
  const [newOwnerName, setNewOwnerName] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { clubs, isLoading, selectedClub, selectClub } = useClub();

  const form = useForm<CreateClubFormData>({
    resolver: zodResolver(createClubSchema),
    defaultValues: {
      name: "",
      shortName: "",
      owner: "admin", // Default owner
      address: "",
      city: "",
      state: "",
      country: "",
      phone: "",
      email: "",
      colors: {
        primary: "#dc2626", // Default red
        secondary: "#000000", // Default black
      },
    },
  });

  const editForm = useForm<CreateClubFormData>({
    resolver: zodResolver(createClubSchema),
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

  const createClubMutation = useMutation({
    mutationFn: async (clubData: CreateClubFormData) => {
      return apiRequest("POST", "/api/clubs", clubData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Club Created",
        description: "New club has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create club.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateClubFormData) => {
    createClubMutation.mutate(data);
  };

  const updateClubMutation = useMutation({
    mutationFn: async (data: { id: string; clubData: CreateClubFormData }) => {
      return apiRequest("PATCH", `/api/clubs/${data.id}`, data.clubData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
      setIsEditDialogOpen(false);
      setEditingClub(null);
      editForm.reset();
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

  const handleEditClub = (club: Club) => {
    setEditingClub(club);
    const clubColors = club.colors as { primary?: string; secondary?: string } | null;
    editForm.reset({
      name: club.name,
      shortName: club.shortName,
      owner: club.owner,
      address: club.address || "",
      city: club.city || "",
      state: club.state || "",
      country: club.country || "",
      phone: club.phone || "",
      email: club.email || "",
      subscriptionStatus: club.subscriptionStatus || "active",
      colors: {
        primary: clubColors?.primary || "#dc2626",
        secondary: clubColors?.secondary || "#000000",
      },
    });
    setIsEditDialogOpen(true);
  };

  const onEditSubmit = (data: CreateClubFormData) => {
    if (editingClub) {
      updateClubMutation.mutate({ id: editingClub.id, clubData: data });
    }
  };

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

  if (isLoading) {
    return (
      <MainLayout title="Clubs" subtitle="Manage all clubs in the system">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading clubs...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Clubs" subtitle="Manage all clubs in the system">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-end">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-black hover:bg-gray-100 border border-gray-300" data-testid="button-create-club">
                  <Landmark className="h-4 w-4 mr-2" />
                  Create Club
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Create New Club</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-sm">
                <div className="grid grid-cols-2 gap-8">
                  {/* Left Column - Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-4">BASIC INFORMATION</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Club Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter club name"
                                data-testid="input-club-name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="shortName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Short Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., PSC"
                                data-testid="input-club-short-name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="owner"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Owner</FormLabel>
                          <div className="flex gap-2">
                            <FormControl className="flex-1">
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <SelectTrigger data-testid="select-club-owner">
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
                              data-testid="button-add-owner-create"
                              className="shrink-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mt-6 mb-3">ADDRESS</h4>
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter address"
                              data-testid="input-club-address"
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
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter city"
                                data-testid="input-club-city"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State/County</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <SelectTrigger data-testid="select-club-state">
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
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <SelectTrigger data-testid="select-club-country">
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
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Phone number"
                                data-testid="input-club-phone"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="contact@club.com"
                                data-testid="input-club-email"
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
                  
                  {/* Right Column - Branding */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-4">BRANDING</h3>
                    
                    {/* Logo Upload Section */}
                    <div className="space-y-4">
                      <FormLabel>Club Logo</FormLabel>
                      <div className="flex flex-col items-center space-y-4">
                        <div className="h-24 w-24 bg-muted rounded-lg flex items-center justify-center border-2 border-gray-200">
                          <div className="text-gray-400 text-center">
                            <Upload className="h-8 w-8 mx-auto mb-1" />
                            <span className="text-xs">No logo</span>
                          </div>
                        </div>
                        <div className="w-full">
                          <Input
                            type="file"
                            accept="image/*"
                            className="w-full"
                            data-testid="input-club-logo"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Club Colors */}
                    <div className="space-y-4">
                      <FormLabel className="text-xs font-semibold text-gray-600 uppercase tracking-wide">CLUB COLORS</FormLabel>
                      <FormField
                        control={form.control}
                        name="colors.primary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Color</FormLabel>
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="color"
                                  className="w-12 h-10 p-1 border rounded cursor-pointer"
                                  data-testid="input-club-primary-color"
                                  {...field}
                                />
                                <Input
                                  type="text"
                                  placeholder="#dc2626"
                                  className="flex-1"
                                  data-testid="input-club-primary-color-text"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="colors.secondary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Secondary Color</FormLabel>
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="color"
                                  className="w-12 h-10 p-1 border rounded cursor-pointer"
                                  data-testid="input-club-secondary-color"
                                  {...field}
                                  value={field.value || "#000000"}
                                />
                                <Input
                                  type="text"
                                  placeholder="#000000"
                                  className="flex-1"
                                  data-testid="input-club-secondary-color-text"
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
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel-club"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createClubMutation.isPending}
                    data-testid="button-submit-club"
                  >
                    {createClubMutation.isPending ? "Creating..." : "Create Club"}
                  </Button>
                </div>
              </form>
            </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Clubs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clubs?.map((club) => {
          const isSelected = selectedClub?.id === club.id;
          const clubPrimaryColor = (club?.colors as any)?.primary || '#dc2626';
          return (
            <Card 
              key={club.id} 
              className={`hover:shadow-md transition-all cursor-pointer border-2 ${
                isSelected 
                  ? 'border-primary bg-primary/5 shadow-md' 
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => selectClub(club)}
              data-testid={`card-club-${club.id}`}
            >
            <CardContent className="p-6">
              {/* Header with Club Circle, Club Info, and Edit Button */}
              <div className="flex items-start justify-between mb-4">
                {/* Left side - Large Club Logo Circle */}
                <div className="flex items-start space-x-4">
                  <div className="h-16 w-16 rounded-full overflow-hidden flex items-center justify-center">
                    {club.logoPath ? (
                      <img 
                        src={club.logoPath} 
                        alt={`${club.name} logo`}
                        className="h-full w-full object-contain"
                        data-testid={`img-club-logo-${club.id}`}
                      />
                    ) : (
                      <div 
                        className="h-full w-full flex items-center justify-center text-lg font-bold text-white"
                        style={{ backgroundColor: clubPrimaryColor }}
                      >
                        {club.shortName || club.name.substring(0, 3).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  {/* Club Information */}
                  <div className="flex-1">
                    <h4 
                      className="text-xl font-bold mb-2" 
                      style={{ color: clubPrimaryColor }}
                      data-testid={`text-club-name-${club.id}`}
                    >
                      {club.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-1">
                      Owner: {club.owner}
                    </p>
                    <Badge 
                      className={club.subscriptionStatus === 'active' ? 'bg-green-500 text-white text-xs px-2 py-1' : 'bg-gray-500 text-white text-xs px-2 py-1'}
                      data-testid={`text-club-status-${club.id}`}
                    >
                      {club.subscriptionStatus === 'active' ? 'Active' : club.subscriptionStatus || 'Active'}
                    </Badge>
                  </div>
                </div>
                
                {/* Right side - Edit button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClub(club);
                  }}
                  data-testid={`button-edit-club-${club.id}`}
                  className="p-1 h-8 w-8"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Club Statistics - Full Width Centered */}
              <ClubStatsDisplay clubId={club.id} club={club} />
            </CardContent>
          </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {clubs?.length === 0 && (
        <div className="text-center py-12">
          <Landmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No clubs found</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first club.
          </p>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white text-black hover:bg-gray-100 border border-gray-300" data-testid="button-create-first-club">
                <Landmark className="h-4 w-4 mr-2" />
                Create Your First Club
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      )}
        </CardContent>
      </Card>

      {/* Edit Club Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Edit Club</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6 text-sm">
              <div className="grid grid-cols-2 gap-8">
                {/* Left Column - Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-4">BASIC INFORMATION</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
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
                      control={editForm.control}
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
                    control={editForm.control}
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
                    control={editForm.control}
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
                    control={editForm.control}
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
                      control={editForm.control}
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
                      control={editForm.control}
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
                    control={editForm.control}
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
                      control={editForm.control}
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
                      control={editForm.control}
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
                      control={editForm.control}
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
                      control={editForm.control}
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
                  onClick={() => setIsEditDialogOpen(false)}
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
                    editForm.setValue("owner", newOwnerName.trim());
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
