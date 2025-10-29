import { config } from '../config';

export const corsOptions = {
  origin: config.isDevelopment
    ? ['http://localhost:3000']
    : process.env.CORS_ORIGINS?.split(',') || [
        'https://www.lockinn.app',
        'https://lockinn.app',
        'https://lockin-frontend.vercel.app',
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
