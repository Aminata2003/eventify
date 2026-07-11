# Eventify

Plateforme web permettant de créer, gérer et promouvoir des événements, 
avec inscription en ligne des participants.

## 📋 Description

Eventify permet à des **organisateurs** de créer des événements publics ou privés 
et à des **participants** de les découvrir et s'y inscrire.

## 🛠️ Stack technique

- **Frontend** : React.js + Vite
- **Backend** : Django + Django REST Framework
- **Base de données** : PostgreSQL
- **Authentification** : JWT (djangorestframework-simplejwt)
- **Déploiement** : Vercel (frontend) + Render (backend + PostgreSQL)

## 🚀 Installation locale

### Prérequis
- Python 3.10+
- Node.js 18+
- PostgreSQL (ou SQLite en local pour tester rapidement)

### Backend

\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows : venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # puis complète les variables
python manage.py migrate
python manage.py runserver
\`\`\`

### Frontend

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

## 👥 Équipe

- Aminata Sow — rôle : backend/frontend
- Soukeyna Kane —  rôle :  frontend/backend

## 📌 Fonctionnalités principales

- Inscription / Connexion (participant & organisateur)
- Création, modification, suppression d'événements
- Catalogue d'événements publics avec filtres (date, lieu, catégorie)
- Inscription à un événement
- Dashboard organisateur avec statistiques
- Gestion des événements publics/privés

## 🔗 Intégration frontend/backend

Le frontend consomme déjà des services centralisés dans [frontend/src/services](frontend/src/services). Les points d’intégration ont été alignés sur les contrats suivants :

- GET /api/events/ → liste des événements
- GET /api/events/<id>/ → détail d’un événement
- POST /api/events/ → création d’un événement
- GET /api/events/my-events/ → événements de l’organisateur connecté
- POST /api/events/<id>/register/ → inscription à un événement
- GET /api/dashboard/stats/ → statistiques du dashboard
- POST /api/auth/login/ → connexion via JWT

## ✉️ Notifications par email

Le backend envoie les notifications suivantes :

- Email de confirmation au participant après inscription (US007)
- Email de notification à l’organisateur lorsqu’un participant s’inscrit (US011)
- Email de rappel automatique envoyé la veille de l’événement aux participants et à l’organisateur

### Configuration SMTP pour l’envoi de vrais emails

Par défaut, si aucune configuration email SMTP n’est définie, Django utilisera le backend console (`EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend`) et affichera les messages dans le terminal.

Pour recevoir les emails dans une vraie boîte mail, ajoutez ces variables dans `backend/.env` :

```env
DEFAULT_FROM_EMAIL=no-reply@eventify.dev
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=ton-email@example.com
EMAIL_HOST_PASSWORD=ton-mot-de-passe-ou-app-password
EMAIL_USE_TLS=true
EMAIL_USE_SSL=false
EMAIL_TIMEOUT=20
```

> Pour Gmail, utilisez un mot de passe d'application si vous avez l'authentification à deux facteurs activée.

> Attention : ne mettez jamais votre mot de passe de compte principal dans `.env`.
> Utilisez un "mot de passe d'application" Gmail ou un autre service SMTP sécurisé.

### Commande de rappel

Pour lancer manuellement le rappel automatique :

```bash
cd backend
python manage.py send_event_reminders
```

Cette commande recherche les événements programmés pour le lendemain et envoie les emails aux participants confirmés et à l’organisateur.
