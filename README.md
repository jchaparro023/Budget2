# Presupuesto — despliegue en Vercel

## Paso 1: sube este proyecto a GitHub
1. Crea una cuenta en https://github.com (si no tienes).
2. Crea un repositorio nuevo, por ejemplo `presupuesto-app`.
3. Sube todo el contenido de esta carpeta al repositorio (arrastrando los
   archivos en la web de GitHub con "Add file → Upload files", o con git
   si lo prefieres).

## Paso 2: conéctalo a Vercel
1. Crea una cuenta en https://vercel.com (puedes entrar directo con tu
   cuenta de GitHub).
2. Click en "Add New… → Project".
3. Elige el repositorio `presupuesto-app` que acabas de subir.
4. Vercel detecta automáticamente que es un proyecto Vite — no necesitas
   cambiar ninguna configuración. Click en "Deploy".
5. En 1-2 minutos te da una URL tipo `presupuesto-app.vercel.app`.

## Paso 3: instálala en tu celular
1. Abre esa URL en Chrome (Android) o Safari (iPhone).
2. Android: menú ⋮ → "Instalar app" (o "Agregar a pantalla principal").
   iPhone: botón compartir → "Agregar a pantalla de inicio".
3. Te queda un ícono como cualquier app instalada.

## Notas
- Los datos se guardan en el navegador de cada dispositivo (localStorage).
  Esto significa que el celular y el PC NO comparten los mismos datos
  automáticamente — cada instalación tiene su propio libro. Si más
  adelante quieres que los datos se sincronicen entre dispositivos o se
  compartan con otras personas, el siguiente paso es agregar una base de
  datos real (Supabase o Firebase son las opciones más simples) — te
  puedo ayudar con eso cuando quieras dar ese paso.
- Cada vez que quieras actualizar la app, solo subes los cambios al
  repositorio de GitHub y Vercel la vuelve a publicar sola.
