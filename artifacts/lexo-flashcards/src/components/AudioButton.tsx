import React, { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AudioButtonProps {
  url: string;
  className?: string;
  size?: "default" | "sm" | "icon";
  variant?: "default" | "ghost" | "secondary";
}

export function AudioButton({
  url,
  className,
  size = "icon",
  variant = "secondary",
}: AudioButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Preload as soon as we have a URL so playback is instant on first click.
  useEffect(() => {
    if (!url) return;
    const a = new Audio();
    a.preload = "auto";
    a.src = url;
    a.crossOrigin = "anonymous";
    audioRef.current = a;
    a.load();
    const onEnded = () => setIsPlaying(false);
    const onPause = () => setIsPlaying(false);
    a.addEventListener("ended", onEnded);
    a.addEventListener("pause", onPause);
    return () => {
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("pause", onPause);
      a.pause();
      a.src = "";
      if (audioRef.current === a) audioRef.current = null;
    };
  }, [url]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) {
      a.pause();
      a.currentTime = 0;
      setIsPlaying(false);
      return;
    }
    a.currentTime = 0;
    setIsPlaying(true);
    const p = a.play();
    if (p && typeof p.then === "function") {
      p.catch((err) => {
        console.error("Audio playback failed", err);
        setIsPlaying(false);
      });
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      onPointerDown={(e) => e.stopPropagation()}
      disabled={!url}
      className={cn(
        "rounded-full transition-all relative overflow-hidden",
        isPlaying && "text-primary ring-2 ring-primary/50",
        className,
      )}
    >
      {isPlaying ? (
        <Pause className="w-4 h-4 fill-current" />
      ) : (
        <Play className="w-4 h-4 fill-current" />
      )}
      {isPlaying && (
        <span className="absolute inset-0 bg-primary/10 rounded-full animate-ping" />
      )}
    </Button>
  );
}
