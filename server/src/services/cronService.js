import cron from 'node-cron';
import { checkAndGenerate90DayPendingAlerts } from './alertService.js';

let cronTask = null;

/**
 * Initialize daily 90-day cold case alert background job
 */
export function initBackgroundCronJobs() {
  if (cronTask) return; // Prevent duplicate scheduling

  // Schedule to run every day at 00:00 (Midnight)
  cronTask = cron.schedule('0 0 * * *', async () => {
    console.log('[Cron Worker] Running automated 90-day pending case review...');
    try {
      const result = await checkAndGenerate90DayPendingAlerts();
      console.log(`[Cron Worker] Review completed: ${result.alertsGenerated} alerts generated.`);
    } catch (err) {
      console.error('[Cron Worker Error] Failed to execute pending case scan:', err.message);
    }
  });

  console.log('[Cron Worker] Automated 90-day case alert scheduler active.');
}

export function stopBackgroundCronJobs() {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
  }
}
