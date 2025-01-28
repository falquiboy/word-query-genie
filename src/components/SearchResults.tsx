import React from "react";
import AdUnit from "./AdUnit";

interface SearchResultsProps {
  words: { [key: string]: string[] } | null;
  totalWords: number;
}

const SearchResults = ({ words, totalWords }: SearchResultsProps) => {
  if (!words || Object.keys(words).length === 0) return null;

  const entries = Object.entries(words).sort(([a], [b]) => Number(a) - Number(b));

  return (
    <div className="border rounded-xl p-6 bg-card/50 backdrop-blur-sm shadow-sm animate-fade-in">
      <div className="text-lg font-semibold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary/90 to-primary/60">
        Total de palabras encontradas: {totalWords}
      </div>
      <div className="space-y-6">
        {entries.map(([length, wordList], index) => (
          <React.Fragment key={length}>
            <div className="border-t pt-4 first:border-t-0 first:pt-0">
              <h3 className="font-medium mb-3 text-muted-foreground">
                {length} letras ({wordList.length} palabras):
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {wordList.map((word: string) => (
                  <div
                    key={word}
                    className="p-2 bg-secondary/50 hover:bg-secondary/80 rounded-md text-center transition-colors duration-200 hover:scale-105 transform"
                  >
                    {word}
                  </div>
                ))}
              </div>
            </div>
            {/* Insertar anuncio cada 3 grupos de palabras */}
            {(index + 1) % 3 === 0 && index < entries.length - 1 && (
              <AdUnit
                slot="1234567890" // Reemplazar con tu slot ID real
                className="animate-fade-in"
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;