import { useState } from 'react';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { SimpleYouTubePlayer } from '@/components/SimpleYouTubePlayer';
import { BasicYouTubePlayer } from '@/components/BasicYouTubePlayer';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function VideoPlayerPage() {
  const [videoUrl, setVideoUrl] = useState("https://www.youtube.com/watch?v=gvoQ8gvzuC4");
  const [inputUrl, setInputUrl] = useState("");

  const handleUrlSubmit = () => {
    if (inputUrl.trim()) {
      setVideoUrl(inputUrl.trim());
      setInputUrl("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUrlSubmit();
    }
  };

  const sampleVideos = [
    {
      title: "Sample Video (Default)",
      url: "https://www.youtube.com/watch?v=gvoQ8gvzuC4",
      description: "The example video you provided"
    },
    {
      title: "React Tutorial",
      url: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
      description: "React in 100 Seconds"
    },
    {
      title: "JavaScript Basics",
      url: "https://www.youtube.com/watch?v=W6NZfCO5SIk",
      description: "JavaScript Tutorial for Beginners"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">YouTube Video Player</h1>
          <p className="text-xl text-muted-foreground">
            Play YouTube videos with advanced position controls
          </p>
        </div>

        {/* URL Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Load Video</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Enter YouTube video URL..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
                data-testid="video-url-input"
              />
              <Button
                onClick={handleUrlSubmit}
                data-testid="load-video-button"
              >
                Load Video
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <strong>Current Video:</strong> {videoUrl}
            </div>
          </CardContent>
        </Card>

        {/* Sample Videos */}
        <Card>
          <CardHeader>
            <CardTitle>Sample Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {sampleVideos.map((video, index) => (
                <div key={index} className="space-y-2">
                  <h4 className="font-medium">{video.title}</h4>
                  <p className="text-sm text-muted-foreground">{video.description}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVideoUrl(video.url)}
                    className="w-full"
                    data-testid={`sample-video-${index}`}
                  >
                    Load This Video
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* YouTube Players */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-center">Video Players</h2>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Player</TabsTrigger>
              <TabsTrigger value="simple">React Player</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Player</TabsTrigger>
            </TabsList>
            
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

        {/* Usage Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Position Controls:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Drag the progress bar to seek to any position</li>
                  <li>• Use the ±10s buttons for quick navigation</li>
                  <li>• Type time in the input (e.g., "1:30" or "90") and click Go</li>
                  <li>• Use quick seek buttons for common positions</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Playback Controls:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Play/Pause button for playback control</li>
                  <li>• Volume slider and mute button</li>
                  <li>• Real-time position and duration display</li>
                  <li>• Progress percentage indicator</li>
                </ul>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-2">Supported URL Formats:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• https://www.youtube.com/watch?v=VIDEO_ID</li>
                <li>• https://youtu.be/VIDEO_ID</li>
                <li>• https://www.youtube.com/embed/VIDEO_ID</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}