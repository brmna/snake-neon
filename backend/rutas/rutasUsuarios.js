// rutasUsuarios.js
// Rutas HTTP para registrar y autenticar usuarios.

const express = require('express');
const servicioUsuarios = require('../servicios/servicioUsuarios');

const enrutador = express.Router();

// GET /api/usuarios?usuario=nombre
// Verifica si un usuario ya esta registrado.
enrutador.get('/', async (peticion, respuesta, siguiente) => {
    try {
        const usuario = peticion.query.usuario;
        if (!usuario) {
            return respuesta.status(400).json({ error: 'El parametro usuario es obligatorio' });
        }
        const existe = await servicioUsuarios.usuarioExiste(usuario);
        return respuesta.json({ existe });
    } catch (error) {
        if (error.tipo === 'VALIDACION') {
            return respuesta.status(400).json({ error: error.message });
        }
        return siguiente(error);
    }
});

// POST /api/usuarios/registro
// Registra un nuevo usuario con nombre y contraseña.
enrutador.post('/registro', async (peticion, respuesta, siguiente) => {
    try {
        const { usuario, password } = peticion.body || {};
        const nuevoUsuario = await servicioUsuarios.registrarUsuario(usuario, password);
        return respuesta.status(201).json({ mensaje: 'Usuario registrado correctamente', usuario: nuevoUsuario.usuario });
    } catch (error) {
        if (error.tipo === 'VALIDACION') {
            return respuesta.status(400).json({ error: error.message });
        }
        return siguiente(error);
    }
});

// POST /api/usuarios/login
// Autentica un usuario registrado.
enrutador.post('/login', async (peticion, respuesta, siguiente) => {
    try {
        const { usuario, password } = peticion.body || {};
        const usuarioAutenticado = await servicioUsuarios.autenticarUsuario(usuario, password);
        return respuesta.json({ mensaje: `Bienvenido de nuevo, ${usuarioAutenticado.usuario}`, usuario: usuarioAutenticado.usuario });
    } catch (error) {
        if (error.tipo === 'VALIDACION') {
            return respuesta.status(400).json({ error: error.message });
        }
        return siguiente(error);
    }
});

module.exports = enrutador;
