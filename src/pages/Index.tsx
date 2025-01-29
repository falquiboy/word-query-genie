import { useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import SearchHeader from "@/components/SearchHeader";
import SearchBar from "@/components/SearchBar";
import SearchResults from "@/components/SearchResults";
import SearchStatus from "@/components/SearchStatus";
import { AnagramResults, WordVariation, WordResult } from "@/types/words";

const Index = () => {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"anagrams" | "natural">("anagrams");
  const [showShorter, setShowShorter] = useState(false);
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const processQuery = (inputQuery: string): string => {
    // Only process if it's anagrams mode and there are no wildcards
    if (mode === "anagrams" && !inputQuery.includes('*')) {
      console.log('Processing query:', inputQuery);
      const letters = inputQuery.split('');
      const bestPosition = Math.floor(letters.length / 2);
      return [...letters.slice(0, bestPosition), '*', ...letters.slice(bestPosition)].join('');
    }
    return inputQuery;
  };

  const { data: results, isLoading, error, refetch } = useQuery({
    queryKey: ["words", query, mode],
    queryFn: async () => {
      if (!query.trim()) return { exact: {}, plusOne: {}, shorter: {} } as AnagramResults;
      
      try {
        console.log('Iniciando búsqueda con modo:', mode, 'y query:', query);
        
        if (mode === "natural") {
          const { data: sqlData, error: sqlError } = await supabase.functions.invoke('natural-to-sql', {
            body: { query: query }
          });

          if (sqlError) throw sqlError;
          if (!sqlData?.sqlQuery) throw new Error('No se pudo generar la consulta SQL');

          console.log('Consulta SQL generada:', sqlData.sqlQuery);

          const { data, error } = await supabase
            .rpc('execute_natural_search', {
              query_text: sqlData.sqlQuery
            });

          if (error) {
            console.error('Error en execute_natural_search:', error);
            if (error.message?.includes('statement timeout')) {
              throw new Error('La consulta tardó demasiado tiempo. Por favor, intenta una búsqueda más específica.');
            }
            throw error;
          }

          const groupedData: Record<string, WordResult[]> = {};
          data?.forEach((item) => {
            if (!item || typeof item.word !== 'string') return;
            const length = item.word.length.toString();
            if (!groupedData[length]) groupedData[length] = [];
            groupedData[length].push({ word: item.word, is_exact: true });
          });

          return { exact: groupedData, plusOne: {}, shorter: {} } as AnagramResults;
        } 
        else {
          const processedQuery = processQuery(query);
          console.log('Ejecutando find_word_variations con:', processedQuery);
          
          const { data, error } = await supabase.rpc('find_word_variations', {
            input_text: processedQuery
          });

          if (error) {
            console.error('Error en find_word_variations:', error);
            throw error;
          }

          console.log('Resultados recibidos:', data);

          const results: AnagramResults = {
            exact: {},
            plusOne: {},
            shorter: {}
          };

          (data as WordVariation[])?.forEach((item) => {
            if (!item || typeof item.word !== 'string') return;
            
            const length = item.word.length.toString();
            const targetGroup = results.exact;

            if (!targetGroup[length]) {
              targetGroup[length] = [];
            }

            // Calculate wildcard positions based on the original query
            const wildcardPositions = processedQuery.split('').reduce((positions: number[], char, index) => {
              if (char === '*') positions.push(index);
              return positions;
            }, []);
            
            targetGroup[length].push({
              word: item.word,
              is_exact: item.variation_type === 'exact',
              wildcard_positions: wildcardPositions
            });
          });

          console.log('Resultados procesados:', results);
          return results;
        }
      } catch (error: any) {
        console.error('Error detallado:', error);
        const errorMessage = error.message || "No se pudo ejecutar la consulta. Por favor, inténtalo de nuevo.";
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage,
        });
        throw error;
      }
    },
    enabled: false,
    retry: false,
  });

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

  const totalWords = results ? 
    Object.values(results.exact).concat(
      Object.values(results.plusOne),
      showShorter ? Object.values(results.shorter) : []
    ).reduce((total: number, wordList) => total + wordList.length, 0) : 0;

  const hasShorterWords = results && Object.keys(results.shorter).length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <SearchHeader mode={mode} onModeChange={setMode} />
          <SearchBar
            query={query}
            setQuery={setQuery}
            isRecording={isRecording}
            isLoading={isLoading}
            onSearch={refetch}
            onToggleRecording={isRecording ? stopRecording : startRecording}
            mode={mode}
            showShorter={showShorter}
            onShowShorterChange={setShowShorter}
            hasShorterWords={hasShorterWords}
          />
          <SearchStatus
            isLoading={isLoading}
            error={error}
            noResults={!!results && totalWords === 0 && !isLoading}
          />
          <SearchResults 
            results={results} 
            totalWords={totalWords}
            showShorter={showShorter}
            mode={mode}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
