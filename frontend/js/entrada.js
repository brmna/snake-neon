// entrada.js
// Captura las entradas del usuario (teclado y tactil) y las traduce en eventos
// del juego mediante un patron observador. El juego se suscribe a las acciones.

import { DIRECCIONES } from './serpiente.js';

const MAPA_TECLAS = {
    'ArrowUp': 'arriba',
    'ArrowDown': 'abajo',
    'ArrowLeft': 'izquierda',
    'ArrowRight': 'derecha',
    'KeyW': 'arriba',
    'KeyS': 'abajo',
    'KeyA': 'izquierda',
    'KeyD': 'derecha',
    'KeyP': 'pausa',
    'Escape': 'pausa'
};

const NOMBRE_A_DIRECCION = {
    arriba: DIRECCIONES.ARRIBA,
    abajo: DIRECCIONES.ABAJO,
    izquierda: DIRECCIONES.IZQUIERDA,
    derecha: DIRECCIONES.DERECHA
};

export class GestorEntrada {
    constructor() {
        this.suscriptoresDireccion = [];
        this.suscriptoresPausa = [];
        this.activo = false;

        this._manejarTecla = this._manejarTecla.bind(this);
        this._manejarBotonTactil = this._manejarBotonTactil.bind(this);
    }

    activar(elementoControlesTactiles) {
        if (this.activo) return;
        document.addEventListener('keydown', this._manejarTecla);

        if (elementoControlesTactiles) {
            const botones = elementoControlesTactiles.querySelectorAll('[data-direccion]');
            botones.forEach((boton) => {
                boton.addEventListener('click', this._manejarBotonTactil);
                // touchstart adicional para mejor respuesta en movil.
                boton.addEventListener('touchstart', (evento) => {
                    evento.preventDefault();
                    this._manejarBotonTactil(evento);
                }, { passive: false });
            });
        }

        this._inicializarGestosDeslizar();
        this.activo = true;
    }

    desactivar() {
        document.removeEventListener('keydown', this._manejarTecla);
        this.activo = false;
    }

    alSolicitarDireccion(callback) {
        this.suscriptoresDireccion.push(callback);
    }

    alSolicitarPausa(callback) {
        this.suscriptoresPausa.push(callback);
    }

    _emitirDireccion(direccion) {
        this.suscriptoresDireccion.forEach((cb) => cb(direccion));
    }

    _emitirPausa() {
        this.suscriptoresPausa.forEach((cb) => cb());
    }

    _manejarTecla(evento) {
        // Si el foco esta en un campo editable (input, textarea, contenteditable),
        // no interceptamos la tecla: el usuario esta escribiendo (por ejemplo, su nombre).
        if (this._focoEnElementoEditable()) return;

        const accion = MAPA_TECLAS[evento.code];
        if (!accion) return;
        evento.preventDefault();
        if (accion === 'pausa') {
            this._emitirPausa();
        } else {
            this._emitirDireccion(NOMBRE_A_DIRECCION[accion]);
        }
    }

    _focoEnElementoEditable() {
        const activo = document.activeElement;
        if (!activo) return false;
        const etiqueta = activo.tagName;
        if (etiqueta === 'INPUT' || etiqueta === 'TEXTAREA' || etiqueta === 'SELECT') {
            return true;
        }
        if (activo.isContentEditable) return true;
        return false;
    }

    _manejarBotonTactil(evento) {
        const boton = evento.currentTarget;
        if (!boton) return;
        const nombre = boton.getAttribute('data-direccion');
        const direccion = NOMBRE_A_DIRECCION[nombre];
        if (direccion) {
            this._emitirDireccion(direccion);
        }
    }

    /**
     * Permite controlar el juego deslizando el dedo sobre el tablero.
     */
    _inicializarGestosDeslizar() {
        const lienzo = document.getElementById('lienzoJuego');
        if (!lienzo) return;

        let inicioX = 0;
        let inicioY = 0;
        let activo = false;

        const UMBRAL = 24;

        lienzo.addEventListener('touchstart', (evento) => {
            const t = evento.touches[0];
            inicioX = t.clientX;
            inicioY = t.clientY;
            activo = true;
        }, { passive: true });

        lienzo.addEventListener('touchmove', (evento) => {
            if (!activo) return;
            const t = evento.touches[0];
            const dx = t.clientX - inicioX;
            const dy = t.clientY - inicioY;
            if (Math.abs(dx) < UMBRAL && Math.abs(dy) < UMBRAL) return;

            if (Math.abs(dx) > Math.abs(dy)) {
                this._emitirDireccion(dx > 0 ? DIRECCIONES.DERECHA : DIRECCIONES.IZQUIERDA);
            } else {
                this._emitirDireccion(dy > 0 ? DIRECCIONES.ABAJO : DIRECCIONES.ARRIBA);
            }
            activo = false;
        }, { passive: true });

        lienzo.addEventListener('touchend', () => { activo = false; }, { passive: true });
    }
}
