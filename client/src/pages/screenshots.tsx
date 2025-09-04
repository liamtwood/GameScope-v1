import { useState, useRef, useCallback } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Download, Eye, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import html2canvas from "html2canvas";

interface PageInfo {
  name: string;
  path: string;
  type: "page" | "modal";
  description: string;
  hasParams?: boolean;
  paramExample?: string;
}

export default function Screenshots() {
  const [screenshots, setScreenshots] = useState<Record<string, string>>({});
  const [capturing, setCapturing] = useState<Record<string, boolean>>({});
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Define all pages and modals in the app
  const pages: PageInfo[] = [
    { name: "Home", path: "/", type: "page", description: "Landing page with team overview" },
    { name: "Dashboard", path: "/dashboard", type: "page", description: "Main dashboard with key metrics" },
    { name: "Club Management", path: "/club-management", type: "page", description: "Manage club information and settings" },
    { name: "Fixtures", path: "/fixtures", type: "page", description: "View and manage match fixtures" },
    { name: "Squad", path: "/squad", type: "page", description: "Team squad management" },
    { name: "Statistics", path: "/statistics", type: "page", description: "Team performance statistics" },
    { name: "Videos", path: "/videos", type: "page", description: "Match video management" },
    { name: "Teams", path: "/teams", type: "page", description: "Team management interface" },
    { name: "Clubs", path: "/clubs", type: "page", description: "Club overview and management" },
    { name: "Users", path: "/users", type: "page", description: "User management interface" },
    { name: "DevOps Users", path: "/devops-users", type: "page", description: "System user management" },
    { name: "Settings", path: "/settings", type: "page", description: "Application settings" },
    { name: "Fixture Details", path: "/fixtures/cf7fef4a-8583-4423-96b6-b48db29e9a46", type: "page", description: "Detailed fixture view", hasParams: true, paramExample: "fixture ID" },
    { name: "Player Details", path: "/players/704e90f3-3a2a-45f5-a5b2-d4fab1ab7468", type: "page", description: "Individual player profile", hasParams: true, paramExample: "player ID" },
    { name: "User Details", path: "/users/704e90f3-3a2a-45f5-a5b2-d4fab1ab7468", type: "page", description: "Individual user profile", hasParams: true, paramExample: "user ID" },
    { name: "Analysis", path: "/analysis/cf7fef4a-8583-4423-96b6-b48db29e9a46", type: "page", description: "Match analysis view", hasParams: true, paramExample: "fixture ID" },
  ];

  const modals: PageInfo[] = [
    { name: "Player Create Dialog", path: "", type: "modal", description: "Add new player form" },
    { name: "Player Edit Dialog", path: "", type: "modal", description: "Edit player information" },
    { name: "Player Details Modal", path: "", type: "modal", description: "Detailed player view modal" },
    { name: "Fixture Create Dialog", path: "", type: "modal", description: "Create new fixture form" },
    { name: "Fixture Edit Dialog", path: "", type: "modal", description: "Edit fixture information" },
    { name: "Fixture Settings Dialog", path: "", type: "modal", description: "Fixture settings and configuration" },
    { name: "User Create Dialog", path: "", type: "modal", description: "Add new user form" },
  ];

  const allItems = [...pages, ...modals];

  const captureScreenshot = useCallback(async (item: PageInfo) => {
    const key = `${item.type}-${item.name}`;
    setCapturing(prev => ({ ...prev, [key]: true }));

    try {
      if (item.type === "page") {
        // Navigate to the page
        setLocation(item.path);
        
        // Wait for navigation and rendering
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Capture screenshot
        const canvas = await html2canvas(document.body, {
          height: window.innerHeight,
          width: window.innerWidth,
          useCORS: true,
          allowTaint: true,
          scale: 0.8,
        });
        
        const dataUrl = canvas.toDataURL('image/png');
        setScreenshots(prev => ({ ...prev, [key]: dataUrl }));
        
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
    for (const page of pages) {
      await captureScreenshot(page);
      // Add delay between captures
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }, [pages, captureScreenshot]);

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
        <div className="flex justify-end">
          <Button onClick={captureAllPages} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Capture All Pages
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Application Pages & Modals</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Path/Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allItems.map((item, index) => {
                  const key = `${item.type}-${item.name}`;
                  const hasScreenshot = screenshots[key];
                  const isCapturing = capturing[key];

                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Badge variant={item.type === "page" ? "default" : "secondary"}>
                          {item.type}
                        </Badge>
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
                        {isCapturing ? (
                          <Badge variant="outline">Capturing...</Badge>
                        ) : hasScreenshot ? (
                          <Badge variant="default">Captured</Badge>
                        ) : (
                          <Badge variant="secondary">Not captured</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => captureScreenshot(item)}
                            disabled={isCapturing || item.type === "modal"}
                            className="gap-1"
                          >
                            <Camera className="h-3 w-3" />
                            Capture
                          </Button>
                          {hasScreenshot && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewScreenshot(item)}
                                className="gap-1"
                              >
                                <Eye className="h-3 w-3" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadScreenshot(item)}
                                className="gap-1"
                              >
                                <Download className="h-3 w-3" />
                                Download
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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