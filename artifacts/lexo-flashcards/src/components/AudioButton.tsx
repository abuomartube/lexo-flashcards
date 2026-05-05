import React, { useState, useRef, useEffect } from "react";
import { Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AudioButtonProps {
  url: string;
  className?: string;
  size?: "default" | "sm" | "icon";
  variant?: "default" | "ghost" | "secondary";
}

export function AudioButton({ url, className, size = "icon", variant = "secondary" }: AudioButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const handlePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!url) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    try {
      setIsLoading(true);
      if (!audioRef.current) {
        audioRef.current = new Audio(url);
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.onerror = () => {
          setIsLoading(false);
          setIsPlaying(false);
        };
      } else if (audioRef.current.src !== new URL(url, window.location.href).href) {
        audioRef.current.src = url;
      }
      
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.error("Audio playback failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePlay}
      disabled={isLoading}
      className={cn(
        "rounded-full transition-all relative overflow-hidden",
        isPlaying && "text-primary ring-2 ring-primary/50 animate-pulse",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Play className={cn("w-4 h-4", isPlaying && "fill-current")} />
      )}
      {isPlaying && (
        <span className="absolute inset-0 bg-primary/10 rounded-full animate-ping" />
      )}
    </Button>
  );
}
