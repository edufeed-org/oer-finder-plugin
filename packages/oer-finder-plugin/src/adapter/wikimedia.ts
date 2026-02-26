import { registerAdapter } from '../adapters/adapter-registry.js';
import { createWikimediaAdapter } from '@edufeed-org/oer-adapter-wikimedia';

export function registerWikimediaAdapter(): void {
  registerAdapter('wikimedia', () => createWikimediaAdapter());
}
