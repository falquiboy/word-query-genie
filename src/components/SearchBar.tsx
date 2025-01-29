import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Mic } from "lucide-react";
import { Toggle } from "./ui/toggle";

interface SearchBarProps {
  query: string;
  setQuery: (query: string) => void;
  isRecording: boolean;
  isLoading: boolean;
  onSearch: () => void;
  onToggleRecording: () => void;
  mode: "anagrams" | "natural";
  showShorter?: boolean;
  onShowShorterChange?: (show: boolean) => void;
  hasShorterWords?: boolean;
}

const SearchBar = ({
  query,
  setQuery,
  isRecording,
  isLoading,
  onSearch,
  onToggleRecording,
  mode,
  showShorter = false,
  onShowShorterChange,
  hasShorterWords = false,
}: SearchBarProps) => {
  const placeholder = mode === "anagrams" 
    ? "Ej: c*sa o *eocrns (usa * como comodín)" 
    : "Ej: palabras con q sin e ni i";

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      onSearch();
    }
  };

  return (
    <div className="relative animate-fade-in delay-200 space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 h-10 text-base shadow-sm"
        />
        {mode === "natural" && (
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleRecording}
            className={`h-10 w-10 transition-colors duration-200 shadow-sm ${
              isRecording ? "bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-800/50" : ""
            }`}
          >
            <Mic className="h-4 w-4" />
          </Button>
        )}
        <Button 
          onClick={onSearch} 
          size="icon"
          className="h-10 w-10 shadow-sm"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>
      {mode === "anagrams" && hasShorterWords && (
        <div className="flex items-center justify-center">
          <Button
            variant="outline"
            size="sm"
            className={`transition-colors duration-200 ${
              showShorter ? "bg-accent text-accent-foreground" : ""
            }`}
            onClick={() => onShowShorterChange?.(!showShorter)}
          >
            Mostrar solo palabras más cortas
          </Button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;