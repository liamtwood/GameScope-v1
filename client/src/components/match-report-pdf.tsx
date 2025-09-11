import { Fixture, MatchStats } from "@shared/schema";
import { format } from "date-fns";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend } from 'recharts';

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

interface SpiderChartProps {
  data: any[];
  teamName: string;
  opponentName: string;
  teamColor: string;
  opponentColor: string;
}

function SpiderChartComponent({ data, teamName, opponentName, teamColor, opponentColor }: SpiderChartProps) {
  return (
    <div style={{ width: '100%', height: '280px', background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis 
            dataKey="metric" 
            tick={{ fontSize: 10, fill: '#64748b' }}
            className="text-xs"
          />
          <Radar
            name={teamName}
            dataKey="team"
            stroke={teamColor}
            fill={teamColor}
            fillOpacity={0.1}
            strokeWidth={2}
            dot={{ fill: teamColor, strokeWidth: 2, r: 3 }}
          />
          <Radar
            name={opponentName}
            dataKey="opponent"
            stroke={opponentColor}
            fill={opponentColor}
            fillOpacity={0.1}
            strokeWidth={2}
            dot={{ fill: opponentColor, strokeWidth: 2, r: 3 }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
            iconType="line"
          />
        </RadarChart>
      </ResponsiveContainer>
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
  teamColor = "#c94b4b",
  opponentColor = "#d4a000"
}: MatchReportPDFProps) {
  const isHomeMatch = fixture.type === 'HOME';
  const teamScore = isHomeMatch ? (fixture.homeScore || 0) : (fixture.awayScore || 0);
  const opponentScore = isHomeMatch ? (fixture.awayScore || 0) : (fixture.homeScore || 0);

  // Debug logging - remove after testing
  console.log('MatchReportPDF - teamStats:', teamStats);
  console.log('MatchReportPDF - opponentStats:', opponentStats);

  // Helper function to normalize values for spider chart
  const normalizeValue = (value: number, max: number) => {
    if (max === 0) return 0;
    return Math.min(100, (value / max) * 100);
  };

  // Attack Performance Data
  const maxAttackValues = {
    goals: Math.max(teamStats?.goals || 0, opponentStats?.goals || 0, 5),
    shotsAttempted: Math.max(teamStats?.shotsAttempted || 0, opponentStats?.shotsAttempted || 0, 20),
    shotsOnTarget: Math.max(teamStats?.shotsOnTarget || 0, opponentStats?.shotsOnTarget || 0, 10),
    corners: Math.max(teamStats?.corners || 0, opponentStats?.corners || 0, 10),
    dangerousCrosses: Math.max(teamStats?.dangerousCrosses || 0, opponentStats?.dangerousCrosses || 0, 10),
  };

  const attackData = [
    {
      metric: 'Goals',
      team: normalizeValue(teamStats?.goals || 0, maxAttackValues.goals),
      opponent: normalizeValue(opponentStats?.goals || 0, maxAttackValues.goals),
    },
    {
      metric: 'Shots',
      team: normalizeValue(teamStats?.shotsAttempted || 0, maxAttackValues.shotsAttempted),
      opponent: normalizeValue(opponentStats?.shotsAttempted || 0, maxAttackValues.shotsAttempted),
    },
    {
      metric: 'On Target',
      team: normalizeValue(teamStats?.shotsOnTarget || 0, maxAttackValues.shotsOnTarget),
      opponent: normalizeValue(opponentStats?.shotsOnTarget || 0, maxAttackValues.shotsOnTarget),
    },
    {
      metric: 'Corners',
      team: normalizeValue(teamStats?.corners || 0, maxAttackValues.corners),
      opponent: normalizeValue(opponentStats?.corners || 0, maxAttackValues.corners),
    },
    {
      metric: 'Crosses',
      team: normalizeValue(teamStats?.dangerousCrosses || 0, maxAttackValues.dangerousCrosses),
      opponent: normalizeValue(opponentStats?.dangerousCrosses || 0, maxAttackValues.dangerousCrosses),
    },
  ];

  // Possession Performance Data
  const possessionData = [
    {
      metric: 'Possession',
      team: teamStats?.possession || 0,
      opponent: opponentStats?.possession || 0,
    },
    {
      metric: 'Pass Acc.',
      team: teamStats?.passingSuccessRate || 0,
      opponent: opponentStats?.passingSuccessRate || 0,
    },
    {
      metric: 'First Touch',
      team: teamStats?.firstTouchSuccessRate || 0,
      opponent: opponentStats?.firstTouchSuccessRate || 0,
    },
    {
      metric: 'Take Ons',
      team: normalizeValue(teamStats?.takeOns || 0, Math.max(teamStats?.takeOns || 0, opponentStats?.takeOns || 0, 20)),
      opponent: normalizeValue(opponentStats?.takeOns || 0, Math.max(teamStats?.takeOns || 0, opponentStats?.takeOns || 0, 20)),
    },
    {
      metric: 'Passes',
      team: normalizeValue(teamStats?.passesSuccess || 0, Math.max(teamStats?.passesSuccess || 0, opponentStats?.passesSuccess || 0, 500)),
      opponent: normalizeValue(opponentStats?.passesSuccess || 0, Math.max(teamStats?.passesSuccess || 0, opponentStats?.passesSuccess || 0, 500)),
    },
  ];

  // Technical Performance Data
  const technicalData = [
    {
      metric: 'Distance',
      team: normalizeValue((teamStats?.totalTeamDistance || 0) / 1000, Math.max((teamStats?.totalTeamDistance || 0) / 1000, (opponentStats?.totalTeamDistance || 0) / 1000, 50)),
      opponent: normalizeValue((opponentStats?.totalTeamDistance || 0) / 1000, Math.max((teamStats?.totalTeamDistance || 0) / 1000, (opponentStats?.totalTeamDistance || 0) / 1000, 50)),
    },
    {
      metric: 'Tackles',
      team: normalizeValue(teamStats?.tackles || 0, Math.max(teamStats?.tackles || 0, opponentStats?.tackles || 0, 20)),
      opponent: normalizeValue(opponentStats?.tackles || 0, Math.max(teamStats?.tackles || 0, opponentStats?.tackles || 0, 20)),
    },
    {
      metric: 'Free Kicks',
      team: normalizeValue(teamStats?.freeKicks || 0, Math.max(teamStats?.freeKicks || 0, opponentStats?.freeKicks || 0, 20)),
      opponent: normalizeValue(opponentStats?.freeKicks || 0, Math.max(teamStats?.freeKicks || 0, opponentStats?.freeKicks || 0, 20)),
    },
    {
      metric: 'Offsides',
      team: normalizeValue(teamStats?.offsides || 0, Math.max(teamStats?.offsides || 0, opponentStats?.offsides || 0, 10)),
      opponent: normalizeValue(opponentStats?.offsides || 0, Math.max(teamStats?.offsides || 0, opponentStats?.offsides || 0, 10)),
    },
    {
      metric: 'Avg Pass Dist',
      team: normalizeValue((teamStats?.passingAverageDistance || 0) / 10, Math.max((teamStats?.passingAverageDistance || 0) / 10, (opponentStats?.passingAverageDistance || 0) / 10, 30)),
      opponent: normalizeValue((opponentStats?.passingAverageDistance || 0) / 10, Math.max((teamStats?.passingAverageDistance || 0) / 10, (opponentStats?.passingAverageDistance || 0) / 10, 30)),
    },
  ];

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      background: 'white',
      borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      overflow: 'hidden',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    },
    header: {
      background: `linear-gradient(90deg, ${teamColor} 0%, ${teamColor} 45%, ${opponentColor} 55%, ${opponentColor} 100%)`,
      padding: '30px',
      textAlign: 'center' as const,
      position: 'relative' as const,
    },
    scoreDisplay: {
      background: 'white',
      display: 'inline-block',
      padding: '15px 40px',
      borderRadius: '50px',
      fontSize: '36px',
      fontWeight: 'bold',
      color: '#333',
      boxShadow: '0 5px 20px rgba(0,0,0,0.2)',
    },
    teamName: {
      position: 'absolute' as const,
      top: '50%',
      transform: 'translateY(-50%)',
      fontSize: '24px',
      fontWeight: 'bold',
      color: 'white',
    },
    content: {
      padding: '40px',
    },
    section: {
      marginBottom: '40px',
    },
    sectionTitle: {
      fontSize: '28px',
      color: '#333',
      borderBottom: '3px solid #667eea',
      paddingBottom: '10px',
      marginBottom: '30px',
    },
    overviewStats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '20px',
      marginBottom: '40px',
    },
    statCard: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '20px',
      borderRadius: '10px',
      textAlign: 'center' as const,
    },
    chartSection: {
      background: '#f8f9fa',
      borderRadius: '15px',
      padding: '30px',
      marginBottom: '30px',
    },
    chartContainer: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '30px',
      alignItems: 'center',
    },
    dataTable: {
      background: 'white',
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{...styles.teamName, left: '30px', display: 'flex', alignItems: 'center', gap: '10px'}}>
          {teamLogoPath && (
            <img 
              src={teamLogoPath} 
              alt={`${clubName} logo`}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid white'
              }}
            />
          )}
          {clubName}
        </div>
        <div style={styles.scoreDisplay}>
          {teamScore} - {opponentScore}
        </div>
        <div style={{...styles.teamName, right: '30px', display: 'flex', alignItems: 'center', gap: '10px', flexDirection: 'row-reverse'}}>
          {opponentLogoPath && (
            <img 
              src={opponentLogoPath} 
              alt={`${fixture.opponent} logo`}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid white'
              }}
            />
          )}
          {fixture.opponent}
        </div>
      </div>

      <div style={styles.content}>
        {/* Match Overview */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Match Overview</h2>
          <div style={styles.overviewStats}>
            <div style={styles.statCard}>
              <div style={{fontSize: '32px', fontWeight: 'bold', marginBottom: '5px'}}>
                {teamStats?.possession || 0}%
              </div>
              <div style={{fontSize: '14px', opacity: 0.9}}>
                {clubName} Possession
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{fontSize: '32px', fontWeight: 'bold', marginBottom: '5px'}}>
                {Math.round((teamStats?.totalTeamDistance || 0) / 1000)} km
              </div>
              <div style={{fontSize: '14px', opacity: 0.9}}>
                {clubName} Distance
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{fontSize: '32px', fontWeight: 'bold', marginBottom: '5px'}}>
                {teamStats?.passingSuccessRate || 0}%
              </div>
              <div style={{fontSize: '14px', opacity: 0.9}}>
                {clubName} Pass Accuracy
              </div>
            </div>
          </div>
        </div>

        {/* Attack Performance Section */}
        <div style={styles.chartSection}>
          <h3 style={{fontSize: '20px', fontWeight: '600', color: '#333', marginBottom: '20px', textAlign: 'center'}}>
            Attack Performance
          </h3>
          <div style={styles.chartContainer}>
            <SpiderChartComponent 
              data={attackData} 
              teamName={clubName} 
              opponentName={fixture.opponent}
              teamColor={teamColor}
              opponentColor={opponentColor}
            />
            <div style={styles.dataTable}>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                  <tr>
                    <th style={{background: '#667eea', color: 'white', padding: '12px', textAlign: 'left', fontWeight: '600'}}>
                      Attack Metrics
                    </th>
                    <th style={{background: '#667eea', color: 'white', padding: '12px', textAlign: 'center', fontWeight: '600'}}>
                      {clubName}
                    </th>
                    <th style={{background: '#667eea', color: 'white', padding: '12px', textAlign: 'center', fontWeight: '600'}}>
                      {fixture.opponent}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: '500', color: '#555'}}>Goals</td>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 'bold', color: teamColor}}>{teamStats?.goals || 0}</td>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 'bold', color: opponentColor}}>{opponentStats?.goals || 0}</td>
                  </tr>
                  <tr>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: '500', color: '#555'}}>Shots Attempted</td>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 'bold', color: teamColor}}>{teamStats?.shotsAttempted || 0}</td>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 'bold', color: opponentColor}}>{opponentStats?.shotsAttempted || 0}</td>
                  </tr>
                  <tr>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: '500', color: '#555'}}>Shots on Target</td>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 'bold', color: teamColor}}>{teamStats?.shotsOnTarget || 0}</td>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 'bold', color: opponentColor}}>{opponentStats?.shotsOnTarget || 0}</td>
                  </tr>
                  <tr>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: '500', color: '#555'}}>Corner Kicks</td>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 'bold', color: teamColor}}>{teamStats?.corners || 0}</td>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 'bold', color: opponentColor}}>{opponentStats?.corners || 0}</td>
                  </tr>
                  <tr>
                    <td style={{padding: '10px 12px', fontWeight: '500', color: '#555'}}>Dangerous Crosses</td>
                    <td style={{padding: '10px 12px', textAlign: 'center', fontWeight: 'bold', color: teamColor}}>{teamStats?.dangerousCrosses || 0}</td>
                    <td style={{padding: '10px 12px', textAlign: 'center', fontWeight: 'bold', color: opponentColor}}>{opponentStats?.dangerousCrosses || 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Possession Performance Section */}
        <div style={styles.chartSection}>
          <h3 style={{fontSize: '20px', fontWeight: '600', color: '#333', marginBottom: '20px', textAlign: 'center'}}>
            Possession Performance
          </h3>
          <div style={styles.chartContainer}>
            <SpiderChartComponent 
              data={possessionData} 
              teamName={clubName} 
              opponentName={fixture.opponent}
              teamColor={teamColor}
              opponentColor={opponentColor}
            />
            <div style={styles.dataTable}>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                  <tr>
                    <th style={{background: '#667eea', color: 'white', padding: '12px', textAlign: 'left', fontWeight: '600'}}>
                      Possession Metrics
                    </th>
                    <th style={{background: '#667eea', color: 'white', padding: '12px', textAlign: 'center', fontWeight: '600'}}>
                      {clubName}
                    </th>
                    <th style={{background: '#667eea', color: 'white', padding: '12px', textAlign: 'center', fontWeight: '600'}}>
                      {fixture.opponent}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: '500', color: '#555'}}>Possession %</td>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 'bold', color: teamColor}}>{teamStats?.possession || 0}%</td>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 'bold', color: opponentColor}}>{opponentStats?.possession || 0}%</td>
                  </tr>
                  <tr>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: '500', color: '#555'}}>Pass Accuracy %</td>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 'bold', color: teamColor}}>{teamStats?.passingSuccessRate || 0}%</td>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 'bold', color: opponentColor}}>{opponentStats?.passingSuccessRate || 0}%</td>
                  </tr>
                  <tr>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: '500', color: '#555'}}>First Touch %</td>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 'bold', color: teamColor}}>{teamStats?.firstTouchSuccessRate || 0}%</td>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 'bold', color: opponentColor}}>{opponentStats?.firstTouchSuccessRate || 0}%</td>
                  </tr>
                  <tr>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: '500', color: '#555'}}>Take Ons</td>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 'bold', color: teamColor}}>{teamStats?.takeOns || 0}</td>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 'bold', color: opponentColor}}>{opponentStats?.takeOns || 0}</td>
                  </tr>
                  <tr>
                    <td style={{padding: '10px 12px', fontWeight: '500', color: '#555'}}>Passes Success</td>
                    <td style={{padding: '10px 12px', textAlign: 'center', fontWeight: 'bold', color: teamColor}}>{teamStats?.passesSuccess || 0}</td>
                    <td style={{padding: '10px 12px', textAlign: 'center', fontWeight: 'bold', color: opponentColor}}>{opponentStats?.passesSuccess || 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Technical Performance Section */}
        <div style={styles.chartSection}>
          <h3 style={{fontSize: '20px', fontWeight: '600', color: '#333', marginBottom: '20px', textAlign: 'center'}}>
            Technical Performance
          </h3>
          <div style={styles.chartContainer}>
            <SpiderChartComponent 
              data={technicalData} 
              teamName={clubName} 
              opponentName={fixture.opponent}
              teamColor={teamColor}
              opponentColor={opponentColor}
            />
            <div style={styles.dataTable}>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                  <tr>
                    <th style={{background: '#667eea', color: 'white', padding: '12px', textAlign: 'left', fontWeight: '600'}}>
                      Technical Metrics
                    </th>
                    <th style={{background: '#667eea', color: 'white', padding: '12px', textAlign: 'center', fontWeight: '600'}}>
                      {clubName}
                    </th>
                    <th style={{background: '#667eea', color: 'white', padding: '12px', textAlign: 'center', fontWeight: '600'}}>
                      {fixture.opponent}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: '500', color: '#555'}}>Total Distance (km)</td>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 'bold', color: teamColor}}>{Math.round((teamStats?.totalTeamDistance || 0) / 1000)}</td>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 'bold', color: opponentColor}}>{Math.round((opponentStats?.totalTeamDistance || 0) / 1000)}</td>
                  </tr>
                  <tr>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: '500', color: '#555'}}>Tackles</td>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 'bold', color: teamColor}}>{teamStats?.tackles || 0}</td>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 'bold', color: opponentColor}}>{opponentStats?.tackles || 0}</td>
                  </tr>
                  <tr>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: '500', color: '#555'}}>Free Kicks</td>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 'bold', color: teamColor}}>{teamStats?.freeKicks || 0}</td>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 'bold', color: opponentColor}}>{opponentStats?.freeKicks || 0}</td>
                  </tr>
                  <tr>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: '500', color: '#555'}}>Offsides</td>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 'bold', color: teamColor}}>{teamStats?.offsides || 0}</td>
                    <td style={{padding: '10px 12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 'bold', color: opponentColor}}>{opponentStats?.offsides || 0}</td>
                  </tr>
                  <tr>
                    <td style={{padding: '10px 12px', fontWeight: '500', color: '#555'}}>Avg Pass Distance (m)</td>
                    <td style={{padding: '10px 12px', textAlign: 'center', fontWeight: 'bold', color: teamColor}}>{teamStats?.passingAverageDistance || 0}</td>
                    <td style={{padding: '10px 12px', textAlign: 'center', fontWeight: 'bold', color: opponentColor}}>{opponentStats?.passingAverageDistance || 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{textAlign: 'center', color: '#6b7280', fontSize: '14px', paddingTop: '20px', borderTop: '1px solid #e5e7eb'}}>
          <p>Match Report • {format(new Date(fixture.date), 'MMM dd, yyyy')}</p>
          <p style={{marginTop: '5px'}}>Generated by GameScope Analytics</p>
        </div>
      </div>
    </div>
  );
}