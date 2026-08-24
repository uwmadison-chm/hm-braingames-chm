import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface GameDialogProps {
  open: boolean;
  onStart: () => void;
  showMapping: string;
}

export default function GameDialog({ open, onStart, showMapping }: GameDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-display">Symbol-Digit Substitution</DialogTitle>
        </DialogHeader>
          <div className="text-sm text-muted-foreground space-y-3">
            <p>
              In this game, you will be shown a symbol represented by a Greek letter.
              This symbol will correspond to a number in the legend at the top of the page.
            </p>
            <p>Your task is to identify and click on this number!</p>
            <p>
              After you select the correct number, you will move to a new symbol.
              Try to evaluate as many symbols as you can. Good luck!
            </p>
          </div>
        <DialogFooter>
          <Button onClick={onStart} className="font-semibold">
            {showMapping !== "before" ? "Start Game" : "Ok"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
