import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configuración de Socket.io
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173' }
});

// Middlewares de seguridad y parseo
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// Ruta de prueba (Health Check)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', project: 'Planify Backend funcionando 🚀' });
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