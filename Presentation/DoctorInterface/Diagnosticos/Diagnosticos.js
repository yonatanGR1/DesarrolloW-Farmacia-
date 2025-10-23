// Diagnosticos.js - Gestión de diagnósticos médicos

let currentDoctorId = null;
let currentDoctorName = null;
let currentAppointmentId = null;
let currentAppointmentData = null;

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        // Si no hay usuario, usar datos por defecto
        currentDoctorId = 'default-doctor-id';
        currentDoctorName = 'Dr. Juan Pérez';
        document.getElementById('user-display-name').textContent = currentDoctorName;
    } else {
        currentDoctorId = user.id;
        currentDoctorName = user.nombre;
        document.getElementById('user-display-name').textContent = user.nombre;
    }

    // Establecer fecha actual
    document.getElementById('fecha').valueAsDate = new Date();

    // Verificar si viene desde una cita
    checkAppointmentData();

    // Cargar datos
    loadPacientes();
    loadDiagnosticos();

    // Configurar formulario
    document.getElementById('diagnosis-form').addEventListener('submit', saveDiagnostico);
});

// Verificar si hay datos de cita en la URL o localStorage
function checkAppointmentData() {
    const urlParams = new URLSearchParams(window.location.search);
    const appointmentId = urlParams.get('cita');
    const patientId = urlParams.get('paciente');
    const patientName = urlParams.get('pacienteNombre');

    // También verificar localStorage
    const storedAppointmentId = localStorage.getItem('currentAppointmentId');
    const storedPatientId = localStorage.getItem('currentAppointmentPatientId');
    const storedPatientName = localStorage.getItem('currentAppointmentPatientName');

    if (appointmentId || storedAppointmentId) {
        currentAppointmentId = appointmentId || storedAppointmentId;
        
        // Mostrar alerta de cita activa
        const alert = document.getElementById('active-appointment-alert');
        const patientNameSpan = document.getElementById('appointment-patient-name');
        patientNameSpan.textContent = patientName || storedPatientName || 'Paciente';
        alert.style.display = 'block';

        // Si hay paciente ID, preseleccionarlo cuando se cargue la lista
        if (patientId || storedPatientId) {
            const targetPatientId = patientId || storedPatientId;
            setTimeout(() => {
                const pacienteSelect = document.getElementById('paciente-select');
                pacienteSelect.value = targetPatientId;
                
                // Scroll al formulario
                document.getElementById('diagnosis-form').scrollIntoView({ behavior: 'smooth' });
            }, 500);
        }

        // Limpiar localStorage después de usar
        localStorage.removeItem('currentAppointmentId');
        localStorage.removeItem('currentAppointmentPatientId');
        localStorage.removeItem('currentAppointmentPatientName');
    }
}

// Cargar lista de pacientes
async function loadPacientes() {
    try {
        const response = await fetch('/api/pacientes');
        if (!response.ok) {
            throw new Error('Error al cargar pacientes');
        }

        const pacientes = await response.json();
        const pacienteSelect = document.getElementById('paciente-select');
        pacienteSelect.innerHTML = '<option value="">Seleccionar paciente...</option>';

        pacientes.forEach(paciente => {
            const option = document.createElement('option');
            option.value = paciente._id;
            option.textContent = `${paciente.nombre} ${paciente.apellido} - ${paciente.edad} años`;
            option.setAttribute('data-paciente', JSON.stringify(paciente));
            pacienteSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando pacientes:', error);
        alert('Error al cargar la lista de pacientes');
    }
}

// Cargar diagnósticos
async function loadDiagnosticos() {
    const listContainer = document.getElementById('diagnostics-list');
    const loadingContainer = document.getElementById('diagnostics-loading');
    const emptyContainer = document.getElementById('diagnostics-empty');

    try {
        loadingContainer.style.display = 'block';
        listContainer.style.display = 'none';
        emptyContainer.style.display = 'none';

        const response = await fetch('/api/diagnosticos');
        if (!response.ok) {
            throw new Error('Error al cargar diagnósticos');
        }

        const diagnosticos = await response.json();
        
        loadingContainer.style.display = 'none';

        if (diagnosticos.length === 0) {
            emptyContainer.style.display = 'block';
            return;
        }

        listContainer.style.display = 'block';
        listContainer.innerHTML = '';

        // Ordenar por fecha más reciente
        diagnosticos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        diagnosticos.forEach(diagnostico => {
            const diagnosticoElement = createDiagnosticoElement(diagnostico);
            listContainer.appendChild(diagnosticoElement);
        });
    } catch (error) {
        console.error('Error cargando diagnósticos:', error);
        loadingContainer.style.display = 'none';
        listContainer.innerHTML = `
            <div class="alert alert-warning text-center">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Error al cargar diagnósticos. Por favor, intente nuevamente.
            </div>
        `;
        listContainer.style.display = 'block';
    }
}

// Crear elemento visual para un diagnóstico
function createDiagnosticoElement(diagnostico) {
    const element = document.createElement('div');
    element.className = 'list-group-item';
    
    const fechaFormateada = formatDate(diagnostico.fecha);
    const pacienteNombre = diagnostico.pacienteNombre || 'Paciente';
    const pacienteApellido = diagnostico.pacienteApellido || '';
    const tipo = diagnostico.tipo || 'Diagnóstico general';
    const descripcion = diagnostico.descripcion || 'Sin descripción';
    const tratamiento = diagnostico.tratamiento || 'No especificado';
    const observaciones = diagnostico.observaciones || 'Ninguna';

    element.innerHTML = `
        <div class="d-flex w-100 justify-content-between align-items-start mb-2">
            <div>
                <h5 class="mb-1">${pacienteNombre} ${pacienteApellido}</h5>
                <span class="badge bg-primary">${tipo}</span>
            </div>
            <small class="text-muted">${fechaFormateada}</small>
        </div>
        <div class="mb-2">
            <strong>Diagnóstico:</strong>
            <p class="mb-1">${descripcion}</p>
        </div>
        <div class="mb-2">
            <strong>Tratamiento:</strong>
            <p class="mb-1">${tratamiento}</p>
        </div>
        <div class="mb-2">
            <strong>Observaciones:</strong>
            <p class="mb-1">${observaciones}</p>
        </div>
        <div class="mt-3">
            <button class="btn btn-sm btn-outline-danger" onclick="deleteDiagnostico('${diagnostico._id}')">
                <i class="fas fa-trash me-1"></i>Eliminar
            </button>
        </div>
    `;

    return element;
}

// Guardar diagnóstico
async function saveDiagnostico(event) {
    event.preventDefault();

    const pacienteSelect = document.getElementById('paciente-select');
    const selectedOption = pacienteSelect.options[pacienteSelect.selectedIndex];
    
    if (!selectedOption || !selectedOption.value) {
        alert('Por favor seleccione un paciente');
        return;
    }

    const pacienteData = JSON.parse(selectedOption.getAttribute('data-paciente'));
    const fecha = document.getElementById('fecha').value;
    const tipo = document.getElementById('tipo').value || 'Diagnóstico general';
    const descripcion = document.getElementById('descripcion').value;
    const tratamiento = document.getElementById('tratamiento').value;
    const observaciones = document.getElementById('observaciones').value;

    const diagnosticoData = {
        pacienteId: pacienteData._id,
        pacienteNombre: pacienteData.nombre,
        pacienteApellido: pacienteData.apellido,
        fecha: fecha,
        tipo: tipo,
        descripcion: descripcion,
        tratamiento: tratamiento,
        observaciones: observaciones,
        doctorId: currentDoctorId,
        doctorNombre: currentDoctorName
    };

    try {
        const response = await fetch('/api/diagnosticos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(diagnosticoData)
        });

        if (!response.ok) {
            throw new Error('Error al guardar diagnóstico');
        }

        // Si hay una cita asociada, actualizar su estado a completada
        if (currentAppointmentId) {
            try {
                await fetch(`/api/citas/${currentAppointmentId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ estado: 'completada' })
                });
            } catch (error) {
                console.warn('No se pudo actualizar el estado de la cita:', error);
            }
        }

        alert('Diagnóstico guardado exitosamente');
        resetForm();
        loadDiagnosticos();

        // Ocultar alerta de cita activa
        const alert = document.getElementById('active-appointment-alert');
        alert.style.display = 'none';
        currentAppointmentId = null;

    } catch (error) {
        console.error('Error guardando diagnóstico:', error);
        alert('Error al guardar el diagnóstico. Por favor, intente nuevamente.');
    }
}

// Eliminar diagnóstico
async function deleteDiagnostico(diagnosticoId) {
    if (!confirm('¿Está seguro de que desea eliminar este diagnóstico?')) {
        return;
    }

    try {
        const response = await fetch(`/api/diagnosticos/${diagnosticoId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Error al eliminar diagnóstico');
        }

        alert('Diagnóstico eliminado exitosamente');
        loadDiagnosticos();
    } catch (error) {
        console.error('Error eliminando diagnóstico:', error);
        alert('Error al eliminar el diagnóstico');
    }
}

// Resetear formulario
function resetForm() {
    document.getElementById('diagnosis-form').reset();
    document.getElementById('fecha').valueAsDate = new Date();
    document.getElementById('paciente-select').value = '';
    
    // Ocultar alerta de cita activa
    const alert = document.getElementById('active-appointment-alert');
    alert.style.display = 'none';
    currentAppointmentId = null;
}

// Formatear fecha
function formatDate(dateString) {
    if (!dateString) return 'Fecha no especificada';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return date.toLocaleDateString('es-ES', options);
}

// Cerrar sesión
function logout() {
    if (confirm('¿Está seguro de que desea cerrar sesión?')) {
        localStorage.clear();
        window.location.href = '../index.html';
    }
}