import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, Users, UserCheck, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ExcelImportDialogProps {
  teamId: string;
  onImportComplete?: () => void;
  children: React.ReactNode;
}

interface PlayerPreview {
  firstName: string;
  lastName: string;
  position: string;
  jerseyNumber: number | null;
  email?: string;
  phone?: string;
  dob?: string;
  status: 'valid' | 'warning' | 'error';
  warnings?: string[];
}

export function ExcelImportDialog({ teamId, onImportComplete, children }: ExcelImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PlayerPreview[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');
  const { toast } = useToast();

  const resetDialog = () => {
    setFile(null);
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
      const previewResponse = await apiRequest('POST', '/api/squad/preview-excel', {
        filename
      });
      
      const previewData = await previewResponse.json();

      // Process preview data and add validation
      const processedData: PlayerPreview[] = previewData.players.map((player: any) => {
        const warnings: string[] = [];
        let status: 'valid' | 'warning' | 'error' = 'valid';

        // Required: first name + last name
        if (!player.firstName || !player.lastName) {
          warnings.push('Missing name');
          status = 'error';
        }

        // Optional: position — no position column or unrecognised value → defaults to 'None'
        if (!player.position || player.position === 'None') {
          warnings.push('No position (will default to None)');
          if (status === 'valid') status = 'warning';
        }

        // Optional: jersey number — warning only
        if (player.jerseyNumber === null || player.jerseyNumber === undefined || isNaN(player.jerseyNumber)) {
          warnings.push('No jersey number');
          if (status === 'valid') status = 'warning';
        }

        // Optional: email — warning only
        if (!player.email) {
          warnings.push('No email');
          if (status === 'valid') status = 'warning';
        }

        return {
          firstName: player.firstName || '',
          lastName: player.lastName || '',
          position: player.position || '',
          jerseyNumber: player.jerseyNumber ?? null,
          email: player.email || '',
          phone: player.phone || '',
          dob: player.dob || '',
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

      // Import players
      const importResponse = await apiRequest('POST', '/api/squad/import-excel', {
        filename,
        teamId
      });
      
      const importData = await importResponse.json();

      if (importData.success) {
        // Refresh the team players list
        queryClient.invalidateQueries({ queryKey: ["/api/team", teamId, "users"] });
        
        toast({
          title: "Import Successful",
          description: `Successfully imported ${importData.imported} players from Excel file.`,
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
        description: "Failed to import players from Excel file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const validPlayers = previewData.filter(p => p.status !== 'error').length;
  const warningPlayers = previewData.filter(p => p.status === 'warning').length;
  const errorPlayers = previewData.filter(p => p.status === 'error').length;

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Squad from Excel
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && "Upload an Excel file to import your squad roster"}
            {step === 'preview' && "Review the players before importing to your team"}
            {step === 'complete' && "Import completed successfully!"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Upload Excel File</h3>
                  <p className="text-sm text-muted-foreground">
                    Select your squad roster file (.xlsx or .xls)
                  </p>
                </div>
                <div className="mt-4">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="excel-upload"
                    disabled={isProcessing}
                  />
                  <label htmlFor="excel-upload">
                    <Button asChild disabled={isProcessing}>
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
                  <p><strong>Required columns:</strong> First Name/first, Last Name/last</p>
                  <p><strong>Optional columns:</strong> Position, Number/number, Email, Phone, DOB</p>
                  <p><strong>Supported positions:</strong> GK, DEF, MID, FWD (defaults to None if missing)</p>
                  <p className="text-xs text-muted-foreground">Column names are case-insensitive — "First Name", "first name" and "first" all work</p>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <UserCheck className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-600">Valid</span>
                    </div>
                    <div className="text-2xl font-bold">{validPlayers}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-600">Warnings</span>
                    </div>
                    <div className="text-2xl font-bold">{warningPlayers}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-600">Errors</span>
                    </div>
                    <div className="text-2xl font-bold">{errorPlayers}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Player Preview Table */}
              <div className="border rounded-lg max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>First Name</TableHead>
                      <TableHead>Last Name</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Jersey #</TableHead>
                      <TableHead>DOB</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Warnings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((player, index) => (
                      <TableRow key={index} className={player.status === 'error' ? 'bg-red-50 dark:bg-red-950/20' : player.status === 'warning' ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}>
                        <TableCell>
                          <Badge 
                            variant={
                              player.status === 'valid' ? 'default' : 
                              player.status === 'warning' ? 'secondary' : 
                              'destructive'
                            }
                          >
                            {player.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{player.firstName}</TableCell>
                        <TableCell className="font-medium">{player.lastName}</TableCell>
                        <TableCell>{player.position || <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell>{player.jerseyNumber ?? <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {player.dob || '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {player.email || '—'}
                        </TableCell>
                        <TableCell>
                          {player.warnings && (
                            <div className="space-y-1">
                              {player.warnings.map((warning, i) => (
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
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">Import Successful!</h3>
              <p className="text-muted-foreground">
                {validPlayers} players have been added to your squad.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={isImporting || errorPlayers > 0}
              >
                {isImporting ? 'Importing...' : `Import ${validPlayers} Players`}
              </Button>
            </>
          )}
          {step === 'complete' && (
            <Button onClick={() => {
              setOpen(false);
              resetDialog();
            }}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}