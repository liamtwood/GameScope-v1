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
import { ObjectUploader } from "@/components/ui/ObjectUploader";
import { User, Team, UserTeam } from "@shared/schema";
import { ArrowLeft, Star, Edit, Save, X, Pencil, Users, Plus, Camera, User as UserIcon, BarChart3 } from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { useClub } from "@/contexts/club-context";
import { useTeam } from "@/contexts/team-context";
import { useToast } from "@/hooks/use-toast";
import type { UploadResult } from "@uppy/core";
import ashleyMillerPhoto from "@assets/image_1756910395408.png";

export default function PlayerDetails() {
  const [, params] = useRoute("/players/:id");
  const playerId = params?.id;
  
  // Check URL source parameter to determine tab display mode
  const urlSearchParams = new URLSearchParams(window.location.search);
  const source = urlSearchParams.get('source');
  const isPhotoOnlyMode = source === 'profiles';
  const { selectedClub } = useClub();
  const { teams } = useTeam();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<User>>({});
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [pendingProfilePhoto, setPendingProfilePhoto] = useState<string | null>(null);
  const [pendingFullLengthPhoto, setPendingFullLengthPhoto] = useState<string | null>(null);
  const [hasPhotoChanges, setHasPhotoChanges] = useState(false);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [squadNumber, setSquadNumber] = useState<number | undefined>(undefined);
  const [position, setPosition] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>(source === "profiles" ? "bio" : "details");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: player, isLoading } = useQuery<User>({
    queryKey: ["/api/player", playerId],
    enabled: !!playerId,
  });

  // Get all teams for this user
  const { data: userTeams = [] } = useQuery<(UserTeam & { team: Team })[]>({
    queryKey: ["/api/player", player?.id, "teams"],
    enabled: !!player?.id
  });

  // Get primary team (for backwards compatibility)
  const primaryTeam = userTeams[0]?.team;

  const updatePlayerMutation = useMutation({
    mutationFn: async (updatedData: Partial<User>) => {
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
    onSuccess: (data) => {
      console.log('Update successful:', data);
      // Exit editing mode immediately for better user experience
      setIsEditing(false);
      setEditData({});
      // Then invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/player", playerId] });
      toast({
        title: "Success",
        description: "Player information has been updated.",
      });
    },
    onError: (error) => {
      console.error('Failed to update player:', error);
      // Keep in editing mode if there's an error
    },
  });

  // Mutation to add player to a new team
  const addPlayerToTeamMutation = useMutation({
    mutationFn: async ({ teamId, squadNumber, position }: {
      teamId: string;
      squadNumber?: number;
      position?: string;
    }) => {
      const response = await fetch(`/api/player/${playerId}/teams`, {
        method: 'POST',
        body: JSON.stringify({ teamId, squadNumber, position }),
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

  // Photo upload mutation
  const photoUploadMutation = useMutation({
    mutationFn: async (photoURL: string) => {
      const response = await fetch(`/api/user/${playerId}/photo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoURL }),
      });
      if (!response.ok) throw new Error('Failed to update player photo');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player", playerId] });
      toast({
        title: "Photo Updated",
        description: "Player photo has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update player photo. Please try again.",
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

  // Headshot upload mutation
  const headshotUploadMutation = useMutation({
    mutationFn: async (photoURL: string) => {
      const response = await fetch(`/api/user/${playerId}/headshot`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoURL }),
      });
      if (!response.ok) throw new Error('Failed to update headshot');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player", playerId] });
      toast({
        title: "Headshot Updated",
        description: "Player headshot has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update player headshot. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePhotoUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      if (uploadedFile.uploadURL) {
        setPendingProfilePhoto(uploadedFile.uploadURL);
        setHasPhotoChanges(true);
      }
    }
  };

  const handleHeadshotUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      // Always use uploadURL for persistence, not previewURL (which is temporary)
      if (uploadedFile.uploadURL) {
        setPendingFullLengthPhoto(uploadedFile.uploadURL);
        setHasPhotoChanges(true);
      }
    }
  };

  const handleSavePhotos = async () => {
    try {
      if (pendingProfilePhoto) {
        await photoUploadMutation.mutateAsync(pendingProfilePhoto);
      }
      if (pendingFullLengthPhoto) {
        await headshotUploadMutation.mutateAsync(pendingFullLengthPhoto);
      }
      // Reset pending states
      setPendingProfilePhoto(null);
      setPendingFullLengthPhoto(null);
      setHasPhotoChanges(false);
    } catch (error) {
      console.error('Failed to save photos:', error);
    }
  };

  const handleCancelPhotos = () => {
    setPendingProfilePhoto(null);
    setPendingFullLengthPhoto(null);
    setHasPhotoChanges(false);
  };

  const handleAddTeam = () => {
    if (selectedTeamId && !userTeams.some(pt => pt.teamId === selectedTeamId)) {
      addPlayerToTeamMutation.mutate({
        teamId: selectedTeamId,
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
      !userTeams.some(pt => pt.teamId === team.id)
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
    console.log('Saving data:', editData);
    if (Object.keys(editData).length === 0) {
      console.warn('No edit data to save');
      return;
    }
    updatePlayerMutation.mutate(editData);
  };

  const handleInputChange = (field: keyof User, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
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
    if (!player || !primaryTeam) return 'bg-gray-100 text-gray-800';
    const playerPosition = userTeams[0]?.position || 'Unknown';
    const positionCategory = getPositionCategory(playerPosition);
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
  
  // Create SVG-based honeycomb with ultra-thin lines
  const honeycombSvg = `data:image/svg+xml,${encodeURIComponent(`
    <svg width="60" height="52" viewBox="0 0 60 52" xmlns="http://www.w3.org/2000/svg">
      <polygon points="30,2 52,15 52,37 30,50 8,37 8,15" 
               fill="none" 
               stroke="rgba(255,255,255,0.12)" 
               stroke-width="0.8"/>
    </svg>
  `)}`;
  
  const solidStyle = {
    backgroundColor: clubPrimaryColor,
    backgroundImage: `url("${honeycombSvg}")`,
    backgroundSize: '52px 45px',
    backgroundPosition: '0 0, 26px 22.5px',
    backgroundRepeat: 'repeat'
  } as React.CSSProperties;

  return (
    <MainLayout 
      title="VIEW SQUAD MEMBER" 
      subtitle={`${player.firstName} ${player.lastName}`}
    >
      <div className="-m-6" data-testid={`player-details-${player.id}`}>
        {/* Player Header Card with Integrated Tabs */}
        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <Card className="w-full relative overflow-hidden border-0 shadow-none rounded-none" style={{...solidStyle, borderColor: clubPrimaryColor}}>
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
                <div className="w-full px-4">
                  <div className="flex items-center justify-between">
                  {/* Club Logo */}
                  <div className="flex-shrink-0 opacity-80 flex flex-col items-center justify-center h-30">
                    <img 
                      src={selectedClub?.logoPath || "/assets/logos/polk-state-logo-transparent.png"} 
                      alt={selectedClub?.name || "Club Logo"} 
                      className="h-24 w-auto object-contain"
                    />
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Player Avatar with Upload */}
                    <div className="relative group">
                      <Avatar className="h-24 w-24 bg-slate-600 text-white border-2 border-white/30">
                        {player?.avatarPath ? (
                          <AvatarImage 
                            src={player.avatarPath} 
                            alt={`${player.firstName} ${player.lastName}`}
                            className="object-cover"
                          />
                        ) : uploadedPhoto ? (
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
                      
                      {/* Photo Upload Button using ObjectUploader */}
                      <div className="absolute -bottom-1 -right-1 z-10">
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={5242880} // 5MB
                          onGetUploadParameters={getPhotoUploadURL}
                          onComplete={handlePhotoUploadComplete}
                          buttonClassName="bg-white border-2 border-white/30 rounded-full p-2 opacity-80 hover:opacity-100 transition-opacity shadow-lg z-10 cursor-pointer"
                        >
                          <Pencil className="h-4 w-4 text-gray-600" />
                        </ObjectUploader>
                      </div>
                    </div>
                    
                    {/* Player Info */}
                    <div className="flex-1">
                      <div className="mb-3">
                        <div className="text-lg font-medium" style={{ color: textColor }}>{player.firstName}</div>
                        <div className="text-3xl font-bold" style={{ color: textColor }}>{player.lastName}</div>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>
              
              {/* Modern Tab Navigation */}
              <div className="px-0 bg-white/90 backdrop-blur-sm">
                <div className="px-0">
                  <TabsList className={`grid ${isPhotoOnlyMode ? 'grid-cols-1' : 'grid-cols-5'} w-full rounded-none border-0 p-0 h-auto`} style={{ backgroundColor: clubPrimaryColor }}>
                    <style>{`
                      [data-testid="tab-details"][data-state="active"],
                      [data-testid="tab-teams"][data-state="active"],
                      [data-testid="tab-parents"][data-state="active"] {
                        color: ${clubPrimaryColor} !important;
                        border: none !important;
                        outline: none !important;
                        box-shadow: none !important;
                        margin: 0 !important;
                      }
                      [data-testid="tab-details"],
                      [data-testid="tab-teams"],
                      [data-testid="tab-parents"] {
                        border: none !important;
                        outline: none !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                      }
                      [data-testid="tab-details"],
                      [data-testid="tab-teams"],
                      [data-testid="tab-parents"] {
                        border-left: none !important;
                        margin-left: 0 !important;
                        padding-left: 0 !important;
                        outline: none !important;
                        outline-offset: 0 !important;
                        border-top-left-radius: 0.5rem !important;
                        border-top-right-radius: 0.5rem !important;
                        border-bottom-left-radius: 0 !important;
                        border-bottom-right-radius: 0 !important;
                      }
                      [data-testid="tab-details"]::before,
                      [data-testid="tab-teams"]::before,
                      [data-testid="tab-parents"]::before,
                      [data-testid="tab-details"]::after,
                      [data-testid="tab-teams"]::after,
                      [data-testid="tab-parents"]::after {
                        display: none !important;
                        content: none !important;
                        background: none !important;
                        opacity: 0 !important;
                      }
                      [data-testid="tab-details"][data-state="active"],
                      [data-testid="tab-teams"][data-state="active"],
                      [data-testid="tab-parents"][data-state="active"] {
                        box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
                        -webkit-box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
                        -moz-box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
                      }
                      [data-testid="tab-details"]:not([data-state="active"]),
                      [data-testid="tab-teams"]:not([data-state="active"]),
                      [data-testid="tab-parents"]:not([data-state="active"]) {
                        box-shadow: none !important;
                        -webkit-box-shadow: none !important;
                        -moz-box-shadow: none !important;
                      }
                      /* INACTIVE TABS - NO BACKGROUND */
                      [data-testid="tab-details"]:not([data-state="active"]),
                      [data-testid="tab-teams"]:not([data-state="active"]),
                      [data-testid="tab-parents"]:not([data-state="active"]) {
                        opacity: 1 !important;
                        background: none !important;
                        background-color: transparent !important;
                        background-image: none !important;
                        color: white !important;
                      }
                      /* ACTIVE TABS - WHITE BACKGROUND WITH CLUB COLOR TEXT (excluding bio/stats) */
                      [data-testid="tab-details"][data-state="active"],
                      [data-testid="tab-teams"][data-state="active"],
                      [data-testid="tab-parents"][data-state="active"],
                      [data-testid="tab-photo"][data-state="active"],
                      button[role="tab"][data-testid="tab-details"][data-state="active"],
                      button[role="tab"][data-testid="tab-teams"][data-state="active"],
                      button[role="tab"][data-testid="tab-parents"][data-state="active"],
                      button[role="tab"][data-testid="tab-photo"][data-state="active"] {
                        opacity: 1 !important;
                        background: white !important;
                        background-color: white !important;
                        background-image: none !important;
                        color: ${clubPrimaryColor} !important;
                      }
                    `}</style>
                    {!isPhotoOnlyMode && (
                      <>
                        <TabsTrigger 
                          value="details" 
                          data-testid="tab-details" 
                          className="relative pl-0 pr-4 py-3 text-sm font-medium transition-all duration-200 rounded-t-lg border-0 data-[state=active]:font-semibold"
                          style={{ 
                            // color controlled by CSS now
                            '--club-primary': clubPrimaryColor,
    // Disable inline styles - let CSS handle everything
                          } as React.CSSProperties & { '--club-primary': string }}
                        >
                          User Details
                        </TabsTrigger>
                        <TabsTrigger 
                          value="teams" 
                          data-testid="tab-teams" 
                          className="relative px-4 py-3 text-sm font-medium transition-all duration-200 rounded-none border-0 data-[state=active]:font-semibold"
                          style={{ 
                            // color controlled by CSS now
                            '--club-primary': clubPrimaryColor,
    // Disable inline styles - let CSS handle everything
                          } as React.CSSProperties & { '--club-primary': string }}
                        >
                          Teams
                        </TabsTrigger>
                        <TabsTrigger 
                          value="parents" 
                          data-testid="tab-parents" 
                          className="relative px-4 py-3 text-sm font-medium transition-all duration-200 rounded-none border-0 data-[state=active]:font-semibold"
                          style={{ 
                            // color controlled by CSS now
                            '--club-primary': clubPrimaryColor,
    // Disable inline styles - let CSS handle everything
                          } as React.CSSProperties & { '--club-primary': string }}
                        >
                          Parents
                        </TabsTrigger>
                      </>
                    )}
                    {/* Hide Photo tab when coming from Player Profiles */}
                    {source !== "profiles" && (
                      <TabsTrigger 
                        value="photo" 
                        data-testid="tab-photo" 
                        className={`relative py-3 text-sm font-medium transition-all duration-200 rounded-t-lg border-0 data-[state=active]:font-semibold ${
                          isPhotoOnlyMode ? 'px-0 w-full text-center' : 'px-4'
                        }`}
                        style={{ 
                          // color controlled by CSS now
                          '--club-primary': clubPrimaryColor,
  // Disable inline styles - let CSS handle everything
                        } as React.CSSProperties & { '--club-primary': string }}
                      >
                        {isPhotoOnlyMode ? 'Player Photo' : 'Photo'}
                      </TabsTrigger>
                    )}
                  </TabsList>
                </div>
              </div>
              
              {/* Player Details Content */}
              <TabsContent value="details" className="m-0">
                <div className="bg-white px-6 pb-6 space-y-3 min-h-[400px]">
                  <div className="pt-4">
                    

                    {/* Section Header */}
                    <div className="w-4/5 mx-auto">
                      <div className="pt-8">
                        <h4 className="text-[10px] font-medium uppercase tracking-wide mb-2" style={{ color: clubPrimaryColor }}>Name Information</h4>
                      </div>
                    </div>

                    {/* Name Info */}
                    <div className="w-4/5 mx-auto">
                      <div className="grid grid-cols-3 gap-x-8 gap-y-3">
                        <div className="px-2 py-1">
                          <label className="text-[10px] font-medium text-muted-foreground tracking-wide">First Name</label>
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
                          <label className="text-[10px] font-medium text-muted-foreground tracking-wide">Last Name</label>
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
                          <label className="text-[10px] font-medium text-muted-foreground tracking-wide">Shirt Name</label>
                          <div className="mt-0.5">
                            <span className="text-sm font-semibold text-gray-900" data-testid={`text-shirt-name-${player.id}`}>
                              {player.lastName ? player.lastName.toUpperCase() : "NOT PROVIDED"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section Header */}
                    <div className="w-4/5 mx-auto">
                      <div className="pt-8">
                        <h4 className="text-[10px] font-medium uppercase tracking-wide mb-2" style={{ color: clubPrimaryColor }}>Personal Information</h4>
                      </div>
                    </div>

                    {/* Personal Info */}
                    <div className="w-4/5 mx-auto">
                      <div className="grid grid-cols-3 gap-x-8 gap-y-3 border-t border-white/20">
                        <div className="px-2 py-1">
                          <label className="text-[10px] font-medium text-muted-foreground tracking-wide">Date of Birth</label>
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
                      <div className="pt-8">
                        <h4 className="text-[10px] font-medium uppercase tracking-wide mb-2" style={{ color: clubPrimaryColor }}>Contact Information</h4>
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
                          <label className="text-[10px] font-medium text-muted-foreground tracking-wide">Phone Number</label>
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
                          <label className="text-[10px] font-medium text-muted-foreground tracking-wide">User Status</label>
                          <div className="mt-0.5">
                            {isEditing ? (
                              <select
                                value={editData.status || player.status || 'Draft'}
                                onChange={(e) => handleInputChange('status', e.target.value)}
                                className="h-6 text-sm font-semibold border border-gray-300 rounded px-2 bg-white"
                                data-testid={`select-user-status-${player.id}`}
                              >
                                <option value="Draft">Draft</option>
                                <option value="Active">Active</option>
                                <option value="Suspended">Suspended</option>
                                <option value="Retired">Retired</option>
                              </select>
                            ) : (
                              <span className={`text-sm font-semibold px-2 py-1 rounded text-xs ${getAccountStatusColor(player.status || 'Draft')}`} data-testid={`text-user-status-${player.id}`}>
                                {player.status || "Draft"}
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
                <div className="bg-white px-6 pb-6 space-y-3 border border-gray-200 border-t-0 rounded-b-lg shadow-sm min-h-[400px]">
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
                          {userTeams.length > 0 ? (
                            userTeams.map((playerTeam) => (
                              <Card 
                                key={playerTeam.id} 
                                className="border-2" 
                                data-testid={`card-team-${playerTeam.team.id}`}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                      <div className="h-12 w-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-lg font-bold">
                                        {playerTeam.jerseyNumber || '?'}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                          <h4 className="text-lg font-semibold" data-testid={`text-team-name-${playerTeam.team.id}`}>
                                            {playerTeam.team.name}
                                          </h4>
                                          <Badge 
                                            className={playerTeam.team.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                                            data-testid={`badge-team-status-${playerTeam.team.id}`}
                                          >
                                            {playerTeam.team.status}
                                          </Badge>
                                        </div>
                                        <div className="space-y-2">
                                          <div className="flex items-center space-x-3">
                                            <div className="text-lg font-semibold text-gray-900" data-testid={`text-position-${playerTeam.team.id}`}>
                                              {playerTeam.position || 'Position not set'}
                                            </div>
                                          </div>
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
                <div className="bg-white px-6 pb-6 space-y-3 border border-gray-200 border-t-0 rounded-b-lg shadow-sm min-h-[400px]">
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


              {/* Bio Tab Content - only when coming from Player Profiles */}
              {source === "profiles" && (
                <TabsContent value="bio" className="m-0">
                  <div 
                    className="px-6 min-h-[400px]" 
                    style={{
                      backgroundColor: clubPrimaryColor,
                      backgroundImage: `url("${honeycombSvg}")`,
                      backgroundSize: '52px 45px',
                      backgroundPosition: '0 0, 26px 22.5px',
                      backgroundRepeat: 'repeat'
                    } as React.CSSProperties}
                  >
                    <div className="pt-6">
                      <div className="flex gap-6 items-start">
                        {/* Left Side - Headshot Photo */}
                        <div className="w-1/4 pl-6">
                          {player?.headshotPath ? (
                            <div className="sticky top-6">
                              <img
                                src={player.headshotPath}
                                alt={`${player?.firstName} ${player?.lastName} headshot`}
                                className="w-full h-auto object-cover"
                                data-testid={`img-headshot-${player?.id}`}
                              />
                            </div>
                          ) : (
                            <div className="w-full h-64 bg-white/10 flex items-center justify-center">
                              <div className="text-white text-4xl font-semibold">
                                {player?.firstName?.[0]}{player?.lastName?.[0]}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Right Side - Bio Information */}
                        <div className="w-1/2 space-y-8">
                        
                        {/* Player Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                          <div className="py-2 border-b border-white/20">
                            <span className="text-sm font-medium text-white block mb-1 uppercase">Height</span>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editData.height || ''}
                                onChange={(e) => handleInputChange('height', e.target.value)}
                                className="text-sm bg-white/10 border border-white/20 rounded px-2 py-1 text-white placeholder-white/70 focus:outline-none focus:ring-1 focus:ring-white/50"
                                placeholder="Height"
                              />
                            ) : (
                              <span className="text-sm text-white font-normal">{player?.height || 'Not specified'}</span>
                            )}
                          </div>
                          
                          <div className="py-2 border-b border-white/20">
                            <span className="text-sm font-medium text-white block mb-1 uppercase">Hometown</span>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editData.hometown || ''}
                                onChange={(e) => handleInputChange('hometown', e.target.value)}
                                className="text-sm bg-white/10 border border-white/20 rounded px-2 py-1 text-white placeholder-white/70 focus:outline-none focus:ring-1 focus:ring-white/50"
                                placeholder="Hometown"
                              />
                            ) : (
                              <span className="text-sm text-white font-normal">{player?.hometown || 'Not specified'}</span>
                            )}
                          </div>
                          
                          <div className="py-2 border-b border-white/20">
                            <span className="text-sm font-medium text-white block mb-1 uppercase">Class</span>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editData.classYear || ''}
                                onChange={(e) => handleInputChange('classYear', e.target.value)}
                                className="text-sm bg-white/10 border border-white/20 rounded px-2 py-1 text-white placeholder-white/70 focus:outline-none focus:ring-1 focus:ring-white/50"
                                placeholder="Class Year"
                              />
                            ) : (
                              <span className="text-sm text-white font-normal">{player?.classYear || 'Not specified'}</span>
                            )}
                          </div>
                          
                          <div className="py-2 border-b border-white/20">
                            <span className="text-sm font-medium text-white block mb-1 uppercase">High School</span>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editData.highSchool || ''}
                                onChange={(e) => handleInputChange('highSchool', e.target.value)}
                                className="text-sm bg-white/10 border border-white/20 rounded px-2 py-1 text-white placeholder-white/70 focus:outline-none focus:ring-1 focus:ring-white/50"
                                placeholder="High School"
                              />
                            ) : (
                              <span className="text-sm text-white font-normal">{player?.highSchool || 'Not specified'}</span>
                            )}
                          </div>
                        </div>
                        
                        
                        {/* Bio Text */}
                        <div className="pt-6">
                          <h4 className="text-sm font-medium mb-3 text-white uppercase">About</h4>
                          {isEditing ? (
                            <textarea
                              value={editData.bio || ''}
                              onChange={(e) => handleInputChange('bio', e.target.value)}
                              className="w-full h-24 text-sm bg-white/10 border border-white/20 rounded px-3 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-1 focus:ring-white/50 resize-none"
                              placeholder="Enter player biography..."
                            />
                          ) : player?.bio ? (
                            <p className="text-sm leading-relaxed text-white">{player.bio}</p>
                          ) : (
                            <p className="text-sm italic text-white/70 text-center">No biography available</p>
                          )}
                        </div>
                        
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* Photo Tab Content */}
              <TabsContent value="photo" className="m-0">
                <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg shadow-sm min-h-[400px]">
                  <div className="p-6">
                    <div className="w-full">
                      

                      {/* Full Length Photo Section */}
                      <div>
                        <div className="flex items-center justify-center space-x-8">
                          {/* Current Full Length Photo Display */}
                          <div className="flex flex-col items-center">
                            <div 
                              className="w-60 h-80 border-4 border-gray-200 rounded-lg shadow-lg overflow-hidden flex items-center justify-center"
                              style={{
                                background: `
                                  repeating-conic-gradient(#f0f0f0 0% 25%, transparent 0% 50%) 50% / 12px 12px,
                                  repeating-conic-gradient(#e0e0e0 0% 25%, transparent 0% 50%) 50% / 12px 12px
                                `,
                                backgroundPosition: '0px 0px, 6px 6px'
                              }}
                            >
                              {pendingFullLengthPhoto ? (
                                <img 
                                  src={pendingFullLengthPhoto} 
                                  alt={`${player.firstName} ${player.lastName} Full Length (Preview)`}
                                  className="w-full h-full object-contain"
                                />
                              ) : player?.headshotPath ? (
                                <img 
                                  src={player.headshotPath} 
                                  alt={`${player.firstName} ${player.lastName} Full Length`}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <div className="text-white text-4xl font-semibold">
                                  {player?.firstName?.[0]}{player?.lastName?.[0]}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Upload Button and Text */}
                          <div className="flex flex-col items-start space-y-4">
                            <ObjectUploader
                              maxNumberOfFiles={1}
                              maxFileSize={5242880} // 5MB
                              onGetUploadParameters={getPhotoUploadURL}
                              onComplete={handleHeadshotUploadComplete}
                              enableBackgroundRemoval={true}
                              buttonClassName="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md transition-colors font-medium"
                            >
                              <Pencil className="h-5 w-5 mr-2" />
                              Upload Photo
                            </ObjectUploader>
                            <p className="text-sm text-muted-foreground">
                              Upload photos up to 5MB in size<br />
                              (JPG, PNG formats recommended)
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Save/Cancel Buttons */}
                      {hasPhotoChanges && (
                        <div className="pt-8 border-t border-gray-200">
                          <div className="flex justify-center space-x-4">
                            <Button
                              onClick={handleSavePhotos}
                              disabled={photoUploadMutation.isPending || headshotUploadMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                            >
                              <Save className="h-5 w-5 mr-2" />
                              {photoUploadMutation.isPending || headshotUploadMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button
                              onClick={handleCancelPhotos}
                              variant="outline"
                              disabled={photoUploadMutation.isPending || headshotUploadMutation.isPending}
                              className="px-8 py-3"
                            >
                              <X className="h-5 w-5 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

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