// serpiente.js
// Modelo de la serpiente: posiciones de cuadricula, direcciones y crecimiento.
// La logica es independiente del renderizador para poder testearse y reutilizarse.

import { celdasIguales } from './utilidades.js';

export const DIRECCIONES = Object.freeze({
    ARRIBA:    { x:  0, y: -1, nombre: 'arriba' },
    ABAJO:     { x:  0, y:  1, nombre: 'abajo' },
    IZQUIERDA: { x: -1, y:  0, nombre: 'izquierda' },
    DERECHA:   { x:  1, y:  0, nombre: 'derecha' }
});

/**
 * Indica si dos direcciones son opuestas (no se permite invertir 180 grados).
 */
export function direccionesOpuestas(a, b) {
    if (!a || !b) return false;
    return a.x === -b.x && a.y === -b.y && (a.x !== 0 || a.y !== 0);
}

export class Serpiente {
    /**
     * @param {{x:number, y:number}} posicionInicial Centro inicial.
     * @param {number} longitudInicial
     * @param {{x:number, y:number, nombre:string}} direccionInicial
     */
    constructor(posicionInicial, longitudInicial = 4, direccionInicial = DIRECCIONES.DERECHA) {
        this.direccion = direccionInicial;
        this.direccionPendiente = direccionInicial;
        // El primer elemento del arreglo es la cabeza.
        this.cuerpo = [];
        for (let i = 0; i < longitudInicial; i++) {
            this.cuerpo.push({
                x: posicionInicial.x - i * direccionInicial.x,
                y: posicionInicial.y - i * direccionInicial.y
            });
        }
        this.crecimientoPendiente = 0;
        this.posicionAnteriorCola = { ...this.cuerpo[this.cuerpo.length - 1] };
    }

    obtenerCabeza() {
        return this.cuerpo[0];
    }

    obtenerCuerpo() {
        return this.cuerpo;
    }

    /**
     * Solicita un cambio de direccion. Se valida que no sea opuesta a la actual.
     * El cambio se aplica en la siguiente iteracion para evitar autocolisiones inmediatas.
     */
    establecerDireccion(nuevaDireccion) {
        if (!nuevaDireccion) return;
        if (direccionesOpuestas(nuevaDireccion, this.direccion)) return;
        this.direccionPendiente = nuevaDireccion;
    }

    /**
     * Avanza un paso en la cuadricula segun la direccion pendiente.
     * Retorna la nueva posicion de la cabeza.
     */
    avanzar() {
        this.direccion = this.direccionPendiente;
        const cabeza = this.cuerpo[0];
        const nuevaCabeza = {
            x: cabeza.x + this.direccion.x,
            y: cabeza.y + this.direccion.y
        };
        this.cuerpo.unshift(nuevaCabeza);
        if (this.crecimientoPendiente > 0) {
            this.crecimientoPendiente -= 1;
        } else {
            this.posicionAnteriorCola = this.cuerpo.pop();
        }
        return nuevaCabeza;
    }

    /**
     * Marca a la serpiente para crecer un segmento adicional en el siguiente avance
     * (se difiere el crecimiento real al siguiente tick para mantener la fluidez).
     */
    crecer(cantidad = 1) {
        this.crecimientoPendiente += cantidad;
    }

    /**
     * Verifica si la cabeza colisiona con el cuerpo.
     */
    chocaConsigoMisma() {
        const cabeza = this.cuerpo[0];
        for (let i = 1; i < this.cuerpo.length; i++) {
            if (celdasIguales(cabeza, this.cuerpo[i])) return true;
        }
        return false;
    }

    /**
     * Indica si una celda dada esta ocupada por algun segmento de la serpiente.
     */
    ocupaCelda(celda) {
        return this.cuerpo.some((seg) => celdasIguales(seg, celda));
    }

    longitud() {
        return this.cuerpo.length;
    }
}
