import React from "react";

const SearchHeader = () => {
  return (
    <div className="text-center space-y-4">
      <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary/90 to-primary/60 animate-fade-in">
        Búsqueda de Palabras
      </h1>
      <p className="text-muted-foreground animate-fade-in delay-100">
        Describe las palabras que buscas o usa el micrófono para dictar tu consulta
      </p>
    </div>
  );
};

export default SearchHeader;