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
      <div className="bg-card border rounded-2xl overflow-hidden">
        {/* Thin accent bar */}
        <div className="h-1 w-full" style={{
          background: `linear-gradient(to right, ${polkStateColor} 50%, ${oppositionColor} 50%)`
        }} />

        <div className="flex items-center px-6 py-4 gap-4">
          {/* Home team */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {teamLogoPath ? (
              <img
                src={teamLogoPath}
                alt={`${clubName} logo`}
                className="w-12 h-12 object-contain shrink-0"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                style={{ backgroundColor: polkStateColor }}
              >
                {clubName.split(' ').map(w => w[0]).join('').slice(0, 3)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-base font-bold text-foreground leading-tight truncate">{clubName}</p>
              <p className="text-xs text-muted-foreground">{homeLabel}</p>
            </div>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center gap-0.5 shrink-0 px-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold tabular-nums" style={{ color: polkStateColor }}>
                {homeScore}
              </span>
              <span className="text-xl font-light text-muted-foreground">–</span>
              <span className="text-3xl font-bold tabular-nums" style={{ color: oppositionColor }}>
                {awayScore}
              </span>
            </div>
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">FT</span>
          </div>

          {/* Away team */}
          <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
            <div className="min-w-0 text-right">
              <p className="text-base font-bold text-foreground leading-tight truncate">{fixture.opponent}</p>
              <p className="text-xs text-muted-foreground">{awayLabel}</p>
            </div>
            {opponentLogoPath ? (
              <img
                src={opponentLogoPath}
                alt={`${fixture.opponent} logo`}
                className="w-12 h-12 object-contain shrink-0"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
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
