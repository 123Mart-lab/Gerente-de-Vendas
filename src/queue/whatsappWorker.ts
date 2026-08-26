import { Worker } from 'bullmq';
import { connection } from './redis.js';
export const whatsappWorker = new Worker('whatsapp-inbound', async (job) => {}, { connection });
