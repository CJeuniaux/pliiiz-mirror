import { z } from 'zod';

// Schema de validation pour les préférences
export const PreferencesSchema = z.object({
  likes: z.array(z.string()).optional().default([]),
  avoid: z.array(z.string()).optional().default([]),
  allergies: z.array(z.string()).optional().default([]),
  gift_ideas: z.array(z.string()).optional().default([]),
  sizes: z.object({
    top: z.string().optional(),
    bottom: z.string().optional(),
    shoes: z.string().optional(),
    ring: z.string().optional(),
    other: z.string().optional(),
  }).optional().default({}),
});

export const OccasionPreferencesSchema = z.object({
  likes: z.array(z.string()).optional().default([]),
  avoid: z.array(z.string()).optional().default([]),
  allergies: z.array(z.string()).optional().default([]),
  giftIdeas: z.array(z.string()).optional().default([]),
});

export const PatchSchema = z.object({
  likes: z.array(z.string()).optional(),
  avoid: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  gift_ideas: z.array(z.string()).optional(),
  sizes: z.object({
    top: z.string().optional(),
    bottom: z.string().optional(),
    shoes: z.string().optional(),
    ring: z.string().optional(),
    other: z.string().optional(),
  }).optional(),
  occasions: z.record(z.string(), z.object({
    likes: z.array(z.string()).optional(),
    avoid: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    giftIdeas: z.array(z.string()).optional(),
  })).optional(),
});

// Helper pour valider et nettoyer les données avant sauvegarde
export function validateAndSanitizePatch(patch: any): z.infer<typeof PatchSchema> {
  const result = PatchSchema.safeParse(patch);
  
  if (!result.success) {
    console.error('[Validation] Patch validation failed:', result.error);
    console.error('[Validation] Original patch:', patch);
    throw new Error('Données invalides pour la sauvegarde');
  }
  
  console.log('[Validation] Patch validated successfully:', result.data);
  return result.data;
}

// Helper pour valider les préférences d'occasion
export function validateOccasionPreferences(data: any): z.infer<typeof OccasionPreferencesSchema> {
  try {
    return OccasionPreferencesSchema.parse(data);
  } catch (error) {
    console.error('[Validation] Occasion preferences validation failed:', error);
    throw new Error('Données d\'occasion invalides');
  }
}