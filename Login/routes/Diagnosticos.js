const express = require('express');
const router = express.Router();
const Diagnostico = require('../models/Diagnostico');


router.get('/', async (req, res) => {
    try {
        const diagnosticos = await Diagnostico.find().sort({ fecha: -1 });
        res.json(diagnosticos);
    } catch (error) {
        console.error('Error al obtener diagnósticos:', error);
        res.status(500).json({ error: 'Error al obtener diagnósticos' });
    }
});

// Obtener diagnósticos por doctor
router.get('/doctor/:doctorId', async (req, res) => {
    try {
        const diagnosticos = await Diagnostico.find({ 
            doctorId: req.params.doctorId 
        }).sort({ fecha: -1 });
        res.json(diagnosticos);
    } catch (error) {
        console.error('Error al obtener diagnósticos del doctor:', error);
        res.status(500).json({ error: 'Error al obtener diagnósticos del doctor' });
    }
});

// Obtener diagnósticos por paciente
router.get('/paciente/:pacienteId', async (req, res) => {
    try {
        const diagnosticos = await Diagnostico.find({ 
            pacienteId: req.params.pacienteId 
        }).sort({ fecha: -1 });
        res.json(diagnosticos);
    } catch (error) {
        console.error('Error al obtener diagnósticos del paciente:', error);
        res.status(500).json({ error: 'Error al obtener diagnósticos del paciente' });
    }
});

// Obtener un diagnóstico por ID
router.get('/:id', async (req, res) => {
    try {
        const diagnostico = await Diagnostico.findById(req.params.id);
        if (!diagnostico) {
            return res.status(404).json({ error: 'Diagnóstico no encontrado' });
        }
        res.json(diagnostico);
    } catch (error) {
        console.error('Error al obtener diagnóstico:', error);
        res.status(500).json({ error: 'Error al obtener diagnóstico' });
    }
});


router.post('/', async (req, res) => {
    try {
        const {
            pacienteId,
            pacienteNombre,
            pacienteApellido,
            doctorId,
            doctorNombre,
            fecha,
            tipo,
            descripcion,
            tratamiento,
            observaciones,
            citaId
        } = req.body;

        // Validaciones
        if (!pacienteId || !pacienteNombre || !pacienteApellido) {
            return res.status(400).json({ error: 'Datos del paciente requeridos' });
        }

        if (!descripcion) {
            return res.status(400).json({ error: 'La descripción del diagnóstico es requerida' });
        }

        const nuevoDiagnostico = new Diagnostico({
            pacienteId,
            pacienteNombre,
            pacienteApellido,
            doctorId: doctorId || 'default-doctor-id',
            doctorNombre: doctorNombre || 'Dr. Juan Pérez',
            fecha: fecha || new Date(),
            tipo: tipo || 'Diagnóstico general',
            descripcion,
            tratamiento: tratamiento || '',
            observaciones: observaciones || '',
            citaId: citaId || null
        });

        const diagnosticoGuardado = await nuevoDiagnostico.save();
        console.log('Diagnóstico creado:', diagnosticoGuardado._id);
        res.status(201).json(diagnosticoGuardado);
    } catch (error) {
        console.error('Error al crear diagnóstico:', error);
        res.status(500).json({ error: 'Error al crear diagnóstico', details: error.message });
    }
});

// Actualizar un diagnóstico
router.put('/:id', async (req, res) => {
    try {
        const {
            tipo,
            descripcion,
            tratamiento,
            observaciones
        } = req.body;

        const diagnosticoActualizado = await Diagnostico.findByIdAndUpdate(
            req.params.id,
            {
                tipo,
                descripcion,
                tratamiento,
                observaciones
            },
            { new: true, runValidators: true }
        );

        if (!diagnosticoActualizado) {
            return res.status(404).json({ error: 'Diagnóstico no encontrado' });
        }

        console.log('Diagnóstico actualizado:', diagnosticoActualizado._id);
        res.json(diagnosticoActualizado);
    } catch (error) {
        console.error('Error al actualizar diagnóstico:', error);
        res.status(500).json({ error: 'Error al actualizar diagnóstico' });
    }
});

// Eliminar un diagnóstico
router.delete('/:id', async (req, res) => {
    try {
        const diagnosticoEliminado = await Diagnostico.findByIdAndDelete(req.params.id);
        
        if (!diagnosticoEliminado) {
            return res.status(404).json({ error: 'Diagnóstico no encontrado' });
        }

        console.log('Diagnóstico eliminado:', diagnosticoEliminado._id);
        res.json({ 
            message: 'Diagnóstico eliminado exitosamente',
            diagnostico: diagnosticoEliminado 
        });
    } catch (error) {
        console.error('Error al eliminar diagnóstico:', error);
        res.status(500).json({ error: 'Error al eliminar diagnóstico' });
    }
});

module.exports = router;