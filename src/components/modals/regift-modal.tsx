import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface RegiftModalProps {
  open: boolean;
  onClose: () => void;
  firstName: string;
  note?: string | null;
}

export function RegiftModal({ open, onClose, firstName, note }: RegiftModalProps) {
  return (
    <AppModal 
      open={open} 
      onClose={onClose} 
      title="👍 Bonne nouvelle !"
      size="md"
    >
      <div className="space-y-4">
        <p className="text-base leading-relaxed">
          {firstName} accepte le regift ♻️ Vous pouvez lui offrir un cadeau correspondant à ses idées cadeaux,
          y compris un article de seconde vie ou reconditionné provenant de nos partenaires.
        </p>
        
        {note && (
          <div className="p-3 bg-white/10 border border-white/20 rounded-lg">
            <p className="text-sm">
              <strong>Note de {firstName} :</strong> "{note}"
            </p>
          </div>
        )}
        
        <div className="flex justify-center pt-2">
          <Button 
            onClick={onClose} 
            className="px-8 bg-gradient-to-r from-[hsl(var(--plz-accent-start))] to-[hsl(var(--plz-accent-end))] hover:opacity-90 text-white rounded-full font-medium transition-opacity"
          >
            Super, merci !
          </Button>
        </div>
      </div>
    </AppModal>
  );
}