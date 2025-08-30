import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ExcelUploadProps {
  fixtureId: string;
  onUploadComplete?: () => void;
}

export function ExcelUpload({ fixtureId, onUploadComplete }: ExcelUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }

    await uploadExcelFile(file);
  };

  const uploadExcelFile = async (file: File) => {
    setUploading(true);
    setUploadStatus('idle');

    try {
      const formData = new FormData();
      formData.append('excel', file);
      formData.append('fixtureId', fixtureId);

      const response = await fetch('/api/upload-match-stats', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      setUploadStatus('success');
      toast({
        title: "Upload Successful",
        description: `Successfully imported statistics for ${result.periodsImported} periods`,
      });

      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      toast({
        title: "Upload Failed",
        description: "Failed to upload Excel file. Please check the format and try again.",
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

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            ) : uploadStatus === 'success' ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : uploadStatus === 'error' ? (
              <XCircle className="w-8 h-8 text-red-600" />
            ) : (
              <FileSpreadsheet className="w-8 h-8 text-blue-600" />
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Upload Match Statistics
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload an Excel file with match statistics for 1st half, 2nd half, and full game periods
            </p>
          </div>

          <Button 
            onClick={triggerFileSelect} 
            disabled={uploading}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="button-upload-excel"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Select Excel File'}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="text-xs text-muted-foreground">
            <p>Supported formats: .xlsx, .xls</p>
            <p>Expected columns: Group, Event, POLK, FSC</p>
          </div>

          {uploadStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">
                ✓ Statistics successfully imported and ready for analysis
              </p>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">
                ✗ Upload failed. Please check your Excel format and try again.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}