import TwentyNum from "@/components/games/TwentyNum.tsx";
import { usePigRun } from "@/hooks/use-pig-run.ts";

export default function TwentyNumPage() {
  usePigRun("twenty-num");
  return <TwentyNum />;
}