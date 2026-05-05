import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useListLevels, useListWords } from "@workspace/api-client-react";
import { Flashcard } from "@/components/Flashcard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Shuffle, Check, BookOpen, Bookmark, Layers, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudyStatus, type StudyStatus } from "@/lib/studyStatus";
import { THEMES, getThemeById, buildThemeWordSet } from "@/lib/themes";

const LEVEL_STYLES: Record<
  string,
  { gradient: string; glow: string; ring: string; text: string }
> = {
  ALL: {
    gradient: "bg-gradient-to-r from-violet-500 to-blue-500",
    glow: "shadow-[0_0_20px_rgba(124,58,237,0.35)]",
    ring: "ring-violet-400/40",
    text: "text-violet-300",
  },
  A1: {
    gradient: "bg-gradient-to-r from-emerald-500 to-teal-500",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.35)]",
    ring: "ring-emerald-400/40",
    text: "text-emerald-300",
  },
  A2: {
    gradient: "bg-gradient-to-r from-sky-500 to-cyan-500",
    glow: "shadow-[0_0_20px_rgba(14,165,233,0.35)]",
    ring: "ring-sky-400/40",
    text: "text-sky-300",
  },
  B1: {
    gradient: "bg-gradient-to-r from-amber-500 to-orange-500",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.35)]",
    ring: "ring-amber-400/40",
    text: "text-amber-300",
  },
  B2: {
    gradient: "bg-gradient-to-r from-rose-500 to-pink-500",
    glow: "shadow-[0_0_20px_rgba(244,63,94,0.35)]",
    ring: "ring-rose-400/40",
    text: "text-rose-300",
  },
};

export default function Home() {
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [themesOpen, setThemesOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"browse" | "known" | "learning">("browse");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);

  const { statusMap, setStatus, getStatus, countByStatus } = useStudyStatus();

  const { data: levels } = useListLevels();
  const { data: words, isLoading: isWordsLoading } = useListWords({
    level:
      viewMode !== "browse" || selectedTheme || selectedLevel === "ALL"
        ? undefined
        : (selectedLevel as any),
  });

  const activeTheme = getThemeById(selectedTheme);

  const displayWords = React.useMemo(() => {
    if (!words) return [];
    let list = words;
    if (viewMode === "known") {
      list = list.filter((w) => statusMap[w.id] === "known");
    } else if (viewMode === "learning") {
      list = list.filter((w) => statusMap[w.id] === "learning");
    } else if (activeTheme) {
      const set = buildThemeWordSet(activeTheme);
      list = list.filter((w) => set.has(w.english.toLowerCase()));
    }
    if (isShuffled) {
      return [...list].sort(() => Math.random() - 0.5);
    }
    return list;
  }, [words, isShuffled, viewMode, statusMap, activeTheme]);

  const knownCount = countByStatus("known");
  const learningCount = countByStatus("learning");

  const currentWord = displayWords[currentIndex];
  const nextWord = displayWords[currentIndex + 1];

  const handleNext = useCallback(() => {
    if (displayWords && currentIndex < displayWords.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    }
  }, [currentIndex, displayWords]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
    }
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleFlip();
      } else if (e.code === "ArrowRight") {
        handleNext();
      } else if (e.code === "ArrowLeft") {
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlip, handleNext, handlePrev]);

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedLevel, isShuffled, viewMode, selectedTheme]);

  const handleMark = useCallback(
    (status: StudyStatus) => {
      if (!currentWord) return;
      setStatus(currentWord.id, status);
      // Advance to next card after marking
      if (currentIndex < displayWords.length - 1) {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex((p) => p + 1), 150);
      } else {
        setIsFlipped(false);
      }
    },
    [currentWord, currentIndex, displayWords.length, setStatus],
  );

  const currentStatus = currentWord ? getStatus(currentWord.id) : undefined;
  const [flash, setFlash] = useState<null | "known" | "learning">(null);
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 700);
    return () => clearTimeout(t);
  }, [flash]);
  const handleMarkWithFlash = useCallback(
    (status: StudyStatus) => {
      setFlash(status);
      handleMark(status);
    },
    [handleMark],
  );

  const progressPct =
    displayWords.length > 0
      ? ((currentIndex + 1) / displayWords.length) * 100
      : 0;

  return (
    <div className="app-bg min-h-[100dvh] w-full">
      <div className="particles" aria-hidden />
      <div className="relative min-h-[100dvh] flex flex-col items-center pb-12 pt-6 px-4 max-w-5xl mx-auto w-full">
      <header className="w-full flex items-center justify-between mb-8 sm:mb-12">
        <div className="flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="LEXO Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-md" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            LEXO <span className="text-gradient">Flashcards</span>
          </h1>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 justify-center mb-4 w-full">
        <button
          onClick={() => {
            setViewMode("known");
            setSelectedLevel("ALL");
          }}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2",
            viewMode === "known"
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)]"
              : "bg-white/5 hover:bg-white/10 text-emerald-300",
          )}
        >
          <Check className="w-3.5 h-3.5" />
          I know it
          <Badge
            variant="secondary"
            className="px-1.5 py-0 text-[10px] bg-black/20 text-white/80"
          >
            {knownCount}
          </Badge>
        </button>
        <button
          onClick={() => {
            setViewMode("learning");
            setSelectedLevel("ALL");
          }}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2",
            viewMode === "learning"
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.35)]"
              : "bg-white/5 hover:bg-white/10 text-amber-300",
          )}
        >
          <Bookmark className="w-3.5 h-3.5" />
          A new word
          <Badge
            variant="secondary"
            className="px-1.5 py-0 text-[10px] bg-black/20 text-white/80"
          >
            {learningCount}
          </Badge>
        </button>
        <button
          onClick={() => {
            setViewMode("browse");
            setSelectedLevel("ALL");
          }}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2",
            viewMode === "browse"
              ? "bg-white/10 text-white"
              : "bg-white/5 hover:bg-white/10 text-muted-foreground",
          )}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Browse all
        </button>
      </div>

      <div
        className={cn(
          "flex flex-wrap gap-2 justify-center items-center mb-10 w-full transition-opacity",
          viewMode !== "browse" && "opacity-40 pointer-events-none",
        )}
      >
        <div className="relative">
          <button
            onClick={() => setThemesOpen((v) => !v)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2",
              activeTheme
                ? `${activeTheme.color.gradient} text-white ${activeTheme.color.glow}`
                : themesOpen
                  ? "bg-white/15 text-white"
                  : "bg-white/5 hover:bg-white/10 text-muted-foreground",
            )}
          >
            {activeTheme ? (
              <>
                <span className="text-base leading-none">{activeTheme.emoji}</span>
                {activeTheme.label}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTheme(null);
                    setThemesOpen(false);
                  }}
                  className="ml-1 -mr-1 p-0.5 rounded-full hover:bg-black/20"
                  aria-label="Clear theme"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <Layers className="w-4 h-4" />
                Word families
              </>
            )}
          </button>

          {themesOpen ? (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setThemesOpen(false)}
              />
              <div className="absolute z-40 left-1/2 -translate-x-1/2 mt-2 w-[min(94vw,40rem)] p-3 rounded-2xl glass-card border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between px-1 pb-2">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Word families · {THEMES.length} categories
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 max-h-[60vh] overflow-y-auto pr-1">
                  {THEMES.map((t) => {
                    const active = selectedTheme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setSelectedTheme(active ? null : t.id);
                          setSelectedLevel("ALL");
                          setThemesOpen(false);
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-1.5",
                          active
                            ? `${t.color.gradient} text-white ${t.color.glow}`
                            : `bg-white/5 hover:bg-white/10 ${t.color.text}`,
                        )}
                      >
                        <span className="text-sm leading-none">{t.emoji}</span>
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div className="w-px h-6 bg-white/10 mx-1" />

        <div
          className={cn(
            "flex flex-wrap gap-2 justify-center transition-opacity",
            selectedTheme && "opacity-40 pointer-events-none",
          )}
        >
        <button
          onClick={() => setSelectedLevel("ALL")}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
            selectedLevel === "ALL"
              ? `${LEVEL_STYLES.ALL.gradient} text-white ${LEVEL_STYLES.ALL.glow}`
              : "bg-white/5 hover:bg-white/10 text-muted-foreground",
          )}
        >
          All Levels
        </button>
        {levels?.map((l) => {
          const styles = LEVEL_STYLES[l.level] ?? LEVEL_STYLES.ALL;
          const active = selectedLevel === l.level;
          return (
            <button
              key={l.level}
              onClick={() => setSelectedLevel(l.level)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2",
                active
                  ? `${styles.gradient} text-white ${styles.glow}`
                  : `bg-white/5 hover:bg-white/10 ${styles.text}`,
              )}
            >
              {l.level}
              <Badge
                variant="secondary"
                className="px-1.5 py-0 text-[10px] bg-black/20 text-white/80"
              >
                {l.count}
              </Badge>
            </button>
          );
        })}
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col items-center justify-center">
        {isWordsLoading ? (
          <div className="w-full max-w-2xl aspect-[4/3] sm:aspect-[16/9] rounded-2xl glass-card animate-pulse flex items-center justify-center">
            <div className="text-muted-foreground">Loading vocabulary...</div>
          </div>
        ) : displayWords.length === 0 ? (
          <div className="w-full max-w-2xl aspect-[4/3] sm:aspect-[16/9] rounded-2xl glass-card flex items-center justify-center">
            <div className="text-muted-foreground text-center px-6">
              {viewMode === "known"
                ? "You haven't marked any words as known yet. Tap \"I know it\" under a card to save it here."
                : viewMode === "learning"
                  ? "No saved words yet. Tap \"A new word\" under a card to add it to your study list."
                  : "No words found for this level."}
            </div>
          </div>
        ) : currentWord ? (
          <div
            className={cn(
              "w-full max-w-2xl rounded-2xl transition-shadow",
              flash === "known" && "flash-success",
              flash === "learning" && "flash-warn",
            )}
          >
            <Flashcard
              key={currentWord.id}
              id={currentWord.id}
              word={currentWord.english}
              pos={currentWord.pos}
              level={currentWord.level}
              isFlipped={isFlipped}
              onFlip={handleFlip}
              nextCardId={nextWord?.id}
            />
          </div>
        ) : null}

        {currentWord ? (
          <>
            <div className="w-full max-w-2xl mt-5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground/70 mb-1.5 px-1">
                <span>Progress</span>
                <span className="font-medium">
                  {currentIndex + 1} / {displayWords.length}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-blue-500 shadow-[0_0_12px_rgba(139,92,246,0.6)]"
                  initial={false}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 24 }}
                />
              </div>
            </div>

            <div className="w-full max-w-2xl mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => handleMarkWithFlash("known")}
                className={cn(
                  "group relative rounded-xl h-12 px-4 text-sm font-medium overflow-hidden",
                  "border border-emerald-400/25 bg-emerald-500/[0.06] text-emerald-200",
                  "transition-all duration-300",
                  "hover:-translate-y-0.5 hover:bg-emerald-500/15 hover:border-emerald-400/50",
                  "hover:shadow-[0_8px_30px_-6px_rgba(16,185,129,0.45)]",
                  "active:translate-y-0",
                  currentStatus === "known" &&
                    "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-[0_8px_30px_-6px_rgba(16,185,129,0.55)]",
                )}
              >
                <span className="relative z-10 inline-flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                  I know it
                </span>
                <span className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(120%_60%_at_50%_120%,rgba(16,185,129,0.35),transparent_70%)]" />
              </button>

              <button
                onClick={() => handleMarkWithFlash("learning")}
                className={cn(
                  "group relative rounded-xl h-12 px-4 text-sm font-medium overflow-hidden",
                  "border border-amber-400/25 bg-amber-500/[0.06] text-amber-200",
                  "transition-all duration-300",
                  "hover:-translate-y-0.5 hover:bg-amber-500/15 hover:border-amber-400/50",
                  "hover:shadow-[0_8px_30px_-6px_rgba(245,158,11,0.45)]",
                  "active:translate-y-0",
                  currentStatus === "learning" &&
                    "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-[0_8px_30px_-6px_rgba(245,158,11,0.55)]",
                )}
              >
                <span className="relative z-10 inline-flex items-center justify-center gap-2">
                  <Bookmark className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                  A new word
                </span>
                <span className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(120%_60%_at_50%_120%,rgba(245,158,11,0.35),transparent_70%)]" />
              </button>
            </div>
          </>
        ) : null}
      </div>

      <div className="w-full max-w-2xl mt-10 flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setIsShuffled(prev => !prev)}
          className={cn("rounded-full hover:bg-white/10", isShuffled && "text-primary")}
        >
          <Shuffle className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-4 sm:gap-8">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handlePrev} 
            disabled={currentIndex === 0 || displayWords.length === 0}
            className="rounded-full w-12 h-12 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          
          <span className="text-sm font-medium text-muted-foreground w-20 text-center tracking-widest">
            {displayWords.length > 0 ? `${currentIndex + 1} / ${displayWords.length}` : "0 / 0"}
          </span>

          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleNext}
            disabled={currentIndex >= displayWords.length - 1 || displayWords.length === 0}
            className="rounded-full w-12 h-12 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>

        <div className="w-10"></div> {/* Spacer to balance the shuffle button */}
      </div>
      </div>
    </div>
  );
}
