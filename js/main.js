/**
 * main.js - Lógica principal del frontend
 * ------------------------------------------------------------
 * Tema claro/oscuro, barra de progreso, animaciones al hacer scroll,
 * fondo animado del hero, tarjetas con votos, ranking, comparador,
 * línea de tiempo y formulario de suscripción.
 */

import { api, escapar, htmlError, claseEstado } from './api.js';
import { iniciarMapaCuerpo } from './body-map.js';

const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* =============================================================
   Utilidades de almacenamiento local (solo para votos y tema)
   ============================================================= */

const CLAVE_VOTOS = 'medtech2030-votos';
const CLAVE_TEMA = 'medtech2030-tema';

function leerLocal(clave, porDefecto) {
  try {
    const valor = localStorage.getItem(clave);
    return valor === null ? porDefecto : JSON.parse(valor);
  } catch {
    return porDefecto; // modo privado o almacenamiento bloqueado
  }
}

function guardarLocal(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* sin almacenamiento: la app sigue funcionando */
  }
}

/** Muestra una notificación breve en la esquina inferior. */
function notificar(mensaje) {
  const caja = document.getElementById('aviso-flotante');
  if (!caja) return;
  caja.textContent = mensaje;
  caja.classList.add('aviso-flotante--visible');
  clearTimeout(notificar.t);
  notificar.t = setTimeout(() => caja.classList.remove('aviso-flotante--visible'), 3000);
}

/* =============================================================
   Tema claro / oscuro
   ============================================================= */

function iniciarTema() {
  const raiz = document.documentElement;
  const boton = document.getElementById('btn-tema');
  const preferido = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  function aplicar(tema) {
    raiz.dataset.theme = tema;
    const oscuro = tema === 'dark';
    boton.querySelector('.tema-btn__icono').textContent = oscuro ? '☀️' : '🌙';
    boton.setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    document.dispatchEvent(new CustomEvent('tema-cambiado'));
  }

  aplicar(leerLocal(CLAVE_TEMA, preferido));

  boton.addEventListener('click', () => {
    const nuevo = raiz.dataset.theme === 'dark' ? 'light' : 'dark';
    aplicar(nuevo);
    guardarLocal(CLAVE_TEMA, nuevo);
  });
}

/* =============================================================
   Menú móvil
   ============================================================= */

function iniciarMenu() {
  const boton = document.getElementById('btn-menu');
  const lista = document.getElementById('menu-principal');
  if (!boton || !lista) return;

  const cerrar = () => {
    lista.classList.remove('nav__lista--abierta');
    boton.setAttribute('aria-expanded', 'false');
    boton.setAttribute('aria-label', 'Abrir menú');
  };

  boton.addEventListener('click', () => {
    const abierto = lista.classList.toggle('nav__lista--abierta');
    boton.setAttribute('aria-expanded', String(abierto));
    boton.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
  });
  lista.addEventListener('click', (e) => e.target.closest('a') && cerrar());
  document.addEventListener('keydown', (e) => e.key === 'Escape' && cerrar());
}

/* =============================================================
   Barra de progreso de lectura
   ============================================================= */

function iniciarProgreso() {
  const barra = document.getElementById('barra-progreso');
  if (!barra) return;
  let pendiente = false;

  const actualizar = () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const porcentaje = total > 0 ? (window.scrollY / total) * 100 : 0;
    barra.style.width = `${porcentaje}%`;
    pendiente = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!pendiente) {
        pendiente = true;
        requestAnimationFrame(actualizar);
      }
    },
    { passive: true }
  );
  actualizar();
}

/* =============================================================
   Animaciones al hacer scroll
   ============================================================= */

const observadorRevelar =
  'IntersectionObserver' in window
    ? new IntersectionObserver(
        (entradas) => {
          entradas.forEach((entrada) => {
            if (entrada.isIntersecting) {
              entrada.target.classList.add('visible');
              observadorRevelar.unobserve(entrada.target);
            }
          });
        },
        { threshold: 0.12 }
      )
    : null;

/** Activa la animación de aparición en los elementos indicados. */
function revelar(elementos) {
  elementos.forEach((el) => {
    if (observadorRevelar && !reducirMovimiento) observadorRevelar.observe(el);
    else el.classList.add('visible');
  });
}

/* =============================================================
   Fondo animado del hero: electrocardiograma + hélice de ADN
   ============================================================= */

/** Forma de un latido (onda P, complejo QRS y onda T) para una fase 0..1. */
function ondaECG(p) {
  if (p < 0.1) return 0;
  if (p < 0.18) return -Math.sin(((p - 0.1) / 0.08) * Math.PI) * 8;
  if (p < 0.25) return 0;
  if (p < 0.27) return ((p - 0.25) / 0.02) * 8;
  if (p < 0.3) return 8 - ((p - 0.27) / 0.03) * 70;
  if (p < 0.33) return -62 + ((p - 0.3) / 0.03) * 82;
  if (p < 0.35) return 20 - ((p - 0.33) / 0.02) * 20;
  if (p < 0.45) return 0;
  if (p < 0.6) return -Math.sin(((p - 0.45) / 0.15) * Math.PI) * 14;
  return 0;
}

function iniciarHero() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let ancho = 0;
  let alto = 0;
  let tiempo = 0;
  let activo = true;
  let colores = {};

  function leerColores() {
    const estilos = getComputedStyle(document.documentElement);
    colores = {
      primario: estilos.getPropertyValue('--c-turquesa').trim() || '#0fb5c9',
      secundario: estilos.getPropertyValue('--c-azul').trim() || '#0a4d8c'
    };
  }

  function redimensionar() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ancho = canvas.clientWidth;
    alto = canvas.clientHeight;
    canvas.width = ancho * dpr;
    canvas.height = alto * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function dibujarADN() {
    const cx = ancho > 800 ? ancho * 0.82 : ancho * 0.85;
    const amplitud = Math.min(70, ancho * 0.12);
    const separacion = 18;
    const pasos = Math.ceil(alto / separacion) + 2;

    for (let i = 0; i < pasos; i++) {
      const y = i * separacion - (tiempo * 0.4) % separacion;
      const angulo = tiempo * 0.02 + i * 0.35;
      const x1 = cx + Math.sin(angulo) * amplitud;
      const x2 = cx - Math.sin(angulo) * amplitud;
      const profundidad = (Math.cos(angulo) + 1) / 2; // 0 (atrás) .. 1 (delante)

      // Peldaño entre las dos hebras
      ctx.globalAlpha = 0.12 + profundidad * 0.18;
      ctx.strokeStyle = colores.secundario;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();

      // Nucleótidos
      ctx.fillStyle = colores.primario;
      ctx.globalAlpha = 0.25 + profundidad * 0.6;
      ctx.beginPath();
      ctx.arc(x1, y, 2 + profundidad * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.25 + (1 - profundidad) * 0.6;
      ctx.beginPath();
      ctx.arc(x2, y, 2 + (1 - profundidad) * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function dibujarECG() {
    const base = alto * 0.72;
    const periodo = 260;
    const desplazamiento = tiempo * 2.2;

    ctx.lineWidth = 2.2;
    ctx.strokeStyle = colores.primario;
    ctx.shadowColor = colores.primario;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    for (let x = 0; x <= ancho; x += 2) {
      const fase = (((x + desplazamiento) % periodo) + periodo) % periodo / periodo;
      const y = base + ondaECG(fase);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.globalAlpha = 0.55;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  function cuadro() {
    ctx.clearRect(0, 0, ancho, alto);
    dibujarADN();
    dibujarECG();
    tiempo += 1;
    if (activo && !reducirMovimiento) requestAnimationFrame(cuadro);
  }

  leerColores();
  redimensionar();
  cuadro();

  window.addEventListener('resize', () => {
    redimensionar();
    if (reducirMovimiento) cuadro();
  });
  document.addEventListener('tema-cambiado', () => {
    leerColores();
    if (reducirMovimiento) cuadro();
  });

  // Pausa la animación cuando el hero no está a la vista (ahorra batería).
  if ('IntersectionObserver' in window && !reducirMovimiento) {
    new IntersectionObserver(([entrada]) => {
      const antes = activo;
      activo = entrada.isIntersecting;
      if (activo && !antes) requestAnimationFrame(cuadro);
    }).observe(canvas);
  }
}

/* =============================================================
   Tarjetas de tecnologías con votos anónimos
   ============================================================= */

function iniciarTarjetas() {
  const contenedor = document.getElementById('lista-tarjetas');
  if (!contenedor) return;

  const votados = new Set(leerLocal(CLAVE_VOTOS, []));

  function htmlTarjeta(t) {
    const yaVoto = votados.has(t.id);
    return `
      <article class="tarjeta holo-panel" data-id="${escapar(t.id)}">
        <div class="tarjeta__cabecera">
          <span class="tarjeta__icono" aria-hidden="true">${escapar(t.icono)}</span>
          <span class="${claseEstado(t.estado)}">${escapar(t.estado)}</span>
        </div>
        <h3 class="tarjeta__titulo">${escapar(t.nombre)}</h3>
        <p class="tarjeta__texto">${escapar(t.explicacion)}</p>
        <p class="tarjeta__curioso"><strong>💡</strong> ${escapar(t.datoCurioso)}</p>
        <div class="tarjeta__pie">
          <button class="btn-voto ${yaVoto ? 'btn-voto--hecho' : ''}" data-votar="${escapar(t.id)}"
                  ${yaVoto ? 'disabled' : ''} aria-label="Me impresiona: ${escapar(t.nombre)}">
            <span aria-hidden="true">${yaVoto ? '💙' : '🤍'}</span> ${yaVoto ? '¡Votado!' : 'Me impresiona'}
          </button>
          <span class="tarjeta__votos"><strong data-contador>${Number(t.votos) || 0}</strong> votos</span>
        </div>
      </article>`;
  }

  async function cargar() {
    contenedor.innerHTML = '<p class="estado-carga">Cargando...</p>';
    try {
      const lista = await api.obtenerTecnologias();
      const tarjetas = lista.filter((t) => t.categoria === 'tarjeta');
      contenedor.innerHTML = tarjetas.map(htmlTarjeta).join('');
      revelar(contenedor.querySelectorAll('.tarjeta'));
    } catch (error) {
      contenedor.innerHTML = htmlError(error.message);
    }
  }

  async function votar(boton) {
    const id = boton.dataset.votar;
    if (votados.has(id)) return;

    boton.disabled = true;
    try {
      const { votos } = await api.votar(id);
      votados.add(id);
      guardarLocal(CLAVE_VOTOS, [...votados]);

      const tarjeta = boton.closest('.tarjeta');
      tarjeta.querySelector('[data-contador]').textContent = votos;
      boton.classList.add('btn-voto--hecho', 'btn-voto--latido');
      boton.innerHTML = '<span aria-hidden="true">💙</span> ¡Votado!';
      notificar('¡Gracias! Tu voto anónimo se ha registrado.');
      document.dispatchEvent(new CustomEvent('voto-registrado'));
    } catch (error) {
      boton.disabled = false;
      notificar(error.message);
    }
  }

  contenedor.addEventListener('click', (e) => {
    const boton = e.target.closest('[data-votar]');
    if (boton) votar(boton);
    if (e.target.closest('[data-reintentar]')) cargar();
  });

  cargar();
}

/* =============================================================
   Ranking de las 5 más votadas
   ============================================================= */

function iniciarRanking() {
  const lista = document.getElementById('lista-ranking');
  const botonActualizar = document.getElementById('btn-actualizar-ranking');
  if (!lista) return;

  async function cargar() {
    lista.innerHTML = '<li class="estado-carga">Cargando...</li>';
    try {
      const ranking = await api.obtenerRanking();
      const maximo = Math.max(1, ...ranking.map((r) => r.votos));

      lista.innerHTML = ranking
        .map(
          (r, i) => `
          <li class="ranking__fila">
            <span class="ranking__posicion">${i + 1}</span>
            <div class="ranking__info">
              <div class="ranking__texto">
                <span>${escapar(r.icono)} ${escapar(r.nombre)}</span>
                <strong>${r.votos} ${r.votos === 1 ? 'voto' : 'votos'}</strong>
              </div>
              <div class="ranking__pista" aria-hidden="true">
                <div class="ranking__barra" data-ancho="${(r.votos / maximo) * 100}"></div>
              </div>
            </div>
          </li>`
        )
        .join('');

      // Animación de las barras: se fija el ancho en el siguiente cuadro.
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          lista.querySelectorAll('.ranking__barra').forEach((barra) => {
            barra.style.width = `${Math.max(barra.dataset.ancho, 3)}%`;
          })
        )
      );
    } catch (error) {
      lista.innerHTML = `<li>${htmlError(error.message)}</li>`;
    }
  }

  lista.addEventListener('click', (e) => e.target.closest('[data-reintentar]') && cargar());
  botonActualizar?.addEventListener('click', cargar);
  document.addEventListener('voto-registrado', cargar);
  cargar();
}

/* =============================================================
   Comparador Antes vs Ahora
   ============================================================= */

const COMPARACIONES = [
  {
    id: 'cirugia',
    titulo: 'Cirugía',
    antes: {
      icono: '🔪',
      titulo: 'Cirugía abierta',
      puntos: ['Incisiones grandes de varios centímetros', 'Más dolor y riesgo de infección', 'Recuperación de semanas']
    },
    ahora: {
      icono: '🤖',
      titulo: 'Cirugía robótica',
      puntos: ['Pequeñas incisiones de pocos milímetros', 'Visión 3D ampliada y sin temblor', 'Recuperación más rápida en muchos casos']
    }
  },
  {
    id: 'diagnostico',
    titulo: 'Diagnóstico',
    antes: {
      icono: '🩻',
      titulo: 'Radiografía revisada a ojo',
      puntos: ['Imagen en placa física', 'Depende solo de la experiencia de quien la mira', 'Resultados en días']
    },
    ahora: {
      icono: '🧠',
      titulo: 'Imagen + IA',
      puntos: ['Imágenes digitales en 3D', 'La IA señala zonas sospechosas al especialista', 'Resultados en minutos']
    }
  },
  {
    id: 'protesis',
    titulo: 'Prótesis',
    antes: {
      icono: '🪵',
      titulo: 'Prótesis rígida',
      puntos: ['Materiales pesados', 'Sin movimiento propio', 'Modelos estándar, poco personalizados']
    },
    ahora: {
      icono: '🦾',
      titulo: 'Prótesis biónica 3D',
      puntos: ['Ligera e impresa a medida', 'Se mueve con las señales de los músculos', 'Diseños abiertos y más asequibles']
    }
  }
];

function iniciarComparador() {
  const pestanas = document.getElementById('pestanas-comparador');
  const marco = document.getElementById('marco-comparador');
  const ladoAntes = document.getElementById('lado-antes');
  const ladoAhora = document.getElementById('lado-ahora');
  const linea = document.getElementById('linea-comparador');
  const rango = document.getElementById('rango-comparador');
  if (!marco || !rango) return;

  const htmlLado = (datos, etiqueta) => `
    <div class="comparador__contenido">
      <span class="comparador__etiqueta">${etiqueta}</span>
      <span class="comparador__icono" aria-hidden="true">${datos.icono}</span>
      <h3>${datos.titulo}</h3>
      <ul>${datos.puntos.map((p) => `<li>${p}</li>`).join('')}</ul>
    </div>`;

  function mostrar(indice) {
    const c = COMPARACIONES[indice];
    ladoAntes.innerHTML = htmlLado(c.antes, 'Antes');
    ladoAhora.innerHTML = htmlLado(c.ahora, 'Ahora');
    pestanas.querySelectorAll('[role="tab"]').forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === indice));
      tab.tabIndex = i === indice ? 0 : -1;
    });
    rango.setAttribute('aria-valuetext', `Comparando: ${c.antes.titulo} frente a ${c.ahora.titulo}`);
  }

  /** Mueve la división: a la izquierda "antes", a la derecha "ahora". */
  function mover(valor) {
    const v = Math.min(100, Math.max(0, Number(valor)));
    ladoAhora.style.clipPath = `inset(0 0 0 ${v}%)`;
    linea.style.left = `${v}%`;
  }

  pestanas.innerHTML = COMPARACIONES.map(
    (c, i) =>
      `<button class="chip" role="tab" id="tab-${c.id}" aria-controls="marco-comparador" data-indice="${i}">${c.titulo}</button>`
  ).join('');

  pestanas.addEventListener('click', (e) => {
    const tab = e.target.closest('[role="tab"]');
    if (tab) mostrar(Number(tab.dataset.indice));
  });

  // Navegación con flechas entre pestañas (patrón accesible de tabs)
  pestanas.addEventListener('keydown', (e) => {
    if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
    const tabs = [...pestanas.querySelectorAll('[role="tab"]')];
    const actual = tabs.indexOf(document.activeElement);
    const siguiente = (actual + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[siguiente].focus();
    mostrar(siguiente);
  });

  rango.addEventListener('input', () => mover(rango.value));

  // Arrastrar directamente sobre la imagen (ratón o dedo)
  let arrastrando = false;
  const desdePuntero = (e) => {
    const caja = marco.getBoundingClientRect();
    const valor = ((e.clientX - caja.left) / caja.width) * 100;
    rango.value = Math.round(valor);
    mover(valor);
  };
  marco.addEventListener('pointerdown', (e) => {
    arrastrando = true;
    marco.setPointerCapture(e.pointerId);
    desdePuntero(e);
  });
  marco.addEventListener('pointermove', (e) => arrastrando && desdePuntero(e));
  marco.addEventListener('pointerup', () => (arrastrando = false));
  marco.addEventListener('pointercancel', () => (arrastrando = false));

  mostrar(0);
  mover(rango.value);
}

/* =============================================================
   Línea de tiempo
   ============================================================= */

function iniciarLineaTiempo() {
  const lista = document.getElementById('lista-linea');
  if (!lista) return;

  async function cargar() {
    lista.innerHTML = '<li class="estado-carga">Cargando...</li>';
    try {
      const hitos = await api.obtenerLineaTiempo();
      lista.innerHTML = hitos
        .map(
          (h) => `
          <li class="linea__hito">
            <span class="linea__nodo" aria-hidden="true">${escapar(h.icono)}</span>
            <div class="linea__tarjeta holo-panel">
              <time class="linea__anio">${Number(h.anio)}</time>
              <h3>${escapar(h.titulo)}</h3>
              <p>${escapar(h.descripcion)}</p>
            </div>
          </li>`
        )
        .join('');
      revelar(lista.querySelectorAll('.linea__hito'));
    } catch (error) {
      lista.innerHTML = `<li>${htmlError(error.message)}</li>`;
    }
  }

  lista.addEventListener('click', (e) => e.target.closest('[data-reintentar]') && cargar());
  cargar();
}

/* =============================================================
   Suscripción (solo correo electrónico)
   ============================================================= */

// Misma regla de validación que el backend.
const PATRON_EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-zA-Z]{2,}$/;

function iniciarSuscripcion() {
  const form = document.getElementById('form-suscripcion');
  const campo = document.getElementById('email');
  const trampa = document.getElementById('website');
  const boton = document.getElementById('btn-suscribir');
  const mensaje = document.getElementById('mensaje-suscripcion');
  if (!form) return;

  const mostrarMensaje = (texto, tipo) => {
    mensaje.textContent = texto;
    mensaje.className = `suscripcion__mensaje suscripcion__mensaje--${tipo}`;
  };

  campo.addEventListener('input', () => {
    campo.removeAttribute('aria-invalid');
    mensaje.textContent = '';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // sin recargar la página

    const email = campo.value.trim();
    if (!email || email.length > 254 || !PATRON_EMAIL.test(email)) {
      campo.setAttribute('aria-invalid', 'true');
      mostrarMensaje('Escribe un correo electrónico válido, por ejemplo: nombre@dominio.com', 'error');
      campo.focus();
      return;
    }

    boton.disabled = true;
    boton.textContent = 'Enviando...';
    mostrarMensaje('', 'info');

    try {
      await api.suscribir(email, trampa.value);
      form.reset();
      form.hidden = true;
      mostrarMensaje('¡Gracias por suscribirte! Revisa tu bandeja de entrada.', 'exito');
    } catch (error) {
      mostrarMensaje(`${error.message} Intenta de nuevo.`, 'error');
    } finally {
      boton.disabled = false;
      boton.textContent = 'Suscribirme';
    }
  });
}

/* =============================================================
   Arranque
   ============================================================= */

function iniciar() {
  iniciarTema();
  iniciarMenu();
  iniciarProgreso();
  iniciarHero();
  iniciarMapaCuerpo();
  iniciarTarjetas();
  iniciarRanking();
  iniciarComparador();
  iniciarLineaTiempo();
  iniciarSuscripcion();
  revelar(document.querySelectorAll('.revelar'));

  const anio = document.getElementById('anio-actual');
  if (anio) anio.textContent = new Date().getFullYear();
}

// Los módulos se ejecutan tras analizar el HTML, pero por seguridad:
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
else iniciar();
