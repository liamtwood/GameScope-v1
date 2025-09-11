import { Fixture } from "@shared/schema";

interface MatchScoreBannerProps {
  fixture: Fixture;
  teamLogoPath?: string;
  opponentLogoPath?: string;
  polkStateColor?: string;
  oppositionColor?: string;
  primaryColor?: string;
  clubName?: string;
}

export function MatchScoreBanner({ 
  fixture, 
  teamLogoPath, 
  opponentLogoPath, 
  polkStateColor = '#CC4125', 
  oppositionColor = '#6b7280',
  primaryColor = '#CC4125',
  clubName = 'Florida College'
}: MatchScoreBannerProps) {
  return (
    <div className="mb-6">
      {/* Main header container with vertical split */}
      <div className="relative h-32 rounded-2xl overflow-hidden shadow-lg">
        {/* POLK side - club color gradient */}
        <div className="absolute inset-0 to-black" 
             style={{ 
               clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)',
               background: `linear-gradient(to bottom right, ${polkStateColor}, ${polkStateColor}dd, #000000)`
             }}>
        </div>
        
        {/* Opponent side - opposition color */}
        <div className="absolute inset-0" 
             style={{ 
               clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)',
               background: `linear-gradient(to bottom left, ${oppositionColor}, ${oppositionColor}dd, #000000)`
             }}>
        </div>
        
        {/* Content overlay */}
        <div className="relative z-10 h-full flex items-center px-8">
          {/* POLK section */}
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
          
          {/* Center score - absolutely centered */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-2xl px-6 py-4 border-2 shadow-2xl drop-shadow-lg" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
            <div className="flex items-center space-x-4">
              <div className="text-3xl font-bold" style={{ color: primaryColor }}>{fixture.type === 'HOME' ? (fixture.homeScore || 0) : (fixture.awayScore || 0)}</div>
              <div className="text-2xl font-light text-muted-foreground">-</div>
              <div className="text-3xl font-bold" style={{ color: primaryColor }}>{fixture.type === 'HOME' ? (fixture.awayScore || 0) : (fixture.homeScore || 0)}</div>
            </div>
            <div className="text-xs text-muted-foreground text-center mt-1">FT</div>
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
                <span className="font-bold text-lg" style={{ color: primaryColor }}>{fixture.opponent.split(' ').map(word => word[0]).join('').slice(0, 3)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}