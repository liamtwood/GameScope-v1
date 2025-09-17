import { useRef, useState, useEffect } from 'react';
import { BasicYouTubePlayer } from '@/components/BasicYouTubePlayer';
import { MatchEventTable } from '@/components/MatchEventTable';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Pause, SkipForward, SkipBack, Clock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VideoWithEventsProps {
  url: string;
}

export function VideoWithEvents({ url }: VideoWithEventsProps) {
  const [currentSeekTime, setCurrentSeekTime] = useState<number | null>(null);
  const [kickoffOffset, setKickoffOffset] = useState<number>(0);
  const [kickoffInput, setKickoffInput] = useState<string>("0:00");
  
  // Load saved kickoff offset from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('match-kickoff-offset');
    if (saved) {
      const offset = parseFloat(saved);
      setKickoffOffset(offset);
      setKickoffInput(formatTimeForInput(offset));
    }
  }, []);
  
  // Save kickoff offset to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('match-kickoff-offset', kickoffOffset.toString());
  }, [kickoffOffset]);
  
  const formatTimeForInput = (seconds: number): string => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.floor(Math.abs(seconds) % 60);
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const parseTimeInput = (input: string): number => {
    if (!input.trim()) return 0;
    
    const isNegative = input.startsWith('-');
    const cleanInput = input.replace('-', '').trim();
    
    if (cleanInput.includes(':')) {
      const [mins, secs] = cleanInput.split(':').map(Number);
      const totalSeconds = (mins * 60) + (secs || 0);
      return isNegative ? -totalSeconds : totalSeconds;
    }
    
    const numValue = parseFloat(cleanInput.replace(/[^\d.]/g, ''));
    const result = isNaN(numValue) ? 0 : numValue;
    return isNegative ? -result : result;
  };
  
  const handleKickoffOffsetChange = () => {
    const newOffset = parseTimeInput(kickoffInput);
    setKickoffOffset(newOffset);
  };
  
  const handleEventClick = (eventTimeInSeconds: number) => {
    // Apply kickoff offset to get actual video time
    const videoTimeInSeconds = eventTimeInSeconds + kickoffOffset;
    
    console.log('Event time:', eventTimeInSeconds, 'Kickoff offset:', kickoffOffset, 'Video seek time:', videoTimeInSeconds);
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

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Match Analysis: Spain Women's vs England Women's</span>
            {currentSeekTime !== null && (
              <span className="text-sm font-normal text-blue-600">
                Last seek: {Math.floor(currentSeekTime / 60)}:{(currentSeekTime % 60).toFixed(0).padStart(2, '0')}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
            <Clock className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <Label htmlFor="kickoff-offset" className="text-sm font-medium">
                Kickoff Time Offset (Video Time when Match Starts)
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="kickoff-offset"
                  value={kickoffInput}
                  onChange={(e) => setKickoffInput(e.target.value)}
                  placeholder="e.g., 2:30 or -1:15"
                  className="w-32"
                  data-testid="kickoff-offset-input"
                />
                <Button 
                  onClick={handleKickoffOffsetChange}
                  size="sm"
                  data-testid="set-kickoff-offset"
                >
                  Set Offset
                </Button>
                <span className="text-sm text-gray-600">
                  Current: {formatTimeForInput(kickoffOffset)}
                </span>
              </div>
            </div>
          </div>
          
          {kickoffOffset !== 0 && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Offset applied: When you click an event at match time 0:00, the video will seek to {formatTimeForInput(kickoffOffset)}.
                {kickoffOffset < 0 && " (Negative offset means the video starts after kickoff)"}
                {kickoffOffset > 0 && " (Positive offset means the video includes pre-match content)"}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Table - Left Side */}
        <div className="lg:col-span-1">
          <MatchEventTable onEventClick={handleEventClick} />
        </div>
        
        {/* Video Player - Right Side */}
        <div className="lg:col-span-2">
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
              
              {/* Manual seek controls */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-3">Quick Seek Controls</h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEventClick(0)}
                    data-testid="seek-start"
                  >
                    Kickoff (0:00)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEventClick(30)}
                    data-testid="seek-30s"
                  >
                    Match 0:30
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEventClick(60)}
                    data-testid="seek-1m"
                  >
                    Match 1:00
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEventClick(120)}
                    data-testid="seek-2m"
                  >
                    Match 2:00
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEventClick(300)}
                    data-testid="seek-5m"
                  >
                    Match 5:00
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Instructions */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-2">How to use:</p>
            <ul className="space-y-1">
              <li>• Click on any event in the table to jump to that moment in the video</li>
              <li>• Use the search box to find specific events, players, or teams</li>
              <li>• Filter by event type (Pass, Shot, Goal, etc.) or team</li>
              <li>• Events are color-coded by team: Spain (red border) and England (blue border)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}