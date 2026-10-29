/**
 * Envío de correos con Nodemailer + Gmail.
 * ------------------------------------------------------------
 * Requiere en el .env:
 *   EMAIL_USER     -> cuenta de Gmail que envía
 *   EMAIL_PASS     -> contraseña de aplicación de 16 caracteres
 *   EMAIL_DESTINO  -> correo donde quieres recibir los avisos
 */

const nodemailer = require('nodemailer');

const { EMAIL_USER, EMAIL_PASS, EMAIL_DESTINO } = process.env;

/** Indica si las variables de correo están definidas. */
function correoConfigurado() {
  return Boolean(EMAIL_USER && EMAIL_PASS && EMAIL_DESTINO);
}

// El transporte se crea una sola vez y se reutiliza.
const transporte = correoConfigurado()
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: EMAIL_USER, pass: EMAIL_PASS }
    })
  : null;

if (!transporte) {
  console.warn('Aviso: faltan variables EMAIL_* en el .env. La suscripción estará desactivada.');
}

/** Escapa caracteres especiales para insertar texto en HTML de forma segura. */
function escaparHTML(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Plantilla HTML del correo de bienvenida (estilos en línea para clientes de correo). */
function plantillaBienvenida() {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Bienvenida a MedTech 2030</title></head>
<body style="margin:0;padding:0;background:#eef6fb;font-family:'Segoe UI',Arial,sans-serif;color:#0b2540;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef6fb;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(11,37,64,.12);">
        <tr>
          <td style="background:#0a4d8c;background-image:linear-gradient(135deg,#0a4d8c 0%,#0fb5c9 100%);padding:40px 32px;text-align:center;">
            <div style="font-size:42px;line-height:1;">🧬</div>
            <h1 style="margin:14px 0 6px;color:#ffffff;font-size:28px;letter-spacing:1px;">MedTech 2030</h1>
            <p style="margin:0;color:#d9f7fb;font-size:15px;">El cuerpo humano reinventado por la tecnología</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 12px;font-size:22px;color:#0a4d8c;">¡Gracias por suscribirte!</h2>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
              A partir de ahora recibirás novedades sobre cómo la tecnología está transformando la medicina:
            </p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px;">
              <tr><td style="padding:10px 14px;background:#f1fbfd;border-left:4px solid #0fb5c9;border-radius:8px;font-size:15px;">🤖 Inteligencia artificial y robótica médica</td></tr>
              <tr><td style="height:8px;"></td></tr>
              <tr><td style="padding:10px 14px;background:#f1fbfd;border-left:4px solid #0fb5c9;border-radius:8px;font-size:15px;">🖨️ Impresión 3D de tejidos, prótesis e implantes</td></tr>
              <tr><td style="height:8px;"></td></tr>
              <tr><td style="padding:10px 14px;background:#f1fbfd;border-left:4px solid #0fb5c9;border-radius:8px;font-size:15px;">🔬 Nanotecnología y edición genética</td></tr>
            </table>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#36506b;">
              Solo usaremos tu correo para enviarte novedades. Nada más. No guardamos tus datos en ninguna base de datos.
            </p>
            <p style="margin:0;padding:14px;background:#fff8e6;border-radius:10px;font-size:13px;line-height:1.5;color:#6b5200;">
              ⚕️ Este sitio es solo informativo y educativo. No reemplaza la consulta con un profesional de la salud.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 32px;background:#0b2540;text-align:center;color:#9fc3dd;font-size:12px;">
            Recibes este mensaje porque te suscribiste en MedTech 2030.<br>
            Si no fuiste tú, simplemente ignora este correo.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Envía el aviso al administrador y la bienvenida al suscriptor.
 * @param {string} emailSuscriptor correo ya validado
 */
async function enviarCorreosSuscripcion(emailSuscriptor) {
  if (!transporte) throw new Error('Correo no configurado');

  const remitente = `"MedTech 2030" <${EMAIL_USER}>`;
  const fecha = new Date().toLocaleString('es', { timeZone: 'UTC' });

  const aviso = {
    from: remitente,
    to: EMAIL_DESTINO,
    subject: 'Nuevo suscriptor en MedTech 2030',
    text: `Nuevo suscriptor: ${emailSuscriptor}\nFecha (UTC): ${fecha}`,
    html: `<p style="font-family:Arial,sans-serif;font-size:15px;">
             <strong>Nuevo suscriptor:</strong> ${escaparHTML(emailSuscriptor)}<br>
             <strong>Fecha (UTC):</strong> ${escaparHTML(fecha)}
           </p>`
  };

  const bienvenida = {
    from: remitente,
    to: emailSuscriptor,
    subject: '¡Bienvenida/o a MedTech 2030! 🧬',
    text:
      '¡Gracias por suscribirte a MedTech 2030!\n\n' +
      'Recibirás novedades sobre IA, robótica, impresión 3D, nanotecnología y edición genética en medicina.\n' +
      'Solo usaremos tu correo para enviarte novedades. Nada más.\n\n' +
      'Este sitio es solo informativo y educativo. No reemplaza la consulta con un profesional de la salud.',
    html: plantillaBienvenida()
  };

  await Promise.all([transporte.sendMail(aviso), transporte.sendMail(bienvenida)]);
}

module.exports = { enviarCorreosSuscripcion, correoConfigurado };
