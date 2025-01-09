import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ChatMessage } from "@/components/ui/chat-message";

interface Message {
  id: string;
  content: string;
  isAI: boolean;
  sqlProposal?: string;
}

const Index = () => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();

  const { data: words, isLoading, error, refetch } = useQuery({
    queryKey: ["words", query],
    queryFn: async () => {
      if (!query.trim()) return [];
      
      try {
        const { data: sqlData, error: sqlError } = await supabase.functions.invoke('natural-to-sql', {
          body: { query: query }
        });

        if (sqlError) throw sqlError;
        if (!sqlData?.sqlQuery) throw new Error('No se pudo generar la consulta SQL');

        // Añadir mensaje de la AI con la propuesta SQL
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: "Entiendo tu consulta. Te propongo esta consulta SQL:",
          isAI: true,
          sqlProposal: sqlData.sqlQuery
        }]);

        console.log('Consulta SQL generada:', sqlData.sqlQuery);

        const { data, error } = await supabase
          .rpc('execute_natural_query', {
            query_text: sqlData.sqlQuery
          });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo ejecutar la consulta. Por favor, inténtalo de nuevo.",
        });
        return [];
      }
    },
    enabled: false,
  });

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, ingresa una consulta.",
      });
      return;
    }

    // Añadir mensaje del usuario
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      content: query,
      isAI: false
    }]);

    refetch();
  };

  const handleRefine = () => {
    // Por ahora solo limpiamos el input para una nueva consulta
    setQuery("");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center mb-8">
          Búsqueda de Palabras
        </h1>
        
        <div className="flex gap-2 mb-6">
          <Input
            placeholder="Describe las palabras que buscas (ej: palabras con q sin e ni i)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch}>Buscar</Button>
        </div>

        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              content={message.content}
              isAI={message.isAI}
              sqlProposal={message.sqlProposal}
              onExecuteSQL={handleSearch}
              onRefine={handleRefine}
            />
          ))}
        </div>

        {isLoading && (
          <div className="text-center text-gray-500">Buscando palabras...</div>
        )}

        {error && (
          <div className="text-center text-red-500">
            Ocurrió un error al buscar las palabras.
          </div>
        )}

        {words && words.length > 0 && (
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Resultados ({words.length} palabras):</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {words.map((result: { word: string }) => (
                <div
                  key={result.word}
                  className="p-2 bg-secondary rounded-md text-center"
                >
                  {result.word}
                </div>
              ))}
            </div>
          </div>
        )}

        {words && words.length === 0 && !isLoading && (
          <div className="text-center text-gray-500">
            No se encontraron palabras con los criterios especificados.
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;