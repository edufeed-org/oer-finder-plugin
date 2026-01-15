import { describe, it, expect } from 'vitest';
import { ClientFactory } from './client-factory.js';
import { ApiClient } from './api-client.js';
import { DirectClient } from './direct-client.js';

describe('ClientFactory', () => {
  it('creates ApiClient when apiUrl is provided', () => {
    const client = ClientFactory.create({ apiUrl: 'https://api.example.com' });
    expect(client).toBeInstanceOf(ApiClient);
  });

  it('creates DirectClient when apiUrl is not provided', () => {
    const client = ClientFactory.create({});
    expect(client).toBeInstanceOf(DirectClient);
  });
});
