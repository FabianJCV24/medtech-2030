/**
 * Ruta de suscripción.
 * ------------------------------------------------------------
 * Recibe únicamente un correo electrónico, lo valida y envía:
 *   1) Un aviso al administrador (EMAIL_DESTINO).
 *   2) Un correo de bienvenida al suscriptor.
 * El correo NO se guarda en ningún archivo ni se escribe en los logs.
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { enviarCorreosSuscripcion, correoConfigurado } = require('../utils/mailer');

const router = express.Router();

// Validación razonable de correo (la misma regla que usa el frontend).
const PATRON_EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-zA-Z]{2,}$/;

function validarEmail(valor) {
  if (typeof valor !== 'string') return null;
  const email = valor.trim().toLowerCase();
  if (email.length < 6 || email.length > 254) return null;
  return PATRON_EMAIL.test(email) ? email : null;
}

// Máximo 5 intentos de suscripción por IP cada hora.
const limiteSuscripcion = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de suscripción. Intenta de nuevo más tarde.' }
});

// POST /api/suscripcion  { "email": "persona@dominio.com" }
router.post('/suscripcion', limiteSuscripcion, async (req, res) => {
  const cuerpo = req.body || {};

  // Campo trampa (honeypot): los humanos no lo ven; si viene relleno, es un bot.
  // Respondemos "ok" para no darle pistas, pero no enviamos nada.
  if (cuerpo.website) {
    return res.json({ ok: true, mensaje: '¡Gracias por suscribirte!' });
  }

  const email = validarEmail(cuerpo.email);
  if (!email) {
    return res.status(400).json({ error: 'Escribe un correo electrónico válido.' });
  }

  if (!correoConfigurado()) {
    return res
      .status(503)
      .json({ error: 'El servicio de suscripción no está disponible en este momento.' });
  }

  try {
    await enviarCorreosSuscripcion(email);
    res.json({ ok: true, mensaje: '¡Gracias por suscribirte!' });
  } catch (error) {
    // Registramos solo el motivo técnico, nunca el correo del suscriptor.
    console.error('Error al enviar correos de suscripción:', error.code || error.message);
    res.status(502).json({ error: 'No pudimos completar la suscripción. Intenta de nuevo.' });
  }
});

module.exports = router;
