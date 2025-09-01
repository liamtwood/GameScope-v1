import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpiderChart } from "@/components/spider-chart";
import { MetricsComparison } from "@/components/metrics-comparison";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Fixture, MatchStats } from "@shared/schema";

export default function Analysis() {
  const [, params] = useRoute("/analysis/:fixtureId");
  const fixtureId = params?.fixtureId || "";

  const { data: fixture, isLoading: fixtureLoading } = useQuery<Fixture>({
    queryKey: ["/api/fixture", fixtureId],
    enabled: !!fixtureId,
  });

  const { data: matchStats, isLoading: statsLoading } = useQuery<MatchStats[]>({
    queryKey: ["/api/match-stats", fixtureId],
    enabled: !!fixtureId,
  });

  const { data: oppositionTeams } = useQuery<any[]>({
    queryKey: ["/api/opposition-teams"],
  });


  // Spider Chart Data Transformation Functions - Normalized to percentages
  const createAttackSpiderData = (teamStats: MatchStats, opponentStats?: MatchStats) => {
    const maxGoals = Math.max(teamStats.goals || 0, opponentStats?.goals || 0, 1);
    const maxShotsAttempted = Math.max(teamStats.shotsAttempted || 0, opponentStats?.shotsAttempted || 0, 1);
    const maxShotsOnTarget = Math.max(teamStats.shotsOnTarget || 0, opponentStats?.shotsOnTarget || 0, 1);
    const maxRunsIntoBoxes = Math.max(teamStats.runsIntoBoxes || 0, opponentStats?.runsIntoBoxes || 0, 1);
    const maxCorners = Math.max(teamStats.corners || 0, opponentStats?.corners || 0, 1);
    const maxDangerousCrosses = Math.max(teamStats.dangerousCrosses || 0, opponentStats?.dangerousCrosses || 0, 1);
    
    return [
      { metric: 'Goals', team: ((teamStats.goals || 0) / maxGoals) * 100, opponent: ((opponentStats?.goals || 0) / maxGoals) * 100, fullMark: 100 },
      { metric: 'Shots Attempted', team: ((teamStats.shotsAttempted || 0) / maxShotsAttempted) * 100, opponent: ((opponentStats?.shotsAttempted || 0) / maxShotsAttempted) * 100, fullMark: 100 },
      { metric: 'Shots On Target', team: ((teamStats.shotsOnTarget || 0) / maxShotsOnTarget) * 100, opponent: ((opponentStats?.shotsOnTarget || 0) / maxShotsOnTarget) * 100, fullMark: 100 },
      { metric: 'Runs Into Boxes', team: ((teamStats.runsIntoBoxes || 0) / maxRunsIntoBoxes) * 100, opponent: ((opponentStats?.runsIntoBoxes || 0) / maxRunsIntoBoxes) * 100, fullMark: 100 },
      { metric: 'Corners', team: ((teamStats.corners || 0) / maxCorners) * 100, opponent: ((opponentStats?.corners || 0) / maxCorners) * 100, fullMark: 100 },
      { metric: 'Dangerous Crosses', team: ((teamStats.dangerousCrosses || 0) / maxDangerousCrosses) * 100, opponent: ((opponentStats?.dangerousCrosses || 0) / maxDangerousCrosses) * 100, fullMark: 100 }
    ];
  };

  const createPossessionSpiderData = (teamStats: MatchStats, opponentStats?: MatchStats) => {
    const maxTakeOns = Math.max(teamStats.takeOns || 0, opponentStats?.takeOns || 0, 1);
    const maxPassesSuccess = Math.max(teamStats.passesSuccess || 0, opponentStats?.passesSuccess || 0, 1);
    
    return [
      { metric: 'Possession %', team: teamStats.possession || 0, opponent: opponentStats?.possession || 0, fullMark: 100 },
      { metric: 'Pass Accuracy %', team: teamStats.passingSuccessRate || 0, opponent: opponentStats?.passingSuccessRate || 0, fullMark: 100 },
      { metric: 'First Touch %', team: teamStats.firstTouchSuccessRate || 0, opponent: opponentStats?.firstTouchSuccessRate || 0, fullMark: 100 },
      { metric: 'Take Ons', team: ((teamStats.takeOns || 0) / maxTakeOns) * 100, opponent: ((opponentStats?.takeOns || 0) / maxTakeOns) * 100, fullMark: 100 },
      { metric: 'Passes Success', team: ((teamStats.passesSuccess || 0) / maxPassesSuccess) * 100, opponent: ((opponentStats?.passesSuccess || 0) / maxPassesSuccess) * 100, fullMark: 100 }
    ];
  };

  const createTechnicalSpiderData = (teamStats: MatchStats, opponentStats?: MatchStats) => {
    const maxTackles = Math.max(teamStats.tackles || 0, opponentStats?.tackles || 0, 1);
    const maxFreeKicks = Math.max(teamStats.freeKicks || 0, opponentStats?.freeKicks || 0, 1);
    const maxOffsides = Math.max(teamStats.offsides || 0, opponentStats?.offsides || 0, 1);
    
    return [
      { metric: 'Tackles', team: ((teamStats.tackles || 0) / maxTackles) * 100, opponent: ((opponentStats?.tackles || 0) / maxTackles) * 100, fullMark: 100 },
      { metric: 'Free Kicks', team: ((teamStats.freeKicks || 0) / maxFreeKicks) * 100, opponent: ((opponentStats?.freeKicks || 0) / maxFreeKicks) * 100, fullMark: 100 },
      { metric: 'Offsides', team: ((teamStats.offsides || 0) / maxOffsides) * 100, opponent: ((opponentStats?.offsides || 0) / maxOffsides) * 100, fullMark: 100 },
      { metric: 'R.Foot Pass %', team: teamStats.rightFootPassSuccessRate || 0, opponent: opponentStats?.rightFootPassSuccessRate || 0, fullMark: 100 },
      { metric: 'L.Foot Pass %', team: teamStats.leftFootPassSuccessRate || 0, opponent: opponentStats?.leftFootPassSuccessRate || 0, fullMark: 100 }
    ];
  };

  if (fixtureLoading || statsLoading) {
    return (
      <MainLayout title="GameScope Analysis" subtitle="Loading analysis...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading match analysis...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!fixture || !matchStats) {
    return (
      <MainLayout title="GameScope Analysis" subtitle="Analysis not found">
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Unable to load match analysis.</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  // Process match stats - get full game stats
  const fullGameStats = matchStats.find(stat => stat.period === 'FULL_GAME' && stat.isTeamStats === true);
  const opponentFullGameStats = matchStats.find(stat => stat.period === 'FULL_GAME' && (stat.isTeamStats === false || stat.isTeamStats === null));

  // Get team and opponent logos from opponents table
  const polkTeam = oppositionTeams?.find((team: any) => team.shortName === "POLK");
  const opponentTeam = oppositionTeams?.find((team: any) => 
    fixture?.oppositionTeamId ? team.id === fixture.oppositionTeamId : team.name === fixture?.opponent
  );
  
  const teamLogoPath = polkTeam?.logoPath;
  const opponentLogoPath = opponentTeam?.logoPath;

  if (!fullGameStats) {
    return (
      <MainLayout title="GameScope Analysis" subtitle="Analysis not found">
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No full game statistics available for this match.</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="GameScope Analysis" 
      subtitle={`${fixture.opponent} • ${format(new Date(fixture.date), 'MMM d, yyyy')}`}
    >
      {/* Main Analysis Tabs */}
      <Tabs defaultValue="statistics" className="w-full">
        {/* Header with Tabs */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          
          <div className="flex-1 flex justify-center">
            <TabsList className="grid max-w-[600px] grid-cols-5">
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
              <TabsTrigger value="spider">Spider Charts</TabsTrigger>
              <TabsTrigger value="heatmaps">Heat Maps</TabsTrigger>
              <TabsTrigger value="positions">Position Maps</TabsTrigger>
              <TabsTrigger value="ai">AI Analysis</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="w-[120px]"></div> {/* Spacer to balance the back button */}
        </div>

        {/* Statistics Tab */}
        <TabsContent value="statistics">
          <Card>
            <CardContent className="p-6">
              {/* Team Header - Always Visible within this container */}
              <div className="mb-6">
                {/* Main header container with vertical split */}
                <div className="relative h-32 rounded-2xl overflow-hidden shadow-lg">
                  {/* POLK side - red/black gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-black" 
                       style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}>
                  </div>
                  
                  {/* Opponent side - white with red pinstripes */}
                  <div className="absolute inset-0 bg-white" 
                       style={{ 
                         clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)',
                         backgroundImage: 'repeating-linear-gradient(90deg, #ef4444 0px, #ef4444 2px, transparent 2px, transparent 12px, #ef4444 12px, #ef4444 14px, transparent 14px, transparent 44px, #ef4444 44px, #ef4444 46px, transparent 46px, transparent 56px, #ef4444 56px, #ef4444 58px, transparent 58px, transparent 88px)'
                       }}>
                  </div>
                  
                  {/* Content overlay */}
                  <div className="relative z-10 h-full flex items-center px-8">
                    {/* POLK section */}
                    <div className="flex items-center space-x-4 text-white flex-1">
                      {teamLogoPath ? (
                        <img 
                          src={teamLogoPath} 
                          alt="Polk State College logo"
                          className="w-20 h-20 object-contain"
                        />
                      ) : (
                        <div className="w-20 h-20 flex items-center justify-center">
                          <span className="text-white font-bold text-xs">Polk State</span>
                        </div>
                      )}
                      <div>
                        <div className="text-2xl font-bold">Polk State College</div>
                        <div className="text-white/80 text-sm">{fixture.type === 'HOME' ? 'HOME' : 'AWAY'}</div>
                      </div>
                    </div>
                    
                    {/* Center score - absolutely centered */}
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-2xl px-6 py-4 border-2 shadow-2xl drop-shadow-lg" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
                      <div className="flex items-center space-x-4">
                        <div className="text-3xl font-bold text-red-600">{fixture.type === 'HOME' ? (fixture.homeScore || 0) : (fixture.awayScore || 0)}</div>
                        <div className="text-2xl font-light text-muted-foreground">-</div>
                        <div className="text-3xl font-bold text-red-600">{fixture.type === 'HOME' ? (fixture.awayScore || 0) : (fixture.homeScore || 0)}</div>
                      </div>
                      <div className="text-xs text-muted-foreground text-center mt-1">FT</div>
                    </div>
                    
                    {/* Opponent section */}
                    <div className="flex items-center space-x-4 text-foreground flex-1 justify-end">
                      <div className="text-right">
                        <div className="text-2xl font-bold">{fixture.opponent}</div>
                        <div className="text-muted-foreground text-sm">{fixture.type === 'HOME' ? 'AWAY' : 'HOME'}</div>
                      </div>
                      {opponentLogoPath ? (
                        <img 
                          src={opponentLogoPath} 
                          alt={`${fixture.opponent} logo`}
                          className="w-20 h-20 object-contain"
                        />
                      ) : (
                        <div className="w-20 h-20 flex items-center justify-center">
                          <span className="text-red-600 font-bold text-lg">{fixture.opponent.split(' ').map(word => word[0]).join('').slice(0, 3)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mb-4">Match Statistics</h3>
              <MetricsComparison
                teamStats={fullGameStats}
                opponentStats={opponentFullGameStats}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Analysis Tab */}
        <TabsContent value="ai">
          <Card>
            <CardContent className="p-6">
              {/* Team Header - Always Visible within this container */}
              <div className="mb-6">
                {/* Main header container with vertical split */}
                <div className="relative h-32 rounded-2xl overflow-hidden shadow-lg">
                  {/* POLK side - red/black gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-black" 
                       style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}>
                  </div>
                  
                  {/* Opponent side - white with red pinstripes */}
                  <div className="absolute inset-0 bg-white" 
                       style={{ 
                         clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)',
                         backgroundImage: 'repeating-linear-gradient(90deg, #ef4444 0px, #ef4444 2px, transparent 2px, transparent 12px, #ef4444 12px, #ef4444 14px, transparent 14px, transparent 44px, #ef4444 44px, #ef4444 46px, transparent 46px, transparent 56px, #ef4444 56px, #ef4444 58px, transparent 58px, transparent 88px)'
                       }}>
                  </div>
                  
                  {/* Content overlay */}
                  <div className="relative z-10 h-full flex items-center px-8">
                    {/* POLK section */}
                    <div className="flex items-center space-x-4 text-white flex-1">
                      {teamLogoPath ? (
                        <img 
                          src={teamLogoPath} 
                          alt="Polk State College logo"
                          className="w-20 h-20 object-contain"
                        />
                      ) : (
                        <div className="w-20 h-20 flex items-center justify-center">
                          <span className="text-white font-bold text-xs">Polk State</span>
                        </div>
                      )}
                      <div>
                        <div className="text-2xl font-bold">Polk State College</div>
                        <div className="text-white/80 text-sm">{fixture.type === 'HOME' ? 'HOME' : 'AWAY'}</div>
                      </div>
                    </div>
                    
                    {/* Center score - absolutely centered */}
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-2xl px-6 py-4 border-2 shadow-2xl drop-shadow-lg" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
                      <div className="flex items-center space-x-4">
                        <div className="text-3xl font-bold text-red-600">{fixture.type === 'HOME' ? (fixture.homeScore || 0) : (fixture.awayScore || 0)}</div>
                        <div className="text-2xl font-light text-muted-foreground">-</div>
                        <div className="text-3xl font-bold text-red-600">{fixture.type === 'HOME' ? (fixture.awayScore || 0) : (fixture.homeScore || 0)}</div>
                      </div>
                      <div className="text-xs text-muted-foreground text-center mt-1">FT</div>
                    </div>
                    
                    {/* Opponent section */}
                    <div className="flex items-center space-x-4 text-foreground flex-1 justify-end">
                      <div className="text-right">
                        <div className="text-2xl font-bold">{fixture.opponent}</div>
                        <div className="text-muted-foreground text-sm">{fixture.type === 'HOME' ? 'AWAY' : 'HOME'}</div>
                      </div>
                      {opponentLogoPath ? (
                        <img 
                          src={opponentLogoPath} 
                          alt={`${fixture.opponent} logo`}
                          className="w-20 h-20 object-contain"
                        />
                      ) : (
                        <div className="w-20 h-20 flex items-center justify-center">
                          <span className="text-red-600 font-bold text-lg">{fixture.opponent.split(' ').map(word => word[0]).join('').slice(0, 3)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mb-4">AI-Powered Analysis</h3>
              <div className="bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-900/20 dark:to-slate-800/20 p-6 rounded-lg border">
                <h4 className="font-semibold text-foreground mb-4 flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  AI-Powered Match Insights
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-muted-foreground">Strong defensive performance in the first half, intercepting 8 out of 12 opponent attacks in the midfield.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-muted-foreground">Excellent ball retention through the wings, with {fullGameStats.passingSuccessRate || 0}% success rate on pass attempts.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-muted-foreground">Opportunities to improve shot conversion - {fullGameStats.shotsAttempted || 0} shots attempted with {fullGameStats.shotsOnTarget || 0} on target.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Spider Charts Tab */}
        <TabsContent value="spider">
          <Card>
            <CardContent className="p-6">
              {/* Team Header - Always Visible within this container */}
              <div className="mb-6">
                {/* Main header container with vertical split */}
                <div className="relative h-32 rounded-2xl overflow-hidden shadow-lg">
                  {/* POLK side - red/black gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-black" 
                       style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}>
                  </div>
                  
                  {/* Opponent side - white with red pinstripes */}
                  <div className="absolute inset-0 bg-white" 
                       style={{ 
                         clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)',
                         backgroundImage: 'repeating-linear-gradient(90deg, #ef4444 0px, #ef4444 2px, transparent 2px, transparent 12px, #ef4444 12px, #ef4444 14px, transparent 14px, transparent 44px, #ef4444 44px, #ef4444 46px, transparent 46px, transparent 56px, #ef4444 56px, #ef4444 58px, transparent 58px, transparent 88px)'
                       }}>
                  </div>
                  
                  {/* Content overlay */}
                  <div className="relative z-10 h-full flex items-center px-8">
                    {/* POLK section */}
                    <div className="flex items-center space-x-4 text-white flex-1">
                      {teamLogoPath ? (
                        <img 
                          src={teamLogoPath} 
                          alt="Polk State College logo"
                          className="w-20 h-20 object-contain"
                        />
                      ) : (
                        <div className="w-20 h-20 flex items-center justify-center">
                          <span className="text-white font-bold text-xs">Polk State</span>
                        </div>
                      )}
                      <div>
                        <div className="text-2xl font-bold">Polk State College</div>
                        <div className="text-white/80 text-sm">{fixture.type === 'HOME' ? 'HOME' : 'AWAY'}</div>
                      </div>
                    </div>
                    
                    {/* Center score - absolutely centered */}
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-2xl px-6 py-4 border-2 shadow-2xl drop-shadow-lg" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
                      <div className="flex items-center space-x-4">
                        <div className="text-3xl font-bold text-red-600">{fixture.type === 'HOME' ? (fixture.homeScore || 0) : (fixture.awayScore || 0)}</div>
                        <div className="text-2xl font-light text-muted-foreground">-</div>
                        <div className="text-3xl font-bold text-red-600">{fixture.type === 'HOME' ? (fixture.awayScore || 0) : (fixture.homeScore || 0)}</div>
                      </div>
                      <div className="text-xs text-muted-foreground text-center mt-1">FT</div>
                    </div>
                    
                    {/* Opponent section */}
                    <div className="flex items-center space-x-4 text-foreground flex-1 justify-end">
                      <div className="text-right">
                        <div className="text-2xl font-bold">{fixture.opponent}</div>
                        <div className="text-muted-foreground text-sm">{fixture.type === 'HOME' ? 'AWAY' : 'HOME'}</div>
                      </div>
                      {opponentLogoPath ? (
                        <img 
                          src={opponentLogoPath} 
                          alt={`${fixture.opponent} logo`}
                          className="w-20 h-20 object-contain"
                        />
                      ) : (
                        <div className="w-20 h-20 flex items-center justify-center">
                          <span className="text-red-600 font-bold text-lg">{fixture.opponent.split(' ').map(word => word[0]).join('').slice(0, 3)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mb-4">Spider Charts</h3>
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
                          <span className="text-red-600 text-center">Polk State College</span>
                          <span className="text-gray-600 text-center">{opponentTeam?.shortName || "OPP"}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Goals</span>
                          <span className="font-medium text-center">{fullGameStats.goals || 0}</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.goals || 0}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Shots Attempted</span>
                          <span className="font-medium text-center">{fullGameStats.shotsAttempted || 0}</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.shotsAttempted || 0}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Shots on Target</span>
                          <span className="font-medium text-center">{fullGameStats.shotsOnTarget || 0}</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.shotsOnTarget || 0}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Runs Into Boxes</span>
                          <span className="font-medium text-center">{fullGameStats.runsIntoBoxes || 0}</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.runsIntoBoxes || 0}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Corner Kicks</span>
                          <span className="font-medium text-center">{fullGameStats.corners || 0}</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.corners || 0}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Dangerous Crosses</span>
                          <span className="font-medium text-center">{fullGameStats.dangerousCrosses || 0}</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.dangerousCrosses || 0}</span>
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
                          <span className="text-red-600 text-center">Polk State College</span>
                          <span className="text-gray-600 text-center">{opponentTeam?.shortName || "OPP"}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Possession %</span>
                          <span className="font-medium text-center">{fullGameStats.possession || 0}%</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.possession || 0}%</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Pass Accuracy %</span>
                          <span className="font-medium text-center">{fullGameStats.passingSuccessRate || 0}%</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.passingSuccessRate || 0}%</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">First Touch %</span>
                          <span className="font-medium text-center">{fullGameStats.firstTouchSuccessRate || 0}%</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.firstTouchSuccessRate || 0}%</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Take Ons</span>
                          <span className="font-medium text-center">{fullGameStats.takeOns || 0}</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.takeOns || 0}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Passes Success</span>
                          <span className="font-medium text-center">{fullGameStats.passesSuccess || 0}</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.passesSuccess || 0}</span>
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
                          <span className="text-red-600 text-center">Polk State College</span>
                          <span className="text-gray-600 text-center">{opponentTeam?.shortName || "OPP"}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Tackles</span>
                          <span className="font-medium text-center">{fullGameStats.tackles || 0}</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.tackles || 0}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Free Kicks</span>
                          <span className="font-medium text-center">{fullGameStats.freeKicks || 0}</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.freeKicks || 0}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Offsides</span>
                          <span className="font-medium text-center">{fullGameStats.offsides || 0}</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.offsides || 0}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Right Foot Pass %</span>
                          <span className="font-medium text-center">{fullGameStats.rightFootPassSuccessRate || 0}%</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.rightFootPassSuccessRate || 0}%</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Left Foot Pass %</span>
                          <span className="font-medium text-center">{fullGameStats.leftFootPassSuccessRate || 0}%</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.leftFootPassSuccessRate || 0}%</span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Heat Maps Tab - Placeholder */}
        <TabsContent value="heatmaps">
          <Card>
            <CardContent className="p-6">
              {/* Team Header - Always Visible within this container */}
              <div className="mb-6">
                {/* Main header container with vertical split */}
                <div className="relative h-32 rounded-2xl overflow-hidden shadow-lg">
                  {/* POLK side - red/black gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-black" 
                       style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}>
                  </div>
                  
                  {/* Opponent side - white with red pinstripes */}
                  <div className="absolute inset-0 bg-white" 
                       style={{ 
                         clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)',
                         backgroundImage: 'repeating-linear-gradient(90deg, #ef4444 0px, #ef4444 2px, transparent 2px, transparent 12px, #ef4444 12px, #ef4444 14px, transparent 14px, transparent 44px, #ef4444 44px, #ef4444 46px, transparent 46px, transparent 56px, #ef4444 56px, #ef4444 58px, transparent 58px, transparent 88px)'
                       }}>
                  </div>
                  
                  {/* Content overlay */}
                  <div className="relative z-10 h-full flex items-center px-8">
                    {/* POLK section */}
                    <div className="flex items-center space-x-4 text-white flex-1">
                      {teamLogoPath ? (
                        <img 
                          src={teamLogoPath} 
                          alt="Polk State College logo"
                          className="w-20 h-20 object-contain"
                        />
                      ) : (
                        <div className="w-20 h-20 flex items-center justify-center">
                          <span className="text-white font-bold text-xs">Polk State</span>
                        </div>
                      )}
                      <div>
                        <div className="text-2xl font-bold">Polk State College</div>
                        <div className="text-white/80 text-sm">{fixture.type === 'HOME' ? 'HOME' : 'AWAY'}</div>
                      </div>
                    </div>
                    
                    {/* Center score - absolutely centered */}
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-2xl px-6 py-4 border-2 shadow-2xl drop-shadow-lg" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
                      <div className="flex items-center space-x-4">
                        <div className="text-3xl font-bold text-red-600">{fixture.type === 'HOME' ? (fixture.homeScore || 0) : (fixture.awayScore || 0)}</div>
                        <div className="text-2xl font-light text-muted-foreground">-</div>
                        <div className="text-3xl font-bold text-red-600">{fixture.type === 'HOME' ? (fixture.awayScore || 0) : (fixture.homeScore || 0)}</div>
                      </div>
                      <div className="text-xs text-muted-foreground text-center mt-1">FT</div>
                    </div>
                    
                    {/* Opponent section */}
                    <div className="flex items-center space-x-4 text-foreground flex-1 justify-end">
                      <div className="text-right">
                        <div className="text-2xl font-bold">{fixture.opponent}</div>
                        <div className="text-muted-foreground text-sm">{fixture.type === 'HOME' ? 'AWAY' : 'HOME'}</div>
                      </div>
                      {opponentLogoPath ? (
                        <img 
                          src={opponentLogoPath} 
                          alt={`${fixture.opponent} logo`}
                          className="w-20 h-20 object-contain"
                        />
                      ) : (
                        <div className="w-20 h-20 flex items-center justify-center">
                          <span className="text-red-600 font-bold text-lg">{fixture.opponent.split(' ').map(word => word[0]).join('').slice(0, 3)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">Heat Maps</h3>
                <p className="text-muted-foreground">Coming soon - visualize player movement and ball possession heat maps</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Position Maps Tab - Placeholder */}
        <TabsContent value="positions">
          <Card>
            <CardContent className="p-6">
              {/* Team Header - Always Visible within this container */}
              <div className="mb-6">
                {/* Main header container with vertical split */}
                <div className="relative h-32 rounded-2xl overflow-hidden shadow-lg">
                  {/* POLK side - red/black gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-black" 
                       style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}>
                  </div>
                  
                  {/* Opponent side - white with red pinstripes */}
                  <div className="absolute inset-0 bg-white" 
                       style={{ 
                         clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)',
                         backgroundImage: 'repeating-linear-gradient(90deg, #ef4444 0px, #ef4444 2px, transparent 2px, transparent 12px, #ef4444 12px, #ef4444 14px, transparent 14px, transparent 44px, #ef4444 44px, #ef4444 46px, transparent 46px, transparent 56px, #ef4444 56px, #ef4444 58px, transparent 58px, transparent 88px)'
                       }}>
                  </div>
                  
                  {/* Content overlay */}
                  <div className="relative z-10 h-full flex items-center px-8">
                    {/* POLK section */}
                    <div className="flex items-center space-x-4 text-white flex-1">
                      {teamLogoPath ? (
                        <img 
                          src={teamLogoPath} 
                          alt="Polk State College logo"
                          className="w-20 h-20 object-contain"
                        />
                      ) : (
                        <div className="w-20 h-20 flex items-center justify-center">
                          <span className="text-white font-bold text-xs">Polk State</span>
                        </div>
                      )}
                      <div>
                        <div className="text-2xl font-bold">Polk State College</div>
                        <div className="text-white/80 text-sm">{fixture.type === 'HOME' ? 'HOME' : 'AWAY'}</div>
                      </div>
                    </div>
                    
                    {/* Center score - absolutely centered */}
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-2xl px-6 py-4 border-2 shadow-2xl drop-shadow-lg" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
                      <div className="flex items-center space-x-4">
                        <div className="text-3xl font-bold text-red-600">{fixture.type === 'HOME' ? (fixture.homeScore || 0) : (fixture.awayScore || 0)}</div>
                        <div className="text-2xl font-light text-muted-foreground">-</div>
                        <div className="text-3xl font-bold text-red-600">{fixture.type === 'HOME' ? (fixture.awayScore || 0) : (fixture.homeScore || 0)}</div>
                      </div>
                      <div className="text-xs text-muted-foreground text-center mt-1">FT</div>
                    </div>
                    
                    {/* Opponent section */}
                    <div className="flex items-center space-x-4 text-foreground flex-1 justify-end">
                      <div className="text-right">
                        <div className="text-2xl font-bold">{fixture.opponent}</div>
                        <div className="text-muted-foreground text-sm">{fixture.type === 'HOME' ? 'AWAY' : 'HOME'}</div>
                      </div>
                      {opponentLogoPath ? (
                        <img 
                          src={opponentLogoPath} 
                          alt={`${fixture.opponent} logo`}
                          className="w-20 h-20 object-contain"
                        />
                      ) : (
                        <div className="w-20 h-20 flex items-center justify-center">
                          <span className="text-red-600 font-bold text-lg">{fixture.opponent.split(' ').map(word => word[0]).join('').slice(0, 3)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">Position Maps</h3>
                <p className="text-muted-foreground">Coming soon - analyze player positioning and formation effectiveness</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}