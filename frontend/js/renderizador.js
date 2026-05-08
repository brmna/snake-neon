// renderizador.js
// Encapsula todo el dibujo en el canvas: rejilla, serpiente, comida y particulas.
// Mantiene una pequena cache de gradientes y patrones para no recrearlos por frame.

export class Renderizador {
    /**
     * @param {HTMLCanvasElement} lienzo
     * @param {{columnas:number, filas:number}} configuracion
     */
    constructor(lienzo, configuracion) {
        this.lienzo = lienzo;
        this.contexto = lienzo.getContext('2d');
        this.columnas = configuracion.columnas;
        this.filas = configuracion.filas;

        this.particulas = [];
        this.tiempoTotal = 0;
        this.tamanoCelda = 0;
        this.lado = 0;

        this.ajustarResolucion();
        window.addEventListener('resize', () => this.ajustarResolucion());

        // ResizeObserver: cuando el contenedor cambia de tamano (por ejemplo,
        // al pasar de display:none a visible), recalculamos el lienzo.
        if (typeof ResizeObserver !== 'undefined') {
            this._observador = new ResizeObserver(() => this.ajustarResolucion());
            this._observador.observe(this.lienzo);
        }
    }

    /**
     * Indica si el lienzo ya tiene un tamano valido para dibujar.
     */
    estaListo() {
        return this.lado > 0 && this.tamanoCelda > 0;
    }

    /**
     * Ajusta el tamano interno del canvas a su tamano visual y a la densidad
     * de pixeles del dispositivo (devicePixelRatio).
     */
    ajustarResolucion() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.lienzo.getBoundingClientRect();
        const ladoVisual = Math.floor(Math.min(rect.width, rect.height));
        if (ladoVisual <= 0) return;

        this.lienzo.width = ladoVisual * dpr;
        this.lienzo.height = ladoVisual * dpr;
        this.contexto.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.tamanoCelda = ladoVisual / this.columnas;
        this.lado = ladoVisual;
    }

    /**
     * Convierte coordenadas de cuadricula a pixeles (esquina superior izquierda).
     */
    _celdaAPixel(x, y) {
        return {
            px: x * this.tamanoCelda,
            py: y * this.tamanoCelda
        };
    }

    /**
     * Dibuja la rejilla de fondo con un sutil glow.
     */
    _dibujarRejilla() {
        const ctx = this.contexto;
        ctx.save();
        ctx.strokeStyle = 'rgba(120, 220, 255, 0.06)';
        ctx.lineWidth = 1;

        for (let i = 0; i <= this.columnas; i++) {
            const x = Math.round(i * this.tamanoCelda) + 0.5;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.lado);
            ctx.stroke();
        }
        for (let j = 0; j <= this.filas; j++) {
            const y = Math.round(j * this.tamanoCelda) + 0.5;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.lado, y);
            ctx.stroke();
        }
        ctx.restore();
    }

    /**
     * Dibuja un cuadrado redondeado con relleno y glow.
     */
    _dibujarCeldaNeon(x, y, color, glow, factor = 1) {
        const ctx = this.contexto;
        const { px, py } = this._celdaAPixel(x, y);
        const margen = this.tamanoCelda * 0.10 * (1 / factor);
        const tam = this.tamanoCelda - margen * 2;
        const radio = tam * 0.22;

        ctx.save();
        ctx.shadowColor = glow;
        ctx.shadowBlur = 14 * factor;
        ctx.fillStyle = color;
        this._caminoRedondeado(px + margen, py + margen, tam, tam, radio);
        ctx.fill();

        // Brillo interno
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        this._caminoRedondeado(px + margen + tam * 0.18, py + margen + tam * 0.18, tam * 0.32, tam * 0.32, radio * 0.5);
        ctx.fill();
        ctx.restore();
    }

    _caminoRedondeado(x, y, ancho, alto, radio) {
        const ctx = this.contexto;
        const r = Math.min(radio, ancho / 2, alto / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + ancho - r, y);
        ctx.quadraticCurveTo(x + ancho, y, x + ancho, y + r);
        ctx.lineTo(x + ancho, y + alto - r);
        ctx.quadraticCurveTo(x + ancho, y + alto, x + ancho - r, y + alto);
        ctx.lineTo(x + r, y + alto);
        ctx.quadraticCurveTo(x, y + alto, x, y + alto - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    /**
     * Dibuja la serpiente. La cabeza recibe un tono ligeramente distinto
     * y un glow mas intenso para destacarla.
     */
    _dibujarSerpiente(serpiente) {
        const cuerpo = serpiente.obtenerCuerpo();

        // Cuerpo: dibujar de cola a cabeza para que la cabeza quede encima.
        for (let i = cuerpo.length - 1; i >= 0; i--) {
            const segmento = cuerpo[i];
            const esCabeza = i === 0;
            const color = esCabeza ? '#7dff8c' : '#36ff7d';
            const glow = esCabeza ? 'rgba(125, 255, 140, 0.85)' : 'rgba(54, 255, 125, 0.55)';
            this._dibujarCeldaNeon(segmento.x, segmento.y, color, glow, esCabeza ? 1.2 : 1);
        }

        // Ojos sobre la cabeza para darle vida.
        const cabeza = serpiente.obtenerCabeza();
        if (cabeza) {
            const { px, py } = this._celdaAPixel(cabeza.x, cabeza.y);
            const ctx = this.contexto;
            const tam = this.tamanoCelda;
            ctx.save();
            ctx.fillStyle = '#021008';
            const dir = serpiente.direccion;
            const ojoRadio = tam * 0.07;
            const offset = tam * 0.22;
            const offsetLat = tam * 0.18;

            // Posicionamiento de ojos segun direccion.
            const cx = px + tam / 2;
            const cy = py + tam / 2;
            let ox1, oy1, ox2, oy2;
            if (dir.x !== 0) {
                ox1 = ox2 = cx + dir.x * offset;
                oy1 = cy - offsetLat;
                oy2 = cy + offsetLat;
            } else {
                oy1 = oy2 = cy + dir.y * offset;
                ox1 = cx - offsetLat;
                ox2 = cx + offsetLat;
            }
            ctx.beginPath(); ctx.arc(ox1, oy1, ojoRadio, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(ox2, oy2, ojoRadio, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    }

    /**
     * Dibuja la comida con un pulso de brillo suave.
     */
    _dibujarComida(comida) {
        const posicion = comida.obtenerPosicion();
        if (!posicion) return;

        const ctx = this.contexto;
        const { px, py } = this._celdaAPixel(posicion.x, posicion.y);
        const tam = this.tamanoCelda;
        const cx = px + tam / 2;
        const cy = py + tam / 2;

        const pulso = 0.7 + 0.3 * Math.sin(this.tiempoTotal / 220);
        const radio = tam * 0.32;

        ctx.save();
        // Glow exterior
        const gradienteGlow = ctx.createRadialGradient(cx, cy, radio * 0.2, cx, cy, radio * 2.4);
        gradienteGlow.addColorStop(0, `rgba(255, 70, 120, ${0.55 * pulso})`);
        gradienteGlow.addColorStop(1, 'rgba(255, 70, 120, 0)');
        ctx.fillStyle = gradienteGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, radio * 2.4, 0, Math.PI * 2);
        ctx.fill();

        // Cuerpo de la fruta
        const gradiente = ctx.createRadialGradient(cx - radio * 0.3, cy - radio * 0.4, radio * 0.2, cx, cy, radio);
        gradiente.addColorStop(0, '#ff8aa6');
        gradiente.addColorStop(1, '#ff2a5e');
        ctx.fillStyle = gradiente;
        ctx.shadowColor = 'rgba(255, 60, 110, 0.85)';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(cx, cy, radio, 0, Math.PI * 2);
        ctx.fill();

        // Reflejo
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.beginPath();
        ctx.arc(cx - radio * 0.32, cy - radio * 0.36, radio * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /**
     * Genera un ramillete de particulas en una celda dada.
     */
    generarParticulas(x, y, color = '#36ff7d', cantidad = 14) {
        const { px, py } = this._celdaAPixel(x, y);
        const cx = px + this.tamanoCelda / 2;
        const cy = py + this.tamanoCelda / 2;
        for (let i = 0; i < cantidad; i++) {
            const angulo = Math.random() * Math.PI * 2;
            const velocidad = 60 + Math.random() * 140;
            this.particulas.push({
                x: cx,
                y: cy,
                vx: Math.cos(angulo) * velocidad,
                vy: Math.sin(angulo) * velocidad,
                vida: 1,
                color
            });
        }
    }

    _actualizarYDibujarParticulas(deltaSegundos) {
        const ctx = this.contexto;
        ctx.save();
        for (let i = this.particulas.length - 1; i >= 0; i--) {
            const p = this.particulas[i];
            p.x += p.vx * deltaSegundos;
            p.y += p.vy * deltaSegundos;
            p.vx *= 0.92;
            p.vy *= 0.92;
            p.vida -= deltaSegundos * 1.6;
            if (p.vida <= 0) {
                this.particulas.splice(i, 1);
                continue;
            }
            ctx.globalAlpha = Math.max(0, p.vida);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3.2 * p.vida + 0.6, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    /**
     * Borra el lienzo y dibuja un fondo sutilmente iluminado.
     */
    _limpiarFondo() {
        const ctx = this.contexto;
        ctx.clearRect(0, 0, this.lado, this.lado);
        const gradiente = ctx.createRadialGradient(
            this.lado / 2, this.lado / 2, this.lado * 0.1,
            this.lado / 2, this.lado / 2, this.lado * 0.75
        );
        gradiente.addColorStop(0, 'rgba(20, 10, 60, 0.55)');
        gradiente.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradiente;
        ctx.fillRect(0, 0, this.lado, this.lado);
    }

    /**
     * Renderiza un frame completo del juego.
     */
    renderizar(serpiente, comida, deltaSegundos = 0) {
        // Si el lienzo aun no tiene tamano (por ejemplo, recien hecho visible),
        // intentamos recalcularlo antes de descartar el frame.
        if (!this.estaListo()) {
            this.ajustarResolucion();
            if (!this.estaListo()) return;
        }
        this.tiempoTotal += deltaSegundos * 1000;
        this._limpiarFondo();
        this._dibujarRejilla();
        this._dibujarComida(comida);
        this._dibujarSerpiente(serpiente);
        this._actualizarYDibujarParticulas(deltaSegundos);
    }
}
