import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X } from 'lucide-react';

interface AdvancedHighlightsProps {
  onEventClick?: (eventTime: number, period: number) => void;
}

interface EventChip {
  id: string;
  time: string;
  description: string;
  icon: string;
  type: 'goal' | 'shot' | 'save' | 'card' | 'sub';
}

interface EventGroup {
  id: string;
  title: string;
  timeRange: string;
  type: 'goal' | 'pressure' | 'danger';
  events: EventChip[];
}

interface SelectedEvent {
  time: string;
  description: string;
}

export function AdvancedHighlights({ onEventClick }: AdvancedHighlightsProps) {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedPackage, setSelectedPackage] = useState<'quick' | 'standard' | 'extended'>('quick');
  const [selectedEvents, setSelectedEvents] = useState<SelectedEvent[]>([
    { time: '4:12', description: 'Lauren Hemp Shot - England\'s first chance' },
    { time: '28:29', description: '⚽ GOAL - Olga Carmona (Spain)' },
    { time: '75:07', description: 'Lauren James powerful strike' },
    { time: '88:22', description: 'Coll crucial save from Bright' },
    { time: '104:00', description: 'Final whistle - Spain Champions!' }
  ]);

  const eventGroups: EventGroup[] = [
    {
      id: 'opening',
      title: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 England Early Pressure',
      timeRange: '0\' - 20\'',
      type: 'pressure',
      events: [
        { id: '1', time: '4\'', description: 'Hemp Shot', icon: '🎯', type: 'shot' },
        { id: '2', time: '15\'', description: 'Hemp Chance', icon: '🎯', type: 'shot' },
        { id: '3', time: '19\'', description: 'Hemp Shot', icon: '🎯', type: 'shot' }
      ]
    },
    {
      id: 'goal',
      title: '⚽ GOAL - Match Winner!',
      timeRange: '29\'',
      type: 'goal',
      events: [
        { id: '4', time: '29\'', description: 'Carmona Goal', icon: '⚽', type: 'goal' }
      ]
    },
    {
      id: 'spanish-control',
      title: '🇪🇸 Spain Dominance',
      timeRange: '30\' - 45\'',
      type: 'pressure',
      events: [
        { id: '5', time: '36\'', description: 'Redondo Shot', icon: '🎯', type: 'shot' },
        { id: '6', time: '45\'', description: 'Paralluelo Chance', icon: '🎯', type: 'shot' }
      ]
    },
    {
      id: 'second-half',
      title: '⚡ Second Half Intensity',
      timeRange: '45\' - 70\'',
      type: 'danger',
      events: [
        { id: '7', time: '49\'', description: 'Caldentey Shot', icon: '🎯', type: 'shot' },
        { id: '8', time: '53\'', description: 'Earps Save', icon: '🧤', type: 'save' },
        { id: '9', time: '61\'', description: 'Bonmatí Chance', icon: '🎯', type: 'shot' },
        { id: '10', time: '63\'', description: 'James On', icon: '🔄', type: 'sub' },
        { id: '11', time: '69\'', description: 'Hermoso Shot', icon: '🎯', type: 'shot' }
      ]
    },
    {
      id: 'final-push',
      title: '🔥 England\'s Last Stand',
      timeRange: '70\' - 90\'',
      type: 'danger',
      events: [
        { id: '12', time: '73\'', description: 'Bronze Header', icon: '🎯', type: 'shot' },
        { id: '13', time: '75\'', description: 'James Strike', icon: '🎯', type: 'shot' },
        { id: '14', time: '88\'', description: 'Coll Save', icon: '🧤', type: 'save' }
      ]
    },
    {
      id: 'stoppage',
      title: '⏰ Stoppage Time Drama',
      timeRange: '90\' - 104\'',
      type: 'pressure',
      events: [
        { id: '15', time: '89\'', description: 'Hermoso Chance', icon: '🎯', type: 'shot' },
        { id: '16', time: '89\'', description: 'Putellas Shot', icon: '🎯', type: 'shot' },
        { id: '17', time: '91\'', description: 'Batlle Strike', icon: '🎯', type: 'shot' },
        { id: '18', time: '104\'', description: 'Final Corner', icon: '🧤', type: 'save' }
      ]
    }
  ];

  const filters = [
    { id: 'all', label: 'All Events', count: 56 },
    { id: 'tier1', label: 'Must Include', count: 1 },
    { id: 'tier2', label: 'High Priority', count: 8 },
    { id: 'tier3', label: 'Supporting', count: 47 },
  ];

  const eventTypeFilters = [
    { id: 'goals', label: '⚽ Goals', count: 1 },
    { id: 'shots', label: '🎯 Shots', count: 22 },
    { id: 'saves', label: '🧤 Saves', count: 8 },
    { id: 'cards', label: '🟨 Cards', count: 0 },
    { id: 'subs', label: '🔄 Substitutions', count: 6 },
  ];

  const phaseFilters = [
    { id: 'first-half', label: '1st Half', count: 20 },
    { id: 'second-half', label: '2nd Half', count: 36 },
    { id: 'extra-time', label: 'Extra Time', count: 11 },
  ];

  const teamFilters = [
    { id: 'spain', label: '🇪🇸 Spain', count: 31 },
    { id: 'england', label: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 England', count: 25 },
  ];

  const handleEventChipClick = (event: EventChip) => {
    const minute = parseInt(event.time.replace('\'', ''));
    const seconds = minute * 60;
    onEventClick?.(seconds, 1);
  };

  const removeSelectedEvent = (index: number) => {
    setSelectedEvents(prev => prev.filter((_, i) => i !== index));
  };

  const currentDuration = '2:45';
  const maxDuration = selectedPackage === 'quick' ? '1:30' : selectedPackage === 'standard' ? '5:00' : '10:00';
  const durationPercentage = selectedPackage === 'quick' ? 100 : selectedPackage === 'standard' ? 55 : 27.5;

  const getGroupStyles = (type: EventGroup['type']) => {
    switch (type) {
      case 'goal':
        return 'bg-green-50 dark:bg-green-950 border-l-4 border-l-green-500';
      case 'danger':
        return 'bg-orange-50 dark:bg-orange-950 border-l-4 border-l-orange-500';
      case 'pressure':
        return 'bg-blue-50 dark:bg-blue-950 border-l-4 border-l-blue-500';
      default:
        return 'bg-gray-50 dark:bg-gray-950 border-l-4 border-l-gray-500';
    }
  };

  const getEventIcon = (type: EventChip['type']) => {
    const iconClasses = 'w-4 h-4 rounded-full flex items-center justify-center text-xs text-white';
    switch (type) {
      case 'goal':
        return <span className={`${iconClasses} bg-green-500`}>⚽</span>;
      case 'shot':
        return <span className={`${iconClasses} bg-orange-500`}>🎯</span>;
      case 'save':
        return <span className={`${iconClasses} bg-blue-500`}>🧤</span>;
      case 'card':
        return <span className={`${iconClasses} bg-red-500`}>🟨</span>;
      case 'sub':
        return <span className={`${iconClasses} bg-purple-500`}>🔄</span>;
      default:
        return <span className={`${iconClasses} bg-gray-500`}>•</span>;
    }
  };

  return (
    <div className="max-w-full mx-auto">
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Filters */}
        <aside className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Event Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Priority Filters */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Priority</h3>
                <div className="space-y-2">
                  {filters.map((filter) => (
                    <Button
                      key={filter.id}
                      variant={activeFilter === filter.id ? "default" : "outline"}
                      className="w-full justify-between"
                      onClick={() => setActiveFilter(filter.id)}
                      data-testid={`filter-${filter.id}`}
                    >
                      {filter.label}
                      <Badge variant="secondary">{filter.count}</Badge>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Event Type Filters */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Event Type</h3>
                <div className="space-y-2">
                  {eventTypeFilters.map((filter) => (
                    <Button
                      key={filter.id}
                      variant="outline"
                      className="w-full justify-between"
                      data-testid={`event-type-${filter.id}`}
                    >
                      {filter.label}
                      <Badge variant="secondary">{filter.count}</Badge>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Match Phase Filters */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Match Phase</h3>
                <div className="space-y-2">
                  {phaseFilters.map((filter) => (
                    <Button
                      key={filter.id}
                      variant="outline"
                      className="w-full justify-between"
                      data-testid={`phase-${filter.id}`}
                    >
                      {filter.label}
                      <Badge variant="secondary">{filter.count}</Badge>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Team Filters */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Team</h3>
                <div className="space-y-2">
                  {teamFilters.map((filter) => (
                    <Button
                      key={filter.id}
                      variant="outline"
                      className="w-full justify-between"
                      data-testid={`team-${filter.id}`}
                    >
                      {filter.label}
                      <Badge variant="secondary">{filter.count}</Badge>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Center - View Tabs */}
        <main className="lg:col-span-6">
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="timeline" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="timeline" data-testid="view-timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="grid" data-testid="view-grid">Clips</TabsTrigger>
                  <TabsTrigger value="heatmap" data-testid="view-heatmap">Heatmap</TabsTrigger>
                </TabsList>
                
                <TabsContent value="timeline" className="mt-6">
                  <div className="space-y-4">
                    {/* Time Markers */}
                    <div className="relative mb-8">
                      <div className="flex justify-between items-center relative">
                        <div className="absolute left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 top-1/2 transform -translate-y-1/2"></div>
                        {['0\'', '15\'', '30\'', '45\'', 'HT', '60\'', '75\'', '90\'', 'FT'].map((time) => (
                          <span
                            key={time}
                            className="bg-background border-2 border-gray-200 dark:border-gray-700 px-3 py-1 rounded-full text-xs font-semibold relative z-10"
                          >
                            {time}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Event Groups */}
                    <div className="space-y-4">
                      {eventGroups.map((group) => (
                        <div
                          key={group.id}
                          className={`rounded-lg p-4 ${getGroupStyles(group.type)}`}
                        >
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-medium text-sm">{group.title}</span>
                            <span className="text-xs text-muted-foreground">{group.timeRange}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {group.events.map((event) => (
                              <button
                                key={event.id}
                                onClick={() => handleEventChipClick(event)}
                                className="flex items-center gap-2 bg-background hover:bg-accent hover:text-accent-foreground px-3 py-1.5 rounded-full text-xs transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer border border-border"
                                data-testid={`event-chip-${event.id}`}
                              >
                                {getEventIcon(event.type)}
                                <span>{event.description} ({event.time})</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="grid" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {eventGroups.flatMap(group => group.events).map((event) => (
                      <div
                        key={event.id}
                        onClick={() => handleEventChipClick(event)}
                        className="cursor-pointer bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all border"
                        data-testid={`grid-event-${event.id}`}
                      >
                        <div className="h-24 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl text-white">
                          {event.icon}
                        </div>
                        <div className="p-3">
                          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">{event.time}</div>
                          <div className="text-sm font-medium mt-1">{event.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="heatmap" className="mt-6">
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔥</div>
                    <div className="text-lg font-medium mb-2">Heatmap View</div>
                    <div className="text-muted-foreground">Coming soon - Visual heatmap of match events</div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>

        {/* Right Panel - Highlight Builder */}
        <aside className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Highlight Builder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Package Selector */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'quick', label: 'Quick', time: '60-90s' },
                  { id: 'standard', label: 'Standard', time: '3-5m' },
                  { id: 'extended', label: 'Extended', time: '8-10m' }
                ].map((pkg) => (
                  <Button
                    key={pkg.id}
                    variant={selectedPackage === pkg.id ? "default" : "outline"}
                    className="h-auto p-3 flex flex-col"
                    onClick={() => setSelectedPackage(pkg.id as any)}
                    data-testid={`package-${pkg.id}`}
                  >
                    <div className="font-medium">{pkg.label}</div>
                    <div className="text-xs opacity-80 mt-1">{pkg.time}</div>
                  </Button>
                ))}
              </div>

              {/* Duration Info */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between text-sm mb-3">
                  <span>Current Duration</span>
                  <span><strong>{currentDuration}</strong> / {maxDuration}</span>
                </div>
                <div className="h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300"
                    style={{ width: `${durationPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Selected Events */}
              <div>
                <ScrollArea className="h-64 w-full">
                  <div className="space-y-2">
                    {selectedEvents.map((event, index) => (
                      <div
                        key={index}
                        className="bg-muted p-3 rounded-lg flex justify-between items-center cursor-move"
                        draggable
                        data-testid={`selected-event-${index}`}
                      >
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">{event.time}</div>
                          <div className="text-sm mt-1">{event.description}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-6 h-6 p-0 rounded-full"
                          onClick={() => removeSelectedEvent(index)}
                          data-testid={`remove-event-${index}`}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Export Button */}
              <Button 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                data-testid="generate-package"
              >
                🎥 Generate Highlight Package
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}