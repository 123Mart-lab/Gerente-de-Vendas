import { aiService } from './dist/server.cjs';
// We can't easily import from bundled cjs if it doesn't export aiService.
// Let's just make a POST request to the API!
