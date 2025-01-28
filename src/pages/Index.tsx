import { useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import SearchHeader from "@/components/SearchHeader";
import SearchBar from "@/components/SearchBar";
import SearchResults from "@/components/SearchResults";
import SearchStatus from "@/components/SearchStatus";
import { AnagramResults, WordGroups, WordResult } from "@/types/words";

const Index = () => {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"anagrams" | "natural">("anagrams");
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { data: results, isLoading, error, refetch } = useQuery<AnagramResults>({
    queryKey: ["words", query, mode],
    queryFn: async () => {
      if (!query.trim()) return { exact: {}, plusOne: {}, shorter: {} };
      
      try {
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

          const groupedData = data ? data.reduce((acc: WordGroups, curr: { word: string }) => {
            const length = curr.word.length;
            if (!acc[length]) acc[length] = [];
            acc[length].push({ word: curr.word, is_exact: true });
            return acc;
          }, {}) : {};

          return { exact: groupedData, plusOne: {}, shorter: {} };
        } else {
          const [exactData, plusOneData, shorterData] = await Promise.all([
            supabase.rpc('find_exact_anagrams', { query_text: query }),
            supabase.rpc('find_plus_one_letter', { query_text: query }),
            supabase.rpc('find_shorter_words', { query_text: query })
          ]);

          if (exactData.error) throw exactData.error;
          if (plusOneData.error) throw plusOneData.error;
          if (shorterData.error) throw shorterData.error;

          const groupByLength = (words: Array<{ word: string, word_length?: number }>) => {
            return words.reduce((acc: WordGroups, curr) => {
              const length = curr.word_length ?? curr.word.length;
              if (!acc[length]) acc[length] = [];
              acc[length].push({ word: curr.word, is_exact: true });
              return acc;
            }, {} as WordGroups);
          };

          return {
            exact: groupByLength(exactData.data || []),
            plusOne: groupByLength(plusOneData.data || []),
            shorter: groupByLength(shorterData.data || [])
          };
        }
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

  const totalWords = results ? 
    Object.values(results.exact).concat(
      Object.values(results.plusOne),
      Object.values(results.shorter)
    ).reduce((total: number, wordList) => total + wordList.length, 0) : 0;

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
            onSearch={() => refetch()}
            onToggleRecording={isRecording ? stopRecording : startRecording}
            mode={mode}
          />
          <SearchStatus
            isLoading={isLoading}
            error={error}
            noResults={!!results && totalWords === 0 && !isLoading}
          />
          <SearchResults results={results} totalWords={totalWords} />
        </div>
      </div>
    </div>
  );
};

export default Index;
