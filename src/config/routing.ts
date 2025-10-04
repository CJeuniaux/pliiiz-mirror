/**
 * Configuration des routes de navigation
 * 
 * ONBOARD_DEST définit où l'utilisateur est redirigé après l'onboarding.
 * Il doit pointer vers /login et NON /register pour éviter l'inscription automatique.
 */

export const ONBOARD_DEST = '/login'; // Destination après onboarding - toujours /login