import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Clock, AlertCircle, Video, Play } from 'lucide-react';

interface VideoAnalysisSettingsProps {
  videoUrl: string;
  onVideoUrlChange: (url: string) => void;
  kickoffOffset: number;
  onKickoffOffsetChange: (offset: number) => void;
  onEventClick: (timeInSeconds: number) => void;
}

export function VideoAnalysisSettings({ 
  videoUrl, 
  onVideoUrlChange, 
  kickoffOffset, 
  onKickoffOffsetChange,
  onEventClick 
}: VideoAnalysisSettingsProps) {
  const [inputUrl, setInputUrl] = useState("");
  const [kickoffInput, setKickoffInput] = useState<string>("0:00");
  const [isOpen, setIsOpen] = useState(false);

  // Update kickoff input when offset changes
  useEffect(() => {
    setKickoffInput(formatTimeForInput(kickoffOffset));
  }, [kickoffOffset]);

  const formatTimeForInput = (seconds: number): string => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.floor(Math.abs(seconds) % 60);
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const parseTimeInput = (input: string): number => {
    if (!input.trim()) return 0;
    
    const isNegative = input.startsWith('-');
    const cleanInput = input.replace('-', '').trim();
    
    if (cleanInput.includes(':')) {
      const [mins, secs] = cleanInput.split(':').map(Number);
      const totalSeconds = (mins * 60) + (secs || 0);
      return isNegative ? -totalSeconds : totalSeconds;
    }
    
    const numValue = parseFloat(cleanInput.replace(/[^\d.]/g, ''));
    const result = isNaN(numValue) ? 0 : numValue;
    return isNegative ? -result : result;
  };

  const handleUrlSubmit = () => {
    if (inputUrl.trim()) {
      onVideoUrlChange(inputUrl.trim());
      setInputUrl("");
    }
  };

  const handleKickoffOffsetSubmit = () => {
    const newOffset = parseTimeInput(kickoffInput);
    onKickoffOffsetChange(newOffset);
  };

  const getVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const videoId = getVideoId(videoUrl);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="open-settings">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Video Analysis Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Video URL Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Video className="h-5 w-5" />
                Video Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="video-url">YouTube Video URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="video-url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1"
                    data-testid="video-url-input"
                  />
                  <Button onClick={handleUrlSubmit} data-testid="update-video-url">
                    Update
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Current Video:</strong></p>
                <p className="break-all">{videoUrl}</p>
                {videoId && <p><strong>Video ID:</strong> {videoId}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Timing Synchronization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Timing Synchronization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="kickoff-offset-settings">
                  Kickoff Time Offset (Video Time when Match Starts)
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="kickoff-offset-settings"
                    value={kickoffInput}
                    onChange={(e) => setKickoffInput(e.target.value)}
                    placeholder="e.g., 2:30 or -1:15"
                    className="w-32"
                    data-testid="kickoff-offset-settings-input"
                  />
                  <Button 
                    onClick={handleKickoffOffsetSubmit}
                    size="sm"
                    data-testid="set-kickoff-offset-settings"
                  >
                    Set Offset
                  </Button>
                  <span className="text-sm text-gray-600">
                    Current: {formatTimeForInput(kickoffOffset)}
                  </span>
                </div>
              </div>
              
              {kickoffOffset !== 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Offset applied: When you click an event at match time 0:00, the video will seek to {formatTimeForInput(kickoffOffset)}.
                    {kickoffOffset < 0 && " (Negative offset means the video starts after kickoff)"}
                    {kickoffOffset > 0 && " (Positive offset means the video includes pre-match content)"}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Quick Test Controls</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEventClick(0)}
                    data-testid="test-kickoff"
                  >
                    Test Kickoff (0:00)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEventClick(30)}
                    data-testid="test-30s"
                  >
                    Test 0:30
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEventClick(60)}
                    data-testid="test-1m"
                  >
                    Test 1:00
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEventClick(300)}
                    data-testid="test-5m"
                  >
                    Test 5:00
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Use these buttons to test if your offset is correct. They should jump to the right moments in the match.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How to Set Up Video Sync</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">1. Load your match video</h4>
                <p>Paste the YouTube URL of your match recording above.</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-1">2. Find kickoff in the video</h4>
                <p>Manually seek to the moment when the match actually begins (first whistle/kickoff).</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-1">3. Set the kickoff offset</h4>
                <p>Enter the video timestamp where kickoff happens. For example:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><code>2:30</code> - if kickoff is 2 minutes 30 seconds into the video</li>
                  <li><code>-0:45</code> - if the video started 45 seconds after kickoff</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-1">4. Test synchronization</h4>
                <p>Use the test buttons above to verify events sync correctly with the video.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}