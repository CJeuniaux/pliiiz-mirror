# Refactoring Front-end - Résumé des changements

## Objectif
Corriger les appels Supabase côté client pour éviter "erreur lors de la mise à jour" et "ça charge en continu", avec gestion robuste des erreurs et de la session.

## Nouveaux fichiers créés

### 1. `src/lib/supabase-helpers.ts`
Utilitaires centralisés pour la gestion Supabase :
- **`requireSession()`** : Vérifie qu'une session active existe
- **`withTimeout()`** : Wrapper pour ajouter un timeout de 15s aux opérations
- **`handleAuthError()`** : Gère les erreurs 401/403 avec déconnexion automatique
- **`executeSupabaseOperation()`** : Wrapper générique avec gestion complète des erreurs et timeouts

### 2. `src/lib/connections-api.ts`
API centralisée pour les connexions :
- **`acceptConnection(requestId)`** : Accepte une demande de connexion
- **`rejectConnection(requestId)`** : Refuse une demande
- **`createConnectionRequest()`** : Crée une nouvelle demande
- **`getReceivedRequests(userId)`** : Récupère les demandes reçues
- **`getSentRequests(userId)`** : Récupère les demandes envoyées

**Améliorations :**
- Filtrage systématique par PK (`eq('id', requestId)`)
- Timeouts automatiques (15s)
- Toasts avec messages d'erreur détaillés
- Gestion des erreurs d'authentification

### 3. `src/lib/preferences-api.ts`
API centralisée pour les préférences :
- **`savePreferences(userId, preferences)`** : Sauvegarde avec upsert
- **`getPreferences(userId)`** : Récupère les préférences
- **`patchPreferencesDeep(userId, patch)`** : Patch profond via RPC

**Améliorations :**
- Upsert avec `onConflict: 'user_id'` (utilise la contrainte unique)
- Gestion d'erreurs robuste
- Pas de spinner infini

## Fichiers refactorés

### `src/hooks/use-contact-management.ts`
**Avant :** Requêtes Supabase directes avec gestion d'erreurs manuelle
**Après :** Utilise les nouvelles fonctions API centralisées

**Changements :**
- `acceptRequest()` utilise `acceptConnectionApi()`
- `rejectRequest()` utilise `rejectConnectionApi()`
- `createRequest()` utilise `createConnectionRequestApi()`
- Suppression du code dupliqué de gestion d'erreurs
- Meilleure gestion des états de loading

### `src/lib/persistence.ts`
**Avant :** Gestion de session manuelle avec `getUser()`
**Après :** Utilise `requireSession()` et les nouvelles APIs

**Changements :**
- `getUserId()` utilise `requireSession()`
- `saveGlobalPreferences()` utilise `patchPreferencesDeep()`
- `saveProfile()` ajoute le filtre `.eq('user_id', userId)`
- Messages d'erreur plus détaillés

## Gardes-fous UX implémentés

1. ✅ **Try/catch/finally** : Tous les appels mutateurs encapsulés
2. ✅ **Toasts détaillés** : Affichent `error.message` complet de Supabase
3. ✅ **Timeout réseau** : 15s max, puis toast "Temps dépassé"
4. ✅ **Gestion 401/403** : Déconnexion automatique + redirection login
5. ✅ **Filtrage par PK** : Tous les updates utilisent `.eq('id', ...)` ou `.eq('user_id', ...)`
6. ✅ **Upsert fiable** : `onConflict: 'user_id'` pour les préférences
7. ✅ **Pas de spinner infini** : `finally` garantit l'arrêt du loading

## Tests d'acceptation

### Test 1 : Accepter une demande
```typescript
// Depuis le compte cible
await acceptConnection(requestId);
// ✅ Toast succès
// ✅ Ligne mise à jour dans requests
// ✅ Contacts créés automatiquement par trigger DB
```

### Test 2 : Sauvegarder des préférences
```typescript
// Préférences vides
await savePreferences(userId, {});
// ✅ Toast succès, aucune erreur RLS

// Préférences modifiées
await savePreferences(userId, { likes: ['chocolat'] });
// ✅ Toast succès, upsert réussi
```

### Test 3 : Page /diag
```
// Tous les tests doivent passer :
✅ Session valide
✅ SELECT profiles
✅ SELECT connections
✅ SELECT preferences
✅ INSERT connections (test)
✅ UPDATE connections
```

## Migration de code existant

Pour migrer d'anciens appels Supabase :

**Avant :**
```typescript
const { data, error } = await supabase
  .from('requests')
  .update({ status: 'accepted' })
  .select()
  .single();

if (error) {
  toast.error('Erreur');
  return;
}
```

**Après :**
```typescript
import { acceptConnection } from '@/lib/connections-api';

try {
  const data = await acceptConnection(requestId);
  // Toast de succès automatique
} catch (error) {
  // Toast d'erreur automatique avec message détaillé
}
```

## Points de vigilance

1. **Toujours filtrer par PK** : Ne jamais oublier `.eq('id', ...)` sur les updates
2. **Utiliser requireSession()** : Au lieu de vérifier manuellement la session
3. **Pas de timeout manuel** : Le wrapper `executeSupabaseOperation` le gère
4. **Erreurs d'auth** : Automatiquement détectées et gèrent la déconnexion
5. **Tests /diag** : Vérifier régulièrement que toutes les RLS policies fonctionnent

## Prochaines étapes

1. Migrer les autres hooks qui font des appels Supabase directs
2. Ajouter des tests unitaires pour les nouvelles APIs
3. Documenter les patterns pour les nouveaux développeurs
4. Monitorer les erreurs timeout en production
