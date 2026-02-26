import { registerAdapter } from '../adapters/adapter-registry.js';
import { createOpenverseAdapter } from '@edufeed-org/oer-adapter-openverse';

export function registerOpenverseAdapter(): void {
  registerAdapter('openverse', () => createOpenverseAdapter());
}
