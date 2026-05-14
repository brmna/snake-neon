// servicioUsuarios.js
// Logica de negocio para registro y autenticacion de usuarios.

const bcrypt = require('bcryptjs');
const repositorioUsuarios = require('../repositorios/repositorioUsuarios');

const REGEX_USUARIO = /^[A-Za-z0-9_-]{3,15}$/;
const MINIMO_PASSWORD = 6;

const crearErrorValidacion = (mensaje) => {
    const error = new Error(mensaje);
    error.tipo = 'VALIDACION';
    return error;
};

function validarUsuario(usuario) {
    if (typeof usuario !== 'string') {
        throw crearErrorValidacion('El usuario es obligatorio');
    }
    const limpio = usuario.trim();
    if (!REGEX_USUARIO.test(limpio)) {
        throw crearErrorValidacion('El usuario debe tener entre 3 y 15 caracteres y solo letras, numeros, guiones o guiones bajos');
    }
    return limpio;
}

function validarPassword(password) {
    if (typeof password !== 'string' || password.length < MINIMO_PASSWORD) {
        throw crearErrorValidacion(`La contraseña debe tener al menos ${MINIMO_PASSWORD} caracteres`);
    }
    return password;
}

async function registrarUsuario(usuarioCrudo, passwordCrudo) {
    const usuario = validarUsuario(usuarioCrudo);
    const password = validarPassword(passwordCrudo);

    const existe = await repositorioUsuarios.existeUsuario(usuario);
    if (existe) {
        throw crearErrorValidacion('El usuario ya existe. Ingresa o elige otro nombre');
    }

    const hashPassword = await bcrypt.hash(password, 10);
    return await repositorioUsuarios.crearUsuario(usuario, hashPassword);
}

async function autenticarUsuario(usuarioCrudo, passwordCrudo) {
    const usuario = validarUsuario(usuarioCrudo);
    const password = validarPassword(passwordCrudo);

    const usuarioAlmacenado = await repositorioUsuarios.obtenerUsuario(usuario);
    if (!usuarioAlmacenado) {
        throw crearErrorValidacion('Usuario no encontrado. Registra una cuenta primero.');
    }

    const contraseñaValida = await bcrypt.compare(password, usuarioAlmacenado.hash_password);
    if (!contraseñaValida) {
        throw crearErrorValidacion('Contraseña incorrecta. Intenta nuevamente.');
    }

    return {
        usuario: usuarioAlmacenado.usuario,
        fechaCreacion: usuarioAlmacenado.fecha_creacion ? String(usuarioAlmacenado.fecha_creacion) : null
    };
}

async function usuarioExiste(usuarioCrudo) {
    const usuario = validarUsuario(usuarioCrudo);
    return await repositorioUsuarios.existeUsuario(usuario);
}

module.exports = {
    registrarUsuario,
    autenticarUsuario,
    usuarioExiste
};
