// Agrega esto al inicio de PacienteH.js para debug
console.log('=== INICIANDO PORTAL PACIENTE ===');
console.log('currentUser en localStorage:', localStorage.getItem('currentUser'));
console.log('currentPatient en localStorage:', localStorage.getItem('currentPatient'));

const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser) {
    console.error('❌ NO HAY USUARIO EN LOCALSTORAGE');
} else {
    console.log('✅ Usuario encontrado:', currentUser);
}
// PacienteH.js - Portal del Paciente (SOLO LECTURA)
let currentPatient = null;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initializePatientPortal();
});

// Verificar autenticación del paciente
function checkAuthentication() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        alert('No hay sesión activa. Por favor, inicie sesión.');
        window.location.href = '/index.html';
        return;
    }
    
    if (currentUser.rol !== 'paciente') {
        alert('Acceso denegado. Esta sección es solo para pacientes.');
        window.location.href = '/index.html';
        return;
    }
}

async function initializePatientPortal() {
    await loadPatientData();
    await loadAllPatientData();
    setupEventListeners();
}

// Cargar datos del paciente actual desde MongoDB
async function loadPatientData() {
    try {
        // Obtener el usuario actual del localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (!currentUser || !currentUser.email) {
            console.error('No hay usuario logueado');
            window.location.href = '/index.html';
            return;
        }

        console.log('Buscando paciente con email:', currentUser.email);

        // Buscar paciente por email en MongoDB
        const response = await fetch(`/api/pacientes/email/${currentUser.email}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Paciente no encontrado. Contacte al administrador.');
            } else {
                throw new Error('Error del servidor al cargar datos');
            }
        }
        
        currentPatient = await response.json();
        console.log('Paciente encontrado:', currentPatient);
        
        // Guardar también en localStorage para uso futuro
        localStorage.setItem('currentPatient', JSON.stringify(currentPatient));
        
        updatePatientInfo();
        
    } catch (error) {
        console.error('Error cargando datos del paciente:', error);
        alert('Error: ' + error.message);
        window.location.href = '/index.html';
    }
}

// Actualizar información del paciente en la UI
function updatePatientInfo() {
    if (!currentPatient) return;
    
    document.getElementById('patient-name').textContent = 
        `${currentPatient.nombre} ${currentPatient.apellido}`;
    document.getElementById('patient-age').textContent = 
        `${currentPatient.edad} años`;
    document.getElementById('patient-gender').textContent = currentPatient.genero || 'No especificado';
    document.getElementById('patient-phone').textContent = currentPatient.telefono || 'No especificado';
    document.getElementById('patient-email').textContent = currentPatient.email || 'No especificado';
    document.getElementById('user-display-name').textContent = 
        `${currentPatient.nombre} ${currentPatient.apellido}`;
}

// Cargar todos los datos del paciente
async function loadAllPatientData() {
    if (!currentPatient) return;
    
    await loadPatientPrescriptions();
    await loadPatientAppointments();
    await loadPatientDiagnoses();
    updateSummaryCards();
}

// Cargar recetas del paciente desde MongoDB
async function loadPatientPrescriptions() {
    try {
        if (!currentPatient || !currentPatient._id) return;
        
        const response = await fetch(`/api/recetas/paciente/${currentPatient._id}`);
        
        if (!response.ok) {
            // Si no hay recetas, mostrar mensaje apropiado
            if (response.status === 404) {
                document.getElementById('prescriptions-list').innerHTML = 
                    '<p class="text-center text-muted">No tiene recetas registradas</p>';
                return;
            }
            throw new Error('Error al cargar recetas');
        }
        
        const prescriptions = await response.json();
        renderPrescriptions(prescriptions);
        
    } catch (error) {
        console.error('Error cargando recetas:', error);
        document.getElementById('prescriptions-list').innerHTML = 
            '<p class="text-center text-muted">No se pudieron cargar las recetas</p>';
    }
}

// Cargar citas del paciente desde MongoDB
async function loadPatientAppointments() {
    try {
        if (!currentPatient || !currentPatient._id) return;
        
        const response = await fetch(`/api/citas/paciente/${currentPatient._id}`);
        
        if (!response.ok) {
            // Si no hay citas, mostrar mensaje apropiado
            if (response.status === 404) {
                document.getElementById('appointments-list').innerHTML = 
                    '<p class="text-center text-muted">No tiene citas programadas</p>';
                return;
            }
            throw new Error('Error al cargar citas');
        }
        
        const appointments = await response.json();
        renderAppointments(appointments);
        
    } catch (error) {
        console.error('Error cargando citas:', error);
        document.getElementById('appointments-list').innerHTML = 
            '<p class="text-center text-muted">No se pudieron cargar las citas</p>';
    }
}

// Cargar diagnósticos del paciente desde MongoDB
async function loadPatientDiagnoses() {
    try {
        if (!currentPatient || !currentPatient._id) return;
        
        const response = await fetch(`/api/diagnosticos/paciente/${currentPatient._id}`);
        
        if (!response.ok) {
            // Si no hay diagnósticos, mostrar mensaje apropiado
            if (response.status === 404) {
                document.getElementById('diagnoses-list').innerHTML = 
                    '<p class="text-center text-muted">No tiene diagnósticos registrados</p>';
                return;
            }
            throw new Error('Error al cargar diagnósticos');
        }
        
        const diagnoses = await response.json();
        renderDiagnoses(diagnoses);
        
    } catch (error) {
        console.error('Error cargando diagnósticos:', error);
        document.getElementById('diagnoses-list').innerHTML = 
            '<p class="text-center text-muted">No se pudieron cargar los diagnósticos</p>';
    }
}

// Renderizar recetas (SOLO LECTURA)
function renderPrescriptions(prescriptions) {
    const container = document.getElementById('prescriptions-list');
    
    if (!prescriptions || prescriptions.length === 0) {
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
                        <p class="mb-1"><strong>Médico:</strong> ${prescription.doctorNombre || 'No especificado'}</p>
                        <span class="badge ${isExpired ? 'bg-danger' : 'bg-success'} status-badge">${statusText}</span>
                    </div>
                </div>
                
                <div class="mt-3">
                    <h6>Medicamentos Recetados:</h6>
                    ${(prescription.medicamentos && prescription.medicamentos.length > 0) ? 
                        prescription.medicamentos.map(med => `
                            <div class="medication-item border-bottom pb-2 mb-2">
                                <strong>${med.nombre} ${med.dosis}</strong><br>
                                <small class="text-muted">${med.frecuencia} ${med.duracion ? `por ${med.duracion}` : ''}</small>
                                ${med.instruccionesEspeciales ? `<br><small><em>Instrucciones: ${med.instruccionesEspeciales}</em></small>` : ''}
                            </div>
                        `).join('') : 
                        '<p class="text-muted">No se especificaron medicamentos</p>'
                    }
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
    
    if (!appointments || appointments.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No tiene citas programadas</p>';
        return;
    }
    
    appointments.sort((a, b) => new Date(a.fechaCita) - new Date(b.fechaCita));
    
    container.innerHTML = appointments.map(appointment => {
        const appointmentDate = new Date(appointment.fechaCita);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let statusClass = 'upcoming';
        let statusText = appointment.estado || 'Programada';
        
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
                        <p class="mb-1"><strong>Hora:</strong> ${appointment.horaCita || 'No especificada'}</p>
                        <p class="mb-1"><strong>Médico:</strong> ${appointment.doctorNombre || 'No especificado'}</p>
                        <p class="mb-1"><strong>Motivo:</strong> ${appointment.motivo || 'Consulta general'}</p>
                        <p class="mb-1"><strong>Estado:</strong> ${appointment.estado || 'Programada'}</p>
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
    
    if (!diagnoses || diagnoses.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No tiene diagnósticos registrados</p>';
        return;
    }
    
    diagnoses.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    container.innerHTML = diagnoses.map(diagnosis => `
        <div class="diagnosis-card border p-3 mb-3 rounded read-only-card">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h5 class="mb-1">Consulta del ${formatDate(diagnosis.fecha)}</h5>
                    <p class="mb-1"><strong>Médico:</strong> ${diagnosis.doctorNombre || 'No especificado'}</p>
                </div>
            </div>
            
            <div class="mt-3">
                <div class="mb-3">
                    <h6 class="text-primary">Diagnóstico Principal:</h6>
                    <p class="mb-2 p-2 bg-light rounded">${diagnosis.diagnostico || 'No especificado'}</p>
                </div>
                
                <div class="mb-3">
                    <h6 class="text-success">Tratamiento Indicado:</h6>
                    <p class="mb-2 p-2 bg-light rounded">${diagnosis.tratamiento || 'No especificado'}</p>
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
    if (!currentPatient) return;
    
    // Contar recetas activas
    const recetasActivas = document.querySelectorAll('.prescription-card.active').length;
    document.getElementById('total-recetas').textContent = recetasActivas;
    
    // Contar citas próximas
    const citasProximas = document.querySelectorAll('.appointment-card.upcoming, .appointment-card.today').length;
    document.getElementById('total-citas').textContent = citasProximas;
    
    // Contar diagnósticos
    const totalDiagnosticos = document.querySelectorAll('.diagnosis-card').length;
    document.getElementById('total-diagnosticos').textContent = totalDiagnosticos;
    
    // Contar doctores únicos
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
    
    // Actualizar última receta
    const lastPrescription = document.querySelector('.prescription-card');
    if (lastPrescription) {
        const date = lastPrescription.querySelector('h5').textContent.replace('Receta del ', '');
        const doctorMatch = lastPrescription.textContent.match(/Médico:\s*([^\n<]+)/);
        const doctor = doctorMatch ? doctorMatch[1].trim() : '';
        
        document.getElementById('last-prescription-date').textContent = date;
        document.getElementById('last-prescription-doctor').textContent = doctor ? `Por ${doctor}` : '';
    }
    
    // Actualizar último diagnóstico
    const lastDiagnosis = document.querySelector('.diagnosis-card');
    if (lastDiagnosis) {
        const date = lastDiagnosis.querySelector('h5').textContent.replace('Consulta del ', '');
        const doctorMatch = lastDiagnosis.textContent.match(/Médico:\s*([^\n<]+)/);
        const doctor = doctorMatch ? doctorMatch[1].trim() : '';
        
        document.getElementById('last-diagnosis-date').textContent = date;
        document.getElementById('last-diagnosis-doctor').textContent = doctor ? `Por ${doctor}` : '';
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
    try {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    } catch (error) {
        return 'Fecha no disponible';
    }
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
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentPatient');
        window.location.href = '/index.html';
    }
}