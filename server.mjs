import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';

// Load environment variables
config();

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API server running' });
});

// Import API handlers dynamically
app.post('/api/auth/login', async (req, res) => {
  const { default: handler } = await import('./api/auth/login.js');
  return handler(req, res);
});

app.post('/api/auth/signup', async (req, res) => {
  const { default: handler } = await import('./api/auth/signup.js');
  return handler(req, res);
});

app.get('/api/config', async (req, res) => {
  const { default: handler } = await import('./api/config.js');
  return handler(req, res);
});

app.listen(port, () => {
  console.log(`\n🚀 API Server running at http://localhost:${port}`);
  console.log(`✅ Endpoints available:`);
  console.log(`   POST http://localhost:${port}/api/auth/login`);
  console.log(`   POST http://localhost:${port}/api/auth/signup`);
  console.log(`   GET  http://localhost:${port}/api/config\n`);
  console.log(`💡 Run "pnpm dev" in another terminal for frontend\n`);
});
