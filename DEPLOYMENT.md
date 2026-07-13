# Déploiement Eventify

## Frontend Vercel

Dans les variables d'environnement du projet Vercel, ajoutez :

```env
VITE_API_URL=https://votre-backend.onrender.com/api
```

Redéployez ensuite le frontend. Cette variable est obligatoire en production :
elle indique au navigateur l'adresse de l'API Django.

## Backend Render

Configurez au minimum les variables suivantes :

```env
SECRET_KEY=une-cle-secrete-longue-et-unique
DEBUG=false
ALLOWED_HOSTS=votre-backend.onrender.com
DATABASE_URL=postgresql://...
CORS_ALLOWED_ORIGINS=https://votre-frontend.vercel.app
CSRF_TRUSTED_ORIGINS=https://votre-frontend.vercel.app
```

Pour l'envoi d'images persistant, ajoutez également :

```env
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Sans les clés Cloudinary, l'application conserve temporairement les images sur
le stockage local afin que la création d'événement reste possible. Ce stockage
peut être réinitialisé par Render : Cloudinary reste donc recommandé.
