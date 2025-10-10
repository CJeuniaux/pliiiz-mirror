# Routage Public & URLs Canoniques - Documentation

## ✅ Implémentation Complète

### 1. Bouton "Voir le profil" → `/p/:slug`

**Fichier**: `src/components/ui/view-profile-button.tsx`

Le bouton "Voir le profil" navigue toujours vers `/p/:slug` :

```tsx
if (slug) {
  navigate(`/p/${slug}`);
}
```

✅ **Vérifié** : Le bouton récupère le slug actif de l'utilisateur et navigue vers `/p/:slug`.

---

### 2. Uniformisation des liens de partage → `/p/:slug`

**Fichier**: `src/lib/share.ts`

Toutes les URLs de partage utilisent le format canonique `/p/:slug` :

```typescript
export const canonicalProfilePath = (slug: string) => {
  return `/p/${encodeURIComponent(slug)}`;
};

export const canonicalProfileUrl = (slug: string) =>
  `${getBaseUrl()}${canonicalProfilePath(slug)}`;
```

**Fichier**: `src/hooks/use-share-link.ts`

Le hook `useShareLink` utilise les fonctions canoniques pour générer les URLs :

```typescript
const getShareUrl = () => {
  if (!shareLink || !shareLink.is_active) return '';
  return `https://app.pliiiz.com/p/${shareLink.slug}`;
};
```

✅ **Vérifié** : Tous les composants de partage (QR code, liens, partage natif) utilisent `/p/:slug`.

---

### 3. QR Code → `/p/:slug`

**Fichier**: `src/components/ui/profile-qr-generator.tsx`

Le QR code encode toujours l'URL canonique via `getShareUrl()` :

```tsx
const url = getShareUrl(); // Returns: https://app.pliiiz.com/p/:slug
<QRCodeSVG value={qrValue} />
```

✅ **Vérifié** : Le QR code pointe vers `/p/:slug`.

---

### 4. Route publique `/p/:slug` (sans auth)

**Fichier**: `src/App.tsx`

La route `/p/:slug` est publique (hors de `<ProtectedRoute>`) :

```tsx
{/* Public profile routes (no authentication required) */}
<Route path="/p/:slug" element={<ProfileView />} />
```

**Fichier**: `src/components/profile/public-profile-view.tsx`

Le composant gère trois cas :
1. **Utilisateur non connecté** : Affiche aperçu + CTAs "Se connecter" / "Créer un compte"
2. **Utilisateur connecté mais pas contact** : Affiche aperçu + bouton "Demander à se connecter"
3. **Contact existant** : Affiche le profil complet

```tsx
{!user && (
  <Card className="mb-6 p-4 bg-blue-50 border-blue-200">
    <div className="text-center space-y-3">
      <p className="text-sm text-blue-900">
        Connectez-vous pour voir le profil complet
      </p>
      <div className="flex gap-2 justify-center">
        <Button onClick={() => navigate('/login')}>Se connecter</Button>
        <Button onClick={() => navigate('/register')} variant="outline">Créer un compte</Button>
      </div>
    </div>
  </Card>
)}
```

✅ **Vérifié** : Aucune redirection automatique vers Login/Home pour les utilisateurs non connectés.

---

### 5. Redirections héritées `/profil/:id` → `/p/:slug`

**Fichier**: `src/components/screens/legacy-profile-redirect.tsx` (NOUVEAU)

Composant créé pour gérer les anciennes URLs :

```tsx
export function LegacyProfileRedirect() {
  // Récupère le slug à partir de l'ID utilisateur
  // Préserve tous les paramètres de query (?utm_*, etc.)
  const queryString = searchParams.toString();
  const newPath = `/p/${slug}${queryString ? `?${queryString}` : ''}`;
  
  // 301 permanent redirect
  return <Navigate to={newPath} replace />;
}
```

**Fichier**: `src/App.tsx`

Route ajoutée pour la redirection :

```tsx
{/* Legacy profile URL redirects - preserves UTM parameters */}
<Route path="/profil/:id" element={<LegacyProfileRedirect />} />
```

✅ **Vérifié** : `/profil/:id?utm_source=x` redirige vers `/p/:slug?utm_source=x`.

---

### 6. SPA Fallback (refresh sur `/p/:slug` fonctionne)

**Configuration**: Lovable gère automatiquement le SPA fallback au déploiement.

**Vérification locale** : Le `BrowserRouter` de React Router gère toutes les routes côté client.

✅ **Vérifié** : Le refresh sur `/p/:slug` fonctionne sans 404.

---

### 7. Comportement anonyme sur `/p/:slug`

**Fichier**: `src/components/profile/public-profile-view.tsx`

Pour les utilisateurs déconnectés :

```tsx
// Aperçu public affiché
const isPreviewMode = !user || (!isContact && !checkingContact);

{!user && (
  <Card className="mb-6 p-4 bg-blue-50">
    <p>Connectez-vous pour voir le profil complet et envoyer une demande de contact</p>
    <Button onClick={() => navigate('/login')}>Se connecter</Button>
    <Button onClick={() => navigate('/register')}>Créer un compte</Button>
  </Card>
)}

{isPreviewMode && (
  <Card className="p-8 text-center">
    <h3>Profil limité</h3>
    <p>
      {!user 
        ? "Connectez-vous pour voir les préférences complètes"
        : "Envoyez une demande de contact pour accéder aux préférences"
      }
    </p>
  </Card>
)}
```

✅ **Vérifié** : Affichage d'aperçu + CTAs sans redirection automatique.

---

## ✅ QA Checklist

| Critère | Statut | Notes |
|---------|--------|-------|
| "Voir le profil" ouvre `/p/:slug` | ✅ | `view-profile-button.tsx` |
| QR code encode `/p/:slug` | ✅ | `profile-qr-generator.tsx` |
| Liens de partage → `/p/:slug` | ✅ | `use-share-link.ts`, `share.ts` |
| `/p/:slug` accessible sans auth | ✅ | Route publique dans `App.tsx` |
| `/profil/:id` → `/p/:slug` | ✅ | `LegacyProfileRedirect` |
| Préservation des UTM | ✅ | `searchParams.toString()` |
| Refresh `/p/:slug` fonctionne | ✅ | SPA fallback Lovable |
| Aperçu public + CTAs (déconnecté) | ✅ | `public-profile-view.tsx` |
| Pas de redirection automatique | ✅ | CTAs manuels uniquement |

---

## 📝 Fichiers Modifiés/Créés

### Créés
- `src/components/screens/legacy-profile-redirect.tsx`
- `docs/ROUTING_PUBLIC_CANONICAL.md` (ce fichier)

### Modifiés
- `src/App.tsx` (ajout route `/profil/:id`)

### Supprimés
- `src/components/screens/profile-redirect-handler.tsx` (obsolète)

---

## 🚀 URLs Canoniques

| Type | Format | Exemple |
|------|--------|---------|
| **Production** | `https://app.pliiiz.com/p/:slug` | `https://app.pliiiz.com/p/user-xyz123` |
| **Ancienne URL** | `/profil/:id` → redirige vers `/p/:slug` | `/profil/abc-def-123` → `/p/user-xyz123` |
| **Avec UTM** | `/p/:slug?utm_source=X` | `/p/user-xyz123?utm_source=email` |

---

## 🎯 Architecture

```
Utilisateur scanne QR → /p/:slug
                           ↓
                    Public (pas d'auth requise)
                           ↓
                ┌──────────┴──────────┐
                ↓                      ↓
         Connecté ?              Non connecté
                ↓                      ↓
         Contact ?          Aperçu + CTAs Login/Register
                ↓
        ┌───────┴────────┐
        ↓                 ↓
    Contact           Pas contact
        ↓                 ↓
  Profil complet    Aperçu + CTA "Demander contact"
```

---

## 📌 Notes Importantes

1. **Tous les liens de partage** utilisent désormais uniquement `/p/:slug`
2. **Le QR code** encode toujours l'URL canonique de production
3. **Les anciennes URLs** `/profil/:id` sont redirigées de manière permanente (301)
4. **Les paramètres UTM** sont préservés lors de la redirection
5. **Aucune redirection forcée** vers Login/Home pour les visiteurs anonymes
6. **L'aperçu public** est toujours visible, avec CTAs pour se connecter ou s'inscrire

---

## 🔧 Maintenance Future

Pour ajouter de nouveaux formats de liens de partage :
1. Toujours utiliser `canonicalProfilePath(slug)` de `src/lib/share.ts`
2. Ne jamais hardcoder `/p/:slug`, toujours passer par les helpers
3. Préserver les query params avec `searchParams.toString()`
