import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import SymbolBox from "@/components/games/SymbolBox";
import GameDialog from "@/components/games/GameDialog";
import { usePigRun } from "@/hooks/use-pig-run.ts";


const SYMBOLS = ["α", "β", "γ", "δ", "ε", "ζ", "η", "θ", "ι", "σ"];
const TIME_LIMIT = 60;
const SYMBOL_COUNT = 9;

export default function SymbolDigitGame() {
  usePigRun("symbol-digit");
  const navigate = useNavigate();
  const [shuffledSymbols, setShuffledSymbols] = useState<string[]>([]);
  const [currentSymbol, setCurrentSymbol] = useState("");
  const [currentNumber, setCurrentNumber] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [flag, setFlag] = useState<0 | 1 | 2>(2); // 2=neutral, 1=correct, 0=wrong
  const [startGame, setStartGame] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(true);
  const [gameEnded, setGameEnded] = useState(false);
  const [lastRandom, setLastRandom] = useState(-1);
  const [totalAttempts, setTotalAttempts] = useState(0);

  const getRandomIndex = useCallback(
    (exclude: number) => {
      let idx: number;
      do {
        idx = Math.floor(Math.random() * SYMBOL_COUNT);
      } while (idx === exclude);
      return idx;
    },
    []
  );

  const generatePair = useCallback(
    (symbols: string[], exclude: number) => {
      const idx = getRandomIndex(exclude);
      setLastRandom(idx);
      setCurrentSymbol(symbols[idx]);
      setCurrentNumber(idx + 1);
    },
    [getRandomIndex]
  );

  // Initialize
  useEffect(() => {
    const copy = [...SYMBOLS];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    const symbols = copy.slice(0, SYMBOL_COUNT);
    setShuffledSymbols(symbols);
    generatePair(symbols, -1);
  }, [generatePair]);

  // Timer
  useEffect(() => {
    if (!startGame || timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [startGame, timeLeft]);

  // Game end
  useEffect(() => {
    if (timeLeft === 0 && startGame && !gameEnded) {
      setGameEnded(true);
    }
  }, [timeLeft, startGame, gameEnded]);

  const handleClick = (value: number) => {
    if (flag !== 2) return;
    setTotalAttempts((a) => a + 1);
    if (value === currentNumber) {
      setScore((s) => s + 1);
      setFlag(1);
      setTimeout(() => {
        generatePair(shuffledSymbols, lastRandom);
        setFlag(2);
      }, 1000);
    } else {
      setFlag(0);
      setTimeout(() => setFlag(2), 1000);
    }
  };

  const handleDialogStart = () => {
    setDialogOpen(false);
    setStartGame(true);
  };

  if (shuffledSymbols.length === 0) return null;

  return (
    <div className="min-h-screen bg-game-blue flex flex-col relative">
      {/* Header */}
      <div className="bg-card/90 backdrop-blur-sm shadow-sm px-4 py-3 flex items-center gap-3 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="text-foreground hover:bg-secondary"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-display font-semibold text-foreground">
          Symbol-Digit Substitution
        </h1>
      </div>

      {/* Game Content */}
      {!dialogOpen && (
        <div className="flex-1 flex flex-col items-center pt-4 px-4 pb-8">
          {!gameEnded ? (
            <>
              {/* Timer */}
              <div className="text-primary-foreground text-center mb-3">
                <p className="text-sm opacity-80 leading-relaxed max-w-md mx-auto">
                  Map the symbol you see using the legend, then select the matching number!
                </p>
                <p className="text-lg font-display font-semibold mt-2">
                  Time left: {timeLeft}s
                </p>
              </div>

              {/* Legend */}
              <div className="mb-4">
                <SymbolBox data={shuffledSymbols} />
              </div>

              {/* Feedback */}
              <div className="h-10 flex items-center justify-center mb-2">
                {flag === 1 && (
                  <span className="bg-success text-success-foreground px-4 py-1.5 rounded-full text-sm font-semibold animate-in fade-in">
                    Right! ✓
                  </span>
                )}
                {flag === 0 && (
                  <span className="bg-destructive text-destructive-foreground px-4 py-1.5 rounded-full text-sm font-semibold animate-in fade-in">
                    Wrong ✗
                  </span>
                )}
              </div>

              {/* Current Symbol */}
              <div className="mb-6">
                <SymbolBox currentSymbol={currentSymbol} />
              </div>

              {/* Number Buttons */}
              <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                {shuffledSymbols.map((_, index) => (
                  <button
                    key={index}
                    disabled={flag !== 2}
                    onClick={() => handleClick(index + 1)}
                    className="w-14 h-14 md:w-16 md:h-16 border-2 border-primary-foreground rounded-xl text-primary-foreground text-lg font-bold
                      transition-all duration-150 hover:bg-primary-foreground/10 active:scale-95
                      disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* Game Over */
            <div className="flex-1 flex flex-col items-center justify-center text-primary-foreground text-center">
              <h2 className="text-2xl font-display font-bold mb-4">Time's Up!</h2>
              <p className="text-xl mb-2">
                You mapped <span className="font-bold text-accent">{score}</span> symbols correctly
              </p>
              <p className="text-sm opacity-70 mb-8">
                out of {totalAttempts} total attempts
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-primary-foreground text-game-blue hover:bg-primary-foreground/90 font-semibold"
                >
                  Play Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Back to Games
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <GameDialog
        open={dialogOpen}
        onStart={handleDialogStart}
        showMapping="during"
      />
    </div>
  );
}
