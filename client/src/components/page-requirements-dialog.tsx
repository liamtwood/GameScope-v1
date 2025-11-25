import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info, CheckCircle2, Circle } from "lucide-react";
import { useLocation } from "wouter";

interface Requirement {
  id: string;
  description: string;
}

interface PageRequirements {
  title: string;
  overview: string;
  functionalRequirements: { id: string; title: string; description: string }[];
  acceptanceCriteria: Requirement[];
}

const pageRequirementsData: Record<string, PageRequirements> = {
  "/videos": {
    title: "Match Video Listing Page",
    overview: "A page to browse, filter, and access match video recordings organized by competition.",
    functionalRequirements: [
      { id: "FR-1", title: "View Mode Selection", description: "Users can switch between Tile Mode and Watch Mode. Selected view mode persists in localStorage." },
      { id: "FR-2", title: "Filtering", description: "Competition dropdown to filter fixtures by competition (or 'All Competitions'). Keyword search field to filter fixtures by opponent name (case-insensitive)." },
      { id: "FR-3", title: "Sorting", description: "Toggle button to switch between earliest-first and latest-first display. Visual indicator (arrow up/down) shows current sort order." },
      { id: "FR-4", title: "Video Preview Display", description: "Shows club logo on the left, score in center, opponent logo on the right. Play button overlay in center. Shows 'No video' indicator when video unavailable." },
      { id: "FR-5", title: "Tile Mode Cards", description: "Grid layout (1-3 columns based on screen size). Grouped by competition with match count. Card footer shows date and Home/Away badge." },
      { id: "FR-6", title: "Watch Mode", description: "Horizontal scrolling fixture selector. Larger video preview with match details. Match report and attendance display (when available)." },
    ],
    acceptanceCriteria: [
      { id: "AC-1", description: "Selecting a competition filters fixtures to only that competition" },
      { id: "AC-2", description: "Typing in search field immediately filters fixtures by opponent name" },
      { id: "AC-3", description: "Both team logos display correctly (fallback to initials if no logo)" },
      { id: "AC-4", description: "Score displays correctly based on home/away fixture type" },
      { id: "AC-5", description: "Clicking any fixture card navigates to Watch Match Video page" },
      { id: "AC-6", description: "View mode preference persists across page refreshes" },
    ],
  },
  "/watch-match-video": {
    title: "Watch Match Video Page",
    overview: "Full match analysis page with video player, events, statistics, and reporting.",
    functionalRequirements: [
      { id: "FR-7", title: "Match Score Banner", description: "Displays both team logos, names, and final score. Shows match date and venue type." },
      { id: "FR-8", title: "Camera Selector", description: "Dropdown labeled 'Choose Camera:' in Video Player tab header. Lists all uploaded videos for the fixture by their label/name. Switching camera loads the selected video." },
      { id: "FR-9", title: "Video Player Tab", description: "Supports YouTube, Google Drive, direct video files, and FIFA Plus links. FIFA Plus videos show external link button (cannot embed). Native video controls for direct video files." },
      { id: "FR-10", title: "Match Events Tab", description: "Displays match events in tabular format. Linked to video timestamps when available." },
      { id: "FR-11", title: "Team Statistics Tab", description: "Comparison metrics between teams. Visual stat bars/comparisons." },
      { id: "FR-12", title: "Spider Charts Tab", description: "Multi-category radar charts comparing team performance. Categories: Attack, Defense, Possession, Technical." },
      { id: "FR-13", title: "Match Report Tab", description: "Displays written match report text. Shows attendance figures when available." },
    ],
    acceptanceCriteria: [
      { id: "AC-7", description: "Camera selector shows all uploaded video names for the fixture" },
      { id: "AC-8", description: "Changing camera selection loads the corresponding video" },
      { id: "AC-9", description: "YouTube videos embed and play correctly" },
      { id: "AC-10", description: "Google Drive videos embed correctly" },
      { id: "AC-11", description: "Direct video files play with native controls" },
      { id: "AC-12", description: "FIFA Plus links show 'Open in FIFA Plus' button" },
      { id: "AC-13", description: "Back button returns to Match Video listing page" },
      { id: "AC-14", description: "All five tabs display appropriate content when selected" },
    ],
  },
  "/fixtures": {
    title: "Fixtures Page",
    overview: "Manage team fixtures, schedules, and match planning with video upload capabilities.",
    functionalRequirements: [
      { id: "FR-1", title: "Season Tab", description: "View and manage all fixtures for the season. Filter by competition. Create, edit, and delete fixtures." },
      { id: "FR-2", title: "Planning Tab", description: "Calendar view of upcoming fixtures. Quick access to fixture details." },
      { id: "FR-3", title: "Videos Tab", description: "Upload and manage match videos for fixtures. Support for multiple camera angles per fixture." },
      { id: "FR-4", title: "Logos Tab", description: "Manage team logos with background removal. Individual theme controls per logo container." },
    ],
    acceptanceCriteria: [
      { id: "AC-1", description: "Fixtures can be created with opponent, date, venue, and competition" },
      { id: "AC-2", description: "Fixtures can be edited and updated" },
      { id: "AC-3", description: "Videos can be uploaded and associated with fixtures" },
      { id: "AC-4", description: "Multiple camera angles supported per fixture" },
    ],
  },
  "/squad": {
    title: "Squad Management Page",
    overview: "Manage team roster, player information, and squad composition.",
    functionalRequirements: [
      { id: "FR-1", title: "Player List", description: "Display all players in the squad with photos, names, and positions." },
      { id: "FR-2", title: "Player Details", description: "View detailed player information including stats and contact info." },
      { id: "FR-3", title: "Import/Export", description: "Import players from Excel/JSON. Export squad data." },
    ],
    acceptanceCriteria: [
      { id: "AC-1", description: "Players display with correct information" },
      { id: "AC-2", description: "Player profiles are accessible and complete" },
      { id: "AC-3", description: "Excel import correctly populates player data" },
    ],
  },
  "/": {
    title: "Dashboard Page",
    overview: "Overview of team performance and key metrics at a glance.",
    functionalRequirements: [
      { id: "FR-1", title: "Quick Stats", description: "Display key team statistics and recent results." },
      { id: "FR-2", title: "Upcoming Fixtures", description: "Show next scheduled matches." },
      { id: "FR-3", title: "Recent Activity", description: "Display recent team activities and updates." },
    ],
    acceptanceCriteria: [
      { id: "AC-1", description: "Dashboard loads with current team data" },
      { id: "AC-2", description: "Stats reflect actual team performance" },
      { id: "AC-3", description: "Upcoming fixtures show correct dates" },
    ],
  },
};

export function PageRequirementsDialog() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  
  const getRequirementsForPath = (path: string): PageRequirements | null => {
    if (pageRequirementsData[path]) {
      return pageRequirementsData[path];
    }
    if (path.startsWith("/watch-match-video")) {
      return pageRequirementsData["/watch-match-video"];
    }
    for (const key of Object.keys(pageRequirementsData)) {
      if (path.startsWith(key) && key !== "/") {
        return pageRequirementsData[key];
      }
    }
    return pageRequirementsData["/"] || null;
  };

  const requirements = getRequirementsForPath(location);

  if (!requirements) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          data-testid="button-page-requirements"
        >
          <Info className="h-5 w-5 text-muted-foreground hover:text-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">{requirements.title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">OVERVIEW</h3>
              <p className="text-sm">{requirements.overview}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">FUNCTIONAL REQUIREMENTS</h3>
              <div className="space-y-3">
                {requirements.functionalRequirements.map((req) => (
                  <div key={req.id} className="border rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{req.id}</span>
                      <div>
                        <h4 className="font-medium text-sm">{req.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{req.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">ACCEPTANCE CRITERIA</h3>
              <div className="space-y-2">
                {requirements.acceptanceCriteria.map((ac) => (
                  <div key={ac.id} className="flex items-start gap-2 text-sm">
                    <Circle className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <span>
                      <span className="font-mono text-xs text-muted-foreground">{ac.id}:</span>{" "}
                      {ac.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
