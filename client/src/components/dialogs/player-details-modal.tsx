import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Player } from "@shared/schema";
import { ArrowLeft, Star, Edit, Save, X, Pencil } from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { useClub } from "@/contexts/club-context";
import { useToast } from "@/hooks/use-toast";
import ashleyMillerPhoto from "@assets/image_1756910395408.png";

interface PlayerDetailsModalProps {
  player: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlayerUpdate?: (player: Player) => void;
}

export function PlayerDetailsModal({ player, open, onOpenChange, onPlayerUpdate }: PlayerDetailsModalProps) {
  const { selectedClub } = useClub();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Player>>({});
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updatePlayerMutation = useMutation({
    mutationFn: async (updatedData: Partial<Player>) => {
      const response = await fetch(`/api/player/${player?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) throw new Error('Failed to update player');
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }
      return {};
    },
    onSuccess: (updatedPlayer) => {
      setIsEditing(false);
      setEditData({});
      queryClient.invalidateQueries({ queryKey: ["/api/player", player?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      onPlayerUpdate?.(updatedPlayer);
      toast({
        title: "Player Updated",
        description: "Player information has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Failed to update player:', error);
      toast({
        title: "Error",
        description: "Failed to update player.",
        variant: "destructive",
      });
    },
  });

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
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

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

  const getPlayerInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (!player) return null;

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
  
  const gradientStyle = {
    background: `linear-gradient(to right, ${clubPrimaryColor}, ${clubPrimaryColor}88)`,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <Tabs defaultValue="details" className="w-full">
          <Card className="border border-gray-200 relative overflow-hidden shadow-lg" style={gradientStyle}>
            <CardContent className="p-0">
              {/* Header with Edit Button */}
              <div className="px-6 py-1 flex justify-end items-center min-h-[40px]">
                {!isEditing ? (
                  <Button 
                    variant="ghost" 
                    onClick={handleEdit}
                    data-testid="button-edit-player"
                    className="hover:bg-white/10 h-8 w-8 p-0 flex items-center justify-center"
                    style={{ color: textColor }}
                  >
                    <Edit className="h-4 w-4" style={{ color: textColor }} />
                  </Button>
                ) : (
                  <div className="flex gap-2 items-center h-8">
                    <Button 
                      variant="ghost" 
                      onClick={handleSave}
                      disabled={updatePlayerMutation.isPending}
                      data-testid="button-save-player"
                      className="hover:bg-white/10 h-8 w-8 p-0 flex items-center justify-center"
                      style={{ color: textColor }}
                    >
                      <Save className="h-4 w-4" style={{ color: textColor }} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={handleCancel}
                      data-testid="button-cancel-edit"
                      className="hover:bg-white/10 h-8 w-8 p-0 flex items-center justify-center"
                      style={{ color: textColor }}
                    >
                      <X className="h-4 w-4" style={{ color: textColor }} />
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
                  <TabsList className="grid grid-cols-2 w-full bg-transparent border-none p-0 h-auto">
                    <TabsTrigger 
                      value="details" 
                      data-testid="tab-details" 
                      className="relative bg-transparent border-none shadow-none border-b-3 border-transparent data-[state=active]:bg-white/10 data-[state=active]:shadow-none data-[state=active]:border-b-3 data-[state=active]:border-white data-[state=active]:font-semibold hover:bg-white/5 hover:border-b-3 hover:border-white/60 hover:font-medium transition-all duration-300 px-4 py-3 rounded-none group"
                      style={{ color: textColor }}
                    >
                      <span className="relative z-10">Player Details</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="bob" 
                      data-testid="tab-bob" 
                      className="relative bg-transparent border-none shadow-none border-b-3 border-transparent data-[state=active]:bg-white/10 data-[state=active]:shadow-none data-[state=active]:border-b-3 data-[state=active]:border-white data-[state=active]:font-semibold hover:bg-white/5 hover:border-b-3 hover:border-white/60 hover:font-medium transition-all duration-300 px-4 py-3 rounded-none group"
                      style={{ color: textColor }}
                    >
                      <span className="relative z-10">Bob</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>
              
              {/* Scrollable Content Area */}
              <div className="max-h-[50vh] overflow-y-auto">
                {/* Player Details Content */}
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

                {/* Bob Tab Content */}
                <TabsContent value="bob" className="m-0">
                  <div className="bg-white px-6 pb-6 space-y-3 border-t border-white/10 rounded-b-lg min-h-[400px]">
                    <div className="pt-4">
                      <div className="w-4/5 mx-auto">
                        <div className="text-center py-16">
                          <h4 className="text-lg font-medium text-gray-900 mb-2">Bob Tab</h4>
                          <p className="text-sm text-muted-foreground">This is a simplified tab without the detailed information sections.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </CardContent>
          </Card>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}