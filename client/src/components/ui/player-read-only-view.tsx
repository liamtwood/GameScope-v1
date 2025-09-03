import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Player } from "@shared/schema";
import { ArrowLeft, Star } from "lucide-react";
import { format, differenceInYears } from "date-fns";

interface PlayerReadOnlyViewProps {
  player: Player;
  onBack: () => void;
}

export function PlayerReadOnlyView({ player, onBack }: PlayerReadOnlyViewProps) {
  const calculateAge = (dateOfBirth: string | Date | null) => {
    if (!dateOfBirth) return null;
    return differenceInYears(new Date(), new Date(dateOfBirth));
  };

  const age = calculateAge(player.dateOfBirth);

  const getStatusColor = () => {
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

  return (
    <div className="space-y-6" data-testid={`player-read-only-view-${player.id}`}>
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="mb-4"
        data-testid="button-back-to-cards"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Player Cards
      </Button>

      {/* Player Header Card */}
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {/* Player Info */}
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold">
                {player.jerseyNumber}
              </div>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-foreground" data-testid={`text-player-name-${player.id}`}>
                    {player.name}
                  </h1>
                  {player.keyPlayer && (
                    <Star className="h-6 w-6 text-orange-500 fill-orange-500" />
                  )}
                </div>
                <div className="flex items-center space-x-3 mt-2">
                  <Badge 
                    className={`text-sm px-3 py-1 ${getPositionColor()}`}
                    data-testid={`badge-position-${player.id}`}
                  >
                    {player.position}
                  </Badge>
                  <Badge 
                    className={`text-sm px-3 py-1 ${getStatusColor()}`}
                    data-testid={`badge-status-${player.id}`}
                  >
                    {player.status || 'Fit'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Player Details Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="player" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="player" data-testid="tab-player">Player</TabsTrigger>
              <TabsTrigger value="account" data-testid="tab-account">Account</TabsTrigger>
            </TabsList>

            <TabsContent value="player" className="p-6 mt-0">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Player Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Jersey Number</label>
                      <p className="text-lg" data-testid={`text-jersey-number-${player.id}`}>{player.jerseyNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Position</label>
                      <p className="text-lg" data-testid={`text-position-${player.id}`}>{player.position}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Player Status</label>
                      <p className="text-lg" data-testid={`text-player-status-${player.id}`}>{player.status || 'Fit'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Key Player</label>
                      <p className="text-lg" data-testid={`text-key-player-${player.id}`}>
                        {player.keyPlayer ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="account" className="p-6 mt-0">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Account Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                      <p className="text-lg" data-testid={`text-email-${player.id}`}>
                        {player.email || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Gender</label>
                      <p className="text-lg" data-testid={`text-gender-${player.id}`}>
                        {player.gender || "Not set"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                      <p className="text-lg" data-testid={`text-date-of-birth-${player.id}`}>
                        {player.dateOfBirth 
                          ? `${format(new Date(player.dateOfBirth), "d MMM yyyy")} (Age: ${age})`
                          : "Not provided"
                        }
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Account Status</label>
                      <div>
                        <Badge 
                          className={`text-sm px-3 py-1 ${getAccountStatusColor(player.accountStatus || "Draft")}`}
                          data-testid={`badge-account-status-${player.id}`}
                        >
                          {player.accountStatus || "Draft"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}