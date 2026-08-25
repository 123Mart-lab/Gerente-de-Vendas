import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({
  host: '127.0.0.1',
  port: 6379,
  maxRetriesPerRequest: null
});

const whatsappQueue = new Queue('whatsapp-messages', { connection });

async function simulateWebhook() {
  console.log('📥 Recebendo 3 mensagens simultâneas...');
  
  await whatsappQueue.add('process-lead', { phone: '5511999999991', text: 'Bom dia' });
  await whatsappQueue.add('process-lead', { phone: '5511999999992', text: 'Qual o valor?' });
  await whatsappQueue.add('process-lead', { phone: '5511999999993', text: 'Quero comprar' });
  
  console.log('✅ Mensagens empilhadas no Redis com sucesso!');
}

const worker = new Worker('whatsapp-messages', async job => {
  const { phone, text } = job.data;
  console.log();
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log();
}, { connection });

worker.on('ready', () => {
  console.log('🛠️ Worker do BullMQ pronto e aguardando na fila...');
  simulateWebhook();
});

worker.on('error', err => {
  console.error('❌ Erro no Worker:', err);
});
