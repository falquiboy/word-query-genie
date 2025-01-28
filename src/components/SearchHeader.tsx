const SearchHeader = () => {
  return (
    <div className="space-y-4 text-center">
      <h1 className="text-4xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
        Buscador de Palabras
      </h1>
      <p className="text-muted-foreground max-w-lg mx-auto">
        Busca palabras usando lenguaje natural o sintaxis simple:
        <br />
        - Escribe "palabras con q sin e ni i" para búsqueda en lenguaje natural
        <br />
        - O simplemente escribe letras (ej: "casa") para encontrar anagramas
      </p>
    </div>
  );
};

export default SearchHeader;