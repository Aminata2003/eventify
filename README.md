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
