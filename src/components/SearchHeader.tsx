import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SearchHeaderProps {
  mode: "anagrams" | "natural";
  onModeChange: (mode: "anagrams" | "natural") => void;
}

const SearchHeader = ({ mode, onModeChange }: SearchHeaderProps) => {
  return (
    <div className="space-y-6 text-center">
      <h1 className="text-4xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
        Buscador de Palabras
      </h1>
      <Tabs value={mode} onValueChange={(value) => onModeChange(value as "anagrams" | "natural")} className="w-full max-w-md mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="anagrams">Búsqueda de anagramas</TabsTrigger>
          <TabsTrigger value="natural">Generador de listas</TabsTrigger>
        </TabsList>
      </Tabs>
      <p className="text-muted-foreground max-w-lg mx-auto">
        {mode === "anagrams" ? (
          "Escribe las letras que quieres usar para encontrar anagramas. Por ejemplo, escribe 'casa' para encontrar todas las palabras que se pueden formar con esas letras exactas."
        ) : (
          "Describe en lenguaje natural las palabras que buscas. Por ejemplo: 'palabras con q sin e ni i' o 'palabras que empiezan con pre'."
        )}
      </p>
    </div>
  );
};

export default SearchHeader;