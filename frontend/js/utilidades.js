// utilidades.js
// Funciones auxiliares puras reutilizables en todos los modulos del frontend.

/**
 * Genera un numero entero pseudoaleatorio en el rango [minimo, maximo].
 */
export function aleatorioEntero(minimo, maximo) {
    return Math.floor(Math.random() * (maximo - minimo + 1)) + minimo;
}

/**
 * Genera un nombre de invitado al estilo "Invitado-1234".
 */
export function generarNombreInvitado() {
    const sufijo = aleatorioEntero(1000, 9999);
    return `Invitado-${sufijo}`;
}

/**
 * Verifica si un nombre de jugador cumple el formato esperado.
 * 3-15 caracteres, letras, numeros, guiones y guiones bajos.
 */
export function nombreEsValido(nombre) {
    if (typeof nombre !== 'string') return false;
    return /^[A-Za-z0-9_-]{3,15}$/.test(nombre.trim());
}

/**
 * Limita un valor entre un minimo y un maximo.
 */
export function limitar(valor, minimo, maximo) {
    return Math.max(minimo, Math.min(maximo, valor));
}

/**
 * Compara igualdad de coordenadas de cuadricula.
 */
export function celdasIguales(a, b) {
    return a && b && a.x === b.x && a.y === b.y;
}

/**
 * Formatea una fecha ISO (YYYY-MM-DD) o Date a formato español "DD/MM/AAAA".
 */
export function formatearFecha(valor) {
    if (!valor) return '';

    let fecha = null;

    if (valor instanceof Date) {
        fecha = valor;
    } else if (typeof valor === 'string') {
        // Acepta formatos ISO yyyy-mm-dd o instancias de fecha largas.
        const iso = valor.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (iso) {
            fecha = new Date(`${iso[1]}-${iso[2]}-${iso[3]}`);
        } else {
            const parseada = new Date(valor);
            if (!Number.isNaN(parseada.getTime())) {
                fecha = parseada;
            }
        }
    }

    if (!fecha || Number.isNaN(fecha.getTime())) {
        return '';
    }

    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

/**
 * Comparacion case-insensitive de nombres de jugador.
 */
export function mismoJugador(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    return a.trim().toLowerCase() === b.trim().toLowerCase();
}
