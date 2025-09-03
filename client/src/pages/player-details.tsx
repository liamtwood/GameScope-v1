import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Player } from "@shared/schema";
import { ArrowLeft, Star } from "lucide-react";
import { format, differenceInYears } from "date-fns";

export default function PlayerDetails() {
  const [, params] = useRoute("/players/:id");
  const playerId = params?.id;

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

  return (
    <MainLayout 
      title="VIEW SQUAD MEMBER" 
      subtitle={player.name}
    >
      <div className="space-y-6" data-testid={`player-details-${player.id}`}>
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()}
          className="mb-4"
          data-testid="button-back-to-squad"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Player Details Tabs */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details" data-testid="tab-details">{player.name}</TabsTrigger>
            <TabsTrigger value="account" data-testid="tab-account">Account Details</TabsTrigger>
            <TabsTrigger value="teams" data-testid="tab-teams">Teams</TabsTrigger>
            <TabsTrigger value="parents" data-testid="tab-parents">Parents / Guardian</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Jersey Number</label>
                      <p className="text-lg" data-testid={`text-jersey-number-${player.id}`}>{player.jerseyNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">First Name</label>
                      <p className="text-lg" data-testid={`text-first-name-${player.id}`}>{player.name.split(' ')[0] || "Not provided"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                      <p className="text-lg" data-testid={`text-last-name-${player.id}`}>{player.name.split(' ').slice(1).join(' ') || "Not provided"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Position</label>
                      <p className="text-lg" data-testid={`text-position-${player.id}`}>{player.position}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Club ID</label>
                      <p className="text-lg font-mono text-xs" data-testid={`text-club-id-${player.id}`}>{player.teamId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Team ID</label>
                      <p className="text-lg font-mono text-xs" data-testid={`text-team-id-${player.id}`}>{player.teamId}</p>
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