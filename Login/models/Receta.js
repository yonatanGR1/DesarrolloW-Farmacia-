const mongoose = require('mongoose');

const recetaSchema = new mongoose.Schema({
  pacienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',
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
  pacienteEdad: {
    type: Number,
    required: true
  },
  pacienteGenero: {
    type: String,
    required: true
  },
  fechaEmision: {
    type: Date,
    required: true
  },
  fechaValidez: {
    type: Date,
    required: true
  },
  medicamentos: [{
    nombre: {
      type: String,
      required: true
    },
    dosis: {
      type: String,
      required: true
    },
    frecuencia: {
      type: String,
      required: true
    },
    duracion: {
      type: String,
      default: ''
    },
    instruccionesEspeciales: {
      type: String,
      default: ''
    }
  }],
  instruccionesGenerales: {
    type: String,
    default: ''
  },
  notasMedico: {
    type: String,
    default: ''
  },
  doctorNombre: {
    type: String,
    required: true
  },
  estado: {
    type: String,
    enum: ['activa', 'expirada', 'cancelada'],
    default: 'activa'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Receta', recetaSchema);