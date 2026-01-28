// Test RPI-Virtuell Adapter directly
import { createRpiVirtuellAdapter } from './packages/oer-adapter-rpi-virtuell/dist/index.js';

const adapter = createRpiVirtuellAdapter();

console.log('Testing RPI-Virtuell adapter...');
console.log('Source ID:', adapter.sourceId);
console.log('Source Name:', adapter.sourceName);

try {
  const result = await adapter.search({
    keywords: 'Abraham',
    page: 1,
    pageSize: 3
  });
  
  console.log('Total items:', result.items.length);
  if (result.items.length > 0) {
    console.log('First item:', JSON.stringify(result.items[0], null, 2));
  }
} catch (e) {
  console.error('Error:', e);
}
