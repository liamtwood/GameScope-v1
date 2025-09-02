import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, Wand2, Save, CheckCircle, AlertCircle, Info, Edit3, Image, Link as LinkIcon, ArrowUpDown, Trash2, UploadCloud, ZoomIn, ZoomOut, Plus, Palette, Sparkles } from "lucide-react";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Club, OppositionTeam, insertOppositionTeamSchema } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { BackgroundRemover, BackgroundRemovalOptions } from "@/utils/backgroundRemoval";
import { ThemedLogoContainer } from "@/components/ui/themed-logo-container";
import { extractColorsFromImage } from "@/utils/colorExtraction";

export default function Settings() {
  const { toast } = useToast();

  // Logo management state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedClub, setSelectedClub] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [processingMode, setProcessingMode] = useState<'smart' | 'color' | 'manual'>('smart');
  const [threshold, setThreshold] = useState(30);
  const [showTip, setShowTip] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [enhanceModalOpen, setEnhanceModalOpen] = useState(false);
  const [enhancingTeam, setEnhancingTeam] = useState<any>(null);
  const [replacementModalOpen, setReplacementModalOpen] = useState(false);
  const [replacingTeam, setReplacingTeam] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Opposition team management state
  const [isCreateOppositionDialogOpen, setIsCreateOppositionDialogOpen] = useState(false);
  const [isEditOppositionDialogOpen, setIsEditOppositionDialogOpen] = useState(false);
  const [editingOppositionTeam, setEditingOppositionTeam] = useState<OppositionTeam | null>(null);
  const [extractingColors, setExtractingColors] = useState<string | null>(null);

  // Form schema for opposition teams
  type OppositionTeamFormData = z.infer<typeof insertOppositionTeamSchema>;

  const oppositionForm = useForm<OppositionTeamFormData>({
    resolver: zodResolver(insertOppositionTeamSchema),
    defaultValues: {
      name: "",
      shortName: "",
      websiteUrl: "",
      colors: {
        primary: "#6b7280", // Default mid gray
        secondary: "#4b5563", // Default darker gray
      },
    },
  });

  const editOppositionForm = useForm<OppositionTeamFormData>({
    resolver: zodResolver(insertOppositionTeamSchema),
    defaultValues: {
      name: "",
      shortName: "",
      websiteUrl: "",
      colors: {
        primary: "#6b7280", // Default mid gray
        secondary: "#4b5563", // Default darker gray
      },
    },
  });

  const { data: clubs } = useQuery<Club[]>({ 
    queryKey: ["/api/clubs"] 
  });

  const { data: oppositionTeams } = useQuery<OppositionTeam[]>({ 
    queryKey: ["/api/opposition-teams"] 
  });

  // Combine clubs and opposition teams for logo management, grouped and sorted
  const allTeams = [
    // Club teams first, sorted alphabetically
    ...(clubs?.map(club => ({ ...club, type: 'club' as const })) || [])
      .sort((a, b) => a.name.localeCompare(b.name)),
    // Opposition teams second, sorted alphabetically
    ...(oppositionTeams?.map(team => ({ ...team, type: 'opposition' as const, logoPath: team.logoPath })) || [])
      .sort((a, b) => a.name.localeCompare(b.name))
  ];

  const saveMutation = useMutation({
    mutationFn: async ({ teamId, logoData, teamType }: { teamId: string; logoData: Blob; teamType: 'club' | 'opposition' }) => {
      const formData = new FormData();
      formData.append('logo', logoData, `${teamId}-logo.png`);
      
      let response;
      if (teamType === 'club') {
        formData.append('clubId', teamId);
        response = await fetch('/api/clubs/logo', {
          method: 'POST',
          body: formData,
        });
      } else {
        formData.append('teamId', teamId);
        response = await fetch('/api/opposition-teams/logo', {
          method: 'POST',
          body: formData,
        });
      }
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Logo Saved",
        description: "Logo has been processed and saved successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/opposition-teams"] });
      setSelectedFile(null);
      setSelectedClub("");
      setProcessedImageUrl(null);
      setOriginalImageUrl(null);
      setShowTip(false);
      setProcessingMode('smart');
      setThreshold(30);
      setLogoUrl("");
      setUploadMethod('file');
      setFetchingUrl(false);
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: "Failed to save the logo. Please try again.",
        variant: "destructive",
      });
      console.error('Save error:', error);
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setOriginalImageUrl(URL.createObjectURL(file));
    
    if (file.size > 100000 || file.name.toLowerCase().includes('logo')) {
      setShowTip(true);
    }
    
    await processImageWithCurrentSettings(file);
  };

  const handleUrlSubmit = async () => {
    if (!logoUrl.trim()) return;
    
    setFetchingUrl(true);
    try {
      const response = await fetch(logoUrl);
      const blob = await response.blob();
      const file = new File([blob], 'logo-from-url.png', { type: blob.type });
      
      setSelectedFile(file);
      setOriginalImageUrl(logoUrl);
      
      if (blob.size > 100000) {
        setShowTip(true);
      }
      
      await processImageWithCurrentSettings(file);
    } catch (error) {
      toast({
        title: "URL Fetch Failed",
        description: "Failed to fetch image from URL. Please check the URL and try again.",
        variant: "destructive",
      });
      console.error('URL fetch error:', error);
    } finally {
      setFetchingUrl(false);
    }
  };

  const processImageWithCurrentSettings = async (file: File) => {
    setProcessing(true);
    try {
      const backgroundRemover = new BackgroundRemover();
      const options: BackgroundRemovalOptions = {
        mode: processingMode,
        tolerance: threshold,
        preserveInternalWhite: true
      };
      
      const processedBlob = await backgroundRemover.removeBackground(file, options);
      const processedUrl = URL.createObjectURL(processedBlob);
      setProcessedImageUrl(processedUrl);
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Processing Failed",
        description: "Failed to remove background. Please try a different image.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleEnhanceImage = async (team: any) => {
    if (!team.logoPath) return;
    
    setEnhancingTeam(team);
    setSelectedClub(team.id);
    setOriginalImageUrl(team.logoPath);
    setProcessedImageUrl(null);
    setProcessingMode('smart');
    setThreshold(30);
    setZoomLevel(100);
    setEnhanceModalOpen(true);
    
    // Start initial processing
    setProcessing(true);
    try {
      const response = await fetch(team.logoPath);
      const blob = await response.blob();
      
      const backgroundRemover = new BackgroundRemover();
      const options: BackgroundRemovalOptions = {
        mode: 'smart',
        tolerance: 30,
        preserveInternalWhite: true,
        zoomLevel: 100
      };
      
      const file = new File([blob], 'logo.png', { type: blob.type });
      const processedBlob = await backgroundRemover.removeBackground(file, options);
      const processedUrl = URL.createObjectURL(processedBlob);
      setProcessedImageUrl(processedUrl);
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Processing Failed",
        description: "Failed to enhance image.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleEditExistingLogo = (team: any) => {
    if (team.logoPath) {
      setSelectedClub(team.id);
      setOriginalImageUrl(team.logoPath);
      setProcessedImageUrl(team.logoPath);
    }
  };

  const handleSaveLogo = async () => {
    if (!processedImageUrl || !selectedClub) return;
    
    try {
      const response = await fetch(processedImageUrl);
      const blob = await response.blob();
      
      const selectedTeam = allTeams.find(team => team.id === selectedClub);
      if (selectedTeam) {
        saveMutation.mutate({ teamId: selectedClub, logoData: blob, teamType: selectedTeam.type });
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to prepare logo for saving.",
        variant: "destructive",
      });
    }
  };

  const reprocessWithSettings = () => {
    if (selectedFile) {
      processImageWithCurrentSettings(selectedFile);
    }
  };

  const reprocessModalImage = async () => {
    if (!enhancingTeam?.logoPath) return;
    
    setProcessing(true);
    try {
      const response = await fetch(enhancingTeam.logoPath);
      const blob = await response.blob();
      
      const backgroundRemover = new BackgroundRemover();
      const options: BackgroundRemovalOptions = {
        mode: processingMode,
        tolerance: threshold,
        preserveInternalWhite: true,
        zoomLevel: zoomLevel
      };
      
      const file = new File([blob], 'logo.png', { type: blob.type });
      const processedBlob = await backgroundRemover.removeBackground(file, options);
      const processedUrl = URL.createObjectURL(processedBlob);
      setProcessedImageUrl(processedUrl);
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Processing Failed",
        description: "Failed to enhance image.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveEnhancedLogo = async () => {
    if (!processedImageUrl || !enhancingTeam) return;
    
    try {
      const response = await fetch(processedImageUrl);
      const blob = await response.blob();
      
      saveMutation.mutate({ 
        teamId: enhancingTeam.id, 
        logoData: blob, 
        teamType: enhancingTeam.type 
      });
      
      // Close modal on successful save
      setEnhanceModalOpen(false);
      setEnhancingTeam(null);
      setProcessedImageUrl(null);
      setOriginalImageUrl(null);
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to prepare logo for saving.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLogo = async (team: any) => {
    if (!team.logoPath) return;
    
    try {
      let response;
      if (team.type === 'club') {
        response = await fetch(`/api/clubs/${team.id}/logo`, {
          method: 'DELETE',
        });
      } else {
        response = await fetch(`/api/opposition-teams/${team.id}/logo`, {
          method: 'DELETE',
        });
      }

      if (response.ok) {
        toast({
          title: "Logo Deleted",
          description: "Team logo has been successfully deleted.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
        queryClient.invalidateQueries({ queryKey: ["/api/opposition-teams"] });
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete logo. Please try again.",
        variant: "destructive",
      });
      console.error('Delete error:', error);
    }
  };

  const handleSuggestColorsFromLogo = async (team: any) => {
    if (!team.logoPath) {
      toast({
        title: "No Logo",
        description: "This team doesn't have a logo to analyze.",
        variant: "destructive",
      });
      return;
    }

    setExtractingColors(team.id);
    
    try {
      const extractedColors = await extractColorsFromImage(team.logoPath);
      
      // Update the team's colors
      const updatedData = {
        colors: {
          primary: extractedColors.primary,
          secondary: extractedColors.secondary,
        }
      };

      let response;
      if (team.type === 'club') {
        response = await apiRequest("PATCH", `/api/clubs/${team.id}`, updatedData);
      } else {
        response = await apiRequest("PUT", `/api/opposition-teams/${team.id}`, updatedData);
      }
      
      // Invalidate relevant query
      queryClient.invalidateQueries({ queryKey: [team.type === 'club' ? '/api/clubs' : '/api/opposition-teams'] });
      
      toast({
        title: "Colors Extracted!",
        description: `Found primary color ${extractedColors.primary}${extractedColors.secondary ? ` and secondary color ${extractedColors.secondary}` : ''} from the logo.`,
      });
      
    } catch (error) {
      console.error('Error extracting colors:', error);
      toast({
        title: "Color Extraction Failed",
        description: "Could not analyze the logo colors. Please try again or set colors manually.",
        variant: "destructive",
      });
    } finally {
      setExtractingColors(null);
    }
  };

  const handleOpenReplacementModal = (team: any) => {
    setReplacingTeam(team);
    setSelectedClub(team.id);
    setOriginalImageUrl(team.logoPath);
    setProcessedImageUrl(null);
    setSelectedFile(null);
    setLogoUrl("");
    setUploadMethod('file');
    setReplacementModalOpen(true);
  };

  const handleReplacementFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setOriginalImageUrl(URL.createObjectURL(file));
    
    if (file.size > 100000) {
      setShowTip(true);
    }
    
    await processImageWithCurrentSettings(file);
  };

  const handleSaveReplacement = async () => {
    if (!processedImageUrl || !replacingTeam) return;
    
    try {
      const response = await fetch(processedImageUrl);
      const blob = await response.blob();
      
      saveMutation.mutate({ 
        teamId: replacingTeam.id, 
        logoData: blob, 
        teamType: replacingTeam.type 
      });
      
      // Close modal on successful save
      setReplacementModalOpen(false);
      setReplacingTeam(null);
      setProcessedImageUrl(null);
      setOriginalImageUrl(null);
      setSelectedFile(null);
      setLogoUrl("");
      setShowTip(false);
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save replacement logo.",
        variant: "destructive",
      });
    }
  };

  // Opposition team mutations
  const createOppositionMutation = useMutation({
    mutationFn: async (teamData: OppositionTeamFormData) => {
      return apiRequest("POST", "/api/opposition-teams", teamData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opposition-teams"] });
      setIsCreateOppositionDialogOpen(false);
      oppositionForm.reset();
      toast({
        title: "Opposition Team Created",
        description: "New opposition team has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create opposition team.",
        variant: "destructive",
      });
    },
  });

  const updateOppositionMutation = useMutation({
    mutationFn: async (data: { id: string; teamData: OppositionTeamFormData }) => {
      return apiRequest("PUT", `/api/opposition-teams/${data.id}`, data.teamData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opposition-teams"] });
      setIsEditOppositionDialogOpen(false);
      setEditingOppositionTeam(null);
      editOppositionForm.reset();
      toast({
        title: "Opposition Team Updated",
        description: "Opposition team has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update opposition team.",
        variant: "destructive",
      });
    },
  });

  const deleteOppositionMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/opposition-teams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opposition-teams"] });
      toast({
        title: "Opposition Team Deleted",
        description: "Opposition team has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete opposition team.",
        variant: "destructive",
      });
    },
  });

  // Form handlers
  const onCreateOppositionSubmit = (data: OppositionTeamFormData) => {
    createOppositionMutation.mutate(data);
  };

  const onUpdateOppositionSubmit = (data: OppositionTeamFormData) => {
    if (editingOppositionTeam) {
      updateOppositionMutation.mutate({ id: editingOppositionTeam.id, teamData: data });
    }
  };

  const handleEditOpposition = (team: OppositionTeam) => {
    setEditingOppositionTeam(team);
    editOppositionForm.reset({
      name: team.name,
      shortName: team.shortName || "",
      websiteUrl: team.websiteUrl || "",
      colors: (team.colors as { primary: string; secondary?: string }) || {
        primary: "#6b7280",
        secondary: "#4b5563",
      },
    });
    setIsEditOppositionDialogOpen(true);
  };

  const handleDeleteOpposition = async (team: OppositionTeam) => {
    if (confirm(`Are you sure you want to delete ${team.name}?`)) {
      deleteOppositionMutation.mutate(team.id);
    }
  };

  const handleSuggestColors = async (team: OppositionTeam) => {
    if (!team.logoPath) {
      toast({
        title: "No Logo",
        description: "This team doesn't have a logo to analyze.",
        variant: "destructive",
      });
      return;
    }

    setExtractingColors(team.id);
    
    try {
      const extractedColors = await extractColorsFromImage(team.logoPath);
      
      // Update the team's colors
      const updatedData = {
        colors: {
          primary: extractedColors.primary,
          secondary: extractedColors.secondary,
        }
      };

      await updateOppositionMutation.mutateAsync({ 
        id: team.id, 
        teamData: updatedData 
      });
      
      toast({
        title: "Colors Extracted!",
        description: `Found primary color ${extractedColors.primary}${extractedColors.secondary ? ` and secondary color ${extractedColors.secondary}` : ''} from the logo.`,
      });
      
    } catch (error) {
      console.error('Error extracting colors:', error);
      toast({
        title: "Color Extraction Failed",
        description: "Could not analyze the logo colors. Please try again or set colors manually.",
        variant: "destructive",
      });
    } finally {
      setExtractingColors(null);
    }
  };

  // Auto-reprocess when zoom level, processing mode, or threshold changes
  useEffect(() => {
    if (originalImageUrl && enhanceModalOpen && !processing) {
      const timeoutId = setTimeout(() => {
        reprocessModalImage();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [zoomLevel, processingMode, threshold]);

  return (
    <MainLayout title="Settings" subtitle="Club settings and team logo management">
      <div className="space-y-6">
        {/* Current Club Logos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Image className="mr-2 h-5 w-5" />
              All Team Logos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allTeams?.map((team) => (
                <div key={team.id} className="space-y-2">
                  <ThemedLogoContainer
                    containerId={`team-logo-${team.id}`}
                    className="border rounded-lg p-3 transition-all"
                    showThemeToggle={true}
                  >
                    <div 
                      onClick={() => handleEditExistingLogo(team)}
                      className="cursor-pointer relative"
                    >
                      {team.logoPath ? (
                        <img 
                          src={team.logoPath} 
                          alt={`${team.name} logo`}
                          className="w-full h-32 object-contain rounded"
                        />
                      ) : (
                        <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
                          <Image className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </ThemedLogoContainer>
                  <div className="text-center">
                    <p className="text-sm font-medium">{team.name}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {team.type === 'club' ? 'Club' : 'Opposition'}
                    </Badge>
                  </div>
                  {team.logoPath ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEnhanceImage(team)}
                        className="flex-1"
                        disabled={processing}
                        data-testid={`button-enhance-${team.id}`}
                      >
                        <Wand2 className="mr-1 h-3 w-3" />
                        Enhance
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReplacementModal(team)}
                        className="flex-1"
                        disabled={processing}
                        data-testid={`button-replace-${team.id}`}
                      >
                        <UploadCloud className="mr-1 h-3 w-3" />
                        Replace
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenReplacementModal(team)}
                      className="w-full"
                      disabled={processing}
                      data-testid={`button-upload-${team.id}`}
                    >
                      <UploadCloud className="mr-1 h-3 w-3" />
                      Upload Logo
                    </Button>
                  )}
                  {team.logoPath && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestColorsFromLogo(team)}
                        disabled={extractingColors === team.id}
                        className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950"
                        data-testid={`button-suggest-colors-logo-${team.id}`}
                        title="Extract colors from logo"
                      >
                        <Sparkles className="mr-1 h-3 w-3" />
                        {extractingColors === team.id ? 'Analyzing...' : 'Suggest Colors'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteLogo(team)}
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        disabled={processing}
                        data-testid={`button-delete-${team.id}`}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete Logo
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Logo Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="mr-2 h-5 w-5" />
              Upload New Logo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload Method Selection */}
            <div className="space-y-4">
              <div className="flex space-x-4">
                <Button
                  variant={uploadMethod === 'file' ? 'default' : 'outline'}
                  onClick={() => setUploadMethod('file')}
                  className="flex-1"
                  data-testid="button-upload-method-file"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload File
                </Button>
                <Button
                  variant={uploadMethod === 'url' ? 'default' : 'outline'}
                  onClick={() => setUploadMethod('url')}
                  className="flex-1"
                  data-testid="button-upload-method-url"
                >
                  <LinkIcon className="mr-2 h-4 w-4" />
                  From URL
                </Button>
              </div>

              {/* File Upload */}
              {uploadMethod === 'file' && (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <div className="space-y-2">
                    <label 
                      htmlFor="logo-upload"
                      className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                      Choose File
                    </label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      data-testid="input-logo-upload"
                    />
                    <p className="text-sm text-muted-foreground">
                      PNG, JPG up to 10MB
                    </p>
                  </div>
                </div>
              )}

              {/* URL Upload */}
              {uploadMethod === 'url' && (
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter image URL..."
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="flex-1"
                      data-testid="input-logo-url"
                    />
                    <Button 
                      onClick={handleUrlSubmit}
                      disabled={!logoUrl.trim() || fetchingUrl}
                      data-testid="button-fetch-url"
                    >
                      {fetchingUrl ? 'Fetching...' : 'Fetch'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Club Selection */}
            {(selectedFile || originalImageUrl) && (
              <div className="space-y-4">
                <h4 className="font-medium">Select Club</h4>
                <Select value={selectedClub} onValueChange={setSelectedClub}>
                  <SelectTrigger data-testid="select-club">
                    <SelectValue placeholder="Choose a club" />
                  </SelectTrigger>
                  <SelectContent>
                    {allTeams?.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name} ({team.type === 'club' ? 'Club' : 'Opposition'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}


            {/* Save Button */}
            {processedImageUrl && selectedClub && (
              <Button 
                onClick={handleSaveLogo}
                disabled={saveMutation.isPending}
                className="w-full"
                data-testid="button-save-logo"
              >
                <Save className="mr-2 h-4 w-4" />
                {saveMutation.isPending ? 'Saving...' : 'Save Logo'}
              </Button>
            )}

            {/* Processing Tips */}
            {showTip && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Pro Tip
                    </h3>
                    <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                      <p>For best results with logo processing:</p>
                      <ul className="mt-1 list-disc list-inside space-y-1">
                        <li>Use high contrast images with clear edges</li>
                        <li>Try different sensitivity settings if needed</li>
                        <li>Smart mode works best for most logos</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Opposition Team Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Palette className="mr-2 h-5 w-5" />
                Opposition Teams
              </CardTitle>
              <Dialog open={isCreateOppositionDialogOpen} onOpenChange={setIsCreateOppositionDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-create-opposition">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Team
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Opposition Team</DialogTitle>
                  </DialogHeader>
                  <Form {...oppositionForm}>
                    <form onSubmit={oppositionForm.handleSubmit(onCreateOppositionSubmit)} className="space-y-4">
                      <FormField
                        control={oppositionForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Team Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter team name" data-testid="input-opposition-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={oppositionForm.control}
                        name="shortName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Short Name</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} placeholder="Enter short name (3-10 chars)" data-testid="input-opposition-short-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={oppositionForm.control}
                        name="websiteUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website URL (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://example.com" data-testid="input-opposition-website" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={oppositionForm.control}
                          name="colors.primary"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Primary Color</FormLabel>
                              <FormControl>
                                <div className="flex space-x-2">
                                  <Input
                                    type="color"
                                    {...field}
                                    className="w-12 h-10 p-1 border rounded cursor-pointer"
                                    data-testid="input-opposition-primary-color"
                                  />
                                  <Input
                                    type="text"
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="#6b7280"
                                    className="flex-1"
                                    data-testid="input-opposition-primary-color-text"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={oppositionForm.control}
                          name="colors.secondary"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Secondary Color (Optional)</FormLabel>
                              <FormControl>
                                <div className="flex space-x-2">
                                  <Input
                                    type="color"
                                    {...field}
                                    className="w-12 h-10 p-1 border rounded cursor-pointer"
                                    data-testid="input-opposition-secondary-color"
                                  />
                                  <Input
                                    type="text"
                                    value={field.value || ""}
                                    onChange={field.onChange}
                                    placeholder="#4b5563"
                                    className="flex-1"
                                    data-testid="input-opposition-secondary-color-text"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateOppositionDialogOpen(false)}
                          data-testid="button-cancel-opposition"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createOppositionMutation.isPending}
                          data-testid="button-submit-opposition"
                        >
                          {createOppositionMutation.isPending ? 'Creating...' : 'Create Team'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {oppositionTeams?.map((team) => (
                <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex space-x-1">
                      {team.colors && (team.colors as any).primary && (
                        <div 
                          className="w-6 h-6 rounded border" 
                          style={{ backgroundColor: (team.colors as any).primary }}
                          title="Primary color"
                        />
                      )}
                      {team.colors && (team.colors as any).secondary && (
                        <div 
                          className="w-6 h-6 rounded border" 
                          style={{ backgroundColor: (team.colors as any).secondary }}
                          title="Secondary color"
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{team.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        {team.shortName && <span>Short: {team.shortName}</span>}
                        {team.websiteUrl && (
                          <a href={team.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Website
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {team.logoPath && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestColors(team)}
                        disabled={extractingColors === team.id}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950"
                        data-testid={`button-suggest-colors-${team.id}`}
                        title="Extract colors from logo"
                      >
                        <Sparkles className="h-4 w-4" />
                        {extractingColors === team.id ? 'Analyzing...' : 'Suggest Colors'}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditOpposition(team)}
                      data-testid={`button-edit-opposition-${team.id}`}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteOpposition(team)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      data-testid={`button-delete-opposition-${team.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8">
                  <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No opposition teams found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Opposition Team Dialog */}
        <Dialog open={isEditOppositionDialogOpen} onOpenChange={setIsEditOppositionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Opposition Team</DialogTitle>
            </DialogHeader>
            <Form {...editOppositionForm}>
              <form onSubmit={editOppositionForm.handleSubmit(onUpdateOppositionSubmit)} className="space-y-4">
                <FormField
                  control={editOppositionForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter team name" data-testid="input-edit-opposition-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editOppositionForm.control}
                  name="shortName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Name</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="Enter short name (3-10 chars)" data-testid="input-edit-opposition-short-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editOppositionForm.control}
                  name="websiteUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://example.com" data-testid="input-edit-opposition-website" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editOppositionForm.control}
                    name="colors.primary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Color</FormLabel>
                        <FormControl>
                          <div className="flex space-x-2">
                            <Input
                              type="color"
                              {...field}
                              className="w-12 h-10 p-1 border rounded cursor-pointer"
                              data-testid="input-edit-opposition-primary-color"
                            />
                            <Input
                              type="text"
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="#6b7280"
                              className="flex-1"
                              data-testid="input-edit-opposition-primary-color-text"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editOppositionForm.control}
                    name="colors.secondary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secondary Color (Optional)</FormLabel>
                        <FormControl>
                          <div className="flex space-x-2">
                            <Input
                              type="color"
                              {...field}
                              className="w-12 h-10 p-1 border rounded cursor-pointer"
                              data-testid="input-edit-opposition-secondary-color"
                            />
                            <Input
                              type="text"
                              value={field.value || ""}
                              onChange={field.onChange}
                              placeholder="#4b5563"
                              className="flex-1"
                              data-testid="input-edit-opposition-secondary-color-text"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditOppositionDialogOpen(false);
                      setEditingOppositionTeam(null);
                    }}
                    data-testid="button-cancel-edit-opposition"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateOppositionMutation.isPending}
                    data-testid="button-submit-edit-opposition"
                  >
                    {updateOppositionMutation.isPending ? 'Updating...' : 'Update Team'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Enhancement Modal */}
        <Dialog open={enhanceModalOpen} onOpenChange={setEnhanceModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Wand2 className="mr-2 h-5 w-5" />
                Enhance {enhancingTeam?.name} Logo
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Image Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original Image */}
                {originalImageUrl && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-center">Original</h4>
                    <div className="h-48 border rounded-lg p-2 bg-white dark:bg-gray-900 flex items-center justify-center">
                      <img 
                        src={originalImageUrl} 
                        alt="Original logo"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Processed Image */}
                <div className="space-y-2">
                  <h4 className="font-medium text-center">
                    Enhanced 
                    {processing && <span className="text-sm text-muted-foreground ml-2">(Processing...)</span>}
                  </h4>
                  <div className="h-48 border rounded-lg p-2 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                    {processedImageUrl ? (
                      <img 
                        src={processedImageUrl} 
                        alt="Enhanced logo"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="text-muted-foreground text-center">
                        <Wand2 className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Processing...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhancement Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Enhancement Settings</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={reprocessModalImage}
                    disabled={processing}
                    data-testid="button-reprocess-modal"
                  >
                    <ArrowUpDown className="mr-1 h-3 w-3" />
                    {processing ? 'Processing...' : 'Reprocess'}
                  </Button>
                </div>

                {/* Processing Mode */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mode</label>
                  <Select value={processingMode} onValueChange={(value: 'smart' | 'color' | 'manual') => setProcessingMode(value)}>
                    <SelectTrigger data-testid="select-processing-mode-modal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smart">Smart (Recommended)</SelectItem>
                      <SelectItem value="color">Color-based</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Threshold Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Sensitivity</label>
                    <span className="text-xs text-muted-foreground">{threshold}</span>
                  </div>
                  <Slider
                    value={[threshold]}
                    onValueChange={(value) => setThreshold(value[0])}
                    max={100}
                    min={1}
                    step={1}
                    className="w-full"
                    data-testid="slider-threshold-modal"
                  />
                </div>

                {/* Zoom Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Logo Size</label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setZoomLevel(Math.max(10, zoomLevel - 10))}
                        disabled={zoomLevel <= 10}
                        data-testid="button-zoom-out"
                      >
                        <ZoomOut className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-muted-foreground min-w-[3rem] text-center">{zoomLevel}%</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setZoomLevel(Math.min(300, zoomLevel + 10))}
                        disabled={zoomLevel >= 300}
                        data-testid="button-zoom-in"
                      >
                        <ZoomIn className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Slider
                    value={[zoomLevel]}
                    onValueChange={(value) => setZoomLevel(value[0])}
                    max={300}
                    min={10}
                    step={5}
                    className="w-full"
                    data-testid="slider-zoom-modal"
                  />
                </div>

                {/* Save Button */}
                {processedImageUrl && (
                  <Button 
                    onClick={handleSaveEnhancedLogo}
                    disabled={saveMutation.isPending}
                    className="w-full"
                    data-testid="button-save-enhanced-logo"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saveMutation.isPending ? 'Saving...' : 'Save Enhanced Logo'}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Replacement Modal */}
        <Dialog open={replacementModalOpen} onOpenChange={setReplacementModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <UploadCloud className="mr-2 h-5 w-5" />
                Replace {replacingTeam?.name} Logo
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Upload Method Selection */}
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <Button
                    variant={uploadMethod === 'file' ? 'default' : 'outline'}
                    onClick={() => setUploadMethod('file')}
                    className="flex-1"
                    data-testid="button-replacement-method-file"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </Button>
                  <Button
                    variant={uploadMethod === 'url' ? 'default' : 'outline'}
                    onClick={() => setUploadMethod('url')}
                    className="flex-1"
                    data-testid="button-replacement-method-url"
                  >
                    <LinkIcon className="mr-2 h-4 w-4" />
                    From URL
                  </Button>
                </div>

                {/* File Upload */}
                {uploadMethod === 'file' && (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <div className="space-y-2">
                      <label 
                        htmlFor="replacement-logo-upload"
                        className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                      >
                        Choose New Logo
                      </label>
                      <input
                        id="replacement-logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleReplacementFileChange}
                        className="hidden"
                        data-testid="input-replacement-logo-upload"
                      />
                      <p className="text-sm text-muted-foreground">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                  </div>
                )}

                {/* URL Upload */}
                {uploadMethod === 'url' && (
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Enter new logo URL..."
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        className="flex-1"
                        data-testid="input-replacement-logo-url"
                      />
                      <Button 
                        onClick={handleUrlSubmit}
                        disabled={!logoUrl.trim() || fetchingUrl}
                        data-testid="button-fetch-replacement-url"
                      >
                        {fetchingUrl ? 'Fetching...' : 'Fetch'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Image Comparison */}
              {(selectedFile || originalImageUrl) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original/Current Logo */}
                  {replacingTeam?.logoPath && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-center">Current Logo</h4>
                      <div className="h-48 border rounded-lg p-2 bg-white dark:bg-gray-900 flex items-center justify-center">
                        <img 
                          src={replacingTeam.logoPath} 
                          alt="Current logo"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* New Processed Image */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-center">
                      New Logo 
                      {processing && <span className="text-sm text-muted-foreground ml-2">(Processing...)</span>}
                    </h4>
                    <div className="h-48 border rounded-lg p-2 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                      {processedImageUrl ? (
                        <img 
                          src={processedImageUrl} 
                          alt="New logo"
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <div className="text-muted-foreground text-center">
                          <UploadCloud className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">Upload a new logo</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Processing Controls */}
              {(selectedFile || originalImageUrl) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Processing Settings</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={reprocessWithSettings}
                      disabled={processing}
                      data-testid="button-reprocess-replacement"
                    >
                      <ArrowUpDown className="mr-1 h-3 w-3" />
                      {processing ? 'Processing...' : 'Reprocess'}
                    </Button>
                  </div>

                  {/* Processing Mode */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mode</label>
                    <Select value={processingMode} onValueChange={(value: 'smart' | 'color' | 'manual') => setProcessingMode(value)}>
                      <SelectTrigger data-testid="select-processing-mode-replacement">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="smart">Smart (Recommended)</SelectItem>
                        <SelectItem value="color">Color-based</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Threshold Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium">Sensitivity</label>
                      <span className="text-xs text-muted-foreground">{threshold}</span>
                    </div>
                    <Slider
                      value={[threshold]}
                      onValueChange={(value) => setThreshold(value[0])}
                      max={100}
                      min={1}
                      step={1}
                      className="w-full"
                      data-testid="slider-threshold-replacement"
                    />
                  </div>

                  {/* Processing Tips */}
                  {showTip && (
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex">
                        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Pro Tip
                          </h3>
                          <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                            <p>For best results with logo processing:</p>
                            <ul className="mt-1 list-disc list-inside space-y-1">
                              <li>Use high contrast images with clear edges</li>
                              <li>Try different sensitivity settings if needed</li>
                              <li>Smart mode works best for most logos</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  {processedImageUrl && (
                    <Button 
                      onClick={handleSaveReplacement}
                      disabled={saveMutation.isPending}
                      className="w-full"
                      data-testid="button-save-replacement"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saveMutation.isPending ? 'Saving...' : 'Save New Logo'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}