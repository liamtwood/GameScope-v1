import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Share, Clock, Calendar, Video as VideoIcon, Image, Blocks, TvMinimalPlay, Camera, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { Fixture, Team, OppositionTeam, VideoLink, MatchStats, Competition } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useTeam } from "@/contexts/team-context";
import { VideoAnalysisDashboard } from "@/components/video-analysis-dashboard";
import { MatchScoreBanner } from "@/components/match-score-banner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type VideoFilter = 'all' | 'recent' | 'analyzed';
type ViewMode = 'tile' | 'watch';

export default function Videos() {
  const [activeFilter, setActiveFilter] = useState<VideoFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('tile');
  const [selectedFixtureId, setSelectedFixtureId] = useState<string | null>(null);
  const [selectedCameraAngle, setSelectedCameraAngle] = useState<string>('full-match');
  const [activeTab, setActiveTab] = useState<string>('video-player');
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { selectedTeam: currentTeam } = useTeam();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load view mode preference from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('videoViewMode');
    if (savedViewMode === 'tile' || savedViewMode === 'watch') {
      setViewMode(savedViewMode);
    }
  }, []);

  // Save view mode preference to localStorage
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('videoViewMode', mode);
  };

  const { data: fixtures, isLoading } = useQuery<Fixture[]>({ 
    queryKey: ["/api/fixtures", currentTeam?.id],
    enabled: !!currentTeam?.id 
  });

  const { data: oppositionTeams } = useQuery<OppositionTeam[]>({ 
    queryKey: ["/api/opposition-teams"] 
  });

  const { data: enabledCompetitions = [] } = useQuery<Competition[]>({
    queryKey: ["/api/teams", currentTeam?.id, "competitions/enabled"],
    enabled: !!currentTeam?.id
  });

  // Only show matches that have occurred before tomorrow, sorted by date
  const videoFixtures = useMemo(() => {
    const filtered = fixtures?.filter(f => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0); // Start of tomorrow
      const matchDate = new Date(f.date);
      
      const isBeforeTomorrow = matchDate < tomorrow;
      const hasVideoOrRelevant = f.hasVideo || f.status === 'SCHEDULED' || f.status === 'COMPLETED' || f.status === 'NO_CONTEST';
      
      // Filter by competition if one is selected
      const matchesCompetition = selectedCompetitionId === 'all' || f.competitionId === selectedCompetitionId;
      
      // Include only matches that occurred before tomorrow and match the competition filter
      return isBeforeTomorrow && hasVideoOrRelevant && matchesCompetition;
    }) || [];
    
    // Sort by date based on sort order
    return filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [fixtures, selectedCompetitionId, sortOrder]);

  // Memoized selected fixture
  const selectedFixture = useMemo(() => {
    if (!selectedFixtureId) {
      return videoFixtures[0] || null;
    }
    return videoFixtures.find(f => f.id === selectedFixtureId) || videoFixtures[0] || null;
  }, [videoFixtures, selectedFixtureId]);

  // Fetch match stats for selected fixture
  const { data: matchStats, isLoading: isLoadingStats } = useQuery<MatchStats[]>({
    queryKey: ['/api/match-stats', selectedFixture?.id],
    enabled: !!selectedFixture?.id,
  });

  // Memoized camera options from fixture video links
  const cameraOptions = useMemo(() => {
    if (!selectedFixture?.videoLinks || !Array.isArray(selectedFixture.videoLinks)) {
      // Default camera options
      return [
        { value: 'full-match', label: 'Full Match' },
        { value: '1st-half', label: '1st Half' },
        { value: '2nd-half', label: '2nd Half' },
        { value: 'halfway-line', label: 'Halfway Line' },
        { value: 'behind-goal', label: 'Behind Goal' },
        { value: 'tactical', label: 'Tactical Camera' },
      ];
    }
    
    return (selectedFixture.videoLinks as VideoLink[]).map((link: VideoLink) => ({
      value: link.cameraAngle || link.id,
      label: link.label || (link.cameraAngle ? link.cameraAngle.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Unknown'),
    }));
  }, [selectedFixture]);

  // Memoized selected video link
  const selectedVideo = useMemo(() => {
    if (!selectedFixture?.videoLinks || !Array.isArray(selectedFixture.videoLinks)) {
      return null;
    }
    const links = selectedFixture.videoLinks as VideoLink[];
    return links.find((link: VideoLink) => (link.cameraAngle || link.id) === selectedCameraAngle) || links[0] || null;
  }, [selectedFixture, selectedCameraAngle]);

  // Effect to set default camera angle when fixture changes
  useEffect(() => {
    if (cameraOptions.length > 0 && !cameraOptions.find(opt => opt.value === selectedCameraAngle)) {
      setSelectedCameraAngle(cameraOptions[0].value);
    }
  }, [cameraOptions, selectedCameraAngle]);

  const handleWatchVideo = (fixture: Fixture) => {
    // Navigate to the watch match video page with selected camera angle
    const cameraParam = selectedCameraAngle ? `&camera=${encodeURIComponent(selectedCameraAngle)}` : '';
    setLocation(`/watch-match-video?fixtureId=${fixture.id}${cameraParam}`);
  };
  
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  const handleShareVideo = (fixture: Fixture) => {
    toast({
      title: "Sharing Video",
      description: `Sharing video link for ${fixture.opponent}`,
    });
  };

  const getMatchBadge = (fixture: Fixture) => {
    if (fixture.status === 'COMPLETED') {
      if (fixture.homeScore !== null && fixture.awayScore !== null) {
        const isHome = fixture.type === 'HOME';
        const ourScore = isHome ? fixture.homeScore : fixture.awayScore;
        const theirScore = isHome ? fixture.awayScore : fixture.homeScore;
        
        if (ourScore > theirScore) {
          return <Badge className="bg-green-100 text-green-800">WIN {ourScore}-{theirScore}</Badge>;
        } else if (ourScore < theirScore) {
          return <Badge className="bg-red-100 text-red-800">LOSS {ourScore}-{theirScore}</Badge>;
        } else {
          return <Badge className="bg-yellow-100 text-yellow-800">DRAW {ourScore}-{theirScore}</Badge>;
        }
      }
    } else if (fixture.status === 'SCHEDULED') {
      return <Badge className="bg-blue-100 text-blue-800">UPCOMING</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">{fixture.status}</Badge>;
  };

  // Set default selected fixture to first one when in watch mode
  useEffect(() => {
    if (viewMode === 'watch' && videoFixtures.length > 0 && !selectedFixtureId) {
      setSelectedFixtureId(videoFixtures[0].id);
    }
  }, [viewMode, videoFixtures, selectedFixtureId]);

  return (
    <MainLayout 
      title="Match Video" 
      subtitle="Video analysis and match recordings"
    >
      {/* View Mode Toggle and Filters */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-3 items-center">
          {/* Competition Filter Dropdown */}
          <Select value={selectedCompetitionId} onValueChange={setSelectedCompetitionId}>
            <SelectTrigger className="w-[200px]" data-testid="select-competition-filter">
              <SelectValue placeholder="All Competitions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Competitions</SelectItem>
              {enabledCompetitions.map((competition) => (
                <SelectItem key={competition.id} value={competition.id}>
                  {competition.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === 'tile' ? "default" : "ghost"}
            size="sm"
            onClick={() => handleViewModeChange('tile')}
            className={viewMode === 'tile' ? "bg-background text-foreground shadow-sm" : ""}
            data-testid="button-view-tile"
          >
            <Blocks className="h-4 w-4 mr-2" />
            Tile Mode
          </Button>
          <Button
            variant={viewMode === 'watch' ? "default" : "ghost"}
            size="sm"
            onClick={() => handleViewModeChange('watch')}
            className={viewMode === 'watch' ? "bg-background text-foreground shadow-sm" : ""}
            data-testid="button-view-watch"
          >
            <TvMinimalPlay className="h-4 w-4 mr-2" />
            Watch Mode
          </Button>
        </div>
      </div>


      {/* Watch Mode Layout */}
      {viewMode === 'watch' && videoFixtures.length > 0 && (
        <div className="space-y-6">
          {/* Two-Column Layout: Left (Controls) + Right (Video Player) */}
          {selectedFixture && (
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left Column: Match Info (40%) */}
                  <div className="flex-1 md:w-2/5 space-y-4">
                    {/* Match Info Header */}
                    <div className="flex items-start gap-3">
                      {(() => {
                        const opponent = oppositionTeams?.find(team => team.name === selectedFixture.opponent);
                        return opponent?.logoPath ? (
                          <img 
                            src={opponent.logoPath} 
                            alt={`${selectedFixture.opponent} logo`}
                            className="w-16 h-16 object-contain flex-shrink-0"
                            data-testid="img-opponent-logo"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                            {selectedFixture.opponent.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                        );
                      })()}
                      <div className="flex-1">
                        <h2 className="text-xl font-bold mb-2">{selectedFixture.opponent}</h2>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <p className="text-muted-foreground">{format(new Date(selectedFixture.date), 'd MMMM yyyy, h:mm a')}</p>
                          {getMatchBadge(selectedFixture)}
                          <Badge className="bg-gray-100 text-gray-800">
                            {selectedFixture.type === 'HOME' ? 'Home' : 'Away'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Match Report and Attendance */}
                    {(selectedFixture.attendance || selectedFixture.report) && (
                      <div className="space-y-3 pt-4 border-t">
                        {selectedFixture.attendance && (
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Attendance</label>
                            <p className="text-lg font-bold">{selectedFixture.attendance.toLocaleString()}</p>
                          </div>
                        )}
                        
                        {selectedFixture.report && (
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Match Report</label>
                            <p className="text-sm leading-relaxed mt-1 whitespace-pre-wrap">{selectedFixture.report}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Tabs + Content (60%) */}
                  <div className="flex-1 md:w-3/5 space-y-4">
                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="video-player" data-testid="tab-video-player">Video Player</TabsTrigger>
                        <TabsTrigger value="match-events" data-testid="tab-match-events">Match Events</TabsTrigger>
                        <TabsTrigger value="team-stats" data-testid="tab-team-stats">Team Stats</TabsTrigger>
                        <TabsTrigger value="spider-charts" data-testid="tab-spider-charts">Spider Charts</TabsTrigger>
                      </TabsList>

                      {/* Video Player Tab Content */}
                      <TabsContent value="video-player" className="mt-4">
                        <div className="aspect-video max-h-[320px] bg-black rounded-lg overflow-hidden">
                          {selectedFixture.hasVideo && selectedVideo?.url ? (
                            <div className="relative w-full h-full group cursor-pointer" onClick={() => handleWatchVideo(selectedFixture)}>
                              <video
                                src={`${selectedVideo.url}#t=0.1`}
                                preload="metadata"
                                className="w-full h-full object-cover"
                                data-testid="video-preview"
                              >
                                Your browser does not support the video tag.
                              </video>
                              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                <div className="bg-white/90 rounded-full p-4 group-hover:scale-110 transition-transform">
                                  <Play className="w-8 h-8 text-gray-900" />
                                </div>
                              </div>
                              {selectedVideo.label && (
                                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                                  {selectedVideo.label}
                                </div>
                              )}
                            </div>
                          ) : selectedFixture.hasVideo ? (
                            <div className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                              <div className="text-center">
                                <VideoIcon className="w-12 h-12 text-club-primary mx-auto mb-2" />
                                <p className="text-base font-medium text-green-800 mb-2">Video Ready</p>
                                <Button onClick={() => handleWatchVideo(selectedFixture)}>
                                  <Play className="w-4 h-4 mr-2" />
                                  Watch Full Match
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <div className="text-center">
                                <VideoIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-600">Video will be available after match</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      {/* Match Events Tab Content */}
                      <TabsContent value="match-events" className="mt-4">
                        <div className="p-6 border rounded-lg bg-muted/20 min-h-[400px] flex items-center justify-center">
                          <p className="text-muted-foreground">Match events timeline coming soon</p>
                        </div>
                      </TabsContent>

                      {/* Team Stats Tab Content */}
                      <TabsContent value="team-stats" className="mt-4">
                        {isLoadingStats ? (
                          <div className="p-6 border rounded-lg bg-muted/20 min-h-[400px] flex items-center justify-center">
                            <p className="text-muted-foreground">Loading statistics...</p>
                          </div>
                        ) : matchStats && matchStats.length > 0 ? (
                          <div className="space-y-3">
                            {matchStats.map((stat, idx) => (
                              <div key={idx} className="p-4 border rounded-lg bg-muted/20">
                                <h4 className="text-sm font-semibold mb-3">
                                  {stat.isTeamStats ? 'Team Stats' : 'Opponent Stats'} - {stat.period.replace('_', ' ')}
                                </h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  {stat.possession !== null && <div><span className="font-medium">Possession:</span> {stat.possession}%</div>}
                                  {stat.goals !== null && <div><span className="font-medium">Goals:</span> {stat.goals}</div>}
                                  {stat.shotsOnTarget !== null && <div><span className="font-medium">Shots on Target:</span> {stat.shotsOnTarget}</div>}
                                  {stat.shotsAttempted !== null && <div><span className="font-medium">Total Shots:</span> {stat.shotsAttempted}</div>}
                                  {stat.passingSuccessRate !== null && <div><span className="font-medium">Pass Accuracy:</span> {stat.passingSuccessRate}%</div>}
                                  {stat.tackles !== null && <div><span className="font-medium">Tackles:</span> {stat.tackles}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 border rounded-lg bg-muted/20 min-h-[400px] flex items-center justify-center">
                            <p className="text-muted-foreground">No statistics available for this match</p>
                          </div>
                        )}
                      </TabsContent>

                      {/* Spider Charts Tab Content */}
                      <TabsContent value="spider-charts" className="mt-4">
                        <div className="p-6 border rounded-lg bg-muted/20 min-h-[400px] flex items-center justify-center">
                          <p className="text-muted-foreground">Performance spider charts coming soon</p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Horizontal Scrolling Fixture Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">All Matches</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  title={sortOrder === 'asc' ? 'Sorted: Earliest First (click for Latest First)' : 'Sorted: Latest First (click for Earliest First)'}
                  data-testid="button-sort-matches"
                  className="h-8 px-2"
                >
                  {sortOrder === 'asc' ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={scrollLeft}
                  data-testid="button-scroll-left"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={scrollRight}
                  data-testid="button-scroll-right"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div 
              ref={scrollContainerRef}
              className="w-full whitespace-nowrap overflow-x-auto scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div className="flex gap-4 pb-4">
                {videoFixtures.map((fixture) => {
                  const opponent = oppositionTeams?.find(team => team.name === fixture.opponent);
                  const isSelected = selectedFixtureId === fixture.id;
                  
                  return (
                    <Card 
                      key={fixture.id}
                      className={`w-[320px] flex-shrink-0 cursor-pointer transition-all hover:shadow-lg ${
                        isSelected ? 'relative overflow-hidden group shadow-lg' : ''
                      }`}
                      onClick={() => setSelectedFixtureId(fixture.id)}
                      data-testid={`card-fixture-${fixture.id}`}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 rounded-lg border-2 border-red-500 animate-pulse pointer-events-none" />
                      )}
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          {opponent?.logoPath ? (
                            <img 
                              src={opponent.logoPath} 
                              alt={`${fixture.opponent} logo`}
                              className="w-12 h-12 object-contain"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">
                              {fixture.opponent.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">{fixture.opponent}</h4>
                            <p className="text-xs text-muted-foreground">{format(new Date(fixture.date), 'd MMM yyyy, h:mm a')}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          {getMatchBadge(fixture)}
                          <Badge className="bg-gray-100 text-gray-800 text-xs">
                            {fixture.type === 'HOME' ? 'Home' : 'Away'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tile Mode Layout - Grouped by Competition */}
      {viewMode === 'tile' && (
        <div className="mb-8">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading videos...</p>
            </div>
          ) : videoFixtures.length > 0 ? (
          (() => {
            // Group fixtures by competition
            const groupedFixtures = videoFixtures.reduce((groups, fixture) => {
              // Find the competition name from the enabledCompetitions list
              const competitionObj = enabledCompetitions.find(c => c.id === fixture.competitionId);
              const competition = competitionObj?.name || 'Other';
              if (!groups[competition]) {
                groups[competition] = [];
              }
              groups[competition].push(fixture);
              return groups;
            }, {} as Record<string, typeof videoFixtures>);

            // Sort each group by date (most recent first)
            Object.keys(groupedFixtures).forEach(competition => {
              groupedFixtures[competition].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            });

            // Sort competitions by most recent video available
            const sortedCompetitions = Object.entries(groupedFixtures).sort(([, fixturesA], [, fixturesB]) => {
              // Find the most recent video in each competition
              const mostRecentVideoA = fixturesA
                .filter(f => f.hasVideo)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
              
              const mostRecentVideoB = fixturesB
                .filter(f => f.hasVideo)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
              
              // If both have videos, sort by most recent video date
              if (mostRecentVideoA && mostRecentVideoB) {
                return new Date(mostRecentVideoB.date).getTime() - new Date(mostRecentVideoA.date).getTime();
              }
              
              // If only one has videos, that one comes first
              if (mostRecentVideoA && !mostRecentVideoB) return -1;
              if (!mostRecentVideoA && mostRecentVideoB) return 1;
              
              // If neither has videos, maintain original order
              return 0;
            });

            return sortedCompetitions.map(([competition, fixtures]) => (
              <div key={competition} className="mb-8">
                <div className="flex items-center mb-4">
                  <h3 className="text-lg font-semibold text-foreground">{competition}</h3>
                  <div className="ml-3 px-2 py-1 bg-muted rounded-full">
                    <span className="text-xs text-muted-foreground">{fixtures.length} matches</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {fixtures.map((fixture) => (
                    <Card 
                      key={fixture.id} 
                      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" 
                      data-testid={`card-video-${fixture.id}`}
                      onClick={() => handleWatchVideo(fixture)}
                    >
                      {/* Video Thumbnail */}
                      <div className="w-full h-48 bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                        {fixture.hasVideo ? (
                          <div className="text-center">
                            <VideoIcon className="w-12 h-12 text-club-primary mx-auto mb-2" />
                            <p className="text-sm font-medium text-green-800">Video Available</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <VideoIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Video will be available after match</p>
                          </div>
                        )}
                      </div>
                      
                      <CardContent className="p-4">
                        <div className="grid grid-cols-[80px_1fr_auto] gap-4 items-center">
                          {/* Column 1: Opponent Logo */}
                          <div className="flex justify-center">
                            {(() => {
                              const opponent = oppositionTeams?.find(team => team.name === fixture.opponent);
                              return opponent?.logoPath ? (
                                <img 
                                  src={opponent.logoPath} 
                                  alt={`${fixture.opponent} logo`}
                                  className="w-16 h-16 object-contain flex-shrink-0"
                                  onError={(e) => {
                                    // Fallback to initials if image fails to load
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null;
                            })()}
                            <div className={`w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                              oppositionTeams?.find(team => team.name === fixture.opponent)?.logoPath ? 'hidden' : ''
                            }`}>
                              {fixture.opponent.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                          </div>

                          {/* Column 2: Opponent Info */}
                          <div className="space-y-1">
                            {/* Row 1: Opponent Name */}
                            <h3 className="font-semibold text-foreground text-sm leading-tight">
                              {fixture.opponent}
                            </h3>
                            
                            {/* Row 2: Date and Time */}
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(fixture.date), 'd MMM yyyy, h:mm a')}
                            </p>
                            
                            {/* Row 3: Result Pill */}
                            <div>
                              {getMatchBadge(fixture)}
                            </div>
                          </div>

                          {/* Column 3: Home/Away Pill */}
                          <div className="flex justify-end">
                            <Badge className="bg-gray-100 text-gray-800">
                              {fixture.type === 'HOME' ? 'Home' : 'Away'}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Video Duration Info */}
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              {fixture.hasVideo ? (
                                <>
                                  <Clock className="w-3 h-3" />
                                  <span>Video Available</span>
                                </>
                              ) : (
                                <>
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    {fixture.status === 'SCHEDULED' 
                                      ? `In ${Math.ceil((new Date(fixture.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days`
                                      : 'Pending'
                                    }
                                  </span>
                                </>
                              )}
                            </div>
                            <Button 
                              size="sm" 
                              variant={fixture.hasVideo ? "default" : "outline"}
                              className="text-xs px-3 py-1 h-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWatchVideo(fixture);
                              }}
                            >
                              {fixture.hasVideo ? (
                                <>
                                  <Play className="w-3 h-3 mr-1" />
                                  Analyze
                                </>
                              ) : (
                                'View Match'
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ));
          })()
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No videos available</p>
          </div>
        )}
        </div>
      )}
    </MainLayout>
  );
}
