import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LogoUploadProps {
  teamName: string;
  onUploadComplete: (logoPath: string) => void;
  currentLogo?: string;
}

export function LogoUpload({ teamName, onUploadComplete, currentLogo }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogo || null);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('teamName', teamName);

      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setPreviewUrl(result.logoPath);
      onUploadComplete(result.logoPath);

      toast({
        title: "Success",
        description: "Logo uploaded and background removed successfully",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = () => {
    setPreviewUrl(null);
    onUploadComplete('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        {previewUrl ? (
          <div className="relative">
            <img 
              src={previewUrl} 
              alt={`${teamName} logo`}
              className="w-16 h-16 object-contain border border-gray-200 rounded-lg bg-white p-2"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 p-0"
              onClick={removeLogo}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <Upload className="h-6 w-6 text-gray-400" />
          </div>
        )}
        
        <div className="flex-1">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id={`logo-upload-${teamName}`}
          />
          <label htmlFor={`logo-upload-${teamName}`}>
            <Button 
              variant="outline" 
              disabled={uploading}
              className="cursor-pointer"
              asChild
            >
              <span>
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? 'Uploading...' : previewUrl ? 'Change Logo' : 'Upload Logo'}
              </span>
            </Button>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Upload team logo (max 5MB, background will be automatically removed)
          </p>
        </div>
      </div>
    </div>
  );
}