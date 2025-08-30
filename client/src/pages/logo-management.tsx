import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Upload, Wand2, Save, CheckCircle, AlertCircle, Info, Edit3 } from "lucide-react";
import { OppositionTeam } from "@shared/schema";
import { BackgroundRemover, BackgroundRemovalOptions } from "@/utils/backgroundRemoval";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ThemedLogoContainer } from "@/components/ui/themed-logo-container";

export default function LogoManagement() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [processingMode, setProcessingMode] = useState<'smart' | 'color' | 'manual'>('smart');
  const [threshold, setThreshold] = useState(30);
  const [showTip, setShowTip] = useState(false);
  const { toast } = useToast();

  const { data: oppositionTeams } = useQuery<OppositionTeam[]>({ 
    queryKey: ["/api/opposition-teams"] 
  });

  const saveMutation = useMutation({
    mutationFn: async ({ teamId, logoData }: { teamId: string; logoData: Blob }) => {
      // First, upload the logo file to the server
      const formData = new FormData();
      formData.append('logo', logoData, `${teamId}-logo.png`);
      formData.append('teamId', teamId);
      
      const response = await fetch('/api/opposition-teams/logo', {
        method: 'POST',
        body: formData,
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Logo Saved",
        description: "Team logo has been processed and saved successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/opposition-teams"] });
      // Reset form
      setSelectedFile(null);
      setSelectedTeam("");
      setProcessedImageUrl(null);
      setOriginalImageUrl(null);
      setShowTip(false);
      setProcessingMode('smart');
      setThreshold(30);
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
    
    // Show tip for larger images
    if (file.size > 100000 || file.name.toLowerCase().includes('logo')) {
      setShowTip(true);
    }
    
    // Automatically process the image
    await processImageWithCurrentSettings(file);
  };

  const handleSave = async () => {
    if (!selectedTeam || !processedImageUrl) {
      toast({
        title: "Missing Information",
        description: "Please select a team and process an image first.",
        variant: "destructive",
      });
      return;
    }

    // Convert the processed image URL to a blob
    const response = await fetch(processedImageUrl);
    const logoData = await response.blob();
    
    saveMutation.mutate({ teamId: selectedTeam, logoData });
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

  const handleModeChange = async (newMode: 'smart' | 'color' | 'manual') => {
    setProcessingMode(newMode);
    if (selectedFile) {
      await processImageWithCurrentSettings(selectedFile);
    }
  };

  const handleThresholdChange = async (value: number[]) => {
    setThreshold(value[0]);
    if (selectedFile && processingMode === 'manual') {
      await processImageWithCurrentSettings(selectedFile);
    }
  };

  const selectedTeamData = oppositionTeams?.find(team => team.id === selectedTeam);

  const handleEditExistingLogo = (team: OppositionTeam) => {
    setSelectedTeam(team.id);
    if (team.logoPath) {
      // Load the existing logo for editing
      setOriginalImageUrl(team.logoPath);
      setProcessedImageUrl(null);
      setSelectedFile(null);
      setShowTip(true);
    }
    // Scroll to the upload section
    setTimeout(() => {
      document.getElementById('upload-section')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  const handleRemoveBackground = async (team: OppositionTeam) => {
    if (!team.logoPath) {
      toast({
        title: "No Logo Found",
        description: "This team doesn't have a logo to process.",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting background removal for team:', team.name);
    setProcessing(true);
    setSelectedTeam(team.id);
    setOriginalImageUrl(team.logoPath);
    
    try {
      console.log('Fetching logo from:', team.logoPath);
      // Fetch the existing logo as a blob
      const response = await fetch(team.logoPath);
      const blob = await response.blob();
      console.log('Fetched blob size:', blob.size, 'type:', blob.type);
      
      // Create a File object from the blob
      const file = new File([blob], `${team.name}-logo`, { type: blob.type });
      console.log('Created file object');
      
      // Process the image using the existing background removal logic
      console.log('Starting background removal with options:', { mode: processingMode, tolerance: threshold });
      const backgroundRemover = new BackgroundRemover();
      const options: BackgroundRemovalOptions = {
        mode: processingMode,
        tolerance: threshold,
        preserveInternalWhite: true
      };
      
      const processedBlob = await backgroundRemover.removeBackground(file, options);
      console.log('Background removal completed, processed blob size:', processedBlob.size);
      
      const processedUrl = URL.createObjectURL(processedBlob);
      setProcessedImageUrl(processedUrl);
      console.log('Set processed image URL');
      
      // Auto-save the processed logo
      console.log('Auto-saving processed logo');
      saveMutation.mutate({ teamId: team.id, logoData: processedBlob });
      
      toast({
        title: "Background Removed",
        description: `Successfully processed logo for ${team.name}`,
      });
      
      // Scroll to see the results
      setTimeout(() => {
        document.getElementById('upload-section')?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
      
    } catch (error) {
      console.error('Background removal error:', error);
      toast({
        title: "Processing Failed",
        description: `Failed to remove background: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <MainLayout 
      title="Logo Management" 
      subtitle="Upload and manage opponent team logos"
    >
      <div className="space-y-8">
        
        {/* Current Team Logos Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Current Team Logos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {oppositionTeams?.map((team) => (
                <ThemedLogoContainer
                  key={team.id}
                  containerId={`team-logo-${team.id}`}
                  className="border rounded-lg p-3 cursor-pointer transition-all"
                  showThemeToggle={true}
                >
                  <div
                    onClick={() => handleEditExistingLogo(team)}
                    className="relative"
                  >
                    <div className="aspect-square border rounded-md mb-2 flex items-center justify-center overflow-hidden bg-inherit">
                      {team.logoPath ? (
                        <img 
                          src={team.logoPath} 
                          alt={`${team.name} logo`}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <div className="text-gray-400 dark:text-gray-500 text-center">
                          <Upload className="h-8 w-8 mx-auto mb-1" />
                          <p className="text-xs">No Logo</p>
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium truncate">{team.name}</p>
                      <Badge 
                        variant="outline" 
                        className="text-xs mt-1 cursor-pointer hover:bg-accent"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveBackground(team);
                        }}
                        data-testid={`button-remove-bg-${team.id}`}
                      >
                        Remove Background
                      </Badge>
                    </div>
                    <div className="absolute inset-0 rounded-lg transition-all duration-200 flex items-center justify-center">
                      <Edit3 className="h-6 w-6 text-gray-600 dark:text-gray-400 opacity-0 hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </ThemedLogoContainer>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upload Section */}
        <Card id="upload-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {selectedTeamData ? `Edit Logo: ${selectedTeamData.name}` : 'Upload Team Logo'}
            </CardTitle>
            {selectedTeamData && (
              <p className="text-sm text-gray-600">
                {selectedTeamData.logoPath ? 'Replace existing logo or upload a new image to reprocess' : 'Upload a new logo for this team'}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Team Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Select Opponent Team</label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a team..." />
                </SelectTrigger>
                <SelectContent>
                  {oppositionTeams?.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center gap-2">
                        {team.logoPath && (
                          <img 
                            src={team.logoPath} 
                            alt={`${team.name} logo`}
                            className="w-4 h-4 object-contain"
                          />
                        )}
                        {team.name}
                        {team.logoPath && <Badge variant="secondary" className="text-xs">Has Logo</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Processing Mode Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Processing Mode</label>
              <div className="flex gap-2 mb-2">
                <Button
                  variant={processingMode === 'smart' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModeChange('smart')}
                >
                  Smart Mode (Auto)
                </Button>
                <Button
                  variant={processingMode === 'color' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModeChange('color')}
                >
                  Color-Based
                </Button>
                <Button
                  variant={processingMode === 'manual' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModeChange('manual')}
                >
                  Manual Threshold
                </Button>
              </div>
              {processingMode === 'manual' && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <label className="text-sm font-medium">Sensitivity:</label>
                    <Slider
                      value={[threshold]}
                      onValueChange={handleThresholdChange}
                      max={100}
                      min={10}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-blue-600 min-w-[30px]">{threshold}</span>
                  </div>
                </div>
              )}
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Upload Logo Image</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </label>
              </div>
            </div>

            {showTip && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <strong>💡 Pro Tip:</strong> If the logo has symbols like ™ or ® that still show background, try "Color-Based" mode or adjust the manual threshold for better results.
                  </div>
                </div>
              </div>
            )}

            {processing && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">
                  <Wand2 className="inline h-4 w-4 mr-1" />
                  Applying intelligent background removal...
                </p>
              </div>
            )}

            {/* Image Comparison */}
            {(originalImageUrl || processedImageUrl) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Original Image */}
                {originalImageUrl && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-center">Original Upload</h3>
                    <div className="border rounded-lg p-4 bg-white">
                      <img 
                        src={originalImageUrl}
                        alt="Original upload"
                        className="w-full h-48 object-contain"
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Original image with background
                    </p>
                  </div>
                )}

                {/* Processed Image */}
                {processedImageUrl && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-center">Background Removed</h3>
                    <div 
                      className="border rounded-lg p-4"
                      style={{
                        background: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                      }}
                    >
                      <img 
                        src={processedImageUrl}
                        alt="Processed logo"
                        className="w-full h-48 object-contain"
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Processed PNG with transparent background
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Save Button */}
            {selectedTeam && processedImageUrl && (
              <div className="flex justify-center pt-4">
                <Button 
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  {saveMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Logo for {selectedTeamData?.name}
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Logos Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Current Team Logos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {oppositionTeams?.map((team) => (
                <div key={team.id} className="border rounded-lg p-4 text-center">
                  <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    {team.logoPath ? (
                      <img 
                        src={team.logoPath} 
                        alt={`${team.name} logo`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No Logo</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm">{team.name}</h3>
                  {team.logoPath ? (
                    <Badge className="mt-2 bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Has Logo
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="mt-2">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Needs Logo
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}