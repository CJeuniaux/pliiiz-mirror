type Item = {
  label: string;
  canonical?: { 
    categoryId?: string; 
    attrs?: Record<string, any> 
  };
  imageUrl?: string | null;
};

/**
 * Resolve image URL for an item using fallback strategy:
 * 1. Use existing imageUrl if available
 * 2. Exact label match in image library
 * 3. Category + attributes match
 * 4. Category default icon
 * 5. Placeholder
 */
export async function resolveImageUrl(item: Item): Promise<string> {
  // 0) Already has an image
  if (item.imageUrl) {
    return item.imageUrl;
  }

  try {
    // 1) Exact label match
    const exactMatchResponse = await fetch(
      `/api/image-library?label=${encodeURIComponent(item.label)}`,
      { method: 'GET' }
    );
    
    if (exactMatchResponse.ok) {
      const exactMatch = await exactMatchResponse.json();
      if (exactMatch?.image_url) {
        console.log('[resolveImageUrl] Found exact match for:', item.label);
        return exactMatch.image_url;
      }
    }

    // 2) Match by category + attrs (server decides best match)
    if (item.canonical?.categoryId || item.canonical?.attrs) {
      const lookupResponse = await fetch('/api/image-library/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: item.canonical?.categoryId,
          attrs: item.canonical?.attrs
        })
      });

      if (lookupResponse.ok) {
        const lookupMatch = await lookupResponse.json();
        if (lookupMatch?.image_url) {
          console.log('[resolveImageUrl] Found category/attrs match for:', item.label);
          return lookupMatch.image_url;
        }
      }
    }

    // 3) Category default icon/stock
    const icon = getCategoryDefaultIcon(item.canonical?.categoryId);
    if (icon) {
      console.log('[resolveImageUrl] Using category default for:', item.label);
      return icon;
    }

  } catch (error) {
    console.error('[resolveImageUrl] Error resolving image:', error);
  }

  // 4) Placeholder
  console.log('[resolveImageUrl] Using placeholder for:', item.label);
  return getPlaceholderImage();
}

/**
 * Get default icon for a category
 */
function getCategoryDefaultIcon(categoryId?: string): string | null {
  if (!categoryId) return null;
  
  const category = categoryId.toLowerCase();
  const baseUrl = 'https://afyxwaprjecyormhnncl.supabase.co/storage/v1/object/public/library';
  
  switch (category) {
    case 'tea':
      return `${baseUrl}/icons/tea.jpg`;
    case 'chocolate':
      return `${baseUrl}/icons/chocolate.jpg`;
    case 'books':
      return `${baseUrl}/icons/books.jpg`;
    case 'tech_audio':
      return `${baseUrl}/icons/audio.jpg`;
    case 'plants':
      return `${baseUrl}/icons/plant.jpg`;
    case 'home_bougies':
      return `${baseUrl}/icons/candle.jpg`;
    default:
      return null;
  }
}

/**
 * Get placeholder image URL
 */
function getPlaceholderImage(): string {
  return 'https://afyxwaprjecyormhnncl.supabase.co/storage/v1/object/public/library/placeholder.png';
}

/**
 * Enhanced gift image component that uses the image library
 */
export async function getEnhancedGiftImageUrl(
  giftName: string, 
  category?: string, 
  attributes?: Record<string, any>
): Promise<string> {
  const item: Item = {
    label: giftName,
    canonical: {
      categoryId: category,
      attrs: attributes
    }
  };

  return resolveImageUrl(item);
}