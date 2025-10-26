const mongoose = require('mongoose'); 

const medicationTrackingSchema = new mongoose.Schema({
    pacienteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paciente',
        required: true
    },
    recetaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Receta',
        required: true
    },
    medicamentoNombre: {
        type: String,
        required: true
    },
    medicamentoDosis: {
        type: String,
        required: true
    },
    fechaToma: {
        type: Date,
        required: true
    },
    tomado: {
        type: Boolean,
        default: false
    },
    confirmado: {
        type: Boolean,
        default: false
    },
    horaProgramada: String,
    frecuencia: String,
    notas: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Índices para búsquedas eficientes
medicationTrackingSchema.index({ pacienteId: 1, fechaToma: 1 });
medicationTrackingSchema.index({ recetaId: 1, medicamentoNombre: 1 });

module.exports = mongoose.model('MedicationTracking', medicationTrackingSchema);