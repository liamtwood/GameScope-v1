import { useState } from 'react';
import { VideoWithEvents } from '@/components/VideoWithEvents';
import { MainLayout } from '@/components/layout/main-layout';

export default function MatchAnalysis() {
  const [videoUrl, setVideoUrl] = useState<string>("https://www.youtube.com/watch?v=gvoQ8gvzuC4");

  return (
    <MainLayout 
      title="Match Analysis" 
      subtitle="Advanced video analysis with event synchronization and highlight generation"
    >
      <VideoWithEvents 
        url={videoUrl} 
        onVideoUrlChange={setVideoUrl}
      />
    </MainLayout>
  );
}