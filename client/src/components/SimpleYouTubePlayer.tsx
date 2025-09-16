import { useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause } from 'lucide-react';

interface SimpleYouTubePlayerProps {
  url: string;
}

export function SimpleYouTubePlayer({ url }: SimpleYouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  const handleReady = () => {
    console.log('Simple player ready');
    setReady(true);
  };

  const handlePlay = () => {
    console.log('Playing');
    setPlaying(true);
  };

  const handlePause = () => {
    console.log('Paused');
    setPlaying(false);
  };

  const handleError = (error: any) => {
    console.error('Player error:', error);
  };

  const togglePlayPause = () => {
    setPlaying(!playing);
  };

  const canPlay = ReactPlayer.canPlay ? ReactPlayer.canPlay(url) : true;
  
  console.log('Rendering SimpleYouTubePlayer with URL:', url);
  console.log('Can play URL:', canPlay);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Simple YouTube Player (Debug)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-video bg-black">
          <ReactPlayer
            ref={playerRef}
            url={url}
            playing={playing}
            onReady={handleReady}
            onPlay={handlePlay}
            onPause={handlePause}
            onError={handleError}
            width="100%"
            height="100%"
            controls={true}
            data-testid="simple-youtube-player"
          />
        </div>
        
        <div className="flex items-center justify-center space-x-4">
          <Button onClick={togglePlayPause} data-testid="simple-play-pause">
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playing ? 'Pause' : 'Play'}
          </Button>
        </div>
        
        <div className="text-sm text-gray-600">
          <p><strong>URL:</strong> {url}</p>
          <p><strong>Can Play:</strong> {canPlay ? 'Yes' : 'No'}</p>
          <p><strong>Ready:</strong> {ready ? 'Yes' : 'No'}</p>
          <p><strong>Playing:</strong> {playing ? 'Yes' : 'No'}</p>
        </div>
      </CardContent>
    </Card>
  );
}