import express from "express";
import usuarioRoute from "./routes/usuarioRoutes.js";
import conectarDB from "./config/db.js";
import dotenv from "dotenv";
import cors from "cors"
import proyectoRoute from './routes/proyectoRoutes.js'
import tareaRoute from './routes/tareaRoutes.js'


const app = express();
app.use(express.json())

dotenv.config();

conectarDB()

// configurar CORS
const whitelist = [process.env.FRONTEND_URL];

const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.includes(origin)) {
            callback(null, true)

        } else {
            callback(new Error('Error de cors'))
        }
    }
}

app.use(cors(corsOptions))

// Routing

app.use('/api/usuarios', usuarioRoute)
app.use('/api/proyectos', proyectoRoute)
app.use('/api/tareas', tareaRoute)


const PORT = process.env.PORT || 4000

const servidor = app.listen(PORT, () => {
    console.log(`Corriendo en puerto ${PORT}`)
})


import {Server} from "socket.io";

const io = new Server(servidor, {
    pingTimeout: 60000,
    cors: {
        origin: process.env.FRONTEND_URL
    }
})

io.on('connection', (socket) => {
    console.log('Connected a socket.io')

    socket.on("abrir proyecto", (proyecto) => { // crea una sala con el id del proyecto
        socket.join(proyecto)
    });

    socket.on("nueva tarea", (tarea) => {
        const proyecto = tarea.proyecto;
        socket.to(proyecto).emit("tarea agregada", tarea)
    })

    socket.on('eliminar tarea', tarea => {
        const proyecto = tarea.proyecto
        socket.to(proyecto).emit("tarea eliminada", tarea)
    })

    socket.on('actualizar tarea', tarea => {
        const proyecto = tarea.proyecto._id;
        socket.to(proyecto).emit("tarea actualizada", tarea)
    })

    socket.on('cambiar estado', tarea => {
        const proyecto = tarea.proyecto._id;
        socket.to(proyecto).emit("nuevo estado", tarea)
    })


})
