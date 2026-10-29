/**
 * Rutas de tecnologías, votos, ranking y línea de tiempo.
 * ------------------------------------------------------------
 * Los datos se leen de archivos JSON (backend/data) al arrancar.
 * Los votos se guardan solo en memoria: se reinician si el servidor
 * se reinicia. No se guarda ningún dato del visitante.
 */

const fs = require('fs');
const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');

const router = express.Router();

/* ---------- Carga de datos ---------- */

function leerJSON(nombreArchivo) {
  const ruta = path.join(__dirname, '..', 'data', nombreArchivo);
  return JSON.parse(fs.readFileSync(ruta, 'utf8'));
}

const { tecnologias } = leerJSON('tecnologias.json');
const { hitos } = leerJSON('linea-tiempo.json');

// Contador de votos en memoria: { idTecnologia: numero }
const votos = Object.fromEntries(tecnologias.map((t) => [t.id, 0]));

// Patrones permitidos para los parámetros de la URL.
const PATRON_ID = /^[a-z0-9-]{2,40}$/;

/** Devuelve la tecnología con su contador de votos actual. */
function conVotos(tecnologia) {
  return { ...tecnologia, votos: votos[tecnologia.id] || 0 };
}

/* ---------- Límite anti-spam para votos ---------- */

const limiteVotos = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 30, // máximo 30 votos por IP en ese intervalo
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Has enviado demasiados votos. Espera unos minutos e intenta de nuevo.' }
});

/* ---------- Endpoints ---------- */

// GET /api/tecnologias -> todas las tecnologías con sus votos
router.get('/tecnologias', (req, res) => {
  res.json(tecnologias.map(conVotos));
});

// GET /api/tecnologias/:zona -> tecnología asociada a una zona del cuerpo
router.get('/tecnologias/:zona', (req, res) => {
  const zona = String(req.params.zona).toLowerCase();

  if (!PATRON_ID.test(zona)) {
    return res.status(400).json({ error: 'Zona no válida.' });
  }

  const encontrada = tecnologias.find((t) => t.zona === zona);
  if (!encontrada) {
    return res.status(404).json({ error: 'No hay información para esa zona.' });
  }

  res.json(conVotos(encontrada));
});

// POST /api/tecnologias/:id/voto -> suma un voto anónimo
router.post('/tecnologias/:id/voto', limiteVotos, (req, res) => {
  const id = String(req.params.id).toLowerCase();

  if (!PATRON_ID.test(id) || !(id in votos)) {
    return res.status(404).json({ error: 'Tecnología no encontrada.' });
  }

  votos[id] += 1;
  res.status(201).json({ id, votos: votos[id] });
});

// GET /api/ranking -> las 5 tecnologías más votadas
router.get('/ranking', (req, res) => {
  const ranking = tecnologias
    .map((t) => ({ id: t.id, nombre: t.nombre, icono: t.icono, votos: votos[t.id] || 0 }))
    .sort((a, b) => b.votos - a.votos || a.nombre.localeCompare(b.nombre, 'es'))
    .slice(0, 5);

  res.json(ranking);
});

// GET /api/linea-tiempo -> hitos ordenados por año
router.get('/linea-tiempo', (req, res) => {
  res.json([...hitos].sort((a, b) => a.anio - b.anio));
});

module.exports = router;
