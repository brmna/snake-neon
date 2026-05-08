// api.js
// Cliente HTTP para comunicarse con el backend.
// Todos los metodos retornan promesas y lanzan errores enriquecidos en caso de fallo.

const URL_BASE = (() => {
  // Si se sirve el frontend desde el backend, usamos la misma origen.
  // Si se abre como archivo local (file://), apuntamos al servidor en localhost:3000.
  if (typeof window === "undefined") return "";
  if (window.location.protocol === "file:") {
    return "http://localhost:3000";
  }
  return "";
})();

async function ejecutarPeticion(ruta, opciones = {}) {
  const url = `${URL_BASE}${ruta}`;
  let respuesta;
  try {
    respuesta = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(opciones.headers || {}),
      },
      ...opciones,
    });
  } catch (error) {
    const errorRed = new Error("No se pudo conectar con el servidor");
    errorRed.causa = error;
    errorRed.tipo = "RED";
    throw errorRed;
  }

  let cuerpo = null;
  const contenido = respuesta.headers.get("content-type") || "";
  if (contenido.includes("application/json")) {
    cuerpo = await respuesta.json().catch(() => null);
  }

  if (!respuesta.ok) {
    const error = new Error(
      (cuerpo && cuerpo.error) ||
        `Error ${respuesta.status} al consultar ${ruta}`,
    );
    error.estado = respuesta.status;
    error.cuerpo = cuerpo;
    throw error;
  }

  return cuerpo;
}

/**
 * Obtiene la lista de puntajes ordenada descendentemente.
 * @param {number|null} limite Limite opcional (por ejemplo, 10 para top 10).
 */
export async function obtenerPuntajes(limite = null) {
  const consulta = limite ? `?limite=${encodeURIComponent(limite)}` : "";
  return await ejecutarPeticion(`/api/puntajes${consulta}`, { method: "GET" });
}

/**
 * Registra (o actualiza) el mejor puntaje de un jugador.
 * @param {string} jugador
 * @param {number} puntaje
 */
export async function registrarPuntaje(jugador, puntaje) {
  return await ejecutarPeticion("/api/puntajes", {
    method: "POST",
    body: JSON.stringify({ jugador, puntaje }),
  });
}

/**
 * Comprueba el estado del servidor.
 */
export async function consultarSalud() {
  return await ejecutarPeticion("/api/salud", { method: "GET" });
}
