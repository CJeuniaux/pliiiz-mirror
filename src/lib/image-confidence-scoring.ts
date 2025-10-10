/**
 * Image confidence scoring system
 * Evaluates how well an image matches the intended gift idea
 */

export interface ConfidenceScore {
  score: number; // 0-1
  reasons: string[];
  shouldFallback: boolean;
}

/**
 * Score image relevance based on metadata and context
 */
export function calculateImageConfidence(
  giftIdea: string,
  imageMetadata: {
    title?: string;
    description?: string;
    altText?: string;
    tags?: string[];
    url?: string;
  },
  semanticMapping: any
): ConfidenceScore {
  let score = 0.5; // Base score
  const reasons: string[] = [];
  
  const ideaLower = giftIdea.toLowerCase();
  const { brand, productType, colors, keywords, excludeKeywords } = semanticMapping;
  
  // Combine all text sources
  const allText = [
    imageMetadata.title || '',
    imageMetadata.description || '', 
    imageMetadata.altText || '',
    ...(imageMetadata.tags || [])
  ].join(' ').toLowerCase();
  
  // Positive scoring
  
  // 1. Brand match (high weight)
  if (brand && allText.includes(brand.toLowerCase())) {
    score += 0.3;
    reasons.push(`Brand "${brand}" found in metadata`);
  }
  
  // 2. Product type match
  if (productType && allText.includes(productType.toLowerCase())) {
    score += 0.2;
    reasons.push(`Product type "${productType}" matched`);
  }
  
  // 3. Color match
  if (colors && colors.length > 0) {
    const colorMatch = colors.some(color => allText.includes(color.toLowerCase()));
    if (colorMatch) {
      score += 0.15;
      reasons.push('Color specification matched');
    }
  }
  
  // 4. Keyword relevance
  const keywordMatches = keywords.filter(keyword => 
    allText.includes(keyword.toLowerCase())
  ).length;
  
  if (keywordMatches > 0) {
    const keywordBonus = Math.min(keywordMatches * 0.05, 0.2);
    score += keywordBonus;
    reasons.push(`${keywordMatches} relevant keywords found`);
  }
  
  // 5. Direct gift idea match
  if (allText.includes(ideaLower)) {
    score += 0.25;
    reasons.push('Direct match with gift idea');
  }
  
  // Negative scoring (red flags)
  
  // 1. Excluded keywords present
  const excludeMatches = excludeKeywords.filter(exclude => 
    allText.includes(exclude.toLowerCase())
  );
  
  if (excludeMatches.length > 0) {
    score -= 0.3;
    reasons.push(`Problematic content detected: ${excludeMatches.join(', ')}`);
  }
  
  // 2. Common false positives
  const falsePositives = [
    'office', 'meeting', 'corporate', 'business card', 
    'screenshot', 'website', 'app interface',
    'flower' // when looking for non-flower items
  ];
  
  if (ideaLower.includes('enceinte') && !ideaLower.includes('fleur')) {
    // Looking for speaker, not pregnancy
    if (allText.includes('flower') || allText.includes('garden') || allText.includes('bloom')) {
      score -= 0.4;
      reasons.push('Flower/garden content for audio device');
    }
  }
  
  if (ideaLower.includes('atelier') && ideaLower.includes('œnologie')) {
    // Looking for wine workshop
    if (allText.includes('office') || allText.includes('meeting room')) {
      score -= 0.4;
      reasons.push('Office/meeting content for wine workshop');
    }
  }
  
  const fpMatches = falsePositives.filter(fp => allText.includes(fp));
  if (fpMatches.length > 0) {
    score -= fpMatches.length * 0.1;
    reasons.push(`False positive indicators: ${fpMatches.join(', ')}`);
  }
  
  // 3. Generic/low quality indicators
  const lowQualityTerms = ['stock photo', 'generic', 'placeholder', 'template'];
  const lqMatches = lowQualityTerms.filter(term => allText.includes(term));
  if (lqMatches.length > 0) {
    score -= 0.15;
    reasons.push('Low quality image indicators detected');
  }
  
  // Normalize score
  score = Math.max(0, Math.min(1, score));
  
  // Determine if should fallback
  const shouldFallback = score < 0.3; // Threshold for fallback
  
  if (shouldFallback) {
    reasons.push('Score below confidence threshold');
  }
  
  return {
    score,
    reasons,
    shouldFallback
  };
}

/**
 * Quick confidence check for image URL patterns
 */
export function quickUrlConfidenceCheck(url: string, giftIdea: string): number {
  const urlLower = url.toLowerCase();
  const ideaLower = giftIdea.toLowerCase();
  
  let score = 0.5;
  
  // URL contains relevant terms
  const ideaWords = ideaLower.split(/\s+/);
  const relevantWords = ideaWords.filter(word => 
    word.length > 2 && urlLower.includes(word)
  );
  
  score += relevantWords.length * 0.1;
  
  // High quality image service indicators
  if (urlLower.includes('unsplash') || urlLower.includes('pexels')) {
    score += 0.1;
  }
  
  // AI generated image indicators
  if (urlLower.includes('openai') || urlLower.includes('huggingface')) {
    score += 0.2; // AI images are more targeted
  }
  
  return Math.min(1, score);
}