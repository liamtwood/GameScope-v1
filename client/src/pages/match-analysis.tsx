import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { VideoWithEvents } from '@/components/VideoWithEvents';
import { MainLayout } from '@/components/layout/main-layout';
import { Fixture } from '@shared/schema';
import { format } from 'date-fns';
import { useTeam } from '@/contexts/team-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function MatchAnalysis() {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [, setLocation] = useLocation();
  const { selectedTeam: currentTeam } = useTeam();

  const urlParams = new URLSearchParams(window.location.search);
  const fixtureId = urlParams.get('fixtureId') ?? undefined;

  const { data: fixtures = [] } = useQuery<Fixture[]>({
    queryKey: ['/api/fixtures', currentTeam?.id],
    enabled: !!currentTeam?.id,
  });

  const { data: fixture } = useQuery<Fixture>({
    queryKey: ['/api/fixture', fixtureId],
    enabled: !!fixtureId,
  });

  // When the fixture loads, set the video URL from its video links
  useEffect(() => {
    if (fixture) {
      const links = fixture.videoLinks as any[] | null;
      if (links && links.length > 0 && links[0].url) {
        setVideoUrl(links[0].url);
      } else {
        setVideoUrl('');
      }
    }
  }, [fixture?.id]);

  const handleFixtureChange = (id: string) => {
    setLocation(`/match-analysis?fixtureId=${id}`);
  };

  const sortedFixtures = [...fixtures].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const title = fixture ? `Video Analysis: vs ${fixture.opponent}` : 'Video Analysis';
  const subtitle = fixture
    ? `${format(new Date(fixture.date), 'd MMM yyyy')} · Event-driven video control with StatsBomb data`
    : 'Select a fixture to load events and video';

  return (
    <MainLayout title={title} subtitle={subtitle}>
      {/* Fixture selector */}
      <div className="mb-4 flex items-center gap-3">
        <Label className="text-sm font-medium whitespace-nowrap">Fixture</Label>
        <Select value={fixtureId ?? ''} onValueChange={handleFixtureChange}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Select a fixture…" />
          </SelectTrigger>
          <SelectContent>
            {sortedFixtures.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                vs {f.opponent} — {format(new Date(f.date), 'd MMM yyyy')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fixtures.length === 0 && currentTeam && (
          <span className="text-sm text-muted-foreground">No fixtures found for this team</span>
        )}
      </div>

      {fixtureId ? (
        <VideoWithEvents
          url={videoUrl}
          onVideoUrlChange={setVideoUrl}
          fixtureId={fixtureId}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-80 text-muted-foreground gap-3 border rounded-lg bg-muted/20">
          <p className="text-lg font-medium">No fixture selected</p>
          <p className="text-sm">Choose a fixture from the dropdown above to load its events and video.</p>
        </div>
      )}
    </MainLayout>
  );
}
