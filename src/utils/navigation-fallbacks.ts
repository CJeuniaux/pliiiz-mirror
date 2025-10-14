/**
 * Navigation fallback routes for when history.back() is not available
 * Maps current route patterns to their logical parent routes
 */

export interface NavigationFallback {
  pattern: RegExp;
  fallback: string;
  description: string;
}

export const NAVIGATION_FALLBACKS: NavigationFallback[] = [
  // Profile routes
  {
    pattern: /^\/profil\/[^\/]+$/,
    fallback: '/contacts',
    description: 'Public profile → Contacts list'
  },
  
  // Offrir routes  
  {
    pattern: /^\/offrir\//,
    fallback: '/home',
    description: 'Offrir pages → Home'
  },
  
  // Settings and secondary pages
  {
    pattern: /^\/edit-profile/,
    fallback: '/profile',
    description: 'Edit profile → My profile'
  },
  
  {
    pattern: /^\/privacy-settings/,
    fallback: '/profile',
    description: 'Privacy settings → My profile'
  },
  
  {
    pattern: /^\/requests/,
    fallback: '/home',
    description: 'Requests → Home'
  },
  
  {
    pattern: /^\/notifications/,
    fallback: '/home', 
    description: 'Notifications → Home'
  },
  
  {
    pattern: /^\/contacts/,
    fallback: '/home',
    description: 'Contacts → Home'
  },
  
  {
    pattern: /^\/carte/,
    fallback: '/home',
    description: 'Map → Home'
  },
  
  // Onboarding
  {
    pattern: /^\/onboarding/,
    fallback: '/login',
    description: 'Onboarding → Login'
  },
  
  // Auth pages
  {
    pattern: /^\/register/,
    fallback: '/login',
    description: 'Register → Login'
  },
  
  {
    pattern: /^\/reset-password/,
    fallback: '/login',
    description: 'Reset password → Login'
  }
];

/**
 * Get fallback route for current path
 */
export function getFallbackRoute(currentPath: string): string {
  for (const fallback of NAVIGATION_FALLBACKS) {
    if (fallback.pattern.test(currentPath)) {
      return fallback.fallback;
    }
  }
  
  // Default fallback
  return '/home';
}

/**
 * Check if route has a logical parent
 */
export function hasLogicalParent(currentPath: string): boolean {
  return NAVIGATION_FALLBACKS.some(fallback => 
    fallback.pattern.test(currentPath)
  );
}