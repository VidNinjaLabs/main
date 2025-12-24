# Frontend Integration Guide

Complete guide for integrating CloudClash Providers backend into your video streaming application.

## Overview

This backend provides a **Netflix/YouTube-like streaming API** with:
- 🎯 **8+ working providers** (automatic fallback)
- 🎬 **Quality selection** (Auto, 2160p → 144p)
- 🔄 **Provider switching** (like YouTube's server selection)
- 🔐 **Secure streaming** (JWT + encryption)
- ⚡ **Fast delivery** (Cloudflare edge caching)

---

## Quick Start

### 1. Authentication

Create a session to get a JWT token:

```typescript
// Create session
const response = await fetch('http://your-backend.com/auth/session', {
  method: 'POST'
});

const { token, sessionId } = await response.json();

// Store token for future requests
localStorage.setItem('jwt_token', token);
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "visitId": "unique-visit-id",
  "expiresAt": 1735689600000
}
```

### 2. Get Stream URLs

Fetch available streams for a movie/show:

```typescript
const jwtToken = localStorage.getItem('jwt_token');

// For movies
const response = await fetch(
  'http://your-backend.com/scrape/movie/550?provider=Vortex',
  {
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    }
  }
);

const streamData = await response.json();
```

**Response:**
```json
{
  "provider": "Vortex",
  "servers": {
    "Primary": "https://worker.dev/encrypted-token/seg-1234.ts",
    "Backup": "https://worker.dev/encrypted-token/seg-5678.ts"
  },
  "subtitles": [
    {
      "id": "en",
      "language": "English",
      "url": "https://...",
      "type": "vtt"
    }
  ]
}
```

### 3. Play Stream

Use HLS.js to play the stream:

```typescript
import Hls from 'hls.js';

const video = document.querySelector('video');
const streamUrl = streamData.servers['Primary'];

if (Hls.isSupported()) {
  const hls = new Hls({
    enableWorker: true,
    lowLatencyMode: false
  });
  
  hls.loadSource(streamUrl);
  hls.attachMedia(video);
  
  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    video.play();
  });
}
```

---

## YouTube-Like Quality Selection

### Understanding Quality Levels

The backend returns HLS streams with **multiple quality variants**. HLS.js automatically detects available qualities from the m3u8 playlist.

### Implementation

```typescript
import Hls from 'hls.js';

const hls = new Hls({
  enableWorker: true,
  startLevel: -1, // Auto quality
});

hls.loadSource(streamUrl);
hls.attachMedia(video);

// Get available quality levels
hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
  const levels = hls.levels;
  
  console.log('Available qualities:', levels.map(level => ({
    height: level.height,
    bitrate: level.bitrate,
    label: `${level.height}p`
  })));
});

// Quality levels are automatically available
// Example output:
// [
//   { height: 2160, bitrate: 15000000, label: '2160p' },
//   { height: 1080, bitrate: 5000000, label: '1080p' },
//   { height: 720, bitrate: 2500000, label: '720p' },
//   { height: 480, bitrate: 1000000, label: '480p' },
//   { height: 360, bitrate: 600000, label: '360p' },
//   { height: 240, bitrate: 300000, label: '240p' }
// ]
```

### Quality Selector Component (React)

```tsx
import { useState, useEffect } from 'react';
import Hls from 'hls.js';

interface QualityLevel {
  index: number;
  height: number;
  label: string;
}

export function QualitySelector({ hls }: { hls: Hls }) {
  const [qualities, setQualities] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 = Auto

  useEffect(() => {
    if (!hls) return;

    const onManifestParsed = () => {
      const levels = hls.levels.map((level, index) => ({
        index,
        height: level.height,
        label: level.height ? `${level.height}p` : 'Unknown'
      }));

      // Add "Auto" option
      setQualities([
        { index: -1, height: 0, label: 'Auto' },
        ...levels.sort((a, b) => b.height - a.height)
      ]);
    };

    hls.on(Hls.Events.MANIFEST_PARSED, onManifestParsed);
    return () => {
      hls.off(Hls.Events.MANIFEST_PARSED, onManifestParsed);
    };
  }, [hls]);

  const changeQuality = (index: number) => {
    if (index === -1) {
      // Auto quality
      hls.currentLevel = -1;
    } else {
      // Manual quality
      hls.currentLevel = index;
    }
    setCurrentQuality(index);
  };

  return (
    <div className="quality-selector">
      <select 
        value={currentQuality} 
        onChange={(e) => changeQuality(Number(e.target.value))}
      >
        {qualities.map(q => (
          <option key={q.index} value={q.index}>
            {q.label}
            {q.index === -1 && ' (Recommended)'}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### Advanced Quality Options

```tsx
// YouTube-style quality presets
const QUALITY_PRESETS = {
  'auto': -1,
  'higher': (levels) => levels.find(l => l.height >= 1080)?.index ?? -1,
  'high': (levels) => levels.find(l => l.height === 720)?.index ?? -1,
  'data-saver': (levels) => levels.find(l => l.height === 360)?.index ?? -1,
};

function setQualityPreset(preset: keyof typeof QUALITY_PRESETS) {
  if (preset === 'auto') {
    hls.currentLevel = -1;
  } else {
    const index = QUALITY_PRESETS[preset](hls.levels);
    hls.currentLevel = index;
  }
}
```

---

## Provider Switching (YouTube-Like Server Selection)

### Get Available Providers

```typescript
// Get list of all providers
const response = await fetch('http://your-backend.com/providers', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
});

const providers = await response.json();

// Response:
// [
//   { id: 'vidsrc', name: 'VidSrc', rank: 180 },
//   { id: 'vidnest', name: 'VidNest', rank: 160 },
//   { id: 'rgshows', name: 'RGShows', rank: 150 },
//   ...
// ]
```

### Provider Selector Component

```tsx
export function ProviderSelector({ 
  movieId, 
  onProviderChange 
}: { 
  movieId: string;
  onProviderChange: (streamData: any) => void;
}) {
  const [providers, setProviders] = useState([]);
  const [currentProvider, setCurrentProvider] = useState('Vortex');
  const [loading, setLoading] = useState(false);

  const switchProvider = async (providerId: string) => {
    setLoading(true);
    
    try {
      const response = await fetch(
        `http://your-backend.com/scrape/movie/${movieId}?provider=${providerId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
          }
        }
      );

      const streamData = await response.json();
      setCurrentProvider(providerId);
      onProviderChange(streamData);
    } catch (error) {
      console.error('Failed to switch provider:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="provider-selector">
      <label>Server:</label>
      <select 
        value={currentProvider}
        onChange={(e) => switchProvider(e.target.value)}
        disabled={loading}
      >
        {providers.map(p => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      {loading && <span>Switching...</span>}
    </div>
  );
}
```

---

## Complete Video Player Example

```tsx
import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';

export function VideoPlayer({ movieId }: { movieId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  
  const [streamData, setStreamData] = useState(null);
  const [currentServer, setCurrentServer] = useState('Primary');
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1);

  // 1. Fetch stream on mount
  useEffect(() => {
    fetchStream();
  }, [movieId]);

  const fetchStream = async () => {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(
      `http://your-backend.com/scrape/movie/${movieId}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    const data = await response.json();
    setStreamData(data);
    playStream(data.servers[currentServer]);
  };

  // 2. Initialize HLS player
  const playStream = (url: string) => {
    if (!videoRef.current) return;

    // Destroy previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    const hls = new Hls({
      enableWorker: true,
      startLevel: -1, // Auto quality
    });

    hls.loadSource(url);
    hls.attachMedia(videoRef.current);

    // Extract quality levels
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      const levels = hls.levels.map((level, index) => ({
        index,
        height: level.height,
        label: `${level.height}p`
      }));

      setQualities([
        { index: -1, height: 0, label: 'Auto' },
        ...levels.sort((a, b) => b.height - a.height)
      ]);

      videoRef.current?.play();
    });

    hlsRef.current = hls;
  };

  // 3. Switch server
  const switchServer = (serverName: string) => {
    setCurrentServer(serverName);
    playStream(streamData.servers[serverName]);
  };

  // 4. Change quality
  const changeQuality = (index: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = index;
      setCurrentQuality(index);
    }
  };

  return (
    <div className="video-player">
      <video ref={videoRef} controls />

      <div className="controls">
        {/* Server Selector */}
        <div className="server-selector">
          <label>Server:</label>
          <select 
            value={currentServer}
            onChange={(e) => switchServer(e.target.value)}
          >
            {streamData && Object.keys(streamData.servers).map(server => (
              <option key={server} value={server}>{server}</option>
            ))}
          </select>
        </div>

        {/* Quality Selector */}
        <div className="quality-selector">
          <label>Quality:</label>
          <select
            value={currentQuality}
            onChange={(e) => changeQuality(Number(e.target.value))}
          >
            {qualities.map(q => (
              <option key={q.index} value={q.index}>
                {q.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
```

---

## API Endpoints Reference

### Authentication

#### POST `/auth/session`
Create a new session and get JWT token.

**Request:** No body required

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "visitId": "unique-visit-id",
  "expiresAt": 1735689600000
}
```

#### POST `/auth/validate`
Validate an existing JWT token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "valid": true,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### Streaming

#### GET `/scrape/movie/:tmdbId`
Get stream URLs for a movie.

**Parameters:**
- `tmdbId` - TMDB movie ID (e.g., `550` for Fight Club)
- `provider` (optional) - Specific provider (e.g., `Vortex`, `VidSrc`)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "provider": "Vortex",
  "servers": {
    "Primary": "https://worker.dev/token/suffix",
    "Backup": "https://worker.dev/token/suffix"
  },
  "subtitles": [
    {
      "id": "en",
      "language": "English",
      "url": "https://...",
      "type": "vtt"
    }
  ]
}
```

#### GET `/scrape/show/:tmdbId/:season/:episode`
Get stream URLs for a TV show episode.

**Parameters:**
- `tmdbId` - TMDB show ID
- `season` - Season number
- `episode` - Episode number
- `provider` (optional) - Specific provider

**Headers:**
```
Authorization: Bearer <token>
```

---

### Metadata

#### GET `/providers`
Get list of available providers.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "vidsrc",
    "name": "VidSrc",
    "rank": 180,
    "type": "source"
  },
  {
    "id": "vidnest",
    "name": "VidNest",
    "rank": 160,
    "type": "source"
  }
]
```

---

### Health & Monitoring

#### GET `/health`
Basic health check.

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1735689600000
}
```

#### GET `/health/detailed`
Detailed health check with component status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1735689600000,
  "uptime": 3600.5,
  "jwt": {
    "status": "ok",
    "secret_loaded": true
  },
  "encryption": {
    "status": "ok",
    "secret_loaded": true
  },
  "worker": {
    "status": "ok",
    "url_configured": true
  },
  "tmdb": {
    "status": "ok",
    "proxy_configured": true
  }
}
```

#### GET `/api/server-time`
Get server time for clock synchronization.

**Response:**
```json
{
  "serverTime": 1735689600000,
  "timezone": "UTC",
  "iso": "2025-01-01T00:00:00.000Z"
}
```

---

## Error Handling

### Common Errors

```typescript
try {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    switch (response.status) {
      case 401:
        // Token expired or invalid
        // Redirect to login or refresh token
        break;
      case 404:
        // Stream not found
        // Try different provider
        break;
      case 429:
        // Rate limited
        // Wait and retry
        break;
      case 500:
        // Server error
        // Show error message
        break;
    }
  }
  
  const data = await response.json();
} catch (error) {
  console.error('Network error:', error);
}
```

### Automatic Provider Fallback

```typescript
const PROVIDERS = ['Vortex', 'VidSrc', 'VidNest', 'RGShows'];

async function fetchStreamWithFallback(movieId: string) {
  for (const provider of PROVIDERS) {
    try {
      const response = await fetch(
        `http://your-backend.com/scrape/movie/${movieId}?provider=${provider}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
          }
        }
      );

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log(`Provider ${provider} failed, trying next...`);
    }
  }

  throw new Error('All providers failed');
}
```

---

## Best Practices

### 1. Token Management

```typescript
class AuthManager {
  private token: string | null = null;

  async getToken(): Promise<string> {
    // Check if token exists and is valid
    if (this.token && !this.isTokenExpired(this.token)) {
      return this.token;
    }

    // Create new session
    const response = await fetch('http://your-backend.com/auth/session', {
      method: 'POST'
    });

    const { token } = await response.json();
    this.token = token;
    localStorage.setItem('jwt_token', token);

    return token;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }
}
```

### 2. Stream Caching

```typescript
const streamCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCachedStream(movieId: string) {
  const cached = streamCache.get(movieId);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const data = await fetchStream(movieId);
  streamCache.set(movieId, { data, timestamp: Date.now() });
  
  return data;
}
```

### 3. Quality Persistence

```typescript
// Remember user's quality preference
function saveQualityPreference(height: number) {
  localStorage.setItem('preferred_quality', height.toString());
}

function getPreferredQuality(levels: any[]): number {
  const preferred = localStorage.getItem('preferred_quality');
  if (!preferred) return -1; // Auto

  const height = parseInt(preferred);
  const level = levels.find(l => l.height === height);
  
  return level?.index ?? -1;
}

// Apply on player init
hls.on(Hls.Events.MANIFEST_PARSED, () => {
  const preferredLevel = getPreferredQuality(hls.levels);
  hls.currentLevel = preferredLevel;
});
```

---

## Next Steps

1. **Setup Backend** - Deploy the CloudClash backend
2. **Configure Environment** - Set JWT_SECRET, ENCRYPTION_SECRET, etc.
3. **Integrate Frontend** - Use the examples above
4. **Test Streaming** - Verify quality selection and provider switching
5. **Deploy** - Push to production

## Support

- 📖 [API Reference](/api/)
- 🏗️ [Architecture](/architecture/)
- 🚀 [Deployment Guide](/deployment/)
