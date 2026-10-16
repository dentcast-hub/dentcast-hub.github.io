import type { FastifyInstance } from 'fastify';
import { spotControls } from '../services/spot-controls.js';

// Public settings only. No identity, payment, token, or write operation here.
export async function spotRoutes(app: FastifyInstance): Promise<void> {
  app.get('/spot/config', async () => ({ slots: await spotControls() }));
}
