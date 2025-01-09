import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY no está configurada');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { query, previousMessages = [] } = await req.json();
    
    if (!query) {
      throw new Error('No se proporcionó una consulta');
    }

    console.log('Procesando consulta:', query);
    console.log('Mensajes previos:', previousMessages);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Eres un asistente experto en SQL y palabras en español que ayuda a buscar palabras específicas.
            Las consultas deben ser sobre la tabla 'words' que tiene una columna 'word' de tipo texto.
            Debes analizar la consulta del usuario y:
            1. Si la consulta es clara, devolver un objeto JSON con:
               - sqlQuery: la consulta SQL correspondiente
               - followUp: null
            2. Si la consulta es ambigua o podrías sugerir mejoras, devolver:
               - sqlQuery: null
               - followUp: una pregunta o sugerencia para mejorar la búsqueda
            3. Si entiendes la consulta pero no hay resultados, sugiere alternativas:
               - sqlQuery: la consulta SQL original
               - followUp: sugerencias de búsquedas alternativas
            
            Ejemplos de respuestas:
            1. Query clara: {"sqlQuery": "SELECT word FROM words WHERE LENGTH(word) = 5", "followUp": null}
            2. Query ambigua: {"sqlQuery": null, "followUp": "¿Te refieres a palabras que empiezan con 'a' o que contienen 'a' en cualquier posición?"}
            3. Sin resultados: {"sqlQuery": "SELECT word FROM words WHERE word LIKE '%xyz%'", "followUp": "No encontré palabras con 'xyz'. ¿Te gustaría buscar palabras con 'xy' o 'yz' por separado?"}`
          },
          ...previousMessages,
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.1,
        max_tokens: 200
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error de OpenAI:', response.status, errorData);
      throw new Error(`Error al procesar la consulta con OpenAI. Status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Respuesta de OpenAI:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Respuesta inválida de OpenAI');
    }

    try {
      const aiResponse = JSON.parse(data.choices[0].message.content);
      console.log('Respuesta parseada:', aiResponse);
      
      return new Response(JSON.stringify(aiResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Error al parsear la respuesta:', parseError);
      throw new Error('Formato de respuesta inválido');
    }
  } catch (error) {
    console.error('Error en la función natural-to-sql:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error interno del servidor',
        details: error.toString(),
        timestamp: new Date().toISOString()
      }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});