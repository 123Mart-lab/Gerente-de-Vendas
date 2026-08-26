import { getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
admin.initializeApp({ projectId: 'demo-test' });
const db1 = getFirestore('ai-studio...');
console.log(db1._settings.databaseId);
const db2 = getFirestore(undefined, 'ai-studio...');
console.log(db2._settings.databaseId);
