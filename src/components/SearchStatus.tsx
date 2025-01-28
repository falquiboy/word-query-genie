import React from "react";

interface SearchStatusProps {
  isLoading: boolean;
  error: unknown;
  noResults: boolean;
}

const SearchStatus = ({ isLoading, error, noResults }: SearchStatusProps) => {
  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground animate-pulse">
        Buscando palabras...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive bg-destructive/10 p-4 rounded-lg animate-fade-in">
        Ocurrió un error al buscar las palabras.
      </div>
    );
  }

  if (noResults) {
    return (
      <div className="text-center text-muted-foreground bg-secondary/50 p-6 rounded-xl animate-fade-in">
        No se encontraron palabras con los criterios especificados.
      </div>
    );
  }

  return null;
};

export default SearchStatus;