import http from 'node:http';
import dotenv from 'dotenv';
import { createApp } from './app.js';
import { setupWebSocketServer } from './websocket.js';

dotenv.config();

const PORT = process.env.PORT || 4000;
const app = createApp();
const server = http.createServer(app);

setupWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT} (HTTP + WebSocket)`);
});
