import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Mic, MicOff } from "lucide-react";

const Index = () => {
  const [query, setQuery] = useState("");
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Función para detectar el tipo de consulta
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
        // Detectamos el tipo de consulta
        if (isCustomSyntax(query)) {
          return await processCustomSyntax(query);
        }

        // Si no es sintaxis especial, procedemos con el procesamiento de lenguaje natural
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
        
        // Agrupar por longitud y ordenar alfabéticamente dentro de cada grupo
        const groupedData = data ? data.reduce((acc: { [key: number]: string[] }, curr: { word: string }) => {
          const length = curr.word.length;
          if (!acc[length]) acc[length] = [];
          acc[length].push(curr.word);
          return acc;
        }, {}) : {};

        // Ordenar cada grupo alfabéticamente
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

  // Calcular el total de palabras
  const totalWords = words ? Object.values(words).reduce((total: number, wordList: string[]) => total + wordList.length, 0) : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center mb-8">
          Búsqueda de Palabras
        </h1>
        
        <div className="flex gap-2">
          <Input
            placeholder="Describe las palabras que buscas (ej: palabras con q sin e ni i) o usa sintaxis especial"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
            className={isRecording ? "bg-red-100 hover:bg-red-200" : ""}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button onClick={handleSearch}>Buscar</Button>
        </div>

        {isLoading && (
          <div className="text-center text-gray-500">Buscando palabras...</div>
        )}

        {error && (
          <div className="text-center text-red-500">
            Ocurrió un error al buscar las palabras.
          </div>
        )}

        {words && Object.keys(words).length > 0 && (
          <div className="border rounded-lg p-4">
            <div className="text-lg font-semibold mb-4 text-center">
              Total de palabras encontradas: {totalWords}
            </div>
            <h2 className="font-semibold mb-4">Resultados por longitud:</h2>
            <div className="space-y-4">
              {Object.entries(words)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([length, wordList]) => (
                  <div key={length} className="border-t pt-2 first:border-t-0 first:pt-0">
                    <h3 className="font-medium mb-2">{length} letras ({wordList.length} palabras):</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {wordList.map((word: string) => (
                        <div
                          key={word}
                          className="p-2 bg-secondary rounded-md text-center"
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
          <div className="text-center text-gray-500">
            No se encontraron palabras con los criterios especificados.
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
