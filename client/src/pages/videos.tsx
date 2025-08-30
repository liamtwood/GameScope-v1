import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Share, Clock, Calendar, Video as VideoIcon } from "lucide-react";
import { Fixture, Team, OppositionTeam } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

type VideoFilter = 'all' | 'recent' | 'analyzed';

export default function Videos() {
  const [activeFilter, setActiveFilter] = useState<VideoFilter>('all');
  const { toast } = useToast();

  const { data: teams } = useQuery<Team[]>({ queryKey: ["/api/teams"] });
  const currentTeam = teams?.[0]; // For demo, use first team

  const { data: fixtures, isLoading } = useQuery<Fixture[]>({ 
    queryKey: ["/api/fixtures", currentTeam?.id],
    enabled: !!currentTeam?.id 
  });

  const { data: oppositionTeams } = useQuery<OppositionTeam[]>({ 
    queryKey: ["/api/opposition-teams"] 
  });

  // Only show matches that have occurred before tomorrow
  const videoFixtures = fixtures?.filter(f => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Start of tomorrow
    const matchDate = new Date(f.date);
    
    const isBeforeTomorrow = matchDate < tomorrow;
    const hasVideoOrRelevant = f.hasVideo || f.status === 'SCHEDULED' || f.status === 'COMPLETED' || f.status === 'NO_CONTEST';
    
    // Include only matches that occurred before tomorrow
    return isBeforeTomorrow && hasVideoOrRelevant;
  }) || [];

  const handleWatchVideo = (fixture: Fixture) => {
    toast({
      title: "Playing Video",
      description: `Playing video for ${fixture.opponent}`,
    });
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

  const filterButtons = [
    { id: 'all' as const, label: 'All Videos' },
    { id: 'recent' as const, label: 'Recent' },
    { id: 'analyzed' as const, label: 'Analyzed' },
  ];

  return (
    <MainLayout 
      title="Match Videos" 
      subtitle="Video analysis and match recordings"
    >
      {/* Video Filter */}
      <div className="mb-6 flex bg-muted rounded-lg p-1 w-fit">
        {filterButtons.map((filter) => (
          <Button
            key={filter.id}
            variant={activeFilter === filter.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter(filter.id)}
            className={activeFilter === filter.id ? "bg-background text-foreground shadow-sm" : ""}
            data-testid={`button-filter-${filter.id}`}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Video Gallery - Grouped by Competition */}
      <div className="mb-8">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading videos...</p>
          </div>
        ) : videoFixtures.length > 0 ? (
          (() => {
            // Group fixtures by competition
            const groupedFixtures = videoFixtures.reduce((groups, fixture) => {
              const competition = fixture.competition || 'Other';
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

            return Object.entries(groupedFixtures).map(([competition, fixtures]) => (
              <div key={competition} className="mb-8">
                <div className="flex items-center mb-4">
                  <h3 className="text-lg font-semibold text-foreground">{competition}</h3>
                  <div className="ml-3 px-2 py-1 bg-muted rounded-full">
                    <span className="text-xs text-muted-foreground">{fixtures.length} matches</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {fixtures.map((fixture) => (
                    <Card key={fixture.id} className="overflow-hidden" data-testid={`card-video-${fixture.id}`}>
                      {/* Video Thumbnail */}
                      <div className="w-full h-48 bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                        {fixture.hasVideo ? (
                          <div className="text-center">
                            <VideoIcon className="w-12 h-12 text-green-600 mx-auto mb-2" />
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
                              {new Date(fixture.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}, {new Date(fixture.date).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
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
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            {fixture.hasVideo ? (
                              <>
                                <Clock className="w-3 h-3" />
                                <span>90 min</span>
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

      {/* Video Analytics Summary */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Video Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                <VideoIcon className="text-xl" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {videoFixtures.filter(f => f.hasVideo).length}
              </p>
              <p className="text-sm text-muted-foreground">Videos Available</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                <Clock className="text-xl" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {videoFixtures.filter(f => f.hasVideo).length * 90}
              </p>
              <p className="text-sm text-muted-foreground">Total Minutes</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                <Play className="text-xl" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {Math.floor(Math.random() * 100) + 1}
              </p>
              <p className="text-sm text-muted-foreground">Total Views</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
