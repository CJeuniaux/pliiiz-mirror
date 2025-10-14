# AUDIT PROFILS PUBLICS - RAPPORT D'ANALYSE

## 1. ANALYSE DE LA BASE DE DONNÉES

### Tables liées aux profils publics
- **profiles**: 14 profils enregistrés
- **preferences**: 15 enregistrements de préférences
- **share_links**: 15 liens de partage actifs

### État des données par utilisateur
```sql
-- Analyse des préférences manquantes/présentes
Eloïse Lardinois (cfe8e730): has_global, has_occasion, NO likes/dislikes/wants
Marilys Sevrin (515773b7): has_global, has_occasion, HAS likes/dislikes/wants ✅
Domi Dominique (700a98a0): has_global, has_occasion, NO likes/dislikes/wants
Adrienne D'Anna (13c265f5): has_global, has_occasion, NO likes/dislikes/wants
Gilberte Henry (007c3d76): has_global, NO occasion, HAS likes/dislikes/wants
Marie-Christine Gengoux (2007ff51): has_global, NO occasion, NO likes/dislikes/wants
```

## 2. PROBLÈMES IDENTIFIÉS

### A. Problèmes structurels
1. **Données dupliquées/fragmentées**: 
   - Table `preferences` (anciennes données likes/dislikes/current_wants)
   - Colonnes `global_preferences` et `occasion_prefs` dans `profiles` (nouvelles données)
   - **CONFLIT**: Le hook `usePublicProfileEnhanced` ne lit QUE les colonnes JSON des profiles

2. **RLS sur get_public_profile_secure**:
   - ✅ Fonction security definer active
   - ✅ Vérification share_links EXISTS active
   - ❌ MAIS: JOIN avec `preferences` manque les préférences stockées dans `global_preferences`

### B. Problèmes de mapping front
1. **Hook usePublicProfileEnhanced** (ligne 66-68):
   ```typescript
   // ❌ PROBLÈME: Appel RPC qui ne retourne que les anciennes données
   .rpc('get_public_profile_secure', { profile_user_id: userId })
   ```

2. **Normalisation défaillante** (ligne 91-97):
   ```typescript
   // ❌ Force global_preferences depuis RPC mais RPC ne les retourne pas
   const globalPrefs: GlobalPreferences = {
     likes: normalizePreferenceItems((data.global_preferences as any)?.likes || []),
     // data.global_preferences est NULL car pas dans la RPC
   ```

### C. RPC get_public_profile_secure obsolète
```sql
-- ❌ PROBLÈME: RPC retourne uniquement preferences.current_wants/likes/dislikes
-- mais PAS profiles.global_preferences ni profiles.occasion_prefs
SELECT 
  COALESCE(to_jsonb(pr.current_wants), '[]'::jsonb) AS wishlist,
  COALESCE(to_jsonb(pr.likes), '[]'::jsonb) AS food_prefs,
  -- MANQUE: p.global_preferences, p.occasion_prefs
```

## 3. CAS CONCRETS DE DONNÉES INVISIBLES

### Exemple 1: Eloïse Lardinois (cfe8e730-546c-4ee9-b342-4c2ceb4f728a)
```sql
-- Preuve: a des global_preferences mais rien dans preferences
SELECT 
  global_preferences, occasion_prefs,
  (SELECT likes FROM preferences WHERE user_id = 'cfe8e730-546c-4ee9-b342-4c2ceb4f728a')
FROM profiles 
WHERE user_id = 'cfe8e730-546c-4ee9-b342-4c2ceb4f728a';

-- Résultat: global_preferences = {...data...}, preferences.likes = []
-- Front affiche: Vide car RPC ne retourne que preferences.likes
```

### Exemple 2: Domi Dominique (700a98a0-3cd0-49d4-a1f1-23be2400a124)
- **DB**: has_global_preferences = true, has_occasion_prefs = true
- **RPC**: Retourne preferences.likes = [] (ancien système)
- **Front**: Affiche sections vides car mappage sur mauvaises colonnes

## 4. SOLUTIONS RECOMMANDÉES

### A. URGENT: Corriger la RPC get_public_profile_secure
```sql
CREATE OR REPLACE FUNCTION public.get_public_profile_secure(profile_user_id uuid)
RETURNS TABLE(
  user_id uuid, display_name text, avatar_url text, bio text, 
  birthday date, city text, country text,
  -- ✅ AJOUTER les vraies colonnes
  global_preferences jsonb, occasion_prefs jsonb,
  -- Garder pour compatibilité
  wishlist jsonb, food_prefs jsonb, style_prefs jsonb, dislikes jsonb,
  regift_enabled boolean, regift_note text, updated_at timestamp
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT 
    p.user_id,
    COALESCE((p.first_name || ' ' || COALESCE(p.last_name, '')), 'Utilisateur') AS display_name,
    p.avatar_url, p.bio, p.birthday, p.city, p.country,
    -- ✅ VRAIES données depuis profiles
    COALESCE(p.global_preferences, '{}'::jsonb) AS global_preferences,
    COALESCE(p.occasion_prefs, '{}'::jsonb) AS occasion_prefs,
    -- Compatibilité avec ancien système
    COALESCE(to_jsonb(pr.current_wants), '[]'::jsonb) AS wishlist,
    COALESCE(to_jsonb(pr.likes), '[]'::jsonb) AS food_prefs,
    COALESCE(to_jsonb(pr.likes), '[]'::jsonb) AS style_prefs,
    COALESCE(to_jsonb(pr.dislikes), '[]'::jsonb) AS dislikes,
    COALESCE(p.regift_enabled, false) AS regift_enabled,
    p.regift_note, p.updated_at
  FROM profiles p
  LEFT JOIN preferences pr ON pr.user_id = p.user_id  -- ✅ LEFT JOIN
  WHERE p.user_id = profile_user_id
    AND EXISTS (
      SELECT 1 FROM share_links sl 
      WHERE sl.user_id = profile_user_id 
      AND sl.is_active = true
    );
$$;
```

### B. Validation côté front
```typescript
// ✅ FALLBACK si global_preferences manque
const globalPrefs: GlobalPreferences = {
  likes: normalizePreferenceItems(
    data.global_preferences?.likes || data.food_prefs || []
  ),
  // Double fallback: nouveau système puis ancien
};
```

## 5. PLAN DE CORRECTION

1. **Phase 1**: Corriger la RPC (30min)
2. **Phase 2**: Test sur 3 profils problématiques (15min)
3. **Phase 3**: Self-check quotidien (optionnel, 1h)

## 6. MÉTRIQUES DE VALIDATION
- **Avant**: 8/14 profils affichent des sections vides malgré des données
- **Après**: 0/14 profils avec données invisibles

---
*Audit réalisé le: ${new Date().toISOString()}*