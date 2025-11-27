import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import ledRoutes from './routes/ledRoutes.js';
import { initHardware, cleanup } from './controllers/ledController.js';

const app = express();
const PORT = 3001;

// CORS - Allow all origins
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/led', ledRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'LED Controller API is running' });
});

// Create HTTP server
const server = createServer(app);

// Create WebSocket server with proper configuration
const wss = new WebSocketServer({ 
  server,
  path: '/ws',
  // Add these options
  perMessageDeflate: false,
  clientTracking: true,
  // Handle CORS for WebSocket
  verifyClient: (info) => {
    // Allow all origins for now
    return true;
  }
});

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`✅ WebSocket client connected from ${clientIp}`);
  
  // Mark connection as alive
  ws.isAlive = true;
  
  // Handle pong response
  ws.on('pong', () => {
    ws.isAlive = true;
  });
  
  // Handle messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (error) {
      // Ignore non-JSON messages
    }
  });
  
  ws.on('close', (code, reason) => {
    console.log(`❌ WebSocket client disconnected (${code}): ${reason || 'No reason'}`);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error.message);
  });
});

// Heartbeat to detect broken connections
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log('💔 Terminating dead connection');
      return ws.terminate();
    }
    
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

// Initialize hardware
await initHardware(wss);

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 LED Controller API running on http://0.0.0.0:${PORT}`);
  console.log(`🔌 WebSocket server running on ws://0.0.0.0:${PORT}/ws`);
  console.log(`📡 Access from network: http://192.168.0.109:${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('\n🛑 Shutting down gracefully...');
  cleanup();
  clearInterval(heartbeatInterval);
  wss.close(() => {
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
