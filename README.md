# AlloKine

Plateforme React/Vite pour cabinet de kinesitherapie.

## Frontend

```bash
npm install
npm run dev
```

Variables frontend optionnelles (`.env` a la racine):

- `VITE_AUTH_MODE=auto` (`auto`, `local`, `backend`)
- `VITE_API_BASE_URL=http://localhost:4000/api`

## Backend securise (optionnel mais recommande)

Le dossier `backend/` ajoute:

- hachage `bcrypt` des mots de passe
- sessions JWT en cookie `HttpOnly`
- reset mot de passe via token serveur
- protections middleware (`helmet`, `rate-limit`, `cors`)

### Lancer le backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Endpoints auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

## Note securite

Pour production: base SQL (PostgreSQL), secrets rotationnes, HTTPS strict, logs d'audit, RGPD (retention et consentement).
