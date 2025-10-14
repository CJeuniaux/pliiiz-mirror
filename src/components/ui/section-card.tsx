import { cn } from "@/lib/utils";
import { Card } from "./card";

interface SectionCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

export function SectionCard({ 
  title, 
  description, 
  children, 
  className,
  headerAction 
}: SectionCardProps) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-medium text-foreground">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {headerAction && <div>{headerAction}</div>}
      </div>
      {children}
    </Card>
  );
}