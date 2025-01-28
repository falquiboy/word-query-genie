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
      console.error('Error: OPENAI_API_KEY no está configurada');
      throw new Error('OPENAI_API_KEY no está configurada');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { query } = await req.json();
    
    if (!query) {
      console.error('Error: No se proporcionó una consulta');
      throw new Error('No se proporcionó una consulta');
    }

    console.log('Procesando consulta:', query);

    // Si la consulta solo contiene letras (incluyendo ñ/Ñ), es una búsqueda de anagramas
    if (query.match(/^[A-Za-zÑñ]+$/)) {
      console.log('Detectada búsqueda de anagramas, retornando consulta directa');
      return new Response(
        JSON.stringify({ sqlQuery: query }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Primero, buscar consultas similares en el historial
    const { data: historicalQueries, error: historyError } = await supabase
      .from('query_history')
      .select('*')
      .eq('natural_query', query)
      .eq('successful', true)
      .limit(1);

    if (historyError) {
      console.error('Error al buscar en el historial:', historyError);
    } else if (historicalQueries && historicalQueries.length > 0) {
      console.log('Consulta encontrada en el historial:', historicalQueries[0]);
      return new Response(
        JSON.stringify({ sqlQuery: historicalQueries[0].sql_query }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Enviando consulta a OpenAI...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-0125-preview',
        messages: [
          {
            role: 'system',
            content: `Eres un experto en SQL que convierte consultas en lenguaje natural a consultas SQL válidas.
            Las consultas deben ser sobre la tabla 'words' que tiene una columna 'word' de tipo texto.
            SOLO debes devolver la consulta SQL, nada más.
            
            Ejemplos:
            - Para "palabras con q sin e ni i" deberías devolver: SELECT word FROM words WHERE word ILIKE '%q%' AND word NOT ILIKE '%e%' AND word NOT ILIKE '%i%' ORDER BY word
            - Para "palabras que empiezan con a" deberías devolver: SELECT word FROM words WHERE word ILIKE 'a%' ORDER BY word
            - Para "palabras de 5 letras" deberías devolver: SELECT word FROM words WHERE LENGTH(word) = 5 ORDER BY word
            - Para "palabras que terminan en ción" deberías devolver: SELECT word FROM words WHERE word ILIKE '%ción' ORDER BY word
            - Para "palabras que contienen pre" deberías devolver: SELECT word FROM words WHERE word ILIKE '%pre%' ORDER BY word
            - Para "palabras que tienen bt" deberías devolver: SELECT word FROM words WHERE word ILIKE '%bt%' ORDER BY word
            - Para "contiene bt" deberías devolver: SELECT word FROM words WHERE word ILIKE '%bt%' ORDER BY word
            - Para "tiene bt" deberías devolver: SELECT word FROM words WHERE word ILIKE '%bt%' ORDER BY word
            - Para "palabras con z" deberías devolver: SELECT word FROM words WHERE word ILIKE '%z%' ORDER BY word
            - Para "palabras que empiezan con pre y terminan en ción" deberías devolver: SELECT word FROM words WHERE word ILIKE 'pre%' AND word ILIKE '%ción' ORDER BY word
            - Para "palabras de 4 letras que empiezan con a" deberías devolver: SELECT word FROM words WHERE LENGTH(word) = 4 AND word ILIKE 'a%' ORDER BY word
            
            Reglas importantes:
            1. SIEMPRE usa ILIKE para hacer las búsquedas case-insensitive
            2. NUNCA uses LIKE, siempre ILIKE
            3. Para búsquedas de contenido usa %texto%
            4. Para búsquedas de inicio usa texto%
            5. Para búsquedas de final usa %texto
            6. NO incluyas explicaciones, SOLO la consulta SQL.
            7. SIEMPRE incluye la palabra completa en el SELECT: SELECT word
            8. SIEMPRE usa ORDER BY word para ordenar los resultados alfabéticamente`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.1,
        max_tokens: 150
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error de OpenAI. Status:', response.status);
      console.error('Respuesta de error:', errorText);
      throw new Error(`Error al procesar la consulta con OpenAI. Status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Respuesta completa de OpenAI:', JSON.stringify(data, null, 2));

    if (!data.choices?.[0]?.message?.content) {
      console.error('Respuesta inválida de OpenAI:', JSON.stringify(data, null, 2));
      throw new Error('Respuesta inválida de OpenAI');
    }

    const sqlQuery = data.choices[0].message.content.trim();
    console.log('SQL generado:', sqlQuery);

    // Validar la consulta SQL generada
    try {
      const { data: testData, error: testError } = await supabase.rpc('execute_natural_query', {
        query_text: sqlQuery
      });

      if (!testError) {
        // Guardar la consulta exitosa en el historial
        const { error: insertError } = await supabase
          .from('query_history')
          .insert({
            natural_query: query,
            sql_query: sqlQuery,
            successful: true
          });

        if (insertError) {
          console.error('Error al guardar la consulta en el historial:', insertError);
        }
      } else {
        // Guardar el error en el historial
        const { error: insertError } = await supabase
          .from('query_history')
          .insert({
            natural_query: query,
            sql_query: sqlQuery,
            successful: false,
            error_message: testError.message
          });

        if (insertError) {
          console.error('Error al guardar el error en el historial:', insertError);
        }
        throw testError;
      }
    } catch (error) {
      console.error('Error al validar la consulta SQL:', error);
      throw error;
    }

    return new Response(JSON.stringify({ sqlQuery }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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