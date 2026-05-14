// repositorioUsuarios.js
// Gestiona la persistencia de usuarios en PostgreSQL.

const db = require('../db');

const normalizarUsuario = (fila) => ({
    usuario: fila.usuario,
    fechaCreacion: fila.fecha_creacion ? String(fila.fecha_creacion) : null
});

const existeUsuario = async (usuario) => {
    const { rows } = await db.query(
        'SELECT 1 FROM usuarios WHERE LOWER(usuario) = LOWER($1)',
        [usuario]
    );
    return rows.length > 0;
};

const crearUsuario = async (usuario, hashPassword) => {
    const { rows } = await db.query(
        'INSERT INTO usuarios (usuario, hash_password, fecha_creacion) VALUES ($1, $2, CURRENT_DATE) RETURNING usuario, fecha_creacion',
        [usuario, hashPassword]
    );
    return normalizarUsuario(rows[0]);
};

const obtenerUsuario = async (usuario) => {
    const { rows } = await db.query(
        'SELECT usuario, hash_password, fecha_creacion FROM usuarios WHERE LOWER(usuario) = LOWER($1)',
        [usuario]
    );
    return rows[0] || null;
};

module.exports = {
    existeUsuario,
    crearUsuario,
    obtenerUsuario
};
