/**
 * Advanced gift image prompt generation using comprehensive taxonomy
 * Leverages entities, styles, negatives, and occasions from gift-categories.ts
 */

import { GIFT_CATEGORIES, type GiftTag } from './gift-categories';

export interface TaxonomyPromptParams {
  positive: string;
  negative: string;
  unsplashQuery: string;
  confidence: number;
  matchedTag?: GiftTag;
  category?: string;
}

/**
 * Find the best matching tag from taxonomy based on gift idea text
 */
function findBestTagMatch(giftIdea: string): { tag: GiftTag; category: string; score: number } | null {
  const normalized = giftIdea.toLowerCase().trim();
  let bestMatch: { tag: GiftTag; category: string; score: number } | null = null;

  for (const cat of GIFT_CATEGORIES) {
    for (const tag of cat.tags) {
      let score = 0;

      // Check name match (highest priority)
      if (normalized.includes(tag.name.toLowerCase())) {
        score += 100;
      }

      // Check slug match
      if (normalized.includes(tag.slug)) {
        score += 80;
      }

      // Check keywords (each match adds points)
      for (const keyword of tag.keywords) {
        if (normalized.includes(keyword.toLowerCase())) {
          score += 10;
        }
      }

      // Check entities (materials, qualities)
      if (tag.entities) {
        for (const entity of tag.entities) {
          if (normalized.includes(entity.toLowerCase())) {
            score += 8;
          }
        }
      }

      // Check styles
      if (tag.styles) {
        for (const style of tag.styles) {
          if (normalized.includes(style.toLowerCase())) {
            score += 5;
          }
        }
      }

      // Update best match if this score is higher
      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { tag, category: cat.category, score };
      }
    }
  }

  return bestMatch;
}

/**
 * Build AI generation prompt using taxonomy data
 */
function buildAIPromptFromTaxonomy(
  giftIdea: string,
  tag: GiftTag,
  category: string
): { positive: string; negative: string } {
  // Positive prompt structure
  const parts: string[] = [];

  // 1. Main subject
  parts.push(`${giftIdea}`);

  // 2. Add entities (materials, components)
  if (tag.entities && tag.entities.length > 0) {
    const selectedEntities = tag.entities.slice(0, 3).join(', ');
    parts.push(`avec ${selectedEntities}`);
  }

  // 3. Add style directives
  if (tag.styles && tag.styles.length > 0) {
    const selectedStyle = tag.styles[0];
    parts.push(`style ${selectedStyle}`);
  }

  // 4. Add category context
  parts.push(`catégorie ${category.toLowerCase()}`);

  // 5. Photography directives
  parts.push('photo produit professionnelle');
  parts.push('fond neutre blanc');
  parts.push('éclairage studio doux');
  parts.push('haute définition');
  parts.push('composition centrée');

  const positive = parts.join(' — ');

  // Negative prompt structure
  const negatives: string[] = [
    'low quality',
    'blurry',
    'pixelated',
    'watermark',
    'text',
    'logo',
    'brand name',
    'multiple items',
    'cluttered',
    'dark',
    'shadows'
  ];

  // Add tag-specific negatives
  if (tag.negatives && tag.negatives.length > 0) {
    negatives.push(...tag.negatives.map(n => `no ${n}`));
  }

  // Add common problematic elements
  negatives.push('no chocolate', 'no dessert', 'no candy');

  const negative = negatives.join(', ');

  return { positive, negative };
}

/**
 * Build Unsplash search query using taxonomy keywords
 */
function buildUnsplashQueryFromTaxonomy(giftIdea: string, tag: GiftTag): string {
  const queryParts: string[] = [];

  // 1. Use top keywords (translated to English when possible)
  const topKeywords = tag.keywords.slice(0, 2);
  queryParts.push(...topKeywords);

  // 2. Add product context
  queryParts.push('product');
  queryParts.push('isolated');

  // 3. Add material/entity if relevant
  if (tag.entities && tag.entities.length > 0) {
    queryParts.push(tag.entities[0]);
  }

  // Exclusions
  const exclusions = [
    '-cartoon',
    '-illustration',
    '-drawing',
    '-text',
    '-logo'
  ];

  // Add tag-specific exclusions
  if (tag.negatives && tag.negatives.length > 0) {
    exclusions.push(...tag.negatives.slice(0, 2).map(n => `-${n}`));
  }

  // Combine and deduplicate
  const uniqueParts = [...new Set(queryParts)].slice(0, 5);
  return [...uniqueParts, ...exclusions].join(' ');
}

/**
 * Main function: Generate complete prompt params using taxonomy
 */
export function buildTaxonomyPrompts(
  giftIdea: string,
  category?: string,
  occasion?: string
): TaxonomyPromptParams {
  // Try to find matching tag in taxonomy
  const match = findBestTagMatch(giftIdea);

  if (!match || match.score < 10) {
    // Fallback: basic prompt without taxonomy
    return {
      positive: `${giftIdea} — photo produit — fond blanc — haute qualité`,
      negative: 'low quality, blurry, text, logo, watermark',
      unsplashQuery: `${giftIdea} product isolated`,
      confidence: 0.3,
      matchedTag: undefined,
      category: category
    };
  }

  // Build prompts using matched tag
  const { positive, negative } = buildAIPromptFromTaxonomy(giftIdea, match.tag, match.category);
  const unsplashQuery = buildUnsplashQueryFromTaxonomy(giftIdea, match.tag);

  // Calculate confidence based on match score
  const confidence = Math.min(match.score / 100, 1.0);

  return {
    positive,
    negative,
    unsplashQuery,
    confidence,
    matchedTag: match.tag,
    category: match.category
  };
}

/**
 * Helper: Get all available categories for autocomplete/suggestions
 */
export function getAllCategories(): string[] {
  return GIFT_CATEGORIES.map(c => c.category);
}

/**
 * Helper: Get all tags for a specific category
 */
export function getTagsForCategory(categoryName: string): GiftTag[] {
  const category = GIFT_CATEGORIES.find(c => c.category === categoryName);
  return category?.tags || [];
}
