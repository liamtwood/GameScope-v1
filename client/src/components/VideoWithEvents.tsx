import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useClub } from "@/contexts/club-context";
import { MatchEventTable } from '@/components/MatchEventTable';
import { Timeline } from '@/components/Timeline';
import { VideoAnalysisSettings } from '@/components/VideoAnalysisSettings';
import { HighlightGenerator } from '@/components/HighlightGenerator';
import { AdvancedHighlights } from '@/components/AdvancedHighlights';
import { MatchScoreBanner } from '@/components/match-score-banner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MatchEvent, timestampToSeconds } from '@/lib/types';
import importedMatchEvents from '@/data/match-events-custom.json';

interface OppositionTeam {
  id: string;
  name: string;
  shortName: string | null;
  logoPath: string | null;
  websiteUrl: string | null;
  colors: any;
}

interface VideoWithEventsProps {
  url: string;
  onVideoUrlChange: (url: string) => void;
  fixtureId?: string;
}

export function VideoWithEvents({ url, onVideoUrlChange, fixtureId }: VideoWithEventsProps) {
  const [currentSeekTime, setCurrentSeekTime] = useState<number | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [kickoffOffset, setKickoffOffset] = useState<number>(0);
  const [secondHalfOffset, setSecondHalfOffset] = useState<number>(0);
  const [isShowingHighlights, setIsShowingHighlights] = useState<boolean>(false);
  const [currentHighlightPackage, setCurrentHighlightPackage] = useState<any>(null);
  
  // Load saved offsets from localStorage
  useEffect(() => {
    const savedKickoff = localStorage.getItem('match-kickoff-offset');
    const savedSecondHalf = localStorage.getItem('match-second-half-offset');
    
    if (savedKickoff) {
      const offset = parseFloat(savedKickoff);
      setKickoffOffset(offset);
    }
    
    if (savedSecondHalf) {
      const offset = parseFloat(savedSecondHalf);
      setSecondHalfOffset(offset);
    }
  }, []);
  
  // Save offsets to localStorage when they change
  useEffect(() => {
    localStorage.setItem('match-kickoff-offset', kickoffOffset.toString());
  }, [kickoffOffset]);
  
  useEffect(() => {
    localStorage.setItem('match-second-half-offset', secondHalfOffset.toString());
  }, [secondHalfOffset]);
  
  const handleKickoffOffsetChange = (newOffset: number) => {
    setKickoffOffset(newOffset);
  };
  
  const handleSecondHalfOffsetChange = (newOffset: number) => {
    setSecondHalfOffset(newOffset);
  };
  
  const handleEventClick = (eventTimeInSeconds: number, eventPeriod: number = 1) => {
    // Apply appropriate offset based on period
    let videoTimeInSeconds: number;
    
    if (eventPeriod === 2) {
      // Second half: use second half offset
      videoTimeInSeconds = eventTimeInSeconds + secondHalfOffset;
      console.log('Event time:', eventTimeInSeconds, 'Second half offset:', secondHalfOffset, 'Video seek time:', videoTimeInSeconds);
    } else {
      // First half: use kickoff offset
      videoTimeInSeconds = eventTimeInSeconds + kickoffOffset;
      console.log('Event time:', eventTimeInSeconds, 'Kickoff offset:', kickoffOffset, 'Video seek time:', videoTimeInSeconds);
    }
    
    setCurrentSeekTime(videoTimeInSeconds);
    
    // Ensure we don't seek to negative time
    const seekTime = Math.max(0, videoTimeInSeconds);
    
    // Find the YouTube iframe in the currently active tab and seek to the time
    const iframe = document.querySelector('[data-state="active"] [data-testid="match-video-iframe"]') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        `{"event":"command","func":"seekTo","args":[${seekTime}, true]}`,
        '*'
      );
    }
    
    // Also try to seek using any other player refs if available
    const reactPlayerSeek = () => {
      const playerElement = document.querySelector('[data-testid="simple-youtube-player"]');
      if (playerElement) {
        console.log('Found react player element, seeking...');
      }
    };
    
    setTimeout(reactPlayerSeek, 100);
  };

  // Extract video ID for display
  const getVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const videoId = getVideoId(url);

  // Handle highlight event selection
  const handleHighlightSelect = (highlight: any) => {
    const eventTimeInSeconds = highlight.startTime;
    const eventPeriod = highlight.event.period;
    handleEventClick(eventTimeInSeconds, eventPeriod);
  };

  // Handle highlight package generation
  const handlePackageGenerate = (highlightPackage: any) => {
    console.log('Generated highlight package:', highlightPackage);
    // Could add toast notification or other feedback here
  };
  
  const handleViewHighlightsVideo = (videoUrl: string, highlightPackage: any) => {
    console.log('Switching to highlights video:', videoUrl);
    setIsShowingHighlights(true);
    setCurrentHighlightPackage(highlightPackage);
    onVideoUrlChange(videoUrl);
  };
  
  const handleBackToOriginalVideo = () => {
    console.log('Returning to original match video');
    setIsShowingHighlights(false);
    setCurrentHighlightPackage(null);
    onVideoUrlChange("https://www.youtube.com/watch?v=gvoQ8gvzuC4"); // Original match video
  };

  // Fetch per-fixture match events from DB (falls back to imported JSON if none stored)
  const { data: fixtureMatchEvents } = useQuery<{ events: any[]; lineups: any[] | null; source: string | null }>({
    queryKey: ["/api/fixtures", fixtureId, "match-events"],
    queryFn: async () => {
      if (!fixtureId) throw new Error("No fixtureId");
      const res = await fetch(`/api/fixtures/${fixtureId}/match-events`);
      if (!res.ok) throw new Error("No events stored");
      return res.json();
    },
    enabled: !!fixtureId,
    retry: false,
  });

  const activeEvents: any[] = fixtureMatchEvents?.events ?? importedMatchEvents;

  // Fetch opposition teams to get logos
  const { selectedClub: currentClub } = useClub();
  const { data: oppositionTeams = [] } = useQuery<OppositionTeam[]>({
    queryKey: ["/api/opposition-teams", currentClub?.id],
    queryFn: async () => {
      const url = currentClub?.id ? `/api/opposition-teams?clubId=${currentClub.id}` : '/api/opposition-teams';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch opposition teams');
      return res.json();
    }
  });

  // Find Spain and England teams from the opposition teams
  const spainTeam = oppositionTeams.find(team => team.name === "Spain Women's");
  const englandTeam = oppositionTeams.find(team => team.name === "England Women's");

  // Mock fixture data for the Spain vs England match with real team IDs
  const mockFixture = {
    id: 'spain-england-final',
    createdAt: new Date('2023-08-20'),
    updatedAt: new Date('2023-08-20'),
    date: new Date('2023-08-20'),
    opponent: 'England Women\'s',
    oppositionTeamId: englandTeam?.id || null,
    oppositionClubId: null,
    homeScore: 1,
    awayScore: 0,
    type: 'HOME' as const,
    status: 'COMPLETED',
    teamId: 'spain-team-id',
    venue: 'Stadium Australia',
    competition: 'Women\'s World Cup Final',
    competitionId: null,
    report: null,
    attendance: null,
    videoLinks: null,
    notes: 'Women\'s World Cup Final - Historic victory for Spain',
    hasVideo: true
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <MatchScoreBanner 
        fixture={mockFixture}
        teamLogoPath={spainTeam?.logoPath || undefined}
        opponentLogoPath={englandTeam?.logoPath || undefined}
        polkStateColor="#FF0000" // Spain red
        oppositionColor="#0066CC" // England blue  
        primaryColor="#FF0000"
        clubName="Spain Women's"
      />
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Video Analysis</span>
            <div className="flex items-center gap-4">
              {currentSeekTime !== null && (
                <span className="text-sm font-normal text-blue-600">
                  Last seek: {Math.floor(currentSeekTime / 60)}:{(currentSeekTime % 60).toFixed(0).padStart(2, '0')}
                </span>
              )}
              <VideoAnalysisSettings
                videoUrl={url}
                onVideoUrlChange={onVideoUrlChange}
                kickoffOffset={kickoffOffset}
                onKickoffOffsetChange={handleKickoffOffsetChange}
                secondHalfOffset={secondHalfOffset}
                onSecondHalfOffsetChange={handleSecondHalfOffsetChange}
                onEventClick={handleEventClick}
              />
            </div>
          </CardTitle>
        </CardHeader>
      </Card>
      
      <Tabs defaultValue="video" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="video">Video Player</TabsTrigger>
          <TabsTrigger value="events">Match Events</TabsTrigger>
          <TabsTrigger value="highlights">Generate Highlights</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Highlights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="events">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Event Table - Left Side */}
            <div className="lg:col-span-2">
              <MatchEventTable onEventClick={handleEventClick} events={activeEvents} />
            </div>
            
            {/* Video Player - Right Side */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Match Video</CardTitle>
                  {videoId && (
                    <p className="text-sm text-gray-600">
                      Video ID: {videoId}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <iframe
                      id="youtube-iframe"
                      src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&controls=1&rel=0&fs=1`}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      data-testid="match-video-iframe"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="highlights">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Highlight Generator - Left Side */}
            <div className="lg:col-span-2">
              <HighlightGenerator 
                onHighlightSelect={handleHighlightSelect}
                onPackageGenerate={handlePackageGenerate}
                onViewHighlightsVideo={handleViewHighlightsVideo}
                events={activeEvents}
              />
            </div>
            
            {/* Video Player - Right Side */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {isShowingHighlights ? 'Generated Highlights Video' : 'Match Video - Highlight Mode'}
                  </CardTitle>
                  {videoId && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Video ID: {videoId} {isShowingHighlights ? '| Duration: 4:57' : '| Click any highlight to jump to that moment'}
                      </p>
                      {isShowingHighlights && currentHighlightPackage && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-blue-600">
                              📺 Now showing: {currentHighlightPackage.name}
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {currentHighlightPackage.events.length} events
                            </span>
                          </div>
                          <button 
                            onClick={handleBackToOriginalVideo}
                            className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition-colors"
                            data-testid="back-to-original-video"
                          >
                            ← Back to Match Video
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <iframe
                      id="youtube-iframe"
                      src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&controls=1&rel=0&fs=1`}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      data-testid="match-video-iframe"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="timeline">
          <div className="space-y-6">
            {/* Timeline Container - Top */}
            <Card>
              <CardHeader>
                <CardTitle>Match Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <Timeline 
                  events={activeEvents as MatchEvent[]} 
                  onEventClick={(eventTime: number, period: number) => handleEventClick(eventTime, period)}
                />
              </CardContent>
            </Card>
            
            {/* Video Player - Bottom */}
            <Card>
              <CardHeader>
                <CardTitle>Match Video</CardTitle>
                {videoId && (
                  <p className="text-sm text-gray-600">
                    Video ID: {videoId} | Click any event on the timeline above to jump to that moment
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    id="youtube-iframe"
                    src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&controls=1&rel=0&fs=1`}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    data-testid="match-video-iframe"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="advanced">
          <AdvancedHighlights onEventClick={handleEventClick} events={activeEvents} />
        </TabsContent>
        
        <TabsContent value="video">
          <Card>
            <CardHeader>
              <CardTitle>Match Video</CardTitle>
              <p className="text-sm text-muted-foreground">
                Use the Events, Timeline, or Advanced tabs to click events and jump to that moment in the video.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Inline URL input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Paste a YouTube URL to load a different video…"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && urlInput.trim()) {
                      onVideoUrlChange(urlInput.trim());
                      setUrlInput('');
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (urlInput.trim()) {
                      onVideoUrlChange(urlInput.trim());
                      setUrlInput('');
                    }
                  }}
                  disabled={!urlInput.trim()}
                >
                  Load
                </Button>
                {videoId && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border rounded-md hover:bg-accent transition-colors whitespace-nowrap"
                  >
                    ↗ Watch on YouTube
                  </a>
                )}
              </div>

              {/* Video player */}
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                {videoId ? (
                  <iframe
                    id="youtube-iframe"
                    src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&controls=1&rel=0&fs=1`}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    data-testid="match-video-iframe"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white text-sm">
                    Paste a YouTube URL above to load the video
                  </div>
                )}
              </div>

              {videoId && (
                <p className="text-xs text-muted-foreground">
                  If the video shows "blocked" — paste any embeddable YouTube URL above and use the Events or Timeline tab to control it.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
    </div>
  );
}