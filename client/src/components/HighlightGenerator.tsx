import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Sparkles, 
  Trophy, 
  Target, 
  Clock, 
  Play,
  Download,
  Share,
  Filter,
  TrendingUp,
  Star,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import matchEvents from '@/data/match-events.json';

interface MatchEvent {
  id: string;
  index: number;
  period: number;
  timestamp: string;
  minute: number;
  second: number;
  type: {
    id: number;
    name: string;
  };
  team: {
    id: number;
    name: string;
  };
  player?: {
    id: number;
    name: string;
  };
  location?: number[];
  shot?: {
    statsbomb_xg: number;
    end_location: number[];
    technique?: { id: number; name: string; };
    body_part?: { id: number; name: string; };
    type?: { id: number; name: string; };
    outcome: { id: number; name: string; };
    first_time?: boolean;
    freeze_frame?: any[];
  };
  goalkeeper?: {
    technique?: { id: number; name: string; };
    position?: { id: number; name: string; };
    body_part?: { id: number; name: string; };
    outcome?: { id: number; name: string; };
  };
  foul_committed?: {
    advantage?: boolean;
    penalty?: boolean;
    card?: { id: number; name: string; };
  };
  substitution?: {
    outcome: { id: number; name: string; };
    replacement: { id: number; name: string; };
  };
}

interface HighlightEvent {
  id: string;
  event: MatchEvent;
  score: number;
  tier: 1 | 2 | 3;
  category: string;
  startTime: number;
  endTime: number;
  duration: number;
  contextBefore: number;
  contextAfter: number;
  description: string;
}

interface HighlightPackage {
  id: string;
  name: string;
  duration: string;
  totalDuration: number;
  events: HighlightEvent[];
  description: string;
}

interface HighlightGeneratorProps {
  onHighlightSelect?: (highlight: HighlightEvent) => void;
  onPackageGenerate?: (highlightPackage: HighlightPackage) => void;
  onViewHighlightsVideo?: (videoUrl: string, highlightPackage: HighlightPackage) => void;
}

export function HighlightGenerator({ onHighlightSelect, onPackageGenerate, onViewHighlightsVideo }: HighlightGeneratorProps) {
  const [selectedPackageType, setSelectedPackageType] = useState<string>("standard");
  const [generating, setGenerating] = useState(false);
  const [generatedPackages, setGeneratedPackages] = useState<HighlightPackage[]>([]);
  
  // Pre-made highlights video for "fake" generation
  const HIGHLIGHTS_VIDEO_URL = "https://youtu.be/SETklkU1G8Y";
  const [selectedTiers, setSelectedTiers] = useState<number[]>([1, 2, 3]);

  // Convert timestamp to seconds
  const timestampToSeconds = (timestamp: string): number => {
    const [hours, minutes, seconds] = timestamp.split(':');
    const [secs, ms] = seconds.split('.');
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(secs) + (parseInt(ms || '0') / 1000);
  };

  // Scoring system based on the framework
  const calculateEventScore = (event: MatchEvent): { score: number; tier: 1 | 2 | 3; category: string } => {
    let baseScore = 0;
    let category = "Other";
    
    // Tier 1 Events (80-100 points) - Must Include
    if (event.type.name === "Shot" && event.shot?.outcome.name === "Goal") {
      baseScore = 100;
      category = "Goal";
    } else if (event.type.name === "Foul Committed" && event.foul_committed?.penalty) {
      baseScore = 90;
      category = "Penalty";
    } else if (event.foul_committed?.card?.name === "Red Card") {
      baseScore = 85;
      category = "Red Card";
    }
    
    // Tier 2 Events (60-79 points) - High Priority
    else if (event.type.name === "Goal Keeper" && event.goalkeeper?.outcome?.name === "Success") {
      baseScore = 70;
      category = "Great Save";
    } else if (event.type.name === "Shot" && event.shot?.outcome.name === "Off T") {
      baseScore = 65;
      category = "Near Miss";
    } else if (event.type.name === "Shot" && event.shot?.outcome.name === "Wayward") {
      baseScore = 60;
      category = "Near Miss";
    } else if (event.foul_committed?.card?.name === "Yellow Card") {
      baseScore = 50;
      category = "Yellow Card";
    } else if (event.type.name === "Shot" && event.shot?.outcome.name === "Saved") {
      baseScore = 60;
      category = "Great Save";
    }
    
    // Tier 3 Events (25-59 points) - Context & Flow
    else if (event.type.name === "Shot") {
      baseScore = 40;
      category = "Key Chance";
    } else if (event.type.name === "Substitution") {
      baseScore = 30;
      category = "Tactical Moment";
    } else if (event.type.name === "Pass" && event.location && event.location[0] > 80) {
      baseScore = 35;
      category = "Key Chance";
    } else if (event.type.name === "Dribble") {
      baseScore = 30;
      category = "Skillful Play";
    } else {
      baseScore = 10;
      category = "Other";
    }

    // Apply location modifier
    let locationModifier = 1.0;
    if (event.location) {
      // Higher value for events in attacking third (x > 66.7)
      if (event.location[0] > 80) locationModifier = 1.3;
      else if (event.location[0] > 66.7) locationModifier = 1.2;
      // Penalty area events get extra weight
      if (event.location[0] > 88 && event.location[1] > 22 && event.location[1] < 58) {
        locationModifier = 1.5;
      }
    }

    // Apply context modifier
    let contextModifier = 1.0;
    // Late in the match gets more weight
    if (event.minute > 75) contextModifier = 1.4;
    else if (event.minute > 60) contextModifier = 1.2;
    // xG context for shots
    if (event.shot?.statsbomb_xg) {
      if (event.shot.statsbomb_xg > 0.3) contextModifier *= 1.3;
      else if (event.shot.statsbomb_xg > 0.15) contextModifier *= 1.1;
    }

    const finalScore = Math.round(baseScore * locationModifier * contextModifier);
    
    // Determine tier
    let tier: 1 | 2 | 3;
    if (finalScore >= 80) tier = 1;
    else if (finalScore >= 60) tier = 2;
    else tier = 3;

    return { score: finalScore, tier, category };
  };

  // Generate highlights based on events
  const generateHighlights = useMemo((): HighlightEvent[] => {
    return matchEvents
      .filter(event => event.type.name !== "Starting XI" && event.type.name !== "Half Start" && event.type.name !== "Half End")
      .map(event => {
        const { score, tier, category } = calculateEventScore(event as MatchEvent);
        const startTimeSeconds = timestampToSeconds(event.timestamp);
        
        // Context windows based on event type
        let contextBefore = 5; // Default 5 seconds before
        let contextAfter = 3;  // Default 3 seconds after
        
        if (category === "Goal") {
          contextBefore = 15; // Show build-up
          contextAfter = 10;  // Show celebration
        } else if (category === "Penalty" || category === "Red Card") {
          contextBefore = 10;
          contextAfter = 5;
        } else if (category === "Great Save") {
          contextBefore = 8;
          contextAfter = 5;
        }

        const startTime = Math.max(0, startTimeSeconds - contextBefore);
        const endTime = startTimeSeconds + contextAfter;
        const duration = endTime - startTime;

        return {
          id: `highlight-${event.id}`,
          event: event as MatchEvent,
          score,
          tier,
          category,
          startTime,
          endTime,
          duration,
          contextBefore,
          contextAfter,
          description: `${category}: ${event.player?.name || 'Team'} - ${event.minute}:${event.second.toString().padStart(2, '0')}`
        };
      })
      .filter(highlight => highlight.score >= 25) // Minimum threshold
      .sort((a, b) => b.score - a.score); // Sort by score descending
  }, []);

  // Package generation based on framework
  const packageTypes = {
    quick: {
      name: "Quick Highlights",
      duration: "60-90 seconds",
      maxDuration: 90,
      description: "Goals, red cards, penalties only"
    },
    standard: {
      name: "Standard Highlights", 
      duration: "3-5 minutes",
      maxDuration: 300,
      description: "All Tier 1 events + best of Tier 2"
    },
    extended: {
      name: "Extended Highlights",
      duration: "8-10 minutes", 
      maxDuration: 600,
      description: "All Tier 1 & 2 + selected Tier 3"
    },
    story: {
      name: "Full Match Story",
      duration: "15-20 minutes",
      maxDuration: 1200,
      description: "Complete narrative with all significant events"
    }
  };

  const generatePackage = async (packageType: string) => {
    setGenerating(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
    
    const config = packageTypes[packageType as keyof typeof packageTypes];
    let selectedHighlights: HighlightEvent[] = [];
    let totalDuration = 0;

    // Package-specific selection logic
    switch (packageType) {
      case "quick":
        selectedHighlights = generateHighlights.filter(h => h.tier === 1).slice(0, 5);
        break;
      case "standard":
        const tier1Events = generateHighlights.filter(h => h.tier === 1);
        const tier2Events = generateHighlights.filter(h => h.tier === 2).slice(0, 8);
        selectedHighlights = [...tier1Events, ...tier2Events].slice(0, 15);
        break;
      case "extended":
        const allTier12 = generateHighlights.filter(h => h.tier <= 2);
        const tier3Events = generateHighlights.filter(h => h.tier === 3).slice(0, 10);
        selectedHighlights = [...allTier12, ...tier3Events].slice(0, 25);
        break;
      case "story":
        selectedHighlights = generateHighlights.slice(0, 40);
        break;
    }

    // Sort events chronologically by match time (earliest to latest)
    selectedHighlights.sort((a, b) => {
      // First sort by period (1st half before 2nd half)
      if (a.event.period !== b.event.period) {
        return a.event.period - b.event.period;
      }
      // Then sort by minute within the period
      if (a.event.minute !== b.event.minute) {
        return a.event.minute - b.event.minute;
      }
      // Finally sort by second within the minute
      return a.event.second - b.event.second;
    });

    // Calculate total duration
    totalDuration = selectedHighlights.reduce((sum, h) => sum + h.duration, 0);
    
    // Ensure we don't exceed max duration by trimming lower-priority events
    // For chronological order, we trim from the end (latest events) to preserve early match flow
    if (totalDuration > config.maxDuration) {
      let runningTotal = 0;
      selectedHighlights = selectedHighlights.filter(h => {
        if (runningTotal + h.duration <= config.maxDuration) {
          runningTotal += h.duration;
          return true;
        }
        return false;
      });
      totalDuration = runningTotal;
    }

    const newHighlightPackage: HighlightPackage = {
      id: `highlight-pkg-${Date.now()}`,
      name: config.name,
      duration: config.duration,
      totalDuration,
      events: selectedHighlights,
      description: config.description
    };

    setGeneratedPackages(prev => [...prev, newHighlightPackage]);
    onPackageGenerate?.(newHighlightPackage);
    setGenerating(false);
  };

  const getTierIcon = (tier: number) => {
    switch (tier) {
      case 1: return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 2: return <Star className="h-4 w-4 text-blue-500" />;
      case 3: return <Target className="h-4 w-4 text-green-500" />;
      default: return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1: return "bg-yellow-100 text-yellow-800";
      case 2: return "bg-blue-100 text-blue-800";
      case 3: return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Filter highlights by selected tiers
  const filteredHighlights = generateHighlights.filter(h => selectedTiers.includes(h.tier));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Highlight Generator
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="events">All Events ({filteredHighlights.length})</TabsTrigger>
            <TabsTrigger value="packages">Packages ({generatedPackages.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4">
            {/* Package Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Highlight Package Type</label>
              <Select value={selectedPackageType} onValueChange={setSelectedPackageType}>
                <SelectTrigger data-testid="package-type-select">
                  <SelectValue placeholder="Select package type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(packageTypes).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{config.name}</span>
                        <span className="text-xs text-gray-500">{config.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                  <div className="text-2xl font-bold">{generateHighlights.filter(h => h.tier === 1).length}</div>
                  <div className="text-xs text-gray-500">Tier 1 Events</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Star className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">{generateHighlights.filter(h => h.tier === 2).length}</div>
                  <div className="text-xs text-gray-500">Tier 2 Events</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Target className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">{generateHighlights.filter(h => h.tier === 3).length}</div>
                  <div className="text-xs text-gray-500">Tier 3 Events</div>
                </CardContent>
              </Card>
            </div>

            {/* Generate Button */}
            <Button 
              onClick={() => generatePackage(selectedPackageType)}
              disabled={generating}
              className="w-full"
              size="lg"
              data-testid="generate-highlights-btn"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Highlights...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate {packageTypes[selectedPackageType as keyof typeof packageTypes]?.name}
                </>
              )}
            </Button>

            {generating && (
              <div className="space-y-2">
                <Progress value={75} className="w-full" />
                <p className="text-sm text-center text-gray-500">
                  Analyzing events and creating highlight timeline...
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            {/* Tier Filter */}
            <div className="flex gap-2 flex-wrap">
              <span className="text-sm font-medium">Filter by Tier:</span>
              {[1, 2, 3].map(tier => (
                <Button
                  key={tier}
                  variant={selectedTiers.includes(tier) ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTiers(prev => 
                    prev.includes(tier) 
                      ? prev.filter(t => t !== tier)
                      : [...prev, tier]
                  )}
                  data-testid={`tier-${tier}-filter`}
                >
                  {getTierIcon(tier)}
                  <span className="ml-1">Tier {tier}</span>
                </Button>
              ))}
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredHighlights.map((highlight) => (
                  <Card 
                    key={highlight.id} 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => onHighlightSelect?.(highlight)}
                    data-testid={`highlight-event-${highlight.event.index}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getTierIcon(highlight.tier)}
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge className={getTierColor(highlight.tier)}>
                                {highlight.category}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Score: {highlight.score}
                              </Badge>
                            </div>
                            <p className="text-sm mt-1">{highlight.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-mono">
                            {Math.floor(highlight.startTime / 60)}:{(highlight.startTime % 60).toFixed(0).padStart(2, '0')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {highlight.duration}s clip
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="packages" className="space-y-4">
            {generatedPackages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No highlight packages generated yet.</p>
                <p className="text-sm">Use the Generate tab to create your first package.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {generatedPackages.map((highlightPkg) => (
                  <Card key={highlightPkg.id} data-testid={`highlight-package-${highlightPkg.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{highlightPkg.name}</CardTitle>
                          <p className="text-sm text-gray-500">{highlightPkg.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => onViewHighlightsVideo?.(HIGHLIGHTS_VIDEO_URL, highlightPkg)}
                            data-testid="view-highlights-video"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            View Highlights
                          </Button>
                          <Button variant="outline" size="sm" data-testid="share-package">
                            <Share className="h-4 w-4 mr-1" />
                            Share
                          </Button>
                          <Button variant="outline" size="sm" data-testid="download-package">
                            <Download className="h-4 w-4 mr-1" />
                            Export
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 mb-4">
                        <Badge variant="secondary">
                          {highlightPkg.events.length} events
                        </Badge>
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          {Math.floor(highlightPkg.totalDuration / 60)}m {(highlightPkg.totalDuration % 60).toFixed(0)}s
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {highlightPkg.events.slice(0, 5).map((event, idx) => (
                          <div key={event.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              {getTierIcon(event.tier)}
                              <span>{event.category}</span>
                              <span className="text-gray-500">- {event.event.player?.name || 'Team'}</span>
                            </div>
                            <span className="font-mono text-xs">
                              {event.event.minute}:{event.event.second.toString().padStart(2, '0')}
                            </span>
                          </div>
                        ))}
                        {highlightPkg.events.length > 5 && (
                          <div className="text-xs text-gray-500 text-center py-2">
                            +{highlightPkg.events.length - 5} more events...
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}