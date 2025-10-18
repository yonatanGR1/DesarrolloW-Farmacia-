// Citas.js - Funcionalidad específica para gestión de citas

// Datos de ejemplo para pacientes (compartidos con el módulo de pacientes)
const doctorPatients = JSON.parse(localStorage.getItem('medicalPatients')) || [
    { id: 1, name: "Carlos", lastname: "Mendoza", age: 45, conditions: ["Hipertensión", "Diabetes tipo 2"] },
    { id: 3, name: "María", lastname: "López", age: 62, conditions: ["Artritis", "Osteoporosis"] },
    { id: 5, name: "Juan", lastname: "Pérez", age: 38, conditions: ["Asma", "Alergias estacionales"] }
];

// Datos para la gestión de citas
let medicalAppointments = JSON.parse(localStorage.getItem('medicalAppointments')) || [];

// Inicializar gestión de citas
function initializeAppointmentManager() {
    loadPatientOptions();
    loadScheduledAppointments();
    
    // Configurar el formulario
    document.getElementById('appointmentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        scheduleAppointment();
    });
    
    // Establecer la fecha mínima como hoy
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointmentDate').setAttribute('min', today);
    
    // Verificar si hay un paciente seleccionado desde el módulo de pacientes
    checkSelectedPatient();
}

// Verificar si hay un paciente seleccionado desde pacientes
function checkSelectedPatient() {
    const selectedPatientId = localStorage.getItem('selectedPatientForAppointment');
    
    if (selectedPatientId) {
        // Encontrar el paciente en la lista
        const patient = doctorPatients.find(p => p.id == selectedPatientId);
        if (patient) {
            // Seleccionar automáticamente el paciente en el dropdown
            document.getElementById('patientSelect').value = selectedPatientId;
            
            // Mostrar mensaje informativo
            showPatientSelectionMessage(patient);
        }
        
        // Limpiar la selección para futuras visitas
        localStorage.removeItem('selectedPatientForAppointment');
    }
}

// Mostrar mensaje cuando un paciente es seleccionado automáticamente
function showPatientSelectionMessage(patient) {
    const form = document.getElementById('appointmentForm');
    const existingMessage = document.getElementById('patientSelectionMessage');
    
    // Remover mensaje anterior si existe
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Crear y mostrar nuevo mensaje
    const messageDiv = document.createElement('div');
    messageDiv.id = 'patientSelectionMessage';
    messageDiv.className = 'alert alert-info alert-dismissible fade show';
    messageDiv.innerHTML = `
        <i class="fas fa-info-circle me-2"></i>
        <strong>Paciente seleccionado:</strong> ${patient.name} ${patient.lastname}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    form.insertBefore(messageDiv, form.firstChild);
    
    // Desplazarse al formulario
    form.scrollIntoView({ behavior: 'smooth' });
}

// Cargar opciones de pacientes en el selector
function loadPatientOptions() {
    const patientSelect = document.getElementById('patientSelect');
    patientSelect.innerHTML = '<option value="">Seleccionar paciente...</option>';
    
    doctorPatients.forEach(patient => {
        const option = document.createElement('option');
        option.value = patient.id;
        option.textContent = `${patient.name} ${patient.lastname} (${patient.age} años)`;
        patientSelect.appendChild(option);
    });
}

// Cargar citas programadas
function loadScheduledAppointments() {
    const container = document.getElementById('scheduledAppointments');
    container.innerHTML = '';
    
    if (medicalAppointments.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No hay citas programadas.</p>';
        return;
    }
    
    // Ordenar citas por fecha y hora
    medicalAppointments.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA - dateB;
    });
    
    medicalAppointments.forEach(appointment => {
        const patient = doctorPatients.find(p => p.id == appointment.patientId);
        const patientName = patient ? `${patient.name} ${patient.lastname}` : 'Paciente desconocido';
        
        const appointmentElement = document.createElement('div');
        appointmentElement.className = 'list-group-item appointment-card';
        appointmentElement.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">${patientName}</h5>
                <small>${formatAppointmentDate(appointment.date)}</small>
            </div>
            <p class="mb-1"><strong>Hora:</strong> ${appointment.time}</p>
            <p class="mb-1">${appointment.reason || 'Sin motivo especificado'}</p>
            <div class="appointment-actions">
                <button class="btn btn-sm btn-hospital" onclick="editExistingAppointment(${appointment.id})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="cancelScheduledAppointment(${appointment.id})">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            </div>
        `;
        container.appendChild(appointmentElement);
    });
}

// Programar una nueva cita
function scheduleAppointment() {
    const patientId = document.getElementById('patientSelect').value;
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;
    const reason = document.getElementById('appointmentReason').value;
    
    if (!patientId || !date || !time) {
        alert('Por favor, complete todos los campos obligatorios.');
        return;
    }
    
    const newAppointment = {
        id: Date.now(),
        patientId: parseInt(patientId),
        date,
        time,
        reason,
        status: 'programada',
        createdAt: new Date().toISOString()
    };
    
    medicalAppointments.push(newAppointment);
    saveAppointments();
    loadScheduledAppointments();
    
    // Reiniciar formulario
    document.getElementById('appointmentForm').reset();
    
    // Remover mensaje de selección si existe
    const messageDiv = document.getElementById('patientSelectionMessage');
    if (messageDiv) {
        messageDiv.remove();
    }
    
    alert('Cita agendada correctamente.');
}

// Guardar citas en localStorage
function saveAppointments() {
    localStorage.setItem('medicalAppointments', JSON.stringify(medicalAppointments));
}

// Formatear fecha para mostrar
function formatAppointmentDate(dateString) {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

// Editar cita existente
function editExistingAppointment(appointmentId) {
    const appointment = medicalAppointments.find(a => a.id === appointmentId);
    if (!appointment) return;
    
    // Llenar el formulario con los datos de la cita
    document.getElementById('patientSelect').value = appointment.patientId;
    document.getElementById('appointmentDate').value = appointment.date;
    document.getElementById('appointmentTime').value = appointment.time;
    document.getElementById('appointmentReason').value = appointment.reason || '';
    
    // Eliminar la cita existente
    cancelScheduledAppointment(appointmentId, false);
    
    // Desplazarse al formulario
    document.getElementById('appointmentForm').scrollIntoView({ behavior: 'smooth' });
}

// Cancelar cita programada
function cancelScheduledAppointment(appointmentId, confirm = true) {
    if (confirm && !window.confirm('¿Está seguro de que desea cancelar esta cita?')) {
        return;
    }
    
    medicalAppointments = medicalAppointments.filter(a => a.id !== appointmentId);
    saveAppointments();
    loadScheduledAppointments();
}

// Función de cierre de sesión
function logout() {
    if (confirm('¿Está seguro de que desea cerrar sesión?')) {
        alert('Sesión cerrada correctamente.');
        window.location.href = '../DoctorInterface.html';
    }
}

// Inicializar la gestión de citas cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initializeAppointmentManager();
});
