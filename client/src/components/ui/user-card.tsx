import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, MoreHorizontal, Star } from "lucide-react";
import { User } from "@shared/schema";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClubTheme } from "@/hooks/use-club-theme";

interface UserCardProps {
  user: User;
  onDelete?: (user: User) => void;
  onToggleKeyUser?: (user: User) => void;
  onUpdateStatus?: (user: User, newStatus: string) => void;
}

export function UserCard({ user, onDelete, onToggleKeyUser, onUpdateStatus }: UserCardProps) {
  const [, setLocation] = useLocation();
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const { clubPrimary } = useClubTheme();
  
  const getStatusColor = () => {
    const status = user.status || 'active';
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500 text-white';
      case 'inactive':
        return 'bg-gray-500 text-white';
      case 'suspended':
        return 'bg-red-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getRoleCategory = (role: string): string => {
    if (role?.toLowerCase().includes('admin')) return 'ADMIN';
    if (role?.toLowerCase().includes('coach')) return 'COACH';
    if (role?.toLowerCase().includes('player')) return 'PLAYER';
    return 'USER';
  };

  const getRoleColor = () => {
    const roleCategory = getRoleCategory(user.role || 'player');
    switch (roleCategory) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'COACH':
        return 'bg-blue-100 text-blue-800';
      case 'PLAYER':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to get user display (user ID initials)
  const getUserDisplay = () => {
    // Show user initials based on name
    const initials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
    return (
      <div 
        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold border-2"
        style={{ 
          backgroundColor: clubPrimary,
          borderColor: clubPrimary
        }}
      >
        {initials || 'U'}
      </div>
    );
  };

  return (
    <Card 
      data-testid={`card-user-${user.id}`} 
      className="border rounded-lg cursor-pointer"
      onClick={(e) => {
        // Only trigger navigation if not clicking on interactive elements
        if (!e.defaultPrevented) {
          setLocation(`/users/${user.id}`);
        }
      }}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between min-h-[50px]">
          {/* User Avatar */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 flex items-center justify-center">
              {getUserDisplay()}
            </div>
            
            {/* Main Content */}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-lg text-foreground">{user.firstName} {user.lastName}</h3>
                {user.keyUser && (
                  <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {user.email}
              </p>
              <Badge className={`text-xs px-2 py-0.5 mt-1 ${getRoleColor()}`}>
                {getRoleCategory(user.role || 'player')}
              </Badge>
            </div>
          </div>

          {/* Right side - Status and Stats */}
          <div className="flex items-center space-x-3">
            {/* Status */}
            {isEditingStatus ? (
              <Select
                value={user.status || "active"}
                onValueChange={(newStatus) => {
                  if (onUpdateStatus) {
                    onUpdateStatus(user, newStatus);
                  }
                  setIsEditingStatus(false);
                }}
              >
                <SelectTrigger className="w-20 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge 
                className={`text-xs px-3 py-1 cursor-pointer hover:opacity-80 ${getStatusColor()}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingStatus(true);
                }}
                title="Click to edit status"
              >
                {user.status || 'Active'}
              </Badge>
            )}
            

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onToggleKeyUser && (
                  <DropdownMenuItem onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleKeyUser(user);
                  }}>
                    <Star className="mr-2 h-4 w-4" />
                    {user.keyUser ? 'Remove Star' : 'Make Key User'}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(user);
                    }}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete User
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}