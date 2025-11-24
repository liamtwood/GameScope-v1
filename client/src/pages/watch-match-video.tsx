import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchScoreBanner } from '@/components/match-score-banner';
import { MetricsComparison } from '@/components/metrics-comparison';
import { MatchEventTable } from '@/components/MatchEventTable';
import { SpiderChart } from '@/components/spider-chart';
import { Fixture, MatchStats } from '@shared/schema';
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

  const { data: matchStats } = useQuery<MatchStats[]>({
    queryKey: ["/api/match-stats", fixtureId],
    enabled: !!fixtureId,
  });

  // Get the video data from fixture's videoLinks
  const videos = (fixture?.videoLinks as VideoData[]) || [];
  
  // Set default video to first one if not selected
  const currentVideoId = selectedVideoId || videos[0]?.id;
  const currentVideo = videos.find(v => v.id === currentVideoId) || videos[0];
  const videoUrl = currentVideo?.url || "https://www.youtube.com/watch?v=gvoQ8gvzuC4";

  // Normalize object storage URLs to app serving paths
  const normalizeStorageUrl = (url: string): string => {
    if (!url) return url;
    
    // Check if it's a Google Cloud Storage URL for uploaded videos
    if (url.startsWith('https://storage.googleapis.com/')) {
      try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        
        // Extract the path after the bucket name
        // Format: /bucket-name/path/to/file
        const parts = pathname.split('/');
        if (parts.length >= 3) {
          // Check if it's in the uploads directory
          const uploadsIndex = parts.indexOf('uploads');
          if (uploadsIndex !== -1) {
            // Get everything after 'uploads'
            const uploadPath = parts.slice(uploadsIndex + 1).join('/');
            return `/uploads/${uploadPath}`;
          }
        }
      } catch (e) {
        console.error('Error parsing storage URL:', e);
      }
    }
    
    return url;
  };

  // Determine video type and extract necessary info
  const getVideoType = (url: string) => {
    if (!url) return { type: 'none', embedUrl: '' };
    
    // Normalize storage URLs first
    const normalizedUrl = normalizeStorageUrl(url);
    
    // Check for FIFA Plus (check this first before other checks)
    if (normalizedUrl.includes('plus.fifa.com')) {
      console.log('Detected FIFA Plus URL:', normalizedUrl);
      return {
        type: 'fifaplus',
        embedUrl: normalizedUrl,
        originalUrl: normalizedUrl
      };
    }
    
    // Check for YouTube
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const youtubeMatch = normalizedUrl.match(youtubeRegex);
    if (youtubeMatch) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}?enablejsapi=1&controls=1&rel=0&fs=1`
      };
    }
    
    // Check for Google Drive
    const driveRegex = /drive\.google\.com\/file\/d\/([^/]+)/;
    const driveMatch = normalizedUrl.match(driveRegex);
    if (driveMatch) {
      const fileId = driveMatch[1];
      return {
        type: 'googledrive',
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`
      };
    }
    
    // Check for app-served videos from /uploads/
    if (normalizedUrl.startsWith('/uploads/')) {
      return { type: 'direct', embedUrl: normalizedUrl };
    }
    
    // Check for direct video files
    if (normalizedUrl.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
      return { type: 'direct', embedUrl: normalizedUrl };
    }
    
    // Default to iframe for other URLs
    return { type: 'iframe', embedUrl: normalizedUrl };
  };

  const videoInfo = getVideoType(videoUrl);

  // Spider Chart Data Transformation Functions - Normalized to percentages
  const createAttackSpiderData = (teamStats: MatchStats | null, opponentStats?: MatchStats | null) => {
    const maxGoals = Math.max(teamStats?.goals || 0, opponentStats?.goals || 0, 1);
    const maxShotsAttempted = Math.max(teamStats?.shotsAttempted || 0, opponentStats?.shotsAttempted || 0, 1);
    const maxShotsOnTarget = Math.max(teamStats?.shotsOnTarget || 0, opponentStats?.shotsOnTarget || 0, 1);
    const maxRunsIntoBoxes = Math.max(teamStats?.runsIntoBoxes || 0, opponentStats?.runsIntoBoxes || 0, 1);
    const maxCorners = Math.max(teamStats?.corners || 0, opponentStats?.corners || 0, 1);
    const maxDangerousCrosses = Math.max(teamStats?.dangerousCrosses || 0, opponentStats?.dangerousCrosses || 0, 1);
    
    return [
      { metric: 'Goals', team: ((teamStats?.goals || 0) / maxGoals) * 100, opponent: ((opponentStats?.goals || 0) / maxGoals) * 100, fullMark: 100 },
      { metric: 'Shots Attempted', team: ((teamStats?.shotsAttempted || 0) / maxShotsAttempted) * 100, opponent: ((opponentStats?.shotsAttempted || 0) / maxShotsAttempted) * 100, fullMark: 100 },
      { metric: 'Shots On Target', team: ((teamStats?.shotsOnTarget || 0) / maxShotsOnTarget) * 100, opponent: ((opponentStats?.shotsOnTarget || 0) / maxShotsOnTarget) * 100, fullMark: 100 },
      { metric: 'Runs Into Boxes', team: ((teamStats?.runsIntoBoxes || 0) / maxRunsIntoBoxes) * 100, opponent: ((opponentStats?.runsIntoBoxes || 0) / maxRunsIntoBoxes) * 100, fullMark: 100 },
      { metric: 'Corners', team: ((teamStats?.corners || 0) / maxCorners) * 100, opponent: ((opponentStats?.corners || 0) / maxCorners) * 100, fullMark: 100 },
      { metric: 'Dangerous Crosses', team: ((teamStats?.dangerousCrosses || 0) / maxDangerousCrosses) * 100, opponent: ((opponentStats?.dangerousCrosses || 0) / maxDangerousCrosses) * 100, fullMark: 100 }
    ];
  };

  const createPossessionSpiderData = (teamStats: MatchStats | null, opponentStats?: MatchStats | null) => {
    const maxTakeOns = Math.max(teamStats?.takeOns || 0, opponentStats?.takeOns || 0, 1);
    const maxPassesSuccess = Math.max(teamStats?.passesSuccess || 0, opponentStats?.passesSuccess || 0, 1);
    
    return [
      { metric: 'Possession %', team: teamStats?.possession || 0, opponent: opponentStats?.possession || 0, fullMark: 100 },
      { metric: 'Pass Accuracy %', team: teamStats?.passingSuccessRate || 0, opponent: opponentStats?.passingSuccessRate || 0, fullMark: 100 },
      { metric: 'First Touch %', team: teamStats?.firstTouchSuccessRate || 0, opponent: opponentStats?.firstTouchSuccessRate || 0, fullMark: 100 },
      { metric: 'Take Ons', team: ((teamStats?.takeOns || 0) / maxTakeOns) * 100, opponent: ((opponentStats?.takeOns || 0) / maxTakeOns) * 100, fullMark: 100 },
      { metric: 'Passes Success', team: ((teamStats?.passesSuccess || 0) / maxPassesSuccess) * 100, opponent: ((opponentStats?.passesSuccess || 0) / maxPassesSuccess) * 100, fullMark: 100 }
    ];
  };

  const createTechnicalSpiderData = (teamStats: MatchStats | null, opponentStats?: MatchStats | null) => {
    const maxTackles = Math.max(teamStats?.tackles || 0, opponentStats?.tackles || 0, 1);
    const maxFreeKicks = Math.max(teamStats?.freeKicks || 0, opponentStats?.freeKicks || 0, 1);
    const maxOffsides = Math.max(teamStats?.offsides || 0, opponentStats?.offsides || 0, 1);
    
    return [
      { metric: 'Tackles', team: ((teamStats?.tackles || 0) / maxTackles) * 100, opponent: ((opponentStats?.tackles || 0) / maxTackles) * 100, fullMark: 100 },
      { metric: 'Free Kicks', team: ((teamStats?.freeKicks || 0) / maxFreeKicks) * 100, opponent: ((opponentStats?.freeKicks || 0) / maxFreeKicks) * 100, fullMark: 100 },
      { metric: 'Offsides', team: ((teamStats?.offsides || 0) / maxOffsides) * 100, opponent: ((opponentStats?.offsides || 0) / maxOffsides) * 100, fullMark: 100 },
      { metric: 'R.Foot Pass %', team: teamStats?.rightFootPassSuccessRate || 0, opponent: opponentStats?.rightFootPassSuccessRate || 0, fullMark: 100 },
      { metric: 'L.Foot Pass %', team: teamStats?.leftFootPassSuccessRate || 0, opponent: opponentStats?.leftFootPassSuccessRate || 0, fullMark: 100 }
    ];
  };

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

      {/* Tabs for Video Player, Match Events, Match Stats, Spider Charts, and Match Report */}
      <Tabs defaultValue="video" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="video">Video Player</TabsTrigger>
          <TabsTrigger value="events">Match Events</TabsTrigger>
          <TabsTrigger value="stats">Team Statistics</TabsTrigger>
          <TabsTrigger value="spider">Spider Charts</TabsTrigger>
          <TabsTrigger value="report">Match Report</TabsTrigger>
        </TabsList>

        {/* Video Player Tab */}
        <TabsContent value="video">
          <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Match Video Player</CardTitle>
            {videos.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Choose Camera:</label>
                <Select
                  value={currentVideoId || ''}
                  onValueChange={setSelectedVideoId}
                >
                  <SelectTrigger className="w-[250px]" data-testid="select-video">
                    <SelectValue placeholder="Select camera" />
                  </SelectTrigger>
                  <SelectContent>
                    {videos.map((video) => (
                      <SelectItem key={video.id} value={video.id}>
                        {(video as any).label || getVideoDescription(video)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
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

            {videoInfo.type === 'fifaplus' && (
              <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">FIFA Plus Video</h3>
                  <p className="text-gray-300 mb-4">FIFA Plus videos cannot be embedded directly.</p>
                  <p className="text-sm text-gray-400 mb-6">Click the button below to watch on FIFA Plus</p>
                </div>
                <a
                  href={videoInfo.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  data-testid="link-open-fifaplus"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Watch on FIFA Plus
                </a>
              </div>
            )}
            
            {videoInfo.type === 'none' && (
              <div className="flex items-center justify-center h-full text-white">
                <p>No video available</p>
              </div>
            )}
          </div>
        </CardContent>
          </Card>
        </TabsContent>

        {/* Match Events Tab */}
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Match Events</CardTitle>
            </CardHeader>
            <CardContent>
              <MatchEventTable onEventClick={() => {}} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Match Stats Tab */}
        <TabsContent value="stats">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Team Statistics</h3>
              {matchStats && matchStats.length > 0 ? (
                (() => {
                  const fullGameStats = matchStats.find(stat => stat.period === 'FULL_GAME' && stat.isTeamStats === true) || null;
                  const opponentFullGameStats = matchStats.find(stat => stat.period === 'FULL_GAME' && (stat.isTeamStats === false || stat.isTeamStats === null)) || null;
                  
                  return fullGameStats ? (
                    <MetricsComparison
                      teamStats={fullGameStats}
                      opponentStats={opponentFullGameStats || undefined}
                      teamColor={polkStateColor}
                      opponentColor={oppositionColor}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No full game statistics available.</p>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No match statistics available. Upload match data to view detailed analytics.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Spider Charts Tab */}
        <TabsContent value="spider">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Spider Charts</h3>
              {matchStats && matchStats.length > 0 ? (
                (() => {
                  const fullGameStats = matchStats.find(stat => stat.period === 'FULL_GAME' && stat.isTeamStats === true) || null;
                  const opponentFullGameStats = matchStats.find(stat => stat.period === 'FULL_GAME' && (stat.isTeamStats === false || stat.isTeamStats === null)) || null;
                  
                  return fullGameStats ? (
                    <Tabs defaultValue="attack" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="attack">Attack</TabsTrigger>
                        <TabsTrigger value="possession">Possession</TabsTrigger>
                        <TabsTrigger value="technical">Technical</TabsTrigger>
                      </TabsList>

                      <TabsContent value="attack" className="mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <Card className="p-6">
                            <SpiderChart
                              data={createAttackSpiderData(fullGameStats, opponentFullGameStats)}
                              teamName=""
                              opponentName=""
                              title="Attack Performance"
                              teamColor="#dc2626"
                              opponentColor="#64748b"
                            />
                          </Card>
                          <Card className="p-6">
                            <h4 className="font-semibold text-foreground mb-4">Attack Metrics</h4>
                            <div className="space-y-3">
                              <div className="grid grid-cols-3 gap-4 text-sm font-medium border-b pb-2">
                                <span className="text-muted-foreground">Metric</span>
                                <span className="text-center" style={{ color: polkStateColor }}>{selectedClub?.name || 'Home Team'}</span>
                                <span className="text-gray-600 text-center">{opponentTeam?.shortName || "OPP"}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-4 items-center">
                                <span className="text-sm text-muted-foreground">Goals</span>
                                <span className="font-medium text-center">{fullGameStats?.goals || 0}</span>
                                <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.goals || 0}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-4 items-center">
                                <span className="text-sm text-muted-foreground">Shots Attempted</span>
                                <span className="font-medium text-center">{fullGameStats?.shotsAttempted || 0}</span>
                                <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.shotsAttempted || 0}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-4 items-center">
                                <span className="text-sm text-muted-foreground">Shots on Target</span>
                                <span className="font-medium text-center">{fullGameStats?.shotsOnTarget || 0}</span>
                                <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.shotsOnTarget || 0}</span>
                              </div>
                            </div>
                          </Card>
                        </div>
                      </TabsContent>

                      <TabsContent value="possession" className="mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <Card className="p-6">
                            <SpiderChart
                              data={createPossessionSpiderData(fullGameStats, opponentFullGameStats)}
                              teamName=""
                              opponentName=""
                              title="Possession Performance"
                              teamColor="#dc2626"
                              opponentColor="#64748b"
                            />
                          </Card>
                          <Card className="p-6">
                            <h4 className="font-semibold text-foreground mb-4">Possession Metrics</h4>
                            <div className="space-y-3">
                              <div className="grid grid-cols-3 gap-4 text-sm font-medium border-b pb-2">
                                <span className="text-muted-foreground">Metric</span>
                                <span className="text-center" style={{ color: polkStateColor }}>{selectedClub?.name || 'Home Team'}</span>
                                <span className="text-gray-600 text-center">{opponentTeam?.shortName || "OPP"}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-4 items-center">
                                <span className="text-sm text-muted-foreground">Possession %</span>
                                <span className="font-medium text-center">{fullGameStats?.possession || 0}%</span>
                                <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.possession || 0}%</span>
                              </div>
                              <div className="grid grid-cols-3 gap-4 items-center">
                                <span className="text-sm text-muted-foreground">Pass Accuracy %</span>
                                <span className="font-medium text-center">{fullGameStats?.passingSuccessRate || 0}%</span>
                                <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.passingSuccessRate || 0}%</span>
                              </div>
                            </div>
                          </Card>
                        </div>
                      </TabsContent>

                      <TabsContent value="technical" className="mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <Card className="p-6">
                            <SpiderChart
                              data={createTechnicalSpiderData(fullGameStats, opponentFullGameStats)}
                              teamName=""
                              opponentName=""
                              title="Technical Performance"
                              teamColor="#dc2626"
                              opponentColor="#64748b"
                            />
                          </Card>
                          <Card className="p-6">
                            <h4 className="font-semibold text-foreground mb-4">Technical Metrics</h4>
                            <div className="space-y-3">
                              <div className="grid grid-cols-3 gap-4 text-sm font-medium border-b pb-2">
                                <span className="text-muted-foreground">Metric</span>
                                <span className="text-center" style={{ color: polkStateColor }}>{selectedClub?.name || 'Home Team'}</span>
                                <span className="text-gray-600 text-center">{opponentTeam?.shortName || "OPP"}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-4 items-center">
                                <span className="text-sm text-muted-foreground">Tackles</span>
                                <span className="font-medium text-center">{fullGameStats?.tackles || 0}</span>
                                <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.tackles || 0}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-4 items-center">
                                <span className="text-sm text-muted-foreground">Free Kicks</span>
                                <span className="font-medium text-center">{fullGameStats?.freeKicks || 0}</span>
                                <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.freeKicks || 0}</span>
                              </div>
                            </div>
                          </Card>
                        </div>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No full game statistics available for spider charts.</p>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No match statistics available. Upload match data to view spider charts.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Match Report Tab */}
        <TabsContent value="report">
          <Card>
            <CardHeader>
              <CardTitle>Match Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {fixture?.attendance && (
                  <div className="border-b pb-4">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Attendance</h4>
                    <p className="text-2xl font-bold">{fixture.attendance.toLocaleString()}</p>
                  </div>
                )}
                
                {fixture?.report ? (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3">Report</h4>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{fixture.report}</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No match report available.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
