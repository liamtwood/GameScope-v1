import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MatchEventTable } from '@/components/MatchEventTable';
import { Timeline } from '@/components/Timeline';
import { VideoAnalysisSettings } from '@/components/VideoAnalysisSettings';
import { HighlightGenerator } from '@/components/HighlightGenerator';
import { AdvancedHighlights } from '@/components/AdvancedHighlights';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MatchEvent } from '@/lib/types';


interface VideoWithEventsProps {
  url: string;
  onVideoUrlChange: (url: string) => void;
  fixtureId?: string;
}

type Platform = 'youtube' | 'dailymotion' | 'direct' | 'unknown';

export function VideoWithEvents({ url, onVideoUrlChange, fixtureId }: VideoWithEventsProps) {
  const [currentSeekTime, setCurrentSeekTime] = useState<number | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [kickoffOffset, setKickoffOffset] = useState<number>(0);
  const [secondHalfOffset, setSecondHalfOffset] = useState<number>(0);
  
  // Load saved offsets from localStorage
  useEffect(() => {
    const savedKickoff = localStorage.getItem('match-kickoff-offset');
    const savedSecondHalf = localStorage.getItem('match-second-half-offset');
    if (savedKickoff) setKickoffOffset(parseFloat(savedKickoff));
    if (savedSecondHalf) setSecondHalfOffset(parseFloat(savedSecondHalf));
  }, []);
  
  useEffect(() => {
    localStorage.setItem('match-kickoff-offset', kickoffOffset.toString());
  }, [kickoffOffset]);
  
  useEffect(() => {
    localStorage.setItem('match-second-half-offset', secondHalfOffset.toString());
  }, [secondHalfOffset]);
  
  // Platform detection
  const getPlatform = (inputUrl: string): Platform => {
    if (!inputUrl) return 'unknown';
    if (/youtube\.com|youtu\.be/.test(inputUrl)) return 'youtube';
    if (/dailymotion\.com/.test(inputUrl)) return 'dailymotion';
    // Direct video file — MP4, WebM, OGG, HLS (.m3u8), DASH (.mpd), or blob
    if (/\.(mp4|webm|ogv|m3u8|mpd)(\?|$)/i.test(inputUrl) || inputUrl.startsWith('blob:')) return 'direct';
    return 'unknown';
  };

  const getYouTubeId = (inputUrl: string) => {
    const match = inputUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const getDailymotionId = (inputUrl: string) => {
    const match = inputUrl.match(/dailymotion\.com\/(?:video|embed\/video)\/([^/?#]+)/);
    return match ? match[1] : null;
  };

  const getEmbedUrl = (inputUrl: string): string | null => {
    const p = getPlatform(inputUrl);
    if (p === 'youtube') {
      const id = getYouTubeId(inputUrl);
      return id ? `https://www.youtube.com/embed/${id}?enablejsapi=1&controls=1&rel=0&autoplay=0` : null;
    }
    if (p === 'dailymotion') {
      const id = getDailymotionId(inputUrl);
      // Use geo.dailymotion.com directly to avoid redirect stripping api=postMessage
      return id ? `https://geo.dailymotion.com/player.html?video=${id}` : null;
    }
    return null;
  };

  const platform = getPlatform(url);
  const embedUrl = getEmbedUrl(url);

  const handleEventClick = (eventTimeInSeconds: number, eventPeriod: number = 1) => {
    const videoTime = eventPeriod === 2
      ? eventTimeInSeconds + secondHalfOffset
      : eventTimeInSeconds + kickoffOffset;
    const seekTime = Math.max(0, videoTime);
    setCurrentSeekTime(seekTime);

    if (platform === 'direct' && videoRef.current) {
      // Native HTML5 video — instant, reliable seek
      videoRef.current.currentTime = seekTime;
      videoRef.current.play().catch(() => {});
    } else if (iframeRef.current?.contentWindow) {
      if (platform === 'dailymotion') {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ command: 'seek', parameters: [seekTime] }),
          '*'
        );
      } else {
        // YouTube
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'seekTo', args: [seekTime, true] }),
          '*'
        );
      }
    }
  };

  const handleHighlightSelect = (highlight: any) => {
    handleEventClick(highlight.startTime, highlight.event.period);
  };

  const handlePackageGenerate = (highlightPackage: any) => {
    console.log('Generated highlight package:', highlightPackage);
  };
  
  const handleViewHighlightsVideo = (videoUrl: string, _highlightPackage: any) => {
    onVideoUrlChange(videoUrl);
  };

  // Fetch per-fixture match events from DB
  const { data: fixtureMatchEvents } = useQuery<{ events: any[]; lineups: any[] | null; source: string | null }>({
    queryKey: ["/api/fixtures", fixtureId, "match-events"],
    queryFn: async () => {
      if (!fixtureId) throw new Error("No fixtureId");
      const res = await fetch(`/api/fixtures/${fixtureId}/match-events`);
      if (!res.ok) throw new Error("No events stored");
      return res.json();
    },
    enabled: !!fixtureId,
    retry: false,
  });

  const activeEvents: any[] = fixtureMatchEvents?.events ?? [];

  const platformLabel: Record<Platform, string> = {
    youtube: 'YouTube',
    dailymotion: 'Dailymotion',
    direct: 'direct video',
    unknown: '',
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <Card className="mb-6">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Paste a YouTube, Dailymotion, or direct MP4/HLS URL…"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && urlInput.trim()) {
                  onVideoUrlChange(urlInput.trim());
                  setUrlInput('');
                }
              }}
              className="flex-1"
            />
            <Button
              variant="default"
              onClick={() => {
                if (urlInput.trim()) {
                  onVideoUrlChange(urlInput.trim());
                  setUrlInput('');
                }
              }}
              disabled={!urlInput.trim()}
            >
              Load Video
            </Button>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border rounded-md hover:bg-accent transition-colors whitespace-nowrap"
              >
                ↗ Watch video
              </a>
            )}
            <VideoAnalysisSettings
              videoUrl={url}
              onVideoUrlChange={onVideoUrlChange}
              kickoffOffset={kickoffOffset}
              onKickoffOffsetChange={setKickoffOffset}
              secondHalfOffset={secondHalfOffset}
              onSecondHalfOffsetChange={setSecondHalfOffset}
              onEventClick={handleEventClick}
            />
          </div>
          {!url && (
            <p className="text-xs text-muted-foreground mt-2">
              Supports YouTube, Dailymotion, and direct video URLs (.mp4, .m3u8, etc). Paste one above and click Load Video.
            </p>
          )}
          {url && platform !== 'unknown' && (
            <p className="text-xs text-muted-foreground mt-1">
              {platformLabel[platform]} loaded
              {currentSeekTime !== null && (
                <> · Last seek: {Math.floor(currentSeekTime / 60)}:{String(Math.round(currentSeekTime % 60)).padStart(2, '0')}</>
              )}
            </p>
          )}
          {url && platform === 'unknown' && (
            <p className="text-xs text-amber-500 mt-1">
              Unrecognised URL format. Try YouTube, Dailymotion, or a direct .mp4/.m3u8 link.
            </p>
          )}
        </CardContent>
      </Card>
      
      {/* Single persistent video player */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {platform === 'direct' ? (
              <video
                ref={videoRef}
                key={url}
                src={url}
                controls
                className="w-full h-full"
                preload="metadata"
              />
            ) : embedUrl ? (
              <iframe
                ref={iframeRef}
                key={embedUrl}
                src={embedUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                data-testid="match-video-iframe"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white/60 text-sm gap-2">
                <p>Paste a video URL above and click Load Video</p>
                <p className="text-xs text-white/40">YouTube · Dailymotion · MP4 · HLS (.m3u8)</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="events" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="events">Match Events</TabsTrigger>
          <TabsTrigger value="highlights">Generate Highlights</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Highlights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="events">
          <MatchEventTable onEventClick={handleEventClick} events={activeEvents} />
        </TabsContent>
        
        <TabsContent value="highlights">
          <HighlightGenerator 
            onHighlightSelect={handleHighlightSelect}
            onPackageGenerate={handlePackageGenerate}
            onViewHighlightsVideo={handleViewHighlightsVideo}
            events={activeEvents}
          />
        </TabsContent>
        
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Match Timeline</CardTitle>
              <p className="text-sm text-muted-foreground">Click any event to jump to that moment in the video above.</p>
            </CardHeader>
            <CardContent>
              <Timeline 
                events={activeEvents as MatchEvent[]} 
                onEventClick={(eventTime: number, period: number) => handleEventClick(eventTime, period)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="advanced">
          <AdvancedHighlights onEventClick={handleEventClick} events={activeEvents} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
