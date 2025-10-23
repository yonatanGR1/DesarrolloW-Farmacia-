// models/Diagnostico.js
const mongoose = require('mongoose');

const DiagnosticoSchema = new mongoose.Schema({
    pacienteId: {
        type: String,
        required: true
    },
    pacienteNombre: {
        type: String,
        required: true
    },
    pacienteApellido: {
        type: String,
        required: true
    },
    doctorId: {
        type: String,
        default: 'default-doctor-id'
    },
    doctorNombre: {
        type: String,
        default: 'Dr. Juan Pérez'
    },
    fecha: {
        type: Date,
        default: Date.now,
        required: true
    },
    tipo: {
        type: String,
        default: 'Diagnóstico general'
    },
    descripcion: {
        type: String,
        required: true
    },
    tratamiento: {
        type: String,
        default: ''
    },
    observaciones: {
        type: String,
        default: ''
    },
    citaId: {
        type: String,
        default: null
    }
}, {
    timestamps: true // Añade createdAt y updatedAt automáticamente
});

module.exports = mongoose.model('Diagnostico', DiagnosticoSchema);