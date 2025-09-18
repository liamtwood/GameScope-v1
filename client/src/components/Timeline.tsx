import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MatchEvent, TeamConfig, timestampToSeconds, getTeamConfig } from '@/lib/types';

interface TimelineProps {
  events: MatchEvent[];
  onEventClick?: (eventTime: number, period: number) => void;
}

type PeriodType = 'full' | 'first' | 'second';

interface ProcessedEvent {
  id: string;
  minute: number;
  period: number;
  type: string;
  lane: string;
  teamConfig: TeamConfig;
  player: string;
  isGoal?: boolean;
  isPenalty?: boolean;
  isSaved?: boolean;
  isPost?: boolean;
  isImportant?: boolean;
  isRoutine?: boolean;
  originalEvent: MatchEvent;
}

export function Timeline({ events, onEventClick }: TimelineProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('full');
  const [hoveredEvent, setHoveredEvent] = useState<ProcessedEvent | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });


  // Process events into timeline format
  const processedEvents = useMemo(() => {
    const processed: ProcessedEvent[] = [];

    events.forEach(event => {
      if (!event.team?.name || !event.type?.name) return;

      const teamConfig = getTeamConfig(event.team.name, event.team.id);
      const eventType = event.type.name;
      let playerDisplay = event.player?.name || 'Team Action';
      
      let lane = '';
      let isGoal = false;
      let isPenalty = false;
      let isSaved = false;
      let isPost = false;
      let isImportant = false;
      let isRoutine = false;

      // Determine lane and event properties
      if (eventType === 'Shot') {
        lane = 'shots';
        const outcome = event.shot?.outcome?.name;
        if (outcome === 'Goal') {
          lane = 'goals';
          isGoal = true;
          isImportant = true;
        } else if (outcome === 'Post') {
          isPost = true;
        } else if (outcome === 'Saved' || outcome === 'Blocked') {
          // Keep in shots lane
        } else {
          isRoutine = true;
        }
        
        if (event.shot?.type?.name === 'Penalty') {
          isPenalty = true;
          lane = 'goals';
          if (outcome === 'Saved') {
            isSaved = true;
            isImportant = true;
          }
        }
      } else if (eventType === 'Pass') {
        if (event.pass?.type?.name === 'Corner') {
          lane = 'corners';
          isRoutine = true;
        } else if (event.pass?.type?.name === 'Free Kick') {
          lane = 'freekicks';
          isRoutine = true;
        } else if (event.pass?.type?.name === 'Goal Kick') {
          lane = 'goalkicks';
          isRoutine = true;
        }
      } else if (eventType === 'Substitution') {
        lane = 'subs';
        const replacement = event.substitution?.replacement?.name;
        if (replacement) {
          // Update player display for substitutions
          playerDisplay = `${replacement} (Sub)`;
        }
      }

      if (lane) {
        processed.push({
          id: event.id,
          minute: event.minute,
          period: event.period,
          type: eventType,
          lane,
          teamConfig,
          player: playerDisplay,
          isGoal,
          isPenalty,
          isSaved,
          isPost,
          isImportant,
          isRoutine,
          originalEvent: event
        });
      }
    });

    return processed;
  }, [events]);

  // Get available periods from data
  const availablePeriods = useMemo(() => {
    const periods = new Set(events.map(e => e.period));
    return Array.from(periods).sort((a, b) => a - b);
  }, [events]);

  // Filter events by period
  const filteredEvents = useMemo(() => {
    switch (selectedPeriod) {
      case 'first':
        return processedEvents.filter(e => e.period === 1);
      case 'second':
        return processedEvents.filter(e => e.period === 2);
      case 'full':
      default:
        return processedEvents;
    }
  }, [processedEvents, selectedPeriod]);

  // Calculate period statistics with dynamic team data
  const periodStats = useMemo(() => {
    // Get unique teams from filtered events
    const teams = Array.from(new Set(filteredEvents.map(e => e.teamConfig.id)))
      .map(id => filteredEvents.find(e => e.teamConfig.id === id)?.teamConfig)
      .filter(Boolean) as TeamConfig[];
    
    const keyMoments = filteredEvents.filter(e => e.isImportant).length;
    
    // Compute time range dynamically from the actual data
    let timeRange = '';
    if (filteredEvents.length > 0) {
      const minMinute = Math.min(...filteredEvents.map(e => e.minute));
      const maxMinute = Math.max(...filteredEvents.map(e => e.minute));
      timeRange = `${minMinute}-${maxMinute}'`;
    } else {
      switch (selectedPeriod) {
        case 'first':
          timeRange = '0-45\'';
          break;
        case 'second':
          timeRange = '45-90\'';
          break;
        case 'full':
        default:
          timeRange = '0-90\'';
          break;
      }
    }

    // Calculate shots for each team
    const teamStats = teams.map(team => ({
      team,
      shots: filteredEvents.filter(e => e.teamConfig.id === team.id && (e.lane === 'shots' || e.lane === 'goals')).length
    }));

    return {
      timeRange,
      teamStats,
      totalEvents: filteredEvents.length,
      keyMoments
    };
  }, [filteredEvents, selectedPeriod]);

  // Get time range for positioning - computed dynamically from data
  const timeRange = useMemo(() => {
    if (filteredEvents.length === 0) {
      // Fallback to standard ranges if no events
      switch (selectedPeriod) {
        case 'first': return { min: 0, max: 45 };
        case 'second': return { min: 45, max: 90 };
        case 'full': 
        default: return { min: 0, max: 90 };
      }
    }
    
    const minutes = filteredEvents.map(e => e.minute);
    const minMinute = Math.min(...minutes);
    const maxMinute = Math.max(...minutes);
    
    // Add some padding for better visualization
    const padding = (maxMinute - minMinute) * 0.05;
    
    return {
      min: Math.max(0, minMinute - padding),
      max: maxMinute + padding
    };
  }, [filteredEvents, selectedPeriod]);

  // Calculate position percentage for event markers
  const getEventPosition = (minute: number) => {
    return ((minute - timeRange.min) / (timeRange.max - timeRange.min)) * 100;
  };

  // Get event marker styles with dynamic team colors
  const getEventMarkerStyle = (event: ProcessedEvent) => {
    let baseClasses = 'absolute w-4 h-4 rounded-full cursor-pointer transition-all duration-200 border-2 border-white shadow-sm z-10';
    let hoverClasses = 'hover:scale-125 hover:z-50 hover:shadow-lg';
    
    // Dynamic team colors
    baseClasses += ` ${event.teamConfig.color}`;
    if (event.isRoutine) {
      baseClasses += ` !${event.teamConfig.lightColor} !w-3 !h-3 opacity-80`;
    }

    // Special event styling
    if (event.isGoal) {
      baseClasses += ' !w-6 !h-6 !bg-gradient-to-br !from-yellow-400 !to-orange-500 !border-[3px] !z-20';
    } else if (event.isSaved && event.isPenalty) {
      baseClasses += ' !w-5 !h-5 !bg-gradient-to-br !from-red-600 !to-red-800 !border-[3px] !z-[18]';
    } else if (event.isPost) {
      baseClasses += ' !bg-orange-500';
    } else if (event.lane === 'shots') {
      baseClasses += ' !w-4 !h-4 !z-10';
    }

    return `${baseClasses} ${hoverClasses}`;
  };

  // Handle event click
  const handleEventClick = (event: ProcessedEvent) => {
    if (onEventClick && event.originalEvent) {
      const eventTime = timestampToSeconds(event.originalEvent.timestamp);
      onEventClick(eventTime, event.originalEvent.period);
    }
  };

  // Handle mouse move for tooltip
  const handleMouseMove = (e: React.MouseEvent, event: ProcessedEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
    setHoveredEvent(event);
  };

  const handleMouseLeave = () => {
    setHoveredEvent(null);
  };

  // Get event count for period tabs - use actual period data
  const getEventCount = (period: PeriodType) => {
    switch (period) {
      case 'first':
        return processedEvents.filter(e => e.period === 1).length;
      case 'second':
        return processedEvents.filter(e => e.period === 2).length;
      case 'full':
      default:
        return processedEvents.length;
    }
  };

  return (
    <div className="h-full p-4 space-y-4" data-testid="timeline-component">
      {/* Period Tabs */}
      <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {[
          { key: 'full' as PeriodType, label: 'Full Match' },
          { key: 'first' as PeriodType, label: '1st Half' },
          { key: 'second' as PeriodType, label: '2nd Half' }
        ].map(({ key, label }) => (
          <Button
            key={key}
            variant={selectedPeriod === key ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedPeriod(key)}
            className={`flex-1 relative ${selectedPeriod === key ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
            data-testid={`period-tab-${key}`}
          >
            {label}
            <Badge variant="secondary" className="ml-2 text-xs">
              {getEventCount(key)}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Period Statistics */}
      <div className={`grid gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg`} style={{ gridTemplateColumns: `repeat(${3 + periodStats.teamStats.length}, 1fr)` }} data-testid="period-stats">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{periodStats.timeRange}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Time Range</div>
        </div>
        {periodStats.teamStats.map(({ team, shots }) => (
          <div key={team.id} className="text-center">
            <div className={`text-lg font-bold ${team.textColor}`}>{shots}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">{team.shortName} Shots</div>
          </div>
        ))}
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{periodStats.totalEvents}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total Events</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{periodStats.keyMoments}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Key Moments</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 border-2 border-gray-200 dark:border-gray-700 relative">
        {/* Time Scale - Dynamic based on actual data */}
        <div className="flex relative pl-24 pr-2 pb-2 mb-3 text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700 h-5">
          {(() => {
            const { min, max } = timeRange;
            const duration = max - min;
            const intervals = 5; // Show 5 time markers
            const step = duration / (intervals - 1);
            
            return Array.from({ length: intervals }, (_, i) => {
              const minute = Math.round(min + (step * i));
              const position = (i / (intervals - 1)) * 100;
              
              return (
                <span 
                  key={i}
                  className="absolute" 
                  style={{ 
                    left: `calc(100px + ${position}%)`,
                    transform: i === intervals - 1 ? 'translateX(-100%)' : 'none'
                  }}
                >
                  {minute}'
                </span>
              );
            });
          })()} 
        </div>
        
        {/* Timeline Lanes */}
        <div className="space-y-0">
          {[
            { lane: 'goals', label: 'Goals/Pens' },
            { lane: 'shots', label: 'Shots' },
            { lane: 'corners', label: 'Corners' },
            { lane: 'freekicks', label: 'Free Kicks' },
            { lane: 'goalkicks', label: 'Goal Kicks' },
            { lane: 'subs', label: 'Subs' }
          ].map(({ lane, label }) => {
            const laneEvents = filteredEvents.filter(e => e.lane === lane);
            
            return (
              <div key={lane} className="h-11 relative border-b border-gray-100 dark:border-gray-800 last:border-b-0 flex items-center">
                {/* Lane Label */}
                <div className="absolute left-2 z-20 bg-white dark:bg-gray-800 bg-opacity-90 px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-400 font-semibold min-w-20">
                  {label}
                </div>
                
                {/* Lane Events */}
                <div className="absolute left-24 right-2 h-full flex items-center">
                  {laneEvents.map(event => (
                    <div
                      key={event.id}
                      className={getEventMarkerStyle(event)}
                      style={{
                        left: `${getEventPosition(event.minute)}%`,
                        top: '50%',
                        transform: 'translateY(-50%)'
                      }}
                      onClick={() => handleEventClick(event)}
                      onMouseMove={(e) => handleMouseMove(e, event)}
                      onMouseLeave={handleMouseLeave}
                      data-testid={`timeline-event-${event.id}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredEvent && (
        <div
          className="fixed bg-white dark:bg-gray-800 border-2 border-blue-500 dark:border-blue-400 rounded-lg p-3 shadow-lg z-50 pointer-events-none opacity-100 transition-opacity duration-200 min-w-40"
          style={{
            left: `${mousePosition.x + 10}px`,
            top: `${mousePosition.y - 10}px`,
            transform: 'translateY(-100%)'
          }}
          data-testid="timeline-tooltip"
        >
          <div className="font-bold text-blue-600 dark:text-blue-400 mb-1">
            {hoveredEvent.minute}'
          </div>
          <div className="text-gray-900 dark:text-gray-100 text-sm">
            {hoveredEvent.player}
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-xs">
            {hoveredEvent.teamConfig.name}
          </div>
        </div>
      )}

      {/* Legend - Dynamic team colors */}
      <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 justify-center text-xs">
        {/* Dynamic team legend items */}
        {periodStats.teamStats.map(({ team }) => (
          <div key={team.id} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full ${team.color} border-2 border-white shadow-sm`} />
            <span className="text-gray-600 dark:text-gray-400">{team.shortName}</span>
          </div>
        ))}
        {/* Event type legend items */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 border-2 border-white shadow-sm" />
          <span className="text-gray-600 dark:text-gray-400">Goal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-600 to-red-800 border-2 border-white shadow-sm" />
          <span className="text-gray-600 dark:text-gray-400">Penalty Saved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white shadow-sm" />
          <span className="text-gray-600 dark:text-gray-400">Hit Post</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400 border-2 border-white shadow-sm opacity-80" />
          <span className="text-gray-600 dark:text-gray-400">Routine Events</span>
        </div>
      </div>
    </div>
  );
}

export default Timeline;