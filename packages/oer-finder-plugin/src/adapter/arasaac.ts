import { registerAdapter } from '../adapters/adapter-registry.js';
import { createArasaacAdapter } from '@edufeed-org/oer-adapter-arasaac';

export function registerArasaacAdapter(): void {
  registerAdapter('arasaac', () => createArasaacAdapter());
}
