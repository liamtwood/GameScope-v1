import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { FixtureCard } from "@/components/ui/fixture-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Fixture, Team } from "@shared/schema";
import { FixtureStatus } from "@/lib/types";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type FilterType = 'all' | FixtureStatus;

export default function Fixtures() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const { data: teams } = useQuery<Team[]>({ queryKey: ["/api/teams"] });
  const currentTeam = teams?.[0]; // For demo, use first team

  const { data: fixtures, isLoading } = useQuery<Fixture[]>({ 
    queryKey: ["/api/fixtures", currentTeam?.id],
    enabled: !!currentTeam?.id 
  });

  const filteredFixtures = fixtures?.filter(fixture => {
    const matchesFilter = activeFilter === 'all' || fixture.status === activeFilter;
    const matchesSearch = searchTerm === '' || 
      fixture.opponent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fixture.venue.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  }) || [];

  const handleViewDetails = (fixture: Fixture) => {
    toast({
      title: "Fixture Details",
      description: `Viewing details for ${fixture.opponent}`,
    });
  };

  const filterButtons = [
    { id: 'all' as const, label: 'All' },
    { id: 'COMPLETED' as const, label: 'Completed' },
    { id: 'SCHEDULED' as const, label: 'Scheduled' },
  ];

  return (
    <MainLayout 
      title="Fixtures" 
      subtitle="Manage team fixtures and match results"
    >
      <div className="mb-6 flex items-center justify-between">
        <Button data-testid="button-add-fixture">
          <Plus className="mr-2 h-4 w-4" />
          Add Fixture
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex bg-muted rounded-lg p-1">
          {filterButtons.map((filter) => (
            <Button
              key={filter.id}
              variant={activeFilter === filter.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveFilter(filter.id)}
              className={activeFilter === filter.id ? "bg-background text-foreground shadow-sm" : ""}
              data-testid={`button-filter-${filter.id}`}
            >
              {filter.label}
            </Button>
          ))}
        </div>
        
        <Select defaultValue="all">
          <SelectTrigger className="w-48" data-testid="select-competition">
            <SelectValue placeholder="All Competitions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Competitions</SelectItem>
            <SelectItem value="fcsaa-league">FCSAA League</SelectItem>
            <SelectItem value="fcsaa-preseason">FCSAA Pre-Season</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Search fixtures..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64"
          data-testid="input-search-fixtures"
        />
      </div>

      {/* Fixtures List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading fixtures...</p>
          </div>
        ) : filteredFixtures.length > 0 ? (
          filteredFixtures.map((fixture) => (
            <FixtureCard
              key={fixture.id}
              fixture={fixture}
              onViewDetails={handleViewDetails}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No fixtures found matching your criteria</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
