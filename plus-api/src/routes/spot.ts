import type { FastifyInstance } from 'fastify';
import { spotCampaign, spotControls } from '../services/spot-controls.js';

// Public settings only. No identity, payment, token, or write operation here.
export async function spotRoutes(app: FastifyInstance): Promise<void> {
  app.get('/spot/config', async () => {
    const [slots, campaign] = await Promise.all([spotControls(), spotCampaign()]);
    return campaign ? { slots, campaign: { sessions: campaign } } : { slots };
  });
}
