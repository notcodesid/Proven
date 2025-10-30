import { config } from '../config';

export const corsOptions = {
  origin: config.isDevelopment
    ? ['http://localhost:3000']
    : process.env.CORS_ORIGINS?.split(',') || [
        'https://proven-beryl.vercel.app', 
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie'], 
};