import { Worker } from 'bullmq';
import { connection } from './redis.js';
export const supportWorker = new Worker('support-queue', async (job) => {}, { connection });
