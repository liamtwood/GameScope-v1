import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Player } from "@shared/schema";
import { ArrowLeft, Star } from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { useClub } from "@/contexts/club-context";
import ashleyMillerPhoto from "@assets/image_1756910395408.png";

export default function PlayerDetails() {
  const [, params] = useRoute("/players/:id");
  const playerId = params?.id;
  const { selectedClub } = useClub();

  const { data: player, isLoading } = useQuery<Player>({
    queryKey: ["/api/player", playerId],
    enabled: !!playerId,
  });

  const calculateAge = (dateOfBirth: string | Date | null) => {
    if (!dateOfBirth) return null;
    return differenceInYears(new Date(), new Date(dateOfBirth));
  };

  const age = player?.dateOfBirth ? calculateAge(player.dateOfBirth) : null;

  const getStatusColor = () => {
    if (!player) return 'bg-blue-500 text-white';
    switch (player.status) {
      case 'Fit':
        return 'bg-green-500 text-white';
      case 'Injured':
        return 'bg-red-500 text-white';
      case 'Retired':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getAccountStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Suspended": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "Retired": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default: return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"; // Draft
    }
  };

  const getPositionCategory = (position: string): string => {
    if (position.includes('GK') || position.includes('Goalkeeper')) return 'GK';
    if (position.includes('CB') || position.includes('LB') || position.includes('RB') || 
        position.includes('LWB') || position.includes('RWB') || position.includes('Defense')) return 'DEF';
    if (position.includes('CM') || position.includes('CDM') || position.includes('CAM') || 
        position.includes('LM') || position.includes('RM') || position.includes('Midfield')) return 'MID';
    if (position.includes('ST') || position.includes('CF') || position.includes('LW') || 
        position.includes('RW') || position.includes('Forward')) return 'FWD';
    return position;
  };

  const getPositionColor = () => {
    if (!player) return 'bg-gray-100 text-gray-800';
    const positionCategory = getPositionCategory(player.position);
    switch (positionCategory) {
      case 'GK':
        return 'bg-purple-100 text-purple-800';
      case 'DEF':
        return 'bg-blue-100 text-blue-800';
      case 'MID':
        return 'bg-green-100 text-green-800';
      case 'FWD':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Loading..." subtitle="Loading player details...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading player details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!player) {
    return (
      <MainLayout title="Player Not Found" subtitle="The requested player could not be found">
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">The player you're looking for doesn't exist or has been deleted.</p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </MainLayout>
    );
  }

  const getPlayerInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get club's primary color, fallback to default if not set
  const clubPrimaryColor = (selectedClub?.colors as any)?.primary || '#dc2626';
  
  // Function to determine if a color is light or dark for text contrast
  const isLightColor = (hexColor: string) => {
    const color = hexColor.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 155;
  };

  const textColor = isLightColor(clubPrimaryColor) ? '#000000' : '#ffffff';
  const labelColor = isLightColor(clubPrimaryColor) ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)';
  
  // Create gradient background style
  const gradientStyle = {
    background: `linear-gradient(to right, ${clubPrimaryColor}, ${clubPrimaryColor}88)`,
  };

  return (
    <MainLayout 
      title="VIEW SQUAD MEMBER" 
      subtitle={player.name}
    >
      <div className="space-y-6" data-testid={`player-details-${player.id}`}>
        {/* Back Button */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            data-testid="button-back-to-squad"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Player Header Card */}
        <Card className="border border-border max-w-4xl mx-auto relative overflow-hidden" style={gradientStyle}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Player Avatar */}
                <Avatar className="h-20 w-20 bg-slate-600 text-white">
                  {player.name === "Ashley Miller" ? (
                    <AvatarImage 
                      src={ashleyMillerPhoto} 
                      alt="Ashley Miller"
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="bg-slate-600 text-white text-xl font-semibold">
                    {getPlayerInitials(player.name)}
                  </AvatarFallback>
                </Avatar>
                
                {/* Player Info */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-3" style={{ color: textColor }}>{player.name}</h1>
                  
                  <div className="flex gap-8 text-sm">
                    <div>
                      <span className="uppercase tracking-wide" style={{ color: labelColor }}>AGE</span>
                      <p className="font-semibold" style={{ color: textColor }}>{age ? age : 'N/A'}</p>
                    </div>
                    <div>
                      <span className="uppercase tracking-wide" style={{ color: labelColor }}>GENDER</span>
                      <p className="font-semibold" style={{ color: textColor }}>{player.gender || 'Not set'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Club Logo */}
              <div className="flex-shrink-0 opacity-80">
                <img 
                  src={selectedClub?.logoPath || "/assets/logos/polk-state-logo-transparent.png"} 
                  alt={selectedClub?.name || "Club Logo"} 
                  className="h-16 w-auto object-contain"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Player Details Tabs */}
        <Tabs defaultValue="details" className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList className="grid grid-cols-4 w-full max-w-4xl">
              <TabsTrigger value="details" data-testid="tab-details">Player Details</TabsTrigger>
              <TabsTrigger value="account" data-testid="tab-account">Account Details</TabsTrigger>
              <TabsTrigger value="teams" data-testid="tab-teams">Teams</TabsTrigger>
              <TabsTrigger value="parents" data-testid="tab-parents">Parents / Guardian</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="details" className="mt-6">
            {/* Player Details Header */}
            <div className="p-4 rounded-t-lg max-w-4xl mx-auto" style={gradientStyle}>
              <h2 className="text-lg font-semibold" style={{ color: textColor }}>Player Details</h2>
            </div>
            
            <Card className="rounded-t-none border-t-0 max-w-4xl mx-auto">
              <CardContent className="p-4 space-y-3">
                {/* Team & Position Info */}
                <div className="grid grid-cols-3 gap-x-8 gap-y-3">
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Jersey Number</label>
                    <div className="mt-0.5">
                      <span className="text-sm font-semibold" data-testid={`text-jersey-number-${player.id}`}>
                        {player.jerseyNumber}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Position</label>
                    <div className="mt-0.5">
                      <span className="text-sm font-semibold" data-testid={`text-position-${player.id}`}>
                        {player.position}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Gender</label>
                    <div className="mt-0.5">
                      <span className="text-sm font-semibold" data-testid={`text-gender-${player.id}`}>
                        {player.gender || "Not set"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Name Info */}
                <div className="grid grid-cols-3 gap-x-8 gap-y-3">
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">First Name</label>
                    <div className="mt-0.5">
                      <span className="text-sm font-semibold" data-testid={`text-first-name-${player.id}`}>
                        {player.name.split(' ')[0] || "Not provided"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Last Name</label>
                    <div className="mt-0.5">
                      <span className="text-sm font-semibold" data-testid={`text-last-name-${player.id}`}>
                        {player.name.split(' ').slice(1).join(' ') || "Not provided"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Shirt Name</label>
                    <div className="mt-0.5">
                      <span className="text-sm font-semibold" data-testid={`text-shirt-name-${player.id}`}>
                        {player.name.split(' ').slice(-1)[0] || "Not provided"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="grid grid-cols-3 gap-x-8 gap-y-3 pt-2 border-t border-border/50">
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Date of Birth</label>
                    <div className="mt-0.5">
                      <span className="text-sm font-semibold" data-testid={`text-date-of-birth-${player.id}`}>
                        {player.dateOfBirth 
                          ? format(new Date(player.dateOfBirth), "dd/MM/yyyy")
                          : "Not provided"
                        }
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Age</label>
                    <div className="mt-0.5">
                      <span className="text-sm font-semibold" data-testid={`text-age-${player.id}`}>
                        {age ? `${age} years old` : "Not available"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Email</label>
                    <div className="mt-0.5">
                      <span className="text-sm font-semibold" data-testid={`text-email-${player.id}`}>
                        {player.email || "Not provided"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                      <p className="text-lg" data-testid={`text-email-${player.id}`}>
                        {player.email || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                      <p className="text-lg" data-testid={`text-phone-${player.id}`}>
                        Not provided
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Logged In</label>
                      <p className="text-lg" data-testid={`text-last-login-${player.id}`}>
                        Never logged in
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Current Team</h3>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Team</label>
                        <p className="text-lg" data-testid={`text-current-team-${player.id}`}>
                          Current Team Information
                        </p>
                      </div>
                    </div>
                    <div className="mt-6">
                      <h4 className="text-md font-medium mb-2">Add to Other Teams</h4>
                      <p className="text-sm text-muted-foreground">
                        Player can be added to other teams within the club - Coming soon
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parents" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <p className="text-lg text-muted-foreground">Parents / Guardian functionality</p>
                    <p className="text-sm text-muted-foreground mt-2">Coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}