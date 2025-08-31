import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { FixtureCard } from "@/components/ui/fixture-card";
import { FixtureEditDialog } from "@/components/dialogs/fixture-edit-dialog";
import { FixtureCreateDialog } from "@/components/dialogs/fixture-create-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Target, TrendingUp, TrendingDown, Minus, Trophy, Calendar, Video, MapPin, Clock, Home, Plane, Upload, Wand2, Save, CheckCircle, AlertCircle, Info, Edit3, Image, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { Fixture, Team, Competition, OppositionTeam } from "@shared/schema";
import { FixtureStatus } from "@/lib/types";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { BackgroundRemover, BackgroundRemovalOptions } from "@/utils/backgroundRemoval";
import { ThemedLogoContainer } from "@/components/ui/themed-logo-container";

type FilterType = 'all' | FixtureStatus;

export default function Fixtures() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [competitionFilter, setCompetitionFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fixtureToDelete, setFixtureToDelete] = useState<Fixture | null>(null);
  const [overviewTab, setOverviewTab] = useState<'season' | 'planning' | 'video'>('video');
  const [homeAwayFilter, setHomeAwayFilter] = useState<'all' | 'HOME' | 'AWAY'>('all');
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Logo management state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [processingMode, setProcessingMode] = useState<'smart' | 'color' | 'manual'>('smart');
  const [threshold, setThreshold] = useState(30);
  const [showTip, setShowTip] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [fetchingUrl, setFetchingUrl] = useState(false);

  const { data: teams } = useQuery<Team[]>({ queryKey: ["/api/teams"] });
  const currentTeam = teams?.[0]; // For demo, use first team

  const { data: fixtures, isLoading } = useQuery<Fixture[]>({ 
    queryKey: ["/api/fixtures", currentTeam?.id],
    enabled: !!currentTeam?.id 
  });

  const { data: competitions = [] } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"]
  });

  const { data: oppositionTeams } = useQuery<OppositionTeam[]>({ 
    queryKey: ["/api/opposition-teams"] 
  });

  // Mutation for updating fixtures
  const updateFixtureMutation = useMutation({
    mutationFn: async ({ fixtureId, data }: { fixtureId: string; data: any }) => {
      return apiRequest("PUT", `/api/fixtures/${fixtureId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fixtures", currentTeam?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
      toast({
        title: "Success",
        description: "Fixture updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update fixture",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting fixtures
  const deleteFixtureMutation = useMutation({
    mutationFn: async (fixtureId: string) => {
      return apiRequest("DELETE", `/api/fixtures/${fixtureId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fixtures", currentTeam?.id] });
      toast({
        title: "Success",
        description: "Fixture deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete fixture",
        variant: "destructive",
      });
    },
  });

  // Mutation for creating fixtures
  const createFixtureMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/fixtures", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fixtures", currentTeam?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
      toast({
        title: "Success",
        description: "Fixture created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create fixture",
        variant: "destructive",
      });
    },
  });

  // Logo management mutations
  const saveMutation = useMutation({
    mutationFn: async ({ teamId, logoData }: { teamId: string; logoData: Blob }) => {
      const formData = new FormData();
      formData.append('logo', logoData, `${teamId}-logo.png`);
      formData.append('teamId', teamId);
      
      const response = await fetch('/api/opposition-teams/logo', {
        method: 'POST',
        body: formData,
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Logo Saved",
        description: "Team logo has been processed and saved successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/opposition-teams"] });
      setSelectedFile(null);
      setSelectedTeam("");
      setProcessedImageUrl(null);
      setOriginalImageUrl(null);
      setShowTip(false);
      setProcessingMode('smart');
      setThreshold(30);
      setLogoUrl("");
      setUploadMethod('file');
      setFetchingUrl(false);
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: "Failed to save the logo. Please try again.",
        variant: "destructive",
      });
      console.error('Save error:', error);
    },
  });

  // Logo management functions
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setOriginalImageUrl(URL.createObjectURL(file));
    
    if (file.size > 100000 || file.name.toLowerCase().includes('logo')) {
      setShowTip(true);
    }
    
    await processImageWithCurrentSettings(file);
  };

  const handleUrlFetch = async () => {
    if (!logoUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid image URL.",
        variant: "destructive",
      });
      return;
    }

    setFetchingUrl(true);
    try {
      // Create a proxy URL to handle CORS issues
      const proxyUrl = `/api/fetch-image?url=${encodeURIComponent(logoUrl)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }
      
      const blob = await response.blob();
      
      // Convert blob to file for processing
      const file = new File([blob], 'fetched-logo.png', { type: blob.type });
      
      setSelectedFile(file);
      setOriginalImageUrl(URL.createObjectURL(blob));
      
      if (blob.size > 100000) {
        setShowTip(true);
      }
      
      await processImageWithCurrentSettings(file);
      
      toast({
        title: "Image Fetched",
        description: "Logo image has been successfully downloaded and is ready for processing.",
      });
      
    } catch (error) {
      console.error('URL fetch error:', error);
      toast({
        title: "Fetch Failed",
        description: "Failed to download image from URL. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setFetchingUrl(false);
    }
  };

  const handleSave = async () => {
    if (!selectedTeam || !processedImageUrl) {
      toast({
        title: "Missing Information",
        description: "Please select a team and process an image first.",
        variant: "destructive",
      });
      return;
    }

    const response = await fetch(processedImageUrl);
    const logoData = await response.blob();
    
    saveMutation.mutate({ teamId: selectedTeam, logoData });
  };

  const processImageWithCurrentSettings = async (file: File) => {
    setProcessing(true);
    try {
      const backgroundRemover = new BackgroundRemover();
      const options: BackgroundRemovalOptions = {
        mode: processingMode,
        tolerance: threshold,
        preserveInternalWhite: true
      };
      
      const processedBlob = await backgroundRemover.removeBackground(file, options);
      const processedUrl = URL.createObjectURL(processedBlob);
      setProcessedImageUrl(processedUrl);
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Processing Failed",
        description: "Failed to remove background. Please try a different image.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveBackground = async (team: OppositionTeam) => {
    if (!team.logoPath) {
      toast({
        title: "No Logo Found",
        description: "This team doesn't have a logo to process.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    setSelectedTeam(team.id);
    
    try {
      const response = await fetch(team.logoPath);
      const blob = await response.blob();
      
      setOriginalImageUrl(team.logoPath);
      
      const backgroundRemover = new BackgroundRemover();
      const options: BackgroundRemovalOptions = {
        mode: 'smart',
        tolerance: 30,
        preserveInternalWhite: true
      };
      
      // Convert blob to File for processing
      const file = new File([blob], 'logo.png', { type: blob.type });
      const processedBlob = await backgroundRemover.removeBackground(file, options);
      const processedUrl = URL.createObjectURL(processedBlob);
      setProcessedImageUrl(processedUrl);
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Processing Failed",
        description: "Failed to remove background from existing logo.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleEditExistingLogo = (team: OppositionTeam) => {
    if (team.logoPath) {
      setSelectedTeam(team.id);
      setOriginalImageUrl(team.logoPath);
      setProcessedImageUrl(team.logoPath);
      setOverviewTab('logos');
    }
  };

  const filteredFixtures = fixtures?.filter(fixture => {
    // When on video tab, only show past matches
    if (overviewTab === 'video') {
      const now = new Date();
      const matchDate = new Date(fixture.date);
      const isPastMatch = matchDate < now;
      if (!isPastMatch) return false;
    }
    
    // When on planning tab, only show future matches
    if (overviewTab === 'planning') {
      const now = new Date();
      const matchDate = new Date(fixture.date);
      const isFutureMatch = matchDate > now || fixture.status === 'SCHEDULED';
      if (!isFutureMatch) return false;
    }
    
    // Apply home/away filter to all tabs
    if (homeAwayFilter !== 'all' && fixture.type !== homeAwayFilter) {
      return false;
    }
    
    // Treat NO_CONTEST the same as COMPLETED when filtering
    const matchesFilter = activeFilter === 'all' || 
      fixture.status === activeFilter ||
      (activeFilter === 'COMPLETED' && fixture.status === 'NO_CONTEST');
    const matchesCompetition = competitionFilter === 'all' || fixture.competition === competitionFilter;
    const matchesSearch = searchTerm === '' || 
      fixture.opponent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fixture.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fixture.competition && fixture.competition.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesCompetition && matchesSearch;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

  const handleViewDetails = (fixture: Fixture, activeTab?: string) => {
    if (activeTab) {
      setLocation(`/fixtures/${fixture.id}?tab=${activeTab}`);
    } else {
      setLocation(`/fixtures/${fixture.id}`);
    }
  };

  const handleEditFixture = (data: any) => {
    // This will be called from the dialog - we need to pass the fixture ID
    // The actual handler is passed to the dialog
  };

  const handleDeleteFixture = (fixture: Fixture) => {
    setFixtureToDelete(fixture);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (fixtureToDelete) {
      deleteFixtureMutation.mutate(fixtureToDelete.id);
      setDeleteDialogOpen(false);
      setFixtureToDelete(null);
    }
  };

  const filterButtons = [
    { id: 'all' as const, label: 'All' },
    { id: 'COMPLETED' as const, label: 'Completed' },
    { id: 'SCHEDULED' as const, label: 'Scheduled' },
  ];

  // Calculate fixture statistics
  const getFixtureStats = () => {
    if (!fixtures) return { 
      total: 0, scheduled: 0, completed: 0, competitions: 0,
      wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0
    };
    
    const scheduled = fixtures.filter(f => f.status === 'SCHEDULED').length;
    const completed = fixtures.filter(f => f.status === 'COMPLETED').length;
    const uniqueCompetitions = new Set(fixtures.map(f => f.competition).filter(Boolean)).size;
    
    // Calculate match results and goals
    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
    
    fixtures.forEach(fixture => {
      if (fixture.status === 'COMPLETED' && fixture.homeScore !== null && fixture.awayScore !== null) {
        const isHome = fixture.type === 'HOME';
        const ourScore = isHome ? fixture.homeScore : fixture.awayScore;
        const theirScore = isHome ? fixture.awayScore : fixture.homeScore;
        
        goalsFor += ourScore;
        goalsAgainst += theirScore;
        
        if (ourScore > theirScore) wins++;
        else if (ourScore === theirScore) draws++;
        else losses++;
      }
    });
    
    return {
      total: fixtures.length,
      scheduled,
      completed,
      competitions: uniqueCompetitions,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst
    };
  };

  // Calculate planning statistics
  const getPlanningStats = () => {
    if (!fixtures) return { upcoming: 0, homeGames: 0, awayGames: 0, thisMonth: 0 };
    
    const now = new Date();
    const upcoming = fixtures.filter(f => f.status === 'SCHEDULED' && new Date(f.date) > now);
    const homeGames = upcoming.filter(f => f.type === 'HOME').length;
    const awayGames = upcoming.filter(f => f.type === 'AWAY').length;
    
    const thisMonth = upcoming.filter(f => {
      const fixtureDate = new Date(f.date);
      return fixtureDate.getMonth() === now.getMonth() && fixtureDate.getFullYear() === now.getFullYear();
    }).length;
    
    return { upcoming: upcoming.length, homeGames, awayGames, thisMonth };
  };

  // Calculate video statistics
  const getVideoStats = () => {
    if (!fixtures || fixtures.length === 0) return { withVideo: 0, withoutVideo: 0, totalVideos: 0, coverage: 0 };
    
    // Include all past matches (ignore status, only check date) that need videos
    const now = new Date();
    const pastFixtures = fixtures.filter(f => {
      const matchDate = new Date(f.date);
      return matchDate < now;
    });
    
    const withVideo = pastFixtures.filter(f => f.hasVideo).length;
    const withoutVideo = pastFixtures.filter(f => !f.hasVideo).length;
    
    const totalVideos = fixtures.reduce((sum, f) => {
      return sum + (f.videoLinks && Array.isArray(f.videoLinks) ? f.videoLinks.length : 0);
    }, 0);
    
    const coverage = pastFixtures.length > 0 ? (withVideo / pastFixtures.length) * 100 : 0;
    
    return { withVideo, withoutVideo, totalVideos, coverage };
  };

  // Get matches that need video uploads (only past matches using today's date)
  const getMatchesNeedingVideos = () => {
    if (!fixtures) return [];
    
    const now = new Date();
    
    return fixtures.filter(f => {
      const matchDate = new Date(f.date);
      const isPastMatch = matchDate < now;
      const hasNoVideo = !f.hasVideo;
      
      // Include only past matches (before now) that need videos, ignore status
      return isPastMatch && hasNoVideo;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Most recent first
  };

  const stats = getFixtureStats();

  return (
    <MainLayout 
      title="Fixtures" 
      subtitle="Manage team fixtures and match results"
    >
      <div className="mb-6 flex items-center justify-between">
        <FixtureCreateDialog 
          teamId={currentTeam?.id || ""} 
          onSave={(data) => createFixtureMutation.mutate(data)}
        >
          <Button data-testid="button-add-fixture">
            <Plus className="mr-2 h-4 w-4" />
            Add Fixture
          </Button>
        </FixtureCreateDialog>
        
      </div>

      {/* Overview Tabs */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Dashboard Overview</h3>
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={overviewTab === 'season' ? "default" : "ghost"}
              size="sm"
              onClick={() => setOverviewTab('season')}
              className={overviewTab === 'season' ? "bg-background text-foreground shadow-sm" : ""}
            >
              <Trophy className="mr-2 h-4 w-4" />
              Season
            </Button>
            <Button
              variant={overviewTab === 'planning' ? "default" : "ghost"}
              size="sm"
              onClick={() => setOverviewTab('planning')}
              className={overviewTab === 'planning' ? "bg-background text-foreground shadow-sm" : ""}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Planning
            </Button>
            <Button
              variant={overviewTab === 'video' ? "default" : "ghost"}
              size="sm"
              onClick={() => setOverviewTab('video')}
              className={overviewTab === 'video' ? "bg-background text-foreground shadow-sm" : ""}
            >
              <Video className="mr-2 h-4 w-4" />
              Videos
            </Button>
          </div>
        </div>

        {/* Season Overview */}
        {overviewTab === 'season' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Record Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6 text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-blue-700 mb-1">RECORD</p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.wins}-{stats.draws}-{stats.losses}
                </p>
                <p className="text-xs text-blue-600 mt-1">W-D-L</p>
              </CardContent>
            </Card>

            {/* Goals For Card */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-sm text-green-700 mb-1">GOALS FOR</p>
                <p className="text-3xl font-bold text-green-900">{stats.goalsFor}</p>
                <p className="text-xs text-green-600 mt-1">
                  {stats.completed > 0 ? (stats.goalsFor / stats.completed).toFixed(1) : '0.0'} per game
                </p>
              </CardContent>
            </Card>

            {/* Goals Against Card */}
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-6 text-center">
                <TrendingDown className="h-8 w-8 mx-auto mb-2 text-red-600" />
                <p className="text-sm text-red-700 mb-1">GOALS AGAINST</p>
                <p className="text-3xl font-bold text-red-900">{stats.goalsAgainst}</p>
                <p className="text-xs text-red-600 mt-1">
                  {stats.completed > 0 ? (stats.goalsAgainst / stats.completed).toFixed(1) : '0.0'} per game
                </p>
              </CardContent>
            </Card>

            {/* Goal Difference Card */}
            <Card className={`bg-gradient-to-br ${
              stats.goalsFor - stats.goalsAgainst > 0 
                ? 'from-emerald-50 to-emerald-100 border-emerald-200' 
                : stats.goalsFor - stats.goalsAgainst < 0 
                  ? 'from-orange-50 to-orange-100 border-orange-200'
                  : 'from-gray-50 to-gray-100 border-gray-200'
            }`}>
              <CardContent className="p-6 text-center">
                <Target className={`h-8 w-8 mx-auto mb-2 ${
                  stats.goalsFor - stats.goalsAgainst > 0 
                    ? 'text-emerald-600' 
                    : stats.goalsFor - stats.goalsAgainst < 0 
                      ? 'text-orange-600'
                      : 'text-gray-600'
                }`} />
                <p className={`text-sm mb-1 ${
                  stats.goalsFor - stats.goalsAgainst > 0 
                    ? 'text-emerald-700' 
                    : stats.goalsFor - stats.goalsAgainst < 0 
                      ? 'text-orange-700'
                      : 'text-gray-700'
                }`}>GOAL DIFFERENCE</p>
                <p className={`text-3xl font-bold ${
                  stats.goalsFor - stats.goalsAgainst > 0 
                    ? 'text-emerald-900' 
                    : stats.goalsFor - stats.goalsAgainst < 0 
                      ? 'text-orange-900'
                      : 'text-foreground'
                }`}>
                  {stats.goalsFor - stats.goalsAgainst > 0 ? '+' : ''}{stats.goalsFor - stats.goalsAgainst}
                </p>
                <p className={`text-xs mt-1 ${
                  stats.goalsFor - stats.goalsAgainst > 0 
                    ? 'text-emerald-600' 
                    : stats.goalsFor - stats.goalsAgainst < 0 
                      ? 'text-orange-600'
                      : 'text-gray-600'
                }`}>
                  {stats.completed} matches played
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Fixture Planning Overview */}
        {overviewTab === 'planning' && (() => {
          const planningStats = getPlanningStats();
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Upcoming Fixtures */}
              <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 dark:from-slate-800/30 dark:to-slate-700/30 dark:border-slate-600/50">
                <CardContent className="p-6 text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-slate-600 dark:text-slate-400" />
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">UPCOMING</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{planningStats.upcoming}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">fixtures scheduled</p>
                </CardContent>
              </Card>

              {/* Home Games */}
              <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
                <CardContent className="p-6 text-center">
                  <Home className="h-8 w-8 mx-auto mb-2 text-cyan-600" />
                  <p className="text-sm text-cyan-700 mb-1">HOME GAMES</p>
                  <p className="text-3xl font-bold text-cyan-900">{planningStats.homeGames}</p>
                  <p className="text-xs text-cyan-600 mt-1">at home venue</p>
                </CardContent>
              </Card>

              {/* Away Games */}
              <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                <CardContent className="p-6 text-center">
                  <Plane className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                  <p className="text-sm text-amber-700 mb-1">AWAY GAMES</p>
                  <p className="text-3xl font-bold text-amber-900">{planningStats.awayGames}</p>
                  <p className="text-xs text-amber-600 mt-1">away fixtures</p>
                </CardContent>
              </Card>

              {/* This Month */}
              <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-rose-600" />
                  <p className="text-sm text-rose-700 mb-1">THIS MONTH</p>
                  <p className="text-3xl font-bold text-rose-900">{planningStats.thisMonth}</p>
                  <p className="text-xs text-rose-600 mt-1">matches this month</p>
                </CardContent>
              </Card>
            </div>
          );
        })()}

        {/* Video Management Overview */}
        {overviewTab === 'video' && (() => {
          const videoStats = getVideoStats();
          const matchesNeedingVideos = getMatchesNeedingVideos();
          
          return (
            <div className="space-y-6">
              {/* Video Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Video Coverage */}
                <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 dark:from-slate-800/30 dark:to-slate-700/30 dark:border-slate-600/50">
                  <CardContent className="p-6 text-center">
                    <Video className="h-8 w-8 mx-auto mb-2 text-slate-600 dark:text-slate-400" />
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">COVERAGE</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{videoStats.coverage.toFixed(0)}%</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">matches with video</p>
                  </CardContent>
                </Card>

                {/* Matches with Video */}
                <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 dark:from-teal-900/30 dark:to-teal-800/30 dark:border-teal-700/50">
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-teal-600" />
                    <p className="text-sm text-teal-700 dark:text-teal-300 mb-1">WITH VIDEO</p>
                    <p className="text-3xl font-bold text-teal-900 dark:text-teal-100">{videoStats.withVideo}</p>
                    <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">completed matches</p>
                  </CardContent>
                </Card>

                {/* Missing Videos - Actionable */}
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 dark:border-orange-700/50 cursor-pointer hover:from-orange-100 hover:to-orange-200 dark:hover:from-orange-800/40 dark:hover:to-orange-700/40 transition-colors">
                  <CardContent className="p-6 text-center">
                    <TrendingDown className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                    <p className="text-sm text-orange-700 dark:text-orange-300 mb-1">MISSING VIDEO</p>
                    <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{videoStats.withoutVideo}</p>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">need video uploads</p>
                    {videoStats.withoutVideo > 0 && (
                      <p className="text-xs text-orange-700 mt-2 font-medium">👇 See matches below</p>
                    )}
                  </CardContent>
                </Card>

                {/* Video Processing */}
                <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 dark:from-slate-800/30 dark:to-slate-700/30 dark:border-slate-600/50">
                  <CardContent className="p-6 text-center">
                    <Target className="h-8 w-8 mx-auto mb-2 text-slate-600 dark:text-slate-400" />
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">VIDEO PROCESSING</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{videoStats.totalVideos}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">feature coming soon</p>
                  </CardContent>
                </Card>
              </div>

              {/* Matches Needing Videos - Always Display */}
              <div>
                <h4 className="text-md font-semibold mb-3 text-foreground flex items-center">
                  <TrendingDown className="h-5 w-5 mr-2 text-orange-600" />
                  Matches Needing Video Upload ({matchesNeedingVideos.length})
                </h4>
                {matchesNeedingVideos.length > 0 ? (
                  <div className="space-y-3">
                    {matchesNeedingVideos.map((fixture) => (
                      <Card key={fixture.id} className="border-orange-200 bg-orange-50/50 hover:bg-orange-50 dark:border-orange-700/50 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4">
                                <div className="flex-1">
                                  <h5 className="font-medium text-foreground">
                                    {fixture.type === 'HOME' ? 'vs' : '@'} {fixture.opponent}
                                  </h5>
                                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>{format(new Date(fixture.date), "MMM d, yyyy")}</span>
                                    <span>•</span>
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      fixture.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {fixture.status === 'COMPLETED' ? 'Completed' : 'Past Date'}
                                    </span>
                                    {fixture.homeScore !== null && fixture.awayScore !== null && (
                                      <>
                                        <span>•</span>
                                        <span className="font-medium">
                                          {fixture.type === 'HOME' ? `${fixture.homeScore}-${fixture.awayScore}` : `${fixture.awayScore}-${fixture.homeScore}`}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewDetails(fixture, 'videos')}
                              className="border-orange-300 text-orange-700 hover:bg-orange-100"
                            >
                              <Video className="mr-2 h-4 w-4" />
                              Upload Video
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">Up to date</p>
                    <p className="text-sm mt-1">All completed matches have videos uploaded.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Logo Management Overview */}
        {overviewTab === 'logos' && (
          <div className="space-y-6">
            {/* Current Team Logos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Image className="mr-2 h-5 w-5" />
                  Current Team Logos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {oppositionTeams?.map((team) => (
                    <div key={team.id} className="space-y-2">
                      <ThemedLogoContainer
                        containerId={`team-logo-${team.id}`}
                        className="border rounded-lg p-3 transition-all"
                        showThemeToggle={true}
                      >
                        <div 
                          onClick={() => handleEditExistingLogo(team)}
                          className="cursor-pointer relative"
                        >
                          <div className="aspect-square border rounded-md mb-2 flex items-center justify-center overflow-hidden bg-inherit">
                            {team.logoPath ? (
                              <img 
                                src={team.logoPath} 
                                alt={`${team.name} logo`}
                                className="max-w-full max-h-full object-contain"
                              />
                            ) : (
                              <div className="text-gray-400 dark:text-gray-500 text-center">
                                <Upload className="h-8 w-8 mx-auto mb-1" />
                                <p className="text-xs">No Logo</p>
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium truncate">{team.name}</p>
                          </div>
                          <div className="absolute inset-0 rounded-lg transition-all duration-200 flex items-center justify-center">
                            <Edit3 className="h-6 w-6 text-gray-600 dark:text-gray-400 opacity-0 hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </ThemedLogoContainer>
                      
                      {/* Remove Background Button */}
                      <button 
                        className="w-full text-xs cursor-pointer hover:bg-gray-100 px-2 py-1 border rounded bg-white text-gray-700"
                        onClick={async () => {
                          await handleRemoveBackground(team);
                        }}
                        data-testid={`button-remove-bg-${team.id}`}
                      >
                        Remove Background
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Logo Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="mr-2 h-5 w-5" />
                  Upload New Logo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Upload Method Selection */}
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <Button
                      variant={uploadMethod === 'file' ? 'default' : 'outline'}
                      onClick={() => setUploadMethod('file')}
                      className="flex-1"
                      data-testid="button-upload-method-file"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload File
                    </Button>
                    <Button
                      variant={uploadMethod === 'url' ? 'default' : 'outline'}
                      onClick={() => setUploadMethod('url')}
                      className="flex-1"
                      data-testid="button-upload-method-url"
                    >
                      <LinkIcon className="mr-2 h-4 w-4" />
                      From URL
                    </Button>
                  </div>

                  {/* File Upload */}
                  {uploadMethod === 'file' && (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <div className="space-y-2">
                        <label 
                          htmlFor="logo-upload"
                          className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                        >
                          Choose File
                        </label>
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          data-testid="input-logo-upload"
                        />
                        <p className="text-sm text-muted-foreground">
                          Upload a logo image (PNG, JPG, or SVG)
                        </p>
                      </div>
                    </div>
                  )}

                  {/* URL Input */}
                  {uploadMethod === 'url' && (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center space-y-4">
                      <LinkIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <div className="space-y-4">
                        <div className="flex space-x-2">
                          <input
                            type="url"
                            placeholder="Enter image URL (e.g., https://example.com/logo.png)"
                            value={logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                            className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            data-testid="input-logo-url"
                          />
                          <Button 
                            onClick={handleUrlFetch}
                            disabled={fetchingUrl || !logoUrl.trim()}
                            data-testid="button-fetch-url"
                          >
                            {fetchingUrl ? "Fetching..." : "Fetch"}
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Enter a direct link to an image file
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Team Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Team</label>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger data-testid="select-team">
                      <SelectValue placeholder="Choose a team for this logo" />
                    </SelectTrigger>
                    <SelectContent>
                      {oppositionTeams?.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Processing Controls */}
                {originalImageUrl && (
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-medium flex items-center">
                      <Wand2 className="mr-2 h-4 w-4" />
                      Background Removal Settings
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Processing Mode */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Processing Mode</label>
                        <Select value={processingMode} onValueChange={(value: any) => setProcessingMode(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="smart">Smart (Recommended)</SelectItem>
                            <SelectItem value="color">Color-based</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Threshold Slider */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Sensitivity: {threshold}%
                        </label>
                        <Slider
                          value={[threshold]}
                          onValueChange={(value) => setThreshold(value[0])}
                          max={100}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Reprocess Button */}
                    <Button
                      onClick={() => selectedFile && processImageWithCurrentSettings(selectedFile)}
                      disabled={!selectedFile || processing}
                      variant="outline"
                      size="sm"
                    >
                      <Wand2 className="mr-2 h-4 w-4" />
                      {processing ? "Processing..." : "Reprocess"}
                    </Button>
                  </div>
                )}

                {/* Save Button */}
                {processedImageUrl && selectedTeam && (
                  <Button 
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="w-full"
                    data-testid="button-save-logo"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saveMutation.isPending ? "Saving..." : "Save Logo"}
                  </Button>
                )}

                {/* Processing Tip */}
                {showTip && (
                  <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-900">Pro Tip</p>
                      <p className="text-sm text-blue-700">
                        For best results with logo background removal, use high-contrast images with clear edges. 
                        White or solid color backgrounds work exceptionally well.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Image Comparison */}
            {(originalImageUrl || processedImageUrl) && (
              <Card>
                <CardHeader>
                  <CardTitle>Image Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Original Image */}
                    {originalImageUrl && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-center">Original</h4>
                        <div className="aspect-square border rounded-lg p-4 bg-white dark:bg-gray-900 flex items-center justify-center">
                          <img 
                            src={originalImageUrl} 
                            alt="Original logo"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      </div>
                    )}

                    {/* Processed Image */}
                    {processedImageUrl && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-center">
                          Processed 
                          {processing && <span className="text-sm text-muted-foreground ml-2">(Processing...)</span>}
                        </h4>
                        <div className="aspect-square border rounded-lg p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                          <img 
                            src={processedImageUrl} 
                            alt="Processed logo"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {overviewTab !== 'logos' && (
        <>
          {/* Filters */}
          <div className="mb-6 space-y-3">
            <h3 className="text-sm font-medium text-foreground">Filter by:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {/* Competition Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Competition</label>
                <Select value={competitionFilter} onValueChange={setCompetitionFilter}>
                  <SelectTrigger className="w-full" data-testid="select-competition">
                    <SelectValue placeholder="All Competitions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Competitions</SelectItem>
                    {competitions.map((competition) => (
                      <SelectItem key={competition.id} value={competition.name}>
                        {competition.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="flex bg-muted rounded-lg p-1">
                  {filterButtons.map((filter) => (
                    <Button
                      key={filter.id}
                      variant={activeFilter === filter.id ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActiveFilter(filter.id)}
                      className={`flex-1 text-center ${activeFilter === filter.id ? "bg-background text-foreground shadow-sm" : ""}`}
                      data-testid={`button-filter-${filter.id}`}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Location Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Location</label>
                <div className="flex bg-muted rounded-lg p-1">
                  <Button
                    variant={homeAwayFilter === 'all' ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setHomeAwayFilter('all')}
                    className={`flex-1 text-center ${homeAwayFilter === 'all' ? "bg-background text-foreground shadow-sm" : ""}`}
                    data-testid="button-filter-venue-all"
                  >
                    All
                  </Button>
                  <Button
                    variant={homeAwayFilter === 'HOME' ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setHomeAwayFilter('HOME')}
                    className={`flex-1 text-center ${homeAwayFilter === 'HOME' ? "bg-background text-foreground shadow-sm" : ""}`}
                    data-testid="button-filter-venue-home"
                  >
                    Home
                  </Button>
                  <Button
                    variant={homeAwayFilter === 'AWAY' ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setHomeAwayFilter('AWAY')}
                    className={`flex-1 text-center ${homeAwayFilter === 'AWAY' ? "bg-background text-foreground shadow-sm" : ""}`}
                    data-testid="button-filter-venue-away"
                  >
                    Away
                  </Button>
                </div>
              </div>

              {/* Keyword Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Keyword</label>
                <Input
                  placeholder="Search fixtures..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                  data-testid="input-search-fixtures"
                />
              </div>
            </div>
          </div>

          {/* Fixtures List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading fixtures...</p>
              </div>
            ) : filteredFixtures.length > 0 ? (
              filteredFixtures.map((fixture) => (
                <FixtureEditDialog 
                  key={fixture.id}
                  fixture={fixture}
                  onSave={(data) => updateFixtureMutation.mutate({ fixtureId: fixture.id, data })}
                >
                  <div className="w-full">
                    <FixtureCard
                      fixture={fixture}
                      onViewDetails={handleViewDetails}
                      onEdit={() => {}} // Edit is handled by the dialog wrapper
                      onDelete={handleDeleteFixture}
                    />
                  </div>
                </FixtureEditDialog>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No fixtures found matching your criteria</p>
              </div>
            )}
          </div>

          {/* Delete confirmation dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Fixture</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the fixture against {fixtureToDelete?.opponent}? 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </MainLayout>
  );
}
