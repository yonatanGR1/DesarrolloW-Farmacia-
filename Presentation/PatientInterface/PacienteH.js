// DoctorInterface.js - Portal del Paciente (SOLO LECTURA)
let currentPatient = null;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initializePatientPortal();
});

async function initializePatientPortal() {
    // Obtener datos del paciente desde el localStorage o sesión
    await loadPatientData();
    await loadAllPatientData();
    setupEventListeners();
    
    // Mostrar mensaje de bienvenida
    if (currentPatient) {
        document.getElementById('welcome-message').textContent = 
            `Bienvenido, ${currentPatient.nombre}`;
    }
}

// Cargar datos del paciente actual
async function loadPatientData() {
    try {
        // En un sistema real, esto vendría de tu API de autenticación
        // Por ahora, usaremos datos de ejemplo o del localStorage
        
        // Intentar obtener del localStorage primero
        const savedPatient = localStorage.getItem('currentPatient');
        if (savedPatient) {
            currentPatient = JSON.parse(savedPatient);
        } else {
            // Datos de ejemplo para demostración
            currentPatient = {
                _id: 'patient-123',
                nombre: 'Juan Carlos',
                apellido: 'García López',
                edad: 45,
                genero: 'Masculino',
                telefono: '555-123-4567',
                email: 'juan.garcia@email.com'
            };
            localStorage.setItem('currentPatient', JSON.stringify(currentPatient));
        }
        
        updatePatientInfo();
        
    } catch (error) {
        console.error('Error cargando datos del paciente:', error);
    }
}

// Actualizar información del paciente en la UI
function updatePatientInfo() {
    if (!currentPatient) return;
    
    document.getElementById('patient-name').textContent = 
        `${currentPatient.nombre} ${currentPatient.apellido}`;
    document.getElementById('patient-age').textContent = 
        `${currentPatient.edad} años`;
    document.getElementById('patient-gender').textContent = currentPatient.genero;
    document.getElementById('patient-phone').textContent = currentPatient.telefono;
    document.getElementById('patient-email').textContent = currentPatient.email;
    document.getElementById('user-display-name').textContent = 
        `${currentPatient.nombre} ${currentPatient.apellido}`;
}

// Cargar todos los datos del paciente
async function loadAllPatientData() {
    await loadPatientPrescriptions();
    await loadPatientAppointments();
    await loadPatientDiagnoses();
    updateSummaryCards();
}

// Cargar recetas del paciente desde MongoDB
async function loadPatientPrescriptions() {
    try {
        if (!currentPatient) return;
        
        // En un sistema real, conectar con tu API
        const response = await fetch(`/api/recetas/paciente/${currentPatient._id}`);
        if (!response.ok) throw new Error('Error al cargar recetas');
        
        const prescriptions = await response.json();
        renderPrescriptions(prescriptions);
        
    } catch (error) {
        console.error('Error cargando recetas:', error);
        // Datos de ejemplo si la API falla
        const examplePrescriptions = [
            {
                _id: '1',
                fechaEmision: '2024-01-15',
                fechaValidez: '2024-02-15',
                medicamentos: [
                    { nombre: 'Paracetamol', dosis: '500mg', frecuencia: 'Cada 8 horas', duracion: '5 días' },
                    { nombre: 'Ibuprofeno', dosis: '400mg', frecuencia: 'Cada 12 horas', duracion: '3 días' }
                ],
                instruccionesGenerales: 'Tomar después de los alimentos',
                doctorNombre: 'Dr. Roberto Martínez',
                estado: 'activa'
            }
        ];
        renderPrescriptions(examplePrescriptions);
    }
}

// Cargar citas del paciente desde MongoDB
async function loadPatientAppointments() {
    try {
        if (!currentPatient) return;
        
        const response = await fetch(`/api/citas/paciente/${currentPatient._id}`);
        if (!response.ok) throw new Error('Error al cargar citas');
        
        const appointments = await response.json();
        renderAppointments(appointments);
        
    } catch (error) {
        console.error('Error cargando citas:', error);
        // Datos de ejemplo
        const exampleAppointments = [
            {
                _id: '1',
                fechaCita: '2024-01-20',
                horaCita: '10:00',
                motivo: 'Consulta de seguimiento',
                doctorNombre: 'Dr. Roberto Martínez',
                estado: 'programada'
            }
        ];
        renderAppointments(exampleAppointments);
    }
}

// Cargar diagnósticos del paciente desde MongoDB
async function loadPatientDiagnoses() {
    try {
        if (!currentPatient) return;
        
        const response = await fetch(`/api/diagnosticos/paciente/${currentPatient._id}`);
        if (!response.ok) throw new Error('Error al cargar diagnósticos');
        
        const diagnoses = await response.json();
        renderDiagnoses(diagnoses);
        
    } catch (error) {
        console.error('Error cargando diagnósticos:', error);
        // Datos de ejemplo
        const exampleDiagnoses = [
            {
                _id: '1',
                fecha: '2024-01-15',
                diagnostico: 'Hipertensión arterial grado I',
                tratamiento: 'Modificación de estilo de vida y control periódico',
                observaciones: 'Paciente con presión arterial elevada en consulta',
                doctorNombre: 'Dr. Roberto Martínez'
            }
        ];
        renderDiagnoses(exampleDiagnoses);
    }
}

// Renderizar recetas (SOLO LECTURA)
function renderPrescriptions(prescriptions) {
    const container = document.getElementById('prescriptions-list');
    
    if (prescriptions.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No tiene recetas registradas</p>';
        return;
    }
    
    prescriptions.sort((a, b) => new Date(b.fechaEmision) - new Date(a.fechaEmision));
    
    container.innerHTML = prescriptions.map(prescription => {
        const isExpired = new Date(prescription.fechaValidez) < new Date();
        const statusClass = isExpired ? 'expired' : 'active';
        const statusText = isExpired ? 'Expirada' : 'Activa';
        
        return `
            <div class="prescription-card ${statusClass} border p-3 mb-3 rounded read-only-card">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="mb-1">Receta del ${formatDate(prescription.fechaEmision)}</h5>
                        <p class="mb-1"><strong>Válida hasta:</strong> ${formatDate(prescription.fechaValidez)}</p>
                        <p class="mb-1"><strong>Médico:</strong> ${prescription.doctorNombre}</p>
                        <span class="badge ${isExpired ? 'bg-danger' : 'bg-success'} status-badge">${statusText}</span>
                    </div>
                </div>
                
                <div class="mt-3">
                    <h6>Medicamentos Recetados:</h6>
                    ${prescription.medicamentos.map(med => `
                        <div class="medication-item border-bottom pb-2 mb-2">
                            <strong>${med.nombre} ${med.dosis}</strong><br>
                            <small class="text-muted">${med.frecuencia} ${med.duracion ? `por ${med.duracion}` : ''}</small>
                            ${med.instruccionesEspeciales ? `<br><small><em>Instrucciones: ${med.instruccionesEspeciales}</em></small>` : ''}
                        </div>
                    `).join('')}
                </div>
                
                ${prescription.instruccionesGenerales ? `
                    <div class="mt-2 p-2 bg-light rounded">
                        <strong>Instrucciones generales:</strong> ${prescription.instruccionesGenerales}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Renderizar citas (SOLO LECTURA)
function renderAppointments(appointments) {
    const container = document.getElementById('appointments-list');
    
    if (appointments.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No tiene citas programadas</p>';
        return;
    }
    
    appointments.sort((a, b) => new Date(a.fechaCita) - new Date(b.fechaCita));
    
    container.innerHTML = appointments.map(appointment => {
        const appointmentDate = new Date(appointment.fechaCita);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let statusClass = 'upcoming';
        let statusText = 'Próxima';
        
        if (appointmentDate < today) {
            statusClass = 'past';
            statusText = 'Completada';
        } else if (appointmentDate.getTime() === today.getTime()) {
            statusClass = 'today';
            statusText = 'Hoy';
        }
        
        return `
            <div class="appointment-card ${statusClass} border p-3 mb-3 rounded read-only-card">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="mb-1">${formatDate(appointment.fechaCita)}</h5>
                        <p class="mb-1"><strong>Hora:</strong> ${appointment.horaCita}</p>
                        <p class="mb-1"><strong>Médico:</strong> ${appointment.doctorNombre}</p>
                        <p class="mb-1"><strong>Motivo:</strong> ${appointment.motivo}</p>
                        <p class="mb-1"><strong>Estado:</strong> ${appointment.estado}</p>
                    </div>
                    <span class="badge ${getAppointmentBadgeClass(statusClass)} status-badge">${statusText}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Renderizar diagnósticos (SOLO LECTURA)
function renderDiagnoses(diagnoses) {
    const container = document.getElementById('diagnoses-list');
    
    if (diagnoses.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No tiene diagnósticos registrados</p>';
        return;
    }
    
    diagnoses.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    container.innerHTML = diagnoses.map(diagnosis => `
        <div class="diagnosis-card border p-3 mb-3 rounded read-only-card">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h5 class="mb-1">Consulta del ${formatDate(diagnosis.fecha)}</h5>
                    <p class="mb-1"><strong>Médico:</strong> ${diagnosis.doctorNombre}</p>
                </div>
            </div>
            
            <div class="mt-3">
                <div class="mb-3">
                    <h6 class="text-primary">Diagnóstico Principal:</h6>
                    <p class="mb-2 p-2 bg-light rounded">${diagnosis.diagnostico}</p>
                </div>
                
                <div class="mb-3">
                    <h6 class="text-success">Tratamiento Indicado:</h6>
                    <p class="mb-2 p-2 bg-light rounded">${diagnosis.tratamiento}</p>
                </div>
                
                ${diagnosis.observaciones ? `
                    <div class="mb-3">
                        <h6 class="text-info">Observaciones Médicas:</h6>
                        <p class="mb-0 p-2 bg-light rounded">${diagnosis.observaciones}</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Actualizar tarjetas de resumen
function updateSummaryCards() {
    // En un sistema real, estos números vendrían de las APIs
    const recetas = document.querySelectorAll('.prescription-card.active').length;
    const citas = document.querySelectorAll('.appointment-card.upcoming, .appointment-card.today').length;
    const diagnosticos = document.querySelectorAll('.diagnosis-card').length;
    
    document.getElementById('total-recetas').textContent = recetas;
    document.getElementById('total-citas').textContent = citas;
    document.getElementById('total-diagnosticos').textContent = diagnosticos;
    
    // Contar doctores únicos (ejemplo simplificado)
    const doctores = new Set();
    document.querySelectorAll('.prescription-card, .appointment-card, .diagnosis-card').forEach(card => {
        const doctorText = card.textContent.match(/Médico:\s*([^\n<]+)/);
        if (doctorText && doctorText[1]) {
            doctores.add(doctorText[1].trim());
        }
    });
    document.getElementById('total-doctores').textContent = doctores.size;
    
    // Actualizar próxima cita en el resumen
    const nextAppointment = document.querySelector('.appointment-card.upcoming, .appointment-card.today');
    if (nextAppointment) {
        const date = nextAppointment.querySelector('h5').textContent;
        const doctorMatch = nextAppointment.textContent.match(/Médico:\s*([^\n<]+)/);
        const doctor = doctorMatch ? doctorMatch[1].trim() : '';
        
        document.getElementById('next-appointment-date').textContent = date;
        document.getElementById('next-appointment-doctor').textContent = doctor ? `Con ${doctor}` : '';
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Búsqueda en tiempo real
    document.getElementById('search-prescriptions').addEventListener('input', function(e) {
        filterItems('prescriptions-list', e.target.value);
    });
    
    document.getElementById('search-appointments').addEventListener('input', function(e) {
        filterItems('appointments-list', e.target.value);
    });
    
    document.getElementById('search-diagnoses').addEventListener('input', function(e) {
        filterItems('diagnoses-list', e.target.value);
    });
}

// Filtrar items en listas
function filterItems(containerId, searchTerm) {
    const container = document.getElementById(containerId);
    const items = container.querySelectorAll('.prescription-card, .appointment-card, .diagnosis-card');
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchTerm.toLowerCase())) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Mostrar sección específica
function showSection(sectionName) {
    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Mostrar la sección seleccionada
    document.getElementById(`${sectionName}-section`).style.display = 'block';
    
    // Actualizar navegación activa
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Funciones auxiliares
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

function getAppointmentBadgeClass(status) {
    switch (status) {
        case 'past': return 'bg-secondary';
        case 'today': return 'bg-success';
        case 'upcoming': return 'bg-warning';
        default: return 'bg-primary';
    }
}

// Cerrar sesión
function logout() {
    if (confirm('¿Está seguro de que desea cerrar sesión?')) {
        localStorage.removeItem('currentPatient');
        window.location.href = 'Login.html';
    }
}