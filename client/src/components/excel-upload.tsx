import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, FileSpreadsheet, FileJson, CheckCircle, XCircle, Loader2, Eye, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExcelUploadProps {
  fixtureId: string;
  onUploadComplete?: () => void;
}

interface JsonPreview {
  team1Stats: Record<string, any>;
  team2Stats: Record<string, any>;
  globalStats: Record<string, any>;
}

interface SheetPreview {
  sheetName: string;
  period: string;
  rowCount: number;
  rawSample: any[];
  teamStatsFound: number;
  opponentStatsFound: number;
  teamStatsParsed: Record<string, any>;
  opponentStatsParsed: Record<string, any>;
  availableColumns: string[];
}

interface PreviewData {
  fileName: string;
  fileSize: number;
  sheets: SheetPreview[];
  totalSheets: number;
}

export function ExcelUpload({ fixtureId, onUploadComplete }: ExcelUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [jsonPreview, setJsonPreview] = useState<JsonPreview | null>(null);
  const [expandedSheets, setExpandedSheets] = useState<Set<string>>(new Set());
  const [uploadType, setUploadType] = useState<'excel' | 'json'>('excel');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
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

    await previewExcelFile(file);
  };

  const previewExcelFile = async (file: File) => {
    setPreviewing(true);
    setPreviewData(null);
    setUploadStatus('idle');

    try {
      const formData = new FormData();
      formData.append('excel', file);

      const response = await fetch('/api/preview-match-stats', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Preview failed with status:', response.status, errorText);
        throw new Error(`Preview failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('Preview result:', result);
      setPreviewData(result);
      
      toast({
        title: "Preview Ready",
        description: `Found ${result.totalSheets} sheets with ${result.sheets.reduce((sum: number, sheet: any) => sum + sheet.teamStatsFound + sheet.opponentStatsFound, 0)} statistics`,
      });
    } catch (error) {
      console.error('Preview error:', error);
      toast({
        title: "Preview Failed",
        description: "Failed to preview Excel file. Please check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setPreviewing(false);
    }
  };

  const uploadExcelFile = async () => {
    if (!previewData) return;

    setUploading(true);
    setUploadStatus('idle');

    try {
      const fileInput = fileInputRef.current;
      const file = fileInput?.files?.[0];
      if (!file) throw new Error('No file selected');

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

  const toggleSheetExpanded = (sheetName: string) => {
    const newExpanded = new Set(expandedSheets);
    if (newExpanded.has(sheetName)) {
      newExpanded.delete(sheetName);
    } else {
      newExpanded.add(sheetName);
    }
    setExpandedSheets(newExpanded);
  };

  const handleJsonFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JSON file (.json)",
        variant: "destructive",
      });
      return;
    }

    await previewJsonFile(file);
  };

  const previewJsonFile = async (file: File) => {
    setPreviewing(true);
    setJsonPreview(null);
    setUploadStatus('idle');

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate JSON structure
      if (!data.team1 || !data.team2) {
        throw new Error('Invalid JSON structure: missing team1 or team2');
      }

      setJsonPreview({
        team1Stats: data.team1,
        team2Stats: data.team2,
        globalStats: {
          avgBallAcceleration: data.avgBallAcceleration,
          maxBallAcceleration: data.maxBallAcceleration,
        }
      });

      toast({
        title: "Preview Ready",
        description: "JSON file loaded successfully",
      });
    } catch (error) {
      console.error('JSON preview error:', error);
      toast({
        title: "Preview Failed",
        description: error instanceof Error ? error.message : "Failed to parse JSON file",
        variant: "destructive",
      });
    } finally {
      setPreviewing(false);
    }
  };

  const uploadJsonFile = async () => {
    if (!jsonPreview) return;

    setUploading(true);
    setUploadStatus('idle');

    try {
      const fileInput = jsonFileInputRef.current;
      const file = fileInput?.files?.[0];
      if (!file) throw new Error('No file selected');

      const formData = new FormData();
      formData.append('json', file);
      formData.append('fixtureId', fixtureId);

      const response = await fetch('/api/upload-match-stats-json', {
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
        description: "JSON match statistics imported successfully",
      });

      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      toast({
        title: "Upload Failed",
        description: "Failed to upload JSON file. Please check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (jsonFileInputRef.current) {
        jsonFileInputRef.current.value = '';
      }
    }
  };

  const triggerJsonFileSelect = () => {
    jsonFileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="excel" className="w-full" onValueChange={(v) => setUploadType(v as 'excel' | 'json')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="excel" className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Excel Upload
          </TabsTrigger>
          <TabsTrigger value="json" className="flex items-center gap-2">
            <FileJson className="w-4 h-4" />
            JSON Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="excel">
          <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                  {previewing || uploading ? (
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
                    Upload Excel Statistics
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload an Excel file with match statistics for 1st half, 2nd half, and full game periods
                  </p>
                </div>

                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={triggerFileSelect} 
                    disabled={previewing || uploading}
                    variant="outline"
                    data-testid="button-preview-excel"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {previewing ? 'Previewing...' : 'Preview Excel File'}
                  </Button>

                  {previewData && (
                    <Button 
                      onClick={uploadExcelFile} 
                      disabled={uploading}
                      className="bg-blue-600 hover:bg-blue-700"
                      data-testid="button-upload-excel"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload to Database'}
                    </Button>
                  )}
                </div>

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
        </TabsContent>

        <TabsContent value="json">
          <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center">
                  {previewing || uploading ? (
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                  ) : uploadStatus === 'success' ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : uploadStatus === 'error' ? (
                    <XCircle className="w-8 h-8 text-red-600" />
                  ) : (
                    <FileJson className="w-8 h-8 text-purple-600" />
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Upload JSON Statistics
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a JSON file with team1 and team2 match event statistics
                  </p>
                </div>

                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={triggerJsonFileSelect} 
                    disabled={previewing || uploading}
                    variant="outline"
                    data-testid="button-preview-json"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {previewing ? 'Previewing...' : 'Preview JSON File'}
                  </Button>

                  {jsonPreview && (
                    <Button 
                      onClick={uploadJsonFile} 
                      disabled={uploading}
                      className="bg-purple-600 hover:bg-purple-700"
                      data-testid="button-upload-json"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload to Database'}
                    </Button>
                  )}
                </div>

                <input
                  ref={jsonFileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleJsonFileSelect}
                  className="hidden"
                />

                <div className="text-xs text-muted-foreground">
                  <p>Supported format: .json</p>
                  <p>Expected structure: {'{team1: {...}, team2: {...}}'}</p>
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
                      ✗ Upload failed. Please check your JSON format and try again.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Excel Preview Section */}
      {previewData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Excel File Preview</CardTitle>
            <p className="text-sm text-muted-foreground">
              File: {previewData.fileName} ({(previewData.fileSize / 1024).toFixed(1)} KB)
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {previewData.sheets.map((sheet) => (
              <Collapsible key={sheet.sheetName}>
                <CollapsibleTrigger 
                  onClick={() => toggleSheetExpanded(sheet.sheetName)}
                  className="flex items-center justify-between w-full p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {expandedSheets.has(sheet.sheetName) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <div className="text-left">
                      <h4 className="font-semibold">{sheet.sheetName}</h4>
                      <p className="text-sm text-muted-foreground">
                        Period: {sheet.period} • {sheet.rowCount} rows • {sheet.teamStatsFound + sheet.opponentStatsFound} stats found
                      </p>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded">
                      <h5 className="font-medium text-sm mb-2">POLK Stats ({sheet.teamStatsFound} found)</h5>
                      <div className="text-xs space-y-1">
                        {Object.entries(sheet.teamStatsParsed).slice(0, 5).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="font-mono">{String(value)}</span>
                          </div>
                        ))}
                        {Object.keys(sheet.teamStatsParsed).length > 5 && (
                          <p className="text-muted-foreground">...and {Object.keys(sheet.teamStatsParsed).length - 5} more</p>
                        )}
                      </div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded">
                      <h5 className="font-medium text-sm mb-2">FSC Stats ({sheet.opponentStatsFound} found)</h5>
                      <div className="text-xs space-y-1">
                        {Object.entries(sheet.opponentStatsParsed).slice(0, 5).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="font-mono">{String(value)}</span>
                          </div>
                        ))}
                        {Object.keys(sheet.opponentStatsParsed).length > 5 && (
                          <p className="text-muted-foreground">...and {Object.keys(sheet.opponentStatsParsed).length - 5} more</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <h5 className="font-medium text-sm mb-2">Available Columns</h5>
                    <p className="text-xs text-muted-foreground">
                      {sheet.availableColumns.join(', ')}
                    </p>
                  </div>
                  {sheet.rawSample.length > 0 && (
                    <div className="p-3 bg-gray-50 rounded">
                      <h5 className="font-medium text-sm mb-2">Raw Data Sample</h5>
                      <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                        {sheet.rawSample.map((row, index) => (
                          <div key={index} className="font-mono text-xs">
                            {JSON.stringify(row, null, 1).slice(0, 100)}...
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </CardContent>
        </Card>
      )}

      {/* JSON Preview Section */}
      {jsonPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">JSON File Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h5 className="font-semibold text-sm mb-3 text-blue-900">Team 1 Statistics</h5>
                <div className="text-xs space-y-1 max-h-64 overflow-y-auto">
                  {Object.entries(jsonPreview.team1Stats).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-mono font-semibold">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <h5 className="font-semibold text-sm mb-3 text-orange-900">Team 2 Statistics</h5>
                <div className="text-xs space-y-1 max-h-64 overflow-y-auto">
                  {Object.entries(jsonPreview.team2Stats).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-mono font-semibold">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {Object.keys(jsonPreview.globalStats).length > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h5 className="font-semibold text-sm mb-3">Global Statistics</h5>
                <div className="text-xs space-y-1">
                  {Object.entries(jsonPreview.globalStats).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-mono font-semibold">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}