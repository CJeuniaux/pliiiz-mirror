# Guide de Liaison des Utilisateurs

Ce document explique comment configurer les liens bidirectionnels entre les 3 comptes utilisateurs de test.

## Étapes de Configuration

### 1. Récupérer les UUIDs des Utilisateurs

Allez sur votre tableau de bord Supabase :
- Ouvrez **Auth** → **Users**
- Notez les UUIDs des 3 comptes de test

### 2. Créer les Liens via l'Interface d'Audit

1. Connectez-vous avec le premier compte
2. Allez sur `/debug/contacts-audit` (route protégée)
3. Utilisez le formulaire "Créer un Contact Bidirectionnel"
4. Entrez l'email du deuxième utilisateur
5. Répétez pour le troisième utilisateur

### 3. Répéter pour Tous les Comptes

Connectez-vous avec chaque compte et créez les liens vers les autres comptes.

### 4. Alternative : Script SQL Manuel

Si vous préférez utiliser SQL directement :

```sql
-- Remplacez <UID_A>, <UID_B>, <UID_C> par les vrais UUIDs
-- Exemple : 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

INSERT INTO public.contacts (owner_id, contact_user_id, alias)
VALUES 
  ('<UID_A>', '<UID_B>', NULL),
  ('<UID_B>', '<UID_A>', NULL),
  ('<UID_A>', '<UID_C>', NULL),
  ('<UID_C>', '<UID_A>', NULL),
  ('<UID_B>', '<UID_C>', NULL),
  ('<UID_C>', '<UID_B>', NULL)
ON CONFLICT (owner_id, contact_user_id) DO NOTHING;
```

## Fonction de Sécurité

La fonction `create_bidirectional_contact()` inclut automatiquement :
- Vérification d'authentification
- Prévention de l'auto-liaison
- Création bidirectionnelle sécurisée
- Gestion des conflits (idempotente)

## Validation

Après avoir créé les liens :
1. Chaque utilisateur devrait voir 2 contacts dans la page d'audit
2. Les relations doivent être symétriques
3. Aucun utilisateur ne peut se lier à lui-même

## Dépannage

- **Contact non trouvé** : Vérifiez que l'email existe dans la table `profiles`
- **Erreur de permissions** : Assurez-vous d'être connecté
- **Liens manquants** : Utilisez le bouton "Actualiser" dans l'interface d'audit