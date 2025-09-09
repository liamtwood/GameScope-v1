import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Video, Clock, MapPin } from "lucide-react";

interface VideoData {
  id: string;
  duration: string;
  location: string;
  url?: string;
  filename?: string;
  uploadedAt?: string;
  isProcessing?: boolean;
  processingProgress?: number;
  processed?: boolean;
}

interface VideoSelectionDialogProps {
  videos: VideoData[];
  onVideoSelect: (video: VideoData) => void;
  children: React.ReactNode;
}

// Duration options mapping for display
const DURATION_LABELS: { [key: string]: string } = {
  "1st_half": "1st Half",
  "2nd_half": "2nd Half", 
  "full_game": "Full Game",
  "training_session": "Training Session"
};

// Location options mapping for display
const LOCATION_LABELS: { [key: string]: string } = {
  "halfway_line": "Half Way Line",
  "behind_goal": "Behind Goal",
  "corner_flag": "Corner Flag",
  "sideline": "Sideline",
  "elevated_view": "Elevated View"
};

// Helper functions
const getDurationLabel = (duration: string) => DURATION_LABELS[duration] || duration;
const getLocationLabel = (location: string) => LOCATION_LABELS[location] || location;

const isVideoFile = (url: string | undefined, filename: string | undefined) => {
  if (!url && !filename) return false;
  const urlLower = url?.toLowerCase() || '';
  const filenameLower = filename?.toLowerCase() || '';
  
  return (urlLower.includes('.mp4') || urlLower.includes('.webm') || urlLower.includes('.ogg') ||
          urlLower.includes('.avi') || urlLower.includes('.mov') || urlLower.includes('.mkv')) ||
         (filenameLower.includes('.mp4') || filenameLower.includes('.webm') || filenameLower.includes('.ogg') ||
          filenameLower.includes('.avi') || filenameLower.includes('.mov') || filenameLower.includes('.mkv')) ||
         (urlLower.includes('storage.googleapis.com') && filename) ||
         (urlLower.includes('objects/') && filename);
};

const VideoThumbnail = ({ video }: { video: VideoData }) => {
  if (!isVideoFile(video.url!, video.filename)) {
    return (
      <div className="w-full h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
          <div className="absolute inset-2 border border-white/30 rounded-sm">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30 transform -translate-y-1/2"></div>
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <Video className="h-4 w-4 text-blue-600" />
          </div>
        </div>
        <div className="absolute bottom-1 right-1 text-xs text-white/80 font-medium bg-black/20 px-1 rounded">
          Link
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-lg overflow-hidden relative">
      {/* Soccer field background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-green-500 to-green-600">
        {/* Field lines */}
        <div className="absolute inset-2 border border-white/30 rounded-sm">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30 transform -translate-y-1/2"></div>
          <div className="absolute top-1/2 left-1/2 w-4 h-4 border border-white/30 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        {/* Goal posts */}
        <div className="absolute top-2 left-0 w-1 h-3 bg-white/40"></div>
        <div className="absolute top-2 right-0 w-1 h-3 bg-white/40"></div>
      </div>
      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
          <Play className="h-4 w-4 text-green-600 ml-0.5" />
        </div>
      </div>
      {/* Video indicator */}
      <div className="absolute bottom-1 right-1 text-xs text-white/80 font-medium bg-black/20 px-1 rounded">
        ⚽
      </div>
    </div>
  );
};

export function VideoSelectionDialog({ videos, onVideoSelect, children }: VideoSelectionDialogProps) {
  const [open, setOpen] = useState(false);

  // Filter out videos that are still processing
  const availableVideos = videos.filter(video => !video.isProcessing && video.url);

  const handleVideoSelect = (video: VideoData) => {
    onVideoSelect(video);
    setOpen(false);
  };

  if (availableVideos.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Select Video to Watch
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {availableVideos.length === 1 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">1 video available for this match</p>
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-primary/20"
                onClick={() => handleVideoSelect(availableVideos[0])}
                data-testid="video-option-single"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-24">
                      <VideoThumbnail video={availableVideos[0]} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getDurationLabel(availableVideos[0].duration)}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {getLocationLabel(availableVideos[0].location)}
                        </Badge>
                      </div>
                      {availableVideos[0].filename && (
                        <p className="text-sm text-muted-foreground">{availableVideos[0].filename}</p>
                      )}
                    </div>
                    <Button size="sm" className="flex items-center gap-2">
                      <Play className="h-3 w-3" />
                      Watch
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground mb-4">Choose from {availableVideos.length} available videos:</p>
              <div className="grid gap-3">
                {availableVideos.map((video) => (
                  <Card 
                    key={video.id}
                    className="cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-primary/20"
                    onClick={() => handleVideoSelect(video)}
                    data-testid={`video-option-${video.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-24">
                          <VideoThumbnail video={video} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getDurationLabel(video.duration)}
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {getLocationLabel(video.location)}
                            </Badge>
                          </div>
                          {video.filename && (
                            <p className="text-sm text-muted-foreground">{video.filename}</p>
                          )}
                          {video.uploadedAt && (
                            <p className="text-xs text-muted-foreground">
                              Uploaded: {new Date(video.uploadedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Button size="sm" className="flex items-center gap-2">
                          <Play className="h-3 w-3" />
                          Watch
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}