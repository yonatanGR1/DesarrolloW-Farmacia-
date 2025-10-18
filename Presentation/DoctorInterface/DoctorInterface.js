// DoctorInterface.js - Funcionalidad específica para médicos

// Datos de ejemplo específicos para doctores
const doctorPatients = [
    { id: 1, name: "Carlos", lastname: "Mendoza", age: 45, conditions: ["Hipertensión", "Diabetes tipo 2"] },
    { id: 3, name: "María", lastname: "López", age: 62, conditions: ["Artritis", "Osteoporosis"] },
    { id: 5, name: "Juan", lastname: "Pérez", age: 38, conditions: ["Asma", "Alergias estacionales"] }
];

const doctorAppointments = [
    { id: 1, patientId: 1, patientName: "Carlos Mendoza", date: "2023-09-15", time: "10:30", reason: "Control rutinario" },
    { id: 2, patientId: 3, patientName: "María López", date: "2023-09-16", time: "11:15", reason: "Dolor articular" },
    { id: 3, patientId: 5, patientName: "Juan Pérez", date: "2023-09-17", time: "09:00", reason: "Revisión de tratamiento" }
];

const doctorPrescriptions = [
    { id: 1, patientId: 1, medication: "Lisinopril", dose: "10mg", instructions: "Tomar una vez al día", date: "2023-08-10" },
    { id: 2, patientId: 1, medication: "Metformina", dose: "850mg", instructions: "Tomar con el desayuno y la cena", date: "2023-08-10" },
    { id: 3, patientId: 3, medication: "Ibuprofeno", dose: "400mg", instructions: "Tomar cada 8 horas si hay dolor", date: "2023-08-25" }
];

// Inicializar interfaz de médico
function initializeDoctorInterface() {
    loadDoctorPatients();
    loadDoctorAppointments();
    loadDoctorPrescriptions();
    
    // Configurar event listeners para navegación de médico
    const doctorNavButtons = document.querySelectorAll('.doctor-nav-btn');
    doctorNavButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            if (targetSection) {
                showDoctorSection(targetSection);
            }
        });
    });
}

// Cargar pacientes del médico
function loadDoctorPatients() {
    const container = document.getElementById('doctor-patients-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (doctorPatients.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No tiene pacientes asignados.</p>';
        return;
    }
    
    doctorPatients.forEach(patient => {
        const patientElement = document.createElement('div');
        patientElement.className = 'col-md-4 mb-4';
        patientElement.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${patient.name} ${patient.lastname}</h5>
                    <p class="card-text">Edad: ${patient.age} años</p>
                    <p class="card-text">
                        <strong>Condiciones:</strong><br>
                        ${patient.conditions.join(', ')}
                    </p>
                </div>
                <div class="card-footer">
                    <button class="btn btn-hospital" onclick="viewPatientDetails(${patient.id})">
                        Ver detalles
                    </button>
                </div>
            </div>
        `;
        container.appendChild(patientElement);
    });
}

// Cargar citas del médico
function loadDoctorAppointments() {
    const container = document.getElementById('doctor-appointments-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (doctorAppointments.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No tiene citas programadas.</p>';
        return;
    }
    
    doctorAppointments.forEach(appointment => {
        const appointmentElement = document.createElement('div');
        appointmentElement.className = 'list-group-item';
        appointmentElement.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">${appointment.patientName}</h5>
                <small>${appointment.date} a las ${appointment.time}</small>
            </div>
            <p class="mb-1">Motivo: ${appointment.reason}</p>
            <div class="btn-group mt-2">
                <button class="btn btn-sm btn-hospital" onclick="editAppointment(${appointment.id})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-sm btn-outline-hospital" onclick="cancelAppointment(${appointment.id})">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            </div>
        `;
        container.appendChild(appointmentElement);
    });
}

// Cargar recetas del médico
function loadDoctorPrescriptions() {
    const container = document.getElementById('doctor-prescriptions-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (doctorPrescriptions.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No ha emitido recetas.</p>';
        return;
    }
    
    doctorPrescriptions.forEach(prescription => {
        const patient = doctorPatients.find(p => p.id === prescription.patientId);
        const patientName = patient ? `${patient.name} ${patient.lastname}` : 'Paciente desconocido';
        
        const prescriptionElement = document.createElement('div');
        prescriptionElement.className = 'list-group-item';
        prescriptionElement.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">${patientName}</h5>
                <small>${prescription.date}</small>
            </div>
            <p class="mb-1"><strong>Medicamento:</strong> ${prescription.medication} ${prescription.dose}</p>
            <p class="mb-1"><strong>Instrucciones:</strong> ${prescription.instructions}</p>
            <div class="btn-group mt-2">
                <button class="btn btn-sm btn-hospital" onclick="renewPrescription(${prescription.id})">
                    <i class="fas fa-sync"></i> Renovar
                </button>
                <button class="btn btn-sm btn-outline-hospital" onclick="viewPrescription(${prescription.id})">
                    <i class="fas fa-eye"></i> Ver
                </button>
            </div>
        `;
        container.appendChild(prescriptionElement);
    });
}

// Función para mostrar sección específica en el panel médico
function showDoctorSection(sectionId) {
    // Ocultar todas las secciones
    const sections = document.querySelectorAll('.doctor-content-section');
    sections.forEach(section => section.classList.add('hidden'));
    
    // Mostrar la sección seleccionada
    document.getElementById(sectionId).classList.remove('hidden');
    
    // Actualizar botones activos
    const buttons = document.querySelectorAll('.doctor-nav-btn');
    buttons.forEach(button => button.classList.remove('active'));
    
    // Encontrar y activar el botón correspondiente
    const activeButton = Array.from(buttons).find(btn => btn.getAttribute('data-section') === sectionId);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// Funciones de acción para el médico
function viewPatientDetails(patientId) {
    alert(`Ver detalles del paciente con ID: ${patientId}`);
    // En una implementación real, esto cargaría una vista detallada del paciente
}

function editAppointment(appointmentId) {
    alert(`Editar cita con ID: ${appointmentId}`);
    // En una implementación real, esto abriría un formulario para editar la cita
}

function cancelAppointment(appointmentId) {
    if (confirm('¿Está seguro de que desea cancelar esta cita?')) {
        alert(`Cita con ID: ${appointmentId} cancelada`);
        // En una implementación real, esto eliminaría la cita y actualizaría la UI
    }
}

function renewPrescription(prescriptionId) {
    alert(`Renovar receta con ID: ${prescriptionId}`);
    // En una implementación real, esto crearía una nueva receta basada en la anterior
}

function viewPrescription(prescriptionId) {
    alert(`Ver receta con ID: ${prescriptionId}`);
    // En una implementación real, esto mostraría los detalles completos de la receta
}

// Función de cierre de sesión
function logout() {
    if (confirm('¿Está seguro de que desea cerrar sesión?')) {
        alert('Sesión cerrada correctamente.');
        // En una implementación real, aquí redirigirías al login
    }
}

// Inicializar la interfaz cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initializeDoctorInterface();
});
