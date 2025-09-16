import { useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';

interface YouTubePlayerProps {
  url: string;
  width?: string | number;
  height?: string | number;
}

export function YouTubePlayer({ url, width = "100%", height = 400 }: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [seekInput, setSeekInput] = useState("");

  // Extract video ID from YouTube URL
  const getVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Format time in MM:SS format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Parse time input (supports formats like "1:30", "90", "1m30s")
  const parseTimeInput = (input: string): number => {
    if (!input.trim()) return 0;
    
    // Format: "1:30" or "01:30"
    if (input.includes(':')) {
      const [mins, secs] = input.split(':').map(Number);
      return (mins * 60) + (secs || 0);
    }
    
    // Format: "90s" or just "90"
    const numValue = parseFloat(input.replace(/[^\d.]/g, ''));
    return isNaN(numValue) ? 0 : numValue;
  };

  const handleProgress = (state: any) => {
    if (!seeking) {
      setPlayed(state.played);
      setCurrentTime(state.playedSeconds);
    }
  };

  const handleSeekChange = (value: number[]) => {
    setPlayed(value[0] / 100);
  };

  const handleSeekCommit = (value: number[]) => {
    setSeeking(false);
    const seekToTime = (value[0] / 100) * duration;
    seekTo(seekToTime);
  };

  const handleSeekStart = () => {
    setSeeking(true);
  };

  const seekTo = (seconds: number) => {
    if (!playerRef.current) return;
    if (seconds < 0) seconds = 0;
    if (seconds > duration) seconds = duration;
    try {
      playerRef.current.seekTo(seconds, 'seconds');
      setCurrentTime(seconds);
    } catch (error) {
      console.error('Error seeking to time:', error);
    }
  };

  const skipForward = () => {
    if (playerRef.current) {
      try {
        const current = playerRef.current.getCurrentTime();
        seekTo(current + 10);
      } catch (error) {
        seekTo(currentTime + 10);
      }
    }
  };

  const skipBackward = () => {
    if (playerRef.current) {
      try {
        const current = playerRef.current.getCurrentTime();
        seekTo(current - 10);
      } catch (error) {
        seekTo(currentTime - 10);
      }
    }
  };

  const handleSeekInputSubmit = () => {
    const seekTime = parseTimeInput(seekInput);
    seekTo(seekTime);
    setSeekInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSeekInputSubmit();
    }
  };

  const togglePlayPause = () => {
    setPlaying(!playing);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
  };

  const toggleMute = () => {
    setMuted(!muted);
  };

  const handlePlayerReady = () => {
    console.log('Player ready');
  };

  // Quick seek buttons for specific times
  const quickSeekTimes = [
    { label: "Start", time: 0 },
    { label: "30s", time: 30 },
    { label: "1m", time: 60 },
    { label: "2m", time: 120 },
    { label: "5m", time: 300 }
  ];

  const videoId = getVideoId(url);

  if (!videoId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-500">Invalid YouTube URL. Please provide a valid YouTube video URL.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Video Player */}
          <div className="relative">
            <ReactPlayer
              ref={playerRef}
              url={url}
              playing={playing}
              volume={volume}
              muted={muted}
              onProgress={handleProgress}
              onDuration={setDuration}
              onReady={handlePlayerReady}
              width={width}
              height={height}
              controls={false}
              config={{
                youtube: {
                  playerVars: {
                    showinfo: 1,
                    controls: 0,
                    rel: 0,
                    fs: 1,
                    iv_load_policy: 3
                  }
                }
              }}
              data-testid="youtube-player"
            />
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Slider
              value={[played * 100]}
              onValueChange={handleSeekChange}
              onValueCommit={handleSeekCommit}
              onPointerDown={handleSeekStart}
              max={100}
              step={0.1}
              className="w-full"
              data-testid="progress-slider"
            />
            
            {/* Time Display */}
            <div className="flex justify-between text-sm text-gray-600">
              <span data-testid="current-time">{formatTime(currentTime)}</span>
              <span data-testid="total-duration">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={skipBackward}
              data-testid="skip-backward"
            >
              <SkipBack className="h-4 w-4" />
              10s
            </Button>
            
            <Button
              variant="default"
              size="lg"
              onClick={togglePlayPause}
              data-testid="play-pause-button"
            >
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={skipForward}
              data-testid="skip-forward"
            >
              <SkipForward className="h-4 w-4" />
              10s
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              data-testid="mute-button"
            >
              <Volume2 className="h-4 w-4" />
            </Button>
            <Slider
              value={[volume * 100]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-32"
              data-testid="volume-slider"
            />
            <span className="text-sm text-gray-600 w-12">
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Seek to Specific Time */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Jump to specific time:</label>
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="e.g., 1:30 or 90"
                value={seekInput}
                onChange={(e) => setSeekInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
                data-testid="seek-input"
              />
              <Button
                onClick={handleSeekInputSubmit}
                variant="outline"
                data-testid="seek-submit"
              >
                Go
              </Button>
            </div>
          </div>

          {/* Quick Seek Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quick seek:</label>
            <div className="flex flex-wrap gap-2">
              {quickSeekTimes.map((item) => (
                <Button
                  key={item.label}
                  variant="outline"
                  size="sm"
                  onClick={() => seekTo(item.time)}
                  data-testid={`quick-seek-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item.label}
                </Button>
              ))}
              {duration > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => seekTo(duration / 2)}
                  data-testid="quick-seek-middle"
                >
                  Middle
                </Button>
              )}
            </div>
          </div>

          {/* Video Info */}
          <div className="text-sm text-gray-600 border-t pt-4">
            <p><strong>Video ID:</strong> {videoId}</p>
            <p><strong>Current Position:</strong> {formatTime(currentTime)} / {formatTime(duration)}</p>
            <p><strong>Progress:</strong> {Math.round(played * 100)}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}