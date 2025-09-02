import { Fixture, Team, Club, OppositionTeam } from "@shared/schema";

interface SharedScoreBannerProps {
  fixture: Fixture;
  team: Team;
  club: Club;
  oppositionTeam?: OppositionTeam;
}

export function SharedScoreBanner({ fixture, team, club, oppositionTeam }: SharedScoreBannerProps) {
  const isHomeMatch = fixture.type === 'HOME';
  
  // Layout: Always show our team (Polk State College) on LEFT, opponent on RIGHT
  // This matches GameScope Analysis where PSC is always on the left
  const leftTeam = team.name; // Always Polk State College
  const rightTeam = fixture.opponent; // Always the opponent
  const leftTeamType = isHomeMatch ? 'HOME' : 'AWAY';
  const rightTeamType = isHomeMatch ? 'AWAY' : 'HOME';
  
  // Default colors - using the exact red from the image
  const teamColors = (team.colors as any) || { primary: '#CC4125', secondary: '#ffffff' };
  const clubColors = (club.colors as any) || { primary: '#CC4125', secondary: '#ffffff' };
  
  // Use team colors, fall back to club colors
  const primaryColor = teamColors.primary || clubColors.primary || '#CC4125';
  
  // Scores: Show as Away - Home to match the layout
  const leftScore = isHomeMatch ? fixture.homeScore : fixture.awayScore;  // PSC score
  const rightScore = isHomeMatch ? fixture.awayScore : fixture.homeScore; // Opponent score
  
  const showScore = fixture.status === 'COMPLETED' && 
    leftScore !== undefined && leftScore !== null && 
    rightScore !== undefined && rightScore !== null;

  return (
    <div className="w-full h-16 relative overflow-hidden rounded-lg" style={{ 
      background: `linear-gradient(135deg, ${primaryColor} 0%, #B73A1C 50%, ${primaryColor} 100%)`
    }}>
      {/* Vertical Lines Pattern */}
      <div className="absolute inset-0">
        <div className="absolute right-0 top-0 bottom-0 w-3/5" style={{
          background: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 12px,
            rgba(255,255,255,0.15) 12px,
            rgba(255,255,255,0.15) 14px
          )`
        }} />
      </div>
      
      {/* Dark Gradient Overlay on Left */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-2/3"
        style={{
          background: `linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)`
        }}
      />
      
      {/* Content */}
      <div className="relative h-full flex items-center justify-between px-6">
        {/* Left Team (Always Polk State College) */}
        <div className="flex items-center space-x-4 flex-1">
          {/* PSC Logo - Always on Left */}
          <div className="w-8 h-8 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
              <div className="w-6 h-4 bg-white" style={{ 
                clipPath: 'polygon(0% 20%, 100% 0%, 80% 80%, 20% 100%)' 
              }} />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="text-white font-bold text-base leading-tight">{leftTeam}</div>
            <div className="text-white/90 text-xs font-medium">{leftTeamType}</div>
          </div>
        </div>

        {/* Score */}
        {showScore ? (
          <div className="bg-white rounded-lg px-3 py-2 mx-4 shadow-sm">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-xl font-bold text-gray-900">{leftScore}</span>
              <span className="text-lg font-medium text-gray-500">-</span>
              <span className="text-xl font-bold text-gray-900">{rightScore}</span>
            </div>
            <div className="text-xs text-gray-500 text-center leading-none">FT</div>
          </div>
        ) : (
          <div className="bg-white rounded-lg px-3 py-2 mx-4 shadow-sm">
            <div className="text-xs font-semibold text-gray-700 text-center">
              {fixture.status === 'SCHEDULED' ? 'SCHEDULED' : fixture.status}
            </div>
          </div>
        )}

        {/* Right Team (Always Opponent) */}
        <div className="flex items-center space-x-4 flex-1 justify-end">
          <div className="flex-1 text-right">
            <div className="text-white font-bold text-base leading-tight">{rightTeam}</div>
            <div className="text-white/90 text-xs font-medium">{rightTeamType}</div>
          </div>
          
          {/* Opponent Logo - Always on Right */}
          <div className="w-8 h-8 flex items-center justify-center">
            {oppositionTeam?.logoPath ? (
              <img 
                src={oppositionTeam.logoPath} 
                alt={`${oppositionTeam.name} logo`}
                className="w-8 h-8 object-contain"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold text-xs">
                  {fixture.opponent.substring(0, 3).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}