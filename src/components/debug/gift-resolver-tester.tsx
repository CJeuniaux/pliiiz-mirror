import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { resolveBE, normalizeFR } from "@/lib/gifts-be";
import { Search, MapPin, Tag } from "lucide-react";

export default function GiftResolverTester() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ReturnType<typeof resolveBE> | null>(null);

  const handleTest = () => {
    if (!input.trim()) return;
    const resolved = resolveBE(input);
    setResult(resolved);
  };

  const confidenceColors = {
    exact: "bg-green-500",
    fuzzy: "bg-yellow-500",
    alias: "bg-blue-500",
    fallback: "bg-orange-500"
  };

  const testCases = [
    "chocolat noir",
    "rhum arrangé",
    "bougies parfumées",
    "livre de cuisine",
    "vin rouge",
    "café",
    "jeux de société",
    "casque audio"
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Testeur de Résolution de Cadeaux BE
          </CardTitle>
          <CardDescription>
            Testez la résolution de mots-clés vers catégories et magasins belges
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ex: chocolat noir, rhum arrangé, bougie..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTest()}
            />
            <Button onClick={handleTest}>
              Résoudre
            </Button>
          </div>

          {result && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Badge className={confidenceColors[result.confidence]}>
                  {result.confidence}
                </Badge>
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">
                    Input normalisé: <code className="font-mono">{normalizeFR(input)}</code>
                  </div>
                  {result.matchedKey && (
                    <div className="text-sm text-muted-foreground">
                      Clé trouvée: <code className="font-mono">{result.matchedKey}</code>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">{result.main_category}</span>
                  {result.subcategory && (
                    <>
                      <span className="text-muted-foreground">→</span>
                      <span>{result.subcategory}</span>
                    </>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">Magasins ({result.stores.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.stores.slice(0, 6).map((store, idx) => (
                      <Badge key={idx} variant="outline">
                        {store}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {!result.found && (
                <div className="text-sm text-orange-600 dark:text-orange-400">
                  ⚠️ Aucune correspondance exacte trouvée - fallback utilisé
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tests rapides</CardTitle>
          <CardDescription>Cliquez pour tester ces exemples</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {testCases.map((testCase) => (
              <Button
                key={testCase}
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(testCase);
                  setResult(resolveBE(testCase));
                }}
              >
                {testCase}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
