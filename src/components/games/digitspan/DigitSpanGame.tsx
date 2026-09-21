import { useEffect, useRef, useState, useCallback } from "react";
import { restartPage } from "@/lib/refresh";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { one, two, three, four, five, six, seven, eight, nine } from "./audioVars";

const numberAudio = [one, two, three, four, five, six, seven, eight, nine];
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const rows: number[][] = [];
for (let i = 0; i < numbers.length; i += 3) {
  rows.push(numbers.slice(i, i + 3));
}

function getRandomNumbers(count: number, min: number, max: number): number[] {
  const arr: number[] = [];
  const pick = (mx: number, mn: number, existing: number[]): number => {
    const n = Math.floor(Math.random() * (mx - mn + 1)) + mn;
    return existing.includes(n) || n === 0 ? pick(mx, mn, existing) : n;
  };
  for (let i = 0; i < count; i++) {
    arr.push(pick(max, min, arr));
  }
  return arr;
}

export default function DigitSpanGame() {
  const navigate = useNavigate();
  const [popup, setPopup] = useState(true);
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<0 | 1>(0); // 0=forward, 1=backward
  const [level, setLevel] = useState(0);
  const [sequenceCount, setSequenceCount] = useState(3);
  const [questionSequence, setQuestionSequence] = useState<number[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [canInput, setCanInput] = useState(false);
  const [showingNumber, setShowingNumber] = useState<number | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [totalSequences, setTotalSequences] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showReverseOverlay, setShowReverseOverlay] = useState(false);

  const errorRef = useRef(0);
  const sequenceCountRef = useRef(3);

  // References to active audio and timers for cleanup
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const sequenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const roundTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Master cleanup function to stop all audio and active timers
  const stopAllGameActivity = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if (sequenceIntervalRef.current) {
      clearInterval(sequenceIntervalRef.current);
      sequenceIntervalRef.current = null;
    }
    if (roundTimeoutRef.current) {
      clearTimeout(roundTimeoutRef.current);
      roundTimeoutRef.current = null;
    }
  }, []);

  // Ensure cleanup happens automatically when leaving the route
  useEffect(() => {
    return () => {
      stopAllGameActivity();
    };
  }, [stopAllGameActivity]);

  const handleNavigateHome = () => {
    stopAllGameActivity();
    navigate("/");
  };

  // Play sequence with audio reference tracking
  const playSequence = useCallback((seq: number[]) => {
    setCanInput(false);
    setShowingNumber(null);
    let i = 0;
    
    if (sequenceIntervalRef.current) {
      clearInterval(sequenceIntervalRef.current);
    }

    sequenceIntervalRef.current = setInterval(() => {
      if (i < seq.length) {
        const num = seq[i];

        // Stop preceding audio if still playing
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
          currentAudioRef.current.currentTime = 0;
        }

        const audio = new Audio(numberAudio[num - 1]);
        currentAudioRef.current = audio;
        audio.play().catch(() => {});

        setShowingNumber(num);
        i++;
      } else {
        if (sequenceIntervalRef.current) clearInterval(sequenceIntervalRef.current);
        setShowingNumber(null);
        setCanInput(true);
      }
    }, 1000);
  }, []);

  // Setup a new round
  const setupRound = useCallback((count: number, lvl: number) => {
    const seq = getRandomNumbers(count, 1, 9);
    setQuestionSequence(seq);
    setAnswers([]);
    setLevel(lvl);
    setTotalSequences((t) => t + 1);

    if (roundTimeoutRef.current) clearTimeout(roundTimeoutRef.current);
    roundTimeoutRef.current = setTimeout(() => playSequence(seq), 500);
  }, [playSequence]);

  // Start game
  const handleStart = () => {
    setPopup(false);
    setStarted(true);
    errorRef.current = 0;
    sequenceCountRef.current = 3;
    setSequenceCount(3);
    setErrorCount(0);
    setupRound(3, 1);
  };

  // Handle number tap
  const handleTap = (num: number) => {
    if (!canInput) return;
    const newAnswers = [...answers, num];
    setAnswers(newAnswers);

    if (newAnswers.length === questionSequence.length) {
      setCanInput(false);
      const expected = mode === 0 ? questionSequence : [...questionSequence].reverse();
      const isCorrect = JSON.stringify(newAnswers) === JSON.stringify(expected);

      setTimeout(() => {
        if (isCorrect) {
          setFeedback("correct");
          setSuccessCount((s) => s + 1);
          const newCount = sequenceCountRef.current + 1;
          sequenceCountRef.current = newCount;
          setSequenceCount(newCount);

          setTimeout(() => {
            setFeedback(null);
            if (newCount >= 10) {
              if (mode === 0) {
                switchToBackward();
              } else {
                setGameEnded(true);
              }
            } else {
              setupRound(newCount, level + 1);
            }
          }, 1200);
        } else {
          setFeedback("wrong");
          errorRef.current += 1;
          setErrorCount(errorRef.current);

          setTimeout(() => {
            setFeedback(null);
            if (errorRef.current > 1) {
              if (mode === 0) {
                switchToBackward();
              } else {
                setGameEnded(true);
              }
            } else {
              setupRound(sequenceCountRef.current, level + 1);
            }
          }, 1200);
        }
      }, 400);
    }
  };

  const switchToBackward = () => {
    setMode(1);
    errorRef.current = 0;
    sequenceCountRef.current = 2;
    setSequenceCount(2);
    setErrorCount(0);
    setShowReverseOverlay(true);
    setTimeout(() => {
      setShowReverseOverlay(false);
      setupRound(2, level + 1);
    }, 3000);
  };

  const deleteLast = () => {
    setAnswers((prev) => prev.slice(0, -1));
  };

  if (gameEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-game-blue to-blue-700 flex flex-col items-center justify-center text-primary-foreground p-6">
        <h2 className="text-3xl font-display font-bold mb-6">Thank you for playing!</h2>
        <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-2xl p-8 text-center">
          <p className="text-lg mb-2">Your Score</p>
          <p className="text-3xl font-bold text-accent">
            {successCount} out of {totalSequences} sequences correct
          </p>
        </div>
        <div className="flex gap-3 mt-8">
          <Button
            onClick={() => restartPage()}
            className="bg-primary-foreground text-game-blue hover:bg-primary-foreground/90 font-semibold"
          >
            Play Again
          </Button>
          <Button
            variant="outline"
            onClick={handleNavigateHome}
            className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
          >
            Back to Games
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Intro dialog */}
      <Dialog open={popup} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="font-display">Digit Span</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Remember the sequence of digits presented to you. Repeat the sequence by pressing
            on the keypad. Pay attention — sequences get harder as you progress!
          </p>
          <DialogFooter>
            <Button onClick={handleStart} className="font-semibold">Start Game</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reverse overlay */}
      {showReverseOverlay && (
        <div className="fixed inset-0 z-50 bg-background/90 flex items-center justify-center">
          <h2 className="text-2xl font-display font-bold text-game-blue text-center px-8">
            Now enter digits in reverse order!
          </h2>
        </div>
      )}

      {started && !popup && (
        <>
          {/* Header */}
          <div className="bg-game-blue px-4 py-3 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNavigateHome}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-display font-semibold text-primary-foreground">
              Digit Span
            </h1>
          </div>

          <div className="flex-1 flex flex-col items-center pt-6 px-4">
            {/* Level & Mode */}
            <div className="bg-secondary rounded-lg px-6 py-3 mb-4 text-center">
              <p className="text-sm text-muted-foreground">Level {level}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {mode === 0 ? "Forward" : "Backward"} mode
              </p>
            </div>

            {/* Instruction + showing number */}
            <div className="text-center mb-6">
              <p className="text-foreground font-medium mb-3">
                Enter the digits in {mode === 1 ? "reverse " : ""}order:
              </p>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-success/10 text-success text-2xl font-bold">
                {showingNumber ?? (canInput ? "?" : "...")}
              </div>
            </div>

            {/* Feedback */}
            {feedback && (
              <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-3 rounded-full text-lg font-semibold animate-in fade-in z-50 ${
                feedback === "correct" 
                  ? "bg-success text-success-foreground" 
                  : "bg-destructive text-destructive-foreground"
              }`}>
                {feedback === "correct" ? "Correct! ✓" : "Wrong :("}
              </div>
            )}

            {/* Number grid */}
            <div className="border border-game-blue rounded-lg overflow-hidden mb-6">
              {rows.map((row, ri) => (
                <div key={ri} className="flex">
                  {row.map((num) => (
                    <button
                      key={num}
                      onClick={() => handleTap(num)}
                      disabled={!canInput}
                      className="w-20 h-20 md:w-24 md:h-24 border border-game-blue flex items-center justify-center
                        text-3xl font-bold text-game-blue transition-all
                        hover:bg-game-blue hover:text-primary-foreground active:scale-95
                        disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Current answer */}
            <div className="flex items-center gap-4">
              <p className="text-foreground">
                Current Answer:{" "}
                <span className="text-2xl font-bold font-display">{answers.join(" ")}</span>
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={deleteLast}
                disabled={answers.length === 0 || !canInput}
              >
                <Delete className="w-4 h-4 mr-1" /> Delete
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}