# ⚙️ Configuration Render — Email & Frontend URL

**Projet** : Eventify — Backend Django  
**Objectif** : Activer l'envoi d'emails (invitations événements privés, confirmations, notifications) et lier l'URL du frontend.

---

## Prérequis

Avant de commencer, assure-toi d'avoir :

- ✅ Accès au compte **Render** où le backend est déployé
- ✅ La **clé d'application Gmail** à 16 caractères (fournie par Aminata)
- ✅ L'**URL du frontend** Vercel (ex: `https://eventify-xyz.vercel.app`)

> [!NOTE]
> La clé Gmail est un **mot de passe d'application** généré depuis [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords). Ce n'est pas le vrai mot de passe du compte Gmail.

---

## Étapes

### 1. Accéder au service backend sur Render

1. Va sur **[render.com](https://render.com)** et connecte-toi
2. Dans le **Dashboard**, clique sur le service backend Eventify (il s'appelle probablement `eventify-backend` ou similaire)

---

### 2. Ouvrir les variables d'environnement

1. Dans le menu du service, clique sur l'onglet **"Environment"**
2. Tu verras la liste des variables déjà configurées

---

### 3. Ajouter les variables

Clique sur **"Add Environment Variable"** et ajoute chacune des variables ci-dessous :

| Key | Value |
|-----|-------|
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `587` |
| `EMAIL_USE_TLS` | `true` |
| `EMAIL_HOST_USER` | l'adresse Gmail utilisée pour l'app |
| `EMAIL_HOST_PASSWORD` | la clé à 16 caractères (ex: `abcd efgh ijkl mnop`) |
| `DEFAULT_FROM_EMAIL` | `Eventify <adresse@gmail.com>` |
| `FRONTEND_URL` | `https://eventify-xyz.vercel.app` |

> [!IMPORTANT]
> Pour `DEFAULT_FROM_EMAIL`, remplace `adresse@gmail.com` par la **même adresse** que `EMAIL_HOST_USER`.  
> Pour `FRONTEND_URL`, utilise l'URL **exacte** du frontend Vercel, sans barre oblique à la fin.

---

### 4. Sauvegarder et redéployer

1. Clique sur **"Save Changes"** en bas de la page
2. Render va automatiquement redémarrer le backend avec les nouvelles variables
3. ⏳ Attendre **1 à 2 minutes** que le déploiement soit marqué **"Live"**

---

### 5. Vérifier que tout fonctionne

Pour confirmer que les emails partent bien :

1. Se connecter sur Eventify en tant qu'**organisateur**
2. Créer ou modifier un **événement privé**
3. Ajouter une adresse email dans le champ **"Personnes invitées"**
4. Sauvegarder l'événement
5. ✅ L'adresse ajoutée doit recevoir un email d'invitation avec le lien de l'événement

> [!TIP]
> Si l'email n'arrive pas, vérifier le dossier **Spam / Courrier indésirable** du destinataire.  
> Si le problème persiste, vérifier dans les **logs Render** (onglet "Logs") si une erreur SMTP apparaît.

---

## Où trouver l'URL Vercel du frontend ?

1. Va sur **[vercel.com](https://vercel.com)** → connecte-toi
2. Clique sur le projet **frontend Eventify**
3. L'URL est visible en haut de la page (ex: `https://eventify-git-main-xxx.vercel.app`)
4. Copie cette URL et colle-la dans la variable `FRONTEND_URL` sur Render

---

*Document préparé pour l'équipe Eventify — Juillet 2026*
