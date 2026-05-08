// comida.js
// Modelo de la comida: posicion en cuadricula y logica de aparicion aleatoria
// evitando que se superponga con la serpiente.

import { aleatorioEntero } from './utilidades.js';

export class Comida {
    /**
     * @param {number} columnas
     * @param {number} filas
     */
    constructor(columnas, filas) {
        this.columnas = columnas;
        this.filas = filas;
        this.posicion = { x: 0, y: 0 };
    }

    /**
     * Selecciona una nueva posicion aleatoria dentro de la cuadricula
     * que no este ocupada por la serpiente.
     * Si la serpiente ocupa todo el tablero (caso teorico), devuelve null.
     */
    reubicar(serpiente) {
        const totalCeldas = this.columnas * this.filas;
        if (serpiente && serpiente.longitud() >= totalCeldas) {
            this.posicion = null;
            return null;
        }

        // Estrategia: hasta 200 intentos aleatorios; si falla, recorre celdas libres.
        for (let intento = 0; intento < 200; intento++) {
            const candidata = {
                x: aleatorioEntero(0, this.columnas - 1),
                y: aleatorioEntero(0, this.filas - 1)
            };
            if (!serpiente || !serpiente.ocupaCelda(candidata)) {
                this.posicion = candidata;
                return candidata;
            }
        }

        // Fallback determinista: primera celda libre encontrada.
        for (let y = 0; y < this.filas; y++) {
            for (let x = 0; x < this.columnas; x++) {
                const celda = { x, y };
                if (!serpiente.ocupaCelda(celda)) {
                    this.posicion = celda;
                    return celda;
                }
            }
        }
        this.posicion = null;
        return null;
    }

    obtenerPosicion() {
        return this.posicion;
    }
}
