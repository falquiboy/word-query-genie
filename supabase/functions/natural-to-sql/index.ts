import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()
    
    if (!query) {
      throw new Error('No se proporcionó una consulta')
    }

    // Si contiene solo letras, rechazar la consulta
    if (query.match(/^[A-Za-zÑñ]+$/)) {
      throw new Error('Las consultas de anagramas deben usar el endpoint /anagrams');
    }

    console.log('Procesando consulta:', query);

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('PERPLEXITY_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-instruct',
        messages: [
          {
            role: 'system',
            content: `Eres un experto en SQL que convierte consultas en lenguaje natural a consultas SQL. 
            La tabla 'words' tiene estas columnas: word (texto), length (número), alphagram (texto).
            SOLO debes devolver la consulta SQL, nada más.
            La consulta SIEMPRE debe empezar con "SELECT DISTINCT w.word FROM words w WHERE".
            SIEMPRE usa el alias "w" para la tabla words.
            SIEMPRE ordena por w.word y limita a 100 resultados.
            SIEMPRE usa ILIKE para comparaciones de texto.
            
            Ejemplos:
            - "palabras que empiezan con a" -> "SELECT DISTINCT w.word FROM words w WHERE w.word ILIKE 'a%' ORDER BY w.word LIMIT 100"
            - "palabras de 5 letras que terminan en cion" -> "SELECT DISTINCT w.word FROM words w WHERE w.length = 5 AND w.word ILIKE '%cion' ORDER BY w.word LIMIT 100"
            - "palabras con q sin u" -> "SELECT DISTINCT w.word FROM words w WHERE w.word ILIKE '%q%' AND w.word NOT ILIKE '%u%' ORDER BY w.word LIMIT 100"
            - "palabras que tienen bt" -> "SELECT DISTINCT w.word FROM words w WHERE w.word ILIKE '%bt%' ORDER BY w.word LIMIT 100"
            - "palabras de 4 letras" -> "SELECT DISTINCT w.word FROM words w WHERE w.length = 4 ORDER BY w.word LIMIT 100"`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.1,
        max_tokens: 150
      }),
    })

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${await response.text()}`)
    }

    const data = await response.json()
    console.log('Respuesta completa:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Respuesta inválida del API')
    }

    const sqlQuery = data.choices[0].message.content.trim()
    console.log('SQL generado:', sqlQuery)

    return new Response(
      JSON.stringify({ sqlQuery }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})