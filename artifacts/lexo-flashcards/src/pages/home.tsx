import React, { useState, useEffect, useCallback } from "react";
import { useListLevels, useListWords } from "@workspace/api-client-react";
import { Flashcard } from "@/components/Flashcard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);

  const { data: levels } = useListLevels();
  const { data: words, isLoading: isWordsLoading } = useListWords({ 
    level: selectedLevel === "ALL" ? undefined : selectedLevel as any 
  });

  const displayWords = React.useMemo(() => {
    if (!words) return [];
    if (isShuffled) {
      return [...words].sort(() => Math.random() - 0.5);
    }
    return words;
  }, [words, isShuffled]);

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
  }, [selectedLevel, isShuffled]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center pb-12 pt-6 px-4 max-w-5xl mx-auto w-full">
      <header className="w-full flex items-center justify-between mb-8 sm:mb-12">
        <div className="flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="LEXO Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-md" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            LEXO <span className="text-gradient">Flashcards</span>
          </h1>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 justify-center mb-10 w-full">
        <button
          onClick={() => setSelectedLevel("ALL")}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
            selectedLevel === "ALL" 
              ? "bg-gradient-brand text-white shadow-[0_0_20px_rgba(124,58,237,0.3)]" 
              : "bg-white/5 hover:bg-white/10 text-muted-foreground"
          )}
        >
          All Levels
        </button>
        {levels?.map(l => (
          <button
            key={l.level}
            onClick={() => setSelectedLevel(l.level)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2",
              selectedLevel === l.level 
                ? "bg-gradient-brand text-white shadow-[0_0_20px_rgba(124,58,237,0.3)]" 
                : "bg-white/5 hover:bg-white/10 text-muted-foreground"
            )}
          >
            {l.level}
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-black/20 text-white/80">{l.count}</Badge>
          </button>
        ))}
      </div>

      <div className="flex-1 w-full flex flex-col items-center justify-center">
        {isWordsLoading ? (
          <div className="w-full max-w-2xl aspect-[4/3] sm:aspect-[16/9] rounded-2xl glass-card animate-pulse flex items-center justify-center">
            <div className="text-muted-foreground">Loading vocabulary...</div>
          </div>
        ) : displayWords.length === 0 ? (
          <div className="w-full max-w-2xl aspect-[4/3] sm:aspect-[16/9] rounded-2xl glass-card flex items-center justify-center">
            <div className="text-muted-foreground">No words found for this level.</div>
          </div>
        ) : currentWord ? (
          <Flashcard 
            key={currentWord.id}
            id={currentWord.id}
            word={currentWord.english}
            pos={currentWord.pos}
            isFlipped={isFlipped}
            onFlip={handleFlip}
            nextCardId={nextWord?.id}
          />
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
  );
}
