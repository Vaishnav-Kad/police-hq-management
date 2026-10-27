/**
 * Real-Time Socket.io Synchronization Notifier
 * Broadcasts data changes immediately to all connected clients and browser tabs
 */
export function broadcastSync(req, { entity, action, data = null }) {
  try {
    const io = req?.app?.get('io');
    if (io) {
      io.emit('data_sync', {
        entity,
        action,
        data,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('[Socket Broadcast Error]:', err.message);
  }
}
