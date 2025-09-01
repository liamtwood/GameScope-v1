import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Wand2, Save, CheckCircle, AlertCircle, Info, Edit3, Image, Link as LinkIcon, ArrowUpDown } from "lucide-react";
import { Club, OppositionTeam } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { BackgroundRemover, BackgroundRemovalOptions } from "@/utils/backgroundRemoval";
import { ThemedLogoContainer } from "@/components/ui/themed-logo-container";

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

  const { data: clubs } = useQuery<Club[]>({ 
    queryKey: ["/api/clubs"] 
  });

  const { data: oppositionTeams } = useQuery<OppositionTeam[]>({ 
    queryKey: ["/api/opposition-teams"] 
  });

  // Combine clubs and opposition teams for logo management
  const allTeams = [
    ...(clubs?.map(club => ({ ...club, type: 'club' as const })) || []),
    ...(oppositionTeams?.map(team => ({ ...team, type: 'opposition' as const, logoPath: team.logoPath })) || [])
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
        preserveInternalWhite: true
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
        preserveInternalWhite: true
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
                          className="w-full h-24 object-contain rounded"
                        />
                      ) : (
                        <div className="w-full h-24 bg-muted rounded flex items-center justify-center">
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
                  {team.logoPath && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEnhanceImage(team)}
                      className="w-full"
                      disabled={processing}
                      data-testid={`button-enhance-${team.id}`}
                    >
                      <Wand2 className="mr-1 h-3 w-3" />
                      Enhance Image
                    </Button>
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
      </div>
    </MainLayout>
  );
}