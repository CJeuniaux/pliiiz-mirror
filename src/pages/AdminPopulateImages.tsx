import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Image, Download } from "lucide-react";

export default function AdminPopulateImages() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handlePopulate = async () => {
    try {
      setLoading(true);
      setResult(null);

      const { data, error } = await supabase.functions.invoke("populate-gift-images");

      if (error) throw error;

      setResult(data);
      toast({
        title: "✅ Population terminée",
        description: `${data.inserted} idées ajoutées, rebuild ${data.rebuild_triggered ? "lancé" : "échoué"}`,
      });
    } catch (error: any) {
      console.error("Error populating images:", error);
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Peupler les images cadeaux
          </CardTitle>
          <CardDescription>
            Extraire toutes les gift ideas des profils et générer leurs images via Unsplash
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handlePopulate}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Population en cours...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Lancer la population
              </>
            )}
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Résultats :</h3>
              <ul className="space-y-1 text-sm">
                <li>🎁 Total idées uniques : {result.total_ideas}</li>
                <li>➕ Nouvelles entrées créées : {result.inserted}</li>
                <li>
                  🖼️ Rebuild Unsplash :{" "}
                  {result.rebuild_triggered ? "✅ Lancé" : "❌ Échoué"}
                </li>
              </ul>
              {result.rebuild_result && (
                <pre className="mt-2 text-xs bg-background p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(result.rebuild_result, null, 2)}
                </pre>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
