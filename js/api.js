/**
 * api.js - Comunicación con el backend
 * ------------------------------------------------------------
 * Todas las peticiones pasan por `pedir`, que añade un tiempo
 * máximo de espera y convierte los errores en mensajes amables.
 */

const BASE = '/api';
const TIEMPO_MAXIMO_MS = 10000;

/**
 * Realiza una petición a la API y devuelve el JSON.
 * Lanza un Error con un mensaje legible si algo falla.
 */
async function pedir(ruta, opciones = {}) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_MAXIMO_MS);

  try {
    const respuesta = await fetch(`${BASE}${ruta}`, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      ...opciones,
      signal: controlador.signal
    });

    let datos = null;
    try {
      datos = await respuesta.json();
    } catch {
      datos = null;
    }

    if (!respuesta.ok) {
      throw new Error(datos?.error || 'El servidor no respondió correctamente.');
    }
    return datos;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('El servidor tardó demasiado en responder.');
    }
    if (error instanceof TypeError) {
      throw new Error('No hay conexión con el servidor.');
    }
    throw error;
  } finally {
    clearTimeout(temporizador);
  }
}

export const api = {
  /** Lista completa de tecnologías (incluye votos). */
  obtenerTecnologias: () => pedir('/tecnologias'),

  /** Tecnología de una zona del cuerpo (cerebro, ojos, corazon...). */
  obtenerPorZona: (zona) => pedir(`/tecnologias/${encodeURIComponent(zona)}`),

  /** Hitos de la línea de tiempo. */
  obtenerLineaTiempo: () => pedir('/linea-tiempo'),

  /** Las 5 tecnologías más votadas. */
  obtenerRanking: () => pedir('/ranking'),

  /** Envía un voto anónimo. */
  votar: (id) => pedir(`/tecnologias/${encodeURIComponent(id)}/voto`, { method: 'POST' }),

  /** Suscripción con un único dato: el correo. */
  suscribir: (email, website = '') =>
    pedir('/suscripcion', { method: 'POST', body: JSON.stringify({ email, website }) })
};

/** Escapa texto antes de insertarlo como HTML. */
export function escapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

/** Bloque HTML reutilizable para errores con botón de reintento. */
export function htmlError(mensaje) {
  return `
    <div class="estado-error" role="alert">
      <p>😕 ${escapar(mensaje)}</p>
      <button class="btn btn--fantasma btn--pequeno" data-reintentar>Intenta de nuevo</button>
    </div>`;
}

/** Clase CSS según el estado de la tecnología. */
export function claseEstado(estado) {
  const mapa = { 'Ya existe': 'existe', 'En pruebas': 'pruebas', Futuro: 'futuro' };
  return `estado estado--${mapa[estado] || 'futuro'}`;
}
