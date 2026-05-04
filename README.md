# Student Platform Frontend

Vite + React frontend for the student learning platform.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create an env file from `.env.example` and point `VITE_API_URL` to your backend.
   For the Spring backend in this repo, use `http://localhost:5003/api`.

3. Start the app:

```bash
npm run dev
```

## Deployment

If the live Netlify URL shows "Site not available" with a usage-limit message,
Netlify has paused that site before the React app can load. The code can still
build successfully; unpause/upgrade Netlify or deploy the same frontend to
Vercel.

### Vercel

Import the repo into Vercel and keep the root directory as `./`. The root
`vercel.json` runs this frontend build and publishes `student-platform/dist`.

Set this environment variable in Vercel:

- `VITE_API_URL=https://your-railway-backend.up.railway.app/api`

Then set the Railway backend `FRONTEND_URL` environment variable to your Vercel
domain.

### Netlify

This repo includes a root `netlify.toml` configured for the `student-platform` app.

- Base directory: `student-platform`
- Build command: `npm run build`
- Publish directory: `dist`

Set this environment variable in Netlify:

- `VITE_API_URL=https://your-railway-backend.up.railway.app/api`

## Notes

- SPA redirects are already configured in `netlify.toml`
- SPA rewrites are configured in both Vercel config files
- Set `VITE_API_URL` explicitly in production so the frontend points to the correct backend
