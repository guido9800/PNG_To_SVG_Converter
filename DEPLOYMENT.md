# Deploying the AI Backend

GitHub Pages can host the public app, but it cannot run `server.js` or protect an OpenAI API key. The PNG to SVG converter works on GitHub Pages because it runs in the browser. The AI image tools need a deployed Node backend.

## Option A: Use One Hosted Node App

Deploy this whole project to a Node hosting service. The same hosted URL will serve the web app and the `/api/generate-engraving` and `/api/optimize-png` endpoints.

Required settings:

```text
Build command: npm install
Start command: npm start
Node version: 18 or newer
```

Environment variables:

```text
OPENAI_API_KEY=your_new_openai_api_key
OPENAI_IMAGE_MODEL=gpt-image-1
HOST=0.0.0.0
ALLOWED_ORIGINS=https://your-hosted-app-url
```

## Option B: Keep GitHub Pages and Add a Backend URL

Deploy only the backend with `npm start`, then edit `api-config.js`:

```js
window.GALVO_API_BASE_URL = "https://your-backend-url";
```

For this setup, the backend must allow the GitHub Pages origin:

```text
ALLOWED_ORIGINS=https://guido9800.github.io
```

Then commit and push `api-config.js` so GitHub Pages knows where to send AI requests.

## Important API Key Safety

Never put a real OpenAI API key in `index.html`, `app.js`, `api-config.js`, or any file that is published to GitHub Pages. Put the key only in the backend host's environment variables or in your local ignored `.env` file.

If a real key was committed or pasted into a public file, delete that key in the OpenAI dashboard and create a new one.
