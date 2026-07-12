# wc-ad

Standalone private admin console for the win-worldcup sportsbook.

## Zeabur environment

Admin app:

```bash
VITE_API_BASE_URL=https://2026wc.zeabur.app
```

Main sportsbook app:

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=use-a-long-private-password
ADMIN_ALLOWED_ORIGINS=https://your-admin-domain.example
```

`ADMIN_ALLOWED_ORIGINS` can contain multiple comma-separated admin domains.

## Local development

```bash
npm install
npm run dev
```
