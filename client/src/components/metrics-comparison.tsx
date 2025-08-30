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
      <div className="w-3/4 mx-auto flex justify-between items-center text-sm font-medium">
        <span className="text-muted-foreground">{label}</span>
      </div>
      
      <div className="relative w-3/4 h-8 bg-gray-200 rounded-lg overflow-hidden mx-auto">
        {/* Team bar (from left) - POLK red/black gradient */}
        <div 
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-600 to-red-700 transition-all duration-500 ease-out"
          style={{ width: `${normalizedTeamValue}%` }}
        />
        
        {/* Opponent bar (from right) - white with red accent */}
        <div 
          className="absolute right-0 top-0 h-full bg-gradient-to-l from-red-400 to-red-300 transition-all duration-500 ease-out"
          style={{ width: `${normalizedOpponentValue}%` }}
        />
        
        {/* Center divider */}
        <div className="absolute left-1/2 top-0 h-full w-0.5 bg-white transform -translate-x-0.5 z-10" />
      </div>
      
      <div className="w-3/4 mx-auto flex justify-between items-center text-xs">
        <div className="text-left">
          <div className="text-red-600 font-semibold">{formatValue(displayTeamValue)}</div>
          {!isPercentage && <div className="text-red-400">{formatPercentage(normalizedTeamValue)}</div>}
        </div>
        <div className="text-right">
          <div className="text-red-600 font-semibold">{formatValue(displayOpponentValue)}</div>
          {!isPercentage && <div className="text-red-400">{formatPercentage(normalizedOpponentValue)}</div>}
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
        {/* Header with logos and score - Spurs vs Bournemouth inspired */}
        <div className="mb-6">
          <h4 className="font-semibold text-center mb-6 text-xl text-gray-800">Match Statistics</h4>
          
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
                    alt={`${teamName} logo`}
                    className="w-20 h-20 object-contain"
                  />
                ) : (
                  <div className="w-20 h-20 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">POLK</span>
                  </div>
                )}
                <div>
                  <div className="text-2xl font-bold">{teamName}</div>
                  <div className="text-white/80 text-sm">HOME</div>
                </div>
              </div>
              
              {/* Center score - absolutely centered */}
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/95 backdrop-blur rounded-2xl px-6 py-4 border-2 border-gray-200 shadow-2xl drop-shadow-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl font-bold text-red-600">{teamScore}</div>
                  <div className="text-2xl font-light text-gray-400">-</div>
                  <div className="text-3xl font-bold text-red-600">{opponentScore}</div>
                </div>
                <div className="text-xs text-gray-500 text-center mt-1">FT</div>
              </div>
              
              {/* Opponent section */}
              <div className="flex items-center space-x-4 text-red-600 flex-1 justify-end">
                <div className="text-right">
                  <div className="text-2xl font-bold">{opponentName}</div>
                  <div className="text-red-500 text-sm">AWAY</div>
                </div>
                {opponentLogoPath ? (
                  <img 
                    src={opponentLogoPath} 
                    alt={`${opponentName} logo`}
                    className="w-20 h-20 object-contain"
                  />
                ) : (
                  <div className="w-20 h-20 flex items-center justify-center">
                    <span className="text-red-600 font-bold text-lg">{opponentName.split(' ').map(word => word[0]).join('').slice(0, 3)}</span>
                  </div>
                )}
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