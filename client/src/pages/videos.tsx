import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Share, Clock, Calendar, Video as VideoIcon, Image, Blocks, TvMinimalPlay, Camera, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ExternalLink, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Fixture, Team, OppositionTeam, VideoLink, Competition } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useTeam } from "@/contexts/team-context";
import { VideoAnalysisDashboard } from "@/components/video-analysis-dashboard";
import { MatchScoreBanner } from "@/components/match-score-banner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type VideoFilter = 'all' | 'recent' | 'analyzed';
type ViewMode = 'tile' | 'watch';

export default function Videos() {
  const [activeFilter, setActiveFilter] = useState<VideoFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('tile');
  const [selectedFixtureId, setSelectedFixtureId] = useState<string | null>(null);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
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

  const { data: clubs } = useQuery<{ id: string; name: string; logoPath: string | null }[]>({ 
    queryKey: ["/api/clubs"] 
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
      
      // Filter by keyword if one is entered (search opponent name)
      const keyword = searchKeyword.trim().toLowerCase();
      const matchesKeyword = !keyword || f.opponent.toLowerCase().includes(keyword);
      
      // Include only matches that occurred before tomorrow and match all filters
      return isBeforeTomorrow && hasVideoOrRelevant && matchesCompetition && matchesKeyword;
    }) || [];
    
    // Sort by date based on sort order
    return filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [fixtures, selectedCompetitionId, searchKeyword, sortOrder]);

  // Memoized selected fixture
  const selectedFixture = useMemo(() => {
    if (!selectedFixtureId) {
      return videoFixtures[0] || null;
    }
    return videoFixtures.find(f => f.id === selectedFixtureId) || videoFixtures[0] || null;
  }, [videoFixtures, selectedFixtureId]);

  // Get the first video from the selected fixture for preview
  const selectedVideo = useMemo(() => {
    if (!selectedFixture?.videoLinks || !Array.isArray(selectedFixture.videoLinks)) {
      return null;
    }
    const links = selectedFixture.videoLinks as VideoLink[];
    return links[0] || null;
  }, [selectedFixture]);

  const handleWatchVideo = (fixture: Fixture) => {
    // Navigate to the watch match video page
    setLocation(`/watch-match-video?fixtureId=${fixture.id}`);
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
          
          {/* Keyword Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search opponent..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-9 w-[200px]"
              data-testid="input-search-keyword"
            />
          </div>
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

                  {/* Right Column: Video Preview (60%) */}
                  <div className="flex-1 md:w-3/5">
                    {/* Video Preview */}
                    <div className="aspect-video max-h-[320px] bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 rounded-lg overflow-hidden">
                          {selectedFixture.hasVideo && selectedVideo?.url ? (
                            <div className="relative w-full h-full group cursor-pointer" onClick={() => handleWatchVideo(selectedFixture)}>
                              {/* Match Preview with Logos and Score */}
                              <div className="w-full h-full flex items-center justify-between px-12">
                                {/* Home Team */}
                                <div className="flex flex-col items-center gap-2">
                                  {(() => {
                                    const club = clubs?.find(c => c.id === currentTeam?.clubId);
                                    return club?.logoPath ? (
                                      <img 
                                        src={club.logoPath} 
                                        alt="Club logo"
                                        className="w-20 h-20 object-contain"
                                        data-testid="img-club-logo-preview"
                                      />
                                    ) : (
                                      <div className="w-20 h-20 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full flex items-center justify-center text-2xl font-bold">
                                        {currentTeam?.name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase() || 'HM'}
                                      </div>
                                    );
                                  })()}
                                  <p className="text-sm font-medium text-center">{currentTeam?.name || 'Home'}</p>
                                </div>

                                {/* Score & Play Button */}
                                <div className="flex flex-col items-center gap-3">
                                  {selectedFixture.status === 'COMPLETED' ? (
                                    <div className="text-4xl font-bold">
                                      {selectedFixture.type === 'HOME' 
                                        ? `${selectedFixture.homeScore ?? '-'} - ${selectedFixture.awayScore ?? '-'}`
                                        : `${selectedFixture.awayScore ?? '-'} - ${selectedFixture.homeScore ?? '-'}`
                                      }
                                    </div>
                                  ) : (
                                    <div className="text-lg font-semibold text-muted-foreground">
                                      {format(new Date(selectedFixture.date), 'MMM d, yyyy')}
                                    </div>
                                  )}
                                  <div className="bg-white/90 dark:bg-gray-900/90 rounded-full p-4 group-hover:scale-110 group-hover:bg-white dark:group-hover:bg-gray-800 transition-all">
                                    <Play className="w-8 h-8 text-gray-900 dark:text-white" />
                                  </div>
                                  {selectedVideo.label && (
                                    <p className="text-xs text-muted-foreground">{selectedVideo.label}</p>
                                  )}
                                </div>

                                {/* Opposition Team */}
                                <div className="flex flex-col items-center gap-2">
                                  {(() => {
                                    const opponent = oppositionTeams?.find(team => team.name === selectedFixture.opponent);
                                    return opponent?.logoPath ? (
                                      <img 
                                        src={opponent.logoPath} 
                                        alt={`${selectedFixture.opponent} logo`}
                                        className="w-20 h-20 object-contain"
                                        data-testid="img-opponent-logo-preview"
                                      />
                                    ) : (
                                      <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center text-2xl font-bold">
                                        {selectedFixture.opponent.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
                                      </div>
                                    );
                                  })()}
                                  <p className="text-sm font-medium text-center">{selectedFixture.opponent}</p>
                                </div>
                              </div>
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
                      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group" 
                      data-testid={`card-video-${fixture.id}`}
                      onClick={() => handleWatchVideo(fixture)}
                    >
                      {/* Video Preview with Logos and Score */}
                      <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 flex items-center justify-between px-6">
                        {/* Club Logo */}
                        <div className="flex flex-col items-center gap-1">
                          {(() => {
                            const club = clubs?.find(c => c.id === currentTeam?.clubId);
                            return club?.logoPath ? (
                              <img 
                                src={club.logoPath} 
                                alt="Club logo"
                                className="w-14 h-14 object-contain"
                              />
                            ) : (
                              <div className="w-14 h-14 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full flex items-center justify-center text-lg font-bold">
                                {currentTeam?.name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase() || 'HM'}
                              </div>
                            );
                          })()}
                          <p className="text-xs font-medium text-center max-w-[70px] truncate">{currentTeam?.name || 'Home'}</p>
                        </div>

                        {/* Score & Play Button */}
                        <div className="flex flex-col items-center gap-2">
                          {fixture.status === 'COMPLETED' ? (
                            <div className="text-2xl font-bold">
                              {fixture.type === 'HOME' 
                                ? `${fixture.homeScore ?? '-'} - ${fixture.awayScore ?? '-'}`
                                : `${fixture.awayScore ?? '-'} - ${fixture.homeScore ?? '-'}`
                              }
                            </div>
                          ) : (
                            <div className="text-sm font-medium text-muted-foreground">
                              {format(new Date(fixture.date), 'MMM d')}
                            </div>
                          )}
                          <div className="bg-white/90 dark:bg-gray-900/90 rounded-full p-3 group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 text-gray-900 dark:text-white" />
                          </div>
                          {!fixture.hasVideo && (
                            <p className="text-xs text-muted-foreground">No video</p>
                          )}
                        </div>

                        {/* Opposition Team */}
                        <div className="flex flex-col items-center gap-1">
                          {(() => {
                            const opponent = oppositionTeams?.find(team => team.name === fixture.opponent);
                            return opponent?.logoPath ? (
                              <img 
                                src={opponent.logoPath} 
                                alt={`${fixture.opponent} logo`}
                                className="w-14 h-14 object-contain"
                              />
                            ) : (
                              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center text-lg font-bold">
                                {fixture.opponent.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                            );
                          })()}
                          <p className="text-xs font-medium text-center max-w-[70px] truncate">{fixture.opponent}</p>
                        </div>
                      </div>
                      
                      <CardContent className="p-3">
                        {/* Match Info */}
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {format(new Date(fixture.date), 'd MMM yyyy, h:mm a')}
                          </p>
                          <Badge className="bg-gray-100 text-gray-800 text-xs">
                            {fixture.type === 'HOME' ? 'Home' : 'Away'}
                          </Badge>
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
