// Service worker mínimo: solo habilita la instalación como PWA.
// No cachea nada agresivamente, así siempre ves la última versión.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
