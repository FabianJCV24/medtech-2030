/**
 * MedTech 2030 - Servidor principal
 * ------------------------------------------------------------
 * - API REST con Express (sin base de datos).
 * - Sirve también los archivos estáticos del frontend.
 * - Seguridad: helmet, cors, límite de peticiones y validación.
 * - No usa cookies ni registra datos personales de los visitantes.
 */

require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const tecnologiasRouter = require('./routes/tecnologias');
const suscripcionRouter = require('./routes/suscripcion');

const app = express();
const PORT = process.env.PORT || 3000;
const RUTA_FRONTEND = path.join(__dirname, '..', 'frontend');

// Render (y la mayoría de hostings) colocan un proxy delante de la app.
// Esto permite que express-rate-limit identifique bien cada IP.
app.set('trust proxy', 1);

// Oculta la cabecera "X-Powered-By: Express".
app.disable('x-powered-by');

/* ---------- Seguridad ---------- */

// Cabeceras de seguridad. La CSP solo permite recursos del propio sitio.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: null
      }
    }
  })
);

// CORS: por defecto solo el mismo origen. Se puede abrir a otro dominio
// definiendo CORS_ORIGIN en el .env (por ejemplo, si el frontend se aloja aparte).
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || false,
    methods: ['GET', 'POST']
  })
);

// Solo aceptamos cuerpos JSON pequeños para evitar abusos.
app.use(express.json({ limit: '10kb' }));

/* ---------- API ---------- */

// Comprobación de estado (útil para Render).
app.get('/api/salud', (req, res) => {
  res.json({ ok: true, servicio: 'MedTech 2030 API' });
});

app.use('/api', tecnologiasRouter);
app.use('/api', suscripcionRouter);

// Cualquier otra ruta /api inexistente devuelve un 404 en JSON.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Recurso no encontrado.' });
});

/* ---------- Frontend estático ---------- */

app.use(
  express.static(RUTA_FRONTEND, {
    extensions: ['html'],
    maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0
  })
);

// Cualquier ruta desconocida vuelve a la página principal.
app.get('*', (req, res) => {
  res.sendFile(path.join(RUTA_FRONTEND, 'index.html'));
});

/* ---------- Manejo de errores ---------- */

// JSON mal formado u otros errores inesperados: respuesta amable, sin detalles internos.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El formato de la petición no es válido.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'La petición es demasiado grande.' });
  }
  console.error('Error no controlado:', err.message);
  res.status(500).json({ error: 'Ocurrió un error en el servidor. Intenta de nuevo.' });
});

app.listen(PORT, () => {
  console.log(`MedTech 2030 escuchando en http://localhost:${PORT}`);
});
