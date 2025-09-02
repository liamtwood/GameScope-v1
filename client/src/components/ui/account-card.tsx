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
import { User, Mail, Calendar, Save, X, Edit } from "lucide-react";
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
    accountStatus: player.accountStatus || "Draft",
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
      accountStatus: formData.accountStatus,
    };
    updatePlayerMutation.mutate(updateData);
  };

  const handleCancel = () => {
    setFormData({
      email: player.email || "",
      gender: player.gender || "",
      dateOfBirth: player.dateOfBirth ? format(new Date(player.dateOfBirth), "yyyy-MM-dd") : "",
      accountStatus: player.accountStatus || "Draft",
    });
    setIsEditing(false);
  };

  const calculateAge = (dateOfBirth: string | Date | null) => {
    if (!dateOfBirth) return null;
    return differenceInYears(new Date(), new Date(dateOfBirth));
  };

  const age = calculateAge(player.dateOfBirth);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Suspended": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "Retired": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default: return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"; // Draft
    }
  };

  return (
    <Card className="h-[140px] group hover:shadow-md transition-shadow duration-200" data-testid={`account-card-${player.id}`}>
      <CardContent className="p-4 h-full flex flex-col">
        {/* Header with name, jersey number, and email */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-foreground" data-testid={`text-player-name-${player.id}`}>
                {player.name}
              </h3>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs font-bold text-muted-foreground">
                    {player.jerseyNumber}
                  </span>
                </div>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    data-testid={`button-edit-account-${player.id}`}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Email in place of position */}
            <p className="text-xs text-muted-foreground mt-1" data-testid={`text-email-${player.id}`}>
              {player.email || "No email provided"}
            </p>
          </div>
        </div>

        {/* Status and details */}
        <div className="flex-1 space-y-2">
          {isEditing ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="email" className="text-xs">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email"
                    className="h-7 text-xs"
                    data-testid={`input-email-${player.id}`}
                  />
                </div>
                <div>
                  <Label htmlFor="gender" className="text-xs">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger className="h-7 text-xs" data-testid={`select-gender-${player.id}`}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
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
                <div>
                  <Label htmlFor="accountStatus" className="text-xs">Status</Label>
                  <Select value={formData.accountStatus} onValueChange={(value) => setFormData({ ...formData, accountStatus: value })}>
                    <SelectTrigger className="h-7 text-xs" data-testid={`select-account-status-${player.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                      <SelectItem value="Retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground" data-testid={`text-gender-${player.id}`}>
                  {player.gender || "Gender not set"}
                </p>
                <p className="text-xs text-muted-foreground" data-testid={`text-date-of-birth-${player.id}`}>
                  {player.dateOfBirth 
                    ? `${format(new Date(player.dateOfBirth), "d MMM yyyy")} (Age: ${age})`
                    : "Date of birth not provided"
                  }
                </p>
              </div>
              
              <Badge 
                className={`text-xs px-2 py-1 ${getStatusColor(player.accountStatus || "Draft")}`}
                data-testid={`badge-account-status-${player.id}`}
              >
                {player.accountStatus || "Draft"}
              </Badge>
            </div>
          )}
        </div>

        {isEditing && (
          <div className="flex items-center justify-end space-x-2 pt-2 border-t mt-2">
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