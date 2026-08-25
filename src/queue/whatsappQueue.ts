import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Conexão com o Redis local do Docker
const connection = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null
});

// A fila onde o servidor vai empilhar as mensagens
export const whatsappQueue = new Queue('whatsapp-messages', { connection });
