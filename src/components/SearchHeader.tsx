import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SearchHeaderProps {
  mode: "anagrams" | "natural";
  onModeChange: (mode: "anagrams" | "natural") => void;
}

const SearchHeader = ({ mode, onModeChange }: SearchHeaderProps) => {
  return (
    <div className="space-y-6 text-center">
      <h1 className="text-3xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
        Buscador de Palabras
      </h1>
      <Tabs value={mode} onValueChange={(value) => onModeChange(value as "anagrams" | "natural")} className="w-full max-w-md mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="anagrams">Anagramas</TabsTrigger>
          <TabsTrigger value="natural">Listas</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default SearchHeader;