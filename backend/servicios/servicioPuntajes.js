// servicioPuntajes.js
// Capa de logica de negocio para los puntajes.
// Valida entradas, aplica la regla de "mejor puntaje por jugador" y ordena el listado.

const repositorioPuntajes = require('../repositorios/repositorioPuntajes');

const REGEX_NOMBRE = /^[A-Za-z0-9_-]{3,15}$/;
const PUNTAJE_MAXIMO = 1_000_000;

function crearErrorValidacion(mensaje) {
    const error = new Error(mensaje);
    error.tipo = 'VALIDACION';
    return error;
}

function fechaHoy() {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
}

function ordenarDescendente(coleccion) {
    return [...coleccion].sort((a, b) => {
        if (b.puntaje !== a.puntaje) {
            return b.puntaje - a.puntaje;
        }
        // En empate, gana el registro con fecha mas reciente.
        return String(b.fecha).localeCompare(String(a.fecha));
    });
}

async function obtenerPuntajes(limite = null) {
    const todos = await repositorioPuntajes.obtenerTodos();
    const ordenados = ordenarDescendente(todos);
    if (limite && Number.isInteger(limite) && limite > 0) {
        return ordenados.slice(0, limite);
    }
    return ordenados;
}

function validarNombre(nombre) {
    if (typeof nombre !== 'string') {
        throw crearErrorValidacion('El nombre del jugador es obligatorio');
    }
    const limpio = nombre.trim();
    if (!REGEX_NOMBRE.test(limpio)) {
        throw crearErrorValidacion(
            'El nombre debe tener entre 3 y 15 caracteres y solo letras, numeros, guiones o guiones bajos'
        );
    }
    return limpio;
}

function validarPuntaje(puntaje) {
    const valor = Number(puntaje);
    if (!Number.isFinite(valor) || !Number.isInteger(valor)) {
        throw crearErrorValidacion('El puntaje debe ser un numero entero');
    }
    if (valor < 0 || valor > PUNTAJE_MAXIMO) {
        throw crearErrorValidacion(`El puntaje debe estar entre 0 y ${PUNTAJE_MAXIMO}`);
    }
    return valor;
}

async function registrarPuntaje(nombreCrudo, puntajeCrudo) {
    const jugador = validarNombre(nombreCrudo);
    const puntaje = validarPuntaje(puntajeCrudo);

    const todos = await repositorioPuntajes.obtenerTodos();
    const indiceExistente = todos.findIndex(
        (registro) => registro.jugador.toLowerCase() === jugador.toLowerCase()
    );

    let actualizado = false;
    let registroFinal;

    if (indiceExistente >= 0) {
        const existente = todos[indiceExistente];
        if (puntaje > existente.puntaje) {
            registroFinal = {
                jugador: existente.jugador,
                puntaje,
                fecha: fechaHoy()
            };
            todos[indiceExistente] = registroFinal;
            actualizado = true;
        } else {
            // El nuevo puntaje no supera al historico: se conserva el mejor.
            registroFinal = existente;
        }
    } else {
        registroFinal = {
            jugador,
            puntaje,
            fecha: fechaHoy()
        };
        todos.push(registroFinal);
        actualizado = true;
    }

    if (actualizado) {
        await repositorioPuntajes.guardarTodos(todos);
    }

    return {
        registro: registroFinal,
        actualizado
    };
}

module.exports = {
    obtenerPuntajes,
    registrarPuntaje,
    // Exportados para pruebas o uso interno avanzado:
    _validarNombre: validarNombre,
    _validarPuntaje: validarPuntaje
};
