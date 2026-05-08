// repositorioPuntajes.js
// Capa de acceso a datos. Aisla la persistencia (archivo JSON) del resto del sistema.
// Expone operaciones de lectura y escritura atomicas para evitar corrupcion del archivo.

const fs = require('fs').promises;
const path = require('path');

const RUTA_ARCHIVO = path.join(__dirname, '..', 'datos', 'puntajes.json');

// Cola de escrituras: serializa accesos para evitar condiciones de carrera al guardar.
let cadenaEscritura = Promise.resolve();

async function leerArchivo() {
    try {
        const contenido = await fs.readFile(RUTA_ARCHIVO, 'utf8');
        const datos = JSON.parse(contenido);
        if (!Array.isArray(datos)) {
            return [];
        }
        return datos;
    } catch (error) {
        if (error.code === 'ENOENT') {
            // El archivo todavia no existe: se considera coleccion vacia.
            return [];
        }
        if (error instanceof SyntaxError) {
            console.warn('[repositorioPuntajes] Archivo corrupto, se inicializa vacio.');
            return [];
        }
        throw error;
    }
}

async function escribirArchivo(coleccion) {
    const json = JSON.stringify(coleccion, null, 2);
    await fs.writeFile(RUTA_ARCHIVO, json, 'utf8');
}

async function obtenerTodos() {
    return await leerArchivo();
}

// Reemplaza por completo la coleccion de forma serializada para evitar carreras.
function guardarTodos(coleccion) {
    cadenaEscritura = cadenaEscritura
        .catch(() => { /* errores previos no deben romper la cadena */ })
        .then(() => escribirArchivo(coleccion));
    return cadenaEscritura;
}

module.exports = {
    obtenerTodos,
    guardarTodos
};
