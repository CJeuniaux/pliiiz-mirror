interface ProfileData {
  wishlist?: string[];
  food_prefs?: {
    likes?: string[];
    allergies?: string[];
  };
  style_prefs?: {
    brands?: string[];
    colors?: string[];
  };
  dislikes?: {
    dont?: string[];
  };
}

export function computeGiftIdeas(profile: ProfileData): string[] {
  const ideas: string[] = [];
  
  // Start with wishlist items (highest priority)
  if (profile.wishlist) {
    ideas.push(...profile.wishlist);
  }
  
  // Add suggestions based on food preferences
  const foodLikes = profile.food_prefs?.likes || [];
  foodLikes.forEach(like => {
    if (like.toLowerCase().includes('café') || like.toLowerCase().includes('coffee')) {
      ideas.push('Café de spécialité');
    }
    if (like.toLowerCase().includes('matcha')) {
      ideas.push('Thé matcha premium');
    }
    if (like.toLowerCase().includes('chocolat') || like.toLowerCase().includes('chocolate')) {
      ideas.push('Chocolat artisanal');
    }
    if (like.toLowerCase().includes('thé') || like.toLowerCase().includes('tea')) {
      ideas.push('Sélection de thés fins');
    }
  });
  
  // Add suggestions based on style preferences
  const styleColors = profile.style_prefs?.colors || [];
  styleColors.forEach(color => {
    if (color.toLowerCase().includes('violet') || color.toLowerCase().includes('purple')) {
      ideas.push('Accessoire violet');
    }
    if (color.toLowerCase().includes('bleu') || color.toLowerCase().includes('blue')) {
      ideas.push('Accessoire bleu');
    }
  });
  
  const styleBrands = profile.style_prefs?.brands || [];
  styleBrands.forEach(brand => {
    if (brand.toLowerCase().includes('eco') || brand.toLowerCase().includes('bio')) {
      ideas.push('Produits éco-responsables');
    }
  });
  
  // Filter out dislikes and allergies
  const excludeItems = new Set([
    ...(profile.dislikes?.dont || []),
    ...(profile.food_prefs?.allergies || [])
  ]);
  
  const filteredIdeas = ideas.filter(idea => 
    !Array.from(excludeItems).some(exclude => 
      idea.toLowerCase().includes(exclude.toLowerCase()) ||
      exclude.toLowerCase().includes(idea.toLowerCase())
    )
  );
  
  // Remove duplicates and limit to 6 items
  return Array.from(new Set(filteredIdeas)).slice(0, 6);
}