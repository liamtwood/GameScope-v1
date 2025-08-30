import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Upload, Play, Link } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
}

interface VideoManagerProps {
  fixtureId: string;
  videoLinks?: VideoData[];
  onUpdate?: () => void;
}

export function VideoManager({ fixtureId, videoLinks = [], onUpdate }: VideoManagerProps) {
  const [videos, setVideos] = useState<VideoData[]>(videoLinks);
  const [selectedDuration, setSelectedDuration] = useState<string>("1st_half");
  const [selectedLocation, setSelectedLocation] = useState<string>("halfway_line");
  const [linkUrl, setLinkUrl] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateVideosMutation = useMutation({
    mutationFn: async (videoData: VideoData[]) => {
      await apiRequest("PUT", `/api/fixtures/${fixtureId}/videos`, { videos: videoData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fixtures", fixtureId] });
      toast({
        title: "Videos Updated",
        description: "Match videos have been updated successfully.",
      });
      onUpdate?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update videos. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload");
    const data = await response.json() as { uploadURL: string };
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const videoData: VideoData = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        duration: selectedDuration,
        location: selectedLocation,
        url: uploadedFile.uploadURL as string,
        filename: uploadedFile.name,
        uploadedAt: new Date().toISOString(),
      };

      // Add new video to the list
      const updatedVideos = [...videos, videoData];
      setVideos(updatedVideos);

      // Save to database
      await updateVideosMutation.mutateAsync(updatedVideos);
      setIsDialogOpen(false);
    }
  };

  const handleAddLink = async () => {
    if (!linkUrl.trim()) return;

    const videoData: VideoData = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      duration: selectedDuration,
      location: selectedLocation,
      url: linkUrl.trim(),
      uploadedAt: new Date().toISOString(),
    };

    // Add new video to the list
    const updatedVideos = [...videos, videoData];
    setVideos(updatedVideos);

    // Save to database
    await updateVideosMutation.mutateAsync(updatedVideos);
    setLinkUrl("");
    setIsDialogOpen(false);
  };

  const handleRemoveVideo = async (videoId: string) => {
    const updatedVideos = videos.filter(v => v.id !== videoId);
    setVideos(updatedVideos);
    await updateVideosMutation.mutateAsync(updatedVideos);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Match Videos</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-video">
              <Upload className="w-4 h-4 mr-2" />
              Add Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Match Video</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="video-duration">Duration</Label>
                  <select
                    id="video-duration"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md bg-white"
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                    data-testid="select-video-duration"
                  >
                    {DURATION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="video-location">Location</Label>
                  <select
                    id="video-location"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md bg-white"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    data-testid="select-video-location"
                  >
                    {LOCATION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload" data-testid="tab-upload">Upload File</TabsTrigger>
                  <TabsTrigger value="link" data-testid="tab-link">Add Link</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload" className="space-y-3">
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={500 * 1024 * 1024} // 500MB for video files
                    onGetUploadParameters={getUploadParameters}
                    onComplete={handleUploadComplete}
                    buttonClassName="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Video File
                  </ObjectUploader>
                </TabsContent>
                
                <TabsContent value="link" className="space-y-3">
                  <div>
                    <Label htmlFor="video-link">Video URL</Label>
                    <Input
                      id="video-link"
                      type="url"
                      placeholder="https://..."
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      data-testid="input-video-link"
                    />
                  </div>
                  <Button 
                    onClick={handleAddLink} 
                    className="w-full"
                    disabled={!linkUrl.trim()}
                    data-testid="button-add-link"
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Add Video Link
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No videos uploaded yet. Click "Add Video" to get started.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {videos.map((video) => {
            const durationLabel = DURATION_OPTIONS.find(d => d.value === video.duration)?.label || video.duration;
            const locationLabel = LOCATION_OPTIONS.find(l => l.value === video.location)?.label || video.location;
            
            return (
              <Card key={video.id} data-testid={`card-video-${video.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <CardTitle className="text-sm font-medium">
                        {durationLabel} - {locationLabel}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {durationLabel}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {locationLabel}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {video.filename ? "File" : "Link"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(video.url, '_blank')}
                        data-testid={`button-play-${video.id}`}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveVideo(video.id)}
                        data-testid={`button-remove-${video.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground truncate">
                        {video.filename || video.url}
                      </span>
                    </div>
                    {video.uploadedAt && (
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(video.uploadedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}