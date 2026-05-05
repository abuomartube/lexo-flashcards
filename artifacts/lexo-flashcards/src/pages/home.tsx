import React, { useState, useEffect, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { Search, GraduationCap, Brain } from "lucide-react";
import { useListLevels, useListWords } from "@workspace/api-client-react";
import { Flashcard } from "@/components/Flashcard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Shuffle, Check, BookOpen, Bookmark, Layers, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudyStatus, type StudyStatus } from "@/lib/studyStatus";
import { useStudyStats, type Achievement } from "@/lib/studyStats";
import { sounds, isMuted, setMuted } from "@/lib/sounds";
import { StatsHeader } from "@/components/StatsHeader";
import { AchievementToast } from "@/components/AchievementToast";
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
  C1: {
    gradient: "bg-gradient-to-r from-violet-600 to-amber-500",
    glow: "shadow-[0_0_22px_rgba(168,85,247,0.45)]",
    ring: "ring-violet-400/50",
    text: "text-violet-200",
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
  const [studyMode, setStudyMode] = useState<"learning" | "challenge">("learning");
  const [muted, setMutedState] = useState<boolean>(() => isMuted());
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);

  const { statusMap, setStatus, getStatus, countByStatus } = useStudyStatus();
  const { stats, recordMark, getDifficulty } = useStudyStats();

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

  // Direction the next/prev navigation is heading (1 = forward, -1 = backward).
  // Drives card enter/exit animations so a swipe-right card flies right
  // and the next card glides in from the left.
  const [direction, setDirection] = useState<1 | -1>(1);

  // Brief shake feedback when a nav button is tapped at a boundary
  // (closest analogue to "locked levels shake slightly when tapped").
  const [navShake, setNavShake] = useState<"prev" | "next" | null>(null);
  useEffect(() => {
    if (!navShake) return;
    const t = setTimeout(() => setNavShake(null), 450);
    return () => clearTimeout(t);
  }, [navShake]);

  const handleNext = useCallback(() => {
    if (displayWords && currentIndex < displayWords.length - 1) {
      setDirection(1);
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setNavShake("next");
    }
  }, [currentIndex, displayWords]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    } else {
      setNavShake("prev");
    }
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    sounds.flip();
    setIsFlipped(prev => !prev);
  }, []);

  const handleToggleMute = useCallback(() => {
    setMutedState((prev) => {
      const next = !prev;
      setMuted(next);
      return next;
    });
  }, []);

  const handleRevealWord = useCallback(() => {
    setStudyMode("learning");
  }, []);

  const handleChallengeMe = useCallback(() => {
    setStudyMode("challenge");
  }, []);

  // Force card front whenever the study mode changes (Challenge must start hidden)
  useEffect(() => {
    setIsFlipped(false);
  }, [studyMode]);

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
      // Compute knownTotal AFTER this mark (statusMap not yet updated)
      const wasKnown = statusMap[currentWord.id] === "known";
      const isKnown = status === "known";
      const knownTotalAfter = countByStatus("known") + (isKnown && !wasKnown ? 1 : !isKnown && wasKnown ? -1 : 0);
      const granted = recordMark(currentWord.id, status, knownTotalAfter);
      if (status === "known") sounds.success();
      else sounds.warn();
      if (granted.length) {
        sounds.reward();
        setAchievementQueue((q) => [...q, ...granted]);
        granted.forEach((a) => {
          setTimeout(
            () => setAchievementQueue((q) => q.filter((x) => x !== a)),
            3500,
          );
        });
      }
      // Advance to next card after marking
      if (currentIndex < displayWords.length - 1) {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex((p) => p + 1), 150);
      } else {
        setIsFlipped(false);
      }
    },
    [currentWord, currentIndex, displayWords.length, setStatus, statusMap, countByStatus, recordMark],
  );

  const currentStatus = currentWord ? getStatus(currentWord.id) : undefined;
  const [flash, setFlash] = useState<null | "known" | "learning">(null);
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 700);
    return () => clearTimeout(t);
  }, [flash]);

  // Floating "+XP" pops over the I-know-it button + small "Added to review"
  // toast over the new-word button. Each gets a unique key so multiple in
  // quick succession all animate independently.
  const [xpPops, setXpPops] = useState<{ id: number; amount: number }[]>([]);
  const [reviewToasts, setReviewToasts] = useState<{ id: number }[]>([]);
  const handleMarkWithFlash = useCallback(
    (status: StudyStatus) => {
      const popId = Date.now() + Math.random();
      setFlash(status);
      if (status === "known") {
        setXpPops((q) => [...q, { id: popId, amount: 10 }]);
        setTimeout(
          () => setXpPops((q) => q.filter((p) => p.id !== popId)),
          1200,
        );
      } else {
        setReviewToasts((q) => [...q, { id: popId }]);
        setTimeout(
          () => setReviewToasts((q) => q.filter((p) => p.id !== popId)),
          1600,
        );
      }
      handleMark(status);
    },
    [handleMark],
  );

  const [themeQuery, setThemeQuery] = useState("");
  const filteredThemes = React.useMemo(() => {
    const q = themeQuery.trim().toLowerCase();
    if (!q) return THEMES;
    return THEMES.filter((t) => t.label.toLowerCase().includes(q));
  }, [themeQuery]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!themesOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setThemesOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [themesOpen]);

  const progressPct =
    displayWords.length > 0
      ? ((currentIndex + 1) / displayWords.length) * 100
      : 0;

  // ---- Premium swipe state ----
  // dragX is updated on every drag tick so the direction glow overlays
  // (green right / amber left) can fade in proportionally with the drag.
  const prefersReducedMotion = useReducedMotion();
  const dragX = useMotionValue(0);
  const cardRotate = useTransform(dragX, [-260, 0, 260], [-10, 0, 10]);
  const rightGlowOpacity = useTransform(dragX, [0, 60, 200], [0, 0.25, 0.7]);
  const leftGlowOpacity = useTransform(dragX, [-200, -60, 0], [0.7, 0.25, 0]);
  // Reset the drag value whenever the active card changes, otherwise the
  // freshly-mounted card would inherit the previous drag offset visually.
  useEffect(() => {
    dragX.set(0);
  }, [currentIndex, dragX]);

  // When the user prefers reduced motion, collapse the swipe / counter / toast
  // animations to opacity-only crossfades. Framer Motion's JS-driven springs
  // are not silenced by the CSS `prefers-reduced-motion` media query, so we
  // have to branch explicitly here.
  const cardVariants = prefersReducedMotion
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1, transition: { duration: 0.01 } as const },
        exit: { opacity: 0, transition: { duration: 0.01 } as const },
      }
    : {
        enter: (dir: 1 | -1) => ({
          x: dir > 0 ? -340 : 340,
          opacity: 0,
          scale: 0.94,
          rotate: dir > 0 ? -6 : 6,
        }),
        center: {
          x: 0,
          opacity: 1,
          scale: 1,
          rotate: 0,
          transition: { type: "spring", stiffness: 240, damping: 26 } as const,
        },
        exit: (dir: 1 | -1) => ({
          x: dir > 0 ? 340 : -340,
          opacity: 0,
          scale: 0.94,
          rotate: dir > 0 ? 8 : -8,
          transition: { duration: 0.24, ease: "easeOut" } as const,
        }),
      };

  // Animate the visible "x / N" counter when the index changes.
  const counterText = `${currentIndex + 1} / ${displayWords.length}`;

  return (
    <div className="app-bg min-h-[100dvh] w-full">
      <div className="particles" aria-hidden />
      <div className="relative min-h-[100dvh] flex flex-col items-center pb-12 pt-6 px-4 max-w-5xl mx-auto w-full">
      <header className="w-full flex items-center justify-between mb-6 sm:mb-10">
        <div className="flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="LEXO Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-md" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            LEXO <span className="text-gradient">Flashcards</span>
          </h1>
        </div>
        <StatsHeader stats={stats} muted={muted} onToggleMute={handleToggleMute} />
      </header>

      {/* Study mode toggle */}
      <div className="flex items-center gap-1 mb-4 p-1 rounded-full bg-white/[0.04] border border-white/10">
        <button
          type="button"
          onClick={() => {
            sounds.click();
            setStudyMode("learning");
          }}
          className={cn(
            "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all",
            studyMode === "learning"
              ? "bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-[0_0_18px_-4px_rgba(124,58,237,0.6)]"
              : "text-muted-foreground hover:text-white",
          )}
          aria-pressed={studyMode === "learning"}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          Learning
        </button>
        <button
          type="button"
          onClick={() => {
            sounds.click();
            setStudyMode("challenge");
          }}
          className={cn(
            "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all",
            studyMode === "challenge"
              ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-[0_0_18px_-4px_rgba(217,70,239,0.6)]"
              : "text-muted-foreground hover:text-white",
          )}
          aria-pressed={studyMode === "challenge"}
        >
          <Brain className="w-3.5 h-3.5" />
          Challenge
        </button>
      </div>

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
        <button
          onClick={() => setThemesOpen(true)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2",
            activeTheme
              ? `${activeTheme.color.gradient} text-white ${activeTheme.color.glow}`
              : "bg-white/5 hover:bg-white/10 text-muted-foreground",
          )}
        >
          {activeTheme ? (
            <>
              <span className="text-base leading-none">{activeTheme.emoji}</span>
              {activeTheme.label}
            </>
          ) : (
            <>
              <Layers className="w-4 h-4" />
              Word families
            </>
          )}
        </button>
        {activeTheme ? (
          <button
            onClick={() => setSelectedTheme(null)}
            className="px-3 py-2 rounded-full text-xs font-medium bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all flex items-center gap-1.5"
            aria-label="Clear family filter"
          >
            <X className="w-3.5 h-3.5" />
            All Words
          </button>
        ) : null}

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
        {activeTheme && viewMode === "browse" ? (
          <div className="w-full max-w-2xl mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Family
              </span>
              <span className={cn("inline-flex items-center gap-1.5 font-medium", activeTheme.color.text)}>
                <span className="text-base leading-none">{activeTheme.emoji}</span>
                {activeTheme.label}
              </span>
              <span className="text-xs text-muted-foreground">
                · {displayWords.length} {displayWords.length === 1 ? "word" : "words"}
              </span>
            </div>
            <button
              onClick={() => setSelectedTheme(null)}
              className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        ) : null}
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
              "relative w-full max-w-2xl rounded-2xl",
              flash === "known" && "flash-success",
              flash === "learning" && "flash-warn",
            )}
          >
            {/* Direction-aware swipe glow overlays — fade in proportionally with drag. */}
            <motion.div
              aria-hidden
              style={{ opacity: rightGlowOpacity }}
              className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-emerald-400/60 shadow-[0_0_60px_0_rgba(16,185,129,0.55)]"
            />
            <motion.div
              aria-hidden
              style={{ opacity: leftGlowOpacity }}
              className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-amber-400/60 shadow-[0_0_60px_0_rgba(245,158,11,0.55)]"
            />

            <AnimatePresence mode="popLayout" custom={direction} initial={false}>
              <motion.div
                key={currentWord.id}
                custom={direction}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                drag={prefersReducedMotion ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.35}
                dragMomentum={false}
                onDrag={(_, info) => dragX.set(info.offset.x)}
                onDragEnd={(_, info) => {
                  const SWIPE_THRESHOLD = 80;
                  const SWIPE_VELOCITY = 400;
                  const dx = info.offset.x;
                  const vx = info.velocity.x;
                  // Always clear the drag value so the direction-glow overlays
                  // and the rotate transform don't stay stuck if the swipe is
                  // blocked at a boundary (handleNext/handlePrev no-op there).
                  dragX.set(0);
                  if (dx > SWIPE_THRESHOLD || vx > SWIPE_VELOCITY) {
                    handleNext();
                  } else if (dx < -SWIPE_THRESHOLD || vx < -SWIPE_VELOCITY) {
                    handlePrev();
                  }
                }}
                whileDrag={{ scale: 0.98 }}
                style={{ rotate: cardRotate }}
                className="touch-pan-y select-none will-change-transform"
              >
                <Flashcard
                  id={currentWord.id}
                  word={currentWord.english}
                  pos={currentWord.pos}
                  level={currentWord.level}
                  isFlipped={isFlipped}
                  onFlip={handleFlip}
                  nextCardId={nextWord?.id}
                  mode={studyMode}
                  onReveal={handleRevealWord}
                  onChallenge={handleChallengeMe}
                  difficulty={getDifficulty(currentWord.id)}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        ) : null}

        {currentWord ? (
          <>
            <div className="w-full max-w-2xl mt-5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground/70 mb-1.5 px-1">
                <span>Progress</span>
                <span className="font-medium tabular-nums">
                  {Math.round(progressPct)}% · {currentIndex + 1} / {displayWords.length}
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
              <div className="relative">
                {/* Floating "+XP" pops anchored to the I-know-it button cell. */}
                <div className="pointer-events-none absolute left-1/2 top-0 z-20">
                  <AnimatePresence>
                    {xpPops.map((p) => (
                      <span
                        key={p.id}
                        className="xp-pop absolute left-1/2 top-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 shadow-[0_0_18px_-4px_rgba(16,185,129,0.7)]"
                      >
                        +{p.amount} XP
                      </span>
                    ))}
                  </AnimatePresence>
                </div>
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
              </div>

              <div className="relative">
                {/* Inline "Added to review" toast anchored to the new-word button cell. */}
                <div className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2">
                  <AnimatePresence>
                    {reviewToasts.map((t) => (
                      <motion.span
                        key={t.id}
                        initial={
                          prefersReducedMotion
                            ? { opacity: 0 }
                            : { opacity: 0, y: 6, scale: 0.92 }
                        }
                        animate={
                          prefersReducedMotion
                            ? { opacity: 1 }
                            : { opacity: 1, y: -22, scale: 1 }
                        }
                        exit={
                          prefersReducedMotion
                            ? { opacity: 0 }
                            : { opacity: 0, y: -38, scale: 0.95 }
                        }
                        transition={{ duration: prefersReducedMotion ? 0.01 : 0.32, ease: "easeOut" }}
                        className="absolute left-1/2 -translate-x-1/2 top-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-100 border border-amber-400/40 shadow-[0_0_18px_-4px_rgba(245,158,11,0.7)] whitespace-nowrap"
                      >
                        <Bookmark className="w-3 h-3" />
                        Added to review
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
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
          {(() => {
            const prevDisabled = currentIndex === 0 || displayWords.length === 0;
            return (
              <div className={cn(navShake === "prev" && "shake-x")}>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrev}
                  aria-disabled={prevDisabled}
                  aria-label="Previous card"
                  className={cn(
                    "rounded-full w-12 h-12 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white hover:-translate-y-0.5 active:translate-y-0 transition-transform",
                    prevDisabled && "opacity-50 hover:translate-y-0 hover:bg-white/5",
                  )}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
              </div>
            );
          })()}

          <div className="text-sm font-medium text-muted-foreground w-20 text-center tracking-widest tabular-nums overflow-hidden h-5 relative">
            <AnimatePresence mode="popLayout" custom={direction} initial={false}>
              <motion.span
                key={counterText}
                custom={direction}
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { y: direction > 0 ? 14 : -14, opacity: 0 }
                }
                animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
                exit={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { y: direction > 0 ? -14 : 14, opacity: 0 }
                }
                transition={{ duration: prefersReducedMotion ? 0.01 : 0.22, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {displayWords.length > 0 ? counterText : "0 / 0"}
              </motion.span>
            </AnimatePresence>
          </div>

          {(() => {
            const nextDisabled =
              currentIndex >= displayWords.length - 1 || displayWords.length === 0;
            return (
              <div className={cn(navShake === "next" && "shake-x")}>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNext}
                  aria-disabled={nextDisabled}
                  aria-label="Next card"
                  className={cn(
                    "rounded-full w-12 h-12 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white hover:-translate-y-0.5 active:translate-y-0 transition-transform",
                    nextDisabled && "opacity-50 hover:translate-y-0 hover:bg-white/5",
                  )}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
            );
          })()}
        </div>

        <div className="w-10"></div> {/* Spacer to balance the shuffle button */}
      </div>
      </div>

      <AnimatePresence>
        {themesOpen ? (
          <motion.div
            key="themes-modal"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <motion.button
              type="button"
              aria-label="Close"
              onClick={() => setThemesOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Modal panel */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Word families"
              className={cn(
                "relative w-full sm:w-[min(94vw,42rem)]",
                "max-h-[60vh] sm:max-h-[60vh]",
                "rounded-t-3xl sm:rounded-2xl",
                "glass-card-premium overflow-hidden",
                "shadow-[0_20px_80px_-10px_rgba(0,0,0,0.7),0_0_60px_-10px_rgba(139,92,246,0.35)]",
                "flex flex-col",
              )}
              initial={{
                y: window.innerWidth < 640 ? "100%" : 24,
                opacity: 0,
                scale: window.innerWidth < 640 ? 1 : 0.96,
              }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{
                y: window.innerWidth < 640 ? "100%" : 24,
                opacity: 0,
                scale: window.innerWidth < 640 ? 1 : 0.96,
              }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
            >
              {/* Mobile drag handle */}
              <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
                <div className="h-1 w-10 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between gap-3 px-5 pt-3 sm:pt-5 pb-3">
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-violet-300" />
                  <h2 className="text-sm font-semibold tracking-wide">Word families</h2>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {filteredThemes.length} / {THEMES.length}
                  </span>
                </div>
                <button
                  onClick={() => setThemesOpen(false)}
                  className="rounded-full p-1.5 hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search */}
              <div className="px-5 pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="search"
                    autoFocus
                    value={themeQuery}
                    onChange={(e) => setThemeQuery(e.target.value)}
                    placeholder="Search family"
                    className={cn(
                      "w-full h-10 pl-9 pr-3 text-sm rounded-xl",
                      "bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400/40",
                      "transition-all",
                    )}
                  />
                </div>
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-y-auto px-5 pb-5">
                {filteredThemes.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-10">
                    No families match "{themeQuery}"
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {filteredThemes.map((t) => {
                      const active = selectedTheme === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            setSelectedTheme(active ? null : t.id);
                            setSelectedLevel("ALL");
                            setThemesOpen(false);
                            setThemeQuery("");
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5",
                            "border",
                            active
                              ? `${t.color.gradient} text-white ${t.color.glow} border-transparent scale-[1.02]`
                              : `bg-white/[0.04] hover:bg-white/10 hover:-translate-y-0.5 ${t.color.text} border-white/10 hover:border-white/20`,
                          )}
                        >
                          <span className="text-sm leading-none">{t.emoji}</span>
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {activeTheme ? (
                <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between bg-black/20">
                  <span className="text-xs text-muted-foreground">
                    Active: <span className={cn("font-medium", activeTheme.color.text)}>{activeTheme.emoji} {activeTheme.label}</span>
                  </span>
                  <button
                    onClick={() => {
                      setSelectedTheme(null);
                      setThemesOpen(false);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    Clear family
                  </button>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AchievementToast achievements={achievementQueue} />
    </div>
  );
}
