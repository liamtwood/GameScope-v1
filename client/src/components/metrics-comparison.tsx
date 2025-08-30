import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchStats } from "@shared/schema";

interface MetricsComparisonProps {
  teamName: string;
  opponentName: string;
  teamStats: MatchStats;
  opponentStats?: MatchStats;
  teamScore?: number;
  opponentScore?: number;
  teamLogoPath?: string;
  opponentLogoPath?: string;
}

interface MetricBarProps {
  label: string;
  teamValue: number;
  opponentValue: number;
  maxValue?: number;
  unit?: string;
  isPercentage?: boolean;
}

function MetricBar({ label, teamValue, opponentValue, maxValue, unit = "", isPercentage = false }: MetricBarProps) {
  const total = teamValue + opponentValue;
  
  // Normalize to percentages if not already a percentage metric
  let normalizedTeamValue, normalizedOpponentValue, displayTeamValue, displayOpponentValue;
  
  if (isPercentage) {
    // For percentage metrics, the values already represent proportions
    normalizedTeamValue = teamValue;
    normalizedOpponentValue = opponentValue;
    displayTeamValue = teamValue;
    displayOpponentValue = opponentValue;
  } else {
    // For count metrics, normalize to show proportion
    if (total > 0) {
      normalizedTeamValue = (teamValue / total) * 100;
      normalizedOpponentValue = (opponentValue / total) * 100;
    } else if (teamValue > 0) {
      normalizedTeamValue = 100;
      normalizedOpponentValue = 0;
    } else if (opponentValue > 0) {
      normalizedTeamValue = 0;
      normalizedOpponentValue = 100;
    } else {
      normalizedTeamValue = 50;
      normalizedOpponentValue = 50;
    }
    displayTeamValue = teamValue;
    displayOpponentValue = opponentValue;
  }

  const formatValue = (value: number) => {
    return isPercentage ? `${value}%` : `${value}${unit}`;
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm font-medium">
        <span className="text-muted-foreground">{label}</span>
      </div>
      
      <div className="relative w-full h-8 bg-gray-200 rounded-lg overflow-hidden">
        {/* Team bar (from left) */}
        <div 
          className="absolute left-0 top-0 h-full bg-red-500 transition-all duration-500 ease-out"
          style={{ width: `${normalizedTeamValue}%` }}
        />
        
        {/* Opponent bar (from right) */}
        <div 
          className="absolute right-0 top-0 h-full bg-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${normalizedOpponentValue}%` }}
        />
        
        {/* Center divider */}
        <div className="absolute left-1/2 top-0 h-full w-0.5 bg-white transform -translate-x-0.5 z-10" />
      </div>
      
      <div className="flex justify-between items-center text-xs">
        <div className="text-left">
          <div className="text-red-600 font-semibold">{formatValue(displayTeamValue)}</div>
          {!isPercentage && <div className="text-red-400">{formatPercentage(normalizedTeamValue)}</div>}
        </div>
        <div className="text-right">
          <div className="text-blue-600 font-semibold">{formatValue(displayOpponentValue)}</div>
          {!isPercentage && <div className="text-blue-400">{formatPercentage(normalizedOpponentValue)}</div>}
        </div>
      </div>
    </div>
  );
}

export function MetricsComparison({ teamName, opponentName, teamStats, opponentStats, teamScore = 0, opponentScore = 0, teamLogoPath, opponentLogoPath }: MetricsComparisonProps) {
  const metricCategories = [
    {
      category: "Key",
      metrics: [
        {
          label: "Total Team Distance",
          teamValue: teamStats?.totalTeamDistance || 0,
          opponentValue: opponentStats?.totalTeamDistance || 0,
          unit: "m",
        },
        {
          label: "Ball Possession",
          teamValue: teamStats?.possession || 0,
          opponentValue: opponentStats?.possession || 0,
          unit: "%",
          isPercentage: true,
        },
      ]
    },
    {
      category: "Attack",
      metrics: [
        {
          label: "Goals",
          teamValue: teamStats?.goals || 0,
          opponentValue: opponentStats?.goals || 0,
        },
        {
          label: "Shots Attempted", 
          teamValue: teamStats?.shotsAttempted || 0,
          opponentValue: opponentStats?.shotsAttempted || 0,
        },
        {
          label: "Shots on Target",
          teamValue: teamStats?.shotsOnTarget || 0,
          opponentValue: opponentStats?.shotsOnTarget || 0,
        },
        {
          label: "Runs into Boxes",
          teamValue: teamStats?.runsIntoBoxes || 0,
          opponentValue: opponentStats?.runsIntoBoxes || 0,
        },
        {
          label: "Corner Kicks",
          teamValue: teamStats?.corners || 0,
          opponentValue: opponentStats?.corners || 0,
        },
        {
          label: "Dangerous Crosses",
          teamValue: teamStats?.dangerousCrosses || 0,
          opponentValue: opponentStats?.dangerousCrosses || 0,
        },
      ]
    },
    {
      category: "Possession",
      metrics: [
        {
          label: "Dribbles",
          teamValue: teamStats?.dribbles || 0,
          opponentValue: opponentStats?.dribbles || 0,
        },
        {
          label: "Penetrating Dribbles",
          teamValue: teamStats?.penetratingDribbles || 0,
          opponentValue: opponentStats?.penetratingDribbles || 0,
        },
        {
          label: "Take Ons",
          teamValue: teamStats?.takeOns || 0,
          opponentValue: opponentStats?.takeOns || 0,
        },
        {
          label: "First Touch Success",
          teamValue: teamStats?.firstTouchSuccess || 0,
          opponentValue: opponentStats?.firstTouchSuccess || 0,
        },
        {
          label: "First Touch Success Rate",
          teamValue: teamStats?.firstTouchSuccessRate || 0,
          opponentValue: opponentStats?.firstTouchSuccessRate || 0,
          unit: "%",
          isPercentage: true,
        },
      ]
    },
    {
      category: "Defense",
      metrics: [
        {
          label: "Tackles",
          teamValue: teamStats?.tackles || 0,
          opponentValue: opponentStats?.tackles || 0,
        },
        {
          label: "Free Kicks",
          teamValue: teamStats?.freeKicks || 0,
          opponentValue: opponentStats?.freeKicks || 0,
        },
        {
          label: "Offsides",
          teamValue: teamStats?.offsides || 0,
          opponentValue: opponentStats?.offsides || 0,
        },
      ]
    },
    {
      category: "Passing",
      metrics: [
        {
          label: "Passes Attempted",
          teamValue: teamStats?.passesAttempted || 0,
          opponentValue: opponentStats?.passesAttempted || 0,
        },
        {
          label: "Passes Success",
          teamValue: teamStats?.passesSuccess || 0,
          opponentValue: opponentStats?.passesSuccess || 0,
        },
        {
          label: "Passing Success Rate",
          teamValue: teamStats?.passingSuccessRate || 0,
          opponentValue: opponentStats?.passingSuccessRate || 0,
          unit: "%",
          isPercentage: true,
        },
        {
          label: "Passing Total Distance",
          teamValue: teamStats?.passingTotalDistance || 0,
          opponentValue: opponentStats?.passingTotalDistance || 0,
          unit: "m",
        },
        {
          label: "Passing Average Distance",
          teamValue: teamStats?.passingAverageDistance || 0,
          opponentValue: opponentStats?.passingAverageDistance || 0,
          unit: "m",
        },
        {
          label: "Passing Average Velocity",
          teamValue: teamStats?.passingAverageVelocity || 0,
          opponentValue: opponentStats?.passingAverageVelocity || 0,
          unit: "km/h",
        },
      ]
    },
  ];

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header with logos and score */}
        <div>
          <h4 className="font-semibold text-center mb-4 text-lg">Match Statistics Comparison</h4>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* POLK Logo Box */}
            <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg border">
              <div className="text-center">
                {teamLogoPath ? (
                  <img 
                    src={teamLogoPath} 
                    alt={`${teamName} logo`}
                    className="w-12 h-12 object-contain mx-auto mb-2"
                  />
                ) : (
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold text-sm">POLK</span>
                  </div>
                )}
                <span className="text-sm font-medium text-red-600">{teamName}</span>
              </div>
            </div>
            
            {/* Score Box */}
            <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-800">
                  {teamScore} - {opponentScore}
                </div>
                <span className="text-sm text-gray-500">Final Score</span>
              </div>
            </div>
            
            {/* Opponent Logo Box */}
            <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg border">
              <div className="text-center">
                {opponentLogoPath ? (
                  <img 
                    src={opponentLogoPath} 
                    alt={`${opponentName} logo`}
                    className="w-12 h-12 object-contain mx-auto mb-2"
                  />
                ) : (
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold text-xs">{opponentName.split(' ').map(word => word[0]).join('').slice(0, 3)}</span>
                  </div>
                )}
                <span className="text-sm font-medium text-blue-600">{opponentName}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation - Using shadcn Tabs like existing tabs */}
        <Tabs defaultValue="Key" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            {metricCategories.map((category) => (
              <TabsTrigger key={category.category} value={category.category}>
                {category.category}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {/* Tab Content */}
          {metricCategories.map((category) => (
            <TabsContent key={category.category} value={category.category} className="mt-6">
              <div className="space-y-4">
                {category.metrics.map((metric, metricIndex) => (
                  <MetricBar
                    key={metricIndex}
                    label={metric.label}
                    teamValue={metric.teamValue}
                    opponentValue={metric.opponentValue}
                    unit={metric.unit}
                    isPercentage={metric.isPercentage}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Card>
  );
}