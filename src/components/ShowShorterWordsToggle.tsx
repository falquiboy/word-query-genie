import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ShowShorterWordsToggleProps {
  showShorterWords: boolean;
  onToggle: (checked: boolean) => void;
}

const ShowShorterWordsToggle = ({ showShorterWords, onToggle }: ShowShorterWordsToggleProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="shorter-words"
        checked={showShorterWords}
        onCheckedChange={onToggle}
      />
      <Label htmlFor="shorter-words" className="text-sm text-muted-foreground">
        Mostrar palabras más cortas
      </Label>
    </div>
  );
};

export default ShowShorterWordsToggle;