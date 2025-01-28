import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Search, Loader2 } from "lucide-react";

interface SearchBarProps {
  query: string;
  setQuery: (query: string) => void;
  isRecording: boolean;
  isLoading: boolean;
  onSearch: () => void;
  onToggleRecording: () => void;
  mode: "anagrams" | "natural";
}

const SearchBar = ({
  query,
  setQuery,
  isRecording,
  isLoading,
  onSearch,
  onToggleRecording,
  mode,
}: SearchBarProps) => {
  const placeholder = mode === "anagrams" 
    ? "Ej: casa" 
    : "Ej: palabras con q sin e ni i";

  return (
    <div className="relative animate-fade-in delay-200">
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 h-12 text-lg shadow-sm"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleRecording}
          className={`h-12 w-12 transition-colors duration-200 shadow-sm ${
            isRecording ? "bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-800/50" : ""
          }`}
        >
          {isRecording ? 
            <MicOff className="h-5 w-5 text-red-500" /> : 
            <Mic className="h-5 w-5" />
          }
        </Button>
        <Button 
          onClick={onSearch} 
          className="h-12 px-6 shadow-sm"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Search className="h-5 w-5 mr-2" />
              Buscar
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;