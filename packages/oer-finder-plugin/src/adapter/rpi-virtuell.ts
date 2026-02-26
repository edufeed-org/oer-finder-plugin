import { registerAdapter } from '../adapters/adapter-registry.js';
import { createRpiVirtuellAdapter } from '@edufeed-org/oer-adapter-rpi-virtuell';

// rpi-virtuell has a built-in default API URL, so baseUrl is optional
export function registerRpiVirtuellAdapter(): void {
  registerAdapter('rpi-virtuell', (config) => createRpiVirtuellAdapter({ apiUrl: config.baseUrl }));
}
