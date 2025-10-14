import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface AppModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'purple-gradient';
  topOffset?: string;
  titleClassName?: string;
}

export function AppModal({ 
  open, 
  onClose, 
  title, 
  children, 
  size = 'md',
  variant = 'default',
  topOffset,
  titleClassName
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
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      
      {/* Modal panel */}
      <div 
        className="fixed inset-0 flex items-center justify-center px-[var(--plz-outer-margin)] py-4"
        style={topOffset ? { paddingTop: topOffset } : undefined}
      >
        <div 
          className={`
            relative
            w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden
            animate-in fade-in-0 zoom-in-95 duration-200
            ${variant === 'purple-gradient' 
              ? 'rounded-3xl border-2 border-white shadow-2xl' 
              : 'pliiz-card'}
          `}
          style={variant === 'purple-gradient' ? {
            backgroundColor: '#ff7cab',
            backgroundImage: 'none',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none'
          } : undefined}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button - absolute positioning */}
          <button
            ref={firstFocusableRef}
            onClick={onClose}
            className={`absolute top-4 right-4 p-2 rounded-full transition-colors z-10 ${variant === 'purple-gradient' ? 'hover:bg-white/20 text-white' : 'hover:bg-white/10'}`}
            aria-label="Fermer"
          >
            <X className={`h-4 w-4 ${variant === 'purple-gradient' ? 'text-white' : 'text-[hsl(var(--plz-text))]'}`} />
          </button>

          {/* Header */}
          {title && (
            <div className={`p-6 pb-4`}>
              <h3 
                id="modal-title"
                className={`modal-title !text-gray-800 text-xl font-bold ${variant === 'purple-gradient' ? 'text-center' : ''} ${titleClassName ?? ''}`}
              >
                {title}
              </h3>
            </div>
          )}
          
          {/* Body */}
          <div className={`overflow-y-auto px-6 pb-6 ${title ? 'pt-2' : 'pt-6'} ${variant === 'purple-gradient' ? 'text-gray-800' : ''}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}