# Lookatmedia AI Assist Widget

Embeddable chat widget built with vanilla JavaScript and Vite. It runs in a Shadow DOM, sends requests to the FastAPI backend, and renders the backend's SSE response. It shows an animated three-dot indicator while waiting and batches text rendering to browser animation frames. It does not persist the visible transcript in `localStorage`.

## Requirements

- Node.js and npm. The current frontend manifest requests Vite `^8.3.0`.
- A deployed backend URL when building the production embed.

Before using `npm ci`, keep `package.json` and `package-lock.json` in sync and commit both. In the current workspace state, the manifest requests Vite `^8.3.0` while the lockfile resolves Vite `5.4.21`; `npm ci` fails until that mismatch is resolved. Vite 8 previously encountered a native binding build issue on Windows, while Vite 5.4.21 produced a successful embed build. Build and test the exact version you intend to deploy.

## Install and build

Run these commands from this directory after reconciling the lockfile:

```bash
npm ci
VITE_API_URL=https://api.your-domain.com/api/chat npm run build:embed
test -s dist/embed/lam-chat-widget.js && echo "Widget build succeeded"
```

Replace the example URL with the real HTTPS backend endpoint. `VITE_API_URL` is compiled into the bundle at build time. The generated `dist/embed/lam-chat-widget.js` contains the widget JavaScript, CSS, and icons; host that file as a static asset over HTTPS.

For a local development preview, configure `VITE_API_URL` in `.env` and run:

```bash
npm run dev -- --host 127.0.0.1
```

## Embed

Add the hosted script to the host website:

```html
<script src="https://widgets.your-domain.com/lam-chat-widget.js"></script>
```

Optional script attributes include `data-title`, `data-greeting`, `data-placeholder`, `data-api-url`, `data-client-id`, `data-user-id`, and `data-environment`. The backend must allow the host website's exact origin in `CORS_ALLOWED_ORIGINS`.

## Deployment notes

- Serve the generated JavaScript file from a static web server or CDN; do not run Vite's development server in production.
- The backend is a separate service. See [its EC2 deployment runbook](../chat-widget-backend/docs/EC2_DEPLOYMENT.md).
- If `npm ci` reports `EACCES` under `/var/www/html`, build as the checkout owner or build in the user's home directory and copy only the bundle. Avoid running npm as root.
- Review `npm audit` findings before applying updates. Avoid `npm audit fix --force` without testing because it can introduce breaking upgrades.