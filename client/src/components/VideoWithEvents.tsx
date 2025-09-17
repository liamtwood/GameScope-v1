import { useState, useEffect } from 'react';
import { MatchEventTable } from '@/components/MatchEventTable';
import { VideoAnalysisSettings } from '@/components/VideoAnalysisSettings';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VideoWithEventsProps {
  url: string;
  onVideoUrlChange: (url: string) => void;
}

export function VideoWithEvents({ url, onVideoUrlChange }: VideoWithEventsProps) {
  const [currentSeekTime, setCurrentSeekTime] = useState<number | null>(null);
  const [kickoffOffset, setKickoffOffset] = useState<number>(0);
  const [secondHalfOffset, setSecondHalfOffset] = useState<number>(0);
  
  // Load saved offsets from localStorage
  useEffect(() => {
    const savedKickoff = localStorage.getItem('match-kickoff-offset');
    const savedSecondHalf = localStorage.getItem('match-second-half-offset');
    
    if (savedKickoff) {
      const offset = parseFloat(savedKickoff);
      setKickoffOffset(offset);
    }
    
    if (savedSecondHalf) {
      const offset = parseFloat(savedSecondHalf);
      setSecondHalfOffset(offset);
    }
  }, []);
  
  // Save offsets to localStorage when they change
  useEffect(() => {
    localStorage.setItem('match-kickoff-offset', kickoffOffset.toString());
  }, [kickoffOffset]);
  
  useEffect(() => {
    localStorage.setItem('match-second-half-offset', secondHalfOffset.toString());
  }, [secondHalfOffset]);
  
  const handleKickoffOffsetChange = (newOffset: number) => {
    setKickoffOffset(newOffset);
  };
  
  const handleSecondHalfOffsetChange = (newOffset: number) => {
    setSecondHalfOffset(newOffset);
  };
  
  const handleEventClick = (eventTimeInSeconds: number, eventPeriod: number = 1) => {
    // Apply appropriate offset based on period
    let videoTimeInSeconds: number;
    
    if (eventPeriod === 2) {
      // Second half: use second half offset
      videoTimeInSeconds = eventTimeInSeconds + secondHalfOffset;
      console.log('Event time:', eventTimeInSeconds, 'Second half offset:', secondHalfOffset, 'Video seek time:', videoTimeInSeconds);
    } else {
      // First half: use kickoff offset
      videoTimeInSeconds = eventTimeInSeconds + kickoffOffset;
      console.log('Event time:', eventTimeInSeconds, 'Kickoff offset:', kickoffOffset, 'Video seek time:', videoTimeInSeconds);
    }
    
    setCurrentSeekTime(videoTimeInSeconds);
    
    // Ensure we don't seek to negative time
    const seekTime = Math.max(0, videoTimeInSeconds);
    
    // Find the YouTube iframe and seek to the time
    const iframe = document.querySelector('#youtube-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        `{"event":"command","func":"seekTo","args":[${seekTime}, true]}`,
        '*'
      );
    }
    
    // Also try to seek using any other player refs if available
    const reactPlayerSeek = () => {
      const playerElement = document.querySelector('[data-testid="simple-youtube-player"]');
      if (playerElement) {
        console.log('Found react player element, seeking...');
      }
    };
    
    setTimeout(reactPlayerSeek, 100);
  };

  // Extract video ID for display
  const getVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const videoId = getVideoId(url);

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Match Analysis: Spain Women's vs England Women's</span>
            <div className="flex items-center gap-4">
              {currentSeekTime !== null && (
                <span className="text-sm font-normal text-blue-600">
                  Last seek: {Math.floor(currentSeekTime / 60)}:{(currentSeekTime % 60).toFixed(0).padStart(2, '0')}
                </span>
              )}
              <VideoAnalysisSettings
                videoUrl={url}
                onVideoUrlChange={onVideoUrlChange}
                kickoffOffset={kickoffOffset}
                onKickoffOffsetChange={handleKickoffOffsetChange}
                secondHalfOffset={secondHalfOffset}
                onSecondHalfOffsetChange={handleSecondHalfOffsetChange}
                onEventClick={handleEventClick}
              />
            </div>
          </CardTitle>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Event Table - Left Side */}
        <div className="lg:col-span-2">
          <MatchEventTable onEventClick={handleEventClick} />
        </div>
        
        {/* Video Player - Right Side */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Match Video</CardTitle>
              {videoId && (
                <p className="text-sm text-gray-600">
                  Video ID: {videoId}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <iframe
                  id="youtube-iframe"
                  src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&controls=1&rel=0&fs=1`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  data-testid="match-video-iframe"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
    </div>
  );
}