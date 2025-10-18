const mongoose = require("mongoose");

const recetaSchema = new mongoose.Schema({
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Paciente', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  medicamentos: [
    {
      nombre: { type: String, required: true },
      dosis: String,
      frecuencia: String,
      duracion: String,
      notas: String
    }
  ],
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Receta", recetaSchema);
