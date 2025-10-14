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
      variant="purple-gradient"
      topOffset="50px"
      titleClassName="modal-title !text-gray-800 text-gray-800 text-center"
    >
      <div className="gift-reuse-modal space-y-4 bg-[#ff7cab] rounded-3xl p-5 text-white">
        <p className="text-base leading-relaxed text-white">
          Cette personne apprécie le regift ♻️ Avant de chercher un magasin, regardez dans vos armoires: 
          vous avez peut-être le cadeau qui lui fera plaisir !
        </p>
        
        {note && (
          <div className="p-3 bg-white/10 border border-white/20 rounded-lg">
            <p className="text-sm text-white">
              <strong>Note de {firstName} :</strong> "{note}"
            </p>
          </div>
        )}
        
        <div className="flex justify-center pt-2">
          <button 
            onClick={onClose} 
            className="btn-orange"
          >
            Super, merci !
          </button>
        </div>
      </div>
    </AppModal>
  );
}