import PopBubbles from "@/components/games/PopBubbles";
import { usePigRun } from "@/hooks/use-pig-run.ts";

export default function PopBubblesPage() {
  usePigRun("pop-bubbles");
  return <PopBubbles />;
}