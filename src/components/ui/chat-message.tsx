import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";
import { Card } from "./card";

interface ChatMessageProps {
  content: string;
  isAI: boolean;
  sqlProposal?: string;
  onExecuteSQL?: () => void;
  onRefine?: () => void;
}

export function ChatMessage({ content, isAI, sqlProposal, onExecuteSQL, onRefine }: ChatMessageProps) {
  return (
    <div className={cn("flex gap-3 mb-4", isAI ? "flex-row" : "flex-row-reverse")}>
      <Avatar className="w-8 h-8">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          isAI ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          {isAI ? "AI" : "Tú"}
        </div>
      </Avatar>
      
      <div className={cn("flex flex-col gap-2 max-w-[80%]")}>
        <Card className="p-4">
          <p className="whitespace-pre-wrap">{content}</p>
          
          {sqlProposal && (
            <div className="mt-4">
              <div className="bg-muted p-3 rounded-md font-mono text-sm mb-3">
                {sqlProposal}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={onExecuteSQL}
                  className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm hover:bg-primary/90"
                >
                  Ejecutar SQL
                </button>
                <button
                  onClick={onRefine}
                  className="bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm hover:bg-secondary/90"
                >
                  Refinar consulta
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}