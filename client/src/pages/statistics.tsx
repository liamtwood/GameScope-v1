import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Target, Shield } from "lucide-react";
import { TeamStatistics } from "@/lib/types";
import { Team, Player } from "@shared/schema";

export default function Statistics() {
  const { data: teams } = useQuery<Team[]>({ queryKey: ["/api/teams"] });
  const currentTeam = teams?.[0]; // For demo, use first team

  const { data: players } = useQuery<Player[]>({ 
    queryKey: ["/api/players", currentTeam?.id],
    enabled: !!currentTeam?.id 
  });

  const { data: statistics } = useQuery<TeamStatistics>({ 
    queryKey: ["/api/statistics/team", currentTeam?.id],
    enabled: !!currentTeam?.id 
  });

  const topScorers = players?.sort((a, b) => (b.goals || 0) - (a.goals || 0)).slice(0, 3) || [];
  
  const positionGoals = {
    forwards: players?.filter(p => ['ST', 'LW', 'RW', 'CF'].includes(p.position)).reduce((sum, p) => sum + (p.goals || 0), 0) || 0,
    midfielders: players?.filter(p => ['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(p.position)).reduce((sum, p) => sum + (p.goals || 0), 0) || 0,
    defenders: players?.filter(p => ['CB', 'LB', 'RB'].includes(p.position)).reduce((sum, p) => sum + (p.goals || 0), 0) || 0,
    goalkeepers: players?.filter(p => p.position === 'GK').reduce((sum, p) => sum + (p.goals || 0), 0) || 0,
  };

  const totalGoals = Object.values(positionGoals).reduce((sum, goals) => sum + goals, 0);

  const appearanceDistribution = [
    { appearances: 6, count: players?.filter(p => p.appearances === 6).length || 0 },
    { appearances: 5, count: players?.filter(p => p.appearances === 5).length || 0 },
    { appearances: 4, count: players?.filter(p => p.appearances === 4).length || 0 },
    { appearances: 3, count: players?.filter(p => p.appearances && p.appearances <= 3).length || 0 },
  ];

  const totalPlayers = players?.length || 1;

  return (
    <MainLayout 
      title="Team Statistics" 
      subtitle="Performance analytics and metrics"
    >
      {/* Statistics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Season Record</h3>
              <Trophy className="text-border" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Wins</span>
                <span className="font-semibold text-green-600">{statistics?.wins || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Draws</span>
                <span className="font-semibold text-yellow-600">{statistics?.draws || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Losses</span>
                <span className="font-semibold text-red-600">{statistics?.losses || 0}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Win Rate</span>
                <span className="font-bold text-green-600">
                  {statistics?.matchesPlayed ? Math.round((statistics.wins / statistics.matchesPlayed) * 100) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Goals Statistics</h3>
              <Target className="text-border" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Goals For</span>
                <span className="font-semibold text-green-600">{statistics?.totalGoals || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Goals Against</span>
                <span className="font-semibold text-red-600">{statistics?.totalGoalsConceded || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Goal Difference</span>
                <span className={`font-semibold ${(statistics?.goalDifference || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(statistics?.goalDifference || 0) >= 0 ? '+' : ''}{statistics?.goalDifference || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Avg Goals/Game</span>
                <span className="font-semibold text-foreground">
                  {statistics?.matchesPlayed ? (statistics.totalGoals / statistics.matchesPlayed).toFixed(1) : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Clean Sheets</h3>
              <Shield className="text-blue-600" />
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {statistics?.matchesPlayed && statistics?.totalGoalsConceded === 0 ? statistics.matchesPlayed : 0}
              </div>
              <p className="text-muted-foreground">out of {statistics?.matchesPlayed || 0} matches</p>
              <div className="mt-4 bg-blue-100 rounded-full h-2">
                <div 
                  className="bg-blue-600 rounded-full h-2" 
                  style={{ 
                    width: `${statistics?.matchesPlayed && statistics?.totalGoalsConceded === 0 ? 100 : 0}%` 
                  }}
                />
              </div>
              <p className="text-sm text-blue-600 mt-2 font-medium">
                {statistics?.matchesPlayed && statistics?.totalGoalsConceded === 0 ? 100 : 0}% Clean Sheet Rate
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Scorers */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Top Scorers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topScorers.map((player, index) => (
              <div 
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  index === 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-yellow-600' : 'bg-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{player.name}</p>
                    <p className="text-sm text-muted-foreground">{player.position} • #{player.jerseyNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${index === 0 ? 'text-yellow-600' : 'text-gray-600'}`}>
                    {player.goals}
                  </p>
                  <p className="text-sm text-muted-foreground">Goals</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Position Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Goals by Position</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { position: 'Forwards', goals: positionGoals.forwards, color: 'purple' },
              { position: 'Midfielders', goals: positionGoals.midfielders, color: 'green' },
              { position: 'Defenders', goals: positionGoals.defenders, color: 'red' },
              { position: 'Goalkeepers', goals: positionGoals.goalkeepers, color: 'blue' },
            ].map(({ position, goals, color }) => (
              <div key={position} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 bg-${color}-600 rounded`} />
                  <span className="text-foreground">{position}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="bg-gray-200 rounded-full h-2 w-24">
                    <div 
                      className={`bg-${color}-600 rounded-full h-2`} 
                      style={{ width: `${totalGoals > 0 ? (goals / totalGoals) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="font-semibold text-foreground w-8">{goals}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Player Appearances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {appearanceDistribution.map(({ appearances, count }) => (
              <div key={appearances}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {appearances === 3 ? '≤3' : appearances} Appearances
                  </span>
                  <span className="font-medium text-foreground">
                    {count} Players ({Math.round((count / totalPlayers) * 100)}%)
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 rounded-full h-2" 
                    style={{ width: `${(count / totalPlayers) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
