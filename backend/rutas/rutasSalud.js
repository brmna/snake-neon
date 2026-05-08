// rutasSalud.js
// Endpoint simple de monitoreo para verificar que el servidor responde.

const express = require('express');

const enrutador = express.Router();

enrutador.get('/', (peticion, respuesta) => {
    respuesta.json({
        estado: 'ok',
        servicio: 'snake-neon-backend',
        marcaTiempo: new Date().toISOString()
    });
});

module.exports = enrutador;
