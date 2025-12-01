# Frontend Railway Configuration

This directory contains the frontend for the Email Search application.

## Railway Deployment

### Environment Variables

Set the following in Railway:
- `VITE_API_URL`: Your backend Railway URL (e.g., `https://email-search-backend.railway.app`)

### Build Configuration

- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

### Files for Deployment

- `server.js`: Express server to serve the static build
- `.env.production.example`: Template for production environment variables

### Local Development

```bash
npm install
npm run dev
```

The dev server uses the proxy configuration in `vite.config.js` to forward API requests to `localhost:8000`.

### Production Build

```bash
# Create .env.production with your backend URL
echo "VITE_API_URL=https://your-backend-url.railway.app" > .env.production

# Build
npm run build

# Test locally
npm start
```
