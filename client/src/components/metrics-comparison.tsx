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
    // For percentage metrics, use the raw values but still normalize for bar display
    normalizedTeamValue = total > 0 ? (teamValue / total) * 100 : 50;
    normalizedOpponentValue = 100 - normalizedTeamValue;
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
          <div className="text-red-400">{formatPercentage(normalizedTeamValue)}</div>
        </div>
        <div className="text-right">
          <div className="text-blue-600 font-semibold">{formatValue(displayOpponentValue)}</div>
          <div className="text-blue-400">{formatPercentage(normalizedOpponentValue)}</div>
        </div>
      </div>
    </div>
  );
}

export function MetricsComparison({ teamName, opponentName, teamStats, opponentStats }: MetricsComparisonProps) {
  const metrics = [
    {
      label: "Ball Possession",
      teamValue: teamStats.possession || 0,
      opponentValue: opponentStats?.possession || (100 - (teamStats.possession || 0)),
      maxValue: 100,
      unit: "",
      isPercentage: true
    },
    {
      label: "Goals Scored",
      teamValue: teamStats.goals || 0,
      opponentValue: opponentStats?.goals || 0,
      maxValue: undefined,
      unit: "",
      isPercentage: false
    },
    {
      label: "Shots Attempted",
      teamValue: teamStats.shotsAttempted || 0,
      opponentValue: opponentStats?.shotsAttempted || 0,
      maxValue: undefined,
      unit: "",
      isPercentage: false
    },
    {
      label: "Shots on Target",
      teamValue: teamStats.shotsOnTarget || 0,
      opponentValue: opponentStats?.shotsOnTarget || 0,
      maxValue: undefined,
      unit: "",
      isPercentage: false
    },
    {
      label: "Pass Accuracy",
      teamValue: teamStats.passingSuccessRate || 0,
      opponentValue: opponentStats?.passingSuccessRate || 0,
      maxValue: 100,
      unit: "",
      isPercentage: true
    },
    {
      label: "Corners",
      teamValue: teamStats.corners || 0,
      opponentValue: opponentStats?.corners || 0,
      maxValue: undefined,
      unit: "",
      isPercentage: false
    },
    {
      label: "Free Kicks",
      teamValue: teamStats.freeKicks || 0,
      opponentValue: opponentStats?.freeKicks || 0,
      maxValue: undefined,
      unit: "",
      isPercentage: false
    },
    {
      label: "Tackles",
      teamValue: teamStats.tackles || 0,
      opponentValue: opponentStats?.tackles || 0,
      maxValue: undefined,
      unit: "",
      isPercentage: false
    },
    {
      label: "Offsides",
      teamValue: teamStats.offsides || 0,
      opponentValue: opponentStats?.offsides || 0,
      maxValue: undefined,
      unit: "",
      isPercentage: false
    },
    {
      label: "Dangerous Crosses",
      teamValue: teamStats.dangerousCrosses || 0,
      opponentValue: opponentStats?.dangerousCrosses || 0,
      maxValue: undefined,
      unit: "",
      isPercentage: false
    },
    {
      label: "Take Ons",
      teamValue: teamStats.takeOns || 0,
      opponentValue: opponentStats?.takeOns || 0,
      maxValue: undefined,
      unit: "",
      isPercentage: false
    },
    {
      label: "Runs Into Boxes",
      teamValue: teamStats.runsIntoBoxes || 0,
      opponentValue: opponentStats?.runsIntoBoxes || 0,
      maxValue: undefined,
      unit: "",
      isPercentage: false
    }
  ];

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h4 className="font-semibold text-center mb-2">Match Statistics Comparison</h4>
          <div className="flex justify-between items-center text-sm text-muted-foreground mb-6">
            <span className="font-medium text-red-600">{teamName}</span>
            <span>vs</span>
            <span className="font-medium text-blue-600">{opponentName}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metrics.map((metric, index) => (
            <MetricBar
              key={index}
              label={metric.label}
              teamValue={metric.teamValue}
              opponentValue={metric.opponentValue}
              maxValue={metric.maxValue}
              unit={metric.unit}
              isPercentage={metric.isPercentage}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}