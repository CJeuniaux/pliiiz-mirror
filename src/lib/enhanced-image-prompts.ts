/**
 * Enhanced image prompts with semantic understanding and context
 */

import { SemanticMapping } from './semantic-image-mapping';

export interface EnhancedPromptParams {
  positive: string;
  negative: string;
  unsplashQuery: string;
  steps: number;
  guidance: number;
  seed?: number;
}

/**
 * Build AI generation prompt from semantic mapping
 */
function buildAIPrompt(mapping: SemanticMapping, originalIdea: string): { positive: string; negative: string } {
  const { category, keywords, excludeKeywords, anchors, colors } = mapping;
  
  // Build positive prompt using semantic structure
  let positive = `${category} — `;
  
  // Add main keywords
  positive += keywords.slice(0, 4).join(', ') + ' — ';
  
  // Add visual anchors (concrete objects to show)
  if (anchors.length > 0) {
    positive += `montrer ${anchors.slice(0, 2).join(', ')} — `;
  }
  
  // Add colors if specified
  if (colors && colors.length > 0) {
    positive += `couleur ${colors[0]} — `;
  }
  
  // Add standard photography directives
  positive += 'style photo produit — fond neutre — bonne lumière — haute qualité — studio professionnel';
  
  // Build negative prompt
  let negative = 'low quality, blurry, pixelated, watermark, text, logos, multiple items, cluttered background';
  
  // Add semantic exclusions
  if (excludeKeywords.length > 0) {
    negative += ', no ' + excludeKeywords.join(', no ');
  }
  
  // Add common problematic exclusions
  negative += ', no office, no corporate, no business, no meeting room';
  
  return { positive, negative };
}

/**
 * Build Unsplash search query from semantic mapping
 */
function buildUnsplashQuery(mapping: SemanticMapping, originalIdea: string): string {
  const { unsplashQueries, keywords, anchors, confidence } = mapping;
  
  // Use predefined Unsplash queries if available and confidence is high
  if (unsplashQueries.length > 0 && confidence > 0.7) {
    return unsplashQueries[0]; // Take the best optimized query
  }
  
  // Fallback: construct from keywords and anchors
  let query = '';
  
  // Take 1-2 positive keywords
  if (keywords.length > 0) {
    query += keywords.slice(0, 2).join(' ');
  }
  
  // Add 1 anchor for concrete visual reference
  if (anchors.length > 0) {
    query += ` ${anchors[0]}`;
  }
  
  // Fallback to original idea if query is empty
  if (!query.trim()) {
    query = originalIdea;
  }
  
  return query.trim();
}

/**
 * Main function to build enhanced prompts
 */
export function buildEnhancedPrompts(mapping: SemanticMapping, originalIdea: string): EnhancedPromptParams {
  const { positive, negative } = buildAIPrompt(mapping, originalIdea);
  const unsplashQuery = buildUnsplashQuery(mapping, originalIdea);
  
  return {
    positive,
    negative,
    unsplashQuery,
    steps: 28,
    guidance: 7.5,
    seed: undefined
  };
}