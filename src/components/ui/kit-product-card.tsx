import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";

interface KitProductCardProps {
  title: string;
  price?: string;
  image?: string;
  badge?: string;
  rating?: number;
  className?: string;
  onClick?: () => void;
}

export function KitProductCard({ 
  title, 
  price, 
  image, 
  badge, 
  rating,
  className,
  onClick 
}: KitProductCardProps) {
  return (
    <Card 
      className={cn(
        "overflow-hidden cursor-pointer hover:shadow-glow transition-all duration-200 hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
    >
      <div className="relative">
        {/* Image placeholder ou réelle */}
        <div className="aspect-square bg-muted rounded-t-[16px] flex items-center justify-center">
          {image ? (
            <img src={image} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-16 h-16 bg-border rounded-lg flex items-center justify-center">
              <div className="w-8 h-8 bg-muted-foreground/20 rounded"></div>
            </div>
          )}
        </div>
        
        {/* Badge */}
        {badge && (
          <div className="absolute top-3 left-3 bg-destructive text-destructive-foreground px-2 py-1 rounded-[8px] text-xs font-medium">
            {badge}
          </div>
        )}
        
        {/* Rating */}
        {rating && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-[8px]">
            <span className="text-yellow-500">★</span>
            <span className="text-xs font-medium">{rating}</span>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-inter font-medium text-foreground mb-1">{title}</h3>
        {price && (
          <p className="text-lg font-semibold text-primary">{price}</p>
        )}
      </CardContent>
    </Card>
  );
}