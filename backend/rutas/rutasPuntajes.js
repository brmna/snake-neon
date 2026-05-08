// rutasPuntajes.js
// Define las rutas HTTP para el recurso de puntajes y delega la logica al servicio.

const express = require('express');
const servicioPuntajes = require('../servicios/servicioPuntajes');

const enrutador = express.Router();

// GET /api/puntajes
// Devuelve el listado completo ordenado descendentemente.
// Soporta el query ?limite=N para limitar la cantidad (por ejemplo, ?limite=10 para top 10).
enrutador.get('/', async (peticion, respuesta, siguiente) => {
    try {
        const limiteCrudo = peticion.query.limite;
        const limite = limiteCrudo !== undefined ? Number.parseInt(limiteCrudo, 10) : null;

        if (limiteCrudo !== undefined && (Number.isNaN(limite) || limite <= 0)) {
            return respuesta.status(400).json({
                error: 'El parametro limite debe ser un entero positivo'
            });
        }

        const puntajes = await servicioPuntajes.obtenerPuntajes(limite);
        return respuesta.json(puntajes);
    } catch (error) {
        return siguiente(error);
    }
});

// POST /api/puntajes
// Registra o actualiza el mejor puntaje del jugador.
// Cuerpo esperado: { jugador: string, puntaje: number }
enrutador.post('/', async (peticion, respuesta, siguiente) => {
    try {
        const { jugador, puntaje } = peticion.body || {};
        const resultado = await servicioPuntajes.registrarPuntaje(jugador, puntaje);
        return respuesta.status(201).json(resultado);
    } catch (error) {
        if (error.tipo === 'VALIDACION') {
            return respuesta.status(400).json({ error: error.message });
        }
        return siguiente(error);
    }
});

module.exports = enrutador;
