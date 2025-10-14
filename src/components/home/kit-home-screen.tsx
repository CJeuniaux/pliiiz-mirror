import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { KitSearchBar } from "@/components/ui/kit-search-bar";
import { KitCategoryChip } from "@/components/ui/kit-category-chip";
import { KitProductCard } from "@/components/ui/kit-product-card";
import { Plus, Gift, Calendar, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function KitHomeScreen() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("occasions");

  const categories = [
    { id: "occasions", label: "Occasions" },
    { id: "trending", label: "Trending" },
    { id: "ideas", label: "Idées" },
    { id: "requests", label: "Demandes" }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header with Title and Avatar */}
      <div className="px-4 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-inter font-bold text-foreground">Pliiiz</h1>
          <p className="text-sm text-muted-foreground">Découvrez</p>
        </div>
        <div className="w-10 h-10 bg-muted rounded-full"></div>
      </div>

      {/* Search Bar with Filter */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <KitSearchBar 
              placeholder="Rechercher..."
              className="h-12"
            />
          </div>
          <Button variant="outline" size="icon" className="h-12 w-12">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Section Title */}
      <div className="px-4 mb-4">
        <h2 className="text-lg font-inter font-semibold text-foreground">Occasions</h2>
      </div>

      {/* Categories */}
      <div className="px-4 mb-6">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {categories.map((category) => (
            <KitCategoryChip
              key={category.id}
              active={activeCategory === category.id}
              onClick={() => setActiveCategory(category.id)}
              className="flex-shrink-0"
            >
              {category.label}
            </KitCategoryChip>
          ))}
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <Card key={item} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square bg-muted relative">
                  {/* Placeholder for product image */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <div className="px-2 py-1 bg-destructive text-white text-xs rounded-full">
                      NEW
                    </div>
                    <div className="px-2 py-1 bg-warning text-warning-foreground text-xs rounded-full">
                      ★
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-inter font-semibold text-sm text-foreground mb-1">
                    Idée cadeau {item}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">Description courte</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">25€</span>
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">i</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Secondary Section */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-inter font-semibold text-foreground mb-4">Suggestions</h2>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((item) => (
            <Card key={item} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="h-24 bg-muted"></div>
                <div className="p-3">
                  <h3 className="font-inter font-semibold text-sm text-foreground">
                    Suggestion {item}
                  </h3>
                  <p className="text-xs text-muted-foreground">Description</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}