import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Upload, Play, Link, Plus, Save, X, Cog } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ObjectUploader } from "./object-uploader";
import type { UploadResult } from "@uppy/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Duration options for video recordings
const DURATION_OPTIONS = [
  { value: "1st_half", label: "1st Half" },
  { value: "2nd_half", label: "2nd Half" },
  { value: "full_game", label: "Full Game" },
  { value: "training_session", label: "Training Session" },
] as const;

// Location options for camera placement
const LOCATION_OPTIONS = [
  { value: "halfway_line", label: "Half Way Line" },
  { value: "behind_goal", label: "Behind Goal" },
  { value: "corner_flag", label: "Corner Flag" },
  { value: "sideline", label: "Sideline" },
  { value: "elevated_view", label: "Elevated View" },
] as const;

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

interface NewVideoRow {
  id: string;
  duration: string;
  location: string;
  url: string;
  type: 'upload' | 'link';
  isEditing: boolean;
}

interface VideoManagerProps {
  fixtureId: string;
  videoLinks?: VideoData[];
  onUpdate?: () => void;
}

export function VideoManager({ fixtureId, videoLinks = [], onUpdate }: VideoManagerProps) {
  const [videos, setVideos] = useState<VideoData[]>(videoLinks);
  const [newRows, setNewRows] = useState<NewVideoRow[]>([]);
  const [processingVideos, setProcessingVideos] = useState<Set<string>>(new Set());
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateVideosMutation = useMutation({
    mutationFn: async (videoData: VideoData[]) => {
      const response = await apiRequest("PUT", `/api/fixtures/${fixtureId}/videos`, { videos: videoData });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fixtures", fixtureId] });
      toast({
        title: "Videos Updated",
        description: "Match videos have been updated successfully.",
      });
      onUpdate?.();
    },
    onError: (error) => {
      console.error("Video update error:", error);
      toast({
        title: "Error",
        description: "Failed to update videos. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>, rowId: string) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const row = newRows.find(r => r.id === rowId);
      if (!row) return;
      
      const videoData: VideoData = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        duration: row.duration,
        location: row.location,
        url: uploadedFile.uploadURL as string,
        filename: uploadedFile.name,
        uploadedAt: new Date().toISOString(),
      };

      // Add new video to the list and remove the editing row
      const updatedVideos = [...videos, videoData];
      setVideos(updatedVideos);
      setNewRows(prev => prev.filter(r => r.id !== rowId));

      // Save to database
      try {
        await updateVideosMutation.mutateAsync(updatedVideos);
      } catch (error) {
        // Revert on error
        setVideos(videos);
        console.error("Failed to save video:", error);
      }
    }
  };

  const handleSaveLink = async (rowId: string) => {
    const row = newRows.find(r => r.id === rowId);
    if (!row || !row.url.trim()) return;

    const videoData: VideoData = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      duration: row.duration,
      location: row.location,
      url: row.url.trim(),
      uploadedAt: new Date().toISOString(),
    };

    // Add new video to the list and remove the editing row
    const updatedVideos = [...videos, videoData];
    setVideos(updatedVideos);
    setNewRows(prev => prev.filter(r => r.id !== rowId));

    // Save to database
    try {
      await updateVideosMutation.mutateAsync(updatedVideos);
    } catch (error) {
      // Revert on error
      setVideos(videos);
      console.error("Failed to save video:", error);
    }
  };

  const handleRemoveVideo = async (videoId: string) => {
    const updatedVideos = videos.filter(v => v.id !== videoId);
    const previousVideos = [...videos];
    setVideos(updatedVideos);
    
    try {
      await updateVideosMutation.mutateAsync(updatedVideos);
    } catch (error) {
      // Revert on error
      setVideos(previousVideos);
      console.error("Failed to remove video:", error);
    }
  };

  const addNewRow = () => {
    const newRow: NewVideoRow = {
      id: `new-${Date.now()}`,
      duration: "1st_half",
      location: "halfway_line",
      url: "",
      type: 'link',
      isEditing: true,
    };
    setNewRows(prev => [...prev, newRow]);
  };

  const cancelNewRow = (rowId: string) => {
    setNewRows(prev => prev.filter(r => r.id !== rowId));
  };

  const updateNewRow = (rowId: string, field: keyof NewVideoRow, value: string) => {
    setNewRows(prev => prev.map(row => 
      row.id === rowId ? { ...row, [field]: value } : row
    ));
  };

  const handleProcessAllVideos = async () => {
    const unprocessedVideos = videos.filter(v => v.url && !v.processed && !v.isProcessing);
    
    if (unprocessedVideos.length === 0) {
      toast({
        title: "No Videos to Process",
        description: "All videos have already been processed or no videos are available.",
        variant: "destructive",
      });
      return;
    }

    // Mark all unprocessed videos as processing
    const videoIds = unprocessedVideos.map(v => v.id);
    setProcessingVideos(new Set(videoIds));
    
    setVideos(prev => prev.map(v => 
      videoIds.includes(v.id)
        ? { ...v, isProcessing: true, processingProgress: 0 }
        : v
    ));

    // Simulate 10-second processing with progress updates for all videos
    const startTime = Date.now();
    const duration = 10000; // 10 seconds

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      
      setVideos(prev => prev.map(v => 
        videoIds.includes(v.id)
          ? { ...v, processingProgress: Math.round(progress) }
          : v
      ));

      if (progress < 100) {
        setTimeout(updateProgress, 100); // Update every 100ms for smooth progress
      } else {
        // Processing complete for all videos
        setVideos(prev => prev.map(v => 
          videoIds.includes(v.id)
            ? { ...v, isProcessing: false, processed: true, processingProgress: 100 }
            : v
        ));
        setProcessingVideos(new Set());

        toast({
          title: "Video Processing Complete",
          description: `Successfully processed ${unprocessedVideos.length} video${unprocessedVideos.length > 1 ? 's' : ''} for analysis.`,
        });
      }
    };

    updateProgress();
  };

  const getDurationLabel = (value: string) => {
    return DURATION_OPTIONS.find(opt => opt.value === value)?.label || value;
  };

  const getLocationLabel = (value: string) => {
    return LOCATION_OPTIONS.find(opt => opt.value === value)?.label || value;
  };

  // Helper function to determine if URL is a video file
  const isVideoFile = (url: string, filename?: string) => {
    // Check filename first if available (more reliable for uploaded files)
    if (filename) {
      const ext = filename.toLowerCase();
      return ext.endsWith('.mp4') || ext.endsWith('.webm') || ext.endsWith('.ogg') || 
             ext.endsWith('.mov') || ext.endsWith('.avi') || ext.endsWith('.mkv');
    }
    
    // Fallback to URL checking for direct links
    const urlLower = url.toLowerCase();
    return urlLower.includes('.mp4') || urlLower.includes('.webm') || urlLower.includes('.ogg') || 
           urlLower.includes('.mov') || urlLower.includes('.avi') || urlLower.includes('.mkv') ||
           // Check for Google Cloud Storage or other object storage patterns with video content
           (urlLower.includes('storage.googleapis.com') && filename) ||
           (urlLower.includes('objects/') && filename);
  };

  // Video Player Component for embedded playback
  const VideoPlayer = ({ video }: { video: VideoData }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          data-testid={`button-play-${video.id}`}
        >
          <Play className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            {video.filename || `${getDurationLabel(video.duration)} - ${getLocationLabel(video.location)}`}
          </DialogTitle>
        </DialogHeader>
        <div className="p-6">
          {isVideoFile(video.url!, video.filename) ? (
            <video 
              controls 
              className="w-full h-auto max-h-[70vh] bg-black rounded-lg"
              preload="metadata"
            >
              <source src={video.url} type="video/mp4" />
              <source src={video.url} type="video/webm" />
              <source src={video.url} type="video/ogg" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
              <div className="space-y-4">
                <p className="text-muted-foreground">External video link detected.</p>
                <Button 
                  onClick={() => window.open(video.url, '_blank')}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Open in New Tab
                </Button>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Video Details:</p>
                  <p>Duration: {getDurationLabel(video.duration)}</p>
                  <p>Location: {getLocationLabel(video.location)}</p>
                  <p className="break-all mt-2">{video.url}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Match Videos</CardTitle>
        <div className="flex items-center gap-2">
          {videos.some(v => v.url && !v.processed && !v.isProcessing) && (
            <Button 
              onClick={handleProcessAllVideos} 
              size="sm" 
              variant="default"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              data-testid="button-process-all-videos"
              disabled={processingVideos.size > 0}
            >
              <Cog className="h-4 w-4" />
              {processingVideos.size > 0 ? 'Processing...' : 'Process All Videos'}
            </Button>
          )}
          <Button 
            onClick={addNewRow} 
            size="sm" 
            className="flex items-center gap-2"
            data-testid="button-add-video"
          >
            <Plus className="h-4 w-4" />
            Add Video
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Existing videos */}
          {videos.map((video) => (
            <div key={video.id} className="flex flex-col gap-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Play className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {getDurationLabel(video.duration)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getLocationLabel(video.location)}
                      </Badge>
                      {video.processed && (
                        <Badge variant="default" className="text-xs bg-green-500">
                          Processed
                        </Badge>
                      )}
                      {video.isProcessing && (
                        <Badge variant="default" className="text-xs bg-blue-500">
                          Processing...
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {video.filename || video.url}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {video.url && (
                    <VideoPlayer video={video} />
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveVideo(video.id)}
                    className="text-red-600 hover:text-red-700"
                    data-testid={`button-remove-${video.id}`}
                    disabled={video.isProcessing}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {/* Progress bar for processing videos */}
              {video.isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Processing video...</span>
                    <span className="font-medium">{video.processingProgress || 0}%</span>
                  </div>
                  <Progress 
                    value={video.processingProgress || 0} 
                    className="h-2"
                    data-testid={`progress-${video.id}`}
                  />
                </div>
              )}
            </div>
          ))}

          {/* New video rows */}
          {newRows.map((row) => (
            <div key={row.id} className="flex items-center gap-4 p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-3 flex-1">
                {/* Duration Select */}
                <div className="min-w-[140px]">
                  <Select
                    value={row.duration}
                    onValueChange={(value) => updateNewRow(row.id, 'duration', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Select */}
                <div className="min-w-[140px]">
                  <Select
                    value={row.location}
                    onValueChange={(value) => updateNewRow(row.id, 'location', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Video Input */}
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex rounded-md border">
                    <Button
                      type="button"
                      variant={row.type === 'link' ? 'default' : 'outline'}
                      size="sm"
                      className="rounded-r-none border-r-0 h-8"
                      onClick={() => updateNewRow(row.id, 'type', 'link')}
                    >
                      <Link className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant={row.type === 'upload' ? 'default' : 'outline'}
                      size="sm"
                      className="rounded-l-none h-8"
                      onClick={() => updateNewRow(row.id, 'type', 'upload')}
                    >
                      <Upload className="h-3 w-3" />
                    </Button>
                  </div>

                  {row.type === 'link' ? (
                    <Input
                      placeholder="Enter video URL"
                      value={row.url}
                      onChange={(e) => updateNewRow(row.id, 'url', e.target.value)}
                      className="h-8"
                      data-testid={`input-video-url-${row.id}`}
                    />
                  ) : (
                    <div className="flex-1">
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={1024 * 1024 * 500} // 500MB
                        onGetUploadParameters={getUploadParameters}
                        onComplete={(result) => handleUploadComplete(result, row.id)}
                        buttonClassName="h-8 w-full"
                      >
                        <div className="flex items-center gap-2">
                          <Upload className="h-3 w-3" />
                          <span className="text-sm">Choose File</span>
                        </div>
                      </ObjectUploader>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {row.type === 'link' && (
                  <Button
                    size="sm"
                    onClick={() => handleSaveLink(row.id)}
                    disabled={!row.url.trim() || updateVideosMutation.isPending}
                    className="h-8"
                    data-testid={`button-save-${row.id}`}
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cancelNewRow(row.id)}
                  className="h-8"
                  data-testid={`button-cancel-${row.id}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}

          {videos.length === 0 && newRows.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Play className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>No videos uploaded yet</p>
              <p className="text-sm">Click "Add Video" to get started</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}