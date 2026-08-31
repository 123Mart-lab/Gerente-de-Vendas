import { Queue } from 'bullmq';

// Fila responsável pelas tarefas do Diretor de Arte e Audiovisual
export const mediaQueue = new Queue('media-queue', {
  connection: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
  }
});
