import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StarRating } from '@/components/StarRating';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  applicationId: string;
  reviewerId: string;
  revieweeId: string;
  reviewerRole: 'company' | 'freelancer';
  onComplete?: () => void;
}

export function RatingModal({
  open,
  onOpenChange,
  title,
  applicationId,
  reviewerId,
  revieweeId,
  reviewerRole,
  onComplete,
}: RatingModalProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('reviews' as never).insert({
        application_id: applicationId,
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        reviewer_role: reviewerRole,
        rating,
        comment: comment || null,
      } as never);
      if (error) throw error;
      toast({ title: 'Avaliação enviada!' });
      setRating(0);
      setComment('');
      onOpenChange(false);
      onComplete?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          <div className="flex justify-center">
            <StarRating rating={rating} size={32} interactive onRate={setRating} showValue={false} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-muted-foreground">
              Comentário (opcional)
            </Label>
            <Textarea
              className="bg-secondary border-input focus-visible:border-foreground focus-visible:bg-background"
              placeholder="Como foi sua experiência?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            disabled={rating === 0 || submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Enviando...' : 'Enviar avaliação'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
