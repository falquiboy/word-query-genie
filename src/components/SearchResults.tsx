import React, { useState } from "react";
import AdUnit from "./AdUnit";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";
import SearchFeedback from "./SearchFeedback";
import ShowShorterWordsToggle from "./ShowShorterWordsToggle";

interface SearchResultsProps {
  words: { [key: string]: { exact: string[], similar: string[] } } | null;
  totalWords: number;
  queryId?: string;
}

const SearchResults = ({ words, totalWords, queryId }: SearchResultsProps) => {
  const { toast } = useToast();
  const [showShorterWords, setShowShorterWords] = useState(false);

  if (!words || Object.keys(words).length === 0) return null;

  // Get the longest word length from the results
  const maxLength = Math.max(...Object.keys(words).map(Number));

  const entries = Object.entries(words)
    .sort(([a], [b]) => Number(b) - Number(a)) // Sort by length in descending order
    .filter(([length, _]) => showShorterWords || Number(length) === maxLength);

  const handleCopyResults = async () => {
    try {
      const textToCopy = entries
        .map(([length, { exact, similar }]) => {
          const exactList = exact.length > 0 ? `Anagramas exactos:\n${exact.join("\n")}` : '';
          const similarList = similar.length > 0 ? `\nAnagramas con una letra adicional:\n${similar.join("\n")}` : '';
          return `${length} letras (${exact.length + similar.length} palabras):\n${exactList}${similarList}\n`;
        })
        .join("\n");

      await navigator.clipboard.writeText(textToCopy);
      
      toast({
        title: "¡Copiado!",
        description: "La lista de palabras ha sido copiada al portapapeles",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo copiar al portapapeles",
      });
    }
  };

  const filteredTotalWords = entries.reduce((total, [_, { exact, similar }]) => 
    total + exact.length + similar.length, 0);

  return (
    <div className="border rounded-xl p-6 bg-card/50 backdrop-blur-sm shadow-sm animate-fade-in space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="text-lg font-semibold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary/90 to-primary/60">
          Total de palabras encontradas: {filteredTotalWords}
        </div>
        <div className="flex items-center gap-4">
          <ShowShorterWordsToggle
            showShorterWords={showShorterWords}
            onToggle={setShowShorterWords}
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleCopyResults}
          >
            <Copy className="h-4 w-4" />
            Copiar resultados
          </Button>
        </div>
      </div>
      
      <div className="space-y-6">
        {entries.map(([length, { exact, similar }], index) => (
          <React.Fragment key={length}>
            <div className="border-t pt-4 first:border-t-0 first:pt-0">
              <h3 className="font-medium mb-3 text-muted-foreground">
                {length} letras ({exact.length + similar.length} palabras):
              </h3>
              {exact.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm text-muted-foreground">Anagramas exactos:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {exact.map((word: string) => (
                      <a
                        key={word}
                        href={`https://dle.rae.es/${word.toLowerCase()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-secondary/50 hover:bg-secondary/80 rounded-md text-center transition-colors duration-200 hover:scale-105 transform"
                      >
                        {word}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {similar.length > 0 && (
                <div className="space-y-3 mt-4">
                  <h4 className="text-sm text-muted-foreground">Anagramas con una letra adicional:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {similar.map((word: string) => (
                      <a
                        key={word}
                        href={`https://dle.rae.es/${word.toLowerCase()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-secondary/30 hover:bg-secondary/60 rounded-md text-center transition-colors duration-200 hover:scale-105 transform"
                      >
                        {word}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {(index + 1) % 3 === 0 && index < entries.length - 1 && (
              <AdUnit
                slot="1234567890"
                className="animate-fade-in"
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {queryId && (
        <div className="border-t pt-6 mt-6">
          <SearchFeedback queryId={queryId} />
        </div>
      )}
    </div>
  );
};

export default SearchResults;