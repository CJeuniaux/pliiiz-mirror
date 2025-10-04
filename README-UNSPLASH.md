# Configuration Unsplash API

## Clés API requises

Pour utiliser l'intégration Unsplash dans Pliiiz, vous devez configurer les clés API suivantes dans Supabase :

### 1. UNSPLASH_ACCESS_KEY
- **Où l'obtenir** : [Unsplash Developers](https://unsplash.com/developers)
- **Type** : Access Key (clé publique)
- **Utilisation** : Recherche et téléchargement d'images

### 2. UNSPLASH_SECRET_KEY  
- **Où l'obtenir** : [Unsplash Developers](https://unsplash.com/developers)
- **Type** : Secret Key (clé privée)
- **Utilisation** : Authentification avancée (si nécessaire)

## Configuration dans Supabase

1. Allez dans **Supabase Dashboard** → **Project Settings** → **Environment Variables**
2. Ajoutez les variables suivantes :
   - `UNSPLASH_ACCESS_KEY` : Votre clé d'accès Unsplash
   - `UNSPLASH_SECRET_KEY` : Votre clé secrète Unsplash

## Fonctionnalités

### Backend (Edge Functions)
- `unsplash-search` : Recherche d'images par mot-clé
- `unsplash-random` : Images aléatoires avec filtre optionnel
- `unsplash-track-download` : Suivi des téléchargements (requis par Unsplash)

### Frontend
- `UnsplashImagePicker` : Composant de sélection d'images 400×400
- Attribution automatique des photographes
- Liens UTM conformes aux guidelines Unsplash

## Guidelines Unsplash

✅ **Respecté dans l'implémentation :**
- Images hotlinkées uniquement (pas de stockage local)
- Attribution visible pour chaque photographe
- Liens UTM vers les profils et Unsplash
- Suivi des téléchargements via l'API
- Format d'image optimisé : 400×400 avec crop intelligent

## Mentions légales

Les mentions Unsplash sont accessibles via :
- Footer de la page de connexion
- Settings → À propos → Mentions & crédits photo

**Important** : Les mentions ne sont pas dans le menu principal pour éviter l'encombrement.

## Test de l'intégration

Pour tester l'intégration :
1. Configurez les clés API dans Supabase
2. Utilisez le composant `UnsplashImagePicker` dans votre application
3. Vérifiez que les attributions s'affichent correctement
4. Confirmez que le suivi des téléchargements fonctionne

## Limites de l'API Unsplash

- **Démo** : 50 requêtes/heure
- **Production** : 5000 requêtes/heure (gratuit)
- **Rate limiting** : Géré automatiquement avec retry

## Support

En cas de problème :
1. Vérifiez que les clés API sont correctement configurées
2. Consultez les logs des Edge Functions dans Supabase
3. Vérifiez les guidelines Unsplash pour la conformité