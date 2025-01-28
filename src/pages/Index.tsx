import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Mic, MicOff, Search, Loader2 } from "lucide-react";

const Index = () => {
  const [query, setQuery] = useState("");
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const isCustomSyntax = (query: string): boolean => {
    // Por ahora retornamos false para mantener el comportamiento de lenguaje natural
    // Aquí implementaremos la detección de la sintaxis especial
    return false;
  };

  // Función para procesar consultas con sintaxis especial
  const processCustomSyntax = async (query: string) => {
    // Aquí implementaremos el procesamiento de la sintaxis especial
    // Por ahora, lanzamos un error para indicar que no está implementado
    throw new Error("Sintaxis especial aún no implementada");
  };

  const { data: words, isLoading, error, refetch } = useQuery({
    queryKey: ["words", query],
    queryFn: async () => {
      if (!query.trim()) return [];
      
      try {
        if (isCustomSyntax(query)) {
          return await processCustomSyntax(query);
        }

        const { data: sqlData, error: sqlError } = await supabase.functions.invoke('natural-to-sql', {
          body: { query: query }
        });

        if (sqlError) throw sqlError;
        if (!sqlData?.sqlQuery) throw new Error('No se pudo generar la consulta SQL');

        console.log('Consulta SQL generada:', sqlData.sqlQuery);

        const { data, error } = await supabase
          .rpc('execute_natural_query', {
            query_text: sqlData.sqlQuery
          });

        if (error) throw error;
        
        const groupedData = data ? data.reduce((acc: { [key: number]: string[] }, curr: { word: string }) => {
          const length = curr.word.length;
          if (!acc[length]) acc[length] = [];
          acc[length].push(curr.word);
          return acc;
        }, {}) : {};

        Object.keys(groupedData).forEach(length => {
          groupedData[Number(length)].sort();
        });

        return groupedData;
      } catch (error) {
        console.error('Error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo ejecutar la consulta. Por favor, inténtalo de nuevo.",
        });
        return {};
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
    refetch();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        
        reader.onloadend = async () => {
          try {
            const base64Audio = (reader.result as string).split(',')[1];
            
            const { data, error } = await supabase.functions.invoke('voice-to-text', {
              body: { audio: base64Audio }
            });

            if (error) throw error;
            if (data.text) {
              setQuery(prevQuery => prevQuery + ' ' + data.text.trim());
            }

          } catch (error) {
            console.error('Error processing voice:', error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "No se pudo procesar el audio. Por favor, inténtalo de nuevo.",
            });
          }
        };

        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo acceder al micrófono. Por favor, verifica los permisos.",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const totalWords = words ? Object.values(words).reduce((total: number, wordList: string[]) => total + wordList.length, 0) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary/90 to-primary/60 animate-fade-in">
              Búsqueda de Palabras
            </h1>
            <p className="text-muted-foreground animate-fade-in delay-100">
              Describe las palabras que buscas o usa el micrófono para dictar tu consulta
            </p>
          </div>
          
          <div className="relative animate-fade-in delay-200">
            <div className="flex gap-2">
              <Input
                placeholder="Ej: palabras con q sin e ni i"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 h-12 text-lg shadow-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={isRecording ? stopRecording : startRecording}
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
                onClick={handleSearch} 
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

          {isLoading && (
            <div className="text-center text-muted-foreground animate-pulse">
              Buscando palabras...
            </div>
          )}

          {error && (
            <div className="text-center text-destructive bg-destructive/10 p-4 rounded-lg animate-fade-in">
              Ocurrió un error al buscar las palabras.
            </div>
          )}

          {words && Object.keys(words).length > 0 && (
            <div className="border rounded-xl p-6 bg-card/50 backdrop-blur-sm shadow-sm animate-fade-in">
              <div className="text-lg font-semibold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary/90 to-primary/60">
                Total de palabras encontradas: {totalWords}
              </div>
              <div className="space-y-6">
                {Object.entries(words)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([length, wordList]) => (
                    <div key={length} className="border-t pt-4 first:border-t-0 first:pt-0">
                      <h3 className="font-medium mb-3 text-muted-foreground">
                        {length} letras ({wordList.length} palabras):
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {wordList.map((word: string) => (
                          <div
                            key={word}
                            className="p-2 bg-secondary/50 hover:bg-secondary/80 rounded-md text-center transition-colors duration-200 hover:scale-105 transform"
                          >
                            {word}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {words && Object.keys(words).length === 0 && !isLoading && (
            <div className="text-center text-muted-foreground bg-secondary/50 p-6 rounded-xl animate-fade-in">
              No se encontraron palabras con los criterios especificados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
