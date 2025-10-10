import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';

interface UnsplashMentionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UnsplashMentionsModal({ open, onOpenChange }: UnsplashMentionsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="plz-card max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mentions & crédits photo</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-sm text-muted-foreground leading-relaxed">
            <p className="mb-4">
              Pliiiz utilise l'API d'Unsplash pour illustrer profils et idées cadeaux.
              Les photos restent la propriété de leurs auteurs et sont affichées via hotlink depuis Unsplash.
            </p>
            <p className="mb-4">
              Chaque image est créditée avec le nom du photographe et un lien vers Unsplash, 
              conformément aux guidelines de l'API.
            </p>
          </div>

          {/* Example image card */}
          <div>
            <h3 className="font-medium mb-3">Exemple d'attribution d'image :</h3>
            <div className="max-w-sm">
              <div className="aspect-square relative overflow-hidden rounded-lg mb-3">
                <img
                  src="https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=400&fit=crop&crop=faces,entropy&auto=format&q=70"
                  alt="Exemple d'image Unsplash"
                  className="w-full h-full object-cover"
                />
              </div>
              <figcaption className="text-xs text-muted-foreground">
                Photo par{' '}
                <a
                  href="https://unsplash.com/@cadop?utm_source=pliiiz&utm_medium=referral"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Kira auf der Heide
                </a>
                {' '}sur{' '}
                <a
                  href="https://unsplash.com/?utm_source=pliiiz&utm_medium=referral"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Unsplash
                </a>
              </figcaption>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>
              Pour plus d'informations sur l'utilisation des images Unsplash, consultez les{' '}
              <a
                href="https://unsplash.com/license"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                conditions d'utilisation Unsplash
              </a>
              .
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}