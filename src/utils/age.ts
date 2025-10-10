export function calculateAge(birthdate?: string | null): number | null {
  if (!birthdate) return null;
  
  const birthDate = new Date(birthdate);
  if (isNaN(birthDate.getTime())) return null;
  
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

export function validateAge(birthdate: string): { isValid: boolean; message?: string } {
  if (!birthdate) {
    return { isValid: true }; // Optional field
  }
  
  const age = calculateAge(birthdate);
  if (age === null) {
    return { isValid: false, message: 'Format de date invalide' };
  }
  
  if (age < 13) {
    return { isValid: false, message: 'Vous devez avoir au moins 13 ans' };
  }
  
  if (age > 120) {
    return { isValid: false, message: 'Âge invalide' };
  }
  
  return { isValid: true };
}