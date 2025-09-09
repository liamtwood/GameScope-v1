import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Fixture } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2,
  Settings,
  Filter,
  MapPin,
  Clock,
  Users,
  Target,
  Activity,
  BarChart3,
  Map,
  Zap
} from "lucide-react";

interface VideoClip {
  id: string;
  eventType: string;
  timestamp: string;
  duration: number;
  url: string;
  thumbnail?: string;
  players: {
    from?: string;
    to?: string;
    involved: string[];
  };
  eventData: {
    success: boolean;
    distance?: number;
    velocity?: number;
    foot?: 'left' | 'right' | 'head';
    startPosition: [number, number];
    endPosition: [number, number];
    outcome?: string;
  };
  team: 'home' | 'away';
}

interface VideoAnalysisDashboardProps {
  fixtureId: string;
}

// Helper function to convert fixture videos to clips format
const convertVideoDataToClips = (videoLinks: any[]): VideoClip[] => {
  if (!videoLinks || !Array.isArray(videoLinks)) return [];
  
  return videoLinks.map((video, index) => ({
    id: video.id || `clip-${index}`,
    eventType: video.duration || 'full_game',
    timestamp: '0:00', // Will be updated when AI provides event timestamps
    duration: video.duration === 'full_game' ? 5400 : video.duration === '1st_half' ? 2700 : video.duration === '2nd_half' ? 2700 : 1200,
    url: video.url || '',
    thumbnail: video.thumbnail,
    players: {
      involved: [] // Will be populated by AI analysis
    },
    eventData: {
      success: true,
      startPosition: [50, 50] as [number, number],
      endPosition: [50, 50] as [number, number],
      outcome: 'completed'
    },
    team: 'home' as 'home' | 'away'
  })).filter(clip => clip.url); // Only include clips with valid URLs
};

const EVENT_TYPES = [
  { value: 'all', label: 'All Events' },
  { value: 'pass', label: 'Passes', icon: '🎯' },
  { value: 'shot', label: 'Shots', icon: '⚽' },
  { value: 'header', label: 'Headers', icon: '🤾' },
  { value: 'tackle', label: 'Tackles', icon: '💥' },
  { value: 'cross', label: 'Crosses', icon: '↗️' },
  { value: 'corner', label: 'Corners', icon: '📐' },
  { value: 'freekick', label: 'Free Kicks', icon: '🦵' }
];

const FIELD_ZONES = [
  { value: 'all', label: 'Whole Pitch' },
  { value: 'defensive_third', label: 'Defensive Third' },
  { value: 'middle_third', label: 'Middle Third' },
  { value: 'final_third', label: 'Final Third' },
  { value: 'penalty_area', label: 'Penalty Area' },
  { value: 'six_yard_box', label: 'Six Yard Box' }
];

export function VideoAnalysisDashboard({ fixtureId }: VideoAnalysisDashboardProps) {
  // Fetch fixture data to get video links
  const { data: fixture } = useQuery<Fixture>({
    queryKey: ["/api/fixture", fixtureId],
    enabled: !!fixtureId,
  });
  
  // Convert fixture video links to clips format
  const clips = convertVideoDataToClips(Array.isArray(fixture?.videoLinks) ? fixture.videoLinks : []);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedClip, setSelectedClip] = useState<VideoClip | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  
  // Filters
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [timeRange, setTimeRange] = useState([0, 90]);
  const [searchPlayer, setSearchPlayer] = useState('');

  // Filter clips based on current filters
  const filteredClips = clips.filter(clip => {
    if (selectedEventType !== 'all' && clip.eventType !== selectedEventType) return false;
    if (selectedTeam !== 'all' && clip.team !== selectedTeam) return false;
    if (searchPlayer && clip.players.involved.length > 0 && !clip.players.involved.some(p => 
      p.toLowerCase().includes(searchPlayer.toLowerCase())
    )) return false;
    
    // For now, show all clips since timestamps will come from AI analysis
    return true;
  });

  // Video controls
  const togglePlayPause = () => {
    if (!videoRef.current || !selectedClip) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const skipSeconds = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + seconds);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleClipSelect = (clip: VideoClip) => {
    setSelectedClip(clip);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Interactive pitch component
  const InteractivePitch = () => (
    <div className="relative w-full h-32 bg-green-500 rounded-lg overflow-hidden border">
      {/* Pitch markings */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 60">
        {/* Pitch outline */}
        <rect x="2" y="2" width="96" height="56" fill="none" stroke="white" strokeWidth="0.5"/>
        
        {/* Center line and circle */}
        <line x1="50" y1="2" x2="50" y2="58" stroke="white" strokeWidth="0.5"/>
        <circle cx="50" cy="30" r="8" fill="none" stroke="white" strokeWidth="0.5"/>
        
        {/* Penalty areas */}
        <rect x="2" y="15" width="15" height="30" fill="none" stroke="white" strokeWidth="0.5"/>
        <rect x="83" y="15" width="15" height="30" fill="none" stroke="white" strokeWidth="0.5"/>
        
        {/* Goal areas */}
        <rect x="2" y="22" width="5" height="16" fill="none" stroke="white" strokeWidth="0.5"/>
        <rect x="93" y="22" width="5" height="16" fill="none" stroke="white" strokeWidth="0.5"/>
        
        {/* Zone overlays */}
        {selectedZone === 'defensive_third' && (
          <rect x="2" y="2" width="32" height="56" fill="rgba(255,255,255,0.2)" stroke="yellow" strokeWidth="1"/>
        )}
        {selectedZone === 'middle_third' && (
          <rect x="34" y="2" width="32" height="56" fill="rgba(255,255,255,0.2)" stroke="yellow" strokeWidth="1"/>
        )}
        {selectedZone === 'final_third' && (
          <rect x="66" y="2" width="32" height="56" fill="rgba(255,255,255,0.2)" stroke="yellow" strokeWidth="1"/>
        )}
      </svg>
      
      {/* Clickable zone buttons */}
      <div className="absolute inset-0 grid grid-cols-3">
        <button 
          className="hover:bg-white/10 transition-colors flex items-center justify-center text-xs text-white font-medium"
          onClick={() => setSelectedZone(selectedZone === 'defensive_third' ? 'all' : 'defensive_third')}
        >
          DEF
        </button>
        <button 
          className="hover:bg-white/10 transition-colors flex items-center justify-center text-xs text-white font-medium"
          onClick={() => setSelectedZone(selectedZone === 'middle_third' ? 'all' : 'middle_third')}
        >
          MID
        </button>
        <button 
          className="hover:bg-white/10 transition-colors flex items-center justify-center text-xs text-white font-medium"
          onClick={() => setSelectedZone(selectedZone === 'final_third' ? 'all' : 'final_third')}
        >
          ATT
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6 min-h-[600px]">
        {/* Left Panel - Video Player */}
        <div className="col-span-7">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Match Analysis
                {selectedClip && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedClip.eventType.toUpperCase()} at {selectedClip.timestamp}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Video Player */}
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                {selectedClip ? (
                  <>
                    <video
                      ref={videoRef}
                      src={selectedClip.url}
                      className="w-full h-full"
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onEnded={() => setIsPlaying(false)}
                    />
                    
                    {/* Video Overlay Info */}
                    <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-md text-sm">
                      <div className="font-medium">{selectedClip.eventType.toUpperCase()}</div>
                      <div>{selectedClip.timestamp} • {selectedClip.players.involved.join(', ')}</div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <div className="text-center">
                      <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a clip to watch</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Video Controls */}
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => skipSeconds(-5)}
                    disabled={!selectedClip}
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={togglePlayPause}
                    disabled={!selectedClip}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => skipSeconds(5)}
                    disabled={!selectedClip}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-2 ml-auto">
                    <Volume2 className="h-4 w-4" />
                    <Slider
                      value={[volume * 100]}
                      onValueChange={([value]) => {
                        const newVolume = value / 100;
                        setVolume(newVolume);
                        if (videoRef.current) {
                          videoRef.current.volume = newVolume;
                        }
                      }}
                      max={100}
                      step={1}
                      className="w-20"
                    />
                  </div>
                </div>
                
                {/* Progress Bar */}
                {selectedClip && (
                  <div className="space-y-2">
                    <Slider
                      value={[currentTime]}
                      onValueChange={([value]) => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = value;
                          setCurrentTime(value);
                        }
                      }}
                      max={duration}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Filters and Data */}
        <div className="col-span-5 space-y-4">
          {/* Filter Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.icon && <span className="mr-2">{type.icon}</span>}
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Team</Label>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teams</SelectItem>
                      <SelectItem value="home">Polk State</SelectItem>
                      <SelectItem value="away">Opposition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Player Search</Label>
                <Input
                  placeholder="Search for a player..."
                  value={searchPlayer}
                  onChange={(e) => setSearchPlayer(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Time Period (minutes)</Label>
                <Slider
                  value={timeRange}
                  onValueChange={setTimeRange}
                  max={90}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{timeRange[0]}'</span>
                  <span>{timeRange[1]}'</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Field Zone</Label>
                <InteractivePitch />
              </div>
            </CardContent>
          </Card>

          {/* Event Details */}
          {selectedClip && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <div className="font-medium capitalize">{selectedClip.eventType}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time:</span>
                    <div className="font-medium">{selectedClip.timestamp}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Success:</span>
                    <div className="font-medium">
                      {selectedClip.eventData.success ? 
                        <Badge variant="default" className="text-xs">✓ Success</Badge> : 
                        <Badge variant="destructive" className="text-xs">✗ Failed</Badge>
                      }
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Outcome:</span>
                    <div className="font-medium capitalize">{selectedClip.eventData.outcome}</div>
                  </div>
                  {selectedClip.eventData.distance && (
                    <div>
                      <span className="text-muted-foreground">Distance:</span>
                      <div className="font-medium">{selectedClip.eventData.distance}m</div>
                    </div>
                  )}
                  {selectedClip.eventData.velocity && (
                    <div>
                      <span className="text-muted-foreground">Velocity:</span>
                      <div className="font-medium">{selectedClip.eventData.velocity} km/h</div>
                    </div>
                  )}
                  {selectedClip.eventData.foot && (
                    <div>
                      <span className="text-muted-foreground">Foot:</span>
                      <div className="font-medium capitalize">{selectedClip.eventData.foot}</div>
                    </div>
                  )}
                </div>
                
                <div className="pt-2">
                  <span className="text-muted-foreground text-sm">Players:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedClip.players.involved.map((player, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {player}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom Section - Visualization Tabs and Results */}
      <Tabs defaultValue="clips" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="clips" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Clips ({filteredClips.length})
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Heat Map
          </TabsTrigger>
          <TabsTrigger value="positions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Positions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clips" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredClips.map((clip) => (
              <Card 
                key={clip.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedClip?.id === clip.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleClipSelect(clip)}
              >
                <CardContent className="p-4">
                  <div className="aspect-video bg-gray-100 rounded-md mb-3 flex items-center justify-center">
                    {clip.thumbnail ? (
                      <img src={clip.thumbnail} alt="Clip thumbnail" className="w-full h-full object-cover rounded-md" />
                    ) : (
                      <Play className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {clip.eventType.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{clip.timestamp}</span>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">
                        {clip.players.from && clip.players.to 
                          ? `${clip.players.from} → ${clip.players.to}`
                          : clip.players.involved.join(', ')
                        }
                      </div>
                      <div className="text-muted-foreground text-xs mt-1">
                        {clip.eventData.success ? '✓' : '✗'} {clip.eventData.outcome}
                        {clip.eventData.distance && ` • ${clip.eventData.distance}m`}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Event Timeline</h3>
                <p className="text-muted-foreground">Interactive timeline showing all match events with video seek points</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heatmap" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Map className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Heat Map</h3>
                <p className="text-muted-foreground">Player movement intensity overlaid on pitch</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Position Maps</h3>
                <p className="text-muted-foreground">Average positions and passing networks</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}