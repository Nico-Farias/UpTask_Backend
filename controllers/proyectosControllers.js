import Usuario from '../models/Usuario.js';
import Proyecto from './../models/Proyecto.js';
import Tarea from './../models/Tarea.js';


const obtenerProyectos = async (req, res) => {

    const proyectos = await Proyecto.find({
        '$or': [
            {
                colaboradores: {
                    $in: req.usuario
                }
            }, {
                creador: {
                    $in: req.usuario
                }
            }
        ]
    }).select('-tareas')

    res.json(proyectos)


}


const nuevoProyecto = async (req, res) => {

    const proyecto = new Proyecto(req.body)
    proyecto.creador = req.usuario._id

    try {
        const proyectoAlmacenado = await proyecto.save()
        res.json(proyectoAlmacenado)


    } catch (error) {
        console.log(error)
    }


}


const obtenerProyecto = async (req, res) => {

    const {id} = req.params;

    const proyecto = await Proyecto.findById(id).populate({
        path: 'tareas',
        populate: {
            path: 'completado',
            select: 'nombre'
        }
    }).populate('colaboradores', 'nombre email')

    if (! proyecto) {
        const error = new Error('No encontrado')
        return res.status(404).json({msg: error.message})
    }

    if (proyecto.creador.toString() !== req.usuario._id.toString() && ! proyecto.colaboradores.some(colaborador => colaborador._id.toString() === req.usuario._id.toString())) {
        const error = new Error('Accion no valida')
        return res.status(404).json({msg: error.message})
    }


    res.json(proyecto)

}


const editarProyecto = async (req, res) => {

    const {id} = req.params;

    const proyecto = await Proyecto.findById(id)

    if (! proyecto) {
        const error = new Error('No encontrado')
        return res.status(404).json({msg: error.message})
    }

    if (proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error('Accion no valida')
        return res.status(404).json({msg: error.message})
    }

    proyecto.nombre = req.body.nombre || proyecto.nombre;
    proyecto.descripcion = req.body.descripcion || proyecto.descripcion;
    proyecto.cliente = req.body.cliente || proyecto.cliente;
    proyecto.fechaEntrega = req.body.fechaEntrega || proyecto.fechaEntrega;

    try {

        const proyectoActualizado = await proyecto.save()
        res.json(proyectoActualizado)

    } catch (error) {
        console.log(error)
    }

}


const eliminarProyecto = async (req, res) => {

    const {id} = req.params;

    const proyecto = await Proyecto.findById(id)

    if (! proyecto) {
        const error = new Error('No encontrado')
        return res.status(404).json({msg: error.message})
    }

    if (proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error('Accion no valida')
        return res.status(404).json({msg: error.message})
    }

    try {
        await proyecto.deleteOne();
        res.json({msg: 'Proyecto Eliminado'})

    } catch (error) {
        console.log(error)
    }

}


const buscarColaborador = async (req, res) => {
    const {email} = req.body

    const usuario = await Usuario.findOne({email}).select('-password -confirmado -createdAt -token -updatedAt -__v')

    if (! usuario) {
        const error = new Error('Usuario no encontrado')
        return res.status(404).json({msg: error.message})
    }

    res.json(usuario)

}


const agregarColaborador = async (req, res) => {
    const proyecto = await Proyecto.findById(req.params.id)
    const {email} = req.body

    const usuario = await Usuario.findOne({email}).select('-password -confirmado -createdAt -token -updatedAt -__v')

    // revisar que el proyecto exista
    if (! proyecto) {
        const error = new Error('Proyecto no encontrado')
        return res.status(404).json({msg: error.message})
    }

    // revisar que el que te este agregando sea el dueño del proyecto
    if (proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error('Accion no valida')
        return res.status(404).json({msg: error.message})

    }

    // revisar que el usuario exista
    if (! usuario) {
        const error = new Error('Usuario no encontrado')
        return res.status(404).json({msg: error.message})
    }

    // Revisar que el creador no se agregue como colaborador
    if (proyecto.creador.toString() === usuario._id.toString()) {
        const error = new Error('El creador del proyecto no puede ser colaborador')
        return res.status(404).json({msg: error.message})

    }

    // revisar que no este agregado al proyecto
    if (proyecto.colaboradores.includes(usuario._id)) {
        const error = new Error('El usuario ya pertenece al proyecto')
        return res.status(404).json({msg: error.message})

    }

    // Se puede agregar al usuario
    proyecto.colaboradores.push(usuario._id)
    await proyecto.save()

    res.json({msg: 'El colaborador se agrego correctamente'})


}


const eliminarColaborador = async (req, res) => {

    const proyecto = await Proyecto.findById(req.params.id)
    const {email} = req.body

    const usuario = await Usuario.findOne({email}).select('-password -confirmado -createdAt -token -updatedAt -__v')

    // revisar que el proyecto exista
    if (! proyecto) {
        const error = new Error('Proyecto no encontrado')
        return res.status(404).json({msg: error.message})
    }

    // revisar que el que te este agregando sea el dueño del proyecto
    if (proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error('Accion no valida')
        return res.status(404).json({msg: error.message})

    }

    proyecto.colaboradores.pull(req.body.id)
    await proyecto.save()

    res.json({msg: 'Colaborador eliminado correctamente'})


}


export {
    obtenerProyecto,
    nuevoProyecto,
    obtenerProyectos,
    editarProyecto,
    eliminarProyecto,
    agregarColaborador,
    eliminarColaborador,
    buscarColaborador
}
