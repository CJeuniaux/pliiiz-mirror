import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface AppModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function AppModal({ 
  open, 
  onClose, 
  title, 
  children, 
  size = 'md' 
}: AppModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      // Focus trap
      firstFocusableRef.current?.focus();
      
      // Bloquer le scroll du body
      document.body.style.overflow = 'hidden';
      
      // Gérer Escape
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg', 
    lg: 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div 
          className={`
            relative pliiz-card
            w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden
            animate-in fade-in-0 zoom-in-95 duration-200
          `}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 
                id="modal-title"
                className="text-lg font-semibold text-[hsl(var(--plz-text))]"
              >
                {title}
              </h3>
              <button
                ref={firstFocusableRef}
                onClick={onClose}
                className="
                  p-2 hover:bg-white/10 rounded-full transition-colors
                "
                aria-label="Fermer"
              >
                <X className="h-4 w-4 text-[hsl(var(--plz-text))]" />
              </button>
            </div>
          )}
          
          {/* Body */}
          <div className={`overflow-y-auto ${title ? 'p-6' : 'p-6'}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}