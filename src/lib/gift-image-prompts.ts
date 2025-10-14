// Gift image generation prompts with category-specific templates
// Eliminates chocolate bias and improves image quality

const NEGATIVE_PROMPT = "no chocolate, no cacao, no cocoa, no dessert, no candy, no sweets, no food stains, no dripping, no text watermark, no logos, no brand names";

interface PromptTemplate {
  positive: string;
  negative: string;
}

const TEMPLATES: Record<string, (query: string) => PromptTemplate> = {
  "flowers": (q) => ({
    positive: `high-quality studio photo of a tasteful bouquet (${q}), soft natural light, neutral background, fresh flowers, elegant arrangement`,
    negative: NEGATIVE_PROMPT
  }),
  "tech": (q) => ({
    positive: `modern product shot of ${q}, minimal background, soft shadows, high detail, no packaging, clean technology`,
    negative: NEGATIVE_PROMPT
  }),
  "fashion": (q) => ({
    positive: `${q} on plain backdrop, clean composition, true-to-color, editorial lighting, fashion photography`,
    negative: NEGATIVE_PROMPT
  }),
  "jewelry": (q) => ({
    positive: `macro photo of ${q}, sparkle but realistic, controlled reflections, black or white backdrop, luxury jewelry`,
    negative: NEGATIVE_PROMPT
  }),
  "book": (q) => ({
    positive: `book titled ${q} on a clean table, natural light, realistic cover, no hands, literary`,
    negative: NEGATIVE_PROMPT
  }),
  "home": (q) => ({
    positive: `home decor item ${q}, clean modern setting, natural lighting, minimal styling, interior design`,
    negative: NEGATIVE_PROMPT
  }),
  "beauty": (q) => ({
    positive: `beauty product ${q}, clean white background, professional product photography, cosmetics`,
    negative: NEGATIVE_PROMPT
  }),
  "sport": (q) => ({
    positive: `sports equipment ${q}, dynamic lighting, clean background, athletic gear, fitness`,
    negative: NEGATIVE_PROMPT
  }),
  "art": (q) => ({
    positive: `artistic item ${q}, creative composition, gallery lighting, cultural object, art supplies`,
    negative: NEGATIVE_PROMPT
  }),
  "food": (q) => ({
    positive: `gourmet food item ${q}, professional food photography, appetizing presentation, culinary`,
    negative: "no chocolate, no cacao, no cocoa, no text watermark, no logos, no brand names" // Allow other foods
  }),
  "default": (q) => ({
    positive: `clean studio shot of ${q}, centered, neutral background, realistic colors, professional photography`,
    negative: NEGATIVE_PROMPT
  })
};

export interface ImagePromptParams {
  positive: string;
  negative: string;
  steps: number;
  guidance: number;
  seed?: number;
}

export function buildImagePrompt(giftType: string, query: string): ImagePromptParams {
  const template = TEMPLATES[giftType] ?? TEMPLATES.default;
  const { positive, negative } = template(query);
  
  return {
    positive,
    negative,
    steps: 28,
    guidance: 7.5,
    seed: undefined // Random seed to avoid repetition
  };
}

export function categorizeGift(giftName: string): string {
  const name = giftName.toLowerCase();
  
  if (name.includes('fleur') || name.includes('bouquet') || name.includes('rose') || name.includes('flower')) {
    return 'flowers';
  }
  if (name.includes('tech') || name.includes('phone') || name.includes('ordinateur') || name.includes('électronique')) {
    return 'tech';
  }
  if (name.includes('vêtement') || name.includes('fashion') || name.includes('robe') || name.includes('t-shirt')) {
    return 'fashion';
  }
  if (name.includes('bijou') || name.includes('collier') || name.includes('bague') || name.includes('jewelry')) {
    return 'jewelry';
  }
  if (name.includes('livre') || name.includes('book') || name.includes('roman')) {
    return 'book';
  }
  if (name.includes('maison') || name.includes('déco') || name.includes('home') || name.includes('meuble')) {
    return 'home';
  }
  if (name.includes('beauté') || name.includes('cosmétique') || name.includes('beauty') || name.includes('parfum')) {
    return 'beauty';
  }
  if (name.includes('sport') || name.includes('fitness') || name.includes('exercise')) {
    return 'sport';
  }
  if (name.includes('art') || name.includes('peinture') || name.includes('créatif')) {
    return 'art';
  }
  if (name.includes('food') || name.includes('cuisine') || name.includes('restaurant') || name.includes('gastronomie')) {
    return 'food';
  }
  
  return 'default';
}

export function shouldExcludeFood(giftName: string): boolean {
  const foodKeywords = ['chocolat', 'chocolate', 'bonbon', 'candy', 'gâteau', 'cake', 'dessert'];
  const name = giftName.toLowerCase();
  return foodKeywords.some(keyword => name.includes(keyword));
}