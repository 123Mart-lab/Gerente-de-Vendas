import { getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
const app = admin.initializeApp({ projectId: 'demo-test' });
const db = getFirestore(app, 'ai-studio-123martbot-19f3e99a-8216-4025-87f9-5c4fa761b2df');
console.log(db);
