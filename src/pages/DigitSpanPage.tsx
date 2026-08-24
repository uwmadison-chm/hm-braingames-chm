import DigitSpan from "@/components/games/digitspan/DigitSpanGame";
import { usePigRun } from "@/hooks/use-pig-run.ts";

export default function DigitSpanPage() {
  usePigRun("digit-span");
  return <DigitSpan />;
}
