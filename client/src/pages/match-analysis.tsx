import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { VideoWithEvents } from '@/components/VideoWithEvents';
import { MainLayout } from '@/components/layout/main-layout';
import { Fixture } from '@shared/schema';
import { format } from 'date-fns';

export default function MatchAnalysis() {
  const [videoUrl, setVideoUrl] = useState<string>("https://www.youtube.com/watch?v=gvoQ8gvzuC4");
  
  // Get fixtureId from URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const fixtureId = urlParams.get('fixtureId');

  const { data: fixture } = useQuery<Fixture>({
    queryKey: ["/api/fixture", fixtureId],
    enabled: !!fixtureId,
  });

  // Update page title when fixture is loaded
  const title = fixture ? `Video Analysis: ${fixture.opponent}` : "Video Analysis";
  const subtitle = fixture 
    ? `${format(new Date(fixture.date), 'd MMM yyyy')} • Advanced video analysis with event synchronization`
    : "Advanced video analysis with event synchronization and highlight generation";

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