import { categoryPlaceholder } from "@/lib/placeholders";

export function GiftCard({ gift }: { gift: any }) {
  const src = gift?.source_ref || null;
  const alt = gift?.alt || gift?.title || "";
  const score = gift?.accuracy_score ?? 0;

  return (
    <div className="gift-card rounded-2xl overflow-hidden bg-white/40 backdrop-blur border border-white/20 shadow-sm hover:shadow-md transition-shadow">
      <div className="aspect-square w-full relative">
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-200 to-fuchsia-100">
            {categoryPlaceholder(gift?.category_slug)}
          </div>
        )}
        <div className="absolute top-2 right-2 text-xs px-2 py-1 rounded-full bg-black/50 text-white backdrop-blur-sm">
          {score >= 80 ? "✅" : score >= 60 ? "🟡" : "🔴"} {score}
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-center line-clamp-2">{gift?.title}</h3>
        {gift?.category_label && (
          <p className="text-xs text-muted-foreground text-center mt-1">{gift?.category_label}</p>
        )}
      </div>
    </div>
  );
}
