import { useRef, useEffect } from "react";

interface VideoPlayerProps {
  collectionId: string;
  season: number;
  episode: number;
}

export default function VideoPlayer({
  collectionId,
  season,
  episode,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Auto-focus video for keyboard controls
    if (videoRef.current) {
      videoRef.current.focus();
    }
  }, []);

  const streamUrl = `/api/stream?collectionId=${encodeURIComponent(collectionId)}&season=${season}&ep=${episode}`;

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src={streamUrl}
        className="w-full h-full"
        controls
        autoPlay
        playsInline
      />
    </div>
  );
}
