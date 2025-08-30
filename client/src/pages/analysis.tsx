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

  // Spider Chart Data Transformation Functions (matching fixture details)
  const createAttackSpiderData = (teamStats: MatchStats, opponentStats?: MatchStats) => [
    { metric: 'Goals', team: teamStats.goals || 0, opponent: opponentStats?.goals || 0, fullMark: Math.max(10, (teamStats.goals || 0) * 2, (opponentStats?.goals || 0) * 2) },
    { metric: 'Shots Attempted', team: teamStats.shotsAttempted || 0, opponent: opponentStats?.shotsAttempted || 0, fullMark: Math.max(40, teamStats.shotsAttempted || 0, opponentStats?.shotsAttempted || 0) },
    { metric: 'Shots On Target', team: teamStats.shotsOnTarget || 0, opponent: opponentStats?.shotsOnTarget || 0, fullMark: Math.max(20, teamStats.shotsOnTarget || 0, opponentStats?.shotsOnTarget || 0) },
    { metric: 'Runs Into Boxes', team: teamStats.runsIntoBoxes || 0, opponent: opponentStats?.runsIntoBoxes || 0, fullMark: Math.max(70, teamStats.runsIntoBoxes || 0, opponentStats?.runsIntoBoxes || 0) },
    { metric: 'Corners', team: teamStats.corners || 0, opponent: opponentStats?.corners || 0, fullMark: Math.max(15, teamStats.corners || 0, opponentStats?.corners || 0) },
    { metric: 'Dangerous Crosses', team: teamStats.dangerousCrosses || 0, opponent: opponentStats?.dangerousCrosses || 0, fullMark: Math.max(20, teamStats.dangerousCrosses || 0, opponentStats?.dangerousCrosses || 0) }
  ];

  const createPossessionSpiderData = (teamStats: MatchStats, opponentStats?: MatchStats) => [
    { metric: 'Possession %', team: teamStats.possession || 0, opponent: opponentStats?.possession || 0, fullMark: 100 },
    { metric: 'Pass Accuracy %', team: teamStats.passingSuccessRate || 0, opponent: opponentStats?.passingSuccessRate || 0, fullMark: 100 },
    { metric: 'First Touch %', team: teamStats.firstTouchSuccessRate || 0, opponent: opponentStats?.firstTouchSuccessRate || 0, fullMark: 100 },
    { metric: 'Take Ons', team: teamStats.takeOns || 0, opponent: opponentStats?.takeOns || 0, fullMark: Math.max(30, teamStats.takeOns || 0, opponentStats?.takeOns || 0) },
    { metric: 'Free Kicks', team: teamStats.freeKicks || 0, opponent: opponentStats?.freeKicks || 0, fullMark: Math.max(20, teamStats.freeKicks || 0, opponentStats?.freeKicks || 0) },
    { metric: 'Passes Success', team: teamStats.passesSuccess || 0, opponent: opponentStats?.passesSuccess || 0, fullMark: Math.max(200, teamStats.passesSuccess || 0, opponentStats?.passesSuccess || 0) }
  ];

  const createDefensiveSpiderData = (teamStats: MatchStats, opponentStats?: MatchStats) => [
    { metric: 'Tackles', team: teamStats.tackles || 0, opponent: opponentStats?.tackles || 0, fullMark: Math.max(40, teamStats.tackles || 0, opponentStats?.tackles || 0) },
    { metric: 'Free Kicks', team: teamStats.freeKicks || 0, opponent: opponentStats?.freeKicks || 0, fullMark: Math.max(20, teamStats.freeKicks || 0, opponentStats?.freeKicks || 0) },
    { metric: 'Offsides', team: teamStats.offsides || 0, opponent: opponentStats?.offsides || 0, fullMark: Math.max(10, teamStats.offsides || 0, opponentStats?.offsides || 0) },
    { metric: 'Pass Distance', team: teamStats.passingTotalDistance || 0, opponent: opponentStats?.passingTotalDistance || 0, fullMark: Math.max(5000, teamStats.passingTotalDistance || 0, opponentStats?.passingTotalDistance || 0) },
    { metric: 'R.Foot Pass %', team: teamStats.rightFootPassSuccessRate || 0, opponent: opponentStats?.rightFootPassSuccessRate || 0, fullMark: 100 },
    { metric: 'L.Foot Pass %', team: teamStats.leftFootPassSuccessRate || 0, opponent: opponentStats?.leftFootPassSuccessRate || 0, fullMark: 100 }
  ];

  if (fixtureLoading || statsLoading) {
    return (
      <MainLayout title="GameScope Analysis" subtitle="Loading match analysis...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading analysis data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!fixture || !matchStats || matchStats.length === 0) {
    return (
      <MainLayout title="GameScope Analysis" subtitle="Analysis not found">
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No analysis data available for this match.</p>
          <Link href="/dashboard">
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
  const opponentFullGameStats = matchStats.find(stat => stat.period === 'FULL_GAME' && stat.isTeamStats === false);

  const getResultDisplay = () => {
    if (fixture.homeScore !== null && fixture.awayScore !== null) {
      const isHome = fixture.type === 'HOME';
      const ourScore = isHome ? fixture.homeScore : fixture.awayScore;
      const theirScore = isHome ? fixture.awayScore : fixture.homeScore;
      
      if (ourScore > theirScore) {
        return { result: `${ourScore}-${theirScore} WIN`, color: 'bg-green-500' };
      } else if (ourScore < theirScore) {
        return { result: `${ourScore}-${theirScore} LOSS`, color: 'bg-red-500' };
      } else {
        return { result: `${ourScore}-${theirScore} DRAW`, color: 'bg-yellow-500' };
      }
    }
    return { result: 'NO RESULT', color: 'bg-gray-500' };
  };

  const { result, color } = getResultDisplay();

  if (!fullGameStats) {
    return (
      <MainLayout title="GameScope Analysis" subtitle="Analysis not found">
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No full game statistics available for this match.</p>
          <Link href="/dashboard">
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold">{fixture.opponent}</h2>
            <p className="text-muted-foreground">{format(new Date(fixture.date), 'EEEE, MMMM d, yyyy')}</p>
          </div>
        </div>
        <Badge className={`${color} text-white px-4 py-2 text-lg`}>
          {result}
        </Badge>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-6">GameScope Analysis</h3>
          
          <div className="space-y-6">
            {/* Analysis Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {fullGameStats.possession || 0}%
                </div>
                <div className="text-sm text-muted-foreground">Possession</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {fullGameStats.shotsOnTarget || 0}
                </div>
                <div className="text-sm text-muted-foreground">Shots on Target</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 mb-2">
                  {fullGameStats.passingSuccessRate || 0}%
                </div>
                <div className="text-sm text-muted-foreground">Pass Accuracy</div>
              </div>
            </div>

            {/* Comprehensive Metrics Comparison */}
            <MetricsComparison
              teamName="POLK"
              opponentName={fixture.opponent}
              teamStats={fullGameStats}
              opponentStats={opponentFullGameStats}
            />

            {/* AI-Powered Insights */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
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

            {/* Top Performers */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Top Performers</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg bg-yellow-50">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-yellow-100 text-yellow-700 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-lg">
                      10
                    </div>
                    <p className="font-medium text-foreground">Sarah Johnson</p>
                    <p className="text-xs text-muted-foreground mb-2">Midfielder</p>
                    <div className="text-sm text-yellow-700 font-medium">Player of the Match</div>
                    <div className="text-xs text-muted-foreground">2 Goals, 1 Assist</div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-100 text-gray-700 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-lg">
                      3
                    </div>
                    <p className="font-medium text-foreground">Emma Rodriguez</p>
                    <p className="text-xs text-muted-foreground mb-2">Defender</p>
                    <div className="text-sm text-muted-foreground font-medium">Best Defender</div>
                    <div className="text-xs text-muted-foreground">5 Tackles, 8 Clearances</div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-100 text-gray-700 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-lg">
                      1
                    </div>
                    <p className="font-medium text-foreground">Alex Mitchell</p>
                    <p className="text-xs text-muted-foreground mb-2">Goalkeeper</p>
                    <div className="text-sm text-muted-foreground font-medium">Clean Sheet</div>
                    <div className="text-xs text-muted-foreground">6 Saves, 0 Goals Conceded</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Analysis Tabs */}
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
                      teamName="POLK"
                      opponentName={fixture.opponent}
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
                        <span className="text-red-600 text-center">POLK</span>
                        <span className="text-gray-600 text-center">OPP</span>
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
                      teamName="POLK"
                      opponentName={fixture.opponent}
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
                        <span className="text-red-600 text-center">POLK</span>
                        <span className="text-gray-600 text-center">OPP</span>
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
                      data={createDefensiveSpiderData(fullGameStats, opponentFullGameStats)}
                      teamName="POLK"
                      opponentName={fixture.opponent}
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
                        <span className="text-red-600 text-center">POLK</span>
                        <span className="text-gray-600 text-center">OPP</span>
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
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}