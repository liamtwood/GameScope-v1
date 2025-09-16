import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';

interface BasicYouTubePlayerProps {
  url: string;
}

export function BasicYouTubePlayer({ url }: BasicYouTubePlayerProps) {
  const [currentTime, setCurrentTime] = useState("0");
  
  // Extract video ID from URL
  const getVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const videoId = getVideoId(url);
  
  const seekToTime = (seconds: number) => {
    const iframe = document.querySelector('#youtube-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        `{"event":"command","func":"seekTo","args":[${seconds}, true]}`,
        '*'
      );
    }
  };

  const parseTimeInput = (input: string): number => {
    if (!input.trim()) return 0;
    
    if (input.includes(':')) {
      const [mins, secs] = input.split(':').map(Number);
      return (mins * 60) + (secs || 0);
    }
    
    const numValue = parseFloat(input.replace(/[^\d.]/g, ''));
    return isNaN(numValue) ? 0 : numValue;
  };

  const handleSeekSubmit = () => {
    const seconds = parseTimeInput(currentTime);
    seekToTime(seconds);
  };

  if (!videoId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-500">Invalid YouTube URL</p>
        </CardContent>
      </Card>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&controls=1&rel=0&fs=1`;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Basic YouTube Player (Direct Embed)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            id="youtube-iframe"
            src={embedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            data-testid="basic-youtube-iframe"
          />
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="Enter time (e.g., 1:30 or 90)"
              value={currentTime}
              onChange={(e) => setCurrentTime(e.target.value)}
              className="flex-1"
              data-testid="seek-time-input"
            />
            <Button
              onClick={handleSeekSubmit}
              data-testid="seek-button"
            >
              Seek
            </Button>
          </div>
          
          <div className="flex justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => seekToTime(0)}
              data-testid="seek-start"
            >
              Start
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => seekToTime(30)}
              data-testid="seek-30s"
            >
              30s
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => seekToTime(60)}
              data-testid="seek-1m"
            >
              1m
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => seekToTime(120)}
              data-testid="seek-2m"
            >
              2m
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-gray-600 border-t pt-4">
          <p><strong>Video ID:</strong> {videoId}</p>
          <p><strong>Embed URL:</strong> {embedUrl}</p>
          <p className="text-xs mt-2">
            This uses a direct YouTube iframe embed with JavaScript API for seeking control.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}