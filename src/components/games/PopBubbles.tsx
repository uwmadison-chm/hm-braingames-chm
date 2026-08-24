import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
type BubbleColor = "yellow" | "blue" | "pink" | "red" | "green";

interface BubbleData {
  id: number;
  color: BubbleColor;
  shouldPop: boolean; // true = a bubble the player SHOULD tap
  x: number;         // left % of screen
  y: number;         // bottom % of screen
  visible: boolean;
  popped: boolean;
}

const COLOR_HEX: Record<BubbleColor, string> = {
  yellow: "#FFD700",
  blue:   "#3B9EFE",
  pink:   "#FF69B4",
  red:    "#EF4444",
  green:  "#22C55E",
};

// Which colors the player should pop per level
const GO_COLORS: Record<number, BubbleColor[]> = {
  1: ["yellow", "blue", "pink"],
  2: ["yellow", "blue"],
  3: ["red", "blue", "yellow"],
};

// How many bubbles per level
const BUBBLE_COUNTS: Record<number, number> = { 1: 10, 2: 20, 3: 30 };

// How long each bubble stays visible (ms)
const BUBBLE_DURATION = 2500;

// Gap between bubbles appearing (ms)
const BUBBLE_INTERVAL = 1000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function buildBubbles(level: number): BubbleData[] {
  const goColors = GO_COLORS[level];
  const allColors: BubbleColor[] = ["yellow", "blue", "pink", "red", "green"];
  const count = BUBBLE_COUNTS[level];
  const bubbles: BubbleData[] = [];

  for (let i = 0; i < count; i++) {
    const shouldPop = Math.random() < 0.75;
    const pool = shouldPop
      ? goColors
      : allColors.filter((c) => !goColors.includes(c));
    const color = pool[Math.floor(Math.random() * pool.length)];

    bubbles.push({
      id: i,
      color,
      shouldPop,
      x: randomBetween(5, 85),
      y: randomBetween(10, 70),
      visible: false,
      popped: false,
    });
  }
  return bubbles;
}

// ---------------------------------------------------------------------------
// GameDialog
// ---------------------------------------------------------------------------

function GameDialog({
  show,
  message,
  onClose,
}: {
  show: boolean;
  message: string | React.ReactNode;
  onClose: () => void;
}) {
  if (!show) return null;
  return (
    <Dialog open={show} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-lg [button[data-radix-dialog-close]:hidden]"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-display">Pop the Bubbles</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">{message}</div>
        <DialogFooter>
          <Button onClick={onClose} className="font-semibold">
            Ok
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Single Bubble
// ---------------------------------------------------------------------------

function Bubble({
  data,
  onPop,
}: {
  data: BubbleData;
  onPop: (id: number) => void;
}) {
  const [scale, setScale] = useState(1);

  const handleClick = () => {
    setScale(1.5);
    setTimeout(() => onPop(data.id), 120);
  };

  if (!data.visible || data.popped) return null;

  return (
    <div
      onClick={handleClick}
      style={{
        position: "fixed",
        left: `${data.x}%`,
        bottom: `${data.y}%`,
        width: 64,
        height: 64,
        borderRadius: "50%",
        backgroundColor: COLOR_HEX[data.color],
        transform: `scale(${scale})`,
        transition: "transform 120ms ease",
        cursor: "pointer",
        boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Main game screen
// ---------------------------------------------------------------------------

type LevelPhase = "countdown" | "playing" | "done";

function LevelPlay({
  level,
  onLevelComplete,
}: {
  level: number;
  onLevelComplete: (correct: number, total: number) => void;
}) {
  const [bubbles, setBubbles] = useState<BubbleData[]>(() => buildBubbles(level));
  const [phase, setPhase] = useState<LevelPhase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [correctPops, setCorrectPops] = useState(0);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Countdown before game starts
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown === 0) {
      setPhase("playing");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Reveal bubbles one by one once playing
  useEffect(() => {
    if (phase !== "playing") return;

    bubbles.forEach((_, i) => {
      // Show
      const showT = setTimeout(() => {
        setBubbles((prev) =>
          prev.map((b) => (b.id === i ? { ...b, visible: true } : b))
        );
      }, i * BUBBLE_INTERVAL);

      // Auto-hide after duration
      const hideT = setTimeout(() => {
        setBubbles((prev) =>
          prev.map((b) =>
            b.id === i && !b.popped ? { ...b, visible: false } : b
          )
        );
      }, i * BUBBLE_INTERVAL + BUBBLE_DURATION);

      timerRefs.current.push(showT, hideT);
    });

    // End level after all bubbles have had their time
    const totalTime =
      (bubbles.length - 1) * BUBBLE_INTERVAL + BUBBLE_DURATION + 500;
    const endT = setTimeout(() => setPhase("done"), totalTime);
    timerRefs.current.push(endT);

    return () => timerRefs.current.forEach(clearTimeout);
  }, [phase]); // only run when phase becomes "playing"

  // When done, report results upward
  useEffect(() => {
    if (phase !== "done") return;
    const total = bubbles.filter((b) => b.shouldPop).length;
    onLevelComplete(correctPops, total);
  }, [phase]);

  const handlePop = useCallback((id: number) => {
    setBubbles((prev) => {
      const bubble = prev.find((b) => b.id === id);
      if (!bubble || bubble.popped) return prev;
      if (bubble.shouldPop) {
        setCorrectPops((c) => c + 1);
      }
      return prev.map((b) => (b.id === id ? { ...b, popped: true, visible: false } : b));
    });
  }, []);

  const goColors = GO_COLORS[level];

  if (phase === "countdown") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <p className="text-white/80 text-lg">
          Pop the <span className="font-bold text-white">{goColors.join(", ")}</span> bubbles!
        </p>
        <span className="text-white text-9xl font-bold animate-pulse">
          {countdown === 0 ? "GO!" : countdown}
        </span>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-white text-4xl font-bold animate-pulse">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 relative w-full">
      {/* Instruction strip */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-white/20 backdrop-blur-sm rounded-full px-5 py-2 text-white text-sm font-medium">
        Pop: {goColors.join(", ")}
      </div>

      {bubbles.map((b) => (
        <Bubble key={b.id} data={b} onPop={handlePop} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Game flow
// ---------------------------------------------------------------------------

type Screen = "intro" | "levelIntro" | "playing" | "levelResult" | "finalResult";

const TOTAL_LEVELS = 3;

interface LevelResult {
  correct: number;
  total: number;
}

export default function PopBubbles() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>("intro");
  const [level, setLevel] = useState(1);
  const [results, setResults] = useState<LevelResult[]>([]);
  const [lastResult, setLastResult] = useState<LevelResult | null>(null);

  const handleLevelComplete = (correct: number, total: number) => {
    const result = { correct, total };
    setLastResult(result);
    setResults((prev) => [...prev, result]);
    setScreen("levelResult");
  };

  const handleNextLevel = () => {
    if (level >= TOTAL_LEVELS) {
      setScreen("finalResult");
    } else {
      setLevel((l) => l + 1);
      setScreen("levelIntro");
    }
  };

  const totalCorrect = results.reduce((sum, r) => sum + r.correct, 0);
  const totalBubbles = results.reduce((sum, r) => sum + r.total, 0);

  const levelInstructions: Record<number, string> = {
    1: "Pop all PINK, BLUE, and YELLOW bubbles. Ignore red and green ones.",
    2: "Pop only YELLOW and BLUE bubbles!",
    3: "Now pop RED, YELLOW, and BLUE bubbles!",
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-card/90 backdrop-blur-sm shadow-sm px-4 py-3 flex items-center gap-3 z-30 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="text-foreground hover:bg-secondary"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-display font-semibold text-foreground">
          Pop the Bubbles
        </h1>
        <button
          onClick={() => window.location.reload()}
          className="ml-auto p-2 text-foreground hover:opacity-70 transition-opacity"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Intro dialog */}
      <GameDialog
        show={screen === "intro"}
        message="Bubbles of different colors will appear on screen. Pop the ones you're told to — and ignore the rest! Each level tells you which colors to pop."
        onClose={() => setScreen("levelIntro")}
      />

      {/* Level intro dialog */}
      <GameDialog
        show={screen === "levelIntro"}
        message={
          <div className="flex flex-col gap-2">
            <p className="font-bold text-xl">Level {level}</p>
            <p>{levelInstructions[level]}</p>
          </div>
        }
        onClose={() => setScreen("playing")}
      />

      {/* Level result dialog */}
      <GameDialog
        show={screen === "levelResult"}
        message={
          <div className="flex flex-col gap-2">
            <p className="font-bold text-xl">Level {level} complete!</p>
            <p>
              You correctly popped{" "}
              <span className="font-bold text-green-600">
                {lastResult?.correct ?? 0}
              </span>{" "}
              out of{" "}
              <span className="font-bold">{lastResult?.total ?? 0}</span>{" "}
              bubbles.
            </p>
          </div>
        }
        onClose={handleNextLevel}
      />

      {/* Final result */}
      {screen === "finalResult" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-white text-center px-6">
          <h2 className="text-4xl font-bold"> Thanks for playing!</h2>
          <p className="text-2xl">
            Total correct pops:{" "}
            <span className="font-bold">
              {totalCorrect} / {totalBubbles}
            </span>
          </p>
          <p className="text-xl opacity-80">
            {Math.round((totalCorrect / (totalBubbles || 1)) * 100)}% accuracy
          </p>
          <div className="flex flex-col gap-2 mt-4 text-lg opacity-90">
            {results.map((r, i) => (
              <p key={i}>
                Level {i + 1}: {r.correct}/{r.total}
              </p>
            ))}
          </div>
          <button
            onClick={() => navigate("/")}
            className="mt-6 px-8 py-3 bg-white text-game-blue rounded-full font-bold text-lg hover:opacity-90 transition-opacity"
          >
            Back to Hub
          </button>
        </div>
      )}

      {/* Active gameplay */}
      {screen === "playing" && (
        <LevelPlay
          key={level} // remount fresh each level
          level={level}
          onLevelComplete={handleLevelComplete}
        />
      )}
    </div>
  );
}