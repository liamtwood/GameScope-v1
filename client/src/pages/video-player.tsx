import { useState } from 'react';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { SimpleYouTubePlayer } from '@/components/SimpleYouTubePlayer';
import { BasicYouTubePlayer } from '@/components/BasicYouTubePlayer';
import { VideoWithEvents } from '@/components/VideoWithEvents';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function VideoPlayerPage() {
  const [videoUrl, setVideoUrl] = useState("https://www.youtube.com/watch?v=gvoQ8gvzuC4");

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Video Analysis</h1>
          <p className="text-xl text-muted-foreground">
            Match event synchronization with video playback
          </p>
        </div>

        {/* YouTube Players */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-center">Video Players</h2>
          
          <Tabs defaultValue="match-analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="match-analysis">Match Analysis</TabsTrigger>
              <TabsTrigger value="basic">Basic Player</TabsTrigger>
              <TabsTrigger value="simple">React Player</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Player</TabsTrigger>
            </TabsList>
            
            <TabsContent value="match-analysis" className="space-y-4">
              <VideoWithEvents 
                url={videoUrl} 
                onVideoUrlChange={setVideoUrl}
              />
            </TabsContent>
            
            <TabsContent value="basic" className="space-y-4">
              <BasicYouTubePlayer url={videoUrl} />
            </TabsContent>
            
            <TabsContent value="simple" className="space-y-4">
              <SimpleYouTubePlayer url={videoUrl} />
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4">
              <YouTubePlayer
                url={videoUrl}
                width="100%"
                height={500}
              />
            </TabsContent>
          </Tabs>
        </div>

      </div>
    </div>
  );
}