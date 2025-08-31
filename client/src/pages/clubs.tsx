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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Building2, Edit, Trash2, User, ArrowRight, MapPin, Phone, Mail, Upload } from "lucide-react";
import { Club, insertClubSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { z } from "zod";

// Create a schema with required name validation
const createClubSchema = insertClubSchema.extend({
  name: z.string().min(1, "Club name is required"),
});

type CreateClubFormData = z.infer<typeof createClubSchema>;

export default function Clubs() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: clubs, isLoading } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
  });

  const form = useForm<CreateClubFormData>({
    resolver: zodResolver(createClubSchema),
    defaultValues: {
      name: "",
      shortName: "",
      owner: "admin", // Default owner
      address: "",
      city: "",
      phone: "",
      email: "",
      description: "",
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
      phone: "",
      email: "",
      description: "",
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
    onSuccess: (updatedClub) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
      
      // Update the editingClub state so the UI immediately reflects the new logo
      if (editingClub && updatedClub?.logoPath) {
        setEditingClub({
          ...editingClub,
          logoPath: updatedClub.logoPath
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
    editForm.reset({
      name: club.name,
      shortName: club.shortName,
      owner: club.owner,
      address: club.address || "",
      city: club.city || "",
      phone: club.phone || "",
      email: club.email || "",
      description: club.description || "",
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Building2 className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-semibold">All Clubs</h2>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-club">
              <Plus className="h-4 w-4 mr-2" />
              Create Club
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Club</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <FormField
                  control={form.control}
                  name="owner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter club owner"
                          data-testid="input-club-owner"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
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
                </div>
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
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of the club"
                          data-testid="input-club-description"
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

      {/* Clubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs?.map((club) => (
          <Card key={club.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span>{club.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClub(club);
                    }}
                    data-testid={`button-edit-club-${club.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    data-testid={`button-delete-club-${club.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium bg-secondary px-2 py-1 rounded text-xs">
                    {club.shortName}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{club.owner}</span>
                </div>
                {club.address && (
                  <div className="flex items-start space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{club.address}{club.city && `, ${club.city}`}</span>
                  </div>
                )}
                {club.phone && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{club.phone}</span>
                  </div>
                )}
                {club.email && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{club.email}</span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Created: {club.createdAt ? new Date(club.createdAt).toLocaleDateString() : 'N/A'}
                </div>
                <div className="pt-2 border-t border-border">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setLocation(`/club-management?clubId=${club.id}`)}
                    data-testid={`button-manage-club-${club.id}`}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Manage Club
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {clubs?.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No clubs found</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first club.
          </p>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-first-club">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Club
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      )}

      {/* Edit Club Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Club</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
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
              <div className="grid grid-cols-2 gap-4">
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
              </div>
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
              <FormField
                control={editForm.control}
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
              
              {/* Logo Upload Section */}
              <div className="border-t pt-4">
                <FormLabel>Club Logo</FormLabel>
                <div className="flex items-center space-x-4 mt-2">
                  {editingClub?.logoPath && (
                    <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      <img 
                        src={editingClub.logoPath} 
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
                    buttonClassName="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {editingClub?.logoPath ? "Change Logo" : "Upload Logo"}
                  </ObjectUploader>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
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
    </MainLayout>
  );
}
