import React, { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SearchFeedbackProps {
  queryId: string;
}

const SearchFeedback = ({ queryId }: SearchFeedbackProps) => {
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFeedback = async (wasHelpful: boolean, feedbackType: "exactly_what_needed" | "not_what_expected") => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from("query_feedback")
        .insert({
          query_id: queryId,
          was_helpful: wasHelpful,
          feedback_type: feedbackType,
          user_comment: comment || null
        });

      if (error) throw error;

      toast({
        title: "¡Gracias por tu feedback!",
        description: "Tu opinión nos ayuda a mejorar el buscador.",
      });

      setShowComment(false);
      setComment("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar el feedback. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFeedback(true, "exactly_what_needed")}
          disabled={isSubmitting}
        >
          <ThumbsUp className="mr-2 h-4 w-4" />
          Útil
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFeedback(false, "not_what_expected")}
          disabled={isSubmitting}
        >
          <ThumbsDown className="mr-2 h-4 w-4" />
          No útil
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowComment(prev => !prev)}
          disabled={isSubmitting}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Comentar
        </Button>
      </div>
      {showComment && (
        <div className="space-y-2">
          <Textarea
            placeholder="¿Qué podríamos mejorar?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => handleFeedback(true, "exactly_what_needed")}
              disabled={isSubmitting || !comment.trim()}
            >
              Enviar comentario
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFeedback;