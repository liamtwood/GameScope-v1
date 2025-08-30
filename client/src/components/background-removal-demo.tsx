import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackgroundRemover } from "@/utils/backgroundRemoval";
import { Download, Wand2 } from "lucide-react";

export function BackgroundRemovalDemo() {
  const [processing, setProcessing] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const processPolkLogo = async () => {
    setProcessing(true);
    
    try {
      // Fetch the original Polk State logo
      const response = await fetch('/assets/logos/polk-state-logo.jpg');
      const blob = await response.blob();
      const file = new File([blob], 'polk-state-logo.jpg', { type: 'image/jpeg' });
      
      // Set original image URL for comparison
      setOriginalImageUrl('/assets/logos/polk-state-logo.jpg');
      
      // Apply background removal
      const backgroundRemover = new BackgroundRemover();
      const processedBlob = await backgroundRemover.removeBackground(file, {
        tolerance: 30,
        preserveInternalWhite: true
      });
      
      // Create URL for processed image
      const processedUrl = URL.createObjectURL(processedBlob);
      setProcessedImageUrl(processedUrl);
      
    } catch (error) {
      console.error('Processing error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const downloadProcessed = () => {
    if (processedImageUrl) {
      const link = document.createElement('a');
      link.href = processedImageUrl;
      link.download = 'polk-state-logo-processed.png';
      link.click();
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Background Removal Demo - Polk State Eagle Logo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="flex gap-4 justify-center">
          <Button 
            onClick={processPolkLogo}
            disabled={processing}
            className="flex items-center gap-2"
          >
            <Wand2 className="h-4 w-4" />
            {processing ? 'Processing...' : 'Test Background Removal'}
          </Button>
          
          {processedImageUrl && (
            <Button 
              onClick={downloadProcessed}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Processed PNG
            </Button>
          )}
        </div>

        {processing && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">
              Applying intelligent background removal to eagle logo...
            </p>
          </div>
        )}

        {(originalImageUrl || processedImageUrl) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Original Image */}
            {originalImageUrl && (
              <div className="space-y-2">
                <h3 className="font-semibold text-center">Original Logo</h3>
                <div className="border rounded-lg p-4 bg-white">
                  <img 
                    src={originalImageUrl}
                    alt="Original Polk State Logo"
                    className="w-full h-48 object-contain"
                  />
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Original JPG with white background
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
                    alt="Processed Polk State Logo"
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

        {processedImageUrl && (
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">
              ✅ Background removal complete! The eagle logo now has a transparent background while preserving all internal details.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}