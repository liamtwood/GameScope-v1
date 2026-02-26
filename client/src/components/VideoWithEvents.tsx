import { useState, useEffect, useRef, useMemo } from 'react';
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
import { List, X, Maximize2, Minimize2 } from 'lucide-react';

interface VideoWithEventsProps {
  url: string;
  onVideoUrlChange: (url: string) => void;
  fixtureId?: string;
}

type Platform = 'youtube' | 'dailymotion' | 'direct' | 'unknown';
type OverlayChip = 'all' | 'goal' | 'shot' | 'card';

// Dailymotion Player ID — use registered ID when available, fall back to generic player.html
const DM_PLAYER_ID = '';

function eventBadgeClass(typeName: string): string {
  const t = typeName.toLowerCase();
  if (t === 'goal') return 'bg-green-600 text-white';
  if (t.includes('shot')) return 'bg-amber-500 text-black';
  if (t.includes('card') || t === 'foul committed') return 'bg-red-600 text-white';
  if (t.includes('pass')) return 'bg-blue-600/80 text-white';
  if (t === 'carry') return 'bg-slate-600 text-white/80';
  return 'bg-white/15 text-white/80';
}

function eventMatchesChip(typeName: string, chip: OverlayChip): boolean {
  if (chip === 'all') return true;
  const t = typeName.toLowerCase();
  if (chip === 'goal') return t === 'goal';
  if (chip === 'shot') return t.includes('shot');
  if (chip === 'card') return t.includes('card') || t === 'foul committed';
  return true;
}

export function VideoWithEvents({ url, onVideoUrlChange, fixtureId }: VideoWithEventsProps) {
  const [currentSeekTime, setCurrentSeekTime] = useState<number | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [kickoffOffset, setKickoffOffset] = useState<number>(0);
  const [secondHalfOffset, setSecondHalfOffset] = useState<number>(0);

  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayFilter, setOverlayFilter] = useState('');
  const [overlayChip, setOverlayChip] = useState<OverlayChip>('all');
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);

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

  // Track native fullscreen changes (e.g. user presses Escape)
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const getPlatform = (inputUrl: string): Platform => {
    if (!inputUrl) return 'unknown';
    if (/youtube\.com|youtu\.be/.test(inputUrl)) return 'youtube';
    if (/dailymotion\.com/.test(inputUrl)) return 'dailymotion';
    if (/\.(mp4|webm|ogv|m3u8|mpd)(\?|$)/i.test(inputUrl) || inputUrl.startsWith('blob:')) return 'direct';
    return 'unknown';
  };

  const getYouTubeId = (inputUrl: string) => {
    const match = inputUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const getDailymotionId = (inputUrl: string) => {
    // /video/ID or /embed/video/ID path formats
    const pathMatch = inputUrl.match(/dailymotion\.com\/(?:video|embed\/video)\/([^/?#&]+)/);
    if (pathMatch) return pathMatch[1];
    // geo.dailymotion.com/player.html?video=ID or player/{pid}.html?video=ID
    const paramMatch = inputUrl.match(/[?&]video=([^&]+)/);
    if (paramMatch) return paramMatch[1];
    return null;
  };

  const getEmbedUrl = (inputUrl: string): string | null => {
    const p = getPlatform(inputUrl);
    if (p === 'youtube') {
      const id = getYouTubeId(inputUrl);
      // origin= tells YouTube which page controls it — required for postMessage seek to work
      const origin = encodeURIComponent(window.location.origin);
      return id ? `https://www.youtube.com/embed/${id}?enablejsapi=1&controls=1&rel=0&autoplay=0&origin=${origin}` : null;
    }
    if (p === 'dailymotion') {
      const id = getDailymotionId(inputUrl);
      if (!id) return null;
      const base = DM_PLAYER_ID
        ? `https://geo.dailymotion.com/player/${DM_PLAYER_ID}.html`
        : `https://geo.dailymotion.com/player.html`;
      return `${base}?video=${id}&api=postMessage&id=dm-player`;
    }
    return null;
  };

  const platform = getPlatform(url);
  const embedUrl = getEmbedUrl(url);

  const handleEventClick = (eventTimeInSeconds: number, eventPeriod: number = 1, eventId?: string) => {
    const videoTime = eventPeriod === 2
      ? eventTimeInSeconds + secondHalfOffset
      : eventTimeInSeconds + kickoffOffset;
    const seekTime = Math.max(0, videoTime);
    setCurrentSeekTime(seekTime);
    if (eventId) setLastClickedId(eventId);

    console.log('[seek]', { platform, seekTime, eventTimeInSeconds, eventPeriod, url });

    if (platform === 'direct' && videoRef.current) {
      videoRef.current.currentTime = seekTime;
      videoRef.current.play().catch(() => {});

    } else if (platform === 'dailymotion' && iframeRef.current?.contentWindow) {
      // Dailymotion generic player postMessage API: JSON-stringified, parameters.position
      const dmWin = iframeRef.current.contentWindow;
      dmWin.postMessage(JSON.stringify({ command: 'seek', parameters: [seekTime] }), '*');
      // Some DM player builds need an explicit play after seek
      setTimeout(() => {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(JSON.stringify({ command: 'play' }), '*');
        }
      }, 300);

    } else if (platform === 'youtube' && iframeRef.current?.contentWindow) {
      // YouTube IFrame API — seekTo via postMessage requires enablejsapi=1 in src
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'seekTo', args: [seekTime, true] }),
        'https://www.youtube.com'
      );
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

  const handleFullscreen = () => {
    const el = videoContainerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen().catch(() => {});
    }
  };

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

  const overlayEvents = useMemo(() => {
    let evts = activeEvents;
    if (overlayChip !== 'all') {
      evts = evts.filter(e => eventMatchesChip(e.type?.name ?? '', overlayChip));
    }
    if (overlayFilter.trim()) {
      const q = overlayFilter.toLowerCase();
      evts = evts.filter(e =>
        (e.type?.name ?? '').toLowerCase().includes(q) ||
        (e.player?.name ?? '').toLowerCase().includes(q) ||
        (e.team?.name ?? '').toLowerCase().includes(q)
      );
    }
    return evts;
  }, [activeEvents, overlayChip, overlayFilter]);

  const platformLabel: Record<Platform, string> = {
    youtube: 'YouTube',
    dailymotion: 'Dailymotion',
    direct: 'direct video',
    unknown: '',
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* URL input bar */}
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

      {/* Video player card */}
      <Card className="mb-6 overflow-hidden">
        {/* Control bar above the video */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30">
          <span className="text-xs text-muted-foreground">
            {activeEvents.length > 0
              ? `${activeEvents.length.toLocaleString()} events loaded`
              : 'No events loaded'}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 text-xs px-2"
              onClick={handleFullscreen}
              title="Fullscreen — video and events panel together"
            >
              {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </Button>
            {activeEvents.length > 0 && (
              <Button
                size="sm"
                variant={showOverlay ? 'default' : 'outline'}
                className="gap-1.5 h-7 text-xs"
                onClick={() => setShowOverlay(v => !v)}
              >
                {showOverlay ? <X className="h-3 w-3" /> : <List className="h-3 w-3" />}
                {showOverlay ? 'Hide Events' : 'Show Events'}
              </Button>
            )}
          </div>
        </div>

        <CardContent className="p-0">
          {/*
            Video container: position relative, aspect-video.
            The iframe/video fills the container absolutely.
            The events panel overlays the right 32% on top.
          */}
          <div
            ref={videoContainerRef}
            className="relative w-full bg-black"
            style={{ aspectRatio: '16 / 9' }}
          >
            {/* Video / iframe — fills container */}
            {platform === 'direct' ? (
              <video
                ref={videoRef}
                key={url}
                src={url}
                controls
                className="absolute inset-0 w-full h-full"
                preload="metadata"
              />
            ) : embedUrl ? (
              <iframe
                ref={iframeRef}
                key={embedUrl}
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                style={{ border: 'none', display: 'block' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                data-testid="match-video-iframe"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60 text-sm gap-2">
                <p>Paste a video URL above and click Load Video</p>
                <p className="text-xs text-white/40">YouTube · Dailymotion · MP4 · HLS (.m3u8)</p>
              </div>
            )}

            {/* Events overlay — right 32%, sits on top of the video */}
            {showOverlay && activeEvents.length > 0 && (
              <div
                className="absolute top-0 right-0 bottom-0 flex flex-col"
                style={{
                  width: '32%',
                  zIndex: 20,
                  background: 'rgba(4, 4, 12, 0.88)',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                  borderLeft: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                {/* Overlay header */}
                <div
                  className="flex-shrink-0 px-2 pt-2 pb-1.5 border-b border-white/10"
                  style={{ background: 'rgba(0,0,0,0.35)' }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">
                      {overlayEvents.length.toLocaleString()} / {activeEvents.length.toLocaleString()} events
                    </span>
                    <button
                      onClick={() => setShowOverlay(false)}
                      className="text-white/40 hover:text-white/80 transition-colors"
                      title="Close overlay"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Text filter */}
                  <input
                    className="w-full text-xs bg-white/10 text-white placeholder:text-white/30 rounded px-2 py-1 outline-none border border-white/10 focus:border-white/30 mb-1.5"
                    placeholder="Filter by type or player…"
                    value={overlayFilter}
                    onChange={e => setOverlayFilter(e.target.value)}
                  />

                  {/* Quick-filter chips */}
                  <div className="flex gap-1 flex-wrap">
                    {(['all', 'goal', 'shot', 'card'] as OverlayChip[]).map(chip => (
                      <button
                        key={chip}
                        onClick={() => setOverlayChip(chip)}
                        className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${
                          overlayChip === chip
                            ? 'bg-white/20 border-white/40 text-white font-semibold'
                            : 'border-white/15 text-white/40 hover:text-white/70 hover:border-white/25'
                        }`}
                      >
                        {chip === 'all' ? 'All' : chip === 'goal' ? '⚽ Goals' : chip === 'shot' ? '🎯 Shots' : '🟨 Cards'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scrollable event rows — fills remaining panel height */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                  {overlayEvents.length === 0 ? (
                    <div className="flex items-center justify-center h-16 text-white/30 text-xs">
                      No events match
                    </div>
                  ) : (
                    overlayEvents.map((event: any) => {
                      const minutes = event.minute ?? 0;
                      const seconds = event.second ?? 0;
                      const totalSeconds = minutes * 60 + seconds;
                      const period = event.period ?? 1;
                      const typeName: string = event.type?.name ?? 'Unknown';
                      const playerName: string = event.player?.name ?? '';

                      const rowId = String(event.id ?? event.index);
                      const isActive = lastClickedId === rowId;

                      return (
                        <button
                          key={rowId}
                          onClick={() => handleEventClick(totalSeconds, period, rowId)}
                          className={`w-full flex items-center gap-1.5 px-2 text-left transition-colors group border-b border-white/5 cursor-pointer ${
                            isActive ? 'bg-white/20' : 'hover:bg-white/10 active:bg-white/15'
                          }`}
                          style={{ minHeight: 26 }}
                        >
                          <span className="text-white/40 text-[10px] tabular-nums shrink-0 w-9 text-right">
                            {minutes}'{seconds > 0 ? String(seconds).padStart(2, '0') + '"' : ''}
                          </span>
                          <span className={`text-[9px] px-1 py-px rounded shrink-0 font-medium ${eventBadgeClass(typeName)}`}>
                            {typeName.length > 11 ? typeName.slice(0, 10) + '…' : typeName}
                          </span>
                          {playerName && (
                            <span className="text-white/55 text-[10px] truncate group-hover:text-white/80 transition-colors">
                              {playerName}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
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
