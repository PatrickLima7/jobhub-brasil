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

  const finalize = () => {
    setRating(0);
    setComment('');
    onOpenChange(false);
    onComplete?.();
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      // Use upsert to avoid 23505 duplicate key if freelancer already submitted
      // The unique constraint is on (application_id, reviewer_role)
      const { error } = await supabase.from('reviews' as never).upsert({
        application_id: applicationId,
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        reviewer_role: reviewerRole,
        rating,
        comment: comment || null,
      } as never, {
        onConflict: 'application_id,reviewer_role',
        ignoreDuplicates: false,
      } as never);

      if (error) {
        // Log but do NOT block flow — review is optional for job completion
        console.warn('Failed to upsert review:', error);
      } else {
        toast({ title: 'Avaliação enviada! ⭐' });
      }
    } catch (err: unknown) {
      console.warn('Review error (non-blocking):', err);
    } finally {
      setSubmitting(false);
      // Always finalize — review failure must NOT block job completion
      finalize();
    }
  };

  const handleSkip = () => {
    // Allow completing without rating
    finalize();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleSkip(); else onOpenChange(o); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          <p className="text-sm text-muted-foreground text-center">
            Avalie sua experiência neste serviço (opcional)
          </p>
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
          <div className="flex flex-col gap-2">
            <Button
              className="w-full"
              disabled={rating === 0 || submitting}
              onClick={handleSubmit}
            >
              {submitting ? 'Enviando...' : 'Enviar avaliação'}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              disabled={submitting}
              onClick={handleSkip}
            >
              Confirmar sem avaliar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
