import { useEffect } from "react";
import * as pig from "@uwmadison-chm/pig-client";
import { useParticipant } from "@/ParticipantContext";

const PIG_URL = import.meta.env.VITE_PIG_URL;

// Starts a Pig run when the participant opens a game page, and records that
// they left (and finalizes the run) when they navigate away.
//
// Browsers don't reliably let a page send anything as the tab closes, so the
// client doesn't try. With finalizeWhenAbandoned, a run left open that way is
// finalized the next time the participant opens the site.
export function usePigRun(taskCode: string) {
  const { participantId } = useParticipant();

  useEffect(() => {
    let run: pig.Run | null = null;
    let cancelled = false;

    (async () => {
      try {
        const started = await pig.start(
          PIG_URL,
          taskCode,
          { participant_id: participantId },
          { finalizeWhenAbandoned: true },
        );
        // The page was left before the run finished starting.
        if (cancelled) {
          await started.finalize();
          return;
        }
        run = started;
        run.add({ type: "game_started" });
      } catch (err) {
        console.error(`Pig: failed to start run for task "${taskCode}"`, err);
      }
    })();

    return () => {
      cancelled = true;
      if (run) {
        run.add({ type: "game_left" });
        run.finalize();
      }
    };
  }, [taskCode, participantId]);
}
