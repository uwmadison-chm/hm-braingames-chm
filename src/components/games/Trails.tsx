import * as React from "react";
import { restartPage } from "@/lib/refresh";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import GameTimer from "@/components/games/GameTimer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function getRandomNumbers(count: number, min: number, max: number): number[] {
  const result: number[] = [];
  while (result.length < count) {
    const n = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!result.includes(n)) result.push(n);
  }
  return result;
}

function getRandomAlphaNumeric(count: number): string[] {
  const nums = Array.from({ length: count }, (_, i) => String(i + 1));
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").slice(0, count);
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(nums[i]);
    result.push(letters[i]);
  }
  return result;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const isMobile = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(
    navigator.userAgent
  );

// ---------------------------------------------------------------------------
// Dot
// ---------------------------------------------------------------------------

interface DotProps {
  index: string;
  dotState: "default" | "selected" | "wrong";
  isFirst: boolean;
  onClick: (e: React.MouseEvent, index: string) => void;
}

function Dot({ index, dotState, isFirst, onClick }: DotProps) {
  const base =
    "rounded-full flex items-center justify-center mx-auto box-border cursor-pointer select-none transition-colors duration-150 w-[45px] h-[45px] sm:w-[55px] sm:h-[55px] md:w-[70px] md:h-[70px]";

  const stateClass =
    dotState === "selected"
      ? "bg-success"
      : dotState === "wrong"
      ? "bg-destructive"
      : "bg-white";

  const borderClass =
    isFirst && dotState === "default" ? "border-2 border-red-500" : "";

  const textColor =
    dotState === "selected" || dotState === "wrong"
      ? "text-white"
      : isFirst
      ? "text-red-500"
      : "text-game-blue";

  return (
    <div
      onClick={(e) => onClick(e, index)}
      className={`${base} ${stateClass} ${borderClass}`}
    >
      <span
        className={`text-sm sm:text-base md:text-xl font-semibold leading-none ${textColor}`}
      >
        {index}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GameDialog
// ---------------------------------------------------------------------------

interface GameDialogProps {
  show: boolean;
  message: string;
  onClose: () => void;
  isGameOver?: boolean;
}

function GameDialog({ show, message, onClose, isGameOver }: GameDialogProps) {
  return (
    <Dialog open={show} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md [button[data-radix-dialog-close]:hidden]" 
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            {isGameOver ? "Game Over" : "Trails"}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{message}</p>
        <DialogFooter>
          <Button onClick={onClose} className="font-semibold">
            {isGameOver ? "Play Again" : "Start Game"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------

type DotVisualState = "default" | "selected" | "wrong";

interface TrailsGameInnerProps {
  navigate: ReturnType<typeof useNavigate>;
  data?: {
    activity?: { settings?: Record<string, any> };
    settings?: Record<string, any>;
    is_favorite?: boolean;
    forward?: boolean;
  };
  onForward?: () => void;
}

interface TrailsGameState {
  correctTaps: number;
  dotSpots: number[];
  dotValues: string[];
  shuffledValues: string[];
  dotVisualStates: Record<string, DotVisualState>;
  gameLevel: number;
  gameOver: boolean;
  timerDuration: number;  // duration passed to GameTimer
  startGame: boolean;
  startTime: number | null;
  tapCount: number;
  totalTaps: number;
  settings: Record<string, any>;
  showInstruction: boolean;
  mistakeCount: number;
  forward: boolean;
}

class TrailsGameInner extends React.Component<
  TrailsGameInnerProps,
  TrailsGameState
> {
  constructor(props: TrailsGameInnerProps) {
    super(props);
    const settingsData =
      props.data?.activity?.settings ?? props.data?.settings ?? {};

    const maxPlots = isMobile() ? 40 : 55;
    const dotCount = settingsData?.level1_dot_count ?? 12;
    const randomArray = getRandomNumbers(dotCount, 1, maxPlots);
    const values = getRandomAlphaNumeric(dotCount / 2);

    this.state = {
      correctTaps: 0,
      dotSpots: randomArray,
      dotValues: values,
      shuffledValues: shuffle(values),
      dotVisualStates: {},
      gameLevel: 1,
      gameOver: false,
      timerDuration: 0,
      startGame: false,
      startTime: null,
      tapCount: 0,
      totalTaps: 0,
      settings: settingsData,
      showInstruction: true,
      mistakeCount: 0,
      forward: props.data?.forward ?? false,
    };
  }

  resetState = () => {
    const maxPlots = isMobile() ? 40 : 55;
    const dotCount = this.state.settings?.level2_dot_count ?? 24;
    const randomArray = getRandomNumbers(dotCount, 1, maxPlots);
    const values = getRandomAlphaNumeric(dotCount / 2);

    this.setState({
      dotSpots: randomArray,
      dotValues: values,
      dotVisualStates: {},
      gameLevel: this.state.gameLevel + 1,
      shuffledValues: shuffle(values),
      startGame: false,
      tapCount: 0,
      showInstruction: true,
      timerDuration: 0,
    });
  };

  handleClick = (e: React.MouseEvent, i: string) => {
    if (i === "1" || this.state.startGame) {
      if (!this.state.gameOver) {
        const currentVisual = this.state.dotVisualStates[i];
        if (currentVisual === "selected") return;

        const isCorrect = i === this.state.dotValues[this.state.tapCount];

        const newVisualStates: Record<string, DotVisualState> = {
          ...this.state.dotVisualStates,
        };
        Object.keys(newVisualStates).forEach((k) => {
          if (newVisualStates[k] === "wrong") newVisualStates[k] = "default";
        });
        newVisualStates[i] = isCorrect ? "selected" : "wrong";

        const newMistakeCount = isCorrect
          ? this.state.mistakeCount
          : this.state.mistakeCount + 1;

        this.setState({
          correctTaps: isCorrect
            ? this.state.correctTaps + 1
            : this.state.correctTaps,
          tapCount: isCorrect ? this.state.tapCount + 1 : this.state.tapCount,
          totalTaps: this.state.totalTaps + 1,
          mistakeCount: newMistakeCount,
          dotVisualStates: newVisualStates,
        });

        if (!isCorrect && newMistakeCount >= 5) {
          setTimeout(() => this.setState({ gameOver: true }), 500);
          return;
        }

        // Dot "1" starts the game and the timer
        if (i === "1") {
          const timerDuration =
            this.state.gameLevel === 1
              ? this.state.settings.level1_timeout ?? 15
              : this.state.settings.level2_timeout ?? 35;

          this.setState({
            startGame: true,
            startTime: this.state.gameLevel === 1 ? Date.now() : this.state.startTime,
            timerDuration,
            showInstruction: false,
          });
        }

        const nextTapCount = isCorrect
          ? this.state.tapCount + 1
          : this.state.tapCount;

        if (this.state.dotValues.length - 1 === nextTapCount) {
          if (this.state.gameLevel >= 2) {
            setTimeout(() => this.setState({ gameOver: true }), 1000);
          } else {
            setTimeout(() => this.resetState(), 500);
          }
        }
      }
    }
  };

  clickHome = () => restartPage();

  resetGame = () => {
    const maxPlots = isMobile() ? 40 : 55;
    const dotCount = this.state.settings?.level1_dot_count ?? 12;

    const randomArray = getRandomNumbers(dotCount, 1, maxPlots);
    const values = getRandomAlphaNumeric(dotCount / 2);

    this.setState({
        correctTaps: 0,
        dotSpots: randomArray,
        dotValues: values,
        shuffledValues: shuffle(values),
        dotVisualStates: {},
        gameLevel: 1,
        gameOver: false,
        timerDuration: 0,
        startGame: false,
        startTime: null,
        tapCount: 0,
        totalTaps: 0,
        mistakeCount: 0,
        showInstruction: true,
        });
    };

    handleCloseInstruction = () => {
    if (this.state.gameOver) {
        this.resetGame();
    } else {
        this.setState({ showInstruction: false });
    }
    };

  createTable = () => {
    const rows = isMobile() ? 9 : 6;
    const cols = isMobile() ? 5 : 10;
    const { shuffledValues, dotSpots, dotVisualStates } = this.state;

    const table = [];
    let k = 0;
    let p = 0;

    for (let i = 0; i < rows; i++) {
      const cells = [];
      for (let j = 0; j < cols; j++) {
        if (dotSpots.indexOf(p) > -1) {
          const val = shuffledValues[k];
          const visualState: DotVisualState = dotVisualStates[val] ?? "default";
          cells.push(
            <td key={p} className="w-[10%] p-1 sm:p-2 text-center align-middle">
              <Dot
                index={val}
                dotState={visualState}
                isFirst={val === "1"}
                onClick={this.handleClick}
              />
            </td>
          );
          k++;
        } else {
          cells.push(<td key={p} />);
        }
        p++;
      }
      table.push(<tr key={i}>{cells}</tr>);
    }
    return table;
  };

  render() {
    const {
      gameOver,
      tapCount,
      gameLevel,
      timerDuration,
      startGame,
      forward,
      showInstruction,
    } = this.state;
    const { navigate } = this.props;

    const alertMsg =
        tapCount === 0
            ? gameLevel === 1
                ? "Tap '1' to start the test"
                : "Tap '1' to begin"
      : tapCount === 1
      ? "Tap on the corresponding letter"
      : null;

    const instructionMsg =
      gameLevel === 1
        ? "For this game, you will alternate between tapping on numbers and letters in increasing order: for instance, 1-A-2-B etc."
        : `Great job! You are now starting level ${gameLevel}`;

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
            Trails
          </h1>

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={this.clickHome}
              className="p-2 cursor-pointer text-foreground hover:opacity-70 transition-opacity"
            >
              <RefreshRounded />
            </button>
            {forward && (
              <button
                onClick={this.props.onForward}
                className="p-2 cursor-pointer text-foreground hover:opacity-70 transition-opacity"
              >
                <ArrowForwardIcon />
              </button>
            )}
          </div>
        </div>

        {/* Game board */}
        <div className="w-full flex-1 flex items-center justify-center relative pt-12 pb-20 px-4 sm:px-5 box-border">
          {startGame && !gameOver && (
            <>
              <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white text-xl z-10">
                Level {gameLevel}
              </div>
              <GameTimer
                duration={timerDuration}
                onComplete={() => this.setState({ gameOver: true })}
                variant="bar"
                formatAsClock
                position="top-right"
              />
            </>
          )}

          <GameDialog
            show={showInstruction}
            message={instructionMsg}
            onClose={this.handleCloseInstruction}
            isGameOver={false}
          />

          <GameDialog
            show={gameOver}
            message="Darn! You ran out of time!"
            onClose={this.handleCloseInstruction}
            isGameOver={true}
          />

          <table className="w-full max-w-5xl mx-auto table-fixed">
            <tbody>{this.createTable()}</tbody>
          </table>
        </div>

        {/* Footer hint */}
        {alertMsg && (
          <div className="fixed left-0 right-0 bottom-0 z-50 flex items-center justify-center bg-white text-game-blue px-4 py-3">
            {alertMsg}
          </div>
        )}
      </div>
    );
  }
}

interface TrailsGameProps {
  data?: TrailsGameInnerProps["data"];
  onForward?: () => void;
}

export default function TrailsGame(props: TrailsGameProps) {
  const navigate = useNavigate();
  return <TrailsGameInner {...props} navigate={navigate} />;
}