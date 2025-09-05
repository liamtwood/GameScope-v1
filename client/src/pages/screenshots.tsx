import { useState, useRef, useCallback, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Download, Eye, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import html2canvas from "html2canvas";

interface PageInfo {
  name: string;
  path: string;
  type: "page" | "modal" | "tab";
  description: string;
  hasParams?: boolean;
  paramExample?: string;
  ready?: boolean;
}

interface FileModifications {
  [pageName: string]: number;
}

export default function Screenshots() {
  const [screenshots, setScreenshots] = useState<Record<string, string>>({});
  const [capturing, setCapturing] = useState<Record<string, boolean>>({});
  const [captureTimestamps, setCaptureTimestamps] = useState<Record<string, number>>({});
  const [readyStates, setReadyStates] = useState<Record<string, boolean>>({});
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Hardcoded team information for Screenshots page only
  const hardcodedTeam = {
    name: "WOMEN'S SOCCER",
    club: "Polk State College"
  };

  // Fetch file modification times
  const { data: fileModifications } = useQuery<FileModifications>({
    queryKey: ['/api/file-modifications'],
    refetchOnWindowFocus: false,
  });

  // Initialize ready states from page definitions
  const initializeReadyStates = (items: PageInfo[]) => {
    const initialStates: Record<string, boolean> = {};
    items.forEach(item => {
      const key = `${item.type}-${item.name}`;
      initialStates[key] = item.ready || false;
    });
    return initialStates;
  };

  // Define all pages and modals in the app
  const pages: PageInfo[] = [
    { name: "Home", path: "/", type: "page", description: "Landing page with team overview", ready: true },
    { name: "Dashboard", path: "/dashboard", type: "page", description: "Main dashboard with key metrics", ready: true },
    { name: "Club Management", path: "/club-management", type: "page", description: "Manage club information and settings", ready: false },
    { name: "Fixtures", path: "/fixtures", type: "page", description: "View and manage match fixtures", ready: true },
    { name: "Squad", path: "/squad", type: "page", description: "Team squad management", ready: true },
    { name: "Statistics", path: "/statistics", type: "page", description: "Team performance statistics", ready: true },
    { name: "Videos", path: "/videos", type: "page", description: "Match video management", ready: false },
    { name: "Teams", path: "/teams", type: "page", description: "Team management interface", ready: false },
    { name: "Clubs", path: "/clubs", type: "page", description: "Club overview and management", ready: false },
    { name: "Users", path: "/users", type: "page", description: "User management interface", ready: false },
    { name: "DevOps Users", path: "/devops-users", type: "page", description: "System user management", ready: false },
    { name: "Settings", path: "/settings", type: "page", description: "Application settings", ready: false },
    { name: "Fixture Details", path: "/fixtures/cf7fef4a-8583-4423-96b6-b48dc29e9a46", type: "page", description: "Detailed fixture view with lineup and analysis", ready: true },
    { name: "Player Details", path: "/players/704e90f3-3a2a-45f5-a5b2-d4fab1ab7468", type: "page", description: "Individual player profile and statistics", ready: true },
    { name: "User Details", path: "/users/704e90f3-3a2a-45f5-a5b2-d4fab1ab7468", type: "page", description: "Individual user profile and permissions", ready: true },
    { name: "Analysis", path: "/analysis/86294596-50a7-40de-99c8-0de44c27f046", type: "page", description: "Match analysis with performance data", ready: true },
  ];

  const modals: PageInfo[] = [
    { name: "Player Create Dialog", path: "", type: "modal", description: "Add new player form", ready: false },
    { name: "Player Edit Dialog", path: "", type: "modal", description: "Edit player information", ready: false },
    { name: "Player Details Modal", path: "", type: "modal", description: "Detailed player view modal", ready: false },
    { name: "Fixture Create Dialog", path: "", type: "modal", description: "Create new fixture form", ready: false },
    { name: "Fixture Edit Dialog", path: "", type: "modal", description: "Edit fixture information", ready: false },
    { name: "Fixture Settings Dialog", path: "", type: "modal", description: "Fixture settings and configuration", ready: false },
    { name: "User Create Dialog", path: "", type: "modal", description: "Add new user form", ready: false },
  ];

  // Tab-level entries for pages with multiple tabs
  const tabs: PageInfo[] = [
    // Player Details tabs
    { name: "Player Details > Details Tab", path: "/players/704e90f3-3a2a-45f5-a5b2-d4fab1ab7468#details", type: "tab", description: "Player personal information tab", ready: true },
    { name: "Player Details > Teams Tab", path: "/players/704e90f3-3a2a-45f5-a5b2-d4fab1ab7468#teams", type: "tab", description: "Player team assignments tab", ready: true },
    { name: "Player Details > Parents Tab", path: "/players/704e90f3-3a2a-45f5-a5b2-d4fab1ab7468#parents", type: "tab", description: "Player parent information tab", ready: false },
    
    // Fixture Details tabs
    { name: "Fixture Details > Details Tab", path: "/fixtures/cf7fef4a-8583-4423-96b6-b48dc29e9a46#details", type: "tab", description: "Basic fixture information tab", ready: true },
    { name: "Fixture Details > Upload Video Tab", path: "/fixtures/cf7fef4a-8583-4423-96b6-b48dc29e9a46#videos", type: "tab", description: "Video upload and management tab", ready: false },
    { name: "Fixture Details > Lineups Tab", path: "/fixtures/cf7fef4a-8583-4423-96b6-b48dc29e9a46#lineups", type: "tab", description: "Team lineups and formations tab", ready: true },
    { name: "Fixture Details > Analysis Tab", path: "/fixtures/cf7fef4a-8583-4423-96b6-b48dc29e9a46#analysis", type: "tab", description: "GameScope analysis and statistics tab", ready: true },
    
    // Analysis page tabs (nested within Fixture Details > Analysis)
    { name: "Analysis > Game Details Tab", path: "/analysis/86294596-50a7-40de-99c8-0de44c27f046#heatmaps", type: "tab", description: "Game details and heat maps tab", ready: true },
    { name: "Analysis > Line-Ups Tab", path: "/analysis/86294596-50a7-40de-99c8-0de44c27f046#positions", type: "tab", description: "Position maps and lineup analysis tab", ready: true },
    { name: "Analysis > Videos Tab", path: "/analysis/86294596-50a7-40de-99c8-0de44c27f046#videos", type: "tab", description: "Video analysis and highlights tab", ready: false },
    { name: "Analysis > Upload Data Tab", path: "/analysis/86294596-50a7-40de-99c8-0de44c27f046#upload", type: "tab", description: "Data upload and statistics import tab", ready: false },
    { name: "Analysis > Statistics Tab", path: "/analysis/86294596-50a7-40de-99c8-0de44c27f046#statistics", type: "tab", description: "Detailed match statistics tab", ready: true },
    { name: "Analysis > Spider Charts Tab", path: "/analysis/86294596-50a7-40de-99c8-0de44c27f046#spider", type: "tab", description: "Performance spider charts tab", ready: true },
    { name: "Analysis > AI Analysis Tab", path: "/analysis/86294596-50a7-40de-99c8-0de44c27f046#ai", type: "tab", description: "AI-powered analysis insights tab", ready: false },
    
    // Fixture Details Analysis nested tabs
    { name: "Fixture Analysis > Fixture Details Tab", path: "/fixtures/cf7fef4a-8583-4423-96b6-b48dc29e9a46#analysis-fixture-details", type: "tab", description: "Nested fixture details within analysis", ready: true },
    { name: "Fixture Analysis > Statistics Tab", path: "/fixtures/cf7fef4a-8583-4423-96b6-b48dc29e9a46#analysis-statistics", type: "tab", description: "Nested statistics within analysis", ready: true },
    { name: "Fixture Analysis > Spider Charts Tab", path: "/fixtures/cf7fef4a-8583-4423-96b6-b48dc29e9a46#analysis-spider", type: "tab", description: "Nested spider charts within analysis", ready: true },
    { name: "Fixture Analysis > Heat Maps Tab", path: "/fixtures/cf7fef4a-8583-4423-96b6-b48dc29e9a46#analysis-heatmaps", type: "tab", description: "Nested heat maps within analysis", ready: false },
    { name: "Fixture Analysis > Position Maps Tab", path: "/fixtures/cf7fef4a-8583-4423-96b6-b48dc29e9a46#analysis-positions", type: "tab", description: "Nested position maps within analysis", ready: false },
    { name: "Fixture Analysis > AI Analysis Tab", path: "/fixtures/cf7fef4a-8583-4423-96b6-b48dc29e9a46#analysis-ai", type: "tab", description: "Nested AI analysis within analysis", ready: false },
    { name: "Fixture Analysis > Videos Tab", path: "/fixtures/cf7fef4a-8583-4423-96b6-b48dc29e9a46#analysis-videos", type: "tab", description: "Nested videos within analysis", ready: false },
    { name: "Fixture Analysis > Upload Data Tab", path: "/fixtures/cf7fef4a-8583-4423-96b6-b48dc29e9a46#analysis-upload", type: "tab", description: "Nested data upload within analysis", ready: false },
  ];

  const allItems = [...pages, ...modals, ...tabs];

  // Initialize ready states on mount
  useEffect(() => {
    if (Object.keys(readyStates).length === 0) {
      setReadyStates(initializeReadyStates(allItems));
    }
  }, [allItems]);

  // Toggle ready state for an item
  const toggleReady = (item: PageInfo) => {
    const key = `${item.type}-${item.name}`;
    setReadyStates(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Function to render the table for any array of items
  const renderTable = (items: PageInfo[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Ready</TableHead>
          <TableHead>Path/Description</TableHead>
          <TableHead>Last Modified</TableHead>
          <TableHead>Capture Date</TableHead>
          <TableHead>Download</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, index) => {
          const key = `${item.type}-${item.name}`;
          const hasScreenshot = screenshots[key];
          const isCapturing = capturing[key];
          const lastModified = fileModifications?.[item.name] || 0;

          return (
            <TableRow key={index}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>
                <Badge variant={
                  item.type === "page" ? "default" : 
                  item.type === "tab" ? "outline" : 
                  "secondary"
                }>
                  {item.type}
                </Badge>
              </TableCell>
              <TableCell>
                <input
                  type="checkbox"
                  checked={readyStates[key] || false}
                  onChange={() => toggleReady(item)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {item.type === "page" ? (
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {item.path}
                    </code>
                  ) : (
                    <span className="text-sm">{item.description}</span>
                  )}
                  {item.hasParams && (
                    <div className="text-xs text-muted-foreground">
                      Requires: {item.paramExample}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {lastModified > 0 ? (
                  <div className="text-sm">
                    <div>{new Date(lastModified).toLocaleDateString()}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(lastModified).toLocaleTimeString()}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Unknown</span>
                )}
              </TableCell>
              <TableCell>
                {isCapturing ? (
                  <div className="text-sm text-muted-foreground italic">Capturing...</div>
                ) : captureTimestamps[key] ? (
                  <div className="text-sm">
                    <div>{new Date(captureTimestamps[key]).toLocaleDateString()}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(captureTimestamps[key]).toLocaleTimeString()}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Not captured</span>
                )}
              </TableCell>
              <TableCell>
                {hasScreenshot ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => downloadScreenshot(item)}
                    className="p-2"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  const captureScreenshot = useCallback(async (item: PageInfo) => {
    const key = `${item.type}-${item.name}`;
    setCapturing(prev => ({ ...prev, [key]: true }));

    try {
      if (item.type === "page") {
        // Navigate to the page
        setLocation(item.path);
        
        // Wait for navigation and rendering
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Capture screenshot
        const canvas = await html2canvas(document.body, {
          height: window.innerHeight,
          width: window.innerWidth,
          useCORS: true,
          allowTaint: true,
          scale: 0.8,
        });
        
        const dataUrl = canvas.toDataURL('image/png');
        
        // Navigate back to screenshots page
        setLocation('/screenshots');
        
        // Wait a moment for navigation back
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update state
        setScreenshots(prev => ({ ...prev, [key]: dataUrl }));
        setCaptureTimestamps(prev => ({ ...prev, [key]: Date.now() }));
        
        toast({
          title: "Screenshot Captured",
          description: `Screenshot of ${item.name} page captured successfully.`,
        });
      } else {
        // For modals, we'll need to programmatically trigger them
        // This is a simplified approach - in a real app you'd need to trigger each modal
        toast({
          title: "Modal Screenshot",
          description: `Modal screenshots require manual triggering. Please open the ${item.name} and capture manually.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Screenshot capture failed:", error);
      toast({
        title: "Screenshot Failed",
        description: `Failed to capture screenshot of ${item.name}.`,
        variant: "destructive",
      });
    } finally {
      setCapturing(prev => ({ ...prev, [key]: false }));
    }
  }, [setLocation, toast]);

  const captureAllPages = useCallback(async () => {
    const allReadyItems = [...pages, ...modals, ...tabs].filter(item => {
      const key = `${item.type}-${item.name}`;
      return readyStates[key];
    });
    
    if (allReadyItems.length === 0) {
      toast({
        title: "No Pages Ready",
        description: "Please mark at least one page as ready before capturing.",
        variant: "destructive",
      });
      return;
    }
    
    // Only capture pages (skip modals and tabs for now)
    const readyPages = allReadyItems.filter(item => item.type === "page");
    
    if (readyPages.length === 0) {
      toast({
        title: "No Pages Ready",
        description: "Only page screenshots are supported. Please mark at least one page as ready.",
        variant: "destructive",
      });
      return;
    }
    
    for (const page of readyPages) {
      await captureScreenshot(page);
      // Add delay between captures
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    toast({
      title: "Capture Complete",
      description: `Successfully captured ${readyPages.length} ready pages.`,
    });
  }, [pages, modals, tabs, readyStates, captureScreenshot, toast]);

  const downloadScreenshot = (item: PageInfo) => {
    const key = `${item.type}-${item.name}`;
    const dataUrl = screenshots[key];
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `${item.name.toLowerCase().replace(/\s+/g, '-')}-screenshot.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const viewScreenshot = (item: PageInfo) => {
    const key = `${item.type}-${item.name}`;
    const dataUrl = screenshots[key];
    if (dataUrl) {
      window.open(dataUrl, '_blank');
    }
  };

  return (
    <MainLayout 
      title="Screenshots" 
      subtitle="Capture and manage screenshots of all pages and modals"
    >
      <div className="container mx-auto space-y-6">
        {/* Hardcoded Team Information Display */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-blue-800 dark:text-blue-200">
              Screenshots Configuration (Hardcoded for Testing)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    {hardcodedTeam.name}
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {hardcodedTeam.club}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <Badge variant="outline" className="text-blue-800 border-blue-300">
                    Fixed Selection
                  </Badge>
                </div>
              </div>
              
              <div className="border-t border-blue-200 dark:border-blue-700 pt-3">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Working IDs for Screenshots:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-blue-700 dark:text-blue-300">
                    <strong>Fixture:</strong> cf7fef4a-8583-4423-96b6-b48dc29e9a46
                  </div>
                  <div className="text-blue-700 dark:text-blue-300">
                    <strong>Player:</strong> 704e90f3-3a2a-45f5-a5b2-d4fab1ab7468
                  </div>
                  <div className="text-blue-700 dark:text-blue-300">
                    <strong>User:</strong> 704e90f3-3a2a-45f5-a5b2-d4fab1ab7468
                  </div>
                  <div className="text-blue-700 dark:text-blue-300">
                    <strong>Analysis:</strong> 86294596-50a7-40de-99c8-0de44c27f046
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={captureAllPages} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Capture All Ready Pages
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Pages, Modals & Tabs ({allItems.length} items)</CardTitle>
          </CardHeader>
          <CardContent>
            {renderTable(allItems)}
          </CardContent>
        </Card>

        {Object.keys(screenshots).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Screenshot Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(screenshots).map(([key, dataUrl]) => {
                  const item = allItems.find(item => `${item.type}-${item.name}` === key);
                  return (
                    <div key={key} className="border rounded-lg p-4 space-y-2">
                      <h3 className="font-medium">{item?.name}</h3>
                      <img
                        src={dataUrl}
                        alt={`Screenshot of ${item?.name}`}
                        className="w-full h-48 object-cover rounded border cursor-pointer hover:opacity-80"
                        onClick={() => viewScreenshot(item!)}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => viewScreenshot(item!)}>
                          View Full
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => downloadScreenshot(item!)}>
                          Download
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}