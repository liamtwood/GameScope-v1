interface PossessionChartProps {
  teamName: string;
  opponentName: string;
  teamPossession: number;
  opponentPossession: number;
}

export function PossessionChart({ teamName, opponentName, teamPossession, opponentPossession }: PossessionChartProps) {
  // Ensure percentages add up to 100
  const totalPossession = teamPossession + opponentPossession;
  const normalizedTeamPossession = totalPossession > 0 ? (teamPossession / totalPossession) * 100 : 50;
  const normalizedOpponentPossession = 100 - normalizedTeamPossession;

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-center">Ball Possession</h4>
      
      {/* Horizontal bar chart */}
      <div className="relative w-full h-12 bg-gray-200 rounded-lg overflow-hidden">
        {/* Team side (left) */}
        <div 
          className="absolute left-0 top-0 h-full bg-red-500 transition-all duration-500 ease-out"
          style={{ width: `${normalizedTeamPossession}%` }}
        />
        
        {/* Opponent side (right) */}
        <div 
          className="absolute right-0 top-0 h-full bg-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${normalizedOpponentPossession}%` }}
        />
        
        {/* Center divider line */}
        <div className="absolute left-1/2 top-0 h-full w-0.5 bg-white transform -translate-x-0.5 z-10" />
      </div>
      
      {/* Labels and percentages */}
      <div className="flex justify-between items-center">
        <div className="text-left">
          <div className="font-semibold text-red-600">{teamName}</div>
          <div className="text-2xl font-bold">{teamPossession}%</div>
        </div>
        
        <div className="text-center text-muted-foreground text-sm">
          vs
        </div>
        
        <div className="text-right">
          <div className="font-semibold text-blue-600">{opponentName}</div>
          <div className="text-2xl font-bold">{opponentPossession}%</div>
        </div>
      </div>
    </div>
  );
}