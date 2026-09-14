import { firebaseService } from './src/services/firebase';

async function test() {
  await firebaseService.saveSkuBriefing('test-sku', { name: 'test' });
  const data = await firebaseService.getSkuBriefings();
  console.log('Result:', data);
}
test();
