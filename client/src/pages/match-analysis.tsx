import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { VideoWithEvents } from '@/components/VideoWithEvents';
import { MainLayout } from '@/components/layout/main-layout';
import { Fixture } from '@shared/schema';
import { format } from 'date-fns';

export default function MatchAnalysis() {
  const [videoUrl, setVideoUrl] = useState<string>("https://www.youtube.com/watch?v=99bgTARgKD8");
  const [videoInitialized, setVideoInitialized] = useState(false);

  // Get fixtureId from URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const fixtureId = urlParams.get('fixtureId');

  const { data: fixture } = useQuery<Fixture>({
    queryKey: ["/api/fixture", fixtureId],
    enabled: !!fixtureId,
  });

  // Load the fixture's video URL once fixture is available
  useEffect(() => {
    if (fixture && !videoInitialized) {
      const links = fixture.videoLinks as any[] | null;
      if (links && links.length > 0 && links[0].url) {
        setVideoUrl(links[0].url);
      }
      setVideoInitialized(true);
    }
  }, [fixture, videoInitialized]);

  const title = fixture ? `Video Analysis: vs ${fixture.opponent}` : "Video Analysis";
  const subtitle = fixture
    ? `${format(new Date(fixture.date), 'd MMM yyyy')} · Event-driven video control with StatsBomb data`
    : "Click any event to jump to that moment in the video";

  return (
    <MainLayout
      title={title}
      subtitle={subtitle}
    >
      <VideoWithEvents
        url={videoUrl}
        onVideoUrlChange={setVideoUrl}
        fixtureId={fixtureId || undefined}
      />
    </MainLayout>
  );
}
