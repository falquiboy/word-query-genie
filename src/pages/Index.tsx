import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";

interface Message {
  id: number;
  text: string;
  isUser: boolean;
}

const Index = () => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const { toast } = useToast();

  const { data: words, isLoading, error, refetch } = useQuery({
    queryKey: ["words", query],
    queryFn: async () => {
      if (!query.trim()) return [];
      
      try {
        console.log('Iniciando búsqueda con query:', query);
        
        const { data: sqlData, error: sqlError } = await supabase.functions.invoke('natural-to-sql', {
          body: { query: query }
        });

        if (sqlError) {
          console.error('Error al generar SQL:', sqlError);
          throw sqlError;
        }
        
        if (!sqlData?.sqlQuery) {
          console.error('No se generó consulta SQL');
          throw new Error('No se pudo generar la consulta SQL');
        }

        console.log('Consulta SQL generada:', sqlData.sqlQuery);

        const { data, error } = await supabase
          .rpc('execute_natural_query', {
            query_text: sqlData.sqlQuery
          });

        if (error) {
          console.error('Error al ejecutar consulta:', error);
          throw error;
        }

        console.log('Resultados obtenidos:', data);
        return data || [];
      } catch (error) {
        console.error('Error en la búsqueda:', error);
        toast({
          variant: "destructive",
          title: "Error en la búsqueda",
          description: "Hubo un problema al procesar tu consulta. Por favor, inténtalo de nuevo.",
        });
        return [];
      }
    },
    enabled: false,
    retry: 1,
    retryDelay: 1000,
  });

  const handleSearch = async () => {
    if (!messageInput.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, ingresa un mensaje.",
      });
      return;
    }

    // Agregar mensaje del usuario al chat
    const userMessage: Message = {
      id: messages.length,
      text: messageInput,
      isUser: true,
    };
    setMessages(prev => [...prev, userMessage]);

    // Actualizar la consulta y ejecutar la búsqueda
    setQuery(messageInput);
    setMessageInput("");
    
    try {
      await refetch();
    } catch (error) {
      console.error('Error al refrescar la consulta:', error);
    }

    // Agregar respuesta del sistema
    const systemMessage: Message = {
      id: messages.length + 1,
      text: words && words.length > 0 
        ? `He encontrado ${words.length} palabra(s) que coinciden con tu búsqueda. ¿Quieres refinar más tu búsqueda?`
        : "No encontré palabras que coincidan con esos criterios. ¿Quieres intentar con otros criterios?",
      isUser: false,
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Búsqueda Conversacional de Palabras
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sección de Chat */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <ScrollArea className="h-[400px] w-full pr-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`rounded-lg px-4 py-2 max-w-[80%] ${
                          message.isUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="flex gap-2 mt-4">
                <Input
                  placeholder="Describe las palabras que buscas..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
                <Button onClick={handleSearch}>Enviar</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sección de Resultados */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              {isLoading && (
                <div className="text-center text-gray-500">Buscando palabras...</div>
              )}

              {error && (
                <div className="text-center text-red-500">
                  Ocurrió un error al buscar las palabras.
                </div>
              )}

              {words && words.length > 0 && (
                <div>
                  <h2 className="font-semibold mb-2">Resultados ({words.length} palabras):</h2>
                  <ScrollArea className="h-[400px]">
                    <div className="grid grid-cols-2 gap-2">
                      {words.map((result: { word: string }) => (
                        <div
                          key={result.word}
                          className="p-2 bg-secondary rounded-md text-center"
                        >
                          {result.word}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {words && words.length === 0 && !isLoading && (
                <div className="text-center text-gray-500">
                  No se encontraron palabras con los criterios especificados.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;