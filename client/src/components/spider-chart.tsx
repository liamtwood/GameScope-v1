import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

interface SpiderChartData {
  metric: string;
  team: number;
  opponent: number;
  fullMark: number;
}

interface SpiderChartProps {
  data: SpiderChartData[];
  teamName: string;
  opponentName: string;
  title: string;
  teamColor?: string;
  opponentColor?: string;
}

export function SpiderChart({ 
  data, 
  teamName, 
  opponentName, 
  title,
  teamColor = "#dc2626", // Red for POLK
  opponentColor = "#64748b" // Gray for opponent
}: SpiderChartProps) {
  return (
    <div className="w-full h-96 flex flex-col items-center">
      <h4 className="text-lg font-semibold mb-4 text-center">{title}</h4>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 40, right: 80, bottom: 40, left: 80 }}>
          <PolarGrid />
          <PolarAngleAxis 
            dataKey="metric" 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            className="text-xs"
            tickFormatter={(value) => value}
            tickSize={20}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 'dataMax']}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickCount={5}
          />
          <Radar
            name={teamName}
            dataKey="team"
            stroke={teamColor}
            fill={teamColor}
            fillOpacity={0.3}
            strokeWidth={2}
            dot={{ r: 4, fill: teamColor }}
          />
          <Radar
            name={opponentName}
            dataKey="opponent"
            stroke={opponentColor}
            fill={opponentColor}
            fillOpacity={0.1}
            strokeWidth={2}
            dot={{ r: 4, fill: opponentColor }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}