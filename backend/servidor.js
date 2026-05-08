// servidor.js
// Punto de entrada del backend del juego Snake Neon.
// Configura Express, CORS, archivos estaticos y monta las rutas de la API.

const express = require('express');
const cors = require('cors');
const path = require('path');

const rutasPuntajes = require('./rutas/rutasPuntajes');
const rutasSalud = require('./rutas/rutasSalud');

const PUERTO = process.env.PORT || 3000;

const aplicacion = express();

// Middleware base.
aplicacion.use(cors());
aplicacion.use(express.json({ limit: '32kb' }));

// Servir el frontend estatico desde el mismo servidor para facilitar el despliegue local.
const rutaFrontend = path.join(__dirname, '..', 'frontend');
aplicacion.use(express.static(rutaFrontend));

// Montaje de rutas de la API.
aplicacion.use('/api/puntajes', rutasPuntajes);
aplicacion.use('/api/salud', rutasSalud);

// Manejador para rutas inexistentes bajo /api.
aplicacion.use('/api', (peticion, respuesta) => {
    respuesta.status(404).json({
        error: 'Recurso no encontrado',
        ruta: peticion.originalUrl
    });
});

// Manejador global de errores no controlados.
// eslint-disable-next-line no-unused-vars
aplicacion.use((error, peticion, respuesta, siguiente) => {
    console.error('[ERROR]', error);
    respuesta.status(500).json({
        error: 'Error interno del servidor',
        detalle: error && error.message ? error.message : 'desconocido'
    });
});

aplicacion.listen(PUERTO, () => {
    console.log(`Servidor Snake Neon escuchando en http://localhost:${PUERTO}`);
    console.log(`Frontend disponible en      http://localhost:${PUERTO}/`);
    console.log(`API de puntajes en          http://localhost:${PUERTO}/api/puntajes`);
});
