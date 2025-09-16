import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { User, UserTeam, Team } from "@shared/schema";
import { ArrowLeft, Star, Edit, Save, X, Pencil, Plus, Trash2, CalendarIcon } from "lucide-react";
import { ObjectUploader } from "@/components/ui/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { format, differenceInYears } from "date-fns";
import { useClub } from "@/contexts/club-context";
import { useTeam } from "@/contexts/team-context";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function UserDetails() {
  const [, params] = useRoute("/users/:id");
  const userId = params?.id;
  const { selectedClub } = useClub();
  const { teams } = useTeam();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<User>>({});
  const [pendingProfilePhoto, setPendingProfilePhoto] = useState<string | null>(null);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [squadNumber, setSquadNumber] = useState<number | undefined>(undefined);
  const [position, setPosition] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user", userId],
    enabled: !!userId,
  });

  // Get all teams for this user
  const { data: userTeams = [] } = useQuery<(UserTeam & { team: Team })[]>({
    queryKey: ["/api/user", userId, "teams"],
    enabled: !!userId
  });

  const updateUserMutation = useMutation({
    mutationFn: async (updatedData: Partial<User>) => {
      const response = await fetch(`/api/user/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) throw new Error('Failed to update user');
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }
      return {};
    },
    onSuccess: () => {
      setIsEditing(false);
      setEditData({});
      queryClient.invalidateQueries({ queryKey: ["/api/user", userId] });
      toast({
        title: "User Updated",
        description: "User information has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Failed to update user:', error);
      toast({
        title: "Error",
        description: "Failed to update user information.",
        variant: "destructive",
      });
    },
  });

  // Mutation to add user to a new team
  const addUserToTeamMutation = useMutation({
    mutationFn: async ({ teamId, squadNumber, position }: {
      teamId: string;
      squadNumber?: number;
      position?: string;
    }) => {
      const response = await fetch(`/api/user/${userId}/teams`, {
        method: 'POST',
        body: JSON.stringify({ teamId, squadNumber, position }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to add user to team');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user", userId, "teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/club", selectedClub?.id, "users"] });
      toast({
        title: "Team Added",
        description: "User has been successfully added to the team.",
      });
      setIsTeamDialogOpen(false);
      setSelectedTeamId("");
      setSquadNumber(undefined);
      setPosition("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add user to team. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to remove user from team
  const removeUserFromTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const response = await fetch(`/api/user/${userId}/teams/${teamId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to remove user from team');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user", userId, "teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/club", selectedClub?.id, "users"] });
      toast({
        title: "Team Removed",
        description: "User has been successfully removed from the team.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove user from team. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    setEditData(user || {});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleSave = () => {
    // Only send the fields we actually allow editing, excluding system timestamps
    const allowedFields = [
      'firstName', 'lastName', 'shirtName', 'dateOfBirth', 'gender', 
      'email', 'phone', 'role', 'status', 'avatarPath', 'headshotPath',
      'height', 'hometown', 'highSchool', 'classYear', 'bio'
    ];
    
    const dataToSave: Partial<User> = {};
    
    // Only include allowed fields that exist in editData
    allowedFields.forEach(field => {
      if (editData[field as keyof User] !== undefined) {
        const value = editData[field as keyof User];
        if (field === 'dateOfBirth' && value) {
          // Handle dateOfBirth specially - always convert to ISO string
          if (value instanceof Date) {
            (dataToSave as any).dateOfBirth = value.toISOString();
          } else if (typeof value === 'string') {
            // Convert date string to ISO string
            try {
              const date = new Date(value);
              (dataToSave as any).dateOfBirth = date.toISOString();
            } catch (e) {
              console.error('Invalid date format:', value);
            }
          }
        } else {
          (dataToSave as any)[field] = value;
        }
      }
    });
    
    console.log('Saving user data:', dataToSave);
    updateUserMutation.mutate(dataToSave);
  };

  const handleInputChange = (field: keyof User, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTeam = () => {
    if (selectedTeamId && !userTeams.some(ut => ut.teamId === selectedTeamId)) {
      addUserToTeamMutation.mutate({
        teamId: selectedTeamId,
        squadNumber,
        position: position || undefined
      });
    }
  };

  const handleRemoveTeam = (teamId: string) => {
    if (window.confirm('Are you sure you want to remove this user from the team?')) {
      removeUserFromTeamMutation.mutate(teamId);
    }
  };

  const getAvailableTeams = () => {
    // Filter teams to only those in the current club and not already assigned to user
    return teams.filter(team => 
      team.clubId === selectedClub?.id && 
      !userTeams.some(ut => ut.teamId === team.id)
    );
  };

  // Photo upload mutation
  const photoUploadMutation = useMutation({
    mutationFn: async (photoURL: string) => {
      const response = await fetch(`/api/user/${userId}/photo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoURL }),
      });
      if (!response.ok) throw new Error('Failed to update user photo');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user", userId] });
      setPendingProfilePhoto(null);
      toast({
        title: "Photo Updated",
        description: "Profile photo has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getPhotoUploadURL = async () => {
    const response = await fetch(`/api/user-photos/upload`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to get upload URL');
    const data = await response.json();
    return { method: 'PUT' as const, url: data.uploadURL };
  };

  const handlePhotoUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      if (uploadedFile.uploadURL) {
        setPendingProfilePhoto(uploadedFile.uploadURL);
        // Automatically save the photo
        photoUploadMutation.mutate(uploadedFile.uploadURL);
      }
    }
  };

  const getStatusColor = () => {
    if (!user) return 'bg-blue-500 text-white';
    const status = user.status || 'active';
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500 text-white';
      case 'inactive':
        return 'bg-gray-500 text-white';
      case 'suspended':
        return 'bg-red-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getRoleCategory = (role: string): string => {
    if (role?.toLowerCase().includes('admin')) return 'ADMIN';
    if (role?.toLowerCase().includes('coach')) return 'COACH';
    if (role?.toLowerCase().includes('player')) return 'PLAYER';
    return 'USER';
  };

  const getRoleColor = () => {
    if (!user) return 'bg-gray-100 text-gray-800';
    const roleCategory = getRoleCategory(user.role || 'player');
    switch (roleCategory) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'COACH':
        return 'bg-blue-100 text-blue-800';
      case 'PLAYER':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Loading..." subtitle="Loading user details...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading user details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout title="User Not Found" subtitle="The requested user could not be found">
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">The user you're looking for doesn't exist or has been deleted.</p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </MainLayout>
    );
  }

  const getUserInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const clubPrimaryColor = (selectedClub?.colors as any)?.primary || '#dc2626';
  
  const isLightColor = (hexColor: string) => {
    const color = hexColor.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 155;
  };

  const textColor = isLightColor(clubPrimaryColor) ? '#000000' : '#ffffff';
  
  const solidStyle = {
    backgroundColor: clubPrimaryColor,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  };

  return (
    <MainLayout 
      title="VIEW USER" 
      subtitle={`${user.firstName} ${user.lastName}`}
    >
      <div className="space-y-0" data-testid={`user-details-${user.id}`}>
        {/* User Header Card */}
        <Card className="max-w-3xl relative overflow-hidden border-2 shadow-2xl rounded-t-lg rounded-b-none" style={{...solidStyle, borderColor: clubPrimaryColor}}>
          <CardContent className="p-0">
            {/* Back Button Row */}
            <div className="px-6 py-1 flex justify-between items-center">
              <Button 
                variant="ghost" 
                onClick={() => window.history.back()}
                data-testid="button-back-to-users"
                className="text-white hover:bg-white/10"
                style={{ color: textColor }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              
              {!isEditing ? (
                <Button 
                  variant="ghost" 
                  onClick={handleEdit}
                  data-testid="button-edit-user"
                  className="text-white hover:bg-white/10"
                  style={{ color: textColor }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    onClick={handleSave}
                    disabled={updateUserMutation.isPending}
                    data-testid="button-save-user"
                    className="text-white hover:bg-white/10"
                    style={{ color: textColor }}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={handleCancel}
                    data-testid="button-cancel-edit"
                    className="text-white hover:bg-white/10"
                    style={{ color: textColor }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
            
            {/* User Info Section */}
            <div className="px-6 pt-2 pb-6">
              <div className="w-4/5 mx-auto">
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* User Avatar with Upload */}
                  <div className="relative group">
                    <Avatar className="h-24 w-24 bg-slate-600 text-white border-2 border-white/30">
                      {(pendingProfilePhoto || user.avatarPath) && (
                        <AvatarImage 
                          src={pendingProfilePhoto || user.avatarPath || ''} 
                          alt={`${user.firstName} ${user.lastName}`}
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback className="bg-slate-600 text-white text-xl font-semibold">
                        {getUserInitials(`${user.firstName} ${user.lastName}`)}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Photo Upload Button using ObjectUploader */}
                    <div className="absolute -bottom-1 -right-1 z-10">
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={5242880} // 5MB
                        onGetUploadParameters={getPhotoUploadURL}
                        onComplete={handlePhotoUploadComplete}
                        buttonClassName="bg-white border-2 border-white/30 rounded-full w-8 h-8 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity shadow-lg z-10 cursor-pointer [&_svg]:!w-3 [&_svg]:!h-3"
                      >
                        <Pencil className="!h-3 !w-3 text-gray-600" />
                      </ObjectUploader>
                    </div>
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1">
                    <div className="mb-3">
                      <div className="text-lg font-medium" style={{ color: textColor }}>{user.firstName}</div>
                      <div className="text-3xl font-bold" style={{ color: textColor }}>{user.lastName}</div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`text-xs px-2 py-1 ${getRoleColor()}`}>
                        {getRoleCategory(user.role || 'player')}
                      </Badge>
                      <Badge className={`text-xs px-2 py-1 ${getStatusColor()}`}>
                        {user.status || 'Active'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Club Logo */}
                <div className="flex-shrink-0 opacity-80">
                  <img 
                    src={selectedClub?.logoPath || "/assets/logos/polk-state-logo-transparent.png"} 
                    alt={selectedClub?.name || "Club Logo"} 
                    className="h-16 w-auto object-contain"
                  />
                </div>
              </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Details Tabs */}
        <Card className="max-w-3xl border-2 rounded-t-none rounded-b-lg" style={{borderColor: clubPrimaryColor}}>
          <CardContent className="p-0">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid grid-cols-4 w-full rounded-none border-b p-0" style={{backgroundColor: clubPrimaryColor}}>
                <TabsTrigger 
                  value="details" 
                  data-testid="tab-user-details"
                  className="data-[state=inactive]:text-white data-[state=inactive]:hover:text-white/80 data-[state=active]:!bg-card data-[state=active]:text-card-foreground rounded-t-lg rounded-b-none border-r p-0 h-12 px-4 shadow-none border-0"
                  style={{
                    backgroundColor: clubPrimaryColor,
                    boxShadow: 'none !important',
                    backgroundImage: 'none !important',
                    background: clubPrimaryColor + ' !important',
                    filter: 'none !important',
                    border: 'none !important',
                    outline: 'none !important',
                    textShadow: 'none !important',
                    WebkitBoxShadow: 'none !important',
                    MozBoxShadow: 'none !important',
                    WebkitFilter: 'none !important'
                  } as React.CSSProperties}
                >
                  User Details
                </TabsTrigger>
                <TabsTrigger 
                  value="teams" 
                  data-testid="tab-teams"
                  className="data-[state=inactive]:text-white data-[state=inactive]:hover:text-white/80 data-[state=active]:!bg-card data-[state=active]:text-card-foreground rounded-t-lg rounded-b-none p-0 h-12 px-4 shadow-none border-0"
                  style={{
                    backgroundColor: clubPrimaryColor,
                    boxShadow: 'none !important',
                    backgroundImage: 'none !important',
                    background: clubPrimaryColor + ' !important',
                    filter: 'none !important',
                    border: 'none !important',
                    outline: 'none !important',
                    textShadow: 'none !important',
                    WebkitBoxShadow: 'none !important',
                    MozBoxShadow: 'none !important',
                    WebkitFilter: 'none !important'
                  } as React.CSSProperties}
                >
                  Teams
                </TabsTrigger>
                <TabsTrigger 
                  value="bio" 
                  data-testid="tab-bio"
                  className="data-[state=inactive]:text-white data-[state=inactive]:hover:text-white/80 data-[state=active]:!bg-card data-[state=active]:text-card-foreground rounded-t-lg rounded-b-none p-0 h-12 px-4 shadow-none border-0"
                  style={{
                    backgroundColor: clubPrimaryColor,
                    boxShadow: 'none !important',
                    backgroundImage: 'none !important',
                    background: clubPrimaryColor + ' !important',
                    filter: 'none !important',
                    border: 'none !important',
                    outline: 'none !important',
                    textShadow: 'none !important',
                    WebkitBoxShadow: 'none !important',
                    MozBoxShadow: 'none !important',
                    WebkitFilter: 'none !important'
                  } as React.CSSProperties}
                >
                  Bio
                </TabsTrigger>
                <TabsTrigger 
                  value="photos" 
                  data-testid="tab-photos"
                  className="data-[state=inactive]:text-white data-[state=inactive]:hover:text-white/80 data-[state=active]:!bg-card data-[state=active]:text-card-foreground rounded-t-lg rounded-b-none p-0 h-12 px-4 shadow-none border-0"
                  style={{
                    backgroundColor: clubPrimaryColor,
                    boxShadow: 'none !important',
                    backgroundImage: 'none !important',
                    background: clubPrimaryColor + ' !important',
                    filter: 'none !important',
                    border: 'none !important',
                    outline: 'none !important',
                    textShadow: 'none !important',
                    WebkitBoxShadow: 'none !important',
                    MozBoxShadow: 'none !important',
                    WebkitFilter: 'none !important'
                  } as React.CSSProperties}
                >
                  Photos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="p-6 mt-0 min-h-[425px]">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">User Information</h3>
                    <div className="space-y-6">
                      {/* Row 1: First Name, Last Name, Shirt Name */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">First Name</label>
                          {isEditing ? (
                            <Input
                              value={editData.firstName || ''}
                              onChange={(e) => handleInputChange('firstName', e.target.value)}
                              data-testid="input-first-name"
                            />
                          ) : (
                            <p className="text-lg" data-testid={`text-first-name-${user.id}`}>
                              {user.firstName || 'Not provided'}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                          {isEditing ? (
                            <Input
                              value={editData.lastName || ''}
                              onChange={(e) => handleInputChange('lastName', e.target.value)}
                              data-testid="input-last-name"
                            />
                          ) : (
                            <p className="text-lg" data-testid={`text-last-name-${user.id}`}>
                              {user.lastName || 'Not provided'}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Shirt Name</label>
                          {isEditing ? (
                            <Input
                              value={editData.shirtName || ''}
                              onChange={(e) => handleInputChange('shirtName', e.target.value)}
                              data-testid="input-shirt-name"
                            />
                          ) : (
                            <p className="text-lg" data-testid={`text-shirt-name-${user.id}`}>
                              {user.shirtName || 'Not provided'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Row 2: Date of Birth, Age, Gender */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                          {isEditing ? (
                            <Input
                              type="date"
                              value={editData.dateOfBirth ? format(new Date(editData.dateOfBirth), 'yyyy-MM-dd') : ''}
                              onChange={(e) => handleInputChange('dateOfBirth', e.target.value ? new Date(e.target.value).toISOString() : null)}
                              max={format(new Date(), 'yyyy-MM-dd')}
                              min="1900-01-01"
                              className="[&::-webkit-calendar-picker-indicator]:dark:invert"
                              data-testid="input-date-of-birth"
                            />
                          ) : (
                            <p className="text-lg" data-testid={`text-date-of-birth-${user.id}`}>
                              {user.dateOfBirth 
                                ? `${format(new Date(user.dateOfBirth), "d MMM yyyy")}`
                                : "Not provided"
                              }
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Age</label>
                          <p className="text-lg" data-testid={`text-age-${user.id}`}>
                            {(() => {
                              const birthDate = isEditing && editData.dateOfBirth ? editData.dateOfBirth : user.dateOfBirth;
                              return birthDate 
                                ? differenceInYears(new Date(), new Date(birthDate))
                                : 'Not provided';
                            })()}
                          </p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Gender</label>
                          {isEditing ? (
                            <Select
                              value={editData.gender || user.gender || ''}
                              onValueChange={(value) => handleInputChange('gender', value)}
                            >
                              <SelectTrigger data-testid="select-gender">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-lg" data-testid={`text-gender-${user.id}`}>
                              {user.gender || 'Not set'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Separator */}
                      <div className="border-t border-gray-200 dark:border-gray-700"></div>

                      {/* Row 1: Email, Role, Account Status */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                          {isEditing ? (
                            <Input
                              value={editData.email || ''}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              type="email"
                              data-testid="input-email"
                            />
                          ) : (
                            <p className="text-lg" data-testid={`text-email-${user.id}`}>
                              {user.email || "Not provided"}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Role</label>
                          {isEditing ? (
                            <Select
                              value={editData.role || user.role || 'player'}
                              onValueChange={(value) => handleInputChange('role', value)}
                            >
                              <SelectTrigger data-testid="select-role">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="coach">Coach</SelectItem>
                                <SelectItem value="player">Player</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-lg" data-testid={`text-role-${user.id}`}>
                              {getRoleCategory(user.role || 'player')}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Account Status</label>
                          {isEditing ? (
                            <Select
                              value={editData.status || user.status || 'active'}
                              onValueChange={(value) => handleInputChange('status', value)}
                            >
                              <SelectTrigger data-testid="select-status">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div>
                              <Badge 
                                className={`text-sm px-3 py-1 ${getStatusColor()}`}
                                data-testid={`badge-account-status-${user.id}`}
                              >
                                {user.status || "Active"}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Row 2: Phone, Created, Last Update */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Phone</label>
                          {isEditing ? (
                            <Input
                              value={editData.phone || ''}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                              type="tel"
                              data-testid="input-phone"
                            />
                          ) : (
                            <p className="text-lg" data-testid={`text-phone-${user.id}`}>
                              {user.phone || "Not provided"}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Created</label>
                          <p className="text-lg" data-testid={`text-created-${user.id}`}>
                            {user.createdAt ? format(new Date(user.createdAt), 'd MMM yyyy') : 'N/A'}
                          </p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Last Update</label>
                          <p className="text-lg" data-testid={`text-updated-${user.id}`}>
                            {user.updatedAt ? format(new Date(user.updatedAt), 'd MMM yyyy') : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>


              <TabsContent value="teams" className="p-6 mt-0 min-h-[425px]">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Team Assignments</h3>
                    {getAvailableTeams().length > 0 && (
                      <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            data-testid="button-add-team"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Team
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add to Team</DialogTitle>
                            <DialogDescription>
                              Add this user to a team roster.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Select Team</label>
                              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                                <SelectTrigger data-testid="select-team">
                                  <SelectValue placeholder="Choose a team" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getAvailableTeams().map((team) => (
                                    <SelectItem key={team.id} value={team.id} data-testid={`option-team-${team.id}`}>
                                      {team.name} ({team.shortName})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Squad Number</label>
                                <Input
                                  type="number"
                                  placeholder="e.g. 1"
                                  value={squadNumber || ""}
                                  onChange={(e) => setSquadNumber(e.target.value ? parseInt(e.target.value) : undefined)}
                                  data-testid="input-squad-number"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Position</label>
                                <Select value={position} onValueChange={setPosition}>
                                  <SelectTrigger data-testid="select-position">
                                    <SelectValue placeholder="Select position" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Goalkeeper">Goalkeeper</SelectItem>
                                    <SelectItem value="Defender">Defender</SelectItem>
                                    <SelectItem value="Midfielder">Midfielder</SelectItem>
                                    <SelectItem value="Forward">Forward</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                onClick={() => setIsTeamDialogOpen(false)}
                                data-testid="button-cancel-team"
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={handleAddTeam}
                                disabled={!selectedTeamId || addUserToTeamMutation.isPending}
                                data-testid="button-add-to-team"
                              >
                                {addUserToTeamMutation.isPending ? "Adding..." : "Add to Team"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>

                  {/* Team Cards */}
                  <div className="space-y-3">
                    {userTeams.length > 0 ? (
                      userTeams.map((userTeam) => (
                        <Card 
                          key={userTeam.id} 
                          className="border-2" 
                          data-testid={`card-team-${userTeam.team.id}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div 
                                  className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold"
                                  style={{
                                    backgroundColor: clubPrimaryColor,
                                    color: textColor
                                  }}
                                >
                                  {userTeam.jerseyNumber || '?'}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="text-lg font-semibold" data-testid={`text-team-name-${userTeam.team.id}`}>
                                      {userTeam.team.name}
                                    </h4>
                                    <Badge 
                                      className={userTeam.team.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                                      data-testid={`badge-team-status-${userTeam.team.id}`}
                                    >
                                      {userTeam.team.status}
                                    </Badge>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-3">
                                      <div className="text-lg font-semibold text-gray-900" data-testid={`text-position-${userTeam.team.id}`}>
                                        {userTeam.position || 'Position not set'}
                                      </div>
                                      <Badge className="bg-blue-100 text-blue-800">
                                        {userTeam.fitnessStatus || 'Fit'}
                                      </Badge>
                                      {userTeam.starPlayer && (
                                        <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveTeam(userTeam.team.id)}
                                disabled={removeUserFromTeamMutation.isPending}
                                data-testid={`button-remove-team-${userTeam.team.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>This user is not assigned to any teams yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="bio" className="p-6 mt-0 min-h-[425px]">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Player Bio</h3>
                    <div className="space-y-6">
                      {/* Row 1: Height, Hometown, High School */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Height</label>
                          {isEditing ? (
                            <Input
                              value={editData.height || ''}
                              onChange={(e) => handleInputChange('height', e.target.value)}
                              placeholder="e.g., 5-7"
                              data-testid="input-height"
                            />
                          ) : (
                            <p className="text-lg" data-testid={`text-height-${user.id}`}>
                              {user.height || 'Not provided'}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Hometown</label>
                          {isEditing ? (
                            <Input
                              value={editData.hometown || ''}
                              onChange={(e) => handleInputChange('hometown', e.target.value)}
                              placeholder="e.g., Thornton, Colo."
                              data-testid="input-hometown"
                            />
                          ) : (
                            <p className="text-lg" data-testid={`text-hometown-${user.id}`}>
                              {user.hometown || 'Not provided'}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">High School</label>
                          {isEditing ? (
                            <Input
                              value={editData.highSchool || ''}
                              onChange={(e) => handleInputChange('highSchool', e.target.value)}
                              placeholder="e.g., Broomfield HS"
                              data-testid="input-high-school"
                            />
                          ) : (
                            <p className="text-lg" data-testid={`text-high-school-${user.id}`}>
                              {user.highSchool || 'Not provided'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Row 2: Class Year */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Class Year</label>
                          {isEditing ? (
                            <Select
                              value={editData.classYear || user.classYear || ''}
                              onValueChange={(value) => handleInputChange('classYear', value)}
                            >
                              <SelectTrigger data-testid="select-class-year">
                                <SelectValue placeholder="Select class year" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Freshman">Freshman</SelectItem>
                                <SelectItem value="Sophomore">Sophomore</SelectItem>
                                <SelectItem value="Junior">Junior</SelectItem>
                                <SelectItem value="Senior">Senior</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-lg" data-testid={`text-class-year-${user.id}`}>
                              {user.classYear || 'Not set'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Personal Bio - Full Width */}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Personal Bio</label>
                        {isEditing ? (
                          <textarea
                            value={editData.bio || ''}
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                            placeholder="Enter personal bio..."
                            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            data-testid="textarea-bio"
                          />
                        ) : (
                          <div className="text-sm whitespace-pre-wrap" data-testid={`text-bio-${user.id}`}>
                            {user.bio || 'No bio provided'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="photos" className="p-6 mt-0 min-h-[450px]">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Player Profile Photo</h3>
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center space-x-6">
                          <div className="flex-shrink-0">
                            <div className="max-w-[160px] border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                              {user.headshotPath ? (
                                <img 
                                  src={user.headshotPath} 
                                  alt={`${user.firstName} ${user.lastName} full length photo`}
                                  className="w-full h-auto object-contain"
                                  data-testid={`player-profile-photo-${user.id}`}
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-gray-400">
                                  <span className="text-xs text-center">No player photo</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground mb-3">
                              Upload a full-length player profile photo. This is used in the player profiles section and official team materials.
                            </p>
                            <Button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                              <span className="flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                Upload Player Photo
                              </span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}