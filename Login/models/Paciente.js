const mongoose = require("mongoose");
const personSchema = new mongoose.Schema({
    nombre:{type:String,required:true}, 
    apellido:{type:String,required:true}, 
    edad:{type:Number, required:true, min:0, max:120}, 
    genero: {type:String,enum:["Masculino","Femenino","Otro"], required: true}, // rol limitado a doctor o paciente
    telefono: {type:String, required:true,match:/^[0-9\\-]+$/}, 
    email:{type:String,required:true,unique:true},
    direccion:{type:String, required:true},
    registrado: { type: Boolean, default: false }, 
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
    recetas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Receta' }]
}); 

module.exports = mongoose.model("Paciente",personSchema);
