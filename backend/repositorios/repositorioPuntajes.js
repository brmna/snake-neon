// repositorioPuntajes.js
// Capa de acceso a datos usando PostgreSQL.
// Expone operaciones utilitarias para obtener puntajes y mantener el mejor registro por jugador.

const db = require('../db');

const normalizarFecha = (fila) => ({
    jugador: fila.jugador,
    puntaje: Number(fila.puntaje),
    fecha: fila.fecha ? String(fila.fecha) : null
});

const obtenerTodos = async () => {
    const { rows } = await db.query('SELECT jugador, puntaje, fecha FROM puntajes');
    return rows.map(normalizarFecha);
};

const crearOActualizarPuntaje = async (jugador, puntaje, fecha) => {
    const consulta = `
        WITH upsert AS (
            INSERT INTO puntajes(jugador, puntaje, fecha)
            VALUES ($1, $2, $3)
            ON CONFLICT (jugador) DO UPDATE
              SET puntaje = EXCLUDED.puntaje,
                  fecha = EXCLUDED.fecha
              WHERE puntajes.puntaje < EXCLUDED.puntaje
            RETURNING jugador, puntaje, fecha
        )
        SELECT * FROM upsert
        UNION ALL
        SELECT jugador, puntaje, fecha
        FROM puntajes
        WHERE jugador = $1
          AND NOT EXISTS (SELECT 1 FROM upsert);
    `;

    const { rows } = await db.query(consulta, [jugador, puntaje, fecha]);
    return normalizarFecha(rows[0]);
};

module.exports = {
    obtenerTodos,
    crearOActualizarPuntaje
};
