import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GameTimerHandle {
  /** Pause the countdown. */
  pause: () => void;
  /** Resume a paused countdown. */
  resume: () => void;
  /** Reset back to the initial duration. Optionally auto-start. */
  reset: (autoStart?: boolean) => void;
  /** Read the remaining seconds without re-rendering the parent. */
  getTimeLeft: () => number;
}

export interface GameTimerProps {
  /** Countdown length in seconds. */
  duration: number;
  /** Start counting down immediately on mount. Defaults to true. */
  autoStart?: boolean;
  /** Fired exactly once when the timer reaches zero. */
  onComplete?: () => void;
  /** Fired every tick with the remaining seconds. */
  onTick?: (secondsLeft: number) => void;
  /** Threshold (seconds) below which the timer styles itself as "urgent". Defaults to 10. */
  warningThreshold?: number;
  /** Visual style. */
  variant?: "pill" | "bar" | "plain";
  /**
   * Where to position the timer when using `pill` or `bar` variants.
   * Use "inline" to render it in the normal document flow instead of floating.
   */
  position?: "top-right" | "top-left" | "top-center" | "inline";
  /** Show the clock icon next to the time. Defaults to true. */
  showIcon?: boolean;
  /** Format `mm:ss` instead of `Ns`. Defaults to false (plain seconds). */
  formatAsClock?: boolean;
  /** Optional label, e.g. "Time left". */
  label?: string;
  className?: string;
}

function formatTime(seconds: number, asClock: boolean) {
  if (!asClock) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Reusable countdown timer for the games
 */
const GameTimer = forwardRef<GameTimerHandle, GameTimerProps>(function GameTimer(
  {
    duration,
    autoStart = true,
    onComplete,
    onTick,
    warningThreshold = 10,
    variant = "pill",
    position = "top-right",
    showIcon = true,
    formatAsClock = false,
    label,
    className,
  },
  ref,
) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [running, setRunning] = useState(autoStart);
  const completedRef = useRef(false);
  const timeLeftRef = useRef(duration);

  useImperativeHandle(ref, () => ({
    pause: () => setRunning(false),
    resume: () => {
      if (timeLeftRef.current > 0) setRunning(true);
    },
    reset: (autoStartAfter = true) => {
      completedRef.current = false;
      timeLeftRef.current = duration;
      setTimeLeft(duration);
      setRunning(autoStartAfter);
    },
    getTimeLeft: () => timeLeftRef.current,
  }));

  // Keep the ref in sync
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // If parent changes `duration`, reflect it when we're not mid-run
  useEffect(() => {
    if (!running && !completedRef.current) {
      setTimeLeft(duration);
    }
  }, [duration, running]);

  useEffect(() => {
    if (!running || timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        const next = t - 1;
        onTick?.(Math.max(next, 0));
        if (next <= 0) {
          clearInterval(id);
          if (!completedRef.current) {
            completedRef.current = true;
            onComplete?.();
          }
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, timeLeft, onComplete, onTick]);

  const isWarning = timeLeft <= warningThreshold && timeLeft > 0;
  const isDone = timeLeft === 0;

  const positionClass =
    position === "inline"
      ? ""
      : cn(
          "absolute top-4 z-20",
          position === "top-right" && "right-4",
          position === "top-left" && "left-4",
          position === "top-center" && "left-1/2 -translate-x-1/2",
        );

  if (variant === "bar") {
    const pct = Math.max(0, Math.min(100, (timeLeft / duration) * 100));
    return (
      <div className={cn(positionClass, "w-48", className)}>
        <div className="flex items-center justify-between text-xs font-medium text-foreground mb-1">
          <span>{label ?? "Time"}</span>
          <span className={cn(isWarning && "text-destructive", isDone && "text-destructive")}>
            {formatTime(timeLeft, formatAsClock)}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500 ease-linear",
              isWarning ? "bg-destructive" : "bg-primary",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  if (variant === "plain") {
    return (
      <span
        className={cn(
          positionClass,
          "font-display font-semibold tabular-nums",
          isWarning && "text-destructive animate-pulse",
          className,
        )}
      >
        {label ? `${label}: ` : ""}
        {formatTime(timeLeft, formatAsClock)}
      </span>
    );
  }

  // pill (default)
  return (
    <div
      className={cn(
        positionClass,
        "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold shadow-sm backdrop-blur-sm transition-colors tabular-nums",
        isWarning
          ? "bg-destructive text-destructive-foreground animate-pulse"
          : "bg-card/90 text-foreground border border-border",
        className,
      )}
      role="timer"
      aria-live="polite"
    >
      {showIcon && <Clock className="w-4 h-4" />}
      {label && <span className="opacity-80">{label}</span>}
      <span className="font-display">{formatTime(timeLeft, formatAsClock)}</span>
    </div>
  );
});

export default GameTimer;
