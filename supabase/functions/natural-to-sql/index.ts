import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    console.log('Procesando consulta:', query);

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: `Eres un experto en SQL que convierte consultas en lenguaje natural a consultas SQL válidas.
            Las consultas deben ser sobre la tabla 'words' que tiene una columna 'word' de tipo texto.
            SOLO debes devolver la consulta SQL, nada más.
            Por ejemplo:
            - Para "palabras con q sin e ni i" deberías devolver: SELECT word FROM words WHERE word LIKE '%q%' AND word NOT LIKE '%e%' AND word NOT LIKE '%i%'
            - Para "palabras que empiezan con a" deberías devolver: SELECT word FROM words WHERE word LIKE 'a%'
            - Para "palabras de 5 letras" deberías devolver: SELECT word FROM words WHERE LENGTH(word) = 5
            NO incluyas explicaciones, SOLO la consulta SQL.`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.1,
        max_tokens: 100
      }),
    });

    const data = await response.json();
    const sqlQuery = data.choices[0].message.content.trim();

    console.log('SQL generado:', sqlQuery);

    return new Response(JSON.stringify({ sqlQuery }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en la función natural-to-sql:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});