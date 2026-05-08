// interfaz.js
// Coordina las pantallas (menu, juego, tabla) y los elementos de UI no relacionados
// directamente con el lienzo: marcadores, mensajes y formulario.

import { obtenerPuntajes } from './api.js';
import { formatearFecha, mismoJugador } from './utilidades.js';

export class Interfaz {
    constructor() {
        // Pantallas
        this.pantallaMenu  = document.getElementById('pantallaMenu');
        this.pantallaJuego = document.getElementById('pantallaJuego');
        this.pantallaTabla = document.getElementById('pantallaTabla');

        // Indicadores
        this.valorPuntaje    = document.getElementById('valorPuntaje');
        this.valorRecord     = document.getElementById('valorRecord');
        this.valorVelocidad  = document.getElementById('valorVelocidad');

        // Superposiciones
        this.supPausa = document.getElementById('superposicionPausa');
        this.supFin   = document.getElementById('superposicionFin');
        this.txtPuntajeFinal = document.getElementById('textoPuntajeFinal');
        this.txtMejorPuntaje = document.getElementById('textoMejorPuntaje');

        // Formulario
        this.formularioJugador  = document.getElementById('formularioJugador');
        this.campoNombre        = document.getElementById('campoNombre');
        this.mensajeValidacion  = document.getElementById('mensajeValidacion');

        // Tabla de posiciones
        this.cuerpoTabla = document.getElementById('cuerpoTablaPosiciones');

        // Sacudida del lienzo
        this.contenedorLienzo = document.querySelector('.contenedor-lienzo');
    }

    mostrarPantalla(nombre) {
        const todas = [this.pantallaMenu, this.pantallaJuego, this.pantallaTabla];
        todas.forEach((p) => p && p.classList.remove('activa'));
        const objetivo = {
            menu: this.pantallaMenu,
            juego: this.pantallaJuego,
            tabla: this.pantallaTabla
        }[nombre];
        if (objetivo) objetivo.classList.add('activa');
    }

    actualizarMarcador({ puntaje, record, velocidad }) {
        if (puntaje !== undefined && this.valorPuntaje) {
            this.valorPuntaje.textContent = String(puntaje);
        }
        if (record !== undefined && this.valorRecord) {
            this.valorRecord.textContent = String(record);
        }
        if (velocidad !== undefined && this.valorVelocidad) {
            this.valorVelocidad.textContent = String(velocidad);
        }
    }

    mostrarPausa(visible) {
        if (!this.supPausa) return;
        this.supPausa.classList.toggle('oculto', !visible);
    }

    mostrarFinDeJuego({ puntaje, mensajeMejor }) {
        if (!this.supFin) return;
        if (this.txtPuntajeFinal) this.txtPuntajeFinal.textContent = String(puntaje);
        if (this.txtMejorPuntaje) this.txtMejorPuntaje.textContent = mensajeMejor || '';
        this.supFin.classList.remove('oculto');
    }

    ocultarFinDeJuego() {
        if (this.supFin) this.supFin.classList.add('oculto');
    }

    establecerError(mensaje) {
        if (!this.mensajeValidacion) return;
        this.mensajeValidacion.textContent = mensaje || '';
        if (this.campoNombre) {
            this.campoNombre.classList.toggle('invalido', Boolean(mensaje));
        }
    }

    obtenerNombreIngresado() {
        return (this.campoNombre && this.campoNombre.value) || '';
    }

    aplicarSacudida(duracionMs = 320) {
        if (!this.contenedorLienzo) return;
        this.contenedorLienzo.classList.add('sacudida');
        setTimeout(() => this.contenedorLienzo.classList.remove('sacudida'), duracionMs);
    }

    /**
     * Solicita la tabla al backend y la pinta. Resalta al jugador actual si aplica.
     */
    async cargarTablaDePosiciones(jugadorActual = '') {
        if (!this.cuerpoTabla) return;
        this.cuerpoTabla.innerHTML = `<tr><td colspan="4" class="celda-vacia">Cargando...</td></tr>`;

        let datos;
        try {
            datos = await obtenerPuntajes(10);
        } catch (error) {
            this.cuerpoTabla.innerHTML = `
                <tr><td colspan="4" class="celda-vacia">
                    No se pudo cargar la tabla. Verifica que el servidor este corriendo.
                </td></tr>`;
            return;
        }

        if (!Array.isArray(datos) || datos.length === 0) {
            this.cuerpoTabla.innerHTML = `<tr><td colspan="4" class="celda-vacia">Aun no hay puntajes registrados</td></tr>`;
            return;
        }

        const filas = datos.map((registro, indice) => {
            const rango = indice + 1;
            const claseFila = [];
            if (rango <= 3) claseFila.push(`fila-podio-${rango}`);
            if (jugadorActual && mismoJugador(registro.jugador, jugadorActual)) {
                claseFila.push('fila-actual');
            }
            return `
                <tr class="${claseFila.join(' ')}">
                    <td class="col-rango">${rango}</td>
                    <td class="col-jugador">${this._escaparHtml(registro.jugador)}</td>
                    <td class="col-puntaje">${registro.puntaje}</td>
                    <td class="col-fecha">${this._escaparHtml(formatearFecha(registro.fecha))}</td>
                </tr>`;
        }).join('');

        this.cuerpoTabla.innerHTML = filas;
    }

    _escaparHtml(texto) {
        return String(texto)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}
