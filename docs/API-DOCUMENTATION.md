# 📚 Stream Guard API - Complete Frontend Integration Guide

> **Complete documentation for integrating the Stream Guard API into your frontend application**

## 📖 Table of Contents

1. [Quick Start](#-quick-start)
2. [Authentication](#-authentication)
3. [API Endpoints](#-api-endpoints)
4. [Streaming Architecture](#-streaming-architecture)
5. [Frontend Integration](#-frontend-integration)
6. [Video Player Setup](#-video-player-setup)
7. [Error Handling](#-error-handling)
8. [Best Practices](#-best-practices)
9. [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

### Base URL

```
Production: https://api.vidninja.pro
Development: http://localhost:3000
```

### Authentication

All API requests (except `/status` and `/test`) require authentication via API key.

**Two methods:**
1. **Header (Recommended):** `x-api-key: YOUR_API_KEY`
2. **Query Parameter:** `?apiKey=YOUR_API_KEY`

### Basic Example

```javascript
const API_BASE = 'https://api.vidninja.pro';
const API_KEY = 'your-api-key-here';

// Fetch stream for a movie
const response = await fetch(
  `${API_BASE}/cdn?tmdbId=550&type=movie`,
  {
    headers: {
      'x-api-key': API_KEY
    }
  }
);

const data = await response.json();
console.log(data.stream[0].playlist); // HLS playlist URL
```

---

## 🔐 Authentication

### Method 1: Header Authentication (Recommended)

**Why recommended?**
- More secure (not visible in URLs)
- Not logged in browser history
- Standard REST API practice

```javascript
// Using fetch
fetch('https://api.vidninja.pro/cdn?tmdbId=550&type=movie', {
  headers: {
    'x-api-key': 'ha3A0TaAteHOS8ukUR23ShOpFx8CVxaq'
  }
});

// Using axios
axios.get('https://api.vidninja.pro/cdn', {
  params: { tmdbId: 550, type: 'movie' },
  headers: {
    'x-api-key': 'ha3A0TaAteHOS8ukUR23ShOpFx8CVxaq'
  }
});
```

### Method 2: Query Parameter

**Use when:**
- Testing in browser
- Simple GET requests
- Debugging

```javascript
fetch('https://api.vidninja.pro/cdn?tmdbId=550&type=movie&apiKey=ha3A0TaAteHOS8ukUR23ShOpFx8CVxaq');
```

### Handling Unauthorized Errors

```javascript
async function fetchWithAuth(endpoint, params = {}) {
  const url = new URL(`${API_BASE}${endpoint}`);
  Object.keys(params).forEach(key => 
    url.searchParams.append(key, params[key])
  );

  const response = await fetch(url, {
    headers: {
      'x-api-key': API_KEY
    }
  });

  if (response.status === 401) {
    throw new Error('Invalid API Key. Please check your credentials.');
  }

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
```

---

## 📡 API Endpoints

### 1. Get Stream URL

**Endpoint:** `GET /cdn`

**Purpose:** Fetch streaming URLs for movies or TV shows

#### Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `tmdbId` | string | ✅ Yes | TMDB ID of the content | `550` |
| `type` | string | ✅ Yes | Media type: `movie` or `show` | `movie` |
| `season` | string | For TV shows | Season number | `1` |
| `episode` | string | For TV shows | Episode number | `1` |
| `sourceId` | string | ❌ No | Specific provider codename | `iron`, `alpha` |
| `force` | string | ❌ No | Bypass cache: `true` or `false` | `true` |

#### Example: Movie

```javascript
// Auto-select best provider
const movieStream = await fetchWithAuth('/cdn', {
  tmdbId: '550',      // Fight Club
  type: 'movie'
});

// Use specific provider
const specificStream = await fetchWithAuth('/cdn', {
  tmdbId: '550',
  type: 'movie',
  sourceId: 'iron'    // Force use of 'iron' provider
});
```

#### Example: TV Show

```javascript
const tvStream = await fetchWithAuth('/cdn', {
  tmdbId: '1399',     // Game of Thrones
  type: 'show',
  season: '1',
  episode: '1'
});
```

#### Response Structure

```json
{
  "source": "crystal",
  "stream": [
    {
      "id": "crystal-allmovies-Hindi",
      "type": "hls",
      "playlist": "https://api.vidninja.pro/s/eyJhbGc...",
      "flags": ["cors-allowed"],
      "captions": [],
      "preferredHeaders": {},
      "language": "hi",
      "label": "AllMovies (Hindi)",
      "quality": "HD"
    },
    {
      "id": "crystal-hollymoviehd-LS-25",
      "type": "hls",
      "playlist": "https://api.vidninja.pro/s/eyJhbGc...",
      "flags": ["cors-allowed"],
      "captions": [],
      "language": "en",
      "label": "HollyMovie (LS-25)",
      "quality": "LS-25"
    }
  ],
  "embeds": [],
  "metadata": {
    "title": "Fight Club",
    "year": 1999,
    "poster": "https://image.tmdb.org/...",
    "scrapedAt": "2025-12-07T10:56:36.474Z",
    "timestamp": 1733571996474
  }
}
```

#### Response Fields Explained

| Field | Type | Description |
|-------|------|-------------|
| `source` | string | Provider codename that returned the stream |
| `stream` | array | Array of available streams (can be multiple) |
| `stream[].id` | string | Unique stream identifier |
| `stream[].type` | string | Stream type: `hls` or `file` |
| `stream[].playlist` | string | **PROXIED** HLS playlist URL (use this!) |
| `stream[].language` | string | ISO 639-1 language code (`en`, `hi`, etc.) |
| `stream[].label` | string | Human-readable stream name |
| `stream[].quality` | string | Quality/server identifier |
| `stream[].captions` | array | Available subtitle tracks |
| `embeds` | array | Embed sources (usually empty) |
| `metadata` | object | Content metadata from TMDB |

---

### 2. List Available Providers

**Endpoint:** `GET /sources`

**Purpose:** Get all available streaming providers

#### Example

```javascript
const providers = await fetchWithAuth('/sources');

console.log(providers);
// [
//   { id: 'iron', name: 'Iron', type: 'source', rank: 200 },
//   { id: 'alpha', name: 'Alpha', type: 'source', rank: 180 },
//   ...
// ]
```

#### Response Fields

| Field | Description |
|-------|-------------|
| `id` | Provider codename (use in `sourceId` parameter) |
| `name` | Human-readable provider name |
| `type` | Always `source` for streaming providers |
| `rank` | Priority ranking (higher = better) |

#### Use Case: Provider Selection UI

```javascript
async function buildProviderSelector() {
  const providers = await fetchWithAuth('/sources');
  
  const select = document.createElement('select');
  
  // Add "Auto" option
  const autoOption = document.createElement('option');
  autoOption.value = '';
  autoOption.textContent = 'Auto (Best Available)';
  select.appendChild(autoOption);
  
  // Add provider options
  providers
    .sort((a, b) => b.rank - a.rank) // Sort by rank
    .forEach(provider => {
      const option = document.createElement('option');
      option.value = provider.id;
      option.textContent = `${provider.name} (Rank: ${provider.rank})`;
      select.appendChild(option);
    });
  
  return select;
}
```

---

### 3. Provider Status

**Endpoint:** `GET /status`

**Authentication:** ❌ Not required (public endpoint)

**Purpose:** Check health status of all providers

#### Example

```javascript
const status = await fetch('https://api.vidninja.pro/status')
  .then(res => res.json());

console.log(status);
// {
//   "iron": {
//     "status": "operational",
//     "responseTime": 1234,
//     "uptime": 95.5
//   },
//   "alpha": {
//     "status": "degraded",
//     "responseTime": 3456,
//     "uptime": 67.2
//   }
// }
```

#### Status Values

| Status | Meaning | Uptime |
|--------|---------|--------|
| `operational` | Working normally | ≥ 80% |
| `degraded` | Experiencing issues | 50-80% |
| `offline` | Not working | < 50% |
| `untested` | No requests yet | N/A |

#### Use Case: Smart Provider Selection

```javascript
async function getBestProvider() {
  const [providers, status] = await Promise.all([
    fetchWithAuth('/sources'),
    fetch('https://api.vidninja.pro/status').then(r => r.json())
  ]);
  
  // Filter operational providers
  const operational = providers.filter(p => 
    status[p.id]?.status === 'operational'
  );
  
  // Sort by rank
  operational.sort((a, b) => b.rank - a.rank);
  
  return operational[0]?.id || null;
}
```

---

## 🎬 Streaming Architecture

### How Stream Proxying Works

The API uses a **token-based proxy system** to hide real CDN URLs:

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │ 1. Request stream
       ▼
┌─────────────────┐
│  Stream Guard   │
│      API        │
└──────┬──────────┘
       │ 2. Scrape provider
       ▼
┌─────────────────┐
│  Video Provider │
│   (e.g., CDN)   │
└──────┬──────────┘
       │ 3. Return real URL
       ▼
┌─────────────────┐
│  Stream Guard   │
│  (Store in Redis)│
└──────┬──────────┘
       │ 4. Generate token
       ▼
┌─────────────────┐
│   Frontend      │
│ (Receives token)│
└─────────────────┘
```

### URL Structure

#### Original CDN URL (Hidden)
```
https://real-cdn-server.com/videos/movie123/master.m3u8
```

#### Proxied URL (What you get)
```
https://api.vidninja.pro/s/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Benefits

✅ **Security:** Real CDN URLs never exposed to client  
✅ **Headers:** Server handles authentication headers  
✅ **CORS:** No cross-origin issues  
✅ **Caching:** Redis caching for faster responses  
✅ **Rate Limiting:** Built-in protection against abuse  

---

## 💻 Frontend Integration

### Complete React Example

```jsx
import React, { useState, useEffect } from 'react';
import Hls from 'hls.js';

const API_BASE = 'https://api.vidninja.pro';
const API_KEY = 'your-api-key-here';

function VideoPlayer({ tmdbId, type, season, episode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [streams, setStreams] = useState([]);
  const [selectedStream, setSelectedStream] = useState(null);
  const videoRef = React.useRef(null);

  useEffect(() => {
    fetchStreams();
  }, [tmdbId, type, season, episode]);

  useEffect(() => {
    if (selectedStream && videoRef.current) {
      initializePlayer(selectedStream.playlist);
    }
  }, [selectedStream]);

  async function fetchStreams() {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        tmdbId,
        type,
        ...(season && { season }),
        ...(episode && { episode })
      });

      const response = await fetch(`${API_BASE}/cdn?${params}`, {
        headers: { 'x-api-key': API_KEY }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.stream || data.stream.length === 0) {
        throw new Error('No streams available for this content');
      }

      setStreams(data.stream);
      setSelectedStream(data.stream[0]); // Auto-select first stream
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function initializePlayer(playlistUrl) {
    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      hls.loadSource(playlistUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => console.error('Autoplay failed:', e));
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('Fatal HLS error:', data);
          setError(`Playback error: ${data.type}`);
        }
      });

      return () => hls.destroy();
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = playlistUrl;
      video.play().catch(e => console.error('Autoplay failed:', e));
    } else {
      setError('HLS not supported in this browser');
    }
  }

  if (loading) return <div>Loading streams...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {/* Stream selector */}
      {streams.length > 1 && (
        <div>
          <label>Select Stream:</label>
          <select 
            value={selectedStream?.id} 
            onChange={(e) => {
              const stream = streams.find(s => s.id === e.target.value);
              setSelectedStream(stream);
            }}
          >
            {streams.map(stream => (
              <option key={stream.id} value={stream.id}>
                {stream.label} ({stream.language})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Video player */}
      <video
        ref={videoRef}
        controls
        style={{ width: '100%', maxWidth: '800px' }}
      />
    </div>
  );
}

export default VideoPlayer;
```

### Vanilla JavaScript Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Stream Guard Player</title>
  <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
</head>
<body>
  <div id="player-container">
    <select id="stream-selector"></select>
    <video id="video" controls style="width: 100%; max-width: 800px;"></video>
  </div>

  <script>
    const API_BASE = 'https://api.vidninja.pro';
    const API_KEY = 'your-api-key-here';

    async function loadVideo(tmdbId, type, season, episode) {
      try {
        // Build query params
        const params = new URLSearchParams({
          tmdbId,
          type,
          ...(season && { season }),
          ...(episode && { episode })
        });

        // Fetch streams
        const response = await fetch(`${API_BASE}/cdn?${params}`, {
          headers: { 'x-api-key': API_KEY }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data.stream || data.stream.length === 0) {
          throw new Error('No streams available');
        }

        // Populate stream selector
        const selector = document.getElementById('stream-selector');
        selector.innerHTML = '';
        
        data.stream.forEach((stream, index) => {
          const option = document.createElement('option');
          option.value = index;
          option.textContent = `${stream.label} (${stream.language})`;
          selector.appendChild(option);
        });

        // Play first stream
        playStream(data.stream[0].playlist);

        // Handle stream selection
        selector.onchange = (e) => {
          playStream(data.stream[e.target.value].playlist);
        };

      } catch (error) {
        console.error('Error loading video:', error);
        alert('Failed to load video: ' + error.message);
      }
    }

    function playStream(playlistUrl) {
      const video = document.getElementById('video');

      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(playlistUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play();
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = playlistUrl;
        video.play();
      }
    }

    // Load Fight Club
    loadVideo('550', 'movie');
  </script>
</body>
</html>
```

---

## 🎥 Video Player Setup

### Using HLS.js (Recommended)

**Installation:**
```bash
npm install hls.js
```

**Basic Setup:**
```javascript
import Hls from 'hls.js';

function setupHlsPlayer(videoElement, playlistUrl) {
  if (Hls.isSupported()) {
    const hls = new Hls({
      debug: false,
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90,
      maxBufferLength: 30,
      maxMaxBufferLength: 600
    });

    hls.loadSource(playlistUrl);
    hls.attachMedia(videoElement);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      console.log('Stream ready to play');
      videoElement.play();
    });

    hls.on(Hls.Events.ERROR, (event, data) => {
      console.error('HLS Error:', data);
      
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.log('Network error, trying to recover...');
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.log('Media error, trying to recover...');
            hls.recoverMediaError();
            break;
          default:
            console.log('Fatal error, cannot recover');
            hls.destroy();
            break;
        }
      }
    });

    return hls;
  } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
    // Native HLS (Safari)
    videoElement.src = playlistUrl;
    return null;
  } else {
    throw new Error('HLS not supported');
  }
}
```

### Using Video.js

**Installation:**
```bash
npm install video.js @videojs/http-streaming
```

**Setup:**
```javascript
import videojs from 'video.js';
import '@videojs/http-streaming';

function setupVideoJsPlayer(elementId, playlistUrl) {
  const player = videojs(elementId, {
    controls: true,
    autoplay: false,
    preload: 'auto',
    fluid: true,
    sources: [{
      src: playlistUrl,
      type: 'application/x-mpegURL'
    }]
  });

  player.on('error', () => {
    console.error('Video.js error:', player.error());
  });

  return player;
}
```

### CDN Links (No Build Step)

```html
<!-- HLS.js -->
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>

<!-- Video.js -->
<link href="https://vjs.zencdn.net/8.6.1/video-js.css" rel="stylesheet" />
<script src="https://vjs.zencdn.net/8.6.1/video.min.js"></script>
```

---

## ⚠️ Error Handling

### Common Error Responses

#### 401 Unauthorized
```json
{
  "error": "Unauthorized: Invalid API Key"
}
```

**Solution:** Check your API key

#### 404 Not Found
```json
{
  "error": "Stream not found"
}
```

**Possible causes:**
- Invalid TMDB ID
- Content not available on provider
- Provider is down

#### 429 Too Many Requests
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

**Solution:** Implement rate limiting on frontend

#### 500 Internal Server Error
```json
{
  "error": "Internal Server Error"
}
```

**Possible causes:**
- Provider scraping failed
- Redis connection issue
- Server overload

### Robust Error Handling

```javascript
async function fetchStreamWithRetry(params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(
        `${API_BASE}/cdn?${new URLSearchParams(params)}`,
        {
          headers: { 'x-api-key': API_KEY }
        }
      );

      if (response.status === 401) {
        throw new Error('INVALID_API_KEY');
      }

      if (response.status === 429) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
        continue;
      }

      if (response.status === 404) {
        // Try different provider
        if (!params.sourceId) {
          throw new Error('NO_STREAMS_AVAILABLE');
        }
        delete params.sourceId; // Let API auto-select
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP_${response.status}`);
      }

      const data = await response.json();

      if (!data.stream || data.stream.length === 0) {
        throw new Error('EMPTY_RESPONSE');
      }

      return data;

    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      console.log(`Retry ${i + 1}/${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

---

## ✅ Best Practices

### 1. Cache API Responses

```javascript
const streamCache = new Map();

async function getCachedStream(tmdbId, type, season, episode) {
  const cacheKey = `${tmdbId}-${type}-${season || ''}-${episode || ''}`;
  
  if (streamCache.has(cacheKey)) {
    const cached = streamCache.get(cacheKey);
    const age = Date.now() - cached.timestamp;
    
    // Use cache if less than 1 hour old
    if (age < 3600000) {
      return cached.data;
    }
  }

  const data = await fetchStreamWithRetry({
    tmdbId,
    type,
    ...(season && { season }),
    ...(episode && { episode })
  });

  streamCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });

  return data;
}
```

### 2. Implement Fallback Streams

```javascript
async function playWithFallback(streams, videoElement) {
  for (let i = 0; i < streams.length; i++) {
    try {
      await playStream(streams[i].playlist, videoElement);
      console.log(`Playing stream ${i + 1}`);
      return;
    } catch (error) {
      console.error(`Stream ${i + 1} failed:`, error);
      if (i === streams.length - 1) {
        throw new Error('All streams failed');
      }
    }
  }
}
```

### 3. Preload Next Episode

```javascript
async function preloadNextEpisode(tmdbId, season, currentEpisode) {
  const nextEpisode = parseInt(currentEpisode) + 1;
  
  // Preload in background
  getCachedStream(tmdbId, 'show', season, nextEpisode.toString())
    .then(() => console.log('Next episode preloaded'))
    .catch(() => console.log('Preload failed'));
}
```

### 4. Monitor Playback Quality

```javascript
function monitorPlayback(hls) {
  hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
    console.log(`Quality changed to: ${hls.levels[data.level].height}p`);
  });

  hls.on(Hls.Events.FPS_DROP, (event, data) => {
    console.warn('FPS drop detected:', data);
  });
}
```

### 5. Respect Rate Limits

```javascript
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.requests = [];
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async throttle() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.requests.push(now);
  }
}

const limiter = new RateLimiter();

async function fetchWithRateLimit(url, options) {
  await limiter.throttle();
  return fetch(url, options);
}
```

---

## 🔧 Troubleshooting

### Video Won't Play

**Check 1: Verify stream URL**
```javascript
console.log('Stream URL:', stream.playlist);
// Should start with: https://api.vidninja.pro/s/
```

**Check 2: Test HLS support**
```javascript
if (Hls.isSupported()) {
  console.log('HLS.js supported');
} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
  console.log('Native HLS supported');
} else {
  console.error('HLS not supported!');
}
```

**Check 3: Check browser console**
- Look for CORS errors
- Check for network errors
- Verify API responses

### CORS Issues

**Problem:** `Access-Control-Allow-Origin` errors

**Solution:** The API handles CORS automatically. Ensure you're:
1. Using the proxied URL (starts with `/s/`)
2. Not trying to access the original CDN URL directly
3. Making requests from an allowed domain

### Buffering Issues

**Problem:** Video buffers frequently

**Solutions:**
```javascript
// Increase buffer size
const hls = new Hls({
  maxBufferLength: 60,        // 60 seconds
  maxMaxBufferLength: 600,    // 10 minutes max
  maxBufferSize: 60 * 1000 * 1000  // 60 MB
});

// Or try a different stream
const lowerQualityStream = streams.find(s => 
  s.quality.includes('SD') || s.quality.includes('480')
);
```

### Authentication Failures

**Problem:** Getting 401 errors

**Debug checklist:**
```javascript
// 1. Verify API key is set
console.log('API Key:', API_KEY ? 'Set' : 'Missing');

// 2. Check header format
const headers = { 'x-api-key': API_KEY };
console.log('Headers:', headers);

// 3. Test with curl
// curl -H "x-api-key: YOUR_KEY" "https://api.vidninja.pro/sources"

// 4. Verify environment variable
console.log('Env API Key:', process.env.REACT_APP_API_KEY);
```

### No Streams Available

**Problem:** API returns empty stream array

**Solutions:**
```javascript
// 1. Try different provider
const data = await fetchWithAuth('/cdn', {
  tmdbId: '550',
  type: 'movie',
  sourceId: 'alpha'  // Try specific provider
});

// 2. Check provider status
const status = await fetch('https://api.vidninja.pro/status')
  .then(r => r.json());
console.log('Provider status:', status);

// 3. Force cache bypass
const freshData = await fetchWithAuth('/cdn', {
  tmdbId: '550',
  type: 'movie',
  force: 'true'
});
```

---

## 📊 Complete Integration Example

```javascript
// api.js - API client
class StreamGuardAPI {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async request(endpoint, params = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.keys(params).forEach(key => 
      url.searchParams.append(key, params[key])
    );

    const response = await fetch(url, {
      headers: { 'x-api-key': this.apiKey }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getStream(tmdbId, type, season, episode, sourceId) {
    return this.request('/cdn', {
      tmdbId,
      type,
      ...(season && { season }),
      ...(episode && { episode }),
      ...(sourceId && { sourceId })
    });
  }

  async getSources() {
    return this.request('/sources');
  }

  async getStatus() {
    const response = await fetch(`${this.baseUrl}/status`);
    return response.json();
  }
}

// Usage
const api = new StreamGuardAPI(
  'https://api.vidninja.pro',
  'your-api-key-here'
);

// Get movie stream
const movieData = await api.getStream('550', 'movie');
console.log(movieData.stream[0].playlist);

// Get TV show stream
const tvData = await api.getStream('1399', 'show', '1', '1');
console.log(tvData.stream[0].playlist);
```

---

## 🎯 Summary

### Quick Reference

| Task | Endpoint | Auth Required |
|------|----------|---------------|
| Get stream URL | `GET /cdn` | ✅ Yes |
| List providers | `GET /sources` | ✅ Yes |
| Check status | `GET /status` | ❌ No |
| Test UI | `GET /test` | ❌ No |

### Authentication Methods

1. **Header:** `x-api-key: YOUR_KEY` ⭐ Recommended
2. **Query:** `?apiKey=YOUR_KEY`

### Stream URL Format

```
https://api.vidninja.pro/s/{token}
```

**Important:** Always use the proxied URL from `stream[].playlist`, never try to extract or use the original CDN URL.

### Essential Parameters

- `tmdbId` - TMDB content ID (required)
- `type` - `movie` or `show` (required)
- `season` - Season number (for TV shows)
- `episode` - Episode number (for TV shows)

---

**Need help?** Check the [main README](./README.md) or open an issue on GitHub.
