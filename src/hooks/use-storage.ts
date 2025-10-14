import { useState, useEffect } from 'react';

// Simple local storage hook for MVP (will be replaced with Supabase)
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

// Mock data store for development
export function useMockStore() {
  const [currentUser, setCurrentUser] = useLocalStorage('pliiiz_current_user', null);
  const [profiles, setProfiles] = useLocalStorage('pliiiz_profiles', {});
  const [preferences, setPreferences] = useLocalStorage('pliiiz_preferences', {});
  const [accessRequests, setAccessRequests] = useLocalStorage('pliiiz_access_requests', []);
  const [ideas, setIdeas] = useLocalStorage('pliiiz_ideas', []);
  const [reservations, setReservations] = useLocalStorage('pliiiz_reservations', []);

  return {
    currentUser,
    setCurrentUser,
    profiles,
    setProfiles,
    preferences,
    setPreferences,
    accessRequests,
    setAccessRequests,
    ideas,
    setIdeas,
    reservations,
    setReservations
  };
}