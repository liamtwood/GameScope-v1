import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Fixture } from "@shared/schema";
import { MatchEvent as TimelineMatchEvent } from "@/lib/types";
import { Timeline } from "@/components/Timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Zap,
  AlertCircle,
  ExternalLink,
  Camera
} from "lucide-react";

interface VideoClip {
  id: string;
  eventType: string;
  timestamp: string;
  duration: number;
  url: string;
  originalUrl?: string; // Keep original URL for reference
  filename?: string;
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

interface MatchEvent {
  id: string;
  timestamp: string;
  minute: number;
  second: number;
  eventType: string;
  category: string;
  player?: string;
  team: 'home' | 'away';
  description: string;
  outcome: 'success' | 'failed' | 'neutral';
  position: [number, number];
  details?: {
    distance?: number;
    velocity?: number;
    direction?: string;
    target?: string;
  };
}

// Convert dashboard events to Timeline format
const convertToTimelineEvents = (dashboardEvents: MatchEvent[]): TimelineMatchEvent[] => {
  return dashboardEvents.map(event => ({
    id: event.id,
    index: parseInt(event.id),
    period: event.minute <= 45 ? 1 : 2,
    timestamp: event.timestamp,
    minute: event.minute,
    second: event.second,
    type: {
      id: 1,
      name: event.eventType === 'goal' ? 'Shot' : event.eventType === 'pass' ? 'Pass' : event.eventType === 'substitution' ? 'Substitution' : 'Pass'
    },
    team: {
      id: event.team === 'home' ? 1 : 2,
      name: event.team === 'home' ? 'Home Team' : 'Away Team'
    },
    player: event.player ? {
      id: 1,
      name: event.player
    } : undefined,
    location: event.position,
    shot: event.eventType === 'goal' || event.eventType === 'shot' ? {
      statsbomb_xg: 0.5,
      end_location: event.position,
      outcome: {
        id: event.outcome === 'success' ? 97 : 100,
        name: event.outcome === 'success' ? 'Goal' : 'Off T'
      }
    } : undefined,
    pass: event.eventType === 'pass' ? {
      length: event.details?.distance || 10,
      type: {
        id: 61,
        name: 'Regular Play'
      },
      outcome: {
        id: event.outcome === 'success' ? 1 : 9,
        name: event.outcome === 'success' ? 'Complete' : 'Incomplete'
      }
    } : undefined
  }));
};

interface VideoAnalysisDashboardProps {
  fixtureId: string;
  videoId?: string;
}

// Pitch coordinate system - based on provided dimensions
const PITCH_POSITIONS = {
  // Center positions
  center: [50, 50],
  
  // Goal areas
  homeGoal: [6, 50],
  awayGoal: [94, 50],
  
  // Penalty areas
  homePenaltyArea: { 
    topLeft: [0, 37], topRight: [16, 37],
    bottomLeft: [0, 63], bottomRight: [16, 63],
    penaltySpot: [10, 50]
  },
  awayPenaltyArea: {
    topLeft: [84, 37], topRight: [100, 37],
    bottomLeft: [84, 63], bottomRight: [100, 63],
    penaltySpot: [90, 50]
  },
  
  // Six yard boxes
  homeSixYard: {
    topLeft: [0, 44], topRight: [6, 44],
    bottomLeft: [0, 56], bottomRight: [6, 56]
  },
  awaySixYard: {
    topLeft: [94, 44], topRight: [100, 44],
    bottomLeft: [94, 56], bottomRight: [100, 56]
  },
  
  // Corner positions
  corners: {
    homeTopLeft: [0, 0],
    homeBottomLeft: [0, 100],
    awayTopRight: [100, 0],
    awayBottomRight: [100, 100]
  },
  
  // Common event positions
  commonPositions: [
    [16, 19], [84, 19], // Top penalty area corners
    [16, 81], [84, 81], // Bottom penalty area corners
    [6, 37], [94, 37],   // Top six yard corners
    [6, 63], [94, 63],   // Bottom six yard corners
    [10, 50], [90, 50],  // Penalty spots
    [50, 0], [50, 100],  // Midfield sidelines
    [25, 25], [75, 25],  // Wing positions
    [25, 75], [75, 75]   // Wing positions
  ]
};

// Helper function to get realistic position based on event type
const getRealisticPosition = (eventType: string, team: 'home' | 'away'): [number, number] => {
  const isHome = team === 'home';
  
  switch (eventType) {
    case 'goal':
    case 'shot':
      return isHome ? [90, 50 + (Math.random() - 0.5) * 26] : [10, 50 + (Math.random() - 0.5) * 26];
    
    case 'corner':
      const corners = PITCH_POSITIONS.corners;
      return isHome ? 
        (Math.random() > 0.5 ? [94, 37] : [94, 63]) :
        (Math.random() > 0.5 ? [6, 37] : [6, 63]);
    
    case 'penalty':
      return isHome ? [90, 50] : [10, 50];
    
    case 'freekick':
      // Free kicks can happen anywhere but more likely in attacking third
      const x = isHome ? 60 + Math.random() * 30 : 10 + Math.random() * 30;
      const y = 20 + Math.random() * 60;
      return [x, y];
    
    case 'pass':
    case 'long_pass':
    case 'short_pass':
      // Passes distributed across the field, favoring team's attacking direction
      const passX = isHome ? 30 + Math.random() * 50 : 20 + Math.random() * 50;
      const passY = 10 + Math.random() * 80;
      return [passX, passY];
    
    case 'tackle':
    case 'interception':
      // Defensive actions more likely in defensive areas
      const defX = isHome ? 10 + Math.random() * 40 : 50 + Math.random() * 40;
      const defY = 15 + Math.random() * 70;
      return [defX, defY];
    
    default:
      // Use one of the common positions or random realistic position
      if (Math.random() > 0.7) {
        const commonPos = PITCH_POSITIONS.commonPositions[Math.floor(Math.random() * PITCH_POSITIONS.commonPositions.length)];
        return [commonPos[0], commonPos[1]];
      }
      return [10 + Math.random() * 80, 10 + Math.random() * 80];
  }
};

// Helper function to get the correct video URL for playback
const getVideoPlaybackUrl = (video: any) => {
  if (!video.url) return '';
  
  // Handle Google Cloud Storage URLs - convert to server proxy
  if (video.url.includes('storage.googleapis.com')) {
    try {
      const urlObj = new URL(video.url);
      const pathSegments = urlObj.pathname.split('/').filter(p => p);
      
      // For Replit object storage: /bucket/.private/uploads/objectId -> /objects/uploads/objectId
      if (pathSegments.length >= 3 && pathSegments.includes('uploads')) {
        const uploadsIndex = pathSegments.indexOf('uploads');
        if (uploadsIndex >= 0) {
          const objectPath = pathSegments.slice(uploadsIndex).join('/');
          return `/objects/${objectPath}`;
        }
      }
    } catch (e) {
      console.error('Error parsing storage URL:', e);
    }
  }
  
  // Handle Google Drive URLs - these can't be directly played
  if (video.url.includes('drive.google.com')) {
    return 'google-drive'; // Special marker for unsupported URLs
  }
  
  // Handle Veo URLs - these are platform links, not direct video files
  if (video.url.includes('app.veo.co')) {
    return 'veo-platform'; // Special marker for platform URLs
  }
  
  // Return original URL for direct video files
  return video.url;
};

// Helper function to convert fixture videos to clips format
const convertVideoDataToClips = (videoLinks: any[]): VideoClip[] => {
  if (!videoLinks || !Array.isArray(videoLinks)) return [];
  
  return videoLinks.map((video, index) => {
    const playbackUrl = getVideoPlaybackUrl(video);
    
    return {
      id: video.id || `clip-${index}`,
      eventType: video.duration || 'full_game',
      timestamp: '0:00',
      duration: video.duration === 'full_game' ? 5400 : video.duration === '1st_half' ? 2700 : video.duration === '2nd_half' ? 2700 : 1200,
      url: playbackUrl,
      originalUrl: video.url, // Keep original for reference
      filename: video.filename,
      thumbnail: video.thumbnail,
      players: {
        involved: []
      },
      eventData: {
        success: true,
        startPosition: [50, 50] as [number, number],
        endPosition: [50, 50] as [number, number],
        outcome: 'completed'
      },
      team: 'home' as 'home' | 'away'
    };
  }).filter(clip => clip.url && clip.url !== ''); // Only include clips with valid URLs
};

const EVENT_CATEGORIES = [
  { 
    id: 'attacking', 
    label: 'Attacking', 
    color: 'bg-red-500', 
    events: ['shot', 'goal', 'assist', 'cross', 'through_pass', 'key_pass']
  },
  { 
    id: 'passing', 
    label: 'Passing & Build-up', 
    color: 'bg-blue-500', 
    events: ['pass', 'long_pass', 'short_pass', 'back_pass', 'switch_play']
  },
  { 
    id: 'defending', 
    label: 'Defending', 
    color: 'bg-green-500', 
    events: ['tackle', 'interception', 'clearance', 'block', 'foul']
  },
  { 
    id: 'setpieces', 
    label: 'Set Pieces', 
    color: 'bg-purple-500', 
    events: ['corner', 'freekick', 'throw_in', 'penalty', 'kickoff']
  },
  { 
    id: 'transitions', 
    label: 'Transitions', 
    color: 'bg-orange-500', 
    events: ['counter_attack', 'turnover', 'press', 'recovery']
  },
  { 
    id: 'aerial', 
    label: 'Aerial Duels', 
    color: 'bg-yellow-500', 
    events: ['header', 'aerial_duel', 'high_ball', 'jump']
  }
];

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

export function VideoAnalysisDashboard({ fixtureId, videoId }: VideoAnalysisDashboardProps) {
  // Fetch fixture data to get video links
  const { data: fixture } = useQuery<Fixture>({
    queryKey: ["/api/fixture", fixtureId],
    enabled: !!fixtureId,
  });
  
  
  // Convert fixture video links to clips format
  const clips = convertVideoDataToClips(Array.isArray(fixture?.videoLinks) ? fixture.videoLinks : []);
  
  // Generate comprehensive match events log (this would come from AI analysis in production)
  const generateMatchEvents = (): MatchEvent[] => {
    const events: MatchEvent[] = [];
    const players = ['Sarah Johnson', 'Emma Davis', 'Maria Rodriguez', 'Ashley Smith', 'Taylor Brown'];
    const opposingPlayers = ['A. Williams', 'B. Jones', 'C. Miller', 'D. Wilson'];
    
    // Generate events throughout the match
    for (let minute = 1; minute <= 90; minute += Math.floor(Math.random() * 3) + 1) {
      const eventTypes = EVENT_CATEGORIES.flatMap(cat => cat.events);
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const category = EVENT_CATEGORIES.find(cat => cat.events.includes(eventType));
      const player = Math.random() > 0.6 ? players[Math.floor(Math.random() * players.length)] 
                    : opposingPlayers[Math.floor(Math.random() * opposingPlayers.length)];
      const team = players.includes(player) ? 'home' : 'away';
      const second = Math.floor(Math.random() * 60);
      
      events.push({
        id: `event-${minute}-${second}`,
        timestamp: `${minute}:${second.toString().padStart(2, '0')}`,
        minute,
        second,
        eventType,
        category: category?.id || 'other',
        player,
        team,
        description: getEventDescription(eventType, player, team === 'home'),
        outcome: Math.random() > 0.3 ? 'success' : Math.random() > 0.5 ? 'failed' : 'neutral',
        position: getRealisticPosition(eventType, team),
        details: {
          distance: eventType.includes('pass') ? Math.floor(Math.random() * 40) + 5 : undefined,
          velocity: eventType === 'shot' ? Math.floor(Math.random() * 30) + 40 : undefined
        }
      });
    }
    
    return events.sort((a, b) => a.minute - b.minute || a.second - b.second);
  };
  
  const getEventDescription = (eventType: string, player: string, isHome: boolean): string => {
    const teamPrefix = isHome ? '' : '(OPP) ';
    switch (eventType) {
      case 'pass': return `${teamPrefix}${player} completes pass`;
      case 'shot': return `${teamPrefix}${player} takes shot`;
      case 'goal': return `${teamPrefix}${player} scores!`;
      case 'tackle': return `${teamPrefix}${player} makes tackle`;
      case 'corner': return `${teamPrefix}Corner kick awarded`;
      case 'header': return `${teamPrefix}${player} wins header`;
      default: return `${teamPrefix}${player} - ${eventType}`;
    }
  };
  
  const matchEvents = generateMatchEvents();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedClip, setSelectedClip] = useState<VideoClip | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  
  // Filters
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
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
  
  // Filter events based on current filters
  const filteredEvents = matchEvents.filter(event => {
    if (selectedCategory !== 'all' && event.category !== selectedCategory) return false;
    if (selectedEventType !== 'all' && event.eventType !== selectedEventType) return false;
    if (selectedTeam !== 'all' && event.team !== selectedTeam) return false;
    if (event.minute < timeRange[0] || event.minute > timeRange[1]) return false;
    if (searchPlayer && event.player && !event.player.toLowerCase().includes(searchPlayer.toLowerCase())) return false;
    
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

  // Interactive pitch component with accurate dimensions
  const InteractivePitch = () => (
    <div className="relative w-full h-48 bg-green-500 rounded-lg overflow-hidden border">
      {/* Pitch markings with proper coordinates */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        {/* Pitch outline */}
        <rect x="0" y="0" width="100" height="100" fill="none" stroke="white" strokeWidth="0.5"/>
        
        {/* Center line and circle */}
        <line x1="50" y1="0" x2="50" y2="100" stroke="white" strokeWidth="0.5"/>
        <circle cx="50" cy="50" r="9" fill="none" stroke="white" strokeWidth="0.5"/>
        <circle cx="50" cy="50" r="0.5" fill="white"/>
        
        {/* Penalty areas - using exact coordinates */}
        <rect x="0" y="37" width="16" height="26" fill="none" stroke="white" strokeWidth="0.5"/>
        <rect x="84" y="37" width="16" height="26" fill="none" stroke="white" strokeWidth="0.5"/>
        
        {/* Six yard boxes */}
        <rect x="0" y="44" width="6" height="12" fill="none" stroke="white" strokeWidth="0.5"/>
        <rect x="94" y="44" width="6" height="12" fill="none" stroke="white" strokeWidth="0.5"/>
        
        {/* Penalty spots */}
        <circle cx="10" cy="50" r="0.5" fill="white"/>
        <circle cx="90" cy="50" r="0.5" fill="white"/>
        
        {/* Penalty arcs */}
        <path d="M 10 41 A 9 9 0 0 1 10 59" fill="none" stroke="white" strokeWidth="0.5"/>
        <path d="M 90 41 A 9 9 0 0 0 90 59" fill="none" stroke="white" strokeWidth="0.5"/>
        
        {/* Corner arcs */}
        <path d="M 0 1 A 1 1 0 0 1 1 0" fill="none" stroke="white" strokeWidth="0.5"/>
        <path d="M 99 0 A 1 1 0 0 1 100 1" fill="none" stroke="white" strokeWidth="0.5"/>
        <path d="M 100 99 A 1 1 0 0 1 99 100" fill="none" stroke="white" strokeWidth="0.5"/>
        <path d="M 1 100 A 1 1 0 0 1 0 99" fill="none" stroke="white" strokeWidth="0.5"/>
        
        {/* Goals */}
        <rect x="-1" y="47" width="1" height="6" fill="none" stroke="white" strokeWidth="0.5"/>
        <rect x="100" y="47" width="1" height="6" fill="none" stroke="white" strokeWidth="0.5"/>
        
        {/* Zone overlays */}
        {selectedZone === 'defensive_third' && (
          <rect x="0" y="0" width="33" height="100" fill="rgba(255,255,255,0.2)" stroke="yellow" strokeWidth="1"/>
        )}
        {selectedZone === 'middle_third' && (
          <rect x="33" y="0" width="34" height="100" fill="rgba(255,255,255,0.2)" stroke="yellow" strokeWidth="1"/>
        )}
        {selectedZone === 'final_third' && (
          <rect x="67" y="0" width="33" height="100" fill="rgba(255,255,255,0.2)" stroke="yellow" strokeWidth="1"/>
        )}
        {selectedZone === 'penalty_area' && (
          <>
            <rect x="0" y="37" width="16" height="26" fill="rgba(255,255,255,0.2)" stroke="yellow" strokeWidth="1"/>
            <rect x="84" y="37" width="16" height="26" fill="rgba(255,255,255,0.2)" stroke="yellow" strokeWidth="1"/>
          </>
        )}
        {selectedZone === 'six_yard_box' && (
          <>
            <rect x="0" y="44" width="6" height="12" fill="rgba(255,255,255,0.2)" stroke="yellow" strokeWidth="1"/>
            <rect x="94" y="44" width="6" height="12" fill="rgba(255,255,255,0.2)" stroke="yellow" strokeWidth="1"/>
          </>
        )}
        
        {/* Event position markers */}
        {filteredEvents.slice(0, 20).map((event) => {
          const category = EVENT_CATEGORIES.find(cat => cat.id === event.category);
          return (
            <circle
              key={event.id}
              cx={event.position[0]}
              cy={event.position[1]}
              r="1"
              className={`${category?.color?.replace('bg-', 'fill-')} opacity-70 hover:opacity-100 cursor-pointer`}
              onClick={() => console.log(`Jump to ${event.timestamp}`)}
            >
              <title>{event.description} at {event.timestamp}</title>
            </circle>
          );
        })}
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
        {/* Left Panel - Categories & Events Log */}
        <div className="col-span-4">
          <div className="space-y-4">
            {/* Category Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Event Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                  className="w-full justify-start text-xs"
                >
                  All Categories
                </Button>
                {EVENT_CATEGORIES.map((category) => {
                  const categoryEvents = filteredEvents.filter(e => e.category === category.id).length;
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(selectedCategory === category.id ? 'all' : category.id)}
                      className="w-full justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${category.color}`} />
                        {category.label}
                      </div>
                      <Badge variant="secondary" className="text-xs">{categoryEvents}</Badge>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
            
            {/* Events Log */}
            <Card className="flex-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Events Timeline</CardTitle>
                  <Badge variant="outline">{filteredEvents.length} events</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {filteredEvents.map((event) => {
                      const category = EVENT_CATEGORIES.find(cat => cat.id === event.category);
                      return (
                        <div
                          key={event.id}
                          className="flex items-start gap-3 p-2 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => {
                            // Jump to event time in video
                            console.log(`Jump to ${event.timestamp}`);
                          }}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${category?.color || 'bg-gray-400'}`} />
                            <span className="text-xs text-muted-foreground font-mono">
                              {event.timestamp}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">
                                {event.description}
                              </span>
                              <Badge 
                                variant={event.outcome === 'success' ? 'default' : 
                                        event.outcome === 'failed' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {event.outcome}
                              </Badge>
                            </div>
                            {event.details && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {event.details.distance && `${event.details.distance}m`}
                                {event.details.velocity && ` • ${event.details.velocity}km/h`}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Center Panel - Video Player */}
        <div className="col-span-5">
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
                    {selectedClip.url === 'google-drive' ? (
                      <div className="w-full h-full flex items-center justify-center text-white p-8 text-center">
                        <div className="space-y-4">
                          <AlertCircle className="h-12 w-12 mx-auto text-yellow-400" />
                          <h3 className="text-lg font-semibold">Google Drive Video</h3>
                          <p className="text-sm text-gray-300">This video is hosted on Google Drive and cannot be played directly.</p>
                          <Button 
                            onClick={() => window.open(selectedClip.originalUrl, '_blank')}
                            variant="outline"
                            className="text-white border-white hover:bg-white hover:text-black"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open in Google Drive
                          </Button>
                        </div>
                      </div>
                    ) : selectedClip.url === 'veo-platform' ? (
                      <div className="w-full h-full flex items-center justify-center text-white p-8 text-center">
                        <div className="space-y-4">
                          <Camera className="h-12 w-12 mx-auto text-blue-400" />
                          <h3 className="text-lg font-semibold">Veo Camera Platform</h3>
                          <p className="text-sm text-gray-300">This video is hosted on the Veo platform with advanced analytics.</p>
                          <Button 
                            onClick={() => window.open(selectedClip.originalUrl, '_blank')}
                            variant="outline"
                            className="text-white border-white hover:bg-white hover:text-black"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open in Veo Platform
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <video
                        ref={videoRef}
                        src={selectedClip.url}
                        className="w-full h-full"
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={() => setIsPlaying(false)}
                        onError={(e) => {
                          console.error('Video error:', e);
                          console.log('Failed URL:', selectedClip.url);
                          console.log('Original URL:', selectedClip.originalUrl);
                        }}
                      />
                    )}
                    
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
        <div className="col-span-3 space-y-4">
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
          <div className="h-[600px]">
            <Timeline 
              events={convertToTimelineEvents(filteredEvents)} 
              onEventClick={(eventTime, period) => {
                // Jump to event time in video
                console.log(`Jump to period ${period} at ${eventTime} seconds`);
                if (videoRef.current) {
                  videoRef.current.currentTime = eventTime;
                }
              }}
            />
          </div>
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