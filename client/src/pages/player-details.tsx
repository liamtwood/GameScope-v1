import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Player, Team, PlayerTeam } from "@shared/schema";
import { ArrowLeft, Star, Edit, Save, X, Pencil, Users, Plus } from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { useClub } from "@/contexts/club-context";
import { useTeam } from "@/contexts/team-context";
import { useToast } from "@/hooks/use-toast";
import ashleyMillerPhoto from "@assets/image_1756910395408.png";

export default function PlayerDetails() {
  const [, params] = useRoute("/players/:id");
  const playerId = params?.id;
  const { selectedClub } = useClub();
  const { teams } = useTeam();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Player>>({});
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [squadNumber, setSquadNumber] = useState<number | undefined>(undefined);
  const [position, setPosition] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: player, isLoading } = useQuery<Player>({
    queryKey: ["/api/player", playerId],
    enabled: !!playerId,
  });

  // Get all teams for this player
  const { data: playerTeams = [] } = useQuery<(PlayerTeam & { team: Team })[]>({
    queryKey: ["/api/player", player?.id, "teams"],
    enabled: !!player?.id
  });

  // Get primary team (for backwards compatibility)
  const primaryTeam = playerTeams.find(pt => pt.isPrimary)?.team || playerTeams[0]?.team;

  const updatePlayerMutation = useMutation({
    mutationFn: async (updatedData: Partial<Player>) => {
      const response = await fetch(`/api/player/${playerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) throw new Error('Failed to update player');
      
      // Handle empty response or parse JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }
      return {}; // Return empty object if no JSON content
    },
    onSuccess: () => {
      // Exit editing mode immediately for better user experience
      setIsEditing(false);
      setEditData({});
      // Then invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/player", playerId] });
    },
    onError: (error) => {
      console.error('Failed to update player:', error);
      // Keep in editing mode if there's an error
    },
  });

  // Mutation to add player to a new team
  const addPlayerToTeamMutation = useMutation({
    mutationFn: async ({ teamId, isPrimary, squadNumber, position }: {
      teamId: string;
      isPrimary: boolean;
      squadNumber?: number;
      position?: string;
    }) => {
      const response = await fetch(`/api/player/${playerId}/teams`, {
        method: 'POST',
        body: JSON.stringify({ teamId, isPrimary, squadNumber, position }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to add player to team');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player", playerId, "teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: "Team Added",
        description: "Player has been successfully added to the team.",
      });
      setIsTeamDialogOpen(false);
      setSelectedTeamId("");
      setSquadNumber(undefined);
      setPosition("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add player to team. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to remove player from team
  const removePlayerFromTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const response = await fetch(`/api/player/${playerId}/teams/${teamId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to remove player from team');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player", playerId, "teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: "Team Removed",
        description: "Player has been successfully removed from the team.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove player from team. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddTeam = () => {
    if (selectedTeamId && !playerTeams.some(pt => pt.teamId === selectedTeamId)) {
      addPlayerToTeamMutation.mutate({
        teamId: selectedTeamId,
        isPrimary: playerTeams.length === 0,
        squadNumber,
        position: position || undefined
      });
    }
  };

  const handleRemoveTeam = (teamId: string) => {
    removePlayerFromTeamMutation.mutate(teamId);
  };

  const getAvailableTeams = () => {
    // Filter teams to only those in the current club and not already assigned to player
    return teams.filter(team => 
      team.clubId === selectedClub?.id && 
      !playerTeams.some(pt => pt.teamId === team.id)
    );
  };

  const calculateAge = (dateOfBirth: string | Date | null) => {
    if (!dateOfBirth) return null;
    return differenceInYears(new Date(), new Date(dateOfBirth));
  };

  const age = player?.dateOfBirth ? calculateAge(player.dateOfBirth) : null;

  const handleEdit = () => {
    setEditData(player || {});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleSave = () => {
    updatePlayerMutation.mutate(editData);
  };

  const handleInputChange = (field: keyof Player, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Create a local URL for preview
      const photoUrl = URL.createObjectURL(file);
      setUploadedPhoto(photoUrl);
      
      toast({
        title: "Photo Updated",
        description: "Photo has been updated locally. Note: This is just a preview - full upload functionality would need backend support.",
      });
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const getStatusColor = () => {
    if (!player) return 'bg-blue-500 text-white';
    switch (player.status) {
      case 'Fit':
        return 'bg-green-500 text-white';
      case 'Injured':
        return 'bg-red-500 text-white';
      case 'Retired':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getAccountStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Suspended": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "Retired": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default: return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"; // Draft
    }
  };

  const getPositionCategory = (position: string): string => {
    if (position.includes('GK') || position.includes('Goalkeeper')) return 'GK';
    if (position.includes('CB') || position.includes('LB') || position.includes('RB') || 
        position.includes('LWB') || position.includes('RWB') || position.includes('Defense')) return 'DEF';
    if (position.includes('CM') || position.includes('CDM') || position.includes('CAM') || 
        position.includes('LM') || position.includes('RM') || position.includes('Midfield')) return 'MID';
    if (position.includes('ST') || position.includes('CF') || position.includes('LW') || 
        position.includes('RW') || position.includes('Forward')) return 'FWD';
    return position;
  };

  const getPositionColor = () => {
    if (!player) return 'bg-gray-100 text-gray-800';
    const positionCategory = getPositionCategory(player.position);
    switch (positionCategory) {
      case 'GK':
        return 'bg-purple-100 text-purple-800';
      case 'DEF':
        return 'bg-blue-100 text-blue-800';
      case 'MID':
        return 'bg-green-100 text-green-800';
      case 'FWD':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Loading..." subtitle="Loading player details...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading player details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!player) {
    return (
      <MainLayout title="Player Not Found" subtitle="The requested player could not be found">
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">The player you're looking for doesn't exist or has been deleted.</p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </MainLayout>
    );
  }

  const getPlayerInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get club's primary color, fallback to default if not set
  const clubPrimaryColor = (selectedClub?.colors as any)?.primary || '#dc2626';
  
  // Function to determine if a color is light or dark for text contrast
  const isLightColor = (hexColor: string) => {
    const color = hexColor.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 155;
  };

  const textColor = isLightColor(clubPrimaryColor) ? '#000000' : '#ffffff';
  const labelColor = isLightColor(clubPrimaryColor) ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)';
  
  // Create gradient background style
  const gradientStyle = {
    background: `linear-gradient(to right, ${clubPrimaryColor}, ${clubPrimaryColor}88)`,
  };

  return (
    <MainLayout 
      title="VIEW SQUAD MEMBER" 
      subtitle={`${player.firstName} ${player.lastName}`}
    >
      <div className="space-y-6" data-testid={`player-details-${player.id}`}>
        {/* Player Header Card with Integrated Tabs */}
        <Tabs defaultValue="details" className="w-full">
          <Card className="border border-gray-200 max-w-3xl relative overflow-hidden shadow-lg" style={gradientStyle}>
            <CardContent className="p-0">
              {/* Back Button Row */}
              <div className="px-6 py-1 flex justify-between items-center">
                <Button 
                  variant="ghost" 
                  onClick={() => window.history.back()}
                  data-testid="button-back-to-squad"
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
                    data-testid="button-edit-player"
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
                      disabled={updatePlayerMutation.isPending}
                      data-testid="button-save-player"
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
              
              {/* Player Info Section */}
              <div className="px-6 pt-2 pb-6">
                <div className="w-4/5 mx-auto">
                  <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Player Avatar with Upload */}
                    <div className="relative group">
                      <Avatar className="h-24 w-24 bg-slate-600 text-white border-2 border-white/30">
                        {uploadedPhoto ? (
                          <AvatarImage 
                            src={uploadedPhoto} 
                            alt={`${player.firstName} ${player.lastName}`}
                            className="object-cover"
                          />
                        ) : player.id === "56dcc07f-3534-43fd-8f46-a6c6209c40fa" ? (
                          <AvatarImage 
                            src={ashleyMillerPhoto} 
                            alt={`${player.firstName} ${player.lastName}`}
                            className="object-cover"
                          />
                        ) : null}
                        <AvatarFallback className="bg-slate-600 text-white text-xl font-semibold">
                          {getPlayerInitials(`${player.firstName} ${player.lastName}`)}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Photo Upload Button */}
                      <button
                        onClick={handlePhotoClick}
                        className="absolute -bottom-1 -right-1 bg-white border-2 border-white/30 rounded-full p-2 opacity-80 hover:opacity-100 transition-opacity shadow-lg"
                        data-testid="button-upload-photo"
                        aria-label="Upload photo"
                      >
                        <Pencil className="h-3 w-3 text-gray-600" />
                      </button>
                      
                      {/* Hidden File Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        data-testid="input-photo-upload"
                      />
                    </div>
                    
                    {/* Player Info */}
                    <div className="flex-1">
                      <div className="mb-3">
                        <div className="text-lg font-medium" style={{ color: textColor }}>{player.firstName}</div>
                        <div className="text-3xl font-bold" style={{ color: textColor }}>{player.lastName}</div>
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
              
              {/* Tabs integrated into the card */}
              <div className="px-6 pb-4 border-t border-white/20">
                <div className="pt-4">
                  <TabsList className="grid grid-cols-3 w-full bg-transparent border-none p-0 h-auto">
                    <TabsTrigger 
                      value="details" 
                      data-testid="tab-details" 
                      className="relative bg-transparent border-none shadow-none border-b-3 border-transparent data-[state=active]:bg-white/10 data-[state=active]:shadow-none data-[state=active]:border-b-3 data-[state=active]:border-white data-[state=active]:font-semibold hover:bg-white/5 hover:border-b-3 hover:border-white/60 hover:font-medium transition-all duration-300 px-4 py-3 rounded-none group"
                      style={{ color: textColor }}
                    >
                      <span className="relative z-10">Player Details</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="teams" 
                      data-testid="tab-teams" 
                      className="relative bg-transparent border-none shadow-none border-b-3 border-transparent data-[state=active]:bg-white/10 data-[state=active]:shadow-none data-[state=active]:border-b-3 data-[state=active]:border-white data-[state=active]:font-semibold hover:bg-white/5 hover:border-b-3 hover:border-white/60 hover:font-medium transition-all duration-300 px-4 py-3 rounded-none group"
                      style={{ color: textColor }}
                    >
                      <span className="relative z-10">Teams</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="parents" 
                      data-testid="tab-parents" 
                      className="relative bg-transparent border-none shadow-none border-b-3 border-transparent data-[state=active]:bg-white/10 data-[state=active]:shadow-none data-[state=active]:border-b-3 data-[state=active]:border-white data-[state=active]:font-semibold hover:bg-white/5 hover:border-b-3 hover:border-white/60 hover:font-medium transition-all duration-300 px-4 py-3 rounded-none group"
                      style={{ color: textColor }}
                    >
                      <span className="relative z-10">Parents</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>
              
              {/* Player Details Content integrated into the same card */}
              <TabsContent value="details" className="m-0">
                <div className="bg-white px-6 pb-6 space-y-3 border-t border-white/10 rounded-b-lg">
                  <div className="pt-4">
                    
                    {/* Section Header */}
                    <div className="w-4/5 mx-auto">
                      <div className="pt-2">
                        <h4 className="text-[10px] font-medium uppercase tracking-wide mb-2" style={{ color: clubPrimaryColor }}>Team Information</h4>
                        <div className="w-full h-px mb-0" style={{ backgroundColor: clubPrimaryColor }}></div>
                      </div>
                    </div>

                    {/* Team & Position Info */}
                    <div className="w-4/5 mx-auto">
                      <div className="grid grid-cols-3 gap-x-8 gap-y-3">
                        <div className="px-2 py-1">
                          <label className="text-[10px] font-medium text-muted-foreground tracking-wide">Jersey number</label>
                          <div className="mt-0.5">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editData.jerseyNumber || ''}
                                onChange={(e) => handleInputChange('jerseyNumber', e.target.value)}
                                className="h-6 text-sm font-semibold"
                                data-testid={`input-jersey-number-${player.id}`}
                              />
                            ) : (
                              <span className="text-sm font-semibold text-gray-900" data-testid={`text-jersey-number-${player.id}`}>
                                {player.jerseyNumber}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="px-2 py-1">
                          <label className="text-[10px] font-medium text-muted-foreground tracking-wide">Position</label>
                          <div className="mt-0.5">
                            {isEditing ? (
                              <Select
                                value={editData.position || ''}
                                onValueChange={(value) => handleInputChange('position', value)}
                              >
                                <SelectTrigger className="h-6 text-sm font-semibold" data-testid={`select-position-${player.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Goalkeeper">Goalkeeper</SelectItem>
                                  <SelectItem value="Defender">Defender</SelectItem>
                                  <SelectItem value="Midfielder">Midfielder</SelectItem>
                                  <SelectItem value="Forward">Forward</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-sm font-semibold text-gray-900" data-testid={`text-position-${player.id}`}>
                                {player.position}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="px-2 py-1">
                          <label className="text-[10px] font-medium text-muted-foreground tracking-wide">Status</label>
                          <div className="mt-0.5">
                            {isEditing ? (
                              <Select
                                value={editData.status || ''}
                                onValueChange={(value) => handleInputChange('status', value)}
                              >
                                <SelectTrigger className="h-6 text-sm font-semibold" data-testid={`select-status-${player.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Fit">Fit</SelectItem>
                                  <SelectItem value="Injured">Injured</SelectItem>
                                  <SelectItem value="Suspended">Suspended</SelectItem>
                                  <SelectItem value="Retired">Retired</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-sm font-semibold text-gray-900" data-testid={`text-status-${player.id}`}>
                                {player.status || 'Fit'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section Header */}
                    <div className="w-4/5 mx-auto">
                      <div className="pt-2">
                        <h4 className="text-[10px] font-medium uppercase tracking-wide mb-2" style={{ color: clubPrimaryColor }}>Name Information</h4>
                        <div className="w-full h-px mb-0" style={{ backgroundColor: clubPrimaryColor }}></div>
                      </div>
                    </div>

                    {/* Name Info */}
                    <div className="w-4/5 mx-auto">
                      <div className="grid grid-cols-3 gap-x-8 gap-y-3">
                        <div className="px-2 py-1">
                          <label className="text-[10px] font-medium text-muted-foreground tracking-wide">First name</label>
                          <div className="mt-0.5">
                            {isEditing ? (
                              <Input
                                value={editData.firstName || ''}
                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                                className="h-6 text-sm font-semibold"
                                data-testid={`input-first-name-${player.id}`}
                              />
                            ) : (
                              <span className="text-sm font-semibold text-gray-900" data-testid={`text-first-name-${player.id}`}>
                                {player.firstName || "Not provided"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="px-2 py-1">
                          <label className="text-[10px] font-medium text-muted-foreground tracking-wide">Last name</label>
                          <div className="mt-0.5">
                            {isEditing ? (
                              <Input
                                value={editData.lastName || ''}
                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                                className="h-6 text-sm font-semibold"
                                data-testid={`input-last-name-${player.id}`}
                              />
                            ) : (
                              <span className="text-sm font-semibold text-gray-900" data-testid={`text-last-name-${player.id}`}>
                                {player.lastName || "Not provided"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="px-2 py-1">
                          <label className="text-[10px] font-medium text-muted-foreground tracking-wide">Shirt name</label>
                          <div className="mt-0.5">
                            <span className="text-sm font-semibold text-gray-900" data-testid={`text-shirt-name-${player.id}`}>
                              {player.lastName || "Not provided"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section Header */}
                    <div className="w-4/5 mx-auto">
                      <div className="pt-2">
                        <h4 className="text-[10px] font-medium uppercase tracking-wide mb-2" style={{ color: clubPrimaryColor }}>Personal Information</h4>
                        <div className="w-full h-px mb-0" style={{ backgroundColor: clubPrimaryColor }}></div>
                      </div>
                    </div>

                    {/* Personal Info */}
                    <div className="w-4/5 mx-auto">
                      <div className="grid grid-cols-3 gap-x-8 gap-y-3 border-t border-white/20">
                        <div className="px-2 py-1">
                          <label className="text-[10px] font-medium text-muted-foreground tracking-wide">Date of birth</label>
                          <div className="mt-0.5">
                            {isEditing ? (
                              <Input
                                type="date"
                                value={editData.dateOfBirth ? new Date(editData.dateOfBirth).toISOString().split('T')[0] : ''}
                                onChange={(e) => handleInputChange('dateOfBirth', e.target.value ? new Date(e.target.value) : null)}
                                className="h-6 text-sm font-semibold"
                                data-testid={`input-date-of-birth-${player.id}`}
                              />
                            ) : (
                              <span className="text-sm font-semibold text-gray-900" data-testid={`text-date-of-birth-${player.id}`}>
                                {player.dateOfBirth 
                                  ? format(new Date(player.dateOfBirth), "d MMM yyyy")
                                  : "Not provided"
                                }
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="px-2 py-1">
                          <label className="text-[10px] font-medium text-muted-foreground tracking-wide">Age</label>
                          <div className="mt-0.5">
                            <span className="text-sm font-semibold text-gray-900" data-testid={`text-age-${player.id}`}>
                              {age ? `${age} years old` : "Not available"}
                            </span>
                          </div>
                        </div>
                        <div className="px-2 py-1">
                          <label className="text-[10px] font-medium text-muted-foreground tracking-wide">Gender</label>
                          <div className="mt-0.5">
                            {isEditing ? (
                              <Select value={editData.gender || ''} onValueChange={(value) => handleInputChange('gender', value)}>
                                <SelectTrigger className="h-6 text-sm font-semibold" data-testid={`select-gender-${player.id}`}>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Male">Male</SelectItem>
                                  <SelectItem value="Female">Female</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-sm font-semibold text-gray-900" data-testid={`text-gender-${player.id}`}>
                                {player.gender || "Not set"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section Header */}
                    <div className="w-4/5 mx-auto">
                      <div className="pt-2">
                        <h4 className="text-[10px] font-medium uppercase tracking-wide mb-2" style={{ color: clubPrimaryColor }}>Contact Information</h4>
                        <div className="w-full h-px mb-0" style={{ backgroundColor: clubPrimaryColor }}></div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="w-4/5 mx-auto">
                      <div className="grid grid-cols-3 gap-x-8 gap-y-3 border-t border-white/20">
                        <div className="px-2 py-1">
                          <label className="text-[10px] font-medium text-muted-foreground tracking-wide">Email</label>
                          <div className="mt-0.5">
                            {isEditing ? (
                              <Input
                                type="email"
                                value={editData.email || ''}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className="h-6 text-sm font-semibold"
                                data-testid={`input-email-${player.id}`}
                              />
                            ) : (
                              <span className="text-sm font-semibold text-gray-900" data-testid={`text-email-${player.id}`}>
                                {player.email || "Not provided"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="px-2 py-1">
                          <label className="text-[10px] font-medium text-muted-foreground tracking-wide">Phone number</label>
                          <div className="mt-0.5">
                            {isEditing ? (
                              <Input
                                type="tel"
                                value={editData.phone || ''}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                className="h-6 text-sm font-semibold"
                                data-testid={`input-phone-${player.id}`}
                              />
                            ) : (
                              <span className="text-sm font-semibold text-gray-900" data-testid={`text-phone-${player.id}`}>
                                {player.phone || "Not provided"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="px-2 py-1">
                          <label className="text-[10px] font-medium text-muted-foreground tracking-wide">Emergency contact</label>
                          <div className="mt-0.5">
                            {isEditing ? (
                              <Input
                                value={editData.emergencyContact || ''}
                                onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                                className="h-6 text-sm font-semibold"
                                placeholder="Name and phone number"
                                data-testid={`input-emergency-contact-${player.id}`}
                              />
                            ) : (
                              <span className="text-sm font-semibold text-gray-900" data-testid={`text-emergency-contact-${player.id}`}>
                                {player.emergencyContact || "Not provided"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Teams Tab Content */}
              <TabsContent value="teams" className="m-0">
                <div className="bg-white px-6 pb-6 space-y-3 border-t border-white/10 rounded-b-lg">
                  <div className="pt-4">
                    <div className="w-4/5 mx-auto">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-medium text-gray-900">Team Assignments</h4>
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
                                      disabled={!selectedTeamId || addPlayerToTeamMutation.isPending}
                                      data-testid="button-add-to-team"
                                    >
                                      {addPlayerToTeamMutation.isPending ? "Adding..." : "Add to Team"}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>

                        {/* Team Cards */}
                        <div className="space-y-3">
                          {playerTeams.length > 0 ? (
                            playerTeams.map((playerTeam) => (
                              <Card 
                                key={playerTeam.id} 
                                className={`border-2 ${playerTeam.isPrimary ? 'border-primary' : ''}`} 
                                data-testid={`card-team-${playerTeam.team.id}`}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                      <div className="h-12 w-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                                        <Users className="h-6 w-6" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                          <h4 className="text-lg font-semibold" data-testid={`text-team-name-${playerTeam.team.id}`}>
                                            {playerTeam.team.name}
                                          </h4>
                                          {playerTeam.isPrimary && (
                                            <Badge variant="default" data-testid={`badge-primary-team-${playerTeam.team.id}`}>
                                              Primary
                                            </Badge>
                                          )}
                                          <Badge 
                                            className={playerTeam.team.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                                            data-testid={`badge-team-status-${playerTeam.team.id}`}
                                          >
                                            {playerTeam.team.status}
                                          </Badge>
                                        </div>
                                        <div className="space-y-2">
                                          <div className="flex items-center space-x-3">
                                            <div className="text-2xl font-bold text-primary" data-testid={`text-squad-number-${playerTeam.team.id}`}>
                                              #{playerTeam.squadNumber || '?'}
                                            </div>
                                            <div className="text-lg font-semibold text-gray-900" data-testid={`text-position-${playerTeam.team.id}`}>
                                              {playerTeam.position || 'Position not set'}
                                            </div>
                                          </div>
                                          <p className="text-xs text-muted-foreground" data-testid={`text-joined-date-${playerTeam.team.id}`}>
                                            Joined: {playerTeam.joinedAt ? format(new Date(playerTeam.joinedAt), "d MMM yyyy") : 'Unknown'}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRemoveTeam(playerTeam.team.id)}
                                      disabled={removePlayerFromTeamMutation.isPending}
                                      data-testid={`button-remove-team-${playerTeam.team.id}`}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          ) : (
                            <Card className="border-dashed border-2 border-gray-300">
                              <CardContent className="p-6 text-center">
                                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No teams assigned</p>
                                <p className="text-sm text-gray-400 mt-2">
                                  Use the "Add Team" button to assign this player to a team.
                                </p>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Parents Tab Content */}
              <TabsContent value="parents" className="m-0">
                <div className="bg-white px-6 pb-6 space-y-3 border-t border-white/10 rounded-b-lg">
                  <div className="pt-4">
                    <div className="w-4/5 mx-auto">
                      <div className="text-center py-8">
                        <h4 className="text-lg font-medium text-gray-900 mb-2">Parents</h4>
                        <p className="text-sm text-muted-foreground">Parent and guardian information for this player.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Card>

        </Tabs>
      </div>
    </MainLayout>
  );
}