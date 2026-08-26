import { Worker } from 'bullmq';
import { connection } from './redis.js';
export const salesWorker = new Worker('sales-queue', async (job) => {}, { connection });
