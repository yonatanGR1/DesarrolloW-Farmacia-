const mongoose = require('mongoose');

const diagnosticoSchema = new mongoose.Schema({
    paciente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paciente',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fecha: {
        type: Date,
        default: Date.now
    },
    diagnostico: String,
    tratamiento: String,
    observaciones: String,
    doctorNombre: String
});

module.exports = mongoose.model('Diagnostico', diagnosticoSchema);