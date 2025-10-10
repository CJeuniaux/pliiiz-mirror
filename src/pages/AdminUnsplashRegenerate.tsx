import { UnsplashRegenerateAll } from "@/components/admin/unsplash-regenerate-all";

export default function AdminUnsplashRegenerate() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Administration Unsplash</h1>
          <p className="text-muted-foreground mt-2">
            Régénération des images avec la logique améliorée
          </p>
        </div>
        <UnsplashRegenerateAll />
      </div>
    </div>
  );
}