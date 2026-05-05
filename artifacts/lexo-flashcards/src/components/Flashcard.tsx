import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetCard, getGetCardQueryKey, getCard } from "@workspace/api-client-react";
import { AudioButton } from "./AudioButton";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface FlashcardProps {
  id: number;
  word: string;
  pos: string;
  level: string;
  isFlipped: boolean;
  onFlip: () => void;
  nextCardId?: number;
}

const LEVEL_ACCENT: Record<
  string,
  { border: string; badge: string; arabic: string; chip: string }
> = {
  A1: {
    border: "hover:border-emerald-400/40",
    badge: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20",
    arabic: "text-emerald-300",
    chip: "bg-emerald-500/15 text-emerald-300",
  },
  A2: {
    border: "hover:border-sky-400/40",
    badge: "bg-sky-500/15 text-sky-300 border border-sky-400/20",
    arabic: "text-sky-300",
    chip: "bg-sky-500/15 text-sky-300",
  },
  B1: {
    border: "hover:border-amber-400/40",
    badge: "bg-amber-500/15 text-amber-300 border border-amber-400/20",
    arabic: "text-amber-300",
    chip: "bg-amber-500/15 text-amber-300",
  },
  B2: {
    border: "hover:border-rose-400/40",
    badge: "bg-rose-500/15 text-rose-300 border border-rose-400/20",
    arabic: "text-rose-300",
    chip: "bg-rose-500/15 text-rose-300",
  },
};

export function Flashcard({ id, word, pos, level, isFlipped, onFlip, nextCardId }: FlashcardProps) {
  const accent = LEVEL_ACCENT[level] ?? LEVEL_ACCENT.A1;
  const queryClient = useQueryClient();
  
  // Fetch the full card eagerly so the front-side audio button is available
  // as soon as the card mounts. The back-side reuses the same cached data.
  const { data: card, isLoading, isError } = useGetCard(id, {
    query: {
      enabled: true,
      queryKey: getGetCardQueryKey(id)
    }
  });

  // Prefetch next card if available
  React.useEffect(() => {
    if (nextCardId) {
      queryClient.prefetchQuery({
        queryKey: getGetCardQueryKey(nextCardId),
        queryFn: () => getCard(nextCardId),
      });
    }
  }, [nextCardId, queryClient]);

  return (
    <div className="relative w-full max-w-2xl aspect-[4/3] sm:aspect-[16/9] perspective-1000 cursor-pointer" onClick={onFlip}>
      <motion.div
        className="w-full h-full relative preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Front */}
        <div className={cn(
          "absolute inset-0 backface-hidden glass-card rounded-2xl flex flex-col items-center justify-center p-8 text-center group border border-white/5 transition-colors",
          accent.border,
        )}>
          <span className={cn("absolute top-6 right-6 text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-md", accent.chip)}>{level}</span>
          <Badge variant="secondary" className="absolute top-6 left-6 text-xs uppercase tracking-wider bg-white/5">{pos}</Badge>
          <h2 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6 text-foreground">{word}</h2>
          <div className="mb-6">
            {card?.audioWordUrl ? (
              <AudioButton url={card.audioWordUrl} size="default" />
            ) : (
              <AudioButton url="" size="default" />
            )}
          </div>
          <div className="text-muted-foreground text-sm opacity-60 group-hover:opacity-100 transition-opacity absolute bottom-8">
            Press Space or Tap to flip
          </div>
        </div>

        {/* Back */}
        <div
          className={cn(
            "absolute inset-0 backface-hidden glass-card rounded-2xl flex flex-col p-6 sm:p-10 border border-white/5 transition-colors",
            accent.border,
          )}
          style={{ transform: "rotateY(180deg)" }}
        >
          {isLoading && !card ? (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
              <Skeleton className="h-12 w-48 bg-white/5" />
              <Skeleton className="h-6 w-24 bg-white/5" />
              <div className="w-full space-y-3 mt-8">
                <Skeleton className="h-4 w-full bg-white/5" />
                <Skeleton className="h-4 w-5/6 bg-white/5" />
              </div>
            </div>
          ) : isError ? (
            <div className="w-full h-full flex items-center justify-center text-destructive">
              Failed to load card details.
            </div>
          ) : card ? (
            <div className="flex flex-col h-full justify-between">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-4">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground">{card.english}</h2>
                    {card.audioWordUrl && <AudioButton url={card.audioWordUrl} />}
                  </div>
                  <Badge variant="secondary" className="w-fit text-xs bg-white/5">{card.pos}</Badge>
                </div>
                <div className="text-right">
                  <h3 className={cn("text-3xl sm:text-4xl font-arabic font-bold", accent.arabic)} dir="rtl">{card.arabic}</h3>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/10 flex-grow flex flex-col justify-center space-y-6">
                <div className="flex items-start gap-4">
                  {card.audioSentenceUrl && <AudioButton url={card.audioSentenceUrl} className="mt-1 flex-shrink-0" />}
                  <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">{card.sentenceEn}</p>
                </div>
                <div className="flex items-start gap-4 justify-end">
                  <p className="text-xl sm:text-2xl font-arabic text-foreground leading-relaxed text-right" dir="rtl">{card.sentenceAr}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
