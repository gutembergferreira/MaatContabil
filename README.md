<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://mgsolucoesempresariais.com.br/wp-content/uploads/2023/02/MG-LOGO.jpg" />
</div>

# Aplicativo de Propriedade MG CONSULTORIA EMPRESARIAL LTDA

## Deploy (DigitalOcean App Platform)

Arquivos adicionados para deploy automatizado:

- `.do/app.yaml` com o app spec (API + frontend).
- `.github/workflows/ci.yml` com build/test em PR e push.
- `.github/workflows/deploy.yml` para deploy via GitHub Actions.

Variaveis de ambiente principais (App Platform):

- `PORT` (ex: 8080)
- `DATABASE_URL` (Managed PostgreSQL)
- `DATABASE_SSLMODE` (ex: `require`)
- `SPACES_REGION`, `SPACES_BUCKET`, `SPACES_KEY`, `SPACES_SECRET` (uploads via Spaces)
- `VITE_API_BASE_URL` (ex: `/api`)

Backend:

- `/health` retorna `{ ok: true }`.
- Usa `DATABASE_URL` quando definido; caso contrario, continua com `db-config.json`.
- Uploads por presigned URL: `POST /api/uploads/presign` com `{ key, contentType }`.
- Swagger UI: `GET /api/docs`.
- Health check via API: `GET /api/health`.

Passos basicos para rodar a aplicação localmente.

## Build Local

**Pre Requisitos:**  Node.js | Postgres

**Run Backend:**

1. Cd maatcontabil_webhook


2. Install dependencies:
   
   `npm install`

3. Run the app:
   
   `npm start`

**Run Frontend:**


1. Install dependencies:
   
   `npm install`

2. Run the app:
   
   `npm run dev`

