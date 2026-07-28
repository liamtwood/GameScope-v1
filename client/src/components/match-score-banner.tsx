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
  const homeScore = fixture.type === 'HOME' ? (fixture.homeScore ?? 0) : (fixture.awayScore ?? 0);
  const awayScore = fixture.type === 'HOME' ? (fixture.awayScore ?? 0) : (fixture.homeScore ?? 0);
  const homeLabel = fixture.type === 'HOME' ? 'Home' : 'Away';
  const awayLabel = fixture.type === 'HOME' ? 'Away' : 'Home';

  return (
    <div className="mb-6">
      <div className="h-32 rounded-2xl overflow-hidden shadow-lg relative">
        {/* Left half — club colour fading to black */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${polkStateColor} 0%, #000000 100%)`,
            clipPath: 'polygon(0 0, 50% 0, 45% 100%, 0 100%)',
          }}
        />
        {/* Right half — opposition colour fading to black */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(225deg, ${oppositionColor} 0%, #000000 100%)`,
            clipPath: 'polygon(55% 0, 100% 0, 100% 100%, 50% 100%)',
          }}
        />
        {/* Dark centre fill */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, transparent 40%, #000000 50%, transparent 60%)',
          }}
        />

        {/* Content row */}
        <div className="absolute inset-0 flex items-center px-6">
          {/* Home team */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {teamLogoPath ? (
              <img
                src={teamLogoPath}
                alt={`${clubName} logo`}
                className="w-12 h-12 object-contain drop-shadow-lg shrink-0"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-lg"
                style={{ backgroundColor: polkStateColor }}
              >
                {clubName.split(' ').map(w => w[0]).join('').slice(0, 3)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white font-bold text-base leading-tight drop-shadow truncate">{clubName}</p>
              <p className="text-white/60 text-xs">{homeLabel}</p>
            </div>
          </div>

          {/* Score box */}
          <div className="flex flex-col items-center shrink-0 px-4">
            <div
              className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-2 shadow-2xl drop-shadow-lg"
            >
              <span className="text-4xl font-black tabular-nums text-white drop-shadow-lg">
                {homeScore}
              </span>
              <span className="text-2xl font-light text-white/50">–</span>
              <span className="text-4xl font-black tabular-nums text-white drop-shadow-lg">
                {awayScore}
              </span>
            </div>
            <span className="text-[10px] font-semibold tracking-widest text-white/50 uppercase mt-1">FT</span>
          </div>

          {/* Away team */}
          <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
            <div className="min-w-0 text-right">
              <p className="text-white font-bold text-base leading-tight drop-shadow truncate">{fixture.opponent}</p>
              <p className="text-white/60 text-xs">{awayLabel}</p>
            </div>
            {opponentLogoPath ? (
              <img
                src={opponentLogoPath}
                alt={`${fixture.opponent} logo`}
                className="w-12 h-12 object-contain drop-shadow-lg shrink-0"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-lg"
                style={{ backgroundColor: oppositionColor }}
              >
                {fixture.opponent.split(' ').map(w => w[0]).join('').slice(0, 3)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
