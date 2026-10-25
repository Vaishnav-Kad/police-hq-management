import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import app from './src/app.js';
import { env } from './src/config/env.js';
import { initBackgroundCronJobs } from './src/services/cronService.js';

const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Attach socket instance to app for controller access
app.set('io', io);

// Socket.io JWT Authentication Middleware
io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    (socket.handshake.headers?.authorization && socket.handshake.headers.authorization.startsWith('Bearer ')
      ? socket.handshake.headers.authorization.split(' ')[1]
      : null);

  if (!token) {
    // If no token provided in development, allow anonymous connection with guest flag
    if (env.NODE_ENV === 'development') {
      socket.user = { id: 0, role: 'Anonymous', badge_number: 'GUEST', station_id: 1 };
      return next();
    }
    return next(new Error('Authentication error: Missing JWT token'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT.SECRET);
    socket.user = decoded;
    return next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid or expired JWT token'));
  }
});

// Socket connection event & dynamic room management
io.on('connection', (socket) => {
  const user = socket.user || { badge_number: 'UNKNOWN', role: 'Guest' };
  console.log(`[Socket.io] Officer connected: ${user.badge_number} (${user.role}) - Socket ID: ${socket.id}`);

  // Auto-join broadcast room for department-wide BOLO alerts
  socket.join('broadcast');

  // Join precinct-specific room
  if (user.station_id) {
    socket.join(`station_${user.station_id}`);
  }

  // Join role-specific room (e.g., 'role_Admin', 'role_Head-Officer')
  if (user.role) {
    socket.join(`role_${user.role}`);
  }

  // Join personal officer room for targeted alerts
  if (user.id) {
    socket.join(`officer_${user.id}`);
  }

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Officer disconnected: ${user.badge_number} - Socket ID: ${socket.id}`);
  });
});

// Initialize background cron jobs (e.g., 90-day case alerts)
initBackgroundCronJobs();

const PORT = env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` POLICE HEADQUARTERS DATA MANAGEMENT SYSTEM`);
  console.log(` Backend Service running on port ${PORT}`);
  console.log(` Environment: ${env.NODE_ENV}`);
  console.log(` Storage Path: ${env.STORAGE_PATH}`);
  console.log(`====================================================`);
});
