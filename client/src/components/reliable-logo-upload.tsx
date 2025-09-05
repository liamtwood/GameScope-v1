import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BackgroundRemover } from "@/utils/backgroundRemoval";

interface ReliableLogoUploadProps {
  entityType: 'club' | 'opposition-team';
  entityId: string;
  entityName: string;
  currentLogo?: string;
  onUploadComplete?: (logoPath: string) => void;
  className?: string;
}

export function ReliableLogoUpload({ 
  entityType, 
  entityId, 
  entityName, 
  currentLogo, 
  onUploadComplete,
  className 
}: ReliableLogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogo || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Show processing toast
      toast({
        title: "Processing logo",
        description: "Applying background removal and optimization...",
      });

      // Apply background removal
      const backgroundRemover = new BackgroundRemover();
      const processedBlob = await backgroundRemover.removeBackground(file, {
        tolerance: 30,
        preserveInternalWhite: true,
        mode: 'smart'
      });

      // Create processed file for upload
      const processedFile = new File([processedBlob], `${entityName}-logo.png`, {
        type: 'image/png'
      });

      // Create preview URL for immediate display
      const newPreviewUrl = URL.createObjectURL(processedBlob);
      setPreviewUrl(newPreviewUrl);

      // Prepare form data
      const formData = new FormData();
      formData.append('logo', processedFile);
      
      if (entityType === 'club') {
        formData.append('clubId', entityId);
      } else {
        formData.append('teamId', entityId);
      }

      // Upload to appropriate endpoint
      const endpoint = entityType === 'club' 
        ? '/api/clubs/logo' 
        : '/api/opposition-teams/logo';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      // Call completion callback
      onUploadComplete?.(result.logoPath);

      toast({
        title: "Success",
        description: "Logo uploaded successfully with background removal!",
      });

      // Clean up old preview URL to prevent memory leaks
      if (newPreviewUrl !== currentLogo) {
        URL.revokeObjectURL(newPreviewUrl);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
      
      <div className="space-y-4">
        {/* Logo Preview */}
        {previewUrl && (
          <div className="flex items-center justify-center">
            <div className="relative">
              <img 
                src={previewUrl}
                alt={`${entityName} logo`}
                className="w-24 h-24 object-contain rounded-lg border border-gray-200 bg-white"
              />
              {!uploading && (
                <div className="absolute -top-2 -right-2">
                  <CheckCircle className="h-5 w-5 text-green-500 bg-white rounded-full" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleButtonClick}
          disabled={uploading}
          className="w-full"
          variant={previewUrl ? "outline" : "default"}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? (
            "Processing..."
          ) : previewUrl ? (
            "Change Logo"
          ) : (
            "Upload Logo"
          )}
        </Button>

        {!previewUrl && (
          <p className="text-xs text-muted-foreground text-center">
            Max 10MB • JPG, PNG, GIF, WebP • Background removal applied automatically
          </p>
        )}
      </div>
    </div>
  );
}