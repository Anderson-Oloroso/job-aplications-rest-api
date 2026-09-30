import express from 'express';
import dotenv from 'dotenv';
import routes from './src/routes/index.js';
import { errorHandler } from './src/middlewares/error.middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());

// Rutas base
app.use('/', routes);

// Middleware de manejo de errores
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor iniciado correctamente en el puerto ${PORT}`);
});