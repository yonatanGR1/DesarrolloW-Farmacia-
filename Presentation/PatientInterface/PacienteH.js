// PacienteH.js - Portal del Paciente con Control de Medicamentos en Tiempo Real
let currentPatient = null;
let activeMedications = [];
let medicationHistory = [];
let notifications = [];
let notificationCheckInterval = null;

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
    initializeNotifications();
    setupEventListeners();
    updateTodayDate();
    
    // Actualizar cada minuto para mostrar tiempos reales
    setInterval(updateMedicationDisplays, 60000);
    
    // Limpiar notificaciones antiguas cada día
    setInterval(cleanOldNotifications, 24 * 60 * 60 * 1000);
}

// ========== SIDEBAR DE NOTIFICACIONES ==========

// Inicializar sistema de notificaciones
function initializeNotifications() {
    loadNotifications();
    startNotificationChecker();
    updateNotificationDisplay();
}

// Cargar notificaciones desde localStorage
function loadNotifications() {
    const stored = localStorage.getItem('patientNotifications');
    if (stored) {
        notifications = JSON.parse(stored);
    }
}

// Guardar notificaciones en localStorage
function saveNotifications() {
    localStorage.setItem('patientNotifications', JSON.stringify(notifications));
}

// Iniciar verificador de notificaciones
function startNotificationChecker() {
    // Verificar cada 30 segundos
    notificationCheckInterval = setInterval(checkMedicationNotifications, 30000);
    // Verificar inmediatamente al cargar
    checkMedicationNotifications();
}

// Verificar notificaciones de medicamentos
function checkMedicationNotifications() {
    if (!activeMedications || activeMedications.length === 0) return;

    const now = new Date();
    
    activeMedications.forEach(med => {
        const disponibilidad = calcularDisponibilidadMedicamento(med.nombre, med.recetaId, med.frecuencia);
        
        // Si el medicamento está disponible y no tenemos una notificación reciente
        if (disponibilidad.disponible) {
            const existingNotification = notifications.find(n => 
                n.medicationId === med.id && 
                n.type === 'medication_available' &&
                !n.read
            );

            if (!existingNotification) {
                addNotification({
                    type: 'medication_available',
                    title: '💊 Medicamento Disponible',
                    message: `${med.nombre} está listo para tomar`,
                    medicationId: med.id,
                    medicationName: med.nombre,
                    timestamp: new Date().toISOString(),
                    read: false
                });
            }
        }

        // Notificación para medicamentos que pronto estarán disponibles
        if (disponibilidad.proximaToma) {
            const tiempoRestante = new Date(disponibilidad.proximaToma) - now;
            // Notificar 5 minutos antes de que esté disponible
            if (tiempoRestante > 0 && tiempoRestante <= 5 * 60 * 1000) {
                const existingReminder = notifications.find(n => 
                    n.medicationId === med.id && 
                    n.type === 'medication_reminder' &&
                    !n.read
                );

                if (!existingReminder) {
                    addNotification({
                        type: 'medication_reminder',
                        title: '⏰ Recordatorio de Medicamento',
                        message: `${med.nombre} estará disponible en 5 minutos`,
                        medicationId: med.id,
                        medicationName: med.nombre,
                        timestamp: new Date().toISOString(),
                        read: false
                    });
                }
            }
        }
    });
}

// Agregar nueva notificación
function addNotification(notification) {
    notification.id = Date.now().toString();
    notifications.unshift(notification);
    saveNotifications();
    updateNotificationDisplay();
    
    // Mostrar notificación toast si la página está visible
    if (document.visibilityState === 'visible') {
        showNotificationToast(notification);
    }
}

// Mostrar notificación toast
function showNotificationToast(notification) {
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `
        <div class="toast show" role="alert">
            <div class="toast-header ${getNotificationColor(notification.type)}">
                <strong class="me-auto">${notification.title}</strong>
                <small>ahora</small>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${notification.message}
                <div class="mt-2 pt-2 border-top">
                    <button type="button" class="btn btn-primary btn-sm" onclick="handleNotificationAction('${notification.id}')">
                        Ver Medicamentos
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto-remover después de 8 segundos
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 8000);
}

// Obtener color para el tipo de notificación
function getNotificationColor(type) {
    const colors = {
        'medication_available': 'bg-success text-white',
        'medication_reminder': 'bg-warning text-dark',
        'medication_taken': 'bg-info text-white',
        'appointment_reminder': 'bg-primary text-white',
        'general': 'bg-primary text-white'
    };
    return colors[type] || 'bg-primary text-white';
}

// Alternar la sidebar de notificaciones
function toggleNotificationsSidebar() {
    const sidebar = document.getElementById('notifications-sidebar');
    const overlay = document.getElementById('notifications-overlay');
    const body = document.body;
    
    if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
        body.classList.remove('sidebar-open');
    } else {
        sidebar.classList.add('open');
        overlay.classList.add('show');
        body.classList.add('sidebar-open');
        updateNotificationDisplay();
    }
}

// Actualizar display de notificaciones - VERSIÓN MEJORADA CON SIDEBAR
function updateNotificationDisplay() {
    const badge = document.getElementById('notification-badge');
    const notificationList = document.getElementById('notification-list');
    
    if (!badge || !notificationList) return;
    
    const unreadCount = notifications.filter(n => !n.read).length;
    
    // Actualizar badge
    if (unreadCount > 0) {
        badge.style.display = 'block';
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount.toString();
    } else {
        badge.style.display = 'none';
    }
    
    // Actualizar lista de notificaciones en la sidebar
    if (notifications.length === 0) {
        notificationList.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-bell-slash fs-3 mb-2 d-block"></i>
                <small>No hay notificaciones</small>
            </div>
        `;
    } else {
        notificationList.innerHTML = notifications.map(notification => `
            <div class="notification-item ${notification.read ? '' : 'unread'} ${getNotificationBorderClass(notification.type)}" 
                 onclick="markNotificationAsRead('${notification.id}')">
                <div class="d-flex w-100 justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1 ${notification.read ? '' : 'text-primary'}">
                            ${!notification.read ? '<span class="unread-indicator"></span>' : ''}
                            ${notification.title}
                        </h6>
                        <p class="mb-1 small">${notification.message}</p>
                        <small class="text-muted">${formatDateTime(notification.timestamp)}</small>
                    </div>
                </div>
                ${notification.medicationName ? `
                    <div class="mt-2">
                        <small class="text-muted">
                            <i class="fas fa-pills me-1"></i>${notification.medicationName}
                        </small>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }
}

// Obtener clase de borde para notificación
function getNotificationBorderClass(type) {
    const classes = {
        'medication_available': 'notification-success',
        'medication_reminder': 'notification-warning',
        'medication_taken': 'notification-info',
        'appointment_reminder': 'notification-primary',
        'general': 'notification-primary'
    };
    return classes[type] || 'notification-primary';
}

// Marcar notificación como leída
function markNotificationAsRead(notificationId) {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
        notification.read = true;
        saveNotifications();
        updateNotificationDisplay();
        
        // Si es una notificación de medicamento, redirigir a la sección
        if (notification.type.includes('medication')) {
            showSection('medicamentos');
            toggleNotificationsSidebar();
        }
    }
}

// Marcar todas como leídas
function markAllAsRead() {
    notifications.forEach(notification => {
        notification.read = true;
    });
    saveNotifications();
    updateNotificationDisplay();
}

// Manejar acción de notificación
function handleNotificationAction(notificationId) {
    markNotificationAsRead(notificationId);
    showSection('medicamentos');
    toggleNotificationsSidebar();
}

// Limpiar notificaciones antiguas (más de 7 días)
function cleanOldNotifications() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    notifications = notifications.filter(notification => 
        new Date(notification.timestamp) > sevenDaysAgo
    );
    saveNotifications();
    updateNotificationDisplay();
}

// ========== FUNCIONES EXISTENTES MODIFICADAS ==========

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

// Cargar y gestionar el control de medicamentos desde MongoDB
async function loadMedicationTracking() {
    try {
        if (!currentPatient) return;
        
        console.log('🔄 Cargando control de medicamentos...');
        
        // Cargar medicamentos activos desde recetas
        await processActiveMedications();
        
        // Cargar historial completo desde MongoDB
        await loadMedicationHistory();
        
        renderMedications();
        updateMedicationProgress();
        
        console.log('✅ Control de medicamentos cargado correctamente');
        
    } catch (error) {
        console.error('❌ Error cargando control de medicamentos:', error);
        showNotification('Error al cargar el control de medicamentos', 'error');
    }
}

// Cargar historial de medicamentos desde MongoDB
async function loadMedicationHistory(fecha = null) {
    try {
        let url = `/api/medication-tracking/paciente/${currentPatient._id}`;
        if (fecha) {
            url += `?fecha=${fecha}`;
        }
        
        console.log('🔍 Cargando historial desde:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            console.error('❌ Error en respuesta:', response.status);
            throw new Error('Error al cargar historial');
        }
        
        medicationHistory = await response.json();
        console.log('✅ Historial cargado desde MongoDB:', medicationHistory.length, 'registros');
        
    } catch (error) {
        console.error('❌ Error cargando historial:', error);
        medicationHistory = [];
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
            
            const validityDate = new Date(prescription.fechaValidez);
            
            // Solo procesar recetas válidas (no expiradas)
            if (validityDate >= today) {
                prescription.medicamentos.forEach(med => {
                    const medicationId = `${prescription._id}_${med.nombre}`;
                    
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
                            activo: true,
                            horaRecomendada: calcularHoraRecomendada(med.frecuencia)
                        });
                    }
                });
            }
        });
        
        console.log('💊 Medicamentos activos procesados:', activeMedications.length);
        
    } catch (error) {
        console.error('Error procesando medicamentos activos:', error);
    }
}

// Calcular hora recomendada basada en la frecuencia
function calcularHoraRecomendada(frecuencia) {
    const frecuencias = {
        'una vez al día': '08:00',
        'cada 12 horas': '08:00 y 20:00',
        'cada 8 horas': '08:00, 16:00 y 00:00',
        'cada 6 horas': '06:00, 12:00, 18:00 y 00:00',
        'antes de dormir': '22:00',
        'en la mañana': '08:00',
        'en la tarde': '14:00',
        'en la noche': '20:00'
    };
    
    return frecuencias[frecuencia.toLowerCase()] || '08:00';
}

// ========== SISTEMA DE CONTROL POR TIEMPO REAL ==========

// Calcular si un medicamento debe mostrarse como disponible para tomar
function calcularDisponibilidadMedicamento(medicamentoNombre, recetaId, frecuencia) {
    try {
        // Obtener todas las tomas de este medicamento, ordenadas por fecha (más reciente primero)
        const tomasMedicamento = medicationHistory
            .filter(record => 
                record.medicamentoNombre === medicamentoNombre && 
                record.recetaId._id === recetaId
            )
            .sort((a, b) => new Date(b.fechaToma) - new Date(a.fechaToma));

        // Si no hay tomas previas, está disponible
        if (tomasMedicamento.length === 0) {
            return { 
                disponible: true, 
                ultimaToma: null, 
                proximaToma: null,
                tiempoTranscurrido: null
            };
        }

        const ultimaToma = tomasMedicamento[0];
        const ahora = new Date();
        const tiempoDesdeUltimaToma = ahora - new Date(ultimaToma.fechaToma);
        
        // Convertir frecuencia a milisegundos
        const frecuenciaMs = convertirFrecuenciaAMilisegundos(frecuencia);
        
        // Si ha pasado el tiempo de la frecuencia, está disponible
        if (tiempoDesdeUltimaToma >= frecuenciaMs) {
            return { 
                disponible: true, 
                ultimaToma: ultimaToma,
                proximaToma: null,
                tiempoTranscurrido: tiempoDesdeUltimaToma
            };
        } else {
            // Calcular cuándo estará disponible
            const proximaToma = new Date(new Date(ultimaToma.fechaToma).getTime() + frecuenciaMs);
            return { 
                disponible: false, 
                ultimaToma: ultimaToma,
                proximaToma: proximaToma,
                tiempoTranscurrido: tiempoDesdeUltimaToma
            };
        }
        
    } catch (error) {
        console.error('Error calculando disponibilidad:', error);
        return { 
            disponible: true, 
            ultimaToma: null, 
            proximaToma: null,
            tiempoTranscurrido: null
        };
    }
}

// Convertir frecuencia a milisegundos
function convertirFrecuenciaAMilisegundos(frecuencia) {
    const frecuencias = {
        'cada 6 horas': 6 * 60 * 60 * 1000,      // 6 horas en milisegundos
        'cada 8 horas': 8 * 60 * 60 * 1000,      // 8 horas en milisegundos  
        'cada 12 horas': 12 * 60 * 60 * 1000,    // 12 horas en milisegundos
        'una vez al día': 24 * 60 * 60 * 1000,   // 24 horas en milisegundos
        'cada 24 horas': 24 * 60 * 60 * 1000,    // 24 horas en milisegundos
        'cada 48 horas': 48 * 60 * 60 * 1000,    // 48 horas en milisegundos
        'cada 72 horas': 72 * 60 * 60 * 1000,    // 72 horas en milisegundos
        'cada 4 horas': 4 * 60 * 60 * 1000,      // 4 horas en milisegundos
        'cada 2 horas': 2 * 60 * 60 * 1000       // 2 horas en milisegundos
    };

    // Buscar coincidencia (case insensitive)
    const frecuenciaLower = frecuencia.toLowerCase();
    for (const [key, value] of Object.entries(frecuencias)) {
        if (frecuenciaLower.includes(key.toLowerCase())) {
            return value;
        }
    }

    // Por defecto, 24 horas
    console.warn('Frecuencia no reconocida:', frecuencia, '- usando 24 horas por defecto');
    return 24 * 60 * 60 * 1000;
}

// Formatear tiempo restante
function formatearTiempoRestante(proximaToma) {
    if (!proximaToma) return '';
    
    const ahora = new Date();
    const tiempoRestante = new Date(proximaToma) - ahora;
    
    if (tiempoRestante <= 0) return 'Disponible ahora';
    
    const horas = Math.floor(tiempoRestante / (1000 * 60 * 60));
    const minutos = Math.floor((tiempoRestante % (1000 * 60 * 60)) / (1000 * 60));
    
    if (horas > 0) {
        return `Disponible en ${horas}h ${minutos}m`;
    } else {
        return `Disponible en ${minutos}m`;
    }
}

// Formatear tiempo transcurrido
function formatearTiempoTranscurrido(tiempoMs) {
    if (!tiempoMs) return '';
    
    const horas = Math.floor(tiempoMs / (1000 * 60 * 60));
    const minutos = Math.floor((tiempoMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (horas > 0) {
        return `Hace ${horas}h ${minutos}m`;
    } else {
        return `Hace ${minutos}m`;
    }
}

// Renderizar medicamentos para control - VERSIÓN CORREGIDA CON TIEMPO REAL
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
    
    container.innerHTML = activeMedications.map(med => {
        // ✅ USAR LA NUEVA LÓGICA DE DISPONIBILIDAD POR TIEMPO
        const disponibilidad = calcularDisponibilidadMedicamento(med.nombre, med.recetaId, med.frecuencia);
        const disponible = disponibilidad.disponible;
        const proximaToma = disponibilidad.proximaToma;
        const ultimaToma = disponibilidad.ultimaToma;
        
        const historialMedicamento = medicationHistory.filter(record => 
            record.medicamentoNombre === med.nombre && 
            record.recetaId._id === med.recetaId
        );

        // Determinar clase CSS basada en el estado
        let cardClass = 'medication-card border p-3 mb-3 rounded';
        if (!disponible && ultimaToma) {
            cardClass += ' medication-taken'; // Tomado recientemente
        } else if (disponible && historialMedicamento.length > 0) {
            cardClass += ' medication-pending'; // Pendiente de tomar
        } else {
            cardClass += ' medication-available'; // Nunca tomado
        }

        return `
            <div class="${cardClass}">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h5 class="mb-1">${med.nombre} <small class="text-muted">${med.dosis}</small></h5>
                        <p class="mb-1"><strong>Frecuencia:</strong> ${med.frecuencia}</p>
                        <p class="mb-1"><strong>Hora recomendada:</strong> ${med.horaRecomendada}</p>
                        <p class="mb-1"><strong>Duración:</strong> ${med.duracion || 'No especificada'}</p>
                        <p class="mb-1"><strong>Recetado por:</strong> ${med.doctor}</p>
                        ${med.instrucciones ? `<p class="mb-1"><strong>Instrucciones:</strong> ${med.instrucciones}</p>` : ''}
                        <small class="text-muted">Receta del ${formatDate(med.recetaFecha)}</small>
                        
                        ${!disponible && proximaToma ? `
                            <div class="mt-2">
                                <small class="text-warning">
                                    <i class="fas fa-clock me-1"></i>
                                    ${formatearTiempoRestante(proximaToma)}
                                </small>
                            </div>
                        ` : ''}

                        ${disponible && ultimaToma ? `
                            <div class="mt-2">
                                <small class="text-info">
                                    <i class="fas fa-history me-1"></i>
                                    Listo para tomar
                                </small>
                            </div>
                        ` : ''}
                    </div>
                    <div class="text-center ms-3">
                        <button class="btn ${!disponible ? 'btn-success' : 'btn-outline-primary'} btn-lg"
                                onclick="toggleMedicationTaken('${med.recetaId}', '${med.nombre}', '${med.dosis}', '${med.frecuencia}')"
                                ${!disponible ? 'disabled' : ''}>
                            <i class="fas ${!disponible ? 'fa-check' : 'fa-pills'} me-1"></i>
                            ${!disponible ? 'Tomado' : 'Tomar'}
                        </button>
                        <div class="mt-2">
                            <small class="text-muted">Tomas registradas: ${historialMedicamento.length}</small>
                        </div>
                    </div>
                </div>
                
                ${!disponible && ultimaToma ? `
                    <div class="mt-2 p-2 bg-success text-white rounded">
                        <i class="fas fa-check-circle me-1"></i>
                        Última toma: ${formatDateTime(ultimaToma.fechaToma)} 
                        (${formatearTiempoTranscurrido(disponibilidad.tiempoTranscurrido)})
                    </div>
                ` : ''}
                
                ${disponible && historialMedicamento.length > 0 ? `
                    <div class="mt-2 p-2 bg-warning text-dark rounded">
                        <i class="fas fa-exclamation-circle me-1"></i>
                        Listo para la siguiente toma
                    </div>
                ` : ''}
                
                <!-- Historial reciente -->
                ${historialMedicamento.length > 0 ? `
                    <div class="mt-3">
                        <h6>Últimas tomas:</h6>
                        <div class="medication-history">
                            ${historialMedicamento.slice(0, 5).map(record => `
                                <span class="badge bg-light text-dark me-1 mb-1">
                                    ${formatDateTime(record.fechaToma)}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Actualizar displays de medicamentos (se llama cada minuto)
function updateMedicationDisplays() {
    if (document.getElementById('medicamentos-section').style.display !== 'none') {
        renderMedications();
        updateMedicationProgress();
    }
}

// Marcar medicamento como tomado en MongoDB - VERSIÓN MODIFICADA CON NOTIFICACIÓN
async function toggleMedicationTaken(recetaId, medicamentoNombre, medicamentoDosis, frecuencia) {
    try {
        console.log('🔄 Intentando registrar toma en MongoDB...');
        
        const ahora = new Date();
        
        const registroToma = {
            pacienteId: currentPatient._id,
            recetaId: recetaId,
            medicamentoNombre: medicamentoNombre,
            medicamentoDosis: medicamentoDosis,
            fechaToma: ahora.toISOString(),
            horaProgramada: frecuencia,
            frecuencia: frecuencia,
            notas: `Tomado por el paciente a las ${ahora.toLocaleTimeString('es-ES')}`
        };

        console.log('📦 Datos a enviar:', registroToma);

        const response = await fetch('/api/medication-tracking/registrar-toma', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registroToma)
        });

        console.log('📡 Respuesta del servidor:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error del servidor:', errorText);
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const resultado = await response.json();
        console.log('✅ Registro guardado en MongoDB:', resultado);

        // Recargar el historial desde MongoDB
        await loadMedicationHistory();
        renderMedications();
        updateMedicationProgress();
        updateSummaryCards();
        
        // Agregar notificación de confirmación
        addNotification({
            type: 'medication_taken',
            title: '✅ Medicamento Registrado',
            message: `${medicamentoNombre} ha sido registrado como tomado`,
            medicationId: `${recetaId}_${medicamentoNombre}`,
            medicationName: medicamentoNombre,
            timestamp: new Date().toISOString(),
            read: false
        });
        
    } catch (error) {
        console.error('❌ Error registrando toma:', error);
        showNotification(`❌ Error: ${error.message}`, 'error');
    }
}

// Actualizar progreso de medicamentos - VERSIÓN CORREGIDA
function updateMedicationProgress() {
    let medicamentosAlDia = 0;
    const totalActiveMeds = activeMedications.length;

    activeMedications.forEach(med => {
        const disponibilidad = calcularDisponibilidadMedicamento(med.nombre, med.recetaId, med.frecuencia);
        // Si NO está disponible, significa que fue tomado recientemente y está al día
        if (!disponibilidad.disponible) {
            medicamentosAlDia++;
        }
    });

    const progressPercentage = totalActiveMeds > 0 ? 
        Math.round((medicamentosAlDia / totalActiveMeds) * 100) : 0;

    // Actualizar UI
    const progressBar = document.getElementById('daily-progress-bar');
    const progressText = document.getElementById('daily-progress-text');
    const dailySummary = document.getElementById('daily-summary');
    
    if (progressBar) {
        progressBar.style.width = `${progressPercentage}%`;
        progressBar.className = `progress-bar ${progressPercentage === 100 ? 'bg-success' : progressPercentage >= 50 ? 'bg-warning' : 'bg-danger'}`;
    }
    
    if (progressText) progressText.textContent = `${progressPercentage}%`;
    if (dailySummary) dailySummary.textContent = `${medicamentosAlDia} de ${totalActiveMeds} medicamentos al día`;
    
    // Actualizar tarjeta de resumen
    document.getElementById('total-medicamentos-activos').textContent = totalActiveMeds;
    
    // Actualizar resumen en sección principal
    const todaySummary = document.getElementById('medications-today');
    const progressSmall = document.getElementById('medications-progress');
    
    if (todaySummary) {
        todaySummary.textContent = `${medicamentosAlDia} de ${totalActiveMeds} medicamentos al día`;
    }
    
    if (progressSmall) {
        progressSmall.textContent = `Progreso: ${progressPercentage}%`;
    }
}

// Filtrar medicamentos
function filterMedications(filter) {
    const buttons = document.querySelectorAll('#medicamentos-section .btn-group .btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const container = document.getElementById('medications-list');
    const cards = container.querySelectorAll('.medication-card');
    
    cards.forEach(card => {
        const isTaken = card.classList.contains('medication-taken');
        const isPending = card.classList.contains('medication-pending');
        const isAvailable = card.classList.contains('medication-available');
        
        switch (filter) {
            case 'active':
                card.style.display = (isPending || isAvailable) ? 'block' : 'none';
                break;
            case 'completed':
                card.style.display = isTaken ? 'block' : 'none';
                break;
            default:
                card.style.display = 'block';
        }
    });
}

// Actualizar fecha actual
function updateTodayDate() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('today-date').textContent = today.toLocaleDateString('es-ES', options);
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    const alertClass = type === 'error' ? 'danger' : type;
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${alertClass} alert-dismissible fade show position-fixed`;
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '1050';
    alertDiv.style.minWidth = '300px';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 4000);
}

// Funciones auxiliares de formato
function formatDateTime(dateTimeString) {
    try {
        const date = new Date(dateTimeString);
        return date.toLocaleDateString('es-ES', { 
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Fecha no disponible';
    }
}

function formatDate(dateString) {
    try {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    } catch (error) {
        return 'Fecha no disponible';
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
    let medicamentosAlDia = 0;
    activeMedications.forEach(med => {
        const disponibilidad = calcularDisponibilidadMedicamento(med.nombre, med.recetaId, med.frecuencia);
        if (!disponibilidad.disponible) {
            medicamentosAlDia++;
        }
    });
    
    document.getElementById('medications-today').textContent = 
        `${medicamentosAlDia} de ${activeMedications.length} medicamentos al día`;
    
    const progressPercentage = activeMedications.length > 0 ? 
        Math.round((medicamentosAlDia / activeMedications.length) * 100) : 0;
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
    
    // Si es la sección de medicamentos, actualizar
    if (sectionName === 'medicamentos') {
        updateMedicationProgress();
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
        // Limpiar intervalo de notificaciones
        if (notificationCheckInterval) {
            clearInterval(notificationCheckInterval);
        }
        
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentPatient');
        window.location.href = '/index.html';
    }
}