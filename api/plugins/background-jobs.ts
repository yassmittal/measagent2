import fp from 'fastify-plugin';
import { runMemoryPass } from '../jobs/memory-pass.js';
import { runReminderPass } from '../jobs/reminder-pass.js';
import { isChatModelConfigured } from '../services/language-model.js';
import { getErrorMessage } from '../shared/errors.js';

/**
 * The work that happens between conversations, on a timer inside this process:
 * reading quiet conversations into memory, then writing return reminders.
 *
 * Not a separate worker and not a scheduler library: the work is small and
 * idempotent, and every instance can safely run it because each piece is
 * claimed with a lease in MongoDB first (`jobs/relationship-lease.ts`). A
 * second process would be one more thing to deploy for no gain at this size.
 *
 * Passes never overlap within an instance — a slow pass simply makes the next
 * tick a no-op — and the timer is unref'd so it never holds the process open.
 */
export default fp(
  async (fastify) => {
    const db = fastify.mongo.db;
    if (db === undefined || !isChatModelConfigured()) return;

    let isPassRunning = false;
    const runPass = async () => {
      if (isPassRunning) return;
      isPassRunning = true;
      try {
        const context = {
          db,
          log: fastify.log,
          quietSeconds: fastify.config.MA_MEMORY_QUIET_SECONDS,
          reminderAfterSeconds: fastify.config.MA_REMINDER_AFTER_SECONDS,
        };
        // Memory first, so a reminder is written from what was just remembered.
        await runMemoryPass(context);
        await runReminderPass(context);
      } catch (error) {
        fastify.log.error({ err: getErrorMessage(error) }, 'Background pass failed');
      } finally {
        isPassRunning = false;
      }
    };

    let timer: ReturnType<typeof setInterval> | null = null;
    fastify.addHook('onReady', async () => {
      timer = setInterval(runPass, fastify.config.MA_JOB_INTERVAL_SECONDS * 1000);
      timer.unref();
    });
    fastify.addHook('onClose', async () => {
      if (timer !== null) clearInterval(timer);
    });
  },
  { name: 'background-jobs', dependencies: ['mongodb', 'indexes'] }
);
