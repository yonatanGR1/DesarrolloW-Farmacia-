const express = require('express');
const router = express.Router();
const MedicationTracking = require('../models/MedicationTracking');
const mongoose = require('mongoose');


router.get('/paciente/:pacienteId', async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const { fecha } = req.query;
        
      
        if (!mongoose.Types.ObjectId.isValid(pacienteId)) {
            return res.status(400).json({ error: 'ID de paciente inválido' });
        }

        let query = { pacienteId: new mongoose.Types.ObjectId(pacienteId) };
        
        if (fecha) {
            const startDate = new Date(fecha);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(fecha);
            endDate.setHours(23, 59, 59, 999);
            query.fechaToma = { $gte: startDate, $lte: endDate };
        }

        const historial = await MedicationTracking.find(query)
            .populate('recetaId', 'fechaEmision doctorNombre')
            .sort({ fechaToma: -1 });

        res.json(historial);
    } catch (error) {
        console.error('Error al obtener historial de medicamentos:', error);
        res.status(500).json({ error: error.message });
    }
});


router.post('/registrar-toma', async (req, res) => {
    try {
        const {
            pacienteId,
            recetaId,
            medicamentoNombre,
            medicamentoDosis,
            fechaToma,
            horaProgramada,
            frecuencia,
            notas
        } = req.body;

        // Validaciones básicas
        if (!pacienteId || !recetaId || !medicamentoNombre) {
            return res.status(400).json({ error: 'Datos incompletos' });
        }

        const nuevoRegistro = new MedicationTracking({
            pacienteId: new mongoose.Types.ObjectId(pacienteId),
            recetaId: new mongoose.Types.ObjectId(recetaId),
            medicamentoNombre,
            medicamentoDosis,
            fechaToma: new Date(fechaToma),
            horaProgramada,
            frecuencia,
            notas,
            tomado: true,
            confirmado: true
        });

        await nuevoRegistro.save();
        
        // Populate para devolver datos completos
        await nuevoRegistro.populate('recetaId', 'fechaEmision doctorNombre');

        res.status(201).json(nuevoRegistro);
    } catch (error) {
        console.error('Error al registrar toma de medicamento:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener estadísticas de adherencia
router.get('/estadisticas/:pacienteId', async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const { inicio, fin } = req.query;

        // Validar que pacienteId sea un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(pacienteId)) {
            return res.status(400).json({ error: 'ID de paciente inválido' });
        }

        let fechaQuery = {};
        if (inicio && fin) {
            fechaQuery.fechaToma = {
                $gte: new Date(inicio),
                $lte: new Date(fin)
            };
        } else {
            
            const hace30Dias = new Date();
            hace30Dias.setDate(hace30Dias.getDate() - 30);
            fechaQuery.fechaToma = { $gte: hace30Dias };
        }

        const estadisticas = await MedicationTracking.aggregate([
            {
                $match: {
                    pacienteId: new mongoose.Types.ObjectId(pacienteId),
                    ...fechaQuery
                }
            },
            {
                $group: {
                    _id: {
                        fecha: { $dateToString: { format: "%Y-%m-%d", date: "$fechaToma" } },
                        medicamento: "$medicamentoNombre"
                    },
                    totalProgramado: { $sum: 1 },
                    totalTomado: { $sum: { $cond: ["$tomado", 1, 0] } }
                }
            },
            {
                $group: {
                    _id: "$_id.fecha",
                    medicamentos: {
                        $push: {
                            medicamento: "$_id.medicamento",
                            tomado: "$totalTomado",
                            programado: "$totalProgramado"
                        }
                    },
                    totalTomados: { $sum: "$totalTomado" },
                    totalProgramados: { $sum: "$totalProgramado" }
                }
            },
            {
                $project: {
                    fecha: "$_id",
                    medicamentos: 1,
                    porcentajeAdherencia: {
                        $round: [
                            { $multiply: [{ $divide: ["$totalTomados", "$totalProgramados"] }, 100] },
                            2
                        ]
                    },
                    totalTomados: 1,
                    totalProgramados: 1
                }
            },
            { $sort: { fecha: -1 } }
        ]);

        res.json(estadisticas);
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;