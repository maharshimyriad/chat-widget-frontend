# Lookatmedia AI Assist Widget

Embeddable chat widget built with vanilla JavaScript and Vite. It runs in a Shadow DOM, sends `{ user_id, environment_id, message, session_id }` requests to the FastAPI `/chat` endpoint, and consumes JSON SSE events. The widget stores the Agent Engine session ID in `localStorage`; on refresh it restores visible messages through the backend's Agent Engine history endpoint. No transcript copy is stored by the backend.

## Requirements

- Node.js and npm. The current frontend manifest requests Vite `^8.3.0`.
- A deployed backend URL when building the production embed.

Before using `npm ci`, keep `package.json` and `package-lock.json` in sync and commit both. In the current workspace state, the manifest requests Vite `^8.3.0` while the lockfile resolves Vite `5.4.21`; `npm ci` fails until that mismatch is resolved. Vite 8 previously encountered a native binding build issue on Windows, while Vite 5.4.21 produced a successful embed build. Build and test the exact version you intend to deploy.

## Install and build

Run these commands from this directory after reconciling the lockfile:

```bash
npm ci
VITE_API_URL=https://api.your-domain.com/chat npm run build:embed
test -s dist/embed/lam-chat-widget.js && echo "Widget build succeeded"
```

Replace the example URL with the real HTTPS backend endpoint. `VITE_API_URL` is compiled into the bundle at build time. The generated `dist/embed/lam-chat-widget.js` contains the widget JavaScript, CSS, and icons; host that file as a static asset over HTTPS.

For a local development preview, configure `VITE_API_URL` in `.env` and run:

```bash
npm run dev -- --host 127.0.0.1
```

### Test supported environments in the browser

With the backend running at `http://127.0.0.1:8000` and the frontend dev server running, open the page URLs printed by Vite:

- `/demo-one.html` tests `dam`.
- `/demo-two.html` tests `eponymos`.
- `/demo-three.html` tests `media_center`.

Send two messages on a page and check the `chat` requests in DevTools → Network. The second request should contain the same `session_id` received in the first response's `session` event. Each environment gets its own local session ID while all three use the shared deployed agent resource.

## Embed

For the complete integration steps and required script attributes, see
[EMBED_INTEGRATION.md](./EMBED_INTEGRATION.md). The backend must allow the host
The API allows public widget requests from any origin without cookies, so adding
a new embedding website does not require a backend CORS change. Set
`data-user-id` to the stable logged-in user ID. The widget prefixes it with
`data-client-id`; otherwise it creates a stable browser-scoped ID.

## Deployment notes

- Serve the generated JavaScript file from a static web server or CDN; do not run Vite's development server in production.
- The backend is a separate service. See [its EC2 deployment runbook](../chat-widget-backend/docs/EC2_DEPLOYMENT.md).
- If `npm ci` reports `EACCES` under `/var/www/html`, build as the checkout owner or build in the user's home directory and copy only the bundle. Avoid running npm as root.
- Review `npm audit` findings before applying updates. Avoid `npm audit fix --force` without testing because it can introduce breaking upgrades.