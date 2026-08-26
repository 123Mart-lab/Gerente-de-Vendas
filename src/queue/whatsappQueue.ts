import { Queue } from 'bullmq';
import { connection } from './redis.js';

export const whatsappQueue = new Queue('whatsapp-inbound', { connection });
export const salesQueue = new Queue('sales-queue', { connection });
export const supportQueue = new Queue('support-queue', { connection });
