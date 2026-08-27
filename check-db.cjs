const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config();

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/(^"|"$)/g, '').replace(/\\n/g, '\n'),
  })
});

const db = getFirestore();

async function check() {
  try {
    const doc = await db.collection('config').doc('nuvemshopAuth').get();
    if (doc.exists) {
      console.log('NUVEMSHOP AUTH NO FIREBASE:', doc.data());
    } else {
      console.log('NENHUMA AUTENTICAÇÃO DA NUVEMSHOP NO FIREBASE ENCONTRADA.');
    }
  } catch (e) {
    console.error('ERRO:', e.message);
  }
}

check();
