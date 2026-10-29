/**
 * body-map.js - Mapa interactivo del cuerpo
 * ------------------------------------------------------------
 * Al elegir una zona (punto del SVG o botón), se piden los datos
 * a la API y se muestran en el panel lateral.
 */

import { api, escapar, htmlError, claseEstado } from './api.js';

// Pequeña caché en memoria para no repetir peticiones.
const cache = new Map();

export function iniciarMapaCuerpo() {
  const panel = document.getElementById('panel-zona');
  const puntos = document.querySelectorAll('.punto');
  const chips = document.querySelectorAll('.mapa__zonas .chip');
  if (!panel) return;

  let zonaActual = null;

  /** Marca visualmente la zona activa en el SVG y en los botones. */
  function marcarActiva(zona) {
    puntos.forEach((p) => {
      const activo = p.dataset.zona === zona;
      p.classList.toggle('punto--activo', activo);
      p.setAttribute('aria-pressed', String(activo));
    });
    chips.forEach((c) => {
      const activo = c.dataset.zona === zona;
      c.classList.toggle('chip--activo', activo);
      c.setAttribute('aria-pressed', String(activo));
    });
  }

  /** Pinta la ficha de una tecnología en el panel. */
  function pintar(t) {
    panel.innerHTML = `
      <div class="ficha">
        <div class="ficha__cabecera">
          <span class="ficha__icono" aria-hidden="true">${escapar(t.icono)}</span>
          <div>
            <p class="ficha__area">${escapar(t.area)}</p>
            <h3 class="ficha__titulo">${escapar(t.nombre)}</h3>
          </div>
        </div>
        <span class="${claseEstado(t.estado)}">${escapar(t.estado)}</span>
        <p class="ficha__texto">${escapar(t.explicacion)}</p>
        <div class="ficha__curioso">
          <strong>💡 Dato curioso</strong>
          <p>${escapar(t.datoCurioso)}</p>
        </div>
      </div>`;
  }

  /** Carga la zona elegida (desde caché o desde la API). */
  async function cargarZona(zona) {
    zonaActual = zona;
    marcarActiva(zona);

    if (cache.has(zona)) {
      pintar(cache.get(zona));
      return;
    }

    panel.innerHTML = '<p class="estado-carga">Cargando...</p>';
    try {
      const datos = await api.obtenerPorZona(zona);
      cache.set(zona, datos);
      if (zonaActual === zona) pintar(datos); // evita pintar una respuesta antigua
    } catch (error) {
      if (zonaActual === zona) panel.innerHTML = htmlError(error.message);
    }
  }

  // Clic y teclado (Enter / Espacio) sobre los puntos del SVG
  puntos.forEach((punto) => {
    punto.addEventListener('click', () => cargarZona(punto.dataset.zona));
    punto.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        cargarZona(punto.dataset.zona);
      }
    });
  });

  chips.forEach((chip) => chip.addEventListener('click', () => cargarZona(chip.dataset.zona)));

  // Botón "Intenta de nuevo" dentro del panel
  panel.addEventListener('click', (e) => {
    if (e.target.closest('[data-reintentar]') && zonaActual) cargarZona(zonaActual);
  });
}
