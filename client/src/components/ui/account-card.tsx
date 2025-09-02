import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Player } from "@shared/schema";
import { Edit, MoreHorizontal } from "lucide-react";
import { format, differenceInYears } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountEditDialog } from "@/components/dialogs/account-edit-dialog";

interface AccountCardProps {
  player: Player;
}

export function AccountCard({ player }: AccountCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);

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
    <>
      <Card className="h-[140px] group hover:shadow-md transition-shadow duration-200" data-testid={`account-card-${player.id}`}>
        <CardContent className="p-4 h-full flex flex-col">
          {/* Header with name, jersey number, and menu */}
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
                  
                  {/* Dropdown menu for actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`button-menu-account-${player.id}`}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => setShowEditDialog(true)}
                        data-testid={`button-edit-account-${player.id}`}
                      >
                        <Edit className="mr-2 h-3 w-3" />
                        Edit Account
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {/* Email in place of position */}
              <p className="text-xs text-muted-foreground mt-1" data-testid={`text-email-${player.id}`}>
                {player.email || "No email provided"}
              </p>
            </div>
          </div>

          {/* Account details and status */}
          <div className="flex-1 flex items-end justify-between">
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
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <AccountEditDialog
        player={player}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </>
  );
}