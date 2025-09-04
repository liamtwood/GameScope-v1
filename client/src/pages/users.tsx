import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { UserCard } from "@/components/ui/user-card";
import { UserCreateDialog } from "@/components/dialogs/user-create-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { UserPlus, Star, Edit, Trash2, Check, X, Users as UsersIcon, Shield, Settings, Filter } from "lucide-react";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useClub } from "@/contexts/club-context";
import { apiRequest, queryClient } from "@/lib/queryClient";

type RoleFilter = 'all' | 'admin' | 'coach' | 'player';
type StatusFilter = 'all' | 'active' | 'inactive' | 'suspended';
type StarFilter = 'all' | 'star' | 'regular';

export default function Users() {
  const [activeFilter, setActiveFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [starFilter, setStarFilter] = useState<StarFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingField, setEditingField] = useState<{userId: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState("");
  const [activeTab, setActiveTab] = useState<'table' | 'user-card'>('user-card');
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  const { selectedClub: currentClub } = useClub();

  // Fetch club users
  const { data: users = [], isLoading } = useQuery<User[]>({ 
    queryKey: ["/api/club", currentClub?.id, "users"],
    enabled: !!currentClub?.id 
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      return apiRequest("POST", "/api/users", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/club", currentClub?.id, "users"] });
      toast({
        title: "User Added",
        description: "New user has been added to the system.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add user.",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
      return apiRequest("PUT", `/api/users/${userId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/club", currentClub?.id, "users"] });
      toast({
        title: "User Updated",
        description: "User information has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user.",
        variant: "destructive",
      });
    },
  });

  const toggleKeyUserMutation = useMutation({
    mutationFn: async ({ userId, keyUser }: { userId: string; keyUser: boolean }) => {
      return apiRequest("PATCH", `/api/users/${userId}`, { keyUser });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/club", currentClub?.id, "users"] });
      toast({
        title: "Key User Updated",
        description: "User status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/club", currentClub?.id, "users"] });
      toast({
        title: "User Deleted",
        description: "User has been removed from the system.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete user.",
        variant: "destructive",
      });
    },
  });

  const getRoleCategory = (role: string): RoleFilter => {
    if (role?.toLowerCase().includes('admin')) return 'admin';
    if (role?.toLowerCase().includes('coach')) return 'coach';
    if (role?.toLowerCase().includes('player')) return 'player';
    return 'player';
  };

  const filteredUsers = users?.filter(user => {
    const matchesFilter = activeFilter === 'all' || getRoleCategory(user.role || 'player') === activeFilter;
    const matchesStatus = statusFilter === 'all' || (user.status || 'active').toLowerCase() === statusFilter;
    const matchesStar = starFilter === 'all' || 
      (starFilter === 'star' && user.keyUser) ||
      (starFilter === 'regular' && !user.keyUser);
    const matchesSearch = searchTerm === '' || 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesStatus && matchesStar && matchesSearch;
  }).sort((a, b) => {
    // Sort by role first, then by name
    const roleOrder: Record<RoleFilter, number> = { all: 0, admin: 1, coach: 2, player: 3 };
    const aRole = getRoleCategory(a.role || 'player');
    const bRole = getRoleCategory(b.role || 'player');
    const roleDiff = roleOrder[aRole] - roleOrder[bRole];
    if (roleDiff !== 0) return roleDiff;
    
    return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
  }) || [];

  const getRoleCount = (category: RoleFilter) => {
    if (category === 'all') return users?.length || 0;
    return users?.filter(u => getRoleCategory(u.role || 'player') === category).length || 0;
  };

  const getKeyUsersCount = () => {
    if (!users) return 0;
    return users.filter(user => user.keyUser).length;
  };

  const handleCreateUser = (data: any) => {
    if (!currentClub?.id) {
      toast({
        title: "Error",
        description: "No club selected. Please select a club first.",
        variant: "destructive",
      });
      return;
    }
    
    const userData = {
      ...data,
      clubId: currentClub.id
    };
    
    createUserMutation.mutate(userData);
  };

  const handleUpdateUser = (userId: string, data: any) => {
    updateUserMutation.mutate({ userId, data });
  };

  const handleToggleKeyUser = (user: User) => {
    toggleKeyUserMutation.mutate({
      userId: user.id,
      keyUser: !user.keyUser
    });
  };

  const handleStartEdit = (userId: string, field: string, currentValue: string) => {
    setEditingField({ userId, field });
    setEditValue(currentValue);
  };

  const handleSaveEdit = (userId: string, field: string) => {
    const value = editValue;
    
    updateUserMutation.mutate({ 
      userId, 
      data: { [field]: value } 
    });
    setEditingField(null);
    setEditValue("");
  };

  const handleDeleteUser = (user: User) => {
    if (window.confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName} from the system?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  // Group users by role for card view
  const usersByRole = filteredUsers.reduce((groups, user) => {
    const role = getRoleCategory(user.role || 'player');
    const roleDisplayName = role.charAt(0).toUpperCase() + role.slice(1) + 's';
    if (!groups[roleDisplayName]) {
      groups[roleDisplayName] = [];
    }
    groups[roleDisplayName].push(user);
    return groups;
  }, {} as Record<string, User[]>);

  const roleDisplayOrder = ['Admins', 'Coaches', 'Players'];

  return (
    <MainLayout 
      title="Club User Management" 
      subtitle="Manage users and access rights for this club"
    >
      {/* Summary Cards */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Users */}
          <StatsCard
            title="Total Users"
            value={getRoleCount('all')}
            icon={UsersIcon}
            iconColor="text-club-primary"
            subtitle="active system users"
          />
          
          {/* Key Users */}
          <StatsCard
            title="Key Users"
            value={getKeyUsersCount()}
            icon={Star}
            iconColor="text-club-primary"
            subtitle="important users"
          />

          {/* Role Breakdown */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">ADM</p>
                      <p className="text-3xl font-bold text-foreground">{getRoleCount('admin')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">COA</p>
                      <p className="text-3xl font-bold text-foreground">{getRoleCount('coach')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">PLY</p>
                      <p className="text-3xl font-bold text-foreground">{getRoleCount('player')}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-muted-foreground text-sm">role breakdown</span>
              </div>
            </CardContent>
          </Card>

          {/* User Status */}
          <StatsCard
            title="User Status"
            value={`${users?.filter(u => (u.status || 'active') === 'active').length || 0}-${users?.filter(u => (u.status || 'active') === 'inactive').length || 0}-${users?.filter(u => (u.status || 'active') === 'suspended').length || 0}`}
            icon={Shield}
            iconColor="text-club-primary"
            subtitle="active-inactive-suspended"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-toggle-filters"
            >
              <Filter className="mr-2 h-4 w-4" />
              Enable Filter
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <UserCreateDialog 
              clubId={currentClub?.id || ""} 
              onSave={handleCreateUser}
            >
              <Button 
                variant="outline" 
                data-testid="button-add-user"
                disabled={!currentClub?.id}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </UserCreateDialog>
            <Button variant="ghost" data-testid="button-user-settings">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Role</label>
              <Select value={activeFilter} onValueChange={(value: RoleFilter) => setActiveFilter(value)}>
                <SelectTrigger className="w-full" data-testid="select-role">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="coach">Coach</SelectItem>
                  <SelectItem value="player">Player</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Status</label>
              <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                <SelectTrigger className="w-full" data-testid="select-status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Key Users</label>
              <Select value={starFilter} onValueChange={(value: StarFilter) => setStarFilter(value)}>
                <SelectTrigger className="w-full" data-testid="select-star">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="star">Key Users</SelectItem>
                  <SelectItem value="regular">Regular Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Keyword</label>
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                data-testid="input-search-users"
              />
            </div>
          </div>
        </div>
      )}

      {/* User Cards View */}
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="space-y-8">
          {roleDisplayOrder.map(roleName => {
            const usersInRole = usersByRole[roleName];
            if (!usersInRole || usersInRole.length === 0) return null;
            
            return (
              <div key={roleName} className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">
                  {roleName} ({usersInRole.length})
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {usersInRole.map((user) => (
                    <div key={user.id} className="relative">
                      <UserCard
                        user={user}
                        onDelete={handleDeleteUser}
                        onToggleKeyUser={handleToggleKeyUser}
                        onUpdateStatus={(user: User, newStatus: string) => {
                          handleUpdateUser(user.id, { status: newStatus });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No users found matching your criteria.</p>
          <UserCreateDialog clubId={currentClub?.id || ""} onSave={handleCreateUser}>
            <Button variant="outline" disabled={!currentClub?.id}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add First User
            </Button>
          </UserCreateDialog>
        </div>
      )}
    </MainLayout>
  );
}