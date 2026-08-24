import { useEffect } from "react";
import { useParticipant } from "@/ParticipantContext";

const PIG_URL = import.meta.env.VITE_PIG_URL;

// Starts a Pig run when the participant opens a game page, and tells Pig
// they left (and finalizes the run) when they navigate away or close the tab.
export function usePigRun(taskCode: string) {
  const { participantId } = useParticipant();

  useEffect(() => {
    let runId: string | null = null;
    let ended = false;

    const endRun = () => {
      if (ended || !runId) return;
      ended = true;

      // sendBeacon always sends credentials, which browsers refuse to accept
      // alongside Pig's wildcard Access-Control-Allow-Origin. fetch with
      // keepalive survives page unload the same way, without that problem.
      fetch(`${PIG_URL}/task/${taskCode}/run/${runId}`, {
        method: "POST",
        keepalive: true,
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "2": {
            timestamp: new Date().toISOString(),
            data: { type: "game_left" },
          },
        }),
      }).catch(() => {});

      fetch(`${PIG_URL}/task/${taskCode}/run/${runId}/finalize`, {
        method: "POST",
        keepalive: true,
        credentials: "omit",
      }).catch(() => {});
    };

    (async () => {
      try {
        const startResponse = await fetch(`${PIG_URL}/task/${taskCode}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participant_id: participantId }),
        });
        if (!startResponse.ok) return;
        const { run_id } = await startResponse.json();
        runId = run_id;

        await fetch(`${PIG_URL}/task/${taskCode}/run/${run_id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            "1": {
              timestamp: new Date().toISOString(),
              data: { type: "game_started" },
            },
          }),
        });
      } catch (err) {
        console.error(`Pig: failed to start run for task "${taskCode}"`, err);
      }
    })();

    window.addEventListener("pagehide", endRun);

    return () => {
      window.removeEventListener("pagehide", endRun);
      endRun();
    };
  }, [taskCode, participantId]);
}
