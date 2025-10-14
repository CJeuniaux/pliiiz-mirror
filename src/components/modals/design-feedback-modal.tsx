import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DesignFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FeedbackChoice = 'LOVE' | 'MIXED' | 'DISLIKE';

export function DesignFeedbackModal({ open, onOpenChange }: DesignFeedbackModalProps) {
  const [choice, setChoice] = useState<FeedbackChoice | ''>('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!choice) {
      toast({
        title: "Veuillez choisir une option",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.functions.invoke('design-feedback', {
        body: {
          choice,
          comment: comment.trim() || null
        }
      });

      if (error) throw error;

      toast({
        title: "Merci ! Votre avis nous aide à améliorer Pliiiz.",
        variant: "default"
      });

      // Track analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'feedback_submitted', {
          choice,
          hasComment: !!comment.trim()
        });
      }

      onOpenChange(false);
      setChoice('');
      setComment('');

    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Impossible d'envoyer, réessayez",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Que pensez-vous du nouveau design ?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={choice} onValueChange={(value) => setChoice(value as FeedbackChoice)} className="space-y-2">
            <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-[#F3F7F7] transition-colors">
              <RadioGroupItem value="LOVE" id="love" />
              <Label htmlFor="love" className="flex items-center gap-2 cursor-pointer text-[#2F4B4E]">
                💚 J'adore
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-[#F3F7F7] transition-colors">
              <RadioGroupItem value="MIXED" id="mixed" />
              <Label htmlFor="mixed" className="flex items-center gap-2 cursor-pointer text-[#2F4B4E]">
                😐 C'est prometteur mais à peaufiner
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-[#F3F7F7] transition-colors">
              <RadioGroupItem value="DISLIKE" id="dislike" />
              <Label htmlFor="dislike" className="flex items-center gap-2 cursor-pointer text-[#2F4B4E]">
                🙅 Je préférerais autre chose
              </Label>
            </div>
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="comment" className="text-[#2F4B4E] text-sm">
              Un commentaire ? (facultatif)
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Dites-nous en plus..."
              maxLength={300}
              className="resize-none min-h-[80px] border-[#E5EAEA] focus:border-[#2F4B4E]"
            />
            <div className="text-xs text-[#93A3A5] text-right">
              {comment.length}/300 caractères
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-[#E5EAEA] text-white hover:bg-white/10"
            >
              Plus tard
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!choice || isSubmitting}
              className="flex-1 btn-orange"
            >
              {isSubmitting ? 'Envoi...' : 'Envoyer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}