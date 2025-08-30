import { Card } from "@/components/ui/card";
import { MatchStats } from "@shared/schema";

interface MetricsComparisonProps {
  teamName: string;
  opponentName: string;
  teamStats: MatchStats;
  opponentStats?: MatchStats;
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

export function MetricsComparison({ teamName, opponentName, teamStats, opponentStats }: MetricsComparisonProps) {
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
      <div className="space-y-8">
        <div>
          <h4 className="font-semibold text-center mb-2 text-lg">Match Statistics Comparison</h4>
          <div className="flex justify-between items-center text-sm text-muted-foreground mb-6">
            <span className="font-medium text-red-600">{teamName}</span>
            <span>vs</span>
            <span className="font-medium text-blue-600">{opponentName}</span>
          </div>
        </div>
        
        {metricCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="space-y-4">
            <h5 className="text-md font-semibold text-gray-700 border-b pb-2 mb-4">{category.category}</h5>
            <div className="space-y-4">
              {category.metrics.map((metric, metricIndex) => (
                <MetricBar
                  key={`${categoryIndex}-${metricIndex}`}
                  label={metric.label}
                  teamValue={metric.teamValue}
                  opponentValue={metric.opponentValue}
                  unit={metric.unit}
                  isPercentage={metric.isPercentage}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}