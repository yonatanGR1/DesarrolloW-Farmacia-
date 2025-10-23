// PacienteH.js - Portal del Paciente con Control de Medicamentos
let currentPatient = null;
let activeMedications = [];
let medicationHistory = [];

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
    await loadMedicationTracking();
    setupEventListeners();
    updateTodayDate();
}

// Cargar datos del paciente actual desde MongoDB
async function loadPatientData() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (!currentUser || !currentUser.email) {
            console.error('No hay usuario logueado');
            window.location.href = '/index.html';
            return;
        }

        console.log('Buscando paciente con email:', currentUser.email);

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

// Cargar y gestionar el control de medicamentos
async function loadMedicationTracking() {
    try {
        // Cargar historial desde localStorage o inicializar
        const storedHistory = localStorage.getItem(`medicationHistory_${currentPatient._id}`);
        medicationHistory = storedHistory ? JSON.parse(storedHistory) : [];
        
        // Procesar recetas para extraer medicamentos activos
        await processActiveMedications();
        renderMedications();
        updateMedicationProgress();
        
    } catch (error) {
        console.error('Error cargando control de medicamentos:', error);
    }
}

// Procesar recetas para obtener medicamentos activos
async function processActiveMedications() {
    try {
        if (!currentPatient || !currentPatient._id) return;
        
        const response = await fetch(`/api/recetas/paciente/${currentPatient._id}`);
        if (!response.ok) return;
        
        const prescriptions = await response.json();
        activeMedications = [];
        
        const today = new Date();
        
        prescriptions.forEach(prescription => {
            if (!prescription.medicamentos || !Array.isArray(prescription.medicamentos)) return;
            
            const prescriptionDate = new Date(prescription.fechaEmision);
            const validityDate = new Date(prescription.fechaValidez);
            
            // Solo procesar recetas válidas (no expiradas)
            if (validityDate >= today) {
                prescription.medicamentos.forEach(med => {
                    const medicationId = `${prescription._id}_${med.nombre}_${med.dosis}`;
                    
                    const existingMed = activeMedications.find(m => m.id === medicationId);
                    if (!existingMed) {
                        activeMedications.push({
                            id: medicationId,
                            nombre: med.nombre,
                            dosis: med.dosis,
                            frecuencia: med.frecuencia,
                            duracion: med.duracion,
                            instrucciones: med.instruccionesEspeciales || '',
                            recetaId: prescription._id,
                            recetaFecha: prescription.fechaEmision,
                            doctor: prescription.doctorNombre || 'Médico no especificado',
                            activo: true
                        });
                    }
                });
            }
        });
        
    } catch (error) {
        console.error('Error procesando medicamentos activos:', error);
    }
}

// Renderizar medicamentos para control
function renderMedications() {
    const container = document.getElementById('medications-list');
    
    if (!activeMedications || activeMedications.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-pills fa-3x mb-3"></i>
                <p>No tiene medicamentos activos para controlar</p>
                <small>Los medicamentos aparecerán aquí cuando tenga recetas activas</small>
            </div>
        `;
        return;
    }
    
    const today = new Date().toDateString();
    const todayHistory = medicationHistory.filter(record => 
        new Date(record.timestamp).toDateString() === today
    );
    
    container.innerHTML = activeMedications.map(med => {
        const takenToday = todayHistory.some(record => record.medicationId === med.id);
        const takenCount = medicationHistory.filter(record => 
            record.medicationId === med.id
        ).length;
        
        return `
            <div class="medication-card border p-3 mb-3 rounded ${takenToday ? 'border-success bg-light-success' : ''}">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h5 class="mb-1">${med.nombre} <small class="text-muted">${med.dosis}</small></h5>
                        <p class="mb-1"><strong>Frecuencia:</strong> ${med.frecuencia}</p>
                        <p class="mb-1"><strong>Duración:</strong> ${med.duracion || 'No especificada'}</p>
                        <p class="mb-1"><strong>Recetado por:</strong> ${med.doctor}</p>
                        ${med.instrucciones ? `<p class="mb-1"><strong>Instrucciones:</strong> ${med.instrucciones}</p>` : ''}
                        <small class="text-muted">Receta del ${formatDate(med.recetaFecha)}</small>
                    </div>
                    <div class="text-center ms-3">
                        <button class="btn ${takenToday ? 'btn-success' : 'btn-outline-primary'} btn-sm"
                                onclick="toggleMedicationTaken('${med.id}')"
                                ${takenToday ? 'disabled' : ''}>
                            <i class="fas ${takenToday ? 'fa-check' : 'fa-pills'} me-1"></i>
                            ${takenToday ? 'Tomado' : 'Marcar como Tomado'}
                        </button>
                        <div class="mt-1">
                            <small class="text-muted">Veces tomado: ${takenCount}</small>
                        </div>
                    </div>
                </div>
                ${takenToday ? `
                    <div class="mt-2 p-2 bg-success text-white rounded">
                        <i class="fas fa-check-circle me-1"></i>
                        Tomado hoy a las ${getLastTakenTime(med.id)}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Marcar/desmarcar medicamento como tomado
function toggleMedicationTaken(medicationId) {
    const today = new Date();
    const todayString = today.toDateString();
    
    // Verificar si ya fue tomado hoy
    const alreadyTaken = medicationHistory.some(record => 
        record.medicationId === medicationId && 
        new Date(record.timestamp).toDateString() === todayString
    );
    
    if (!alreadyTaken) {
        // Agregar registro de toma
        medicationHistory.push({
            medicationId: medicationId,
            timestamp: today.toISOString(),
            patientId: currentPatient._id
        });
        
        // Guardar en localStorage
        localStorage.setItem(`medicationHistory_${currentPatient._id}`, JSON.stringify(medicationHistory));
        
        // Actualizar UI
        renderMedications();
        updateMedicationProgress();
        updateSummaryCards();
        
        // Mostrar confirmación
        showNotification('Medicamento marcado como tomado', 'success');
    }
}

// Obtener hora de la última toma
function getLastTakenTime(medicationId) {
    const records = medicationHistory
        .filter(record => record.medicationId === medicationId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (records.length > 0) {
        const lastTaken = new Date(records[0].timestamp);
        return lastTaken.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    return '';
}

// Actualizar progreso de medicamentos
function updateMedicationProgress() {
    const today = new Date().toDateString();
    const todayHistory = medicationHistory.filter(record => 
        new Date(record.timestamp).toDateString() === today
    );
    
    const uniqueMedicationsTaken = new Set(todayHistory.map(record => record.medicationId));
    const totalActiveMeds = activeMedications.length;
    const takenToday = uniqueMedicationsTaken.size;
    
    const progressPercentage = totalActiveMeds > 0 ? Math.round((takenToday / totalActiveMeds) * 100) : 0;
    
    // Actualizar barra de progreso
    const progressBar = document.getElementById('daily-progress-bar');
    const progressText = document.getElementById('daily-progress-text');
    const dailySummary = document.getElementById('daily-summary');
    
    if (progressBar) {
        progressBar.style.width = `${progressPercentage}%`;
        progressBar.className = `progress-bar ${progressPercentage === 100 ? 'bg-success' : progressPercentage >= 50 ? 'bg-warning' : 'bg-danger'}`;
    }
    
    if (progressText) {
        progressText.textContent = `${progressPercentage}%`;
    }
    
    if (dailySummary) {
        dailySummary.textContent = `${takenToday} de ${totalActiveMeds} medicamentos tomados hoy`;
    }
    
    // Actualizar resumen en sección principal
    const todaySummary = document.getElementById('medications-today');
    const progressSmall = document.getElementById('medications-progress');
    
    if (todaySummary) {
        todaySummary.textContent = `${takenToday} de ${totalActiveMeds} medicamentos tomados`;
    }
    
    if (progressSmall) {
        progressSmall.textContent = `Progreso: ${progressPercentage}%`;
    }
    
    // Actualizar tarjeta de resumen
    document.getElementById('total-medicamentos-activos').textContent = totalActiveMeds;
    
    // Calcular adherencia semanal
    updateWeeklyAdherence();
}

// Calcular adherencia semanal
function updateWeeklyAdherence() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weekHistory = medicationHistory.filter(record => 
        new Date(record.timestamp) >= oneWeekAgo
    );
    
    const dailyMedications = {};
    weekHistory.forEach(record => {
        const date = new Date(record.timestamp).toDateString();
        if (!dailyMedications[date]) {
            dailyMedications[date] = new Set();
        }
        dailyMedications[date].add(record.medicationId);
    });
    
    let totalDays = 0;
    let adherentDays = 0;
    
    // Calcular para cada día de la semana pasada
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toDateString();
        
        // Solo contar días donde el paciente tenía medicamentos activos
        if (activeMedications.length > 0) {
            totalDays++;
            if (dailyMedications[dateString] && dailyMedications[dateString].size === activeMedications.length) {
                adherentDays++;
            }
        }
    }
    
    const adherenceRate = totalDays > 0 ? Math.round((adherentDays / totalDays) * 100) : 0;
    document.getElementById('weekly-adherence').textContent = `${adherenceRate}%`;
}

// Filtrar medicamentos
function filterMedications(filter) {
    const buttons = document.querySelectorAll('#medicamentos-section .btn-group .btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // En una implementación real, aquí se aplicarían los filtros
    renderMedications(); // Por ahora recargamos todos
}

// Actualizar fecha actual
function updateTodayDate() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('today-date').textContent = today.toLocaleDateString('es-ES', options);
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    // Crear notificación simple
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '1050';
    alertDiv.style.minWidth = '300px';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-remover después de 3 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 3000);
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
    
    // Contar medicamentos activos
    document.getElementById('total-medicamentos-activos').textContent = activeMedications.length;
    
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
    
    // Actualizar control de medicamentos del día
    const today = new Date().toDateString();
    const todayHistory = medicationHistory.filter(record => 
        new Date(record.timestamp).toDateString() === today
    );
    const uniqueMedicationsTaken = new Set(todayHistory.map(record => record.medicationId));
    
    document.getElementById('medications-today').textContent = 
        `${uniqueMedicationsTaken.size} de ${activeMedications.length} medicamentos tomados`;
    
    const progressPercentage = activeMedications.length > 0 ? 
        Math.round((uniqueMedicationsTaken.size / activeMedications.length) * 100) : 0;
    document.getElementById('medications-progress').textContent = `Progreso: ${progressPercentage}%`;
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
    
    document.getElementById('search-medications').addEventListener('input', function(e) {
        filterItems('medications-list', e.target.value);
    });
}

// Filtrar items en listas
function filterItems(containerId, searchTerm) {
    const container = document.getElementById(containerId);
    const items = container.querySelectorAll('.prescription-card, .appointment-card, .diagnosis-card, .medication-card');
    
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
    
    // Si es la sección de medicamentos, actualizar progreso
    if (sectionName === 'medicamentos') {
        updateMedicationProgress();
    }
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