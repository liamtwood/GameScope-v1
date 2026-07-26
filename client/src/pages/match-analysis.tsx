import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useSearch } from 'wouter';
import { VideoWithEvents } from '@/components/VideoWithEvents';
import { MainLayout } from '@/components/layout/main-layout';
import { Fixture } from '@shared/schema';
import { format } from 'date-fns';
import { useTeam } from '@/contexts/team-context';
import { useClub } from '@/contexts/club-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { SeasonPicker } from '@/components/ui/season-picker';
import { getEffectiveSeasonStartMonth, getCurrentSeason, filterFixturesBySeason } from '@/utils/seasonUtils';

const DURATION_LABELS: Record<string, string> = {
  "1st_half": "1st Half",
  "2nd_half": "2nd Half",
  "full_game": "Full Game",
  "training_session": "Training Session",
};

const LOCATION_LABELS: Record<string, string> = {
  "halfway_line": "Half Way Line",
  "behind_goal": "Behind Goal",
  "corner_flag": "Corner Flag",
  "sideline": "Sideline",
  "elevated_view": "Elevated View",
};

function getCameraLabel(video: any): string {
  if (video.label) return video.label;
  const d = DURATION_LABELS[video.duration] || video.duration || '';
  const l = LOCATION_LABELS[video.location] || video.location || '';
  if (d && l) return `${d} · ${l}`;
  return d || l || 'Camera';
}

export default function MatchAnalysis() {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');
  const [, setLocation] = useLocation();
  const { selectedTeam: currentTeam } = useTeam();
  const { selectedClub: currentClub } = useClub();

  const [selectedSeason, setSelectedSeason] = useState<string>('all');

  const seasonStartMonth = getEffectiveSeasonStartMonth(currentTeam ?? undefined, currentClub ?? undefined);

  const search = useSearch();
  const fixtureId = new URLSearchParams(search).get('fixtureId') ?? undefined;

  const { data: fixtures = [] } = useQuery<Fixture[]>({
    queryKey: ['/api/fixtures', currentTeam?.id],
    enabled: !!currentTeam?.id,
  });

  const { data: fixture } = useQuery<Fixture>({
    queryKey: ['/api/fixture', fixtureId],
    enabled: !!fixtureId,
  });

  const videoLinks: any[] = (fixture?.videoLinks as any[] | null) ?? [];

  // When the fixture changes, reset to the first video link
  useEffect(() => {
    if (fixture) {
      const links = fixture.videoLinks as any[] | null;
      if (links && links.length > 0) {
        setSelectedVideoId(links[0].id);
        setVideoUrl(links[0].url || '');
      } else {
        setSelectedVideoId('');
        setVideoUrl('');
      }
    }
  }, [fixture?.id]);

  const handleCameraChange = (id: string) => {
    setSelectedVideoId(id);
    const link = videoLinks.find((v: any) => v.id === id);
    if (link) setVideoUrl(link.url || '');
  };

  const selectedVideoLink = videoLinks.find((v: any) => v.id === selectedVideoId) ?? videoLinks[0] ?? null;
  const fixtureKickoffOffset: number | undefined = selectedVideoLink?.kickoffOffset ?? undefined;
  const fixtureSecondHalfOffset: number | undefined = selectedVideoLink?.secondHalfOffset ?? undefined;

  const handleFixtureChange = (id: string) => {
    setLocation(`/match-analysis?fixtureId=${id}`);
  };

  const seasonFiltered = selectedSeason === 'all' ? fixtures : filterFixturesBySeason(fixtures, selectedSeason, seasonStartMonth);
  const sortedFixtures = [...seasonFiltered].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const title = fixture ? `Video Analysis: vs ${fixture.opponent}` : 'Video Analysis';
  const subtitle = fixture
    ? `${format(new Date(fixture.date), 'd MMM yyyy')} · Event-driven video control with StatsBomb data`
    : 'Select a fixture to load events and video';

  return (
    <MainLayout title={title} subtitle={subtitle}>
      {/* Fixture selector */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <SeasonPicker
          team={currentTeam ?? undefined}
          club={currentClub ?? undefined}
          selectedSeason={selectedSeason}
          onSeasonChange={setSelectedSeason}
          className="w-[160px]"
        />
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
        {sortedFixtures.length === 0 && currentTeam && (
          <span className="text-sm text-muted-foreground">No fixtures for this season</span>
        )}
        {videoLinks.length > 1 && (
          <>
            <Label className="text-sm font-medium whitespace-nowrap">Choose Camera</Label>
            <Select value={selectedVideoId} onValueChange={handleCameraChange}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select camera…" />
              </SelectTrigger>
              <SelectContent>
                {videoLinks.map((v: any) => (
                  <SelectItem key={v.id} value={v.id}>
                    {getCameraLabel(v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {fixtureId ? (
        <VideoWithEvents
          url={videoUrl}
          onVideoUrlChange={setVideoUrl}
          fixtureId={fixtureId}
          initialKickoffOffset={fixtureKickoffOffset}
          initialSecondHalfOffset={fixtureSecondHalfOffset}
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
