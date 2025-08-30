import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, Wand2, Save, CheckCircle, AlertCircle } from "lucide-react";
import { OppositionTeam } from "@shared/schema";
import { BackgroundRemover } from "@/utils/backgroundRemoval";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function LogoManagement() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
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
    
    // Automatically process the image
    setProcessing(true);
    try {
      const backgroundRemover = new BackgroundRemover();
      const processedBlob = await backgroundRemover.removeBackground(file, {
        tolerance: 30,
        preserveInternalWhite: true
      });
      
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

  const selectedTeamData = oppositionTeams?.find(team => team.id === selectedTeam);

  return (
    <MainLayout 
      title="Logo Management" 
      subtitle="Upload and manage opponent team logos"
    >
      <div className="space-y-8">
        
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Team Logo
            </CardTitle>
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