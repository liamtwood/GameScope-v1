import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MatchEventTable } from '@/components/MatchEventTable';
import { VideoAnalysisSettings } from '@/components/VideoAnalysisSettings';
import { HighlightGenerator } from '@/components/HighlightGenerator';
import { AdvancedHighlights } from '@/components/AdvancedHighlights';
import { MatchScoreBanner } from '@/components/match-score-banner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
}

export function VideoWithEvents({ url, onVideoUrlChange }: VideoWithEventsProps) {
  const [currentSeekTime, setCurrentSeekTime] = useState<number | null>(null);
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
    
    // Find the YouTube iframe and seek to the time
    const iframe = document.querySelector('#youtube-iframe') as HTMLIFrameElement;
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

  // Fetch opposition teams to get logos
  const { data: oppositionTeams = [] } = useQuery<OppositionTeam[]>({
    queryKey: ["/api/opposition-teams"],
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
    videoLinks: null
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
      
      <Tabs defaultValue="events" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="events">Match Events</TabsTrigger>
          <TabsTrigger value="highlights">Generate Highlights</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Highlights</TabsTrigger>
          <TabsTrigger value="video">Video Player</TabsTrigger>
        </TabsList>
        
        <TabsContent value="events">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Event Table - Left Side */}
            <div className="lg:col-span-2">
              <MatchEventTable onEventClick={handleEventClick} />
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
        
        <TabsContent value="advanced">
          <AdvancedHighlights onEventClick={handleEventClick} />
        </TabsContent>
        
        <TabsContent value="video">
          <Card>
            <CardHeader>
              <CardTitle>Match Video - Full Screen</CardTitle>
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
        </TabsContent>
      </Tabs>
      
    </div>
  );
}