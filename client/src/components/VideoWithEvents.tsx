import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { List, X, Maximize2, Minimize2, Pin, PinOff } from 'lucide-react';

function parseMMSS(str: string): number | null {
  const trimmed = str.trim();
  const parts = trimmed.split(':');
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10);
    const s = parseInt(parts[1], 10);
    if (!isNaN(m) && !isNaN(s) && s >= 0 && s < 60) return m * 60 + s;
  } else if (parts.length === 1) {
    const n = parseInt(parts[0], 10);
    if (!isNaN(n)) return n;
  }
  return null;
}

function formatMMSS(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface VideoWithEventsProps {
  url: string;
  onVideoUrlChange: (url: string) => void;
  fixtureId?: string;
  initialKickoffOffset?: number;
  initialSecondHalfOffset?: number;
}

type Platform = 'youtube' | 'dailymotion' | 'vimeo' | 'googledrive' | 'direct' | 'unknown';
type OverlayChip = 'all' | 'goal' | 'shot' | 'card' | 'corner' | 'freekick';

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

function eventMatchesChip(event: any, chip: OverlayChip): boolean {
  if (chip === 'all') return true;
  const t = (event.type?.name ?? '').toLowerCase();
  const passType = (event.pass?.type?.name ?? '').toLowerCase();
  if (chip === 'goal') return t === 'goal';
  if (chip === 'shot') return t.includes('shot');
  if (chip === 'card') return t.includes('card') || t === 'foul committed';
  if (chip === 'corner') return t === 'pass' && passType === 'corner';
  if (chip === 'freekick') return t === 'pass' && (passType === 'free kick' || passType === 'kick off');
  return true;
}

export function VideoWithEvents({ url, onVideoUrlChange, fixtureId, initialKickoffOffset, initialSecondHalfOffset }: VideoWithEventsProps) {
  const [currentSeekTime, setCurrentSeekTime] = useState<number | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [kickoffOffset, setKickoffOffset] = useState<number>(0);
  const [secondHalfOffset, setSecondHalfOffset] = useState<number>(0);

  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayWidth, setOverlayWidth] = useState(320);
  const overlayDragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const [overlayFilter, setOverlayFilter] = useState('');
  const [overlayChip, setOverlayChip] = useState<OverlayChip>('all');
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);
  const kickoffOffsetRef = useRef<number>(0);
  // For Dailymotion: track the start= offset to rebuild the iframe src on seek
  const [dmStartTime, setDmStartTime] = useState<number>(0);
  // Highlights mark mode
  const [markMode, setMarkMode] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingTimestamp, setEditingTimestamp] = useState('');
  const [highlightsTimestamps, setHighlightsTimestamps] = useState<Record<string, number>>({});
  const queryClient = useQueryClient();

  // Load offsets: fixture video link values take priority over localStorage fallback
  useEffect(() => {
    if (initialKickoffOffset != null) {
      setKickoffOffset(initialKickoffOffset);
    } else {
      const saved = localStorage.getItem('match-kickoff-offset');
      if (saved) setKickoffOffset(parseFloat(saved));
    }
    if (initialSecondHalfOffset != null) {
      setSecondHalfOffset(initialSecondHalfOffset);
    } else {
      const saved = localStorage.getItem('match-second-half-offset');
      if (saved) setSecondHalfOffset(parseFloat(saved));
    }
  }, [initialKickoffOffset, initialSecondHalfOffset]);

  // Keep ref in sync so event listeners can read the latest value without re-registering
  useEffect(() => { kickoffOffsetRef.current = kickoffOffset; }, [kickoffOffset]);

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
    if (/vimeo\.com/.test(inputUrl)) return 'vimeo';
    if (/drive\.google\.com/.test(inputUrl)) return 'googledrive';
    if (/\.(mp4|webm|ogv|m3u8|mpd)(\?|$)/i.test(inputUrl) || inputUrl.startsWith('blob:')) return 'direct';
    return 'unknown';
  };

  const getDriveId = (inputUrl: string): string | null => {
    const m = inputUrl.match(/drive\.google\.com\/file\/d\/([^/?#&]+)/);
    return m ? m[1] : null;
  };

  // Returns { id, hash } — hash is present for private Vimeo videos (/VIDEO_ID/HASH)
  const getVimeoId = (inputUrl: string): { id: string; hash: string | null } | null => {
    // player.vimeo.com/video/ID or player.vimeo.com/video/ID/HASH
    const playerMatch = inputUrl.match(/player\.vimeo\.com\/video\/(\d+)(?:\/([a-f0-9]+))?/);
    if (playerMatch) return { id: playerMatch[1], hash: playerMatch[2] ?? null };
    // vimeo.com/ID or vimeo.com/ID/HASH (private)
    const stdMatch = inputUrl.match(/vimeo\.com\/(\d+)(?:\/([a-f0-9]+))?/);
    if (stdMatch) return { id: stdMatch[1], hash: stdMatch[2] ?? null };
    return null;
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
    if (p === 'vimeo') {
      const v = getVimeoId(inputUrl);
      if (!v) return null;
      // api=1 enables postMessage; h= is required for private/unlisted videos
      return v.hash
        ? `https://player.vimeo.com/video/${v.id}?h=${v.hash}&api=1&player_id=vimeo-player`
        : `https://player.vimeo.com/video/${v.id}?api=1&player_id=vimeo-player`;
    }
    if (p === 'googledrive') {
      const id = getDriveId(inputUrl);
      return id ? `https://drive.google.com/file/d/${id}/preview` : null;
    }
    return null;
  };

  const platform = getPlatform(url);
  const embedUrl = getEmbedUrl(url);

  // When kickoffOffset loads and this is a Dailymotion video, set the initial start time
  useEffect(() => {
    if (platform === 'dailymotion' && kickoffOffset > 0) {
      setDmStartTime(prev => prev === 0 ? kickoffOffset : prev);
    }
  }, [platform, kickoffOffset]);

  // Overlay resize drag handlers
  const handleOverlayDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    overlayDragRef.current = { startX: e.clientX, startWidth: overlayWidth };
    const onMove = (ev: MouseEvent) => {
      if (!overlayDragRef.current) return;
      const delta = overlayDragRef.current.startX - ev.clientX;
      const next = Math.min(600, Math.max(180, overlayDragRef.current.startWidth + delta));
      setOverlayWidth(next);
    };
    const onUp = () => {
      overlayDragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleEventClick = (eventTimeInSeconds: number, eventPeriod: number = 1, eventId?: string, highlightsTs?: number) => {
    const seekTime = highlightsTs !== undefined
      ? highlightsTs
      : Math.max(0, eventPeriod === 2
          ? eventTimeInSeconds + secondHalfOffset
          : eventTimeInSeconds + kickoffOffset);
    setCurrentSeekTime(seekTime);
    if (eventId) setLastClickedId(eventId);

    console.log('[seek]', { platform, seekTime, eventTimeInSeconds, eventPeriod, url });

    if (platform === 'direct' && videoRef.current) {
      videoRef.current.currentTime = seekTime;
      videoRef.current.play().catch(() => {});

    } else if (platform === 'dailymotion') {
      // Rebuild the DM embed URL with start=N — iframe remounts at the new time
      setDmStartTime(Math.floor(seekTime));

    } else if (platform === 'youtube' && iframeRef.current?.contentWindow) {
      // YouTube IFrame API — seekTo via postMessage requires enablejsapi=1 in src
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'seekTo', args: [seekTime, true] }),
        'https://www.youtube.com'
      );
    } else if (platform === 'vimeo' && iframeRef.current?.contentWindow) {
      // Vimeo Player API — setCurrentTime via postMessage requires api=1 in src
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ method: 'setCurrentTime', value: seekTime }),
        'https://player.vimeo.com'
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

  const { data: fixtureMatchEvents } = useQuery<{ events: any[]; lineups: any[] | null; source: string | null; highlightsTimestamps: Record<string, number> | null }>({
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

  // Sync highlights timestamps from DB into local state
  useEffect(() => {
    if (fixtureMatchEvents?.highlightsTimestamps) {
      setHighlightsTimestamps(fixtureMatchEvents.highlightsTimestamps);
    }
  }, [fixtureMatchEvents?.highlightsTimestamps]);

  const saveHighlightsMutation = useMutation({
    mutationFn: async ({ eventId, timestamp }: { eventId: string; timestamp: number | null }) => {
      const res = await fetch(`/api/fixtures/${fixtureId}/match-events/highlights`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, timestamp }),
      });
      if (!res.ok) throw new Error('Failed to save highlights timestamp');
      return res.json();
    },
    onSuccess: (data) => {
      setHighlightsTimestamps(data.highlightsTimestamps || {});
      queryClient.invalidateQueries({ queryKey: ["/api/fixtures", fixtureId, "match-events"] });
    },
  });

  const saveHighlightsTimestamp = (eventId: string) => {
    const secs = parseMMSS(editingTimestamp);
    if (secs !== null) {
      saveHighlightsMutation.mutate({ eventId, timestamp: secs });
    }
    setEditingEventId(null);
    setEditingTimestamp('');
  };

  const removeHighlightsTimestamp = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveHighlightsMutation.mutate({ eventId, timestamp: null });
  };

  const activeEvents: any[] = fixtureMatchEvents?.events ?? [];

  const overlayEvents = useMemo(() => {
    let evts = activeEvents;
    if (overlayChip !== 'all') {
      evts = evts.filter(e => eventMatchesChip(e, overlayChip));
    }
    if (overlayFilter.trim()) {
      const q = overlayFilter.toLowerCase();
      evts = evts.filter(e =>
        (e.type?.name ?? '').toLowerCase().includes(q) ||
        (e.player?.name ?? '').toLowerCase().includes(q) ||
        (e.team?.name ?? '').toLowerCase().includes(q) ||
        (e.pass?.type?.name ?? '').toLowerCase().includes(q) ||
        (e.shot?.type?.name ?? '').toLowerCase().includes(q) ||
        (e.play_pattern?.name ?? '').toLowerCase().includes(q)
      );
    }
    return evts;
  }, [activeEvents, overlayChip, overlayFilter]);

  const platformLabel: Record<Platform, string> = {
    youtube: 'YouTube',
    dailymotion: 'Dailymotion',
    vimeo: 'Vimeo',
    googledrive: 'Google Drive (seek not available)',
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
              placeholder="Paste a YouTube, Vimeo, Dailymotion, or direct MP4/HLS URL…"
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
            {activeEvents.length > 0 && showOverlay && (
              <Button
                size="sm"
                variant={markMode ? 'default' : 'outline'}
                className={`gap-1.5 h-7 text-xs ${markMode ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500' : ''}`}
                onClick={() => { setMarkMode(v => !v); setEditingEventId(null); }}
                title="Mark Mode: click events to tag their position in the highlights video"
              >
                {markMode ? <Pin className="h-3 w-3" /> : <PinOff className="h-3 w-3" />}
                {markMode ? 'Marking' : 'Mark'}
              </Button>
            )}
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
            ) : platform === 'dailymotion' && getDailymotionId(url) ? (
              // Dailymotion: standard embed URL with start= — remounts at the correct time on seek
              <iframe
                ref={iframeRef}
                key={`dm-${url}-${dmStartTime}`}
                src={`https://www.dailymotion.com/embed/video/${getDailymotionId(url)}?start=${dmStartTime}&autoplay=1`}
                className="absolute inset-0 w-full h-full"
                style={{ border: 'none', display: 'block' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                data-testid="match-video-iframe"
              />
            ) : platform === 'googledrive' && getDriveId(url) ? (
              // Google Drive: large files can't be reliably embedded — show an open-in-Drive panel instead
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-950 text-white px-8 text-center">
                <svg viewBox="0 0 87.3 78" className="w-16 h-16 opacity-80" xmlns="http://www.w3.org/2000/svg">
                  <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                  <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                  <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                  <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                  <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                  <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                </svg>
                <div>
                  <p className="text-lg font-semibold mb-1">Google Drive video</p>
                  <p className="text-sm text-white/60 mb-4">Large files can't be embedded directly. Open the video in Google Drive to watch it alongside the events below.</p>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/></svg>
                    Open in Google Drive
                  </a>
                </div>
                <p className="text-xs text-white/30 mt-2">Tip: Use YouTube or Dailymotion for in-page seek with events</p>
              </div>
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
                <p className="text-xs text-white/40">YouTube · Vimeo · Dailymotion · MP4 · HLS (.m3u8)</p>
              </div>
            )}

            {/* Events overlay — right panel, resizable by dragging left edge */}
            {showOverlay && activeEvents.length > 0 && (
              <div
                className="absolute top-0 right-0 bottom-0 flex flex-col"
                style={{
                  width: overlayWidth,
                  zIndex: 20,
                  background: 'rgba(4, 4, 12, 0.88)',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                  borderLeft: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                {/* Resize drag handle */}
                <div
                  onMouseDown={handleOverlayDragStart}
                  className="absolute top-0 left-0 bottom-0 w-1.5 cursor-col-resize group z-30 flex items-center justify-center"
                  title="Drag to resize"
                  style={{ marginLeft: -3 }}
                >
                  <div className="w-0.5 h-12 rounded-full bg-white/10 group-hover:bg-white/40 transition-colors" />
                </div>
                {/* Overlay header */}
                <div
                  className="flex-shrink-0 px-2 pt-2 pb-1.5 border-b border-white/10"
                  style={{ background: 'rgba(0,0,0,0.35)' }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">
                      {overlayEvents.length.toLocaleString()} / {activeEvents.length.toLocaleString()} events
                    </span>
                    {markMode && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded px-1 py-px font-semibold">
                        📍 Mark Mode
                      </span>
                    )}
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
                    {(['all', 'goal', 'shot', 'corner', 'freekick', 'card'] as OverlayChip[]).map(chip => (
                      <button
                        key={chip}
                        onClick={() => setOverlayChip(chip)}
                        className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${
                          overlayChip === chip
                            ? 'bg-white/20 border-white/40 text-white font-semibold'
                            : 'border-white/15 text-white/40 hover:text-white/70 hover:border-white/25'
                        }`}
                      >
                        {chip === 'all' ? 'All'
                          : chip === 'goal' ? '⚽ Goals'
                          : chip === 'shot' ? '🎯 Shots'
                          : chip === 'corner' ? '🚩 Corners'
                          : chip === 'freekick' ? '🎽 Free kicks'
                          : '🟨 Cards'}
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
                      const hlTs: number | undefined = highlightsTimestamps[rowId];
                      const isEditing = editingEventId === rowId;

                      const timeLabel = (
                        <span className="text-white/40 text-[10px] tabular-nums shrink-0 w-9 text-right">
                          {minutes}'{seconds > 0 ? String(seconds).padStart(2, '0') + '"' : ''}
                        </span>
                      );
                      const typeBadge = (
                        <span className={`text-[9px] px-1 py-px rounded shrink-0 font-medium ${eventBadgeClass(typeName)}`}>
                          {typeName.length > 11 ? typeName.slice(0, 10) + '…' : typeName}
                        </span>
                      );

                      if (isEditing) {
                        return (
                          <div
                            key={rowId}
                            className="w-full flex items-center gap-1 px-2 border-b border-white/5 bg-amber-500/10"
                            style={{ minHeight: 30 }}
                          >
                            {timeLabel}
                            {typeBadge}
                            <input
                              className="w-14 text-[10px] bg-white/20 text-white rounded px-1 py-px outline-none border border-amber-400/60 tabular-nums ml-auto shrink-0"
                              placeholder="0:00"
                              value={editingTimestamp}
                              onChange={e => setEditingTimestamp(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveHighlightsTimestamp(rowId);
                                if (e.key === 'Escape') { setEditingEventId(null); setEditingTimestamp(''); }
                                e.stopPropagation();
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => saveHighlightsTimestamp(rowId)}
                              className="text-green-400 hover:text-green-300 text-[10px] shrink-0"
                              title="Save"
                            >✓</button>
                            <button
                              onClick={() => { setEditingEventId(null); setEditingTimestamp(''); }}
                              className="text-white/40 hover:text-white/60 text-[10px] shrink-0"
                              title="Cancel"
                            >✗</button>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={rowId}
                          onClick={() => {
                            if (markMode) {
                              setEditingEventId(rowId);
                              setEditingTimestamp(hlTs !== undefined ? formatMMSS(hlTs) : '');
                            } else {
                              handleEventClick(totalSeconds, period, rowId, hlTs);
                            }
                          }}
                          className={`w-full flex items-center gap-1.5 px-2 text-left transition-colors group border-b border-white/5 cursor-pointer ${
                            isActive ? 'bg-white/20' : 'hover:bg-white/10 active:bg-white/15'
                          } ${markMode ? 'hover:bg-amber-500/10' : ''}`}
                          style={{ minHeight: 26 }}
                        >
                          {timeLabel}
                          {typeBadge}
                          {playerName && (
                            <span className="text-white/55 text-[10px] truncate group-hover:text-white/80 transition-colors">
                              {playerName}
                            </span>
                          )}
                          {hlTs !== undefined && (
                            <span className="ml-auto shrink-0 flex items-center gap-0.5 text-amber-400 text-[10px] tabular-nums">
                              📍{formatMMSS(hlTs)}
                              {markMode && (
                                <span
                                  onClick={(e) => removeHighlightsTimestamp(rowId, e)}
                                  className="text-white/30 hover:text-red-400 ml-0.5 cursor-pointer"
                                  title="Remove mark"
                                >×</span>
                              )}
                            </span>
                          )}
                          {markMode && hlTs === undefined && (
                            <span className="ml-auto shrink-0 text-white/20 text-[10px]">+ mark</span>
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
