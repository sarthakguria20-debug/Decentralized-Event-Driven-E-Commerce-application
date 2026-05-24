import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/api';
import './src/server/microservices'; // Init listeners immediately on boot

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Global middleware
  app.use(express.json());

  // Mount API Gateway routes
  app.use('/api', apiRouter);

  // Serve Single Page Application
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA Fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`API Gateway & Services running on http://localhost:${PORT}`);
  });
}

startServer();
