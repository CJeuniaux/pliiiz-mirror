export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export function validateDisplayName(name: string): ValidationResult {
  if (!name || name.trim().length < 2) {
    return { isValid: false, message: 'Le nom doit contenir au moins 2 caractères' };
  }
  
  if (name.length > 60) {
    return { isValid: false, message: 'Le nom ne peut pas dépasser 60 caractères' };
  }
  
  return { isValid: true };
}

export function validateCity(city: string): ValidationResult {
  if (!city) {
    return { isValid: true }; // Optional field
  }
  
  if (city.trim().length < 2) {
    return { isValid: false, message: 'La ville doit contenir au moins 2 caractères' };
  }
  
  if (city.length > 60) {
    return { isValid: false, message: 'La ville ne peut pas dépasser 60 caractères' };
  }
  
  return { isValid: true };
}

export function validateBio(bio: string): ValidationResult {
  if (!bio) {
    return { isValid: true }; // Optional field
  }
  
  if (bio.length > 500) {
    return { isValid: false, message: 'La bio ne peut pas dépasser 500 caractères' };
  }
  
  return { isValid: true };
}

export function createDiffPayload<T extends Record<string, any>>(
  original: T, 
  updated: T
): Partial<T> {
  const diff: Partial<T> = {};
  
  for (const key in updated) {
    if (original[key] !== updated[key]) {
      diff[key] = updated[key];
    }
  }
  
  return diff;
}