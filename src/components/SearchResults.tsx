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

const findExtraLetter = (baseWord: string, longerWord: string): number => {
  const baseChars = baseWord.toLowerCase().split('').sort();
  const longerChars = longerWord.toLowerCase().split('').sort();
  
  for (let i = 0; i < longerChars.length; i++) {
    const char = longerChars[i];
    const index = baseChars.indexOf(char);
    if (index === -1) {
      return longerWord.toLowerCase().indexOf(char);
    }
    baseChars.splice(index, 1);
  }
  return -1;
};

const WordWithHighlight = ({ word, originalWord }: { word: string, originalWord?: string }) => {
  if (!originalWord) return <span>{word}</span>;
  
  const extraLetterIndex = findExtraLetter(originalWord, word);
  if (extraLetterIndex === -1) return <span>{word}</span>;
  
  return (
    <span>
      {word.slice(0, extraLetterIndex)}
      <span className="text-destructive font-semibold">{word[extraLetterIndex]}</span>
      {word.slice(extraLetterIndex + 1)}
    </span>
  );
};

const WordList = ({ title, words, mode, originalWord }: { title: string; words: WordGroups; mode: "anagrams" | "natural", originalWord?: string }) => {
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {wordList.map((item) => (
              <a
                key={item.word}
                href={`https://dle.rae.es/${item.word.toLowerCase()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-secondary/50 hover:bg-secondary/80 rounded-md text-center transition-colors duration-200 hover:scale-105 transform"
              >
                <WordWithHighlight word={item.word} originalWord={originalWord} />
              </a>
            ))}
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
            wordList.map(w => w.word).join(", ")
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

  // Obtener la palabra original de los resultados exactos
  const originalWord = Object.values(results.exact)[0]?.[0]?.word || '';

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
      <div className="space-y-8">
        {mode === "natural" ? (
          <WordList title="Resultados" words={results.exact} mode={mode} />
        ) : showShorter ? (
          <WordList title="Palabras más cortas" words={results.shorter} mode={mode} />
        ) : (
          <>
            <WordList title="Anagramas exactos" words={results.exact} mode={mode} />
            <WordList title="Palabras con una letra adicional" words={results.plusOne} mode={mode} originalWord={originalWord} />
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResults;