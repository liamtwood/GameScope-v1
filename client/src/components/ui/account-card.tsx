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
      <Card 
        data-testid={`account-card-${player.id}`} 
        className="border rounded-lg shadow-sm hover:shadow-md transition-shadow"
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between min-h-[50px]">
            {/* Player Avatar */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 flex items-center justify-center">
                <div className="h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  {player.jerseyNumber}
                </div>
              </div>
              
              {/* Main Content */}
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-lg text-foreground" data-testid={`text-player-name-${player.id}`}>
                    {player.name}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground" data-testid={`text-email-${player.id}`}>
                  {player.email || "No email provided"}
                </p>
                <div className="text-xs text-muted-foreground mt-1">
                  <span data-testid={`text-gender-${player.id}`}>
                    {player.gender || "Gender not set"}
                  </span>
                  {player.gender && player.dateOfBirth && " • "}
                  <span data-testid={`text-date-of-birth-${player.id}`}>
                    {player.dateOfBirth 
                      ? `${format(new Date(player.dateOfBirth), "d MMM yyyy")} (Age: ${age})`
                      : "Date of birth not provided"
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Right side - Status and Actions */}
            <div className="flex items-center space-x-3">
              {/* Account Status */}
              <Badge 
                className={`text-xs px-3 py-1 ${getStatusColor(player.accountStatus || "Draft")}`}
                data-testid={`badge-account-status-${player.id}`}
              >
                {player.accountStatus || "Draft"}
              </Badge>
              
              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0" data-testid={`button-menu-account-${player.id}`}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => setShowEditDialog(true)}
                    data-testid={`button-edit-account-${player.id}`}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Account
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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