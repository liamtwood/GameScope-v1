import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Upload, Play, Link, Plus, Save, X, Cog, Edit, FileJson, ChevronDown, ChevronUp, Grid2x2, List } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ObjectUploader } from "./object-uploader";
import type { UploadResult } from "@uppy/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

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
  eventsJsonUrl?: string;
  eventsJsonFilename?: string;
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

// Helper function to determine pitch position based on X coordinate
function getPitchThird(x: number): string {
  if (x >= 31 && x <= 655) return "Defensive Third";
  if (x > 655 && x <= 1279) return "Midfield";
  if (x > 1279 && x <= 1903) return "Final Third";
  return "Unknown";
}

// Helper function to parse timestamp string to seconds
function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(':');
  let seconds = 0;
  
  if (parts.length === 3) {
    // Format: H:MM:SS
    seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  } else if (parts.length === 2) {
    // Format: M:SS
    seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  
  return seconds;
}

export function VideoManager({ fixtureId, videoLinks = [], onUpdate }: VideoManagerProps) {
  const [videos, setVideos] = useState<VideoData[]>(videoLinks);
  const [newRows, setNewRows] = useState<NewVideoRow[]>([]);
  const [processingVideos, setProcessingVideos] = useState<Set<string>>(new Set());
  const [editingVideo, setEditingVideo] = useState<string | null>(null);
  const [eventsDialogOpen, setEventsDialogOpen] = useState(false);
  const [selectedVideoForEvents, setSelectedVideoForEvents] = useState<VideoData | null>(null);
  const [eventData, setEventData] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());
  const [editingEventType, setEditingEventType] = useState<number | null>(null);
  const [editedEventTypes, setEditedEventTypes] = useState<Map<number, string>>(new Map());
  const [seekTime, setSeekTime] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Sync local state with prop changes (when fixture is re-fetched)
  useEffect(() => {
    setVideos(videoLinks);
  }, [videoLinks]);

  // Fetch events for a video
  const fetchVideoEvents = async (videoId: string) => {
    setLoadingEvents(true);
    try {
      const response = await fetch(`/api/fixtures/${fixtureId}/videos/${videoId}/events`);
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      const data = await response.json();
      setEventData(data.events || []);
    } catch (error) {
      console.error("Error fetching video events:", error);
      toast({
        title: "Error",
        description: "Failed to load video events. Please try again.",
        variant: "destructive",
      });
      setEventData([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Open events dialog
  const handleViewEvents = async (video: VideoData) => {
    setSelectedVideoForEvents(video);
    setEventsDialogOpen(true);
    await fetchVideoEvents(video.id);
  };

  // Delete JSON events file
  const handleDeleteJson = async (videoId: string) => {
    try {
      const response = await fetch(`/api/fixtures/${fixtureId}/videos/${videoId}/events`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete JSON');
      }

      const data = await response.json();
      
      // Update local state with the returned video list
      setVideos(data.videos);
      
      // Invalidate the fixture query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/fixtures", fixtureId] });

      toast({
        title: "Events Deleted",
        description: "JSON events file has been deleted successfully.",
      });
    } catch (error) {
      console.error("JSON delete error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete JSON events file",
        variant: "destructive",
      });
    }
  };

  // Handle clicking on an event to seek video
  const handleEventClick = (event: any, index: number) => {
    if (!videoRef.current) return;
    
    const timestamp = event.timestamp;
    if (!timestamp) return;
    
    // Parse timestamp and seek video
    const seconds = parseTimestamp(timestamp);
    videoRef.current.currentTime = seconds;
    
    // Set selected event for visual feedback
    setSelectedEventIndex(index);
    
    // Pause the video at the event timestamp
    videoRef.current.pause();
  };

  // Toggle event expansion
  const toggleEventExpansion = (index: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering video seek
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Handle event type editing
  const handleEventTypeEdit = (index: number, newType: string) => {
    setEditedEventTypes(prev => {
      const newMap = new Map(prev);
      newMap.set(index, newType);
      return newMap;
    });
    setEditingEventType(null);
  };

  // Get display event type (edited or original)
  const getEventType = (event: any, index: number) => {
    return editedEventTypes.get(index) || event.eventType || event.type || 'EVENT';
  };

  // Update selected event based on video time
  const updateEventFromVideoTime = (currentTime: number) => {
    if (eventData.length === 0) return;
    
    // Find the most recent event that has passed
    let currentEventIndex = -1;
    let closestTime = -1;
    
    eventData.forEach((event, index) => {
      if (event.timestamp) {
        const eventSeconds = parseTimestamp(event.timestamp);
        if (eventSeconds <= currentTime && eventSeconds > closestTime) {
          closestTime = eventSeconds;
          currentEventIndex = index;
        }
      }
    });
    
    if (currentEventIndex !== -1 && currentEventIndex !== selectedEventIndex) {
      setSelectedEventIndex(currentEventIndex);
      
      // Auto-scroll to keep the current event visible
      setTimeout(() => {
        const eventElement = document.querySelector(`[data-testid="event-card-${currentEventIndex}"]`);
        if (eventElement) {
          eventElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 50);
    }
  };

  // Add video time update listener
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleTimeUpdate = () => {
      updateEventFromVideoTime(video.currentTime);
    };
    
    video.addEventListener('timeupdate', handleTimeUpdate);
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [eventData, selectedEventIndex]);

  // Handle seek to specific time
  const handleSeekToTime = () => {
    if (!videoRef.current || !seekTime) return;
    
    // Parse time input (supports formats like "15:22" or "0:15:22" or "1:30:45")
    const parts = seekTime.split(':').map(p => parseInt(p, 10));
    let seconds = 0;
    
    if (parts.length === 2) {
      // mm:ss format
      seconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      // h:mm:ss format
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 1) {
      // Just seconds
      seconds = parts[0];
    }
    
    if (!isNaN(seconds) && seconds >= 0) {
      videoRef.current.currentTime = seconds;
      videoRef.current.pause();
      
      // Find the closest event to this time
      if (eventData.length > 0) {
        let closestIndex = 0;
        let closestDiff = Infinity;
        
        eventData.forEach((event, index) => {
          if (event.timestamp) {
            const eventSeconds = parseTimestamp(event.timestamp);
            const diff = Math.abs(eventSeconds - seconds);
            if (diff < closestDiff) {
              closestDiff = diff;
              closestIndex = index;
            }
          }
        });
        
        // Select the closest event
        setSelectedEventIndex(closestIndex);
        
        // Scroll to the event
        setTimeout(() => {
          const eventElement = document.querySelector(`[data-testid="event-card-${closestIndex}"]`);
          if (eventElement) {
            eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
      
      toast({
        title: "Seeked to time",
        description: `Video moved to ${seekTime}`,
      });
    } else {
      toast({
        title: "Invalid time format",
        description: "Please use format like 15:22 (mm:ss) or 0:15:22 (h:mm:ss)",
        variant: "destructive",
      });
    }
  };

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

  const handleEditVideo = (videoId: string) => {
    setEditingVideo(videoId);
  };

  const handleSaveEdit = async (videoId: string, newDuration: string, newLocation: string) => {
    const updatedVideos = videos.map(v => 
      v.id === videoId 
        ? { ...v, duration: newDuration, location: newLocation }
        : v
    );
    
    setVideos(updatedVideos);
    setEditingVideo(null);
    
    try {
      await updateVideosMutation.mutateAsync(updatedVideos);
    } catch (error) {
      // Revert on error
      setVideos(videos);
      console.error("Failed to update video:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingVideo(null);
  };

  const handleJsonUpload = async (videoId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('json', file);

      const response = await fetch(`/api/fixtures/${fixtureId}/videos/${videoId}/events`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload JSON');
      }

      const data = await response.json();

      // Update local state with the returned video list
      setVideos(data.videos);
      
      // Invalidate the fixture query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/fixtures", fixtureId] });

      toast({
        title: "Events Uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
    } catch (error) {
      console.error("JSON upload error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload JSON events file.",
        variant: "destructive",
      });
    }
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

  // Helper function to get the correct video URL for playback
  const getVideoPlaybackUrl = (video: VideoData) => {
    // If it's a Google Cloud Storage URL, convert it to use our server proxy
    if (video.url && video.url.includes('storage.googleapis.com')) {
      // Use a simple approach: extract everything after the bucket name
      const urlObj = new URL(video.url);
      const pathSegments = urlObj.pathname.split('/').filter(p => p); // Remove empty segments
      
      // For Replit object storage, the path should be: /bucket/private/uploads/objectId
      // We want to create: /objects/uploads/objectId
      if (pathSegments.length >= 3 && pathSegments.includes('uploads')) {
        const uploadsIndex = pathSegments.indexOf('uploads');
        if (uploadsIndex >= 0) {
          const objectPath = pathSegments.slice(uploadsIndex).join('/');
          const proxyUrl = `/objects/${objectPath}`;
          console.log('Converting video URL:', video.url, ' -> ', proxyUrl);
          return proxyUrl;
        }
      }
      
      // Fallback: try to use the direct URL
      console.log('Could not parse storage URL, using direct:', video.url);
      return video.url;
    }
    
    // For other URLs, return as-is
    console.log('Using original video URL:', video.url);
    return video.url;
  };

  // Video Edit Form Component
  const VideoEditForm = ({ 
    video, 
    onSave, 
    onCancel 
  }: {
    video: VideoData;
    onSave: (videoId: string, newDuration: string, newLocation: string) => void;
    onCancel: () => void;
  }) => {
    const [editDuration, setEditDuration] = useState(video.duration);
    const [editLocation, setEditLocation] = useState(video.location);

    const handleSave = () => {
      onSave(video.id, editDuration, editLocation);
    };

    return (
      <div className="flex items-center gap-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Edit className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <div className="flex items-center gap-3 flex-1">
            {/* Duration Select */}
            <div className="min-w-[140px]">
              <Select value={editDuration} onValueChange={setEditDuration}>
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
              <Select value={editLocation} onValueChange={setEditLocation}>
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

            {/* Video filename display */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground truncate">
                {video.filename || video.url}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={handleSave}
            className="h-8"
            data-testid={`button-save-edit-${video.id}`}
          >
            <Save className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="h-8"
            data-testid={`button-cancel-edit-${video.id}`}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  };

  // Video Player Component for embedded playback
  // Video Thumbnail Component - Women's Soccer Placeholder
  const VideoThumbnail = ({ video }: { video: VideoData }) => {
    if (!isVideoFile(video.url!, video.filename)) {
      return null;
    }

    return (
      <div className="w-32 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-lg overflow-hidden relative">
        {/* Soccer field background with women's soccer theme */}
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
        {/* Women's soccer indicator */}
        <div className="absolute bottom-1 right-1 text-xs text-white/80 font-medium bg-black/20 px-1 rounded">
          ⚽
        </div>
      </div>
    );
  };

  const VideoPlayer = ({ video }: { video: VideoData }) => {
    // If video has events, show as button that opens events dialog
    if (video.eventsJsonUrl) {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewEvents(video)}
          data-testid={`button-play-${video.id}`}
          title="View Events"
          className="bg-green-50 hover:bg-green-100 border-green-300"
        >
          <Play className="h-3 w-3 text-green-600" />
        </Button>
      );
    }

    // Otherwise, show the dialog with embedded player
    return (
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
              <div className="space-y-4">
                <video 
                  controls 
                  className="w-full h-auto max-h-[70vh] bg-black rounded-lg"
                  preload="metadata"
                  onError={(e) => {
                    console.error('Video error:', e);
                    const videoElement = e.target as HTMLVideoElement;
                    console.error('Video error details:', videoElement.error);
                  }}
                  onLoadStart={() => console.log('Video started loading')}
                  onCanPlay={() => console.log('Video can play')}
                  onLoadedMetadata={() => console.log('Video metadata loaded')}
                >
                  <source src={getVideoPlaybackUrl(video)} type="video/mp4" />
                  <source src={getVideoPlaybackUrl(video)} type="video/webm" />
                  <source src={getVideoPlaybackUrl(video)} type="video/ogg" />
                  Your browser does not support the video tag.
                </video>
                <div className="text-xs text-muted-foreground">
                  <p><strong>Original URL:</strong> {video.url}</p>
                  <p><strong>Proxy URL:</strong> {getVideoPlaybackUrl(video)}</p>
                  <p><strong>Filename:</strong> {video.filename}</p>
                </div>
              </div>
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
  };

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">In Progress</CardTitle>
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
              {editingVideo === video.id ? (
                <VideoEditForm
                  video={video}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                />
              ) : (
                <div className="flex items-center gap-4">
                  {/* Show thumbnail for first video only */}
                  {videos.indexOf(video) === 0 && (
                    <VideoThumbnail video={video} />
                  )}
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
                        {video.eventsJsonUrl && (
                          <Badge variant="default" className="text-xs bg-purple-500">
                            Events ✓
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
                    {video.eventsJsonUrl && video.eventsJsonFilename ? (
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded">
                        <FileJson className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-green-700 dark:text-green-400 max-w-[120px] truncate" title={video.eventsJsonFilename}>
                          {video.eventsJsonFilename}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteJson(video.id)}
                          className="h-4 w-4 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                          data-testid={`button-delete-json-${video.id}`}
                          title="Delete JSON events"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="file"
                          accept=".json,application/json"
                          className="hidden"
                          id={`json-upload-${video.id}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleJsonUpload(video.id, file);
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById(`json-upload-${video.id}`)?.click()}
                          className="text-purple-600 hover:text-purple-700"
                          data-testid={`button-upload-json-${video.id}`}
                          disabled={video.isProcessing}
                          title="Upload JSON events"
                        >
                          <FileJson className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditVideo(video.id)}
                      className="text-blue-600 hover:text-blue-700"
                      data-testid={`button-edit-${video.id}`}
                      disabled={video.isProcessing}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
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
              )}
              
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

      {/* Events Dialog */}
      <Dialog open={eventsDialogOpen} onOpenChange={setEventsDialogOpen}>
      <DialogContent className="max-w-full max-h-screen w-screen h-screen p-4">
        <DialogHeader className="mb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-green-600" />
              Video Events
              {selectedVideoForEvents ? (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {selectedVideoForEvents.filename || `${getDurationLabel(selectedVideoForEvents.duration)} - ${getLocationLabel(selectedVideoForEvents.location)}`}
                </span>
              ) : null}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                title="Mode 1: Side-by-side view"
              >
                <Grid2x2 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                title="Mode 2: Video with 3 events below"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        {viewMode === "grid" ? (
          // MODE 1: Side-by-side grid layout
          <div className="grid grid-cols-2 gap-4 overflow-hidden h-[calc(100vh-120px)]">
            {/* Video Player Column */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Video</h3>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="mm:ss (e.g., 15:22)"
                    value={seekTime}
                    onChange={(e) => setSeekTime(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSeekToTime();
                      }
                    }}
                    className="h-8 w-32 text-sm"
                    data-testid="input-seek-time"
                  />
                  <Button
                    size="sm"
                    onClick={handleSeekToTime}
                    className="h-8"
                    data-testid="button-seek"
                  >
                    Seek
                  </Button>
                </div>
              </div>
              {selectedVideoForEvents?.url ? (
                <div className="bg-black rounded-lg overflow-hidden aspect-video">
                  <video 
                    ref={videoRef}
                    src={selectedVideoForEvents.url} 
                    controls 
                    className="w-full h-full"
                    data-testid="event-video-player"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : (
                <div className="bg-gray-100 dark:bg-gray-900 rounded-lg aspect-video flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">No video available</p>
                </div>
              )}
            </div>
            
            {/* Events List Column */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Events ({eventData.length})</h3>
              <div className="overflow-y-auto max-h-[calc(90vh-12rem)] pr-2">
                {loadingEvents ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                      <p className="text-sm text-muted-foreground">Loading events...</p>
                    </div>
                  </div>
                ) : eventData.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileJson className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No events found for this video</p>
                  </div>
                ) : (
                  <div className="space-y-3">
              {eventData.map((event, index) => {
                // Calculate derived data
                const fromTeam = event.from?.team;
                const toTeam = event.to?.team;
                const success = fromTeam !== undefined && toTeam !== undefined ? fromTeam === toTeam : null;
                const pitchThird = event.from?.position ? getPitchThird(event.from.position[0]) : null;
                const isSelected = selectedEventIndex === index;
                const isExpanded = expandedEvents.has(index);
                const isEditingType = editingEventType === index;
                const eventType = getEventType(event, index);
                const distance = event.distance !== undefined ? `${event.distance.toFixed(1)}m` : '';
                
                return (
                  <div 
                    key={index} 
                    className={`border rounded-lg overflow-hidden shadow-sm transition-all ${
                      isSelected 
                        ? 'border-green-600 bg-green-50 dark:bg-green-950 ring-2 ring-green-600' 
                        : 'border-gray-200 bg-white dark:bg-gray-800 hover:border-green-400 hover:shadow-md'
                    }`}
                    data-testid={`event-card-${index}`}
                  >
                    {/* Compact Header */}
                    <div 
                      onClick={() => handleEventClick(event, index)}
                      className="px-4 py-3 cursor-pointer flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-sm font-mono text-muted-foreground whitespace-nowrap">
                          {event.timestamp || 'N/A'}
                        </span>
                        
                        {isEditingType ? (
                          <Input
                            value={eventType}
                            onChange={(e) => handleEventTypeEdit(index, e.target.value)}
                            onBlur={() => setEditingEventType(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') setEditingEventType(null);
                              if (e.key === 'Escape') {
                                setEditedEventTypes(prev => {
                                  const newMap = new Map(prev);
                                  newMap.delete(index);
                                  return newMap;
                                });
                                setEditingEventType(null);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="h-7 w-32 text-sm font-bold"
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{eventType}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingEventType(index);
                              }}
                              className="h-5 w-5 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        
                        {distance && (
                          <span className="text-sm text-muted-foreground">{distance}</span>
                        )}
                        
                        {pitchThird && (
                          <span className="text-sm text-muted-foreground">{pitchThird}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {success !== null && (
                          <Badge variant={success ? "default" : "destructive"} className="text-xs">
                            {success ? "SUCCESS" : "FAIL"}
                          </Badge>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => toggleEventExpansion(index, e)}
                          className="h-6 w-6 p-0"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Left Column - Player Info */}
                          {(event.from || event.to) && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase">Players</h4>
                              {event.from && (
                                <div className="text-sm">
                                  <span className="text-muted-foreground">From:</span> Player {event.from.id} (Team {event.from.team})
                                </div>
                              )}
                              {event.to && (
                                <div className="text-sm">
                                  <span className="text-muted-foreground">To:</span> Player {event.to.id} (Team {event.to.team})
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Right Column - Movement Stats */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase">Stats</h4>
                            {event.velocity !== undefined && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Velocity:</span> {event.velocity.toFixed(2)} m/s
                              </div>
                            )}
                            {event.dir && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Direction:</span> {event.dir.toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Additional Badges */}
                        {(event.offside === "True" || event.first_touch === "True") && (
                          <div className="flex gap-2 mt-3">
                            {event.offside === "True" && (
                              <Badge variant="destructive" className="text-xs">Offside</Badge>
                            )}
                            {event.first_touch === "True" && (
                              <Badge variant="secondary" className="text-xs">First Touch</Badge>
                            )}
                          </div>
                        )}
                        
                        {/* Frame and Position Details */}
                        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                          <div className="space-y-1">
                            {event.frame && (
                              <div>Frame: {event.frame} - {event.frame_end || 'N/A'}</div>
                            )}
                            {event.from?.position && (
                              <div>From Position: [{event.from.position[0]}, {event.from.position[1]}]</div>
                            )}
                            {event.to?.position && (
                              <div>To Position: [{event.to.position[0]}, {event.to.position[1]}]</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // MODE 2: Video on top, 3 events below
          <div className="flex flex-col gap-4 overflow-hidden h-[calc(100vh-120px)]">
            {/* Video Player on Top */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Video</h3>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="mm:ss (e.g., 15:22)"
                    value={seekTime}
                    onChange={(e) => setSeekTime(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSeekToTime();
                      }
                    }}
                    className="h-8 w-32 text-sm"
                    data-testid="input-seek-time"
                  />
                  <Button
                    size="sm"
                    onClick={handleSeekToTime}
                    className="h-8"
                    data-testid="button-seek"
                  >
                    Seek
                  </Button>
                </div>
              </div>
              <div className="w-[65%] mx-auto">
                {selectedVideoForEvents?.url ? (
                  <div className="bg-black rounded-lg overflow-hidden aspect-video">
                    <video 
                      ref={videoRef}
                      src={selectedVideoForEvents.url} 
                      controls 
                      className="w-full h-full"
                      data-testid="event-video-player"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : (
                  <div className="bg-gray-100 dark:bg-gray-900 rounded-lg aspect-video flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">No video available</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* 3 Events Below */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Event Details</h3>
              <div className="overflow-y-auto h-full">
                {loadingEvents ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                      <p className="text-sm text-muted-foreground">Loading events...</p>
                    </div>
                  </div>
                ) : eventData.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileJson className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No events found for this video</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {/* Previous Event */}
                    {selectedEventIndex !== null && selectedEventIndex > 0 ? (
                      <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 opacity-60">
                        <p className="text-xs font-semibold text-muted-foreground mb-3">PREVIOUS</p>
                        {(() => {
                          const prevEvent = eventData[selectedEventIndex - 1];
                          return (
                            <div className="space-y-2 text-sm">
                              <p className="font-mono text-xs">{prevEvent.timestamp}</p>
                              <p className="font-bold">{getEventType(prevEvent, selectedEventIndex - 1)}</p>
                              {prevEvent.from && <p className="text-xs text-muted-foreground">From: Player {prevEvent.from.id}</p>}
                              {prevEvent.to && <p className="text-xs text-muted-foreground">To: Player {prevEvent.to.id}</p>}
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="border border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                        <p className="text-xs text-muted-foreground">No previous event</p>
                      </div>
                    )}
                    
                    {/* Current Event */}
                    {selectedEventIndex !== null ? (
                      <div className="border-2 border-green-600 rounded-lg p-4 bg-green-50 dark:bg-green-950">
                        <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-3">CURRENT</p>
                        {(() => {
                          const currEvent = eventData[selectedEventIndex];
                          const fromTeam = currEvent.from?.team;
                          const toTeam = currEvent.to?.team;
                          const success = fromTeam !== undefined && toTeam !== undefined ? fromTeam === toTeam : null;
                          return (
                            <div className="space-y-2 text-sm">
                              <p className="font-mono text-xs">{currEvent.timestamp}</p>
                              <p className="font-bold">{getEventType(currEvent, selectedEventIndex)}</p>
                              {currEvent.from && <p className="text-xs text-muted-foreground">From: Player {currEvent.from.id}</p>}
                              {currEvent.to && <p className="text-xs text-muted-foreground">To: Player {currEvent.to.id}</p>}
                              {success !== null && (
                                <Badge variant={success ? "default" : "destructive"} className="text-xs">
                                  {success ? "SUCCESS" : "FAIL"}
                                </Badge>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="border border-gray-300 rounded-lg p-4 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                        <p className="text-xs text-muted-foreground">Select an event</p>
                      </div>
                    )}
                    
                    {/* Next Event */}
                    {selectedEventIndex !== null && selectedEventIndex < eventData.length - 1 ? (
                      <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 opacity-60">
                        <p className="text-xs font-semibold text-muted-foreground mb-3">NEXT</p>
                        {(() => {
                          const nextEvent = eventData[selectedEventIndex + 1];
                          return (
                            <div className="space-y-2 text-sm">
                              <p className="font-mono text-xs">{nextEvent.timestamp}</p>
                              <p className="font-bold">{getEventType(nextEvent, selectedEventIndex + 1)}</p>
                              {nextEvent.from && <p className="text-xs text-muted-foreground">From: Player {nextEvent.from.id}</p>}
                              {nextEvent.to && <p className="text-xs text-muted-foreground">To: Player {nextEvent.to.id}</p>}
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="border border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                        <p className="text-xs text-muted-foreground">No next event</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}