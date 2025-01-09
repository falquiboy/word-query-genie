import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SuperUserInterfaceProps {
  originalQuery: string;
  sqlQuery: string;
  results: any[];
  conversationContext: any[];
}

export const SuperUserInterface = ({
  originalQuery,
  sqlQuery,
  results,
  conversationContext,
}: SuperUserInterfaceProps) => {
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const handleApprove = async () => {
    try {
      const { error } = await supabase.from("learning_examples").insert({
        original_query: originalQuery,
        successful_sql: sqlQuery,
        conversation_context: conversationContext,
        notes: notes.trim() || null,
        approved_by: (await supabase.auth.getUser()).data.user?.id,
      });

      if (error) throw error;

      toast({
        title: "Ejemplo aprobado",
        description: "El ejemplo ha sido guardado exitosamente.",
      });
    } catch (error) {
      console.error("Error al aprobar ejemplo:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar el ejemplo. Por favor intenta de nuevo.",
      });
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Interfaz de Super Usuario</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Consulta Original:</h3>
          <p className="bg-muted p-2 rounded">{originalQuery}</p>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Consulta SQL:</h3>
          <p className="bg-muted p-2 rounded break-all">{sqlQuery}</p>
        </div>

        <div>
          <h3 className="font-medium mb-2">Resultados: {results.length}</h3>
        </div>

        <div>
          <h3 className="font-medium mb-2">Notas:</h3>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Añade notas sobre este ejemplo..."
            className="min-h-[100px]"
          />
        </div>

        <Button onClick={handleApprove}>Aprobar Ejemplo</Button>
      </CardContent>
    </Card>
  );
};