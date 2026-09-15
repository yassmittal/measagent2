import type { FastifyInstance } from 'fastify';
import type { UpdateWeeklySummarySettingsRequest } from '@measagent/shared/weekly-summary';
import { loadWeeklySummarySettings } from '../../../../handlers/weekly-summary/load-weekly-summary-settings.js';
import { updateWeeklySummarySettings } from '../../../../handlers/weekly-summary/update-weekly-summary-settings.js';
import schemas from './schemas.js';

export default async function weeklySummarySettingsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', { schema: schemas.loadWeeklySummarySettings }, loadWeeklySummarySettings);

  fastify.patch<{ Body: UpdateWeeklySummarySettingsRequest }>(
    '/',
    { schema: schemas.updateWeeklySummarySettings },
    updateWeeklySummarySettings
  );
}
