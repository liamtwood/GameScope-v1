import { useState } from 'react';
import { VideoWithEvents } from '@/components/VideoWithEvents';

export function VideoPlayerPage() {
  const [videoUrl, setVideoUrl] = useState("https://www.youtube.com/watch?v=99bgTARgKD8");

  return (
    <div className="container mx-auto px-4 py-8 max-w-full">
      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Video Analysis</h1>
        <p className="text-xl text-muted-foreground">
          Match event synchronization, highlight generation, and video playback
        </p>
      </div>

      {/* Main Video Analysis Component */}
      <VideoWithEvents 
        url={videoUrl} 
        onVideoUrlChange={setVideoUrl}
      />
    </div>
  );
}