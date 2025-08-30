import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpiderChart } from "@/components/spider-chart";
import { ArrowLeft, Trophy, Target, Users } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Fixture, MatchStats } from "@shared/schema";

export default function Analysis() {
  const [, params] = useRoute("/analysis/:fixtureId");
  const fixtureId = parseInt(params?.fixtureId || "0");

  const { data: fixture, isLoading: fixtureLoading } = useQuery<Fixture>({
    queryKey: ["/api/fixture", fixtureId],
    enabled: !!fixtureId,
  });

  const { data: statistics, isLoading: statsLoading } = useQuery<MatchStats[]>({
    queryKey: ["/api/match-stats", fixtureId],
    enabled: !!fixtureId,
  });

  if (fixtureLoading || statsLoading) {
    return (
      <MainLayout title="GameScope Analysis" subtitle="Loading match analysis...">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading analysis data...</div>
        </div>
      </MainLayout>
    );
  }

  if (!fixture || !statistics || statistics.length === 0) {
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

  // Separate team and opponent stats
  const teamStats = statistics.filter(stat => stat.isTeamStats);
  const opponentStats = statistics.filter(stat => !stat.isTeamStats);

  const getStatValue = (stats: MatchStats[], field: string) => {
    return stats.reduce((sum, stat) => sum + (stat[field as keyof MatchStats] as number || 0), 0);
  };

  const getStatAverage = (stats: MatchStats[], field: string) => {
    const values = stats.map(stat => stat[field as keyof MatchStats] as number || 0).filter(v => v > 0);
    return values.length > 0 ? Math.round(values.reduce((sum, val) => sum + val, 0) / values.length) : 0;
  };

  // Attack metrics for spider chart
  const attackData = [
    { 
      metric: 'Goals', 
      team: getStatValue(teamStats, 'goals'), 
      opponent: getStatValue(opponentStats, 'goals'),
      fullMark: 5
    },
    { 
      metric: 'Shots', 
      team: getStatValue(teamStats, 'shotsAttempted'), 
      opponent: getStatValue(opponentStats, 'shotsAttempted'),
      fullMark: 20
    },
    { 
      metric: 'Shots on Target', 
      team: getStatValue(teamStats, 'shotsOnTarget'), 
      opponent: getStatValue(opponentStats, 'shotsOnTarget'),
      fullMark: 10
    },
    { 
      metric: 'Runs into Box', 
      team: getStatValue(teamStats, 'runsIntoBoxes'), 
      opponent: getStatValue(opponentStats, 'runsIntoBoxes'),
      fullMark: 15
    },
    { 
      metric: 'Corners', 
      team: getStatValue(teamStats, 'corners'), 
      opponent: getStatValue(opponentStats, 'corners'),
      fullMark: 10
    },
  ];

  // Possession metrics for spider chart
  const possessionData = [
    { 
      metric: 'Possession %', 
      team: getStatAverage(teamStats, 'possession'), 
      opponent: getStatAverage(opponentStats, 'possession'),
      fullMark: 100
    },
    { 
      metric: 'Distance (km)', 
      team: Math.round(getStatValue(teamStats, 'totalTeamDistance') / 1000), 
      opponent: Math.round(getStatValue(opponentStats, 'totalTeamDistance') / 1000),
      fullMark: 120
    },
    { 
      metric: 'Pass Success %', 
      team: getStatAverage(teamStats, 'passingSuccessRate'), 
      opponent: getStatAverage(opponentStats, 'passingSuccessRate'),
      fullMark: 100
    },
    { 
      metric: 'Dribbles', 
      team: getStatValue(teamStats, 'dribbles'), 
      opponent: getStatValue(opponentStats, 'dribbles'),
      fullMark: 20
    },
  ];

  // Technical metrics for spider chart
  const technicalData = [
    { 
      metric: 'Pass Success %', 
      team: getStatAverage(teamStats, 'passingSuccessRate'), 
      opponent: getStatAverage(opponentStats, 'passingSuccessRate'),
      fullMark: 100
    },
    { 
      metric: 'First Touch %', 
      team: getStatAverage(teamStats, 'firstTouchSuccessRate'), 
      opponent: getStatAverage(opponentStats, 'firstTouchSuccessRate'),
      fullMark: 100
    },
    { 
      metric: 'Tackles', 
      team: getStatValue(teamStats, 'tackles'), 
      opponent: getStatValue(opponentStats, 'tackles'),
      fullMark: 25
    },
    { 
      metric: 'Take Ons', 
      team: getStatValue(teamStats, 'takeOns'), 
      opponent: getStatValue(opponentStats, 'takeOns'),
      fullMark: 15
    },
  ];

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

      {/* AI Insights */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>AI Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Key Strength</h4>
              <p className="text-sm text-blue-700">
                Strong possession control with {getStatAverage(teamStats, 'possession')}% ball retention
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">Area for Improvement</h4>
              <p className="text-sm text-yellow-700">
                Shot conversion could be improved - created {getStatValue(teamStats, 'shotsAttempted')} shots but scored {getStatValue(teamStats, 'goals')} goals
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Match Impact</h4>
              <p className="text-sm text-green-700">
                Dominated physical aspects with {Math.round(getStatValue(teamStats, 'totalTeamDistance') / 1000)}km distance covered
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                <Trophy className="text-white text-xl" />
              </div>
              <h4 className="font-semibold">Player of the Match</h4>
              <p className="text-2xl font-bold text-yellow-600 mt-1">Sarah Johnson</p>
              <p className="text-sm text-muted-foreground">2 goals, 1 assist</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                <Target className="text-white text-xl" />
              </div>
              <h4 className="font-semibold">Best Performer</h4>
              <p className="text-2xl font-bold text-green-600 mt-1">Emma Davis</p>
              <p className="text-sm text-muted-foreground">95% pass accuracy</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                <Users className="text-white text-xl" />
              </div>
              <h4 className="font-semibold">Defensive Rock</h4>
              <p className="text-2xl font-bold text-blue-600 mt-1">Lisa Chen</p>
              <p className="text-sm text-muted-foreground">8 tackles won</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Analysis Tabs */}
      <Tabs defaultValue="attack" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="attack">Attack</TabsTrigger>
          <TabsTrigger value="possession">Possession</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
        </TabsList>

        <TabsContent value="attack" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attack Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="flex justify-center">
                  <SpiderChart 
                    data={attackData} 
                    teamName="POLK" 
                    opponentName={fixture.opponent}
                    title="Attack Performance"
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-4">Attack Metrics</h4>
                  <div className="space-y-3">
                    {attackData.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{item.metric}</span>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-red-600 font-medium">POLK: {item.team}</span>
                          <span className="text-sm text-blue-600 font-medium">OPP: {item.opponent}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="possession" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Possession Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="flex justify-center">
                  <SpiderChart 
                    data={possessionData} 
                    teamName="POLK" 
                    opponentName={fixture.opponent}
                    title="Possession Performance"
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-4">Possession Metrics</h4>
                  <div className="space-y-3">
                    {possessionData.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{item.metric}</span>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-red-600 font-medium">POLK: {item.team}</span>
                          <span className="text-sm text-blue-600 font-medium">OPP: {item.opponent}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="flex justify-center">
                  <SpiderChart 
                    data={technicalData} 
                    teamName="POLK" 
                    opponentName={fixture.opponent}
                    title="Technical Performance"
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-4">Technical Metrics</h4>
                  <div className="space-y-3">
                    {technicalData.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{item.metric}</span>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-red-600 font-medium">POLK: {item.team}</span>
                          <span className="text-sm text-blue-600 font-medium">OPP: {item.opponent}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}