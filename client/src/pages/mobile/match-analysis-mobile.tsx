import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PlayCircle, PauseCircle, SkipBack, SkipForward, BarChart3, Video, Clock, Target } from "lucide-react";
import { useTeam } from "@/contexts/team-context";
import { Fixture } from "@shared/schema";
import { MatchEvent } from "@/lib/types";
import { format } from "date-fns";

export default function MatchAnalysisMobile() {
  const { selectedTeam } = useTeam();
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<MatchEvent | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: fixtures = [] } = useQuery<Fixture[]>({
    queryKey: ['/api/fixtures', selectedTeam?.id],
    enabled: !!selectedTeam?.id
  });

  const { data: matchEvents = [] } = useQuery<MatchEvent[]>({
    queryKey: ['/api/match-events', selectedFixture?.id],
    enabled: !!selectedFixture?.id
  });

  // Filter completed fixtures with video
  const availableFixtures = fixtures.filter(f => 
    f.status === 'COMPLETED' && f.hasVideo
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Group events by type
  const eventsByType = {
    goals: matchEvents.filter(e => e.type === 'GOAL'),
    fouls: matchEvents.filter(e => e.type === 'FOUL'),
    cards: matchEvents.filter(e => e.type === 'YELLOW_CARD' || e.type === 'RED_CARD'),
    substitutions: matchEvents.filter(e => e.type === 'SUBSTITUTION'),
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seekToEvent = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      setCurrentTime(timestamp);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'GOAL':
        return <Target className="h-4 w-4 text-green-600" />;
      case 'FOUL':
        return <div className="h-4 w-4 bg-orange-500 rounded-full" />;
      case 'YELLOW_CARD':
        return <div className="h-4 w-4 bg-yellow-500 rounded" />;
      case 'RED_CARD':
        return <div className="h-4 w-4 bg-red-500 rounded" />;
      case 'SUBSTITUTION':
        return <div className="h-4 w-4 bg-blue-500 rounded-full" />;
      default:
        return <div className="h-4 w-4 bg-gray-500 rounded-full" />;
    }
  };

  const EventCard = ({ event }: { event: MatchEvent }) => (
    <Card 
      className={`cursor-pointer transition-colors ${
        selectedEvent?.id === event.id ? 'bg-accent' : ''
      }`}
      onClick={() => {
        setSelectedEvent(event);
        if (event.timestamp) {
          seekToEvent(event.timestamp);
        }
      }}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getEventIcon(event.type)}
            <div>
              <p className="font-medium text-sm">{event.player}</p>
              <p className="text-xs text-muted-foreground">{event.type.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{event.minute}'</p>
            {event.timestamp && (
              <p className="text-xs text-muted-foreground">
                {formatTime(event.timestamp)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!selectedTeam) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Please select a team to view match analysis</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedFixture) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold">Match Analysis</h1>
          <p className="text-sm text-muted-foreground">Select a match to analyze</p>
        </div>

        {availableFixtures.length > 0 ? (
          <div className="space-y-3">
            {availableFixtures.map((fixture) => (
              <Card 
                key={fixture.id} 
                className="cursor-pointer hover:bg-accent"
                onClick={() => setSelectedFixture(fixture)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{fixture.opponent}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(fixture.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {fixture.homeScore !== null && fixture.awayScore !== null && (
                        <Badge>
                          {fixture.type === 'HOME' 
                            ? `${fixture.homeScore}-${fixture.awayScore}`
                            : `${fixture.awayScore}-${fixture.homeScore}`
                          }
                        </Badge>
                      )}
                      <Video className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-32 space-y-2">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No match videos available for analysis</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">{selectedFixture.opponent}</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(selectedFixture.date), 'MMM d, yyyy')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedFixture(null)}
        >
          Back
        </Button>
      </div>

      {/* Video Player */}
      <Card>
        <CardContent className="p-0">
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full h-48 object-cover rounded-t-lg"
              controls={false}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source src="/sample-video.mp4" type="video/mp4" />
            </video>
            
            {/* Custom Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-3">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-white hover:text-white hover:bg-white/20"
                    onClick={() => seekToEvent(Math.max(0, currentTime - 10))}
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-white hover:text-white hover:bg-white/20"
                    onClick={handlePlayPause}
                  >
                    {isPlaying ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-white hover:text-white hover:bg-white/20"
                    onClick={() => seekToEvent(currentTime + 10)}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm">
                  {formatTime(currentTime)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Match Events */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          <TabsTrigger value="goals" className="text-xs">Goals</TabsTrigger>
          <TabsTrigger value="cards" className="text-xs">Cards</TabsTrigger>
          <TabsTrigger value="fouls" className="text-xs">Fouls</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-4">
          {matchEvents.length > 0 ? (
            matchEvents
              .sort((a, b) => a.minute - b.minute)
              .map((event) => (
                <EventCard key={event.id} event={event} />
              ))
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-20">
                <p className="text-muted-foreground text-sm">No events recorded</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="goals" className="space-y-3 mt-4">
          {eventsByType.goals.length > 0 ? (
            eventsByType.goals.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-20">
                <p className="text-muted-foreground text-sm">No goals recorded</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cards" className="space-y-3 mt-4">
          {eventsByType.cards.length > 0 ? (
            eventsByType.cards.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-20">
                <p className="text-muted-foreground text-sm">No cards recorded</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="fouls" className="space-y-3 mt-4">
          {eventsByType.fouls.length > 0 ? (
            eventsByType.fouls.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-20">
                <p className="text-muted-foreground text-sm">No fouls recorded</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}