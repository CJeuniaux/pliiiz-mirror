// Types stricts pour les contacts - Source de vérité unique DB
export type ContactPreview = {
  id: string;
  owner_id: string;
  display_name: string;        // obligatoire - saisi utilisateur
  nickname?: string | null;    // optionnel
  avatar_url?: string | null;  // optionnel
  regift_enabled: boolean;     // strict boolean de profiles.regift_enabled
  birthday?: string | null;    // strict de profiles.birthday
  city?: string | null;        // ville du contact
  preferences: ContactPreference[];
};

export type ContactPreference = {
  category: 'current_wants' | 'likes' | 'dislikes' | 'allergies';
  value: string;               // saisi utilisateur, jamais généré
  sentiment: 'aime' | 'n_aime_pas' | 'allergie';
  source: 'user_entry' | 'import' | 'admin';
};

// Validation anti-hallucination
export function validateContactData(data: any): data is ContactPreview {
  return (
    typeof data.display_name === 'string' &&
    data.display_name.length > 0 &&
    typeof data.regift_enabled === 'boolean' &&
    Array.isArray(data.preferences) &&
    data.preferences.every((p: any) => 
      typeof p.value === 'string' && 
      p.value.length > 0 &&
      ['current_wants', 'likes', 'dislikes', 'allergies'].includes(p.category)
    )
  );
}

// Garde-fou : mots autorisés pour validation de texte
export function validateDisplayText(text: string, allowedValues: string[]): boolean {
  const allowedSet = new Set(allowedValues.map(v => v.toLowerCase()));
  const glueWords = /^[a-zàâçéèêëîïôûùüÿñæœ ,;.!?()''-]+$/i;
  
  // Vérifier que tous les noms propres sont dans la liste autorisée
  const properNames = text.match(/\b[A-Z][a-zéèêîïôûùç-]{1,}\b/g) ?? [];
  if (properNames.some(n => !allowedSet.has(n.toLowerCase()))) return false;
  
  // Vérifier les caractères autorisés
  const cleanedText = text.replace(new RegExp(allowedValues.join('|'), 'gi'), '');
  return glueWords.test(cleanedText);
}