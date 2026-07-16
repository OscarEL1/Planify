import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';

const app = createApp();
const httpServer = createServer(app);

// Configuración de Socket.io
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173' }
});

// Eventos base de Websockets
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado:', socket.id);
  socket.on('disconnect', () => console.log('❌ Cliente desconectado:', socket.id));
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Servidor Planify corriendo en el puerto ${PORT}`);
});
