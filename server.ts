import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';

// Load environment variables
config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Import API route handlers
async function importHandler(path: string) {
  try {
    const module = await import(`./api${path}.ts`);
    return module.default;
  } catch (error) {
    console.error(`Failed to import handler for ${path}:`, error);
    return null;
  }
}

// Config endpoint
app.get('/api/config', async (req, res) => {
  const handler = await importHandler('/config');
  if (handler) {
    await handler(req as any, res as any);
  } else {
    res.status(500).json({ error: 'Handler not found' });
  }
});

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
  const handler = await importHandler('/auth/login');
  if (handler) {
    await handler(req as any, res as any);
  } else {
    res.status(500).json({ error: 'Handler not found' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  const handler = await importHandler('/auth/signup');
  if (handler) {
    await handler(req as any, res as any);
  } else {
    res.status(500).json({ error: 'Handler not found' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('✅ Local API server running!');
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log('');
  console.log('Available endpoints:');
  console.log('  GET  /api/config');
  console.log('  POST /api/auth/login');
  console.log('  POST /api/auth/signup');
  console.log('');
  console.log('💡 Frontend will proxy /api/* to this server');
  console.log('');
});
