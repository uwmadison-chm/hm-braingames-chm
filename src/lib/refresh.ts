const RESTART_FLAG = "brain_games_restart";

// Use this instead of window.location.reload() for in-game "Play Again" /
// restart buttons, so they aren't mistaken for an accidental browser refresh.
export function restartPage() {
  try {
    sessionStorage.setItem(RESTART_FLAG, "1");
  } catch {
    // sessionStorage unavailable; the restart will just land on the home page.
  }
  window.location.reload();
}

// If the participant refreshed the browser (F5 / pull-to-refresh) while on a
// game page, send them back to the home page instead of resuming mid-game.
// Restarts triggered through restartPage() are left alone.
export function redirectHomeOnRefresh() {
  let isIntentionalRestart = false;
  try {
    isIntentionalRestart = sessionStorage.getItem(RESTART_FLAG) === "1";
    sessionStorage.removeItem(RESTART_FLAG);
  } catch {
    // ignore
  }
  if (isIntentionalRestart) return;

  const nav = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  if (nav?.type === "reload" && window.location.hash.startsWith("#/games")) {
    window.location.hash = "#/";
  }
}
