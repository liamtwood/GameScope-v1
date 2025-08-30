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

// Standard video types for soccer matches
const VIDEO_TYPES = [
  { id: "main_camera_1st", label: "Main Camera - 1st Half", category: "main" },
  { id: "main_camera_2nd", label: "Main Camera - 2nd Half", category: "main" },
  { id: "wide_angle_full", label: "Wide Angle - Full Match", category: "wide" },
  { id: "behind_goal_full", label: "Behind Goal - Full Match", category: "goal" },
] as const;

type VideoType = typeof VIDEO_TYPES[number]["id"];

interface VideoData {
  type: VideoType;
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
  const [selectedType, setSelectedType] = useState<VideoType>("main_camera_1st");
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
        type: selectedType,
        url: uploadedFile.uploadURL as string,
        filename: uploadedFile.name,
        uploadedAt: new Date().toISOString(),
      };

      // Update local state
      const updatedVideos = videos.filter(v => v.type !== selectedType);
      updatedVideos.push(videoData);
      setVideos(updatedVideos);

      // Save to database
      await updateVideosMutation.mutateAsync(updatedVideos);
      setIsDialogOpen(false);
    }
  };

  const handleAddLink = async () => {
    if (!linkUrl.trim()) return;

    const videoData: VideoData = {
      type: selectedType,
      url: linkUrl.trim(),
      uploadedAt: new Date().toISOString(),
    };

    // Update local state
    const updatedVideos = videos.filter(v => v.type !== selectedType);
    updatedVideos.push(videoData);
    setVideos(updatedVideos);

    // Save to database
    await updateVideosMutation.mutateAsync(updatedVideos);
    setLinkUrl("");
    setIsDialogOpen(false);
  };

  const handleRemoveVideo = async (type: VideoType) => {
    const updatedVideos = videos.filter(v => v.type !== type);
    setVideos(updatedVideos);
    await updateVideosMutation.mutateAsync(updatedVideos);
  };

  const getVideoForType = (type: VideoType) => videos.find(v => v.type === type);

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
              <div>
                <Label htmlFor="video-type">Video Type</Label>
                <select
                  id="video-type"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md bg-white"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as VideoType)}
                  data-testid="select-video-type"
                >
                  {VIDEO_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
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

      <div className="grid gap-3">
        {VIDEO_TYPES.map((typeInfo) => {
          const video = getVideoForType(typeInfo.id);
          
          return (
            <Card key={typeInfo.id} data-testid={`card-video-${typeInfo.id}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium">
                    {typeInfo.label}
                  </CardTitle>
                  {video && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {video.filename ? "File" : "Link"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveVideo(typeInfo.id)}
                        data-testid={`button-remove-${typeInfo.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {video ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground truncate">
                        {video.filename || video.url}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(video.url, '_blank')}
                        data-testid={`button-play-${typeInfo.id}`}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                    {video.uploadedAt && (
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(video.uploadedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No video uploaded
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}