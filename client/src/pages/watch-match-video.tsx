import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MatchScoreBanner } from '@/components/match-score-banner';
import { Fixture } from '@shared/schema';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { useTeam } from '@/contexts/team-context';
import { useClub } from '@/contexts/club-context';

interface VideoData {
  id: string;
  duration: string;
  location: string;
  url?: string;
  filename?: string;
  uploadedAt?: string;
}

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

export default function WatchMatchVideo() {
  const [, setLocation] = useLocation();
  const { selectedTeam } = useTeam();
  const { selectedClub } = useClub();
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  
  // Get fixtureId from URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const fixtureId = urlParams.get('fixtureId');

  const { data: fixture } = useQuery<Fixture>({
    queryKey: ["/api/fixture", fixtureId],
    enabled: !!fixtureId,
  });

  const { data: oppositionTeams } = useQuery<any[]>({
    queryKey: ["/api/opposition-teams"],
  });

  // Get the video data from fixture's videoLinks
  const videos = (fixture?.videoLinks as VideoData[]) || [];
  
  // Set default video to first one if not selected
  const currentVideoId = selectedVideoId || videos[0]?.id;
  const currentVideo = videos.find(v => v.id === currentVideoId) || videos[0];
  const videoUrl = currentVideo?.url || "https://www.youtube.com/watch?v=gvoQ8gvzuC4";

  // Determine video type and extract necessary info
  const getVideoType = (url: string) => {
    if (!url) return { type: 'none', embedUrl: '' };
    
    // Check for YouTube
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}?enablejsapi=1&controls=1&rel=0&fs=1`
      };
    }
    
    // Check for Google Drive
    const driveRegex = /drive\.google\.com\/file\/d\/([^/]+)/;
    const driveMatch = url.match(driveRegex);
    if (driveMatch) {
      const fileId = driveMatch[1];
      return {
        type: 'googledrive',
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`
      };
    }
    
    // Check for direct video files
    if (url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
      return { type: 'direct', embedUrl: url };
    }
    
    // Default to iframe for other URLs
    return { type: 'iframe', embedUrl: url };
  };

  const videoInfo = getVideoType(videoUrl);

  // Generate video description
  const getVideoDescription = (video?: VideoData) => {
    if (!video) return "Match Video";
    const duration = DURATION_LABELS[video.duration] || video.duration;
    const location = LOCATION_LABELS[video.location] || video.location;
    return `${duration} from ${location}`;
  };

  // Get opponent team from opponents table
  const opponentTeam = oppositionTeams?.find((team: any) => 
    fixture?.oppositionTeamId ? team.id === fixture.oppositionTeamId : team.name === fixture?.opponent
  );

  // Use selected club for team colors and logo, opponent from opponents table
  const polkStateColor = (selectedClub?.colors as any)?.primary || '#CC4125';
  const oppositionColor = (opponentTeam?.colors as any)?.primary || '#6b7280';
  
  const teamLogoPath = selectedClub?.logoPath;
  const opponentLogoPath = opponentTeam?.logoPath;

  // Get primary color from team/club colors with fallback
  const teamColors = (selectedTeam?.colors as any) || {};
  const clubColors = (selectedClub?.colors as any) || {};
  const primaryColor = teamColors.primary || clubColors.primary || '#CC4125';

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

      {/* Match Result Header */}
      {fixture && (
        <MatchScoreBanner 
          fixture={fixture}
          teamLogoPath={teamLogoPath || undefined}
          opponentLogoPath={opponentLogoPath || undefined}
          polkStateColor={polkStateColor}
          oppositionColor={oppositionColor}
          primaryColor={primaryColor}
          clubName={selectedClub?.name}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Match Video Player</CardTitle>
            {videos.length > 1 && (
              <Select
                value={currentVideoId || ''}
                onValueChange={setSelectedVideoId}
              >
                <SelectTrigger className="w-[300px]" data-testid="select-video">
                  <SelectValue placeholder="Select video" />
                </SelectTrigger>
                <SelectContent>
                  {videos.map((video) => (
                    <SelectItem key={video.id} value={video.id}>
                      {getVideoDescription(video)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {getVideoDescription(currentVideo)}
          </p>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {videoInfo.type === 'youtube' && (
              <iframe
                id="youtube-iframe"
                src={videoInfo.embedUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                data-testid="match-video-iframe"
              />
            )}
            
            {videoInfo.type === 'googledrive' && (
              <iframe
                src={videoInfo.embedUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                data-testid="match-video-iframe"
              />
            )}
            
            {videoInfo.type === 'direct' && (
              <video
                controls
                className="w-full h-full"
                data-testid="match-video-player"
              >
                <source src={videoInfo.embedUrl} type="video/mp4" />
                <source src={videoInfo.embedUrl} type="video/webm" />
                <source src={videoInfo.embedUrl} type="video/ogg" />
                Your browser does not support the video tag.
              </video>
            )}
            
            {videoInfo.type === 'iframe' && videoInfo.embedUrl && (
              <iframe
                src={videoInfo.embedUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                data-testid="match-video-iframe"
              />
            )}
            
            {videoInfo.type === 'none' && (
              <div className="flex items-center justify-center h-full text-white">
                <p>No video available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
