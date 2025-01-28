import { useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import SearchHeader from "@/components/SearchHeader";
import SearchBar from "@/components/SearchBar";
import SearchResults from "@/components/SearchResults";
import SearchStatus from "@/components/SearchStatus";

const Index = () => {
  const [query, setQuery] = useState("");
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [currentQueryId, setCurrentQueryId] = useState<string | undefined>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const isCustomSyntax = (query: string): boolean => {
    return /^[A-Za-zÑñ]+$/.test(query);
  };

  const { data: words, isLoading, error, refetch } = useQuery({
    queryKey: ["words", query],
    queryFn: async () => {
      if (!query.trim()) return {};
      
      try {
        let sqlQuery = query;
        
        if (!isCustomSyntax(query)) {
          const { data: sqlData, error: sqlError } = await supabase.functions.invoke('natural-to-sql', {
            body: { query: query }
          });

          if (sqlError) throw sqlError;
          if (!sqlData?.sqlQuery) throw new Error('No se pudo generar la consulta SQL');

          console.log('Consulta SQL generada:', sqlData.sqlQuery);
          sqlQuery = sqlData.sqlQuery;
        }

        // Guardar la consulta en el historial
        const { data: historyData, error: historyError } = await supabase
          .from('query_history')
          .insert({
            natural_query: query,
            sql_query: sqlQuery,
            successful: true
          })
          .select('id')
          .single();

        if (historyError) throw historyError;
        
        setCurrentQueryId(historyData.id);

        console.log('Ejecutando consulta:', sqlQuery);
        const { data, error } = await supabase
          .rpc('execute_natural_query', {
            query_text: sqlQuery
          });

        if (error) {
          console.error('Error en execute_natural_query:', error);
          if (error.message?.includes('statement timeout')) {
            throw new Error('La consulta tardó demasiado tiempo. Por favor, intenta una búsqueda más específica.');
          }
          throw error;
        }

        console.log('Resultados obtenidos:', data);
        
        // Agrupar los resultados por longitud y tipo (exacto o similar)
        const groupedData = data ? data.reduce((acc: { [key: number]: { exact: string[], similar: string[] } }, curr: { word: string, is_exact: boolean }) => {
          const length = curr.word.length;
          if (!acc[length]) {
            acc[length] = { exact: [], similar: [] };
          }
          if (curr.is_exact) {
            acc[length].exact.push(curr.word);
          } else {
            acc[length].similar.push(curr.word);
          }
          return acc;
        }, {}) : {};

        // Ordenar las palabras dentro de cada grupo
        Object.values(groupedData).forEach(group => {
          group.exact.sort();
          group.similar.sort();
        });

        return groupedData;
      } catch (error: any) {
        console.error('Error detallado:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "No se pudo ejecutar la consulta. Por favor, inténtalo de nuevo.",
        });
        throw error;
      }
    },
    enabled: false,
    retry: false,
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

  const totalWords = words ? Object.values(words).reduce((total: number, { exact, similar }) => 
    total + exact.length + similar.length, 0) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <SearchHeader />
          <SearchBar
            query={query}
            setQuery={setQuery}
            isRecording={isRecording}
            isLoading={isLoading}
            onSearch={handleSearch}
            onToggleRecording={isRecording ? stopRecording : startRecording}
          />
          <SearchStatus
            isLoading={isLoading}
            error={error}
            noResults={!!words && Object.keys(words).length === 0 && !isLoading}
          />
          <SearchResults 
            words={words} 
            totalWords={totalWords}
            queryId={currentQueryId}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
