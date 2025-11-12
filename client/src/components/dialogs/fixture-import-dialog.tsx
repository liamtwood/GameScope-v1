import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet, Calendar, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface FixtureImportDialogProps {
  teamId: string;
  onImportComplete?: () => void;
  children: React.ReactNode;
}

interface FixturePreview {
  opposition: string;
  date: string;
  time: string;
  venue: string;
  competition: string;
  goalsFor: number | null;
  goalsAgainst: number | null;
  hasResult: boolean;
  status: 'valid' | 'warning' | 'error';
  warnings?: string[];
}

export function FixtureImportDialog({ teamId, onImportComplete, children }: FixtureImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [excelTeamName, setExcelTeamName] = useState('');
  const [previewData, setPreviewData] = useState<FixturePreview[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');
  const { toast } = useToast();

  const resetDialog = () => {
    setFile(null);
    setExcelTeamName('');
    setPreviewData([]);
    setStep('upload');
    setIsProcessing(false);
    setIsImporting(false);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx?|xls)$/i)) {
      toast({
        title: "Invalid File Type",
        description: "Please select an Excel file (.xls or .xlsx)",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      // Upload file for preview
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadResponse = await fetch('/api/upload-temp', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const { filename } = await uploadResponse.json();

      // Get preview data
      const previewResponse = await apiRequest('POST', '/api/fixtures/import-excel/preview', {
        filename,
        teamId,
        excelTeamName: excelTeamName.trim() || undefined
      });
      
      const previewData = await previewResponse.json();

      // Process preview data and add validation
      const processedData: FixturePreview[] = previewData.fixtures.map((fixture: any) => {
        const warnings: string[] = [];
        let status: 'valid' | 'warning' | 'error' = 'valid';

        // Validation checks
        if (!fixture.opposition) {
          warnings.push('Missing opposition');
          status = 'error';
        }
        if (!fixture.date) {
          warnings.push('Missing date');
          status = 'error';
        }
        if (!fixture.competition) {
          warnings.push('Missing competition');
          status = status === 'error' ? 'error' : 'warning';
        }
        if (!fixture.venue) {
          warnings.push('Missing venue');
          status = status === 'error' ? 'error' : 'warning';
        }

        return {
          opposition: fixture.opposition || '',
          date: fixture.date || '',
          time: fixture.time || '',
          venue: fixture.venue || 'TBD',
          competition: fixture.competition || 'TBD',
          goalsFor: fixture.goalsFor,
          goalsAgainst: fixture.goalsAgainst,
          hasResult: fixture.hasResult || false,
          status,
          warnings: warnings.length > 0 ? warnings : undefined
        };
      });

      setPreviewData(processedData);
      setStep('preview');

    } catch (error) {
      console.error('Preview error:', error);
      toast({
        title: "Preview Failed",
        description: "Failed to preview Excel file. Please check the file format.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  };

  const handleImport = async () => {
    if (!file || !teamId) return;

    setIsImporting(true);

    try {
      // Upload file again (or use cached path)
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload-temp', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const { filename } = await uploadResponse.json();

      // Import fixtures
      const importResponse = await apiRequest('POST', '/api/fixtures/import-excel', {
        filename,
        teamId,
        excelTeamName: excelTeamName.trim() || undefined
      });
      
      const importData = await importResponse.json();

      if (importData.success) {
        // Refresh the fixtures list
        queryClient.invalidateQueries({ queryKey: ["/api/fixtures"] });
        
        toast({
          title: "Import Successful",
          description: `Successfully imported ${importData.imported} fixtures from Excel file.`,
        });

        setStep('complete');
        onImportComplete?.();

        // Close dialog after a short delay
        setTimeout(() => {
          setOpen(false);
          resetDialog();
        }, 2000);

      } else {
        throw new Error('Import failed');
      }

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import fixtures from Excel file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const validFixtures = previewData.filter(f => f.status !== 'error').length;
  const warningFixtures = previewData.filter(f => f.status === 'warning').length;
  const errorFixtures = previewData.filter(f => f.status === 'error').length;
  const fixturesWithResults = previewData.filter(f => f.hasResult).length;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        resetDialog();
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Fixtures from Excel
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && "Upload an Excel file to import your fixtures and results"}
            {step === 'preview' && "Review the fixtures before importing to your team"}
            {step === 'complete' && "Import completed successfully!"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {step === 'upload' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Team Name in Excel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="excel-team-name">
                      What is your team called in the Excel file?
                    </Label>
                    <Input
                      id="excel-team-name"
                      placeholder="e.g., Newcastle, U21, Arsenal"
                      value={excelTeamName}
                      onChange={(e) => setExcelTeamName(e.target.value)}
                      data-testid="input-excel-team-name"
                    />
                    <p className="text-xs text-muted-foreground">
                      This helps identify which team is yours in the home_team/away_team columns
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Upload Excel File</h3>
                  <p className="text-sm text-muted-foreground">
                    Select your fixtures file (.xlsx or .xls)
                  </p>
                </div>
                <div className="mt-4">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="fixture-excel-upload"
                    disabled={isProcessing}
                    data-testid="input-fixture-excel"
                  />
                  <label htmlFor="fixture-excel-upload">
                    <Button asChild disabled={isProcessing} data-testid="button-choose-fixture-file">
                      <span className="cursor-pointer">
                        {isProcessing ? 'Processing...' : 'Choose File'}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Expected Excel Format</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p><strong>Required columns:</strong> Opposition/Opponent, Date, Venue/H/A</p>
                  <p><strong>Optional columns:</strong> Time/Kick Off, Competition/League, Goals For/GF, Goals Against/GA</p>
                  <p><strong>Venue formats:</strong> Home, Away, H, A</p>
                  <p className="text-xs text-muted-foreground">
                    Include Goals For and Goals Against to import results. Leave blank for scheduled fixtures.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-600">Valid</span>
                    </div>
                    <div className="text-2xl font-bold">{validFixtures}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-600">Warnings</span>
                    </div>
                    <div className="text-2xl font-bold">{warningFixtures}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-600">Errors</span>
                    </div>
                    <div className="text-2xl font-bold">{errorFixtures}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-600">Results</span>
                    </div>
                    <div className="text-2xl font-bold">{fixturesWithResults}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Fixture Preview Table */}
              <div className="border rounded-lg max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Opposition</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead>Competition</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Warnings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((fixture, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge 
                            variant={
                              fixture.status === 'valid' ? 'default' : 
                              fixture.status === 'warning' ? 'secondary' : 
                              'destructive'
                            }
                          >
                            {fixture.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {fixture.opposition}
                        </TableCell>
                        <TableCell>
                          {fixture.date ? format(new Date(fixture.date), 'MMM d, yyyy') : '-'}
                          {fixture.time && <div className="text-xs text-muted-foreground">{fixture.time}</div>}
                        </TableCell>
                        <TableCell>{fixture.venue}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {fixture.competition || '-'}
                        </TableCell>
                        <TableCell>
                          {fixture.hasResult ? (
                            <Badge variant="outline">
                              {fixture.goalsFor} - {fixture.goalsAgainst}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Scheduled</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {fixture.warnings && (
                            <div className="space-y-1">
                              {fixture.warnings.map((warning, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {warning}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">Import Successful!</h3>
              <p className="text-muted-foreground">
                {validFixtures} fixtures have been added to your schedule.
                {fixturesWithResults > 0 && ` (${fixturesWithResults} with results)`}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel-import">
              Cancel
            </Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')} data-testid="button-back-import">
                Back
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={isImporting || errorFixtures > 0}
                data-testid="button-confirm-import"
              >
                {isImporting ? 'Importing...' : `Import ${validFixtures} Fixtures`}
              </Button>
            </>
          )}
          {step === 'complete' && (
            <Button onClick={() => {
              setOpen(false);
              resetDialog();
            }} data-testid="button-close-import">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
