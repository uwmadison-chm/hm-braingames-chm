import Trails from "@/components/games/Trails";
import { usePigRun } from "@/hooks/use-pig-run.ts";

export default function TrailsPage() {
  usePigRun("trails");
  return <Trails />;
}