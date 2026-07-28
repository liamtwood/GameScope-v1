import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpiderChart } from "@/components/spider-chart";
import { MetricsComparison } from "@/components/metrics-comparison";
import { VideoManager } from "@/components/video-manager";
import { FixtureEditDialog } from "@/components/dialogs/fixture-edit-dialog";
import { ExcelUpload } from "@/components/excel-upload";
import { MatchScoreBanner } from "@/components/match-score-banner";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Trophy, MapPin, Edit, Star, Check, X } from "lucide-react";
import { FormationPitch } from "@/components/FormationPitch";
import { Link } from "wouter";
import { format } from "date-fns";
import { Fixture, MatchStats, PlayerWithTeamData, Team, Club } from "@shared/schema";
import { useTeam } from "@/contexts/team-context";
import { useClub } from "@/contexts/club-context";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Analysis() {
  const [, params] = useRoute("/analysis/:fixtureId");
  const fixtureId = params?.fixtureId || "";
  const [isEditingReport, setIsEditingReport] = useState(false);
  const [editedReport, setEditedReport] = useState("");
  const [editedAttendance, setEditedAttendance] = useState<number | undefined>();
  const { toast } = useToast();
  
  // Get the tab query parameter from URL
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  const defaultTab = tabParam === 'videos' ? 'videos' : tabParam === 'positions' ? 'positions' : 'heatmaps';

  const { selectedTeam } = useTeam();
  const { selectedClub } = useClub();

  const { data: fixture, isLoading: fixtureLoading } = useQuery<Fixture>({
    queryKey: ["/api/fixture", fixtureId],
    enabled: !!fixtureId,
  });

  const { data: matchStats, isLoading: statsLoading } = useQuery<MatchStats[]>({
    queryKey: ["/api/match-stats", fixtureId],
    enabled: !!fixtureId,
  });

  const { data: oppositionTeams } = useQuery<any[]>({
    queryKey: ["/api/opposition-teams", selectedClub?.id],
    queryFn: async () => {
      const url = selectedClub?.id ? `/api/opposition-teams?clubId=${selectedClub.id}` : '/api/opposition-teams';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch opposition teams');
      return res.json();
    }
  });

  const { data: competitions } = useQuery<any[]>({
    queryKey: ["/api/competitions"],
  });

  const { data: teamPlayersData } = useQuery<any[]>({
    queryKey: ["/api/team", fixture?.teamId, "users"],
    enabled: !!fixture?.teamId,
  });

  // Fetch all teams + clubs so we can resolve the fixture team's club colour
  const { data: allTeams } = useQuery<any[]>({ queryKey: ["/api/teams"] });
  const { data: allClubs } = useQuery<any[]>({ queryKey: ["/api/clubs"] });
  const fixtureTeam = allTeams?.find((t: any) => t.id === fixture?.teamId);
  const fixtureClub = allClubs?.find((c: any) => c.id === fixtureTeam?.clubId);

  // Convert team players to the format expected
  const allPlayers = teamPlayersData?.map(tp => ({
    ...tp.user,
    id: tp.user.id,
    jerseyNumber: tp.jerseyNumber,
    position: tp.position,
    starPlayer: tp.starPlayer,
    fitnessStatus: tp.fitnessStatus
  })).sort((a, b) => (a.jerseyNumber || 999) - (b.jerseyNumber || 999)) || [];

  // Star players only (used by spider charts etc.)
  const players = allPlayers.filter(p => p.starPlayer);

  // Mutation for updating match report
  const updateReportMutation = useMutation({
    mutationFn: async (data: { report?: string; attendance?: number }) => {
      await apiRequest("PUT", `/api/fixtures/${fixtureId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fixture", fixtureId] });
      setIsEditingReport(false);
      toast({
        title: "Match report updated",
        description: "The match report has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update match report. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for toggling star player status
  const toggleStarPlayerMutation = useMutation({
    mutationFn: async ({ playerId, teamId, starPlayer }: { playerId: string; teamId: string; starPlayer: boolean }) => {
      await apiRequest("PATCH", `/api/player/${playerId}/team/${teamId}/star`, { starPlayer });
    },
    onSuccess: () => {
      // Invalidate and refetch the players data
      queryClient.invalidateQueries({ queryKey: ["/api/team", fixture?.teamId, "users"] });
    },
    onError: (error) => {
      console.error("Error updating star player status:", error);
    },
  });


  // Spider Chart Data Transformation Functions - Normalized to percentages
  const createAttackSpiderData = (teamStats: MatchStats | null, opponentStats?: MatchStats | null) => {
    const maxGoals = Math.max(teamStats?.goals || 0, opponentStats?.goals || 0, 1);
    const maxShotsAttempted = Math.max(teamStats?.shotsAttempted || 0, opponentStats?.shotsAttempted || 0, 1);
    const maxShotsOnTarget = Math.max(teamStats?.shotsOnTarget || 0, opponentStats?.shotsOnTarget || 0, 1);
    const maxRunsIntoBoxes = Math.max(teamStats?.runsIntoBoxes || 0, opponentStats?.runsIntoBoxes || 0, 1);
    const maxCorners = Math.max(teamStats?.corners || 0, opponentStats?.corners || 0, 1);
    const maxDangerousCrosses = Math.max(teamStats?.dangerousCrosses || 0, opponentStats?.dangerousCrosses || 0, 1);
    
    return [
      { metric: 'Goals', team: ((teamStats?.goals || 0) / maxGoals) * 100, opponent: ((opponentStats?.goals || 0) / maxGoals) * 100, fullMark: 100 },
      { metric: 'Shots Attempted', team: ((teamStats?.shotsAttempted || 0) / maxShotsAttempted) * 100, opponent: ((opponentStats?.shotsAttempted || 0) / maxShotsAttempted) * 100, fullMark: 100 },
      { metric: 'Shots On Target', team: ((teamStats?.shotsOnTarget || 0) / maxShotsOnTarget) * 100, opponent: ((opponentStats?.shotsOnTarget || 0) / maxShotsOnTarget) * 100, fullMark: 100 },
      { metric: 'Runs Into Boxes', team: ((teamStats?.runsIntoBoxes || 0) / maxRunsIntoBoxes) * 100, opponent: ((opponentStats?.runsIntoBoxes || 0) / maxRunsIntoBoxes) * 100, fullMark: 100 },
      { metric: 'Corners', team: ((teamStats?.corners || 0) / maxCorners) * 100, opponent: ((opponentStats?.corners || 0) / maxCorners) * 100, fullMark: 100 },
      { metric: 'Dangerous Crosses', team: ((teamStats?.dangerousCrosses || 0) / maxDangerousCrosses) * 100, opponent: ((opponentStats?.dangerousCrosses || 0) / maxDangerousCrosses) * 100, fullMark: 100 }
    ];
  };

  const createPossessionSpiderData = (teamStats: MatchStats | null, opponentStats?: MatchStats | null) => {
    const maxTakeOns = Math.max(teamStats?.takeOns || 0, opponentStats?.takeOns || 0, 1);
    const maxPassesSuccess = Math.max(teamStats?.passesSuccess || 0, opponentStats?.passesSuccess || 0, 1);
    
    return [
      { metric: 'Possession %', team: teamStats?.possession || 0, opponent: opponentStats?.possession || 0, fullMark: 100 },
      { metric: 'Pass Accuracy %', team: teamStats?.passingSuccessRate || 0, opponent: opponentStats?.passingSuccessRate || 0, fullMark: 100 },
      { metric: 'First Touch %', team: teamStats?.firstTouchSuccessRate || 0, opponent: opponentStats?.firstTouchSuccessRate || 0, fullMark: 100 },
      { metric: 'Take Ons', team: ((teamStats?.takeOns || 0) / maxTakeOns) * 100, opponent: ((opponentStats?.takeOns || 0) / maxTakeOns) * 100, fullMark: 100 },
      { metric: 'Passes Success', team: ((teamStats?.passesSuccess || 0) / maxPassesSuccess) * 100, opponent: ((opponentStats?.passesSuccess || 0) / maxPassesSuccess) * 100, fullMark: 100 }
    ];
  };

  const createTechnicalSpiderData = (teamStats: MatchStats | null, opponentStats?: MatchStats | null) => {
    const maxTackles = Math.max(teamStats?.tackles || 0, opponentStats?.tackles || 0, 1);
    const maxFreeKicks = Math.max(teamStats?.freeKicks || 0, opponentStats?.freeKicks || 0, 1);
    const maxOffsides = Math.max(teamStats?.offsides || 0, opponentStats?.offsides || 0, 1);
    
    return [
      { metric: 'Tackles', team: ((teamStats?.tackles || 0) / maxTackles) * 100, opponent: ((opponentStats?.tackles || 0) / maxTackles) * 100, fullMark: 100 },
      { metric: 'Free Kicks', team: ((teamStats?.freeKicks || 0) / maxFreeKicks) * 100, opponent: ((opponentStats?.freeKicks || 0) / maxFreeKicks) * 100, fullMark: 100 },
      { metric: 'Offsides', team: ((teamStats?.offsides || 0) / maxOffsides) * 100, opponent: ((opponentStats?.offsides || 0) / maxOffsides) * 100, fullMark: 100 },
      { metric: 'R.Foot Pass %', team: teamStats?.rightFootPassSuccessRate || 0, opponent: opponentStats?.rightFootPassSuccessRate || 0, fullMark: 100 },
      { metric: 'L.Foot Pass %', team: teamStats?.leftFootPassSuccessRate || 0, opponent: opponentStats?.leftFootPassSuccessRate || 0, fullMark: 100 }
    ];
  };

  if (fixtureLoading || statsLoading) {
    return (
      <MainLayout title="View Fixture" subtitle="Loading analysis...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading match analysis...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!fixture || !matchStats) {
    return (
      <MainLayout title="View Fixture" subtitle="Analysis not found">
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Unable to load match analysis.</p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Process match stats - get full game stats (with fallback for missing data)
  const fullGameStats = matchStats?.find(stat => stat.period === 'FULL_GAME' && stat.isTeamStats === true) || null;
  const opponentFullGameStats = matchStats?.find(stat => stat.period === 'FULL_GAME' && (stat.isTeamStats === false || stat.isTeamStats === null)) || null;

  // Get opponent team from opponents table
  const opponentTeam = oppositionTeams?.find((team: any) => 
    fixture?.oppositionTeamId ? team.id === fixture.oppositionTeamId : team.name === fixture?.opponent
  );

  // Use selected club for team colors and logo, opponent from opponents table
  const polkStateColor = (selectedClub?.colors as any)?.primary || '#CC4125';
  const oppositionColor = (opponentTeam?.colors as any)?.primary || '#6b7280';
  
  const teamLogoPath = selectedClub?.logoPath;
  const opponentLogoPath = opponentTeam?.logoPath;

  // Get primary color — prefer the fixture team's club, fall back to sidebar club
  const teamColors = (selectedTeam?.colors as any) || {};
  const clubColors = (selectedClub?.colors as any) || {};
  const fixtureClubColors = (fixtureClub?.colors as any) || {};
  const primaryColor = fixtureClubColors.primary || teamColors.primary || clubColors.primary || '#CC4125';

  // Allow viewing fixture even without full game stats

  return (
    <MainLayout 
      title="View Fixture" 
      subtitle={`${fixture.opponent} • ${format(new Date(fixture.date), 'd MMM yyyy')}`}
    >
      {/* Main Analysis Tabs */}
      <Tabs defaultValue={defaultTab} className="w-full">
        {/* ── Sticky header: banner + nav ─────────────────── */}
        <div className="sticky top-0 z-20 -mx-6 px-6 pb-3 bg-background">
        {/* Shared Team Header */}
        <MatchScoreBanner 
          fixture={fixture}
          teamLogoPath={teamLogoPath || undefined}
          opponentLogoPath={opponentLogoPath || undefined}
          polkStateColor={polkStateColor}
          oppositionColor={oppositionColor}
          primaryColor={primaryColor}
          clubName={selectedClub?.name}
        />

        {/* Glass nav bar — dark gradient, Back button tucked on left */}
        <div
          className="mt-3 rounded-2xl p-1.5 flex items-center gap-1"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, #000000 100%)`,
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          {/* Back button */}
          <button
            onClick={() => window.history.back()}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-white/50 hover:text-white text-xs font-medium transition-colors hover:bg-white/10"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-white/15 shrink-0" />

          <TabsList className="!flex flex-1 !bg-transparent !h-auto !p-0 gap-1">
            {[
              { value: "heatmaps",   label: "Fixture Details" },
              { value: "report",     label: "Match Report" },
              { value: "positions",  label: "Line-Ups" },
              { value: "videos",     label: "Videos" },
              { value: "upload",     label: "Upload Data" },
              { value: "statistics", label: "Statistics" },
              { value: "spider",     label: "Spider Charts" },
              { value: "ai",         label: "AI Analysis" },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                data-testid={tab.value === "upload" ? "tab-upload" : undefined}
                className="flex-1 rounded-xl text-xs font-medium py-2
                  !text-white/40 hover:!text-white/80
                  !bg-transparent !shadow-none
                  data-[state=active]:!bg-white/15 data-[state=active]:!text-white
                  data-[state=active]:!shadow-none
                  transition-all duration-150"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        </div>{/* end sticky header */}

        {/* Statistics Tab */}
        <TabsContent value="statistics">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Match Statistics</h3>
              {fullGameStats ? (
                <MetricsComparison
                  teamStats={fullGameStats}
                  opponentStats={opponentFullGameStats || undefined}
                  teamColor={polkStateColor}
                  opponentColor={oppositionColor}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No match statistics available. Upload match data to view detailed analytics.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Match Report Tab */}
        <TabsContent value="report">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Match Report</h3>
                {!isEditingReport ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setIsEditingReport(true);
                      setEditedReport(fixture.report || "");
                      setEditedAttendance(fixture.attendance ?? undefined);
                    }}
                    data-testid="button-edit-report"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Report
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsEditingReport(false)}
                      data-testid="button-cancel-report"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => updateReportMutation.mutate({ 
                        report: editedReport, 
                        attendance: editedAttendance 
                      })}
                      disabled={updateReportMutation.isPending}
                      data-testid="button-save-report"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="space-y-6">
                {!isEditingReport ? (
                  <>
                    {fixture.attendance && (
                      <div className="border-b pb-4">
                        <label className="text-sm font-medium text-muted-foreground">Attendance</label>
                        <p className="text-2xl font-bold mt-2">{fixture.attendance.toLocaleString()}</p>
                      </div>
                    )}
                    
                    {fixture.report ? (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Report</label>
                        <p className="text-base leading-relaxed mt-2 whitespace-pre-wrap">{fixture.report}</p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No match report available. Click "Edit Report" to add one.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Attendance</label>
                      <Input 
                        type="number"
                        value={editedAttendance ?? ""}
                        onChange={(e) => setEditedAttendance(e.target.value === "" ? undefined : parseInt(e.target.value))}
                        placeholder="e.g., 1469"
                        className="max-w-xs"
                        data-testid="input-edit-attendance"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Report</label>
                      <Textarea 
                        value={editedReport}
                        onChange={(e) => setEditedReport(e.target.value)}
                        placeholder="Enter match report..."
                        className="min-h-[200px]"
                        data-testid="textarea-edit-report"
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Analysis Tab */}
        <TabsContent value="ai">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">AI-Powered Analysis</h3>
              <div className="p-6 rounded-lg border">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="bg-muted/30 rounded-lg p-4 border">
                    <div className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-muted-foreground">Strong defensive performance in the first half, intercepting 8 out of 12 opponent attacks in the midfield.</p>
                    </div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 border">
                    <div className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-muted-foreground">Excellent ball retention through the wings, with {fullGameStats?.passingSuccessRate || 0}% success rate on pass attempts.</p>
                    </div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 border">
                    <div className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-muted-foreground">Opportunities to improve shot conversion - {fullGameStats?.shotsAttempted || 0} shots attempted with {fullGameStats?.shotsOnTarget || 0} on target.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Spider Charts Tab */}
        <TabsContent value="spider">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Spider Charts</h3>
              <Tabs defaultValue="attack" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="attack">Attack</TabsTrigger>
                  <TabsTrigger value="possession">Possession</TabsTrigger>
                  <TabsTrigger value="technical">Technical</TabsTrigger>
                </TabsList>

                <TabsContent value="attack" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6">
                      <SpiderChart
                        data={createAttackSpiderData(fullGameStats || null, opponentFullGameStats)}
                        teamName=""
                        opponentName=""
                        title="Attack Performance"
                        teamColor="#dc2626"
                        opponentColor="#64748b"
                      />
                    </Card>
                    <Card className="p-6">
                      <h4 className="font-semibold text-foreground mb-4">Attack Metrics</h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-4 text-sm font-medium border-b pb-2">
                          <span className="text-muted-foreground">Metric</span>
                          <span className="text-center" style={{ color: polkStateColor }}>{selectedClub?.name || 'Home Team'}</span>
                          <span className="text-gray-600 text-center">{opponentTeam?.shortName || "OPP"}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Goals</span>
                          <span className="font-medium text-center">{fullGameStats?.goals || 0}</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.goals || 0}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Shots Attempted</span>
                          <span className="font-medium text-center">{fullGameStats?.shotsAttempted || 0}</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.shotsAttempted || 0}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Shots on Target</span>
                          <span className="font-medium text-center">{fullGameStats?.shotsOnTarget || 0}</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.shotsOnTarget || 0}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Runs Into Boxes</span>
                          <span className="font-medium text-center">{fullGameStats?.runsIntoBoxes || 0}</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.runsIntoBoxes || 0}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Corner Kicks</span>
                          <span className="font-medium text-center">{fullGameStats?.corners || 0}</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.corners || 0}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Dangerous Crosses</span>
                          <span className="font-medium text-center">{fullGameStats?.dangerousCrosses || 0}</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.dangerousCrosses || 0}</span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="possession" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6">
                      <SpiderChart
                        data={createPossessionSpiderData(fullGameStats || null, opponentFullGameStats)}
                        teamName=""
                        opponentName=""
                        title="Possession Performance"
                        teamColor="#dc2626"
                        opponentColor="#64748b"
                      />
                    </Card>
                    <Card className="p-6">
                      <h4 className="font-semibold text-foreground mb-4">Possession Metrics</h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-4 text-sm font-medium border-b pb-2">
                          <span className="text-muted-foreground">Metric</span>
                          <span className="text-center" style={{ color: polkStateColor }}>{selectedClub?.name || 'Home Team'}</span>
                          <span className="text-gray-600 text-center">{opponentTeam?.shortName || "OPP"}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Possession %</span>
                          <span className="font-medium text-center">{fullGameStats?.possession || 0}%</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.possession || 0}%</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Pass Accuracy %</span>
                          <span className="font-medium text-center">{fullGameStats?.passingSuccessRate || 0}%</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.passingSuccessRate || 0}%</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">First Touch %</span>
                          <span className="font-medium text-center">{fullGameStats?.firstTouchSuccessRate || 0}%</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.firstTouchSuccessRate || 0}%</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Take Ons</span>
                          <span className="font-medium text-center">{fullGameStats?.takeOns || 0}</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.takeOns || 0}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Passes Success</span>
                          <span className="font-medium text-center">{fullGameStats?.passesSuccess || 0}</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.passesSuccess || 0}</span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="technical" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6">
                      <SpiderChart
                        data={createTechnicalSpiderData(fullGameStats || null, opponentFullGameStats)}
                        teamName=""
                        opponentName=""
                        title="Technical Performance"
                        teamColor="#dc2626"
                        opponentColor="#64748b"
                      />
                    </Card>
                    <Card className="p-6">
                      <h4 className="font-semibold text-foreground mb-4">Technical Metrics</h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-4 text-sm font-medium border-b pb-2">
                          <span className="text-muted-foreground">Metric</span>
                          <span className="text-center" style={{ color: polkStateColor }}>{selectedClub?.name || 'Home Team'}</span>
                          <span className="text-gray-600 text-center">{opponentTeam?.shortName || "OPP"}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Tackles</span>
                          <span className="font-medium text-center">{fullGameStats?.tackles || 0}</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.tackles || 0}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Free Kicks</span>
                          <span className="font-medium text-center">{fullGameStats?.freeKicks || 0}</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.freeKicks || 0}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Offsides</span>
                          <span className="font-medium text-center">{fullGameStats?.offsides || 0}</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.offsides || 0}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Right Foot Pass %</span>
                          <span className="font-medium text-center">{fullGameStats?.rightFootPassSuccessRate || 0}%</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.rightFootPassSuccessRate || 0}%</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-sm text-muted-foreground">Left Foot Pass %</span>
                          <span className="font-medium text-center">{fullGameStats?.leftFootPassSuccessRate || 0}%</span>
                          <span className="font-medium text-center text-gray-600">{opponentFullGameStats?.leftFootPassSuccessRate || 0}%</span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Heat Maps Tab - Placeholder */}
        <TabsContent value="heatmaps">
          <Card>
            <CardContent className="p-6">
              {/* Fixture Details Container */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Fixture Details</h3>
                  <FixtureEditDialog 
                    fixture={fixture}
                    clubId={selectedClub?.id}
                    onSave={async (data) => {
                      await apiRequest("PUT", `/api/fixtures/${fixture.id}`, data);
                      queryClient.invalidateQueries({ queryKey: ["/api/fixture", fixtureId] });
                      queryClient.invalidateQueries({ queryKey: ["/api/fixtures"] });
                    }}
                  >
                    <Button variant="outline" size="sm" data-testid="button-edit-fixture-heatmaps">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </FixtureEditDialog>
                </div>
                
                <div className="space-y-4">
                  {/* Row 1 - Competition, Match Type, Opposition */}
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Competition</label>
                      <p className="text-lg mt-1">{competitions?.find(c => c.id === fixture.competitionId)?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Match Type</label>
                      <p className="text-lg mt-1">{fixture.type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Opposition</label>
                      <p className="text-lg mt-1">{fixture.opponent}</p>
                    </div>
                  </div>

                  {/* Row 2 - Date, Time, Status */}
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date</label>
                      <p className="text-base mt-1">{format(new Date(fixture.date), "d MMM yyyy")}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Time</label>
                      <p className="text-base mt-1">{format(new Date(fixture.date), "h:mm a")}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <p className="text-base capitalize mt-1">
                        <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${
                          fixture.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          fixture.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          fixture.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}>
                          {fixture.status.toLowerCase()}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Additional Information */}
                  {fixture.notes && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Notes</label>
                      <p className="text-base mt-1">{fixture.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Line-Ups Tab */}
        <TabsContent value="positions">
          <div className="rounded-xl overflow-hidden">
            <FormationPitch players={allPlayers} clubPrimary={primaryColor} showFormationPicker fixtureId={fixtureId} />
          </div>
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">In Progress</h3>
              <VideoManager 
                fixtureId={fixtureId} 
                videoLinks={fixture.videoLinks ? fixture.videoLinks as any[] : []} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload Data Tab */}
        <TabsContent value="upload">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Upload Match Data</h3>
              <ExcelUpload fixtureId={fixtureId || ""} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}