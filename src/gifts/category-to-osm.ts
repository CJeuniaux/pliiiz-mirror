export type OsmQuery = { 
  shop?: string[]; 
  amenity?: string[] 
};

export const CATEGORY_TO_OSM: Record<string, OsmQuery> = {
  vinyl: { shop: ['music', 'second_hand'] },
  book: { shop: ['books'] },
  wine: { shop: ['wine', 'beverages'] },
  flowers: { shop: ['florist'] },
  jewelry: { shop: ['jewelry'] },
  tech: { shop: ['electronics', 'computer'] },
  kitchen: { shop: ['kitchen', 'houseware'] },
  toys: { shop: ['toys'] },
  fashion: { shop: ['clothes', 'shoes', 'boutique'] },
  cosmetics: { shop: ['perfumery', 'beauty'] },
  home_deco: { shop: ['interior_decoration', 'furniture', 'houseware'] },
  coffee: { shop: ['coffee'] },
  chocolate: { shop: ['confectionery', 'chocolate'] },
  plants: { shop: ['garden_centre', 'florist'] },
  default: { shop: ['gift'] }
};

export function getCategoryFromGiftType(giftType: string): string {
  const type = giftType.toLowerCase();
  
  if (type.includes('livre') || type.includes('book')) return 'book';
  if (type.includes('vin') || type.includes('wine')) return 'wine';
  if (type.includes('fleur') || type.includes('flower')) return 'flowers';
  if (type.includes('bijou') || type.includes('jewelry')) return 'jewelry';
  if (type.includes('tech') || type.includes('électro')) return 'tech';
  if (type.includes('cuisine') || type.includes('kitchen')) return 'kitchen';
  if (type.includes('jouet') || type.includes('toy')) return 'toys';
  if (type.includes('vêtement') || type.includes('mode') || type.includes('fashion')) return 'fashion';
  if (type.includes('cosmét') || type.includes('parfum') || type.includes('beauty')) return 'cosmetics';
  if (type.includes('déco') || type.includes('maison') || type.includes('home')) return 'home_deco';
  if (type.includes('café') || type.includes('coffee')) return 'coffee';
  if (type.includes('chocolat') || type.includes('chocolate')) return 'chocolate';
  if (type.includes('plante') || type.includes('plant')) return 'plants';
  if (type.includes('vinyle') || type.includes('vinyl')) return 'vinyl';
  
  return 'default';
}