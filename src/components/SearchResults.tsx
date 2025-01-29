import React from "react";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { Copy } from "lucide-react";
import { AnagramResults, WordGroups } from "@/types/words";

interface SearchResultsProps {
  results: AnagramResults | null;
  totalWords: number;
  showShorter: boolean;
  mode: "anagrams" | "natural";
}

const findAdditionalLetter = (word: string, baseWord: string): number => {
  const wordChars = word.split('');
  const baseChars = baseWord.split('');
  
  for (let i = 0; i < wordChars.length; i++) {
    const tempWord = [...wordChars];
    tempWord.splice(i, 1);
    if (tempWord.sort().join('') === baseChars.sort().join('')) {
      return i;
    }
  }
  return -1;
};

const WordList = ({ title, words, mode }: { title: string; words: WordGroups; mode: "anagrams" | "natural" }) => {
  if (!words || Object.keys(words).length === 0) return null;

  const entries = Object.entries(words).sort(([a], [b]) => Number(b) - Number(a));

  return (
    <div className="space-y-4">
      {mode === "anagrams" && <h3 className="text-lg font-semibold text-primary/90">{title}</h3>}
      {entries.map(([length, wordList]) => (
        <div key={length} className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            {length} letras ({wordList.length} palabras):
          </h4>
          <div className="text-sm leading-relaxed flex flex-wrap gap-2">
            {wordList.map((item) => {
              const additionalLetterIndex = title === "Palabras con una letra adicional" ? findAdditionalLetter(item.word, item.word.slice(0, -1)) : -1;
              
              return (
                <a
                  key={item.word}
                  href={`https://dle.rae.es/${item.word.toLowerCase()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors duration-200"
                >
                  {additionalLetterIndex >= 0 ? (
                    <>
                      {item.word.slice(0, additionalLetterIndex)}
                      <span className="text-primary font-semibold">
                        {item.word[additionalLetterIndex]}
                      </span>
                      {item.word.slice(additionalLetterIndex + 1)}
                    </>
                  ) : (
                    item.word
                  )}
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const SearchResults = ({ results, totalWords, showShorter, mode }: SearchResultsProps) => {
  const { toast } = useToast();

  if (!results) return null;

  const handleCopyResults = async () => {
    try {
      const activeResults = mode === "natural" 
        ? results.exact 
        : showShorter 
          ? results.shorter 
          : { ...results.exact, ...results.plusOne };

      const textToCopy = Object.entries(activeResults)
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([length, wordList]) => 
          `${length} letras (${wordList.length} palabras):\n${
            wordList.map(w => w.word).join(" ")
          }`
        )
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

  const hasResults = totalWords > 0;

  if (!hasResults) return null;

  return (
    <div className="border rounded-xl p-4 sm:p-6 bg-card/50 backdrop-blur-sm shadow-sm animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="text-base sm:text-lg font-semibold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary/90 to-primary/60">
          {totalWords} palabras
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleCopyResults}
        >
          <Copy className="h-4 w-4" />
          Copiar
        </Button>
      </div>
      <div className="space-y-8">
        {mode === "natural" ? (
          <WordList title="Resultados" words={results.exact} mode={mode} />
        ) : showShorter ? (
          <WordList title="Palabras más cortas" words={results.shorter} mode={mode} />
        ) : (
          <>
            <WordList title="Anagramas exactos" words={results.exact} mode={mode} />
            <WordList title="Palabras con una letra adicional" words={results.plusOne} mode={mode} />
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResults;