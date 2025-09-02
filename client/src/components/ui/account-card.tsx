import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Player } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Calendar, Save, X } from "lucide-react";
import { format, differenceInYears } from "date-fns";

interface AccountCardProps {
  player: Player;
}

export function AccountCard({ player }: AccountCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: player.email || "",
    gender: player.gender || "",
    dateOfBirth: player.dateOfBirth ? format(new Date(player.dateOfBirth), "yyyy-MM-dd") : "",
  });
  const { toast } = useToast();

  const updatePlayerMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", `/api/players/${player.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players", player.teamId] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Player account updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update player account",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const updateData: any = {
      email: formData.email || null,
      gender: formData.gender || null,
      dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
    };
    updatePlayerMutation.mutate(updateData);
  };

  const handleCancel = () => {
    setFormData({
      email: player.email || "",
      gender: player.gender || "",
      dateOfBirth: player.dateOfBirth ? format(new Date(player.dateOfBirth), "yyyy-MM-dd") : "",
    });
    setIsEditing(false);
  };

  const calculateAge = (dateOfBirth: string | Date | null) => {
    if (!dateOfBirth) return null;
    return differenceInYears(new Date(), new Date(dateOfBirth));
  };

  const age = calculateAge(player.dateOfBirth);

  return (
    <Card className="h-[200px] group hover:shadow-md transition-shadow duration-200" data-testid={`account-card-${player.id}`}>
      <CardContent className="p-4 h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground" data-testid={`text-player-name-${player.id}`}>
                {player.name}
              </h3>
              <p className="text-xs text-muted-foreground">#{player.jerseyNumber} • {player.position}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              Account
            </Badge>
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                data-testid={`button-edit-account-${player.id}`}
              >
                <User className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {isEditing ? (
            <>
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                  className="h-7 text-xs"
                  data-testid={`input-email-${player.id}`}
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="gender" className="text-xs">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger className="h-7 text-xs" data-testid={`select-gender-${player.id}`}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="dateOfBirth" className="text-xs">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="h-7 text-xs"
                  data-testid={`input-date-of-birth-${player.id}`}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center space-x-2 text-xs">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground" data-testid={`text-email-${player.id}`}>
                  {player.email || "No email provided"}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 text-xs">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground" data-testid={`text-gender-${player.id}`}>
                  {player.gender || "Gender not specified"}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 text-xs">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground" data-testid={`text-date-of-birth-${player.id}`}>
                  {player.dateOfBirth 
                    ? `${format(new Date(player.dateOfBirth), "MMM dd, yyyy")} (${age} years old)`
                    : "Date of birth not provided"
                  }
                </span>
              </div>
            </>
          )}
        </div>

        {isEditing && (
          <div className="flex items-center justify-end space-x-2 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-6 px-2 text-xs"
              data-testid={`button-cancel-account-${player.id}`}
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={updatePlayerMutation.isPending}
              className="h-6 px-2 text-xs"
              data-testid={`button-save-account-${player.id}`}
            >
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}