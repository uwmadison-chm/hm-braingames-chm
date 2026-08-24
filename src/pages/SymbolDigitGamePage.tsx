import SymbolDigitGame from "@/components/games/SymbolDigitGame";
import { usePigRun } from "@/hooks/use-pig-run.ts";

export default function SymbolDigitGamePage() {
  usePigRun("symbol-digit");
  return <SymbolDigitGame />;
}
