// db.js
// Configuracion de conexion a PostgreSQL para el backend.

const { Pool } = require('pg');

const configuracion = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
          user: process.env.PGUSER || 'postgres',
          password: process.env.PGPASSWORD || 'brygsnny',
          host: process.env.PGHOST || 'localhost',
          port: Number(process.env.PGPORT || 5432),
          database: process.env.PGDATABASE || 'snake_neon'
      };

const conexion = new Pool({
    ...configuracion,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

const query = (texto, parametros) => conexion.query(texto, parametros);

const verificarConexion = async () => {
    await conexion.query('SELECT 1');
};

module.exports = {
    query,
    verificarConexion
};
