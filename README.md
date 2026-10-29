# 🧬 MedTech 2030 — El cuerpo humano reinventado por la tecnología

Aplicación web informativa e interactiva que muestra cómo la **inteligencia artificial**, la **impresión 3D**, la **robótica**, la **nanotecnología** y la **edición genética** están transformando la medicina.

> ⚕️ **Este sitio es solo informativo y educativo. No reemplaza la consulta con un profesional de la salud.**

🔗 **Demo:** https://medtech-2030.onrender.com _(reemplaza por tu URL de Render)_

---

## 📸 Capturas

| Inicio | Mapa del cuerpo |
| :---: | :---: |
| ![Inicio](docs/capturas/inicio.png) | ![Mapa del cuerpo](docs/capturas/mapa.png) |

| Tarjetas y ranking | Modo oscuro |
| :---: | :---: |
| ![Tarjetas](docs/capturas/tarjetas.png) | ![Modo oscuro](docs/capturas/oscuro.png) |

> Guarda tus capturas en `docs/capturas/` con esos nombres para que aparezcan aquí.

---

## ✨ Funcionalidades

- **Hero animado** con electrocardiograma y hélice de ADN en `<canvas>`.
- **Mapa interactivo del cuerpo** (SVG): cerebro, ojos, corazón, pulmones, brazos, huesos y ADN. Cada zona carga su tecnología desde la API.
- **Tarjetas de tecnologías** con botón «Me impresiona» (voto anónimo, uno por tarjeta y navegador).
- **Ranking** en vivo de las 5 tecnologías más votadas con barras animadas.
- **Antes vs Ahora**: comparador deslizable (cirugía, diagnóstico y prótesis).
- **Línea de tiempo** desde los rayos X (1895) hasta la IA médica actual.
- **Ética y retos**: privacidad, acceso desigual, errores de la IA y límites de la edición genética.
- **Suscripción opcional** solo con correo electrónico (aviso al administrador + bienvenida en HTML).
- Modo **claro/oscuro**, animaciones al hacer scroll, barra de progreso de lectura y mensajes de error con «Intenta de nuevo».
- Diseño **responsive** y **accesible** (navegación con teclado, etiquetas ARIA, respeta `prefers-reduced-motion`).

## 🔐 Privacidad

- No se pide ningún dato personal ni de salud. No hay registro ni login.
- El único dato opcional es el **correo electrónico** para la suscripción, que **no se guarda** en ningún archivo ni base de datos: solo se usa para enviar los dos correos.
- Los votos son **anónimos** y se guardan solo en la memoria del servidor (se reinician al reiniciarlo).
- `localStorage` se usa únicamente para recordar el tema elegido y por qué tarjetas ya votaste.
- **Sin cookies de rastreo** y sin servicios de analítica.

---

## 🛠️ Tecnologías

| Capa | Tecnología |
| --- | --- |
| Frontend | HTML5, CSS3, JavaScript puro (módulos ES) |
| Backend | Node.js + Express (API REST que también sirve el frontend) |
| Datos | Archivos JSON en `backend/data/` (sin base de datos) |
| Correos | Nodemailer + Gmail (contraseña de aplicación) |
| Seguridad | helmet, cors, express-rate-limit, validación de datos |
| Despliegue | GitHub + Render (plan gratuito) |

## 📁 Estructura

```
medtech-2030/
├── backend/
│   ├── server.js
│   ├── data/
│   │   ├── tecnologias.json
│   │   └── linea-tiempo.json
│   ├── routes/
│   │   ├── tecnologias.js
│   │   └── suscripcion.js
│   ├── utils/
│   │   └── mailer.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── main.js
│       ├── body-map.js
│       └── api.js
├── .gitignore
└── README.md
```

## 🔌 API

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/tecnologias` | Todas las tecnologías con sus votos |
| GET | `/api/tecnologias/:zona` | Tecnología de una zona (`cerebro`, `ojos`, `corazon`, `pulmones`, `brazos`, `huesos`, `adn`) |
| GET | `/api/linea-tiempo` | Hitos históricos ordenados por año |
| POST | `/api/tecnologias/:id/voto` | Suma un voto anónimo (límite: 30 cada 15 min por IP) |
| GET | `/api/ranking` | Las 5 tecnologías más votadas |
| POST | `/api/suscripcion` | Cuerpo `{ "email": "..." }`. Envía los correos (límite: 5 por hora por IP) |
| GET | `/api/salud` | Comprobación de estado |

---

## 🚀 Instalación local

Requisitos: **Node.js 18 o superior**.

```bash
git clone https://github.com/TU-USUARIO/medtech-2030.git
cd medtech-2030/backend
npm install
cp .env.example .env      # en Windows (PowerShell): Copy-Item .env.example .env
npm start
```

Abre **http://localhost:3000**. Para desarrollo con recarga automática: `npm run dev`.

> Sin las variables de correo la web funciona igual; solo la suscripción responderá «no disponible».

## 📧 Cómo crear la contraseña de aplicación de Gmail

1. Entra en tu Cuenta de Google → **Seguridad**.
2. Activa la **Verificación en dos pasos** (es obligatoria para este tipo de contraseñas).
3. Busca **«Contraseñas de aplicaciones»** (o ve a https://myaccount.google.com/apppasswords).
4. Escribe un nombre, por ejemplo `MedTech 2030`, y pulsa **Crear**.
5. Copia la contraseña de **16 caracteres** y pégala en `EMAIL_PASS` **sin espacios**.
6. Nunca uses la contraseña normal de tu cuenta ni la subas a GitHub.

## ⚙️ Variables de entorno

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `EMAIL_USER` | Sí (para correos) | Cuenta de Gmail que envía los correos |
| `EMAIL_PASS` | Sí (para correos) | Contraseña de aplicación de Gmail |
| `EMAIL_DESTINO` | Sí (para correos) | Dónde recibes el aviso de cada nuevo suscriptor |
| `PORT` | No | Puerto local (por defecto `3000`; Render lo asigna solo) |
| `NODE_ENV` | No | `production` en Render |
| `CORS_ORIGIN` | No | Solo si el frontend se aloja en otro dominio |

---

## 🐙 Subir a GitHub

1. Crea un repositorio vacío llamado `medtech-2030` en https://github.com/new (sin README ni .gitignore).
2. En la carpeta raíz del proyecto (`medtech-2030/`):

```bash
git init
git add .
git commit -m "Primera versión de MedTech 2030"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/medtech-2030.git
git push -u origin main
```

Antes del commit, comprueba con `git status` que **no aparece** `backend/.env`.

## ☁️ Publicar en Render (plan gratuito)

1. Entra en https://render.com e inicia sesión con GitHub.
2. **New → Web Service** y elige el repositorio `medtech-2030`.
3. Configura:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
4. En **Environment → Add Environment Variable** añade `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_DESTINO` y `NODE_ENV=production`.
5. (Opcional) En **Settings → Health Check Path** escribe `/api/salud`.
6. Pulsa **Create Web Service**. Cuando termine, tu web estará en `https://medtech-2030.onrender.com` (o similar).
7. Cada `git push` a `main` vuelve a desplegar la app automáticamente.

> En el plan gratuito el servicio «se duerme» tras un rato sin visitas: la primera carga puede tardar unos segundos y los votos (en memoria) se reinician.

---

## 📬 Contacto

tucorreo@ejemplo.com

## 📄 Licencia

MIT. Contenido con fines educativos.
