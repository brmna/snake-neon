CREATE TABLE IF NOT EXISTS puntajes (
    jugador VARCHAR(15) PRIMARY KEY,
    puntaje INTEGER NOT NULL CHECK (puntaje >= 0 AND puntaje <= 1000000),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(15) NOT NULL,
    hash_password TEXT NOT NULL,
    fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_usuario_lower_idx
    ON usuarios (LOWER(usuario));
