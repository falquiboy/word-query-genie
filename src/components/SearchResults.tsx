import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { WordGroups } from "@/types/words";
import { ArrowDownToLine, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SearchResultsProps {
  results: Record<string, WordGroups>;
  isLoading: boolean;
  mode: "anagrams" | "natural";
}

const WordList = ({ title, words, mode }: { title: string; words: WordGroups; mode: "anagrams" | "natural" }) => {
  if (!words || Object.keys(words).length === 0) return null;

  const entries = Object.entries(words).sort(([a], [b]) => Number(b) - Number(a));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      {entries.map(([key, items]) => (
        <div key={key} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {mode === "anagrams" ? `${items.length} palabra${items.length === 1 ? "" : "s"}` : key}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {items.map((item, index) => (
              <a
                key={`${item.word}-${index}`}
                href={`https://dle.rae.es/${item.word}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-secondary/50 hover:bg-secondary/80 rounded-md text-center transition-colors duration-200 hover:scale-105 transform"
              >
                {item.word}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const SearchResults = ({ results, isLoading, mode }: SearchResultsProps) => {
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="border rounded-xl p-6 bg-card/50 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-center">
          <div className="animate-pulse space-y-4 w-full">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-8 bg-muted rounded col-span-1"></div>
              <div className="h-8 bg-muted rounded col-span-1"></div>
              <div className="h-8 bg-muted rounded col-span-1"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasResults = Object.values(results).some((group) => Object.keys(group).length > 0);

  if (!hasResults) return null;

  return (
    <div className="border rounded-xl p-6 bg-card/50 backdrop-blur-sm shadow-sm animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Resultados</h2>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            const text = Object.values(results)
              .flatMap((group) => Object.values(group))
              .flatMap((items) => items.map((item) => item.word))
              .join("\n");
            navigator.clipboard.writeText(text);
            toast({
              title: "¡Copiado!",
              description: "Las palabras se han copiado al portapapeles",
            });
          }}
        >
          <Copy className="w-4 h-4" />
          <span className="hidden sm:inline">Copiar</span>
        </Button>
      </div>
      <div className="space-y-6">
        {mode === "natural" ? (
          <WordList title="Resultados" words={results.natural} mode={mode} />
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