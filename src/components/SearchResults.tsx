import React from "react";
import AdUnit from "./AdUnit";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { Copy } from "lucide-react";

interface SearchResultsProps {
  words: { [key: string]: { word: string; is_exact: boolean }[] } | null;
  totalWords: number;
}

const SearchResults = ({ words, totalWords }: SearchResultsProps) => {
  const { toast } = useToast();

  if (!words || Object.keys(words).length === 0) return null;

  const entries = Object.entries(words).sort(([a], [b]) => Number(a) - Number(b));

  const handleCopyResults = async () => {
    try {
      const textToCopy = entries
        .map(([length, wordList]) => {
          const exactMatches = wordList.filter(w => w.is_exact);
          const nonExactMatches = wordList.filter(w => !w.is_exact);
          
          let text = `${length} letras (${wordList.length} palabras):\n`;
          
          if (exactMatches.length > 0) {
            text += "Anagramas exactos:\n" + exactMatches.map(w => w.word).join("\n") + "\n";
          }
          
          if (nonExactMatches.length > 0) {
            text += "Palabras relacionadas:\n" + nonExactMatches.map(w => w.word).join("\n");
          }
          
          return text;
        })
        .join("\n\n");

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

  return (
    <div className="border rounded-xl p-6 bg-card/50 backdrop-blur-sm shadow-sm animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="text-lg font-semibold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary/90 to-primary/60">
          Total de palabras encontradas: {totalWords}
        </div>
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
      <div className="space-y-6">
        {entries.map(([length, wordList], index) => {
          const exactMatches = wordList.filter(w => w.is_exact);
          const nonExactMatches = wordList.filter(w => !w.is_exact);

          return (
            <React.Fragment key={length}>
              <div className="border-t pt-4 first:border-t-0 first:pt-0">
                <h3 className="font-medium mb-3 text-muted-foreground">
                  {length} letras ({wordList.length} palabras):
                </h3>
                {exactMatches.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Anagramas exactos:</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {exactMatches.map((item) => (
                        <a
                          key={item.word}
                          href={`https://dle.rae.es/${item.word.toLowerCase()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-secondary/50 hover:bg-secondary/80 rounded-md text-center transition-colors duration-200 hover:scale-105 transform"
                        >
                          {item.word}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {nonExactMatches.length > 0 && (
                  <div className="space-y-3 mt-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Palabras relacionadas:</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {nonExactMatches.map((item) => (
                        <a
                          key={item.word}
                          href={`https://dle.rae.es/${item.word.toLowerCase()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-secondary/30 hover:bg-secondary/60 rounded-md text-center transition-colors duration-200 hover:scale-105 transform"
                        >
                          {item.word}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* Insertar anuncio cada 3 grupos de palabras */}
              {(index + 1) % 3 === 0 && index < entries.length - 1 && (
                <AdUnit
                  slot="1234567890" // Reemplazar con tu slot ID real
                  className="animate-fade-in"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default SearchResults;