/**
 * Garde-fous anti-hallucination pour Pliiiz
 * Principes : ZÉRO GÉNÉRATION pour identité et préférences
 */

// Feature flag pour désactiver l'IA instantanément
export const AI_FEATURES_ENABLED = {
  contact_summary: false,        // Résumés de contact par IA
  preference_enrichment: false,  // Enrichissement des préférences
  name_suggestions: false,       // Suggestions de noms
  bio_generation: false          // Génération de bio
};

// Mots de liaison autorisés pour validation de texte
const ALLOWED_GLUE_WORDS = [
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car',
  'avec', 'sans', 'pour', 'par', 'dans', 'sur', 'sous', 'vers', 'chez', 'selon', 'contre',
  'aime', 'adore', 'préfère', 'déteste', 'apprécie', 'évite', 'recherche', 'souhaite',
  'plutôt', 'très', 'assez', 'peu', 'beaucoup', 'trop', 'jamais', 'toujours', 'souvent',
  'que', 'qui', 'dont', 'où', 'quand', 'comment', 'pourquoi',
  'ce', 'ces', 'cet', 'cette', 'son', 'sa', 'ses', 'leur', 'leurs', 'mon', 'ma', 'mes',
  'a', 'est', 'sont', 'était', 'étaient', 'sera', 'seront', 'avoir', 'être',
  'pas', 'ne', 'non', 'oui', 'si', 'aussi', 'encore', 'déjà', 'ici', 'là'
];

/**
 * Validation stricte des données de contact
 * Rejette tout ce qui pourrait être généré par IA
 */
export function validateContactIntegrity(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Vérification du nom d'affichage
  if (!data.display_name || typeof data.display_name !== 'string') {
    errors.push('display_name manquant ou invalide');
  } else if (data.display_name.trim().length === 0) {
    errors.push('display_name vide');
  } else if (data.display_name.includes('Utilisateur') || data.display_name.includes('User')) {
    errors.push('display_name semble généré (contient "Utilisateur" ou "User")');
  }

  // Vérification des préférences
  if (data.preferences && Array.isArray(data.preferences)) {
    data.preferences.forEach((pref: any, index: number) => {
      if (!pref.value || typeof pref.value !== 'string') {
        errors.push(`Préférence ${index}: valeur manquante ou invalide`);
      } else if (pref.value.includes('Généré') || pref.value.includes('Exemple')) {
        errors.push(`Préférence ${index}: valeur semble générée (${pref.value})`);
      }
      
      if (!['current_wants', 'likes', 'dislikes', 'allergies'].includes(pref.category)) {
        errors.push(`Préférence ${index}: catégorie invalide (${pref.category})`);
      }
      
      if (!['aime', 'n_aime_pas', 'allergie'].includes(pref.sentiment)) {
        errors.push(`Préférence ${index}: sentiment invalide (${pref.sentiment})`);
      }
    });
  }

  // Vérification regift_enabled (doit être boolean strict)
  if (typeof data.regift_enabled !== 'boolean') {
    errors.push('regift_enabled doit être un boolean strict');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validation anti-hallucination pour texte généré
 * Vérifie qu'aucun nom propre non autorisé n'apparaît
 */
export function validateGeneratedText(
  text: string, 
  allowedValues: string[], 
  context: 'summary' | 'description' | 'bio'
): { valid: boolean; reason?: string } {
  if (!AI_FEATURES_ENABLED.contact_summary && context === 'summary') {
    return { valid: false, reason: 'Génération de résumé désactivée' };
  }

  // Créer un set des valeurs autorisées (insensible à la casse)
  const allowedSet = new Set(allowedValues.map(v => v.toLowerCase().trim()));
  
  // Ajouter les mots de liaison autorisés
  ALLOWED_GLUE_WORDS.forEach(word => allowedSet.add(word.toLowerCase()));

  // Extraire tous les mots du texte
  const words = text.toLowerCase()
    .replace(/[^\w\sàâçéèêëîïôûùüÿñæœ-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);

  // Vérifier que chaque mot est autorisé
  for (const word of words) {
    if (!allowedSet.has(word)) {
      // Vérifier si c'est un nom propre (commence par majuscule)
      const originalWord = text.match(new RegExp(`\\b${word}\\b`, 'i'))?.[0];
      if (originalWord && /^[A-Z]/.test(originalWord)) {
        return { 
          valid: false, 
          reason: `Nom propre non autorisé détecté: "${originalWord}"` 
        };
      }
      
      // Vérifier si c'est un mot suspect (trop long, caractères étranges)
      if (word.length > 20 || /[0-9]/.test(word)) {
        return { 
          valid: false, 
          reason: `Mot suspect détecté: "${word}"` 
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Log de sécurité pour traçabilité
 */
export function logSecurityCheck(
  action: string,
  data: any,
  result: { valid: boolean; errors?: string[]; reason?: string }
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    data_summary: {
      display_name: data.display_name || 'N/A',
      preferences_count: data.preferences?.length || 0,
      regift_enabled: data.regift_enabled
    },
    validation_result: result,
    feature_flags: AI_FEATURES_ENABLED
  };

  console.log('PLIIIZ_SECURITY_CHECK:', JSON.stringify(logEntry));
  
  // En production, envoyer à un service de monitoring
  if (process.env.NODE_ENV === 'production' && !result.valid) {
    console.error('PLIIIZ_SECURITY_VIOLATION:', logEntry);
  }
}

/**
 * Fonction utilitaire pour affichage sécurisé
 * Retourne "Non renseigné" si la valeur est vide ou suspecte
 */
export function safeDisplay(value: any, fallback: string = 'Non renseigné'): string {
  if (!value || typeof value !== 'string') {
    return fallback;
  }
  
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return fallback;
  }
  
  // Vérifier les valeurs suspectes
  const suspiciousPatterns = [
    /^(Utilisateur|User|Contact|Personne)\s*\d*$/i,
    /^(Généré|Generated|Exemple|Example)/i,
    /^(Lorem|Ipsum)/i,
    /^(Test|Demo)/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmed)) {
      console.warn('Valeur suspecte détectée:', trimmed);
      return fallback;
    }
  }
  
  return trimmed;
}

/**
 * Middleware pour API endpoints
 * Valide automatiquement les données avant envoi
 */
export function secureApiResponse<T>(data: T, type: 'contact' | 'profile'): T | null {
  if (type === 'contact') {
    const validation = validateContactIntegrity(data);
    logSecurityCheck('api_response_validation', data, validation);
    
    if (!validation.valid) {
      console.error('Données de contact invalidées:', validation.errors);
      return null;
    }
  }
  
  return data;
}