/**
 * Fixtures de test pour validation anti-hallucination
 * Ces données simulent différents cas de figure
 */

import { ContactPreview } from '@/types/contact-strict';

// Cas valide : données strictes de DB
export const VALID_CONTACT: ContactPreview = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  owner_id: '123e4567-e89b-12d3-a456-426614174001',
  display_name: 'Charlotte Jeuniaux',
  nickname: null,
  avatar_url: null,
  regift_enabled: true,
  birthday: '1990-05-15',
  preferences: [
    {
      category: 'current_wants',
      value: 'Livres de cuisine italienne',
      sentiment: 'aime',
      source: 'user_entry'
    },
    {
      category: 'likes',
      value: 'Plantes d\'intérieur',
      sentiment: 'aime',
      source: 'user_entry'
    },
    {
      category: 'dislikes',
      value: 'Parfums forts',
      sentiment: 'n_aime_pas',
      source: 'user_entry'
    }
  ]
};

// Cas invalide : nom généré par IA
export const INVALID_CONTACT_GENERATED_NAME: Partial<ContactPreview> = {
  id: '123e4567-e89b-12d3-a456-426614174002',
  display_name: 'Utilisateur123',
  regift_enabled: false,
  preferences: []
};

// Cas invalide : préférences générées
export const INVALID_CONTACT_GENERATED_PREFS: Partial<ContactPreview> = {
  id: '123e4567-e89b-12d3-a456-426614174003',
  display_name: 'Marie Dupont',
  regift_enabled: true,
  preferences: [
    {
      category: 'likes',
      value: 'Exemple de préférence générée',
      sentiment: 'aime',
      source: 'user_entry'
    }
  ]
};

// Cas de test pour validation de texte
export const TEXT_VALIDATION_CASES = [
  {
    name: 'Texte valide avec données autorisées',
    text: 'Charlotte aime les livres de cuisine italienne et les plantes d\'intérieur',
    allowedValues: ['Charlotte', 'livres de cuisine italienne', 'plantes d\'intérieur'],
    shouldPass: true
  },
  {
    name: 'Texte invalide avec nom non autorisé',
    text: 'Charlotte et Marie aiment les livres',
    allowedValues: ['Charlotte', 'livres'],
    shouldPass: false,
    expectedReason: 'Nom propre non autorisé détecté: "Marie"'
  },
  {
    name: 'Texte invalide avec contenu généré',
    text: 'Cette personne semble apprécier les activités de loisir',
    allowedValues: ['Charlotte'],
    shouldPass: false
  },
  {
    name: 'Texte vide',
    text: '',
    allowedValues: ['Charlotte'],
    shouldPass: true
  },
  {
    name: 'Seulement mots de liaison',
    text: 'et le mais pour avec',
    allowedValues: [],
    shouldPass: true
  }
];

// Cas de test pour affichage sécurisé
export const SAFE_DISPLAY_CASES = [
  {
    input: 'Charlotte Jeuniaux',
    expected: 'Charlotte Jeuniaux'
  },
  {
    input: '',
    expected: 'Non renseigné'
  },
  {
    input: null,
    expected: 'Non renseigné'
  },
  {
    input: undefined,
    expected: 'Non renseigné'
  },
  {
    input: 'Utilisateur123',
    expected: 'Non renseigné'
  },
  {
    input: 'Généré automatiquement',
    expected: 'Non renseigné'
  },
  {
    input: 'Lorem ipsum',
    expected: 'Non renseigné'
  },
  {
    input: 'Test Contact',
    expected: 'Non renseigné'
  }
];

// Simulation de réponses API pour tests
export const API_RESPONSES = {
  valid_profile: {
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    display_name: 'Charlotte Jeuniaux',
    first_name: 'Charlotte',
    last_name: 'Jeuniaux',
    avatar_url: null,
    regift_enabled: true,
    birthday: '1990-05-15'
  },
  
  valid_preferences: {
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    current_wants: ['Livres de cuisine italienne', 'Plantes d\'intérieur'],
    likes: ['Cuisine', 'Jardinage'],
    dislikes: ['Parfums forts'],
    allergies: ['Arachides']
  },
  
  corrupted_profile: {
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    display_name: null,
    first_name: 'Utilisateur',
    last_name: '456',
    regift_enabled: 'yes' // Type invalide
  },
  
  empty_data: {},
  
  malformed_data: {
    some_random_field: 'random_value',
    user_id: 'not-a-uuid'
  }
};