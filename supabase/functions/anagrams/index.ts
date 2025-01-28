import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    console.log('=== INICIO DE BÚSQUEDA DE ANAGRAMAS ===');
    
    const { query } = await req.json();
    
    if (!query) {
      console.error('Error: No se proporcionó una consulta');
      throw new Error('No se proporcionó una consulta');
    }

    console.log('Consulta recibida:', query);

    // Validar que solo contenga letras
    if (!query.match(/^[A-Za-zÑñ]+$/)) {
      console.error('Error: La consulta contiene caracteres no permitidos');
      throw new Error('La consulta solo puede contener letras');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    console.log('Ejecutando búsqueda de anagramas...');
    const { data, error } = await supabase.rpc('execute_natural_query', {
      query_text: query
    });

    if (error) {
      console.error('Error en execute_natural_query:', error);
      throw error;
    }

    console.log('Resultados encontrados:', data?.length || 0);
    console.log('=== FIN DE BÚSQUEDA DE ANAGRAMAS ===');

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en la función anagrams:', error);
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