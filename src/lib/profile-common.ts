// Common types and selectors for profile components

export interface ProfileBlocks {
  likes: string[];
  dislikes: string[];
  allergies: string[];
  wants: string[];
  sizes: any;
  tastesByEvent?: any;
}

export interface CarouselItem {
  label: string;
  imageUrl?: string;
  category?: string;
}

const NEG = "no chocolate, no cacao, no cocoa, no dessert, no candy, no sweets, no stains, no text, no logos";

export function buildGiftImagePrompt(label: string, category?: string) {
  const pos = category
    ? `clean studio photo of ${label} (${category}), neutral background, realistic colors, soft light`
    : `clean studio photo of ${label}, neutral background, realistic colors, soft light`;
  return { positive: pos, negative: NEG, steps: 28, guidance: 7.5 };
}

export function selectCarouselItems(blocks: ProfileBlocks): CarouselItem[] {
  const items: CarouselItem[] = [];
  
  // Priority: top 2 from likes, then 1 from wants
  const topLikes = blocks.likes.slice(0, 2);
  const topWants = blocks.wants.slice(0, 1);
  
  // Add likes first
  topLikes.forEach(like => {
    items.push({ label: like });
  });
  
  // Add wants if not already in likes
  topWants.forEach(want => {
    if (!items.find(item => item.label === want)) {
      items.push({ label: want });
    }
  });
  
  // Fill remaining with more likes if less than 3
  if (items.length < 3) {
    const remainingLikes = blocks.likes.slice(2);
    remainingLikes.forEach(like => {
      if (items.length < 3 && !items.find(item => item.label === like)) {
        items.push({ label: like });
      }
    });
  }
  
  return items.slice(0, 3);
}