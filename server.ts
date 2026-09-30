import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createApiRouter } from './src/server/api.ts';

const rootDir = process.cwd();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mount the Full-Stack REST API & Database router FIRST
  const apiRouter = createApiRouter();
  app.use('/api', apiRouter);

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Full-Stack Server] Change-Risk Intelligence Server running at http://0.0.0.0:${PORT}`);
    console.log(`[REST API] Health Check at http://0.0.0.0:${PORT}/api/health`);
    console.log(`[REST API] Projects at http://0.0.0.0:${PORT}/api/projects`);
    console.log(`[REST API] Graph Snapshot at http://0.0.0.0:${PORT}/api/projects/proj-ecommerce/graph`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
