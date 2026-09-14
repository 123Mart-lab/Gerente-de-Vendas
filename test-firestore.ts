import { firebaseService } from './src/services/firebase.js';

async function run() {
  const briefings = await firebaseService.getSkuBriefings();
  console.log('Briefings:', JSON.stringify(briefings, null, 2));
}
run();
