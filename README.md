# Gestión de Tareas

Aplicación web (PWA) para gestionar tareas personales, **pensada para el móvil** (se instala en la pantalla de inicio; en escritorio también funciona). El objetivo final es crearlas **por voz o por texto**: una IA convertirá lo que digas en tareas con fecha, hora y prioridad, y tú confirmarás un borrador antes de guardar.

## Estado del proyecto

| Fase | Contenido | Estado |
|---|---|---|
| 1 | Proyecto React + Vite + PWA, Supabase, login, tablero Kanban con CRUD manual | ✅ Hecha |
| 2 | Grabación de audio, transcripción, extracción con IA y pantalla de borrador | ⏳ Pendiente |
| 3 | Recordatorios con Web Push y resumen diario | ⏳ Pendiente |
| 4 | Pulido, pruebas y despliegue | ⏳ Pendiente |

### Qué incluye la Fase 1

- Inicio de sesión con **enlace mágico**, **correo y contraseña** y **Google**.
- **Tablero Kanban** (Pendiente · En curso · Hecha) con arrastrar y soltar (táctil, ratón y teclado).
- Crear, editar y eliminar tareas: campo rápido abajo y formulario completo (título, descripción, fecha, hora, prioridad, estado).
- **Sincronización en tiempo real** entre dispositivos (Supabase Realtime).
- Cada usuario ve **solo sus tareas** (Row Level Security).
- Tema oscuro, accesible y PWA instalable. Diseño móvil primero (ver más abajo).
- Ajustes: nombre y zona horaria (se detecta la del dispositivo la primera vez).

## Requisitos

- Node.js 20 o superior
- Una cuenta gratuita en [Supabase](https://supabase.com)

## Puesta en marcha

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear el proyecto de Supabase

1. En el panel de Supabase, crea un proyecto nuevo.
2. Ve a **Project Settings → API** y copia la **Project URL** y la clave **anon public**.
3. Copia `.env.example` como `.env.local` y rellena los dos valores:

```bash
cp .env.example .env.local
```

### 3. Aplicar las migraciones

Opción A — con la CLI de Supabase (recomendada):

```bash
npx supabase login
npx supabase link --project-ref TU-REFERENCIA   # la ves en la URL del panel
npx supabase db push
```

Opción B — a mano: abre **SQL Editor** en el panel y ejecuta, en orden, el contenido de:

1. `supabase/migrations/0001_perfiles.sql`
2. `supabase/migrations/0002_tareas_capturas.sql`

### 4. Configurar la autenticación

En **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:5173` (en producción, la URL de tu web).
- **Redirect URLs**: añade `http://localhost:5173` y la URL de producción.

En **Authentication → Providers**:

- **Email**: activado por defecto (enlace mágico y contraseña).
- **Google**: créate unas credenciales OAuth en [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (tipo «ID de cliente de OAuth», aplicación web). Como *URI de redirección autorizado* pon la que te muestra Supabase en la pantalla del proveedor (`https://TU-PROYECTO.supabase.co/auth/v1/callback`). Pega el *Client ID* y el *Client Secret* en Supabase y activa el proveedor.

### 5. Arrancar

```bash
npm run dev
```

Abre <http://localhost:5173>. Si faltan las variables de entorno, verás una pantalla que te lo indica.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Comprueba tipos y genera la versión de producción en `dist/` (incluye el service worker) |
| `npm run preview` | Sirve `dist/` localmente |
| `npm run typecheck` | Solo comprobación de tipos |
| `npm test` | Tests unitarios (Vitest) |

## Estructura

```
src/
  features/
    auth/        Login, sesión y traducción de errores
    tablero/     Kanban (columnas, tarjetas, arrastrar y soltar, barra rápida)
    tareas/      Hook de datos (CRUD + Realtime), diálogo de tarea, lógica pura
    ajustes/     Perfil del usuario y pantalla de ajustes
  components/    Modal, cabecera, pantalla de configuración faltante
  lib/           Cliente Supabase, tipos, fechas y orden fraccionario
  styles/        tokens.css (colores y medidas) y global.css
  sw.ts          Service worker (PWA)
supabase/
  migrations/    SQL: perfiles, tareas, capturas, políticas RLS
tests/           Pruebas unitarias
```

## Personalizar la marca

- **Color de acento**: edita `--acento` y `--acento-texto` en `src/styles/tokens.css`.
- **Logo**: reemplaza `public/logo.svg` y `public/favicon.svg`, y los iconos de `public/icons/` (192, 512 y maskable 512; el apple-touch-icon de 180). Los actuales son **provisionales**.
- **Tipografía**: Inter (paquete `@fontsource-variable/inter`).

## Diseño móvil

- **Una columna a la vez**: se desliza en horizontal (con la siguiente asomando) o se salta con las pestañas de arriba. En pantallas ≥ 900 px se ven las tres a la vez.
- **Arrastrar con el dedo**: se agarra la tarjeta por el asa (⋮⋮), así no choca con el scroll. Al acercar el dedo al borde, el tablero se desplaza solo. El destino lo marca la posición del dedo.
- **Otra forma de mover**: tocar la tarjeta y cambiar su *Estado* en el detalle.
- **Hoja inferior**: el detalle y la nueva tarea se abren como una hoja desde abajo, al alcance del pulgar.
- **Dianas táctiles** de al menos 44 px y campos a 16 px (iOS no hace zoom al escribir).
- **Pantalla completa**: respeta el notch y la barra del sistema (`safe-area`); `viewport-fit=cover` e `interactive-widget=resizes-content` para que el teclado no tape el contenido en Android.
- En iPhone la instalación es manual: *Compartir → Añadir a pantalla de inicio* (iOS 16.4+ para las notificaciones de la Fase 3).

## Notas de diseño

- **Orden en el tablero**: cada tarea tiene un número `orden` y al arrastrar se calcula el punto medio entre sus vecinos, así solo se actualiza una fila. Si dos vecinos quedan demasiado juntos, la columna se reindexa (`src/lib/orden.ts`).
- **Fecha y hora** de una tarea se guardan «locales» (sin zona). Para decidir si está vencida o es «hoy» se usa la zona horaria del perfil.
- **Seguridad**: todas las tablas tienen RLS por `user_id`. En el navegador solo viven la URL y la clave *anon* de Supabase; las claves secretas (OpenAI, Anthropic, VAPID) irán únicamente como secretos de las Edge Functions en las fases siguientes.
- **Siempre online**: el service worker cachea la aplicación, no los datos.
