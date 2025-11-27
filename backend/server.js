import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import ledRoutes from './routes/ledRoutes.js';
import { initHardware, cleanup } from './controllers/ledController.js';
import { errorHandler } from './middleware/errorHandler.js';
import { config } from './config.js';

const app = express();
const PORT = config.port;

// Middleware
app.use(cors({
  origin: config.cors.origin,
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/led', ledRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'LED Controller API is running' });
});

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received:', data);
      // Echo back or handle commands if needed
    } catch (error) {
      console.error('Invalid WebSocket message:', error.message);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize hardware with WebSocket server
try {
  initHardware(wss);
} catch (error) {
  console.error('❌ Failed to initialize hardware:', error.message);
  console.error('Server will start but hardware functions will be unavailable');
}

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 LED Controller API running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server running on ws://localhost:${PORT}/ws`);
  console.log(`📡 Access from network: http://<your-pi-ip>:${PORT}`);
  console.log(`⚙️  Environment: ${config.environment}`);
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('\n🛑 Shutting down gracefully...');
  cleanup();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
