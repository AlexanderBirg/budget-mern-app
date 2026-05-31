import cors from 'cors';
import express from 'express';
import projectRoutes from './routes/projectRoutes.js';

export function createApp(): express.Express {
  const app = express();

  // CORS нужен, потому что React и Express работают на разных портах в режиме разработки.
  // Разрешаем localhost и 127.0.0.1, чтобы приложение открывалось в разных браузерах без ручной правки.
  const allowedOrigins = [
    process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];

  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'budget-mern-server' });
  });

  app.use('/api', projectRoutes);

  return app;
}
