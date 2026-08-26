import { getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
admin.initializeApp({ projectId: 'demo-test' });
try {
const db = getFirestore('ai-studio-123martbot-19f3e99a-8216-4025-87f9-5c4fa761b2df');
console.log("DB ID:", db._settings.databaseId);
console.log("Project ID:", db._settings.projectId);
} catch (e) { console.error(e) }
