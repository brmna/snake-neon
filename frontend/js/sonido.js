// sonido.js
// Sintetizador minimalista de efectos sonoros estilo arcade usando WebAudio.
// Evitamos depender de archivos externos para mantener el proyecto autocontenido.

class GestorSonido {
    constructor() {
        this.contexto = null;
        this.ganancia = null;
        this.silenciado = this.cargarPreferenciaSilenciado();
        this.volumen = 0.18;
    }

    /**
     * Inicializa o reanuda el AudioContext bajo gesto del usuario.
     */
    inicializar() {
        if (this.contexto) {
            if (this.contexto.state === 'suspended') {
                this.contexto.resume().catch(() => { /* ignorado */ });
            }
            return;
        }
        try {
            const Constructor = window.AudioContext || window.webkitAudioContext;
            if (!Constructor) return;
            this.contexto = new Constructor();
            this.ganancia = this.contexto.createGain();
            this.ganancia.gain.value = this.silenciado ? 0 : this.volumen;
            this.ganancia.connect(this.contexto.destination);
        } catch (error) {
            console.warn('[sonido] WebAudio no disponible:', error);
        }
    }

    cargarPreferenciaSilenciado() {
        try {
            return localStorage.getItem('snakeNeon.silenciado') === 'true';
        } catch (_) {
            return false;
        }
    }

    guardarPreferenciaSilenciado() {
        try {
            localStorage.setItem('snakeNeon.silenciado', String(this.silenciado));
        } catch (_) { /* ignorado */ }
    }

    estaSilenciado() {
        return this.silenciado;
    }

    alternarSilencio() {
        this.silenciado = !this.silenciado;
        if (this.ganancia) {
            this.ganancia.gain.value = this.silenciado ? 0 : this.volumen;
        }
        this.guardarPreferenciaSilenciado();
        return this.silenciado;
    }

    /**
     * Reproduce un tono simple con envolvente exponencial para evitar clics.
     */
    _tono(frecuenciaInicial, frecuenciaFinal, duracion, tipoOnda = 'square', volumen = 1) {
        if (!this.contexto || this.silenciado) return;
        const ahora = this.contexto.tiempoActual ?? this.contexto.currentTime;

        const oscilador = this.contexto.createOscillator();
        const ganLocal = this.contexto.createGain();

        oscilador.type = tipoOnda;
        oscilador.frequency.setValueAtTime(frecuenciaInicial, ahora);
        if (frecuenciaFinal && frecuenciaFinal !== frecuenciaInicial) {
            oscilador.frequency.exponentialRampToValueAtTime(
                Math.max(0.0001, frecuenciaFinal),
                ahora + duracion
            );
        }

        ganLocal.gain.setValueAtTime(0.0001, ahora);
        ganLocal.gain.exponentialRampToValueAtTime(volumen, ahora + 0.01);
        ganLocal.gain.exponentialRampToValueAtTime(0.0001, ahora + duracion);

        oscilador.connect(ganLocal);
        ganLocal.connect(this.ganancia);

        oscilador.start(ahora);
        oscilador.stop(ahora + duracion + 0.02);
    }

    sonidoInicio() {
        this._tono(440, 880, 0.18, 'square', 0.6);
        setTimeout(() => this._tono(660, 1320, 0.14, 'square', 0.5), 110);
    }

    sonidoComer() {
        this._tono(880, 1760, 0.08, 'square', 0.5);
    }

    sonidoFin() {
        this._tono(440, 110, 0.45, 'sawtooth', 0.7);
        setTimeout(() => this._tono(220, 60, 0.35, 'sawtooth', 0.55), 80);
    }

    sonidoBoton() {
        this._tono(660, 660, 0.05, 'square', 0.3);
    }

    sonidoPausa() {
        this._tono(330, 330, 0.10, 'triangle', 0.4);
    }
}

// Singleton compartido por toda la aplicacion.
export const sonido = new GestorSonido();
