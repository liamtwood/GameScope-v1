import { Fixture, Team, Club, OppositionTeam } from "@shared/schema";

interface FixtureResultHeaderProps {
  fixture: Fixture;
  team: Team;
  club: Club;
  oppositionTeam?: OppositionTeam;
}

export function FixtureResultHeader({ fixture, team, club, oppositionTeam }: FixtureResultHeaderProps) {
  const isHomeMatch = fixture.type === 'HOME';
  const homeTeam = isHomeMatch ? team.name : fixture.opponent;
  const awayTeam = isHomeMatch ? fixture.opponent : team.name;
  
  // Default colors if not set
  const teamColors = (team.colors as any) || { primary: '#d73a49', secondary: '#ffffff' };
  const clubColors = (club.colors as any) || { primary: '#d73a49', secondary: '#ffffff' };
  
  // Use team colors, fall back to club colors
  const primaryColor = teamColors.primary || clubColors.primary || '#d73a49';
  const secondaryColor = teamColors.secondary || clubColors.secondary || '#ffffff';
  
  const homeScore = fixture.homeScore;
  const awayScore = fixture.awayScore;
  
  const showScore = fixture.status === 'COMPLETED' && homeScore !== undefined && homeScore !== null && awayScore !== undefined && awayScore !== null;

  return (
    <div className="w-full h-20 relative overflow-hidden rounded-lg" style={{ backgroundColor: primaryColor }}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute right-0 top-0 bottom-0 w-1/2" style={{
          background: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 8px,
            ${secondaryColor} 8px,
            ${secondaryColor} 10px
          )`
        }} />
      </div>
      
      {/* Content */}
      <div className="relative h-full flex items-center justify-between px-6">
        {/* Home Team */}
        <div className="flex items-center space-x-3 flex-1">
          {/* Team Logo/Icon - Home */}
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            {isHomeMatch ? (
              <span className="text-white font-bold text-sm">PSC</span>
            ) : (
              <span className="text-white font-bold text-sm">
                {oppositionTeam?.shortName || fixture.opponent.substring(0, 3).toUpperCase()}
              </span>
            )}
          </div>
          
          <div className="flex-1">
            <div className="text-white font-semibold text-lg leading-tight">{homeTeam}</div>
            <div className="text-white/80 text-sm">{isHomeMatch ? 'HOME' : 'AWAY'}</div>
          </div>
        </div>

        {/* Score */}
        {showScore ? (
          <div className="bg-white/90 rounded-lg px-4 py-2 mx-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl font-bold text-gray-800">{homeScore}</span>
              <span className="text-lg font-medium text-gray-600">-</span>
              <span className="text-2xl font-bold text-gray-800">{awayScore}</span>
            </div>
            <div className="text-xs text-gray-500 text-center mt-1">FT</div>
          </div>
        ) : (
          <div className="bg-white/90 rounded-lg px-4 py-2 mx-4">
            <div className="text-sm font-medium text-gray-700">
              {fixture.status === 'SCHEDULED' ? 'SCHEDULED' : fixture.status}
            </div>
          </div>
        )}

        {/* Away Team */}
        <div className="flex items-center space-x-3 flex-1 justify-end">
          <div className="flex-1 text-right">
            <div className="text-white font-semibold text-lg leading-tight">{awayTeam}</div>
            <div className="text-white/80 text-sm">{isHomeMatch ? 'AWAY' : 'HOME'}</div>
          </div>
          
          {/* Team Logo/Icon - Away */}
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            {!isHomeMatch ? (
              <span className="text-white font-bold text-sm">PSC</span>
            ) : (
              <span className="text-white font-bold text-sm">
                {oppositionTeam?.shortName || fixture.opponent.substring(0, 3).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}