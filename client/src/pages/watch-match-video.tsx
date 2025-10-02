import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Fixture } from '@shared/schema';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function WatchMatchVideo() {
  const [, setLocation] = useLocation();
  const [videoUrl] = useState<string>("https://www.youtube.com/watch?v=gvoQ8gvzuC4");
  
  // Get fixtureId from URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const fixtureId = urlParams.get('fixtureId');

  const { data: fixture } = useQuery<Fixture>({
    queryKey: ["/api/fixture", fixtureId],
    enabled: !!fixtureId,
  });

  // Extract video ID for display
  const getVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const videoId = getVideoId(videoUrl);

  // Update page title when fixture is loaded
  const title = fixture ? `Watch Match Video: ${fixture.opponent}` : "Watch Match Video";
  const subtitle = fixture 
    ? `${format(new Date(fixture.date), 'd MMM yyyy')}`
    : "Match video player";

  return (
    <MainLayout 
      title={title}
      subtitle={subtitle}
    >
      <div className="mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setLocation('/videos')}
          data-testid="button-back-videos"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Match Video
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Match Video Player</CardTitle>
          {videoId && (
            <p className="text-sm text-muted-foreground">
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
    </MainLayout>
  );
}
