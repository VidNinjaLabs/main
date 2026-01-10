# TMDB Proxy Configuration

## ✅ Setup Complete

The app now uses **proxy-only mode** for all TMDB API requests through your Cloudflare Worker at `https://metada.vidninja.pro`.

## What Changed

### 1. **Proxy URL** (`src/backend/metadata/tmdb.ts`)
```typescript
const tmdbBaseUrl1 = "https://metada.vidninja.pro";
// Direct TMDB access disabled - doesn't work in this environment
```

### 2. **No Fallback**
Removed the direct TMDB API fallback (`tmdbBaseUrl2`). All requests now go **exclusively through your proxy**.

### 3. **Increased Timeout**
Changed timeout from 5s to 10s to accommodate proxy response times.

## How It Works

```
Frontend Request
    ↓
https://metada.vidninja.pro/3/movie/550
    ↓
Your Cloudflare Worker (geo-unblocked)
    ↓
https://api.themoviedb.org/3/movie/550
    ↓
Response with CORS headers
    ↓
Frontend receives data
```

## Benefits

✅ **Geo-unblocking** - Bypasses TMDB regional restrictions  
✅ **No direct TMDB** - Works even when TMDB is blocked  
✅ **Full API support** - All TMDB endpoints work  
✅ **Automatic API key** - Embedded in the worker  
✅ **CORS enabled** - No cross-origin issues

## Testing

```bash
pnpm dev
# Navigate to /discover or search for movies/shows
```

All TMDB data (search, discover, details, images) now flows through your proxy!

## Proxy Deployment

Your proxy is deployed at:
- **URL**: `https://metada.vidninja.pro`
- **Version**: bc220c28-bfff-4ea6-854c-aafc4d7883e5
- **Code**: `w:\cloudclash\frontend\trash\tmdb-full-proxy.ts`

## Troubleshooting

**If you see errors:**
1. Check proxy is responding: `curl https://metada.vidninja.pro/3/configuration`
2. View worker logs in Cloudflare Dashboard
3. Verify API key in worker is valid

**Cache:**
TMDB responses are cached for 1 hour locally to reduce proxy calls.
