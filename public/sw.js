// Service worker de PediatriTrack Global.
//
// Lo dejé sencillo a propósito para que nunca se quede una versión vieja:
// - Las páginas siempre se piden primero a internet; si no hay conexión,
//   se abre la última copia guardada.
// - Los archivos de la app (JS, fuentes, imágenes) se guardan la primera
//   vez que se usan, así la siguiente vez abre más rápido.
// - Lo de Firebase y Gemini (datos del bebé, respuestas de Pedi) NO se
//   guarda aquí: siempre va directo a internet.

const VERSION = "pediatritrack-v1";
const PAGINA_INICIO = "/";

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll([PAGINA_INICIO, "/manifest.json"]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  // borro las copias de versiones anteriores
  evento.waitUntil(
    caches
      .keys()
      .then((nombres) => Promise.all(nombres.filter((n) => n !== VERSION).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;
  if (peticion.method !== "GET") return;

  const url = new URL(peticion.url);
  // solo manejo archivos de la propia app; Firebase, Gemini, etc. pasan directo
  if (url.origin !== self.location.origin) return;

  // páginas: primero internet, si no hay, la copia guardada
  if (peticion.mode === "navigate") {
    evento.respondWith(
      fetch(peticion)
        .then((respuesta) => {
          const copia = respuesta.clone();
          caches.open(VERSION).then((cache) => cache.put(PAGINA_INICIO, copia));
          return respuesta;
        })
        .catch(() => caches.match(PAGINA_INICIO))
    );
    return;
  }

  // archivos de la app: si ya los tengo, los uso; si no, los bajo y los guardo
  if (/\.(js|css|ttf|otf|woff2?|png|jpg|jpeg|svg|ico|json)$/i.test(url.pathname)) {
    evento.respondWith(
      caches.match(peticion).then(
        (guardado) =>
          guardado ||
          fetch(peticion).then((respuesta) => {
            if (respuesta.ok) {
              const copia = respuesta.clone();
              caches.open(VERSION).then((cache) => cache.put(peticion, copia));
            }
            return respuesta;
          })
      )
    );
  }
});
