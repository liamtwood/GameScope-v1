import { Fixture, MatchStats } from "@shared/schema";
import { format } from "date-fns";

interface MatchReportPDFProps {
  fixture: Fixture;
  teamStats?: MatchStats;
  opponentStats?: MatchStats;
  teamLogoPath?: string;
  opponentLogoPath?: string;
  clubName?: string;
  teamColor?: string;
  opponentColor?: string;
}

interface MetricBarProps {
  label: string;
  teamValue: number;
  opponentValue: number;
  teamColor: string;
  opponentColor: string;
  unit?: string;
  isPercentage?: boolean;
}

function MetricBar({ 
  label, 
  teamValue, 
  opponentValue, 
  teamColor, 
  opponentColor, 
  unit = "", 
  isPercentage = false 
}: MetricBarProps) {
  const total = teamValue + opponentValue;
  let normalizedTeamValue, normalizedOpponentValue;
  
  if (isPercentage) {
    normalizedTeamValue = teamValue;
    normalizedOpponentValue = opponentValue;
  } else {
    if (total > 0) {
      normalizedTeamValue = (teamValue / total) * 100;
      normalizedOpponentValue = (opponentValue / total) * 100;
    } else {
      normalizedTeamValue = 50;
      normalizedOpponentValue = 50;
    }
  }

  const formatValue = (value: number) => {
    return isPercentage ? `${value}%` : `${value}${unit}`;
  };

  return (
    <div className="mb-4">
      <div className="text-gray-600 text-sm font-medium mb-1">{label}</div>
      <div className="relative h-8 bg-gray-200 rounded overflow-hidden">
        <div 
          className="absolute left-0 top-0 h-full transition-all duration-500 ease-out"
          style={{ 
            width: `${normalizedTeamValue}%`,
            backgroundColor: teamColor
          }}
        />
        <div 
          className="absolute right-0 top-0 h-full transition-all duration-500 ease-out"
          style={{ 
            width: `${normalizedOpponentValue}%`,
            backgroundColor: opponentColor
          }}
        />
        <div className="absolute left-1/2 top-0 h-full w-0.5 bg-white transform -translate-x-0.5 z-10" />
      </div>
      <div className="flex justify-between items-center text-xs mt-1">
        <div className="font-semibold" style={{ color: teamColor }}>
          {formatValue(teamValue)}
        </div>
        <div className="font-semibold" style={{ color: opponentColor }}>
          {formatValue(opponentValue)}
        </div>
      </div>
    </div>
  );
}

export function MatchReportPDF({ 
  fixture, 
  teamStats, 
  opponentStats, 
  teamLogoPath, 
  opponentLogoPath, 
  clubName = "Home Team",
  teamColor = "#dc2626",
  opponentColor = "#6b7280"
}: MatchReportPDFProps) {
  const isHomeMatch = fixture.type === 'HOME';
  const teamScore = isHomeMatch ? (fixture.homeScore || 0) : (fixture.awayScore || 0);
  const opponentScore = isHomeMatch ? (fixture.awayScore || 0) : (fixture.homeScore || 0);

  const metricCategories = [
    {
      name: "Key",
      metrics: [
        {
          label: "Total Team Distance",
          teamValue: Math.round((teamStats?.totalTeamDistance || 0) / 1000), // Convert to km
          opponentValue: Math.round((opponentStats?.totalTeamDistance || 0) / 1000),
          unit: "km",
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
      name: "Attack",
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
          label: "Corner Kicks",
          teamValue: teamStats?.corners || 0,
          opponentValue: opponentStats?.corners || 0,
        },
      ]
    },
    {
      name: "Possession",
      metrics: [
        {
          label: "Take Ons",
          teamValue: teamStats?.takeOns || 0,
          opponentValue: opponentStats?.takeOns || 0,
        },
        {
          label: "Pass Accuracy",
          teamValue: teamStats?.passingSuccessRate || 0,
          opponentValue: opponentStats?.passingSuccessRate || 0,
          unit: "%",
          isPercentage: true,
        },
        {
          label: "First Touch Success",
          teamValue: teamStats?.firstTouchSuccessRate || 0,
          opponentValue: opponentStats?.firstTouchSuccessRate || 0,
          unit: "%",
          isPercentage: true,
        },
      ]
    },
    {
      name: "Defense",
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
      name: "Passing",
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
          label: "Dangerous Crosses",
          teamValue: teamStats?.dangerousCrosses || 0,
          opponentValue: opponentStats?.dangerousCrosses || 0,
        },
      ]
    }
  ];

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header with team info and score */}
      <div className="relative h-32 rounded-2xl overflow-hidden shadow-lg mb-8">
        {/* Team side */}
        <div 
          className="absolute inset-0"
          style={{ 
            clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)',
            background: `linear-gradient(to bottom right, ${teamColor}, ${teamColor}dd, #000000)`
          }}
        />
        
        {/* Opponent side */}
        <div 
          className="absolute inset-0"
          style={{ 
            clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)',
            background: `linear-gradient(to bottom left, ${opponentColor}, ${opponentColor}dd, #000000)`
          }}
        />
        
        {/* Content overlay */}
        <div className="relative z-10 h-full flex items-center px-8">
          {/* Team section */}
          <div className="flex items-center space-x-4 text-white flex-1">
            {teamLogoPath ? (
              <img 
                src={teamLogoPath} 
                alt={`${clubName} logo`}
                className="w-20 h-20 object-contain"
              />
            ) : (
              <div className="w-20 h-20 flex items-center justify-center">
                <span className="text-white font-bold text-xs">{clubName.split(' ').slice(0, 2).join(' ')}</span>
              </div>
            )}
            <div>
              <div className="text-2xl font-bold">{clubName}</div>
              <div className="text-white/80 text-sm">{fixture.type === 'HOME' ? 'HOME' : 'AWAY'}</div>
            </div>
          </div>
          
          {/* Center score */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-2xl px-6 py-4 border-2 shadow-2xl" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
            <div className="flex items-center space-x-4">
              <div className="text-3xl font-bold" style={{ color: teamColor }}>{teamScore}</div>
              <div className="text-2xl font-light text-gray-500">-</div>
              <div className="text-3xl font-bold" style={{ color: opponentColor }}>{opponentScore}</div>
            </div>
            <div className="text-xs text-gray-500 text-center mt-1">FT</div>
          </div>
          
          {/* Opponent section */}
          <div className="flex items-center space-x-4 text-white flex-1 justify-end">
            <div className="text-right">
              <div className="text-2xl font-bold">{fixture.opponent}</div>
              <div className="text-white/80 text-sm">{fixture.type === 'HOME' ? 'AWAY' : 'HOME'}</div>
            </div>
            {opponentLogoPath ? (
              <img 
                src={opponentLogoPath} 
                alt={`${fixture.opponent} logo`}
                className="w-20 h-20 object-contain"
              />
            ) : (
              <div className="w-20 h-20 flex items-center justify-center">
                <span className="font-bold text-lg text-white">{fixture.opponent.split(' ').map(word => word[0]).join('').slice(0, 3)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Match Statistics */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Match Statistics</h2>
        
        <div className="grid grid-cols-5 gap-8">
          {metricCategories.map((category, index) => (
            <div key={category.name}>
              <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">{category.name}</h3>
              {category.metrics.map((metric) => (
                <MetricBar
                  key={metric.label}
                  label={metric.label}
                  teamValue={metric.teamValue}
                  opponentValue={metric.opponentValue}
                  teamColor={teamColor}
                  opponentColor={opponentColor}
                  unit={metric.unit}
                  isPercentage={metric.isPercentage}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 text-sm">
        <p>Match Report • {format(new Date(fixture.date), 'MMM dd, yyyy')}</p>
        <p className="mt-1">Generated by GameScope Analytics</p>
      </div>
    </div>
  );
}