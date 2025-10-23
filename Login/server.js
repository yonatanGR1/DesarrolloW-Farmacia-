const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Archivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));
app.use('/Presentation', express.static(path.join(__dirname, "../Presentation")));
app.use('/pantallaPaciente', express.static(path.join(__dirname, "../pantallaPaciente")));

// Importar modelos
const User = require("./models/User");
const Paciente = require("./models/Paciente");
const Receta = require("./models/Receta"); 
const Cita = require("./models/Cita"); 
const Diagnostico = require("./models/Diagnostico");

// Verificar que los modelos se importaron correctamente
console.log("✅ Modelo User importado:", !!User);
console.log("✅ Modelo Paciente importado:", !!Paciente);
console.log("✅ Modelo Receta importado:", !!Receta);
console.log("✅ Modelo Cita importado:", !!Cita);
console.log("✅ Modelo Diagnostico importado:", !!Diagnostico);

// Conexión a MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/miLogin", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✓ Conectado a MongoDB"))
.catch(err => console.error("✗ Error al conectar a MongoDB:", err));

// ==================== RUTAS DE AUTENTICACIÓN ====================

// Ruta para Registrar usuarios 
app.post("/register", async (req, res) => {
  try {
    const { email, password, rol, nombre } = req.body;
    
    if (rol === "paciente") {
      const pacienteExistente = await Paciente.findOne({ email });
      if (!pacienteExistente) {
        return res.status(400).json({ error: "El correo no fue pre-registrado por un doctor. Pídale al doctor que lo agregue antes." });
      }
      if (pacienteExistente.registrado) {
        return res.status(400).json({ error: "Paciente ya registrado. Inicie sesión." });
      }
    }

    const existente = await User.findOne({ email });
    if (existente) {
      return res.status(400).json({ error: "El correo ya fue registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const nuevoUsuario = new User({
      ...req.body,
      password: hashedPassword,
    });
    await nuevoUsuario.save();

    if (rol === "paciente") {
      await Paciente.findOneAndUpdate({ email }, { registrado: true, user: nuevoUsuario._id });
    }

    res.status(201).json({
      mensaje: "Usuario Creado",
      usuario: {
        id: nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Ruta para Iniciar Sesión 
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const usuario = await User.findOne({ email });
    
    if (!usuario) {
      return res.status(401).json({ mensaje: "Usuario no encontrado" });
    }
    
    const esValida = await bcrypt.compare(password, usuario.password);
   
    if (!esValida) {
      return res.status(401).json({ mensaje: "Contraseña Incorrecta" });
    }
    
    console.log("Login exitoso para:", usuario.email);
    res.json({
      mensaje: "Login Exitoso",
      rol: usuario.rol,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error en el Login" });
  }
});

// Ruta temporal para reset password
app.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const usuario = await User.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true }
    );
    
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    
    res.json({ mensaje: "Contraseña actualizada", email: usuario.email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener todos los usuarios 
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

// ==================== RUTAS DE DOCTOR ====================

// Endpoint para que el doctor agregue un paciente
app.post("/api/doctor/add-paciente", async (req, res) => {
  try {
    const data = req.body;
    if (!data.email) {
      return res.status(400).json({ error: "Se requiere email del paciente" });
    }
    const existing = await Paciente.findOne({ email: data.email });
    if (existing) {
      return res.status(400).json({ error: "Paciente ya pre-registrado" });
    }
    const paciente = new Paciente({ ...data, registrado: false });
    await paciente.save();
    res.status(201).json({ message: "Paciente pre-registrado", paciente });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener pacientes de un doctor específico
app.get("/api/doctor/pacientes/:doctorId", async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const pacientes = await Paciente.find({ doctor: doctorId });
    res.json(pacientes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener los pacientes" });
  }
});

// ==================== RUTAS DE PACIENTES ====================

// Registrar nuevo paciente 
app.post("/api/pacientes", async (req, res) => {
  console.log("Nuevo paciente recibido");
  console.log(req.body);

  try {
    const { nombre, apellido, edad, genero, telefono, email, direccion } = req.body;
    
    const existente = await Paciente.findOne({ email });
    if (existente) {
      return res.status(400).json({ error: "El paciente ya fue registrado" });
    }

    const nuevoPaciente = new Paciente({
      nombre,
      apellido,
      edad,
      genero,
      telefono,
      email,
      direccion
    });

    await nuevoPaciente.save();

    res.status(201).json({ mensaje: "Paciente registrado", paciente: nuevoPaciente });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Obtener todos los pacientes 
app.get("/api/pacientes", async (req, res) => {
  console.log("Consultando pacientes registrados");
  try {
    const pacientes = await Paciente.find();

    console.table(pacientes.map(p => ({
      nombre: p.nombre,
      apellido: p.apellido,
      edad: p.edad,
      email: p.email
    })));

    res.json(pacientes);
  } catch (err) {
    console.error("Error al obtener pacientes:", err.message);
    res.status(500).json({ error: "Error al obtener los pacientes" });
  }
});

// Obtener paciente por ID
app.get("/api/pacientes/:id", async (req, res) => {
  console.log("Buscando paciente con id:", req.params.id);
  try {
    const paciente = await Paciente.findById(req.params.id);
    if (!paciente) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    res.json(paciente);
  } catch (error) {
    res.status(500).json({ error: "Error al buscar el paciente" });
  }
});

// Obtener paciente por email
app.get("/api/pacientes/email/:email", async (req, res) => {
  try {
    const paciente = await Paciente.findOne({ email: req.params.email });
    if (!paciente) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }
    res.json(paciente);
  } catch (error) {
    console.error("Error al buscar paciente por email:", error);
    res.status(500).json({ error: "Error al buscar el paciente" });
  }
});

// Actualizar paciente por ID
app.put("/api/pacientes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, edad, genero, telefono, email, direccion } = req.body;

    if (!nombre || !apellido || !edad || !genero || !telefono || !email) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const pacienteActualizado = await Paciente.findByIdAndUpdate(
      id,
      { nombre, apellido, edad, genero, telefono, email, direccion },
      { new: true }
    );

    if (!pacienteActualizado) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    res.status(200).json({
      mensaje: "Paciente actualizado correctamente",
      paciente: pacienteActualizado
    });
  } catch (error) {
    console.error("Error al actualizar el paciente:", error);
    res.status(500).json({ error: "Error al actualizar el paciente" });
  }
});

// Eliminar paciente por ID
app.delete('/api/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'ID inválido' });
    }

    const eliminado = await Paciente.findByIdAndDelete(id);
    if (!eliminado) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    return res.json({ message: 'Paciente eliminado', paciente: eliminado });
  } catch (error) {
    console.error('Error eliminando paciente:', error);
    return res.status(500).json({ error: 'Error del servidor' });
  }
});

// ==================== IMPORTAR Y USAR RUTAS MODULARES ====================

// Rutas de Recetas
const recetasRoutes = require('./routes/recetas');
app.use('/api/recetas', recetasRoutes);

// Rutas de Citas
const citasRoutes = require('./routes/citas'); 
app.use('/api/citas', citasRoutes); 

// Rutas de Diagnósticos
const diagnosticosRoutes = require('./routes/Diagnosticos');
app.use('/api/diagnosticos', diagnosticosRoutes);

// Rutas de Medication Tracking
const medicationTrackingRoutes = require('./routes/medicationTracking');
app.use('/api/medication-tracking', medicationTrackingRoutes);

// ==================== RUTAS ESPECÍFICAS PARA VISTAS DE PACIENTE ====================

// Obtener recetas por paciente
app.get("/api/recetas/paciente/:pacienteId", async (req, res) => {
  try {
    const recetas = await Receta.find({ pacienteId: req.params.pacienteId })
                              .sort({ fechaEmision: -1 });
    res.json(recetas);
  } catch (error) {
    console.error("Error al obtener recetas del paciente:", error);
    res.status(500).json({ error: "Error al obtener recetas" });
  }
});

// Obtener citas por paciente
app.get("/api/citas/paciente/:pacienteId", async (req, res) => {
  try {
    const citas = await Cita.find({ pacienteId: req.params.pacienteId })
                           .sort({ fechaCita: 1 });
    res.json(citas);
  } catch (error) {
    console.error("Error al obtener citas del paciente:", error);
    res.status(500).json({ error: "Error al obtener citas" });
  }
});

// Obtener diagnósticos por paciente
app.get("/api/diagnosticos/paciente/:pacienteId", async (req, res) => {
  try {
    const diagnosticos = await Diagnostico.find({ pacienteId: req.params.pacienteId })
                                         .sort({ fecha: -1 });
    res.json(diagnosticos);
  } catch (error) {
    console.error("Error al obtener diagnósticos del paciente:", error);
    res.status(500).json({ error: "Error al obtener diagnósticos" });
  }
});

// ==================== RUTA RAÍZ ====================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== MANEJADOR DE ERRORES 404 ====================

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ==================== INICIAR SERVIDOR ====================

app.listen(PORT, () => {
  console.log(`\n✓ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`✓ Rutas API disponibles:`);
  console.log(`  - POST   /register`);
  console.log(`  - POST   /login`);
  console.log(`  - GET    /api/users`);
  console.log(`  - GET    /api/pacientes`);
  console.log(`  - POST   /api/pacientes`);
  console.log(`  - GET    /api/pacientes/:id`);
  console.log(`  - PUT    /api/pacientes/:id`);
  console.log(`  - DELETE /api/pacientes/:id`);
  console.log(`  - GET    /api/citas`);
  console.log(`  - POST   /api/citas`);
  console.log(`  - GET    /api/recetas`);
  console.log(`  - POST   /api/recetas`);
  console.log(`  - GET    /api/diagnosticos`);
  console.log(`  - POST   /api/diagnosticos`);
  console.log(`  - GET    /api/medication-tracking\n`);
});

module.exports = app;