import 'dotenv/config';
import { firebaseService } from './src/services/firebase.js';

async function test() {
  const creds = await firebaseService.getNuvemshopCredentials();
  console.log("Credentials:", creds);
}
test();
