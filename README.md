# Snake Neon Arcade

Juego clasico de la serpiente con estetica neon arcade / synthwave.
Frontend en HTML5 + CSS3 + JavaScript vanilla (sin frameworks) y backend Node.js + Express
con persistencia en archivo JSON.

Todo el codigo, nombres de variables, funciones, clases y carpetas esta en espanol.

## Estructura del proyecto

```
snake-neon/
 ├── frontend/
 │   ├── index.html
 │   ├── estilos.css
 │   └── js/
 │       ├── juego.js          (orquestador principal)
 │       ├── serpiente.js      (modelo de la serpiente)
 │       ├── comida.js         (modelo de la comida)
 │       ├── entrada.js        (teclado, tactil y deslizar)
 │       ├── renderizador.js   (canvas, particulas, glow)
 │       ├── interfaz.js       (pantallas, marcadores, tabla)
 │       ├── sonido.js         (sintesis WebAudio)
 │       ├── api.js            (cliente HTTP)
 │       └── utilidades.js     (helpers comunes)
 │
 └── backend/
     ├── servidor.js           (Express + estaticos)
     ├── package.json
     ├── rutas/
     │   ├── rutasPuntajes.js
     │   └── rutasSalud.js
     ├── servicios/
     │   └── servicioPuntajes.js
     ├── repositorios/
     │   └── repositorioPuntajes.js
     └── datos/
         └── puntajes.json
     └── db/
         └── init.sql
```

## Instalacion

Requisitos: Node.js 18 o superior, o Docker con Docker Compose.

### Opcion local sin Docker

```bash
cd snake-neon/backend
npm install
```

Para esta opcion necesitas un servidor PostgreSQL accesible desde tu entorno local.
Si usas el mismo contenedor Docker para la base de datos, primero arranca Docker y expone el puerto 5432:

```bash
docker compose up -d db
```

Luego ejecuta el backend local con las credenciales definidas en `.env`:

```bash
npm run dev
```

### Opcion con Docker (recomendada)

El proyecto levanta 3 imagenes Docker:

| Servicio | Imagen | Responsabilidad |
|----------|--------|-----------------|
| `frontend` | `snake-neon-frontend:latest` | Sirve el juego con Nginx y redirige `/api` al backend |
| `backend` | `snake-neon-backend:latest` | API REST Node.js + Express |
| `db` | `postgres:15-alpine` | Base de datos PostgreSQL |

```bash
docker compose up --build
```

Luego abre en el navegador:

```
http://localhost:8080
```

La API tambien queda expuesta en `http://localhost:3000` para pruebas directas.

### Opcion B — abrir el frontend como archivo

Tambien puedes abrir `frontend/index.html` directamente en el navegador.
En ese caso, el frontend detectara que se esta sirviendo como `file://` y apuntara a
`http://localhost:3000` para la API. Asegurate de tener el backend corriendo.

## API

| Metodo | Ruta                          | Descripcion                                      |
|--------|-------------------------------|--------------------------------------------------|
| GET    | `/api/salud`                  | Estado del servicio                              |
| GET    | `/api/puntajes`               | Lista de puntajes ordenada de mayor a menor      |
| GET    | `/api/puntajes?limite=10`     | Top N puntajes                                   |
| POST   | `/api/puntajes`               | Registra/actualiza el mejor puntaje del jugador  |
| GET    | `/api/usuarios?usuario=...`   | Verifica si un usuario ya está registrado        |
| POST   | `/api/usuarios/registro`      | Registra un usuario con contraseña               |
| POST   | `/api/usuarios/login`         | Inicia sesión con usuario y contraseña           |

Cuerpo del POST:

```json
{ "jugador": "NombreJugador", "puntaje": 250 }
```

Reglas:
- Nombre: 3 a 15 caracteres, solo letras, numeros, `_` o `-`.
- Puntaje: entero entre 0 y 1.000.000.
- Solo se guarda el **mejor** puntaje por jugador. Si el nuevo es menor, se conserva el anterior.

## Controles

- Flechas o `W A S D` para mover.
- `P` o `ESC` para pausar / reanudar.
- En movil: botones direccionales en pantalla y deslizamiento sobre el tablero.
- Boton de altavoz en el menu para silenciar / activar sonido.

## Caracteristicas del juego

- Movimiento clasico por cuadricula (24 x 24).
- Crecimiento al comer y velocidad progresiva.
- Particulas neon al comer y sacudida de pantalla al colisionar.
- Pulso suave en la comida.
- Tabla Top 10 con resaltado del jugador actual.
- Nombre opcional con generacion automatica (`Invitado-####`).
- Sonidos sintetizados (sin archivos externos) con preferencia de silencio persistida.
- Mejor puntaje local persistido en `localStorage`.
- Diseno responsivo con controles tactiles en movil.

## Notas tecnicas

- El backend ahora persiste los puntajes en PostgreSQL usando una tabla `puntajes`.
- Se agregó login/registro en el menú principal y los usuarios se guardan en PostgreSQL.
- El renderizador ajusta su resolucion al `devicePixelRatio` para verse nitido en pantallas HiDPI.
- El bucle de juego usa `requestAnimationFrame` con un acumulador de tiempo, lo que
  desacopla el ritmo del juego del framerate del navegador.
