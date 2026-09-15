import type { FastifyInstance } from 'fastify';
import type { DeliverReturnReminderRequest } from '@measagent/shared';
import { deliverReturnReminder } from '../../../../handlers/reminders/deliver-return-reminder.js';
import schemas from './schemas.js';

export default async function returnReminderRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post<{ Body: DeliverReturnReminderRequest }>(
    '/',
    { schema: schemas.deliverReturnReminder },
    deliverReturnReminder
  );
}
