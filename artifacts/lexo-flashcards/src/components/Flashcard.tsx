import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetCard, getGetCardQueryKey, getCard } from "@workspace/api-client-react";
import { AudioButton } from "./AudioButton";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Lightbulb } from "lucide-react";

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
  { border: string; badge: string; arabic: string; chip: string; highlight: string }
> = {
  A1: {
    border: "hover:border-emerald-400/40",
    badge: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20",
    arabic: "text-emerald-300",
    chip: "bg-emerald-500/15 text-emerald-300",
    highlight: "text-emerald-300 bg-emerald-500/10",
  },
  A2: {
    border: "hover:border-sky-400/40",
    badge: "bg-sky-500/15 text-sky-300 border border-sky-400/20",
    arabic: "text-sky-300",
    chip: "bg-sky-500/15 text-sky-300",
    highlight: "text-sky-300 bg-sky-500/10",
  },
  B1: {
    border: "hover:border-amber-400/40",
    badge: "bg-amber-500/15 text-amber-300 border border-amber-400/20",
    arabic: "text-amber-300",
    chip: "bg-amber-500/15 text-amber-300",
    highlight: "text-amber-300 bg-amber-500/10",
  },
  B2: {
    border: "hover:border-rose-400/40",
    badge: "bg-rose-500/15 text-rose-300 border border-rose-400/20",
    arabic: "text-rose-300",
    chip: "bg-rose-500/15 text-rose-300",
    highlight: "text-rose-300 bg-rose-500/10",
  },
};

/**
 * Highlight the target word (and simple inflections) inside a sentence.
 * Splits on a case-insensitive word-boundary regex and wraps matches in a styled span.
 */
function highlightWord(sentence: string, word: string, className: string) {
  if (!sentence || !word) return sentence;
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Match the word and common inflections (s, es, ed, ing, ly)
  const re = new RegExp(`\\b(${escaped}(?:s|es|ed|ing|ly)?)\\b`, "gi");
  const parts: Array<string | { match: string; key: number }> = [];
  let lastIndex = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sentence)) !== null) {
    if (m.index > lastIndex) parts.push(sentence.slice(lastIndex, m.index));
    parts.push({ match: m[0], key: i++ });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < sentence.length) parts.push(sentence.slice(lastIndex));
  return parts.map((p, idx) =>
    typeof p === "string" ? (
      <React.Fragment key={`t-${idx}`}>{p}</React.Fragment>
    ) : (
      <span
        key={`m-${p.key}-${idx}`}
        className={cn(
          "px-1.5 py-0.5 rounded-md font-semibold",
          className,
        )}
      >
        {p.match}
      </span>
    ),
  );
}

/** Mask a word into a hint pattern, revealing the first `revealCount` letters. */
function buildHintMask(word: string, revealCount: number) {
  const chars = word.split("");
  return chars
    .map((c, i) => {
      if (!/[a-zA-Z]/.test(c)) return c;
      return i < revealCount ? c : "_";
    })
    .join(" ");
}

export function Flashcard({ id, word, pos, level, isFlipped, onFlip, nextCardId }: FlashcardProps) {
  const accent = LEVEL_ACCENT[level] ?? LEVEL_ACCENT.A1;
  const queryClient = useQueryClient();
  const [hintLevel, setHintLevel] = React.useState(0);

  // Reset hint when card changes
  React.useEffect(() => {
    setHintLevel(0);
  }, [id]);

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

  // Optional fields the API may add later
  const synonyms: string[] | undefined = (card as any)?.synonyms;
  const antonyms: string[] | undefined = (card as any)?.antonyms;

  const hintLetters = Math.min(Math.ceil(word.length / 3) * (hintLevel || 0), word.length - 1);
  const hintMask = buildHintMask(word, hintLetters);

  return (
    <motion.div
      className="relative w-full max-w-2xl aspect-[4/3] sm:aspect-[16/9] perspective-1000 cursor-pointer"
      onClick={onFlip}
      whileHover={{ scale: 1.015 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
    >
      <motion.div
        className="w-full h-full relative preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
      >
        {/* Front */}
        <div className={cn(
          "absolute inset-0 backface-hidden glass-card-premium card-aurora overflow-hidden rounded-2xl flex flex-col items-center justify-center p-8 text-center group transition-all duration-300",
          accent.border,
        )}>
          <span className={cn("absolute top-6 right-6 text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-md backdrop-blur-sm", accent.chip)}>{level}</span>

          <span className="mb-3 sm:mb-4 inline-flex items-center text-[10px] sm:text-xs uppercase tracking-[0.18em] font-semibold text-white/85 px-2.5 py-1 rounded-full bg-white/[0.06] backdrop-blur-sm border border-white/10 shadow-[0_0_18px_-4px_rgba(139,92,246,0.45)]">
            {pos}
          </span>

          <AnimatePresence mode="wait">
            <motion.h2
              key={word}
              initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={cn(
                "font-bold tracking-tight mb-5 sm:mb-6 text-foreground text-cinematic break-words max-w-[90%] leading-tight",
                word.length > 14
                  ? "text-3xl sm:text-5xl"
                  : word.length > 9
                    ? "text-4xl sm:text-6xl"
                    : "text-5xl sm:text-7xl",
              )}
            >
              {word}
            </motion.h2>
          </AnimatePresence>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium select-none">EN</span>
            {card?.audioWordUrl ? (
              <AudioButton url={card.audioWordUrl} size="default" />
            ) : (
              <AudioButton url="" size="default" />
            )}
          </div>

          {/* Hint */}
          <div
            className="flex flex-col items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setHintLevel((h) => (h >= 2 ? 0 : h + 1));
              }}
              className={cn(
                "group/hint inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium",
                "bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-violet-400/40",
                "text-muted-foreground hover:text-white transition-all",
              )}
              aria-pressed={hintLevel > 0}
              aria-label={
                hintLevel === 0
                  ? "Show hint"
                  : hintLevel === 1
                    ? `Hint: ${hintMask}. Show more letters.`
                    : "Hide hint"
              }
            >
              <Lightbulb className="w-3 h-3 transition-transform group-hover/hint:scale-110 text-amber-300/80" />
              {hintLevel === 0 ? "Hint" : hintLevel === 1 ? "More" : "Hide"}
            </button>
            <AnimatePresence>
              {hintLevel > 0 ? (
                <motion.div
                  key={`hint-${hintLevel}`}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs text-muted-foreground tracking-widest font-mono"
                >
                  <span className="text-white/80">{hintMask}</span>
                  <span className="ml-2 text-[10px] text-muted-foreground/70">
                    {word.length} letters · {pos}
                  </span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="text-muted-foreground text-[10px] sm:text-xs opacity-50 group-hover:opacity-90 transition-opacity absolute bottom-3 sm:bottom-4 tracking-wide">
            Press Space or Tap to flip
          </div>
        </div>

        {/* Back */}
        <div
          className={cn(
            "absolute inset-0 backface-hidden glass-card-premium overflow-hidden rounded-2xl flex flex-col p-6 sm:p-8 transition-all duration-300",
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
              <div className="flex justify-between items-start gap-4">
                <div className="flex flex-col gap-2 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl sm:text-4xl font-bold text-foreground text-cinematic">{card.english}</h2>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium select-none">EN</span>
                    {card.audioWordUrl && <AudioButton url={card.audioWordUrl} />}
                  </div>
                  <Badge variant="secondary" className="w-fit text-xs bg-white/5">{card.pos}</Badge>
                </div>
                <div className="text-right">
                  <h3 className={cn("text-2xl sm:text-4xl font-arabic font-bold", accent.arabic)} dir="rtl">{card.arabic}</h3>
                </div>
              </div>

              {/* Story Mode: example sentence with target word highlighted */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-white/10 flex-grow flex flex-col justify-center space-y-4"
              >
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mb-1">
                  Example
                </div>
                <div className="flex items-start gap-3 sm:gap-4">
                  {card.audioSentenceUrl && (
                    <AudioButton url={card.audioSentenceUrl} className="mt-1 flex-shrink-0" />
                  )}
                  <p className="text-base sm:text-xl text-foreground/90 leading-relaxed">
                    {highlightWord(card.sentenceEn, card.english, accent.highlight)}
                  </p>
                </div>
                <div className="flex items-start gap-4 justify-end">
                  <p
                    className="text-lg sm:text-2xl font-arabic text-muted-foreground leading-relaxed text-right"
                    dir="rtl"
                  >
                    {card.sentenceAr}
                  </p>
                </div>

                {/* Synonyms / Antonyms (rendered only when API provides them) */}
                {(synonyms?.length || antonyms?.length) ? (
                  <div className="mt-2 pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    {synonyms?.length ? (
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-emerald-300/80 mb-1.5">
                          Synonyms
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {synonyms.map((s) => (
                            <span
                              key={`syn-${s}`}
                              className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-200 border border-emerald-400/20"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {antonyms?.length ? (
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-rose-300/80 mb-1.5">
                          Antonyms
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {antonyms.map((a) => (
                            <span
                              key={`ant-${a}`}
                              className="text-xs px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-200 border border-rose-400/20"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </motion.div>
            </div>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}
