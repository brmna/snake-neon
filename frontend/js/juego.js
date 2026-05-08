// juego.js
// Punto de entrada y orquestador del juego.
// Coordina serpiente, comida, entrada, renderizador, interfaz, sonido y API.

import { Serpiente, DIRECCIONES } from './serpiente.js';
import { Comida } from './comida.js';
import { GestorEntrada } from './entrada.js';
import { Renderizador } from './renderizador.js';
import { Interfaz } from './interfaz.js';
import { sonido } from './sonido.js';
import { registrarPuntaje, obtenerPuntajes } from './api.js';
import {
    nombreEsValido,
    generarNombreInvitado,
    celdasIguales,
    mismoJugador
} from './utilidades.js';

// ---------- Configuracion del juego ----------
const CONFIG = Object.freeze({
    columnas: 24,
    filas: 24,
    intervaloInicialMs: 140,    // velocidad inicial entre pasos (ms)
    intervaloMinimoMs: 60,      // velocidad maxima alcanzable
    decrementoPorComida: 4,     // cuanto se reduce el intervalo por cada comida
    puntosPorComida: 10,
    longitudInicial: 4
});

const ESTADOS = Object.freeze({
    INACTIVO:  'inactivo',
    JUGANDO:   'jugando',
    PAUSADO:   'pausado',
    TERMINADO: 'terminado'
});

class JuegoSnake {
    constructor() {
        this.lienzo = document.getElementById('lienzoJuego');
        this.interfaz = new Interfaz();
        this.entrada = new GestorEntrada();
        this.renderizador = new Renderizador(this.lienzo, {
            columnas: CONFIG.columnas,
            filas: CONFIG.filas
        });

        this.serpiente = null;
        this.comida = new Comida(CONFIG.columnas, CONFIG.filas);

        this.estado = ESTADOS.INACTIVO;
        this.puntaje = 0;
        this.record = this._cargarRecordLocal();
        this.intervaloMs = CONFIG.intervaloInicialMs;
        this.acumulador = 0;
        this.tiempoAnterior = 0;

        this.jugadorActual = '';
        this.identificadorAnimacion = null;

        this._enlazarEventos();
        this._actualizarMarcadorInicial();
    }

    // ============================================================
    // INICIALIZACION
    // ============================================================
    _enlazarEventos() {
        // Formulario principal
        this.interfaz.formularioJugador.addEventListener('submit', (evento) => {
            evento.preventDefault();
            sonido.inicializar();
            sonido.sonidoBoton();
            this._iniciarDesdeMenu();
        });

        // Boton ver tabla desde el menu
        document.getElementById('botonVerTabla').addEventListener('click', () => {
            sonido.sonidoBoton();
            this.interfaz.mostrarPantalla('tabla');
            this.interfaz.cargarTablaDePosiciones(this.jugadorActual);
        });

        // Botones de la tabla
        document.getElementById('botonRefrescarTabla').addEventListener('click', () => {
            sonido.sonidoBoton();
            this.interfaz.cargarTablaDePosiciones(this.jugadorActual);
        });
        document.getElementById('botonVolverMenu').addEventListener('click', () => {
            sonido.sonidoBoton();
            this.interfaz.mostrarPantalla('menu');
        });

        // Pausa, reanudar, salir
        document.getElementById('botonPausa').addEventListener('click', () => this._alternarPausa());
        document.getElementById('botonReanudar').addEventListener('click', () => this._alternarPausa());
        document.getElementById('botonSalirPausa').addEventListener('click', () => this._volverAlMenu());
        document.getElementById('botonReiniciar').addEventListener('click', () => {
            sonido.sonidoBoton();
            this._iniciarPartida();
        });
        document.getElementById('botonSalirFin').addEventListener('click', () => this._volverAlMenu());

        // Boton silenciar
        const botonSilenciar = document.getElementById('botonSilenciar');
        const refrescarIconoSonido = () => {
            const icono = botonSilenciar.querySelector('.icono-sonido');
            if (icono) icono.textContent = sonido.estaSilenciado() ? '🔇' : '🔊';
            botonSilenciar.classList.toggle('silenciado', sonido.estaSilenciado());
        };
        refrescarIconoSonido();
        botonSilenciar.addEventListener('click', () => {
            sonido.inicializar();
            sonido.alternarSilencio();
            refrescarIconoSonido();
        });

        // Validacion en vivo del campo nombre
        this.interfaz.campoNombre.addEventListener('input', () => {
            const valor = this.interfaz.campoNombre.value.trim();
            if (valor === '' || nombreEsValido(valor)) {
                this.interfaz.establecerError('');
            } else {
                this.interfaz.establecerError(
                    'Usa 3 a 15 caracteres: letras, numeros, guiones o guiones bajos.'
                );
            }
        });

        // Suscripciones a entradas (teclado y tactil)
        this.entrada.activar(document.querySelector('.controles-tactiles'));
        this.entrada.alSolicitarDireccion((direccion) => {
            if (this.estado !== ESTADOS.JUGANDO) return;
            if (this.serpiente) this.serpiente.establecerDireccion(direccion);
        });
        this.entrada.alSolicitarPausa(() => {
            if (this.estado === ESTADOS.JUGANDO || this.estado === ESTADOS.PAUSADO) {
                this._alternarPausa();
            }
        });
    }

    _actualizarMarcadorInicial() {
        this.interfaz.actualizarMarcador({ puntaje: 0, record: this.record, velocidad: 1 });
        // Si el navegador recuerda un nombre previo del mismo dispositivo,
        // lo prellenamos para que no haya que reescribirlo cada vez.
        const miNombre = this._cargarMiNombre();
        if (miNombre && this.interfaz.campoNombre && this.interfaz.campoNombre.value === '') {
            this.interfaz.campoNombre.value = miNombre;
        }
    }

    // ============================================================
    // FLUJO DE PARTIDA
    // ============================================================
    async _iniciarDesdeMenu() {
        const valorIngresado = this.interfaz.obtenerNombreIngresado().trim();
        let nombreFinal;

        if (valorIngresado === '') {
            nombreFinal = generarNombreInvitado();
        } else if (nombreEsValido(valorIngresado)) {
            nombreFinal = valorIngresado;
        } else {
            this.interfaz.establecerError(
                'Usa 3 a 15 caracteres: letras, numeros, guiones o guiones bajos.'
            );
            return;
        }

        // Evitar que un visitante use el nombre de otro jugador ya registrado.
        // Solo se permite el nombre si: es nuevo, o si es el mismo que ya guardamos
        // localmente como propio del dispositivo.
        const miNombre = this._cargarMiNombre();
        if (!mismoJugador(nombreFinal, miNombre)) {
            try {
                const lista = await obtenerPuntajes();
                const yaExiste =
                    Array.isArray(lista) &&
                    lista.some((registro) => mismoJugador(registro.jugador, nombreFinal));
                if (yaExiste) {
                    this.interfaz.establecerError(
                        `El nombre "${nombreFinal}" ya esta tomado. Elige otro.`
                    );
                    return;
                }
            } catch (_) {
                // Si el servidor no responde, dejamos pasar y el POST final decidira.
            }
        }

        this.jugadorActual = nombreFinal;
        this._guardarMiNombre(nombreFinal);
        this.interfaz.establecerError('');
        this.interfaz.mostrarPantalla('juego');
        this._iniciarPartida();
    }

    _iniciarPartida() {
        sonido.sonidoInicio();

        // El lienzo recien se hizo visible; aseguramos que tenga un tamano valido
        // antes del primer render para que la serpiente y la rejilla aparezcan
        // sin necesidad de un resize externo.
        this.renderizador.ajustarResolucion();

        // Reset del modelo
        const centro = {
            x: Math.floor(CONFIG.columnas / 2),
            y: Math.floor(CONFIG.filas / 2)
        };
        this.serpiente = new Serpiente(centro, CONFIG.longitudInicial, DIRECCIONES.DERECHA);
        this.comida.reubicar(this.serpiente);

        this.puntaje = 0;
        this.intervaloMs = CONFIG.intervaloInicialMs;
        this.acumulador = 0;
        this.tiempoAnterior = performance.now();

        this.interfaz.actualizarMarcador({
            puntaje: 0,
            record: this.record,
            velocidad: 1
        });
        this.interfaz.ocultarFinDeJuego();
        this.interfaz.mostrarPausa(false);
        this.estado = ESTADOS.JUGANDO;

        this._iniciarBucle();
    }

    _volverAlMenu() {
        sonido.sonidoBoton();
        this.estado = ESTADOS.INACTIVO;
        this._detenerBucle();
        this.interfaz.mostrarPausa(false);
        this.interfaz.ocultarFinDeJuego();
        this.interfaz.mostrarPantalla('menu');
    }

    _alternarPausa() {
        if (this.estado === ESTADOS.JUGANDO) {
            this.estado = ESTADOS.PAUSADO;
            this.interfaz.mostrarPausa(true);
            sonido.sonidoPausa();
        } else if (this.estado === ESTADOS.PAUSADO) {
            this.estado = ESTADOS.JUGANDO;
            this.interfaz.mostrarPausa(false);
            this.tiempoAnterior = performance.now();
            sonido.sonidoPausa();
        }
    }

    // ============================================================
    // BUCLE PRINCIPAL
    // ============================================================
    _iniciarBucle() {
        this._detenerBucle();
        const bucle = (tiempo) => {
            this.identificadorAnimacion = requestAnimationFrame(bucle);
            this._tick(tiempo);
        };
        this.identificadorAnimacion = requestAnimationFrame(bucle);
    }

    _detenerBucle() {
        if (this.identificadorAnimacion !== null) {
            cancelAnimationFrame(this.identificadorAnimacion);
            this.identificadorAnimacion = null;
        }
    }

    _tick(tiempo) {
        const delta = tiempo - this.tiempoAnterior;
        this.tiempoAnterior = tiempo;
        const deltaSegundos = Math.max(0, delta) / 1000;

        if (this.estado === ESTADOS.JUGANDO) {
            this.acumulador += delta;
            // Permite varios pasos si el frame fue muy largo (proteccion contra lag).
            let pasos = 0;
            while (this.acumulador >= this.intervaloMs && pasos < 4) {
                this._avanzarPaso();
                this.acumulador -= this.intervaloMs;
                pasos += 1;
                if (this.estado !== ESTADOS.JUGANDO) break;
            }
        }

        // Renderiza siempre (tambien en pausa o fin) para mantener animaciones suaves.
        if (this.serpiente) {
            this.renderizador.renderizar(this.serpiente, this.comida, deltaSegundos);
        }
    }

    _avanzarPaso() {
        const cabezaProxima = {
            x: this.serpiente.obtenerCabeza().x + this.serpiente.direccionPendiente.x,
            y: this.serpiente.obtenerCabeza().y + this.serpiente.direccionPendiente.y
        };

        // Colision con muros
        if (
            cabezaProxima.x < 0 || cabezaProxima.x >= CONFIG.columnas ||
            cabezaProxima.y < 0 || cabezaProxima.y >= CONFIG.filas
        ) {
            this._terminarJuego();
            return;
        }

        this.serpiente.avanzar();

        // Colision consigo misma
        if (this.serpiente.chocaConsigoMisma()) {
            this._terminarJuego();
            return;
        }

        // Colision con comida
        const cabeza = this.serpiente.obtenerCabeza();
        const posComida = this.comida.obtenerPosicion();
        if (posComida && celdasIguales(cabeza, posComida)) {
            this._comer();
        }
    }

    _comer() {
        const posComida = this.comida.obtenerPosicion();
        this.serpiente.crecer(1);
        this.puntaje += CONFIG.puntosPorComida;
        if (this.puntaje > this.record) {
            this.record = this.puntaje;
            this._guardarRecordLocal(this.record);
        }
        this.intervaloMs = Math.max(
            CONFIG.intervaloMinimoMs,
            this.intervaloMs - CONFIG.decrementoPorComida
        );
        const nivelVelocidad = Math.max(
            1,
            Math.round(
                (CONFIG.intervaloInicialMs - this.intervaloMs) / CONFIG.decrementoPorComida + 1
            )
        );
        this.interfaz.actualizarMarcador({
            puntaje: this.puntaje,
            record: this.record,
            velocidad: nivelVelocidad
        });

        this.renderizador.generarParticulas(posComida.x, posComida.y, '#ff5e8a', 18);
        sonido.sonidoComer();
        this.comida.reubicar(this.serpiente);
    }

    async _terminarJuego() {
        if (this.estado === ESTADOS.TERMINADO) return;
        this.estado = ESTADOS.TERMINADO;
        sonido.sonidoFin();
        this.interfaz.aplicarSacudida();

        // Particulas en la cabeza al colisionar.
        const cabeza = this.serpiente.obtenerCabeza();
        if (cabeza) {
            this.renderizador.generarParticulas(cabeza.x, cabeza.y, '#ff3a5e', 26);
        }

        let mensajeMejor = '';

        try {
            const resultado = await registrarPuntaje(this.jugadorActual, this.puntaje);
            if (resultado && resultado.actualizado) {
                mensajeMejor = '¡Nuevo mejor puntaje guardado!';
            } else if (resultado && resultado.registro) {
                mensajeMejor = `Tu mejor puntaje sigue siendo ${resultado.registro.puntaje}.`;
            }
        } catch (error) {
            mensajeMejor = 'No se pudo guardar el puntaje (servidor no disponible).';
        }

        this.interfaz.mostrarFinDeJuego({
            puntaje: this.puntaje,
            mensajeMejor
        });
    }

    // ============================================================
    // PERSISTENCIA LOCAL DEL RECORD
    // ============================================================
    _cargarRecordLocal() {
        try {
            const valor = parseInt(localStorage.getItem('snakeNeon.record'), 10);
            return Number.isFinite(valor) && valor >= 0 ? valor : 0;
        } catch (_) {
            return 0;
        }
    }

    _guardarRecordLocal(valor) {
        try {
            localStorage.setItem('snakeNeon.record', String(valor));
        } catch (_) { /* ignorado */ }
    }

    /**
     * Devuelve el nombre que el dueno de este dispositivo ha "reclamado".
     * Sirve para evitar que otra persona use ese nombre en otro dispositivo
     * y que el dueno legitimo siempre pueda volver a usarlo.
     */
    _cargarMiNombre() {
        try {
            return localStorage.getItem('snakeNeon.miNombre') || '';
        } catch (_) {
            return '';
        }
    }

    _guardarMiNombre(nombre) {
        try {
            localStorage.setItem('snakeNeon.miNombre', nombre);
        } catch (_) { /* ignorado */ }
    }
}

// Arranque cuando el DOM este listo.
function iniciarAplicacion() {
    const juego = new JuegoSnake();
    // Se expone solo para depuracion en consola; no se usa internamente.
    window.__juegoSnake = juego;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarAplicacion);
} else {
    iniciarAplicacion();
}
