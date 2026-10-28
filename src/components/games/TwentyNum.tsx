import * as React from "react";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Direction = "up" | "down" | "left" | "right";

interface TileData {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew: boolean;
  isMerged: boolean;
  mergedFrom?: [number, number] | null; // previous position before merge
}

type Grid = (number | null)[][];

// ---------------------------------------------------------------------------
// ID counter
// ---------------------------------------------------------------------------

let tileIdCounter = 0;
function nextId() {
  return ++tileIdCounter;
}

// ---------------------------------------------------------------------------
// Game logic helpers (operate on plain Grid for simplicity)
// ---------------------------------------------------------------------------

function emptyGrid(): Grid {
  return Array.from({ length: 4 }, () => Array(4).fill(null));
}

function addRandomTile(grid: Grid): { grid: Grid; pos: { r: number; c: number } | null } {
  const empty: [number, number][] = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (grid[r][c] === null) empty.push([r, c]);
  if (empty.length === 0) return { grid, pos: null };
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const newGrid = grid.map((row) => [...row]);
  newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
  return { grid: newGrid, pos: { r, c } };
}

function initGrid(): { grid: Grid; newTiles: { r: number; c: number }[] } {
  let g = emptyGrid();
  const r1 = addRandomTile(g);
  g = r1.grid;
  const r2 = addRandomTile(g);
  g = r2.grid;
  const newTiles: { r: number; c: number }[] = [];
  if (r1.pos) newTiles.push(r1.pos);
  if (r2.pos) newTiles.push(r2.pos);
  return { grid: g, newTiles };
}

interface SlideResult {
  result: (number | null)[];
  score: number;
  // For each output position, where did the value come from? (input index)
  // For merges, stores the two source indices
  sources: ({ from: number; merged?: number })[];
}

function slideRow(row: (number | null)[]): SlideResult {
  const tiles: { val: number; idx: number }[] = [];
  row.forEach((v, i) => { if (v !== null) tiles.push({ val: v, idx: i }); });

  const result: (number | null)[] = Array(4).fill(null);
  const sources: ({ from: number; merged?: number })[] = [];
  let score = 0;
  let i = 0;
  let ri = 0;

  while (i < tiles.length) {
    if (i + 1 < tiles.length && tiles[i].val === tiles[i + 1].val) {
      result[ri] = tiles[i].val * 2;
      score += tiles[i].val * 2;
      sources[ri] = { from: tiles[i].idx, merged: tiles[i + 1].idx };
      i += 2;
    } else {
      result[ri] = tiles[i].val;
      sources[ri] = { from: tiles[i].idx };
      i++;
    }
    ri++;
  }
  return { result, score, sources };
}

interface MoveResult {
  newGrid: Grid;
  score: number;
  moved: boolean;
  // Map from "r,c" (destination) -> source info
  moveMap: Map<string, { fromRow: number; fromCol: number; mergedFromRow?: number; mergedFromCol?: number }>;
}

function moveGrid(grid: Grid, direction: Direction): MoveResult {
  const moveMap = new Map<string, { fromRow: number; fromCol: number; mergedFromRow?: number; mergedFromCol?: number }>();

  // We'll work on rows. For other directions, we rotate the grid, compute,
  // then rotate back — but we also need to track coordinate transforms.

  // Helper: transform (r, c) in the rotated frame back to original (r, c)
  const transformCoord = (r: number, c: number): [number, number] => {
        if (direction === "left")  return [r, c];
        if (direction === "right") return [r, 3 - c];
        if (direction === "up")    return [c, r];        // rotate: row←col, col←row
        if (direction === "down")  return [3 - c, 3 - r]; // rotate CCW
        return [r, c];
    };

    const transformCoordInverse = (r: number, c: number): [number, number] => {
        if (direction === "left")  return [r, c];
        if (direction === "right") return [r, 3 - c];
        if (direction === "up")    return [c, r];        // same as forward (symmetric)
        if (direction === "down")  return [3 - c, 3 - r]; // same as forward (symmetric)
        return [r, c];
    };

  // Build a rotated view
  let rows: (number | null)[][] = [];
  for (let r = 0; r < 4; r++) {
    const row: (number | null)[] = [];
    for (let c = 0; c < 4; c++) {
      const [origR, origC] = transformCoord(r, c);
      row.push(grid[origR][origC]);
    }
    rows.push(row);
  }

  let totalScore = 0;
  let moved = false;
  const newRows: (number | null)[][] = [];

  for (let r = 0; r < 4; r++) {
    const { result, score, sources } = slideRow(rows[r]);
    totalScore += score;
    if (JSON.stringify(result) !== JSON.stringify(rows[r])) moved = true;
    newRows.push(result);

    // Record movement in moveMap (in original coordinate space)
    for (let destC = 0; destC < 4; destC++) {
      if (result[destC] === null) continue;
      const src = sources[destC];
      if (src === undefined) continue;

      const [destOrigR, destOrigC] = transformCoordInverse(r, destC);
      const [fromOrigR, fromOrigC] = transformCoordInverse(r, src.from);

      const entry: { fromRow: number; fromCol: number; mergedFromRow?: number; mergedFromCol?: number } = {
        fromRow: fromOrigR,
        fromCol: fromOrigC,
      };

      if (src.merged !== undefined) {
        const [mOrigR, mOrigC] = transformCoordInverse(r, src.merged);
        entry.mergedFromRow = mOrigR;
        entry.mergedFromCol = mOrigC;
      }

      moveMap.set(`${destOrigR},${destOrigC}`, entry);
    }
  }

  // Build newGrid in original coordinate space
  const newGrid = emptyGrid();
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const [origR, origC] = transformCoordInverse(r, c);
      newGrid[origR][origC] = newRows[r][c];
    }
  }

  return { newGrid, score: totalScore, moved, moveMap };
}

function isGameOver(grid: Grid): boolean {
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === null) return false;
      if (c < 3 && grid[r][c] === grid[r][c + 1]) return false;
      if (r < 3 && grid[r][c] === grid[r + 1][c]) return false;
    }
  return true;
}

function hasWon(grid: Grid): boolean {
  return grid.some((row) => row.some((v) => v !== null && v >= 2048));
}

// ---------------------------------------------------------------------------
// Build TileData array from grid + move info
// ---------------------------------------------------------------------------

function buildTiles(
  grid: Grid,
  moveMap: Map<string, { fromRow: number; fromCol: number; mergedFromRow?: number; mergedFromCol?: number }>,
  prevTileIds: Map<string, number>, // "r,c" -> id from previous frame
  newTilePos: { r: number; c: number } | null,
): { tiles: TileData[]; tileIds: Map<string, number> } {
  const tiles: TileData[] = [];
  const tileIds = new Map<string, number>();

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const val = grid[r][c];
      if (val === null) continue;

      const key = `${r},${c}`;
      const moveInfo = moveMap.get(key);
      const isNew = newTilePos?.r === r && newTilePos?.c === c;
      const isMerged = moveInfo !== undefined && moveInfo.mergedFromRow !== undefined;

      // Try to reuse the ID of the primary source tile
      let id: number;
      if (moveInfo) {
        const srcKey = `${moveInfo.fromRow},${moveInfo.fromCol}`;
        id = prevTileIds.get(srcKey) ?? nextId();
      } else if (isNew) {
        id = nextId();
      } else {
        id = prevTileIds.get(key) ?? nextId();
      }

      tileIds.set(key, id);

      tiles.push({
        id,
        value: val,
        row: r,
        col: c,
        isNew,
        isMerged,
      });
    }
  }

  return { tiles, tileIds };
}

// ---------------------------------------------------------------------------
// Tile color mapping
// ---------------------------------------------------------------------------

const TILE_STYLES: Record<number, { bg: string; text: string }> = {
  2:    { bg: "#eee4da", text: "#776e65" },
  4:    { bg: "#ede0c8", text: "#776e65" },
  8:    { bg: "#f2b179", text: "#fff" },
  16:   { bg: "#f59563", text: "#fff" },
  32:   { bg: "#f67c5f", text: "#fff" },
  64:   { bg: "#f65e3b", text: "#fff" },
  128:  { bg: "#edcf72", text: "#fff" },
  256:  { bg: "#edcc61", text: "#fff" },
  512:  { bg: "#edc850", text: "#fff" },
  1024: { bg: "#edc53f", text: "#fff" },
  2048: { bg: "#edc22e", text: "#fff" },
};

function tileStyle(value: number) {
  return TILE_STYLES[value] ?? { bg: "#3c3a32", text: "#fff" };
}

function tileFontSize(value: number): string {
  if (value < 100) return "2rem";
  if (value < 1000) return "1.5rem";
  return "1.1rem";
}

// ---------------------------------------------------------------------------
// GameDialog
// ---------------------------------------------------------------------------

interface GameDialogProps {
  show: boolean;
  title: string;
  message: string;
  onClose: () => void;
  closeLabel?: string;
}

function GameDialog({ show, title, message, onClose, closeLabel = "Play Again" }: GameDialogProps) {
  return (
    <Dialog open={show} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{message}</p>
        <DialogFooter>
          <Button onClick={onClose} className="font-semibold">{closeLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Board — uses absolute positioning + CSS transitions for animation
// ---------------------------------------------------------------------------

const BOARD_SIZE = 360;
const GAP = 10;
const PADDING = 10;
const CELL_SIZE = (BOARD_SIZE - PADDING * 2 - GAP * 3) / 4;

function tilePos(index: number): number {
  return PADDING + index * (CELL_SIZE + GAP);
}

interface BoardProps {
  tiles: TileData[];
}

function Board({ tiles }: BoardProps) {
  return (
    <div
      style={{
        position: "relative",
        width: BOARD_SIZE,
        height: BOARD_SIZE,
        maxWidth: "100%",
        aspectRatio: "1",
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 8,
          backgroundColor: "#bbada0",
          padding: PADDING,
          display: "grid",
          gridTemplateColumns: `repeat(4, ${CELL_SIZE}px)`,
          gap: GAP,
        }}
      >
        {Array(16).fill(null).map((_, i) => (
          <div key={i} style={{ borderRadius: 6, backgroundColor: "#cdc1b4" }} />
        ))}
      </div>

      {/* Animated tiles */}
      {tiles.map((tile) => (
        <AnimatedTile key={tile.id} tile={tile} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AnimatedTile — CSS transition handles sliding
// ---------------------------------------------------------------------------

function AnimatedTile({ tile }: { tile: TileData }) {
  const { bg, text } = tileStyle(tile.value);
  const x = tilePos(tile.col);
  const y = tilePos(tile.row);
  const fontSize = tileFontSize(tile.value);

  // We use a key-based trick: when isMerged or isNew, we briefly add a class
  const [animClass, setAnimClass] = React.useState<"appear" | "pop" | "">(() =>
    tile.isNew ? "appear" : tile.isMerged ? "pop" : ""
  );

  React.useEffect(() => {
    if (tile.isNew) setAnimClass("appear");
    else if (tile.isMerged) setAnimClass("pop");
    else setAnimClass("");
  }, [tile.isNew, tile.isMerged]);

  const scaleStyle = animClass === "appear"
    ? { animation: "tileAppear 0.15s ease-out both" }
    : animClass === "pop"
    ? { animation: "tilePop 0.2s ease-out both" }
    : {};

  return (
    <div
      style={{
        position: "absolute",
        width: CELL_SIZE,
        height: CELL_SIZE,
        left: x,
        top: y,
        transition: "left 0.1s ease-in-out, top 0.1s ease-in-out",
        borderRadius: 6,
        backgroundColor: bg,
        color: text,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        fontSize,
        zIndex: tile.isMerged ? 20 : tile.isNew ? 5 : 10,
        ...scaleStyle,
      }}
    >
      {tile.value}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Score display
// ---------------------------------------------------------------------------

function ScoreBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center justify-center bg-[#bbada0] rounded-md px-3 py-1 min-w-[64px]">
      <span className="text-[10px] font-semibold text-[#eee4da] uppercase tracking-widest">{label}</span>
      <span className="text-lg font-bold text-white leading-tight">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Game Component
// ---------------------------------------------------------------------------

interface TwentyNumInnerProps {
  navigate: ReturnType<typeof useNavigate>;
  data?: { is_favorite?: boolean; forward?: boolean };
  onForward?: () => void;
}

interface TwentyNumState {
  grid: Grid;
  tiles: TileData[];
  tileIds: Map<string, number>;
  score: number;
  gameOver: boolean;
  won: boolean;
  showIntro: boolean;
  forward: boolean;
}

class TwentyNumInner extends React.Component<TwentyNumInnerProps, TwentyNumState> {
  private touchStartX = 0;
  private touchStartY = 0;
  private containerRef = React.createRef<HTMLDivElement>();

  constructor(props: TwentyNumInnerProps) {
    super(props);
    const { grid, newTiles } = initGrid();
    const emptyMoveMap = new Map<string, { fromRow: number; fromCol: number }>();
    const emptyIds = new Map<string, number>();
    const { tiles, tileIds } = buildTiles(grid, emptyMoveMap, emptyIds, null);

    // Mark initial tiles as "new" for appear animation
    const initialTiles = tiles.map((t) => ({
      ...t,
      isNew: newTiles.some((p) => p.r === t.row && p.c === t.col),
    }));

    this.state = {
      grid,
      tiles: initialTiles,
      tileIds,
      score: 0,
      gameOver: false,
      won: false,
      showIntro: true,
      forward: props.data?.forward ?? false,
    };
  }

  componentDidMount() {
    window.addEventListener("keydown", this.handleKeyDown);
    const el = this.containerRef.current;
    if (el) {
      el.addEventListener("touchstart", this.handleTouchStart, { passive: true });
      el.addEventListener("touchmove", this.handleTouchMove, { passive: false });
      el.addEventListener("touchend", this.handleTouchEnd, { passive: true });
    }
    // inject keyframe CSS
    if (!document.getElementById("tile-keyframes")) {
      const style = document.createElement("style");
      style.id = "tile-keyframes";
      style.textContent = `
        @keyframes tileAppear {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes tilePop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.handleKeyDown);
    const el = this.containerRef.current;
    if (el) {
      el.removeEventListener("touchstart", this.handleTouchStart);
      el.removeEventListener("touchmove", this.handleTouchMove);
      el.removeEventListener("touchend", this.handleTouchEnd);
    }
  }

  handleKeyDown = (e: KeyboardEvent) => {
    const dirMap: Record<string, Direction> = {
      ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    };
    if (dirMap[e.key]) {
      e.preventDefault();
      this.move(dirMap[e.key]);
    }
  };

  handleTouchStart = (e: TouchEvent) => {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
  };

  handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
  };

  handleTouchEnd = (e: TouchEvent) => {
    const dx = e.changedTouches[0].clientX - this.touchStartX;
    const dy = e.changedTouches[0].clientY - this.touchStartY;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
    if (Math.abs(dx) > Math.abs(dy)) this.move(dx > 0 ? "right" : "left");
    else this.move(dy > 0 ? "down" : "up");
  };

  move = (dir: Direction) => {
    if (this.state.gameOver || this.state.showIntro) return;
    const { newGrid, score, moved, moveMap } = moveGrid(this.state.grid, dir);
    if (!moved) return;

    const { grid: gridWithNew, pos: newPos } = addRandomTile(newGrid);
    const newScore = this.state.score + score;

    // Build tiles at their NEW positions — CSS transition animates the slide
    const { tiles, tileIds } = buildTiles(gridWithNew, moveMap, this.state.tileIds, newPos);

    this.setState({
      grid: gridWithNew,
      tiles,
      tileIds,
      score: newScore,
      gameOver: isGameOver(gridWithNew),
      won: !this.state.won && hasWon(gridWithNew),
    });
  };

  resetGame = () => {
    const { grid, newTiles } = initGrid();
    const emptyMoveMap = new Map<string, { fromRow: number; fromCol: number }>();
    const emptyIds = new Map<string, number>();
    const { tiles, tileIds } = buildTiles(grid, emptyMoveMap, emptyIds, null);
    const initialTiles = tiles.map((t) => ({
      ...t,
      isNew: newTiles.some((p) => p.r === t.row && p.c === t.col),
    }));

    this.setState({
      grid,
      tiles: initialTiles,
      tileIds,
      score: 0,
      gameOver: false,
      won: false,
      showIntro: true,
    });
  };

  render() {
    const { tiles, score, gameOver, won, showIntro, forward } = this.state;
    const { navigate } = this.props;

    return (
      <div ref={this.containerRef} className="min-h-screen bg-game-blue flex flex-col touch-none">
        {/* Header */}
        <div className="bg-card/90 backdrop-blur-sm shadow-sm px-4 py-3 flex items-center gap-3 z-10">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-foreground hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-display font-semibold text-foreground">2048</h1>
          <div className="ml-auto flex items-center gap-1">
            <button onClick={this.resetGame} className="p-2 cursor-pointer text-foreground hover:opacity-70 transition-opacity">
              <RefreshRounded />
            </button>
            {forward && (
              <button onClick={this.props.onForward} className="p-2 cursor-pointer text-foreground hover:opacity-70 transition-opacity">
                <ArrowForwardIcon />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-6">
          <div className="flex gap-3 w-full max-w-[360px] justify-end">
            <ScoreBox label="Score" value={score} />
          </div>
          <p className="text-white/70 text-sm max-w-[360px] w-full text-left -mb-1">
            Join tiles to reach <span className="font-bold text-white">2048!</span>
          </p>

          <Board tiles={tiles} />
          <p className="text-white/80 text-sm max-w-[540px] w-full text-center">
            Instructions:
          </p>
          <ol className="text-white/80 text-sm max-w-[540px] w-full list-decimal list-inside space-y-1 mt-1">
            <li>Swipe or use arrow keys to move tiles. Tiles will slide in the same direction.</li>
            <li>Sliding tiles with the same number will sum them into one new tile.</li>
            <li>Keep merging tiles to reach 2048! Be careful to not fill the board and get stuck!</li>
          </ol>
          <Button onClick={this.resetGame} className="bg-[#8f7a66] hover:bg-[#7a6a57] text-white font-semibold px-6">
            New Game
          </Button>
        </div>

        <GameDialog
          show={showIntro}
          title="2048"
          message="Swipe or use arrow keys to slide tiles. When two tiles with the same number touch, they merge into one. Reach 2048 to win!"
          onClose={() => this.setState({ showIntro: false })}
          closeLabel="Start Game"
        />
        <GameDialog
          show={won && !gameOver}
          title="You Win!"
          message="You reached 2048! Keep going to beat your high score, or start a new game."
          onClose={() => this.setState({ won: false })}
          closeLabel="Keep Going"
        />
        <GameDialog
          show={gameOver}
          title="Game Over"
          message={`No more moves available. Your score: ${score}`}
          onClose={this.resetGame}
          closeLabel="Play Again"
        />
      </div>
    );
  }
}

interface TwentyNumProps {
  data?: TwentyNumInnerProps["data"];
  onForward?: () => void;
}

export default function TwentyNum(props: TwentyNumProps) {
  const navigate = useNavigate();
  return <TwentyNumInner {...props} navigate={navigate} />;
}