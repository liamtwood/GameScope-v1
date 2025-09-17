import { useRef, useState } from 'react';
import { BasicYouTubePlayer } from '@/components/BasicYouTubePlayer';
import { MatchEventTable } from '@/components/MatchEventTable';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';

interface VideoWithEventsProps {
  url: string;
}

export function VideoWithEvents({ url }: VideoWithEventsProps) {
  const [currentSeekTime, setCurrentSeekTime] = useState<number | null>(null);
  
  const handleEventClick = (timeInSeconds: number) => {
    console.log('Seeking to time:', timeInSeconds);
    setCurrentSeekTime(timeInSeconds);
    
    // Find the YouTube iframe and seek to the time
    const iframe = document.querySelector('#youtube-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        `{"event":"command","func":"seekTo","args":[${timeInSeconds}, true]}`,
        '*'
      );
    }
    
    // Also try to seek using any other player refs if available
    const reactPlayerSeek = () => {
      const playerElement = document.querySelector('[data-testid="simple-youtube-player"]');
      if (playerElement) {
        // For react-player, we'll need to access it differently
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
                    Start (0:00)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEventClick(30)}
                    data-testid="seek-30s"
                  >
                    30s
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEventClick(60)}
                    data-testid="seek-1m"
                  >
                    1:00
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEventClick(120)}
                    data-testid="seek-2m"
                  >
                    2:00
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEventClick(300)}
                    data-testid="seek-5m"
                  >
                    5:00
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