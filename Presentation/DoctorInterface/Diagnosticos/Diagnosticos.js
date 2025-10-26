let currentDoctorId = null;
let currentDoctorName = null;
let currentAppointmentId = null;
let lastSavedDiagnosticoId = null;

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
       
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

   
    checkAppointmentData();

    // Cargar datos
    loadPacientes();
    loadDiagnosticos();

    // Configurar formulario
    document.getElementById('diagnosis-form').addEventListener('submit', saveDiagnostico);
});

function checkAppointmentData() {
    const urlParams = new URLSearchParams(window.location.search);
    const appointmentId = urlParams.get('cita');
    const patientId = urlParams.get('paciente');
    const patientName = urlParams.get('pacienteNombre');

  
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


        if (patientId || storedPatientId) {
            const targetPatientId = patientId || storedPatientId;
            setTimeout(() => {
                const pacienteSelect = document.getElementById('paciente-select');
                if (pacienteSelect) {
                    pacienteSelect.value = targetPatientId;
                    
                    // Scroll al formulario
                    document.getElementById('diagnosis-form').scrollIntoView({ behavior: 'smooth' });
                }
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

        displayDiagnosticos(diagnosticos);
        
    } catch (error) {
        console.error('Error cargando diagnósticos:', error);
        // Cargar diagnósticos de localStorage si la API falla
        loadDiagnosticosFromLocalStorage();
    }
}

// Cargar diagnósticos desde localStorage
function loadDiagnosticosFromLocalStorage() {
    const listContainer = document.getElementById('diagnostics-list');
    const loadingContainer = document.getElementById('diagnostics-loading');
    const emptyContainer = document.getElementById('diagnostics-empty');
    
    loadingContainer.style.display = 'none';
    
    const diagnosticos = JSON.parse(localStorage.getItem('diagnosticos')) || [];
    
    if (diagnosticos.length === 0) {
        emptyContainer.style.display = 'block';
        return;
    }
    
    displayDiagnosticos(diagnosticos);
}

// Mostrar diagnósticos en la lista
function displayDiagnosticos(diagnosticos) {
    const listContainer = document.getElementById('diagnostics-list');
    const emptyContainer = document.getElementById('diagnostics-empty');
    
    listContainer.style.display = 'block';
    emptyContainer.style.display = 'none';
    listContainer.innerHTML = '';

    // Ordenar por fecha más reciente
    diagnosticos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    diagnosticos.forEach(diagnostico => {
        const diagnosticoElement = createDiagnosticoElement(diagnostico);
        listContainer.appendChild(diagnosticoElement);
    });
}
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
            <button class="btn btn-sm btn-outline-danger" onclick="deleteDiagnostico('${diagnostico._id || diagnostico.id}')">
                <i class="fas fa-trash me-1"></i>Eliminar
            </button>
        </div>
    `;

    return element;
}


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

    // Validar campos requeridos
    if (!descripcion.trim() || !tratamiento.trim()) {
        alert('Por favor complete la descripción y el tratamiento');
        return;
    }

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
        let savedDiagnostico;

        try {
            const response = await fetch('/api/diagnosticos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(diagnosticoData)
            });

            if (response.ok) {
                savedDiagnostico = await response.json();
            } else {
                throw new Error('Error en la respuesta del servidor');
            }
        } catch (apiError) {
            console.warn('API no disponible, guardando en localStorage:', apiError);
        
            savedDiagnostico = saveToLocalStorage(diagnosticoData);
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

        alert('Diagnóstico guardado exitosamente. Redirigiendo a recetas...');
        
        redirectToRecetas(pacienteData, savedDiagnostico);

    } catch (error) {
        console.error('Error guardando diagnóstico:', error);
        alert('Error al guardar el diagnóstico. Por favor, intente nuevamente.');
    }
}
// Guardar en localStorage como fallback
function saveToLocalStorage(diagnosticoData) {
    const diagnosticos = JSON.parse(localStorage.getItem('diagnosticos')) || [];
    const newDiagnostico = {
        id: 'local-' + Date.now(),
        ...diagnosticoData,
        fechaCreacion: new Date().toISOString()
    };
    
    diagnosticos.push(newDiagnostico);
    localStorage.setItem('diagnosticos', JSON.stringify(diagnosticos));
    
    return newDiagnostico;
}

function redirectToRecetas(pacienteData, diagnosticoData) {
    const params = new URLSearchParams({
        pacienteId: pacienteData._id,
        pacienteNombre: pacienteData.nombre,
        pacienteApellido: pacienteData.apellido,
        diagnosticoId: diagnosticoData._id || diagnosticoData.id,
        tipoDiagnostico: diagnosticoData.tipo || 'Diagnóstico general'
    });
    
    window.location.href = `../Recetas/Recetas.html?${params.toString()}`;
}


async function deleteDiagnostico(diagnosticoId) {
    if (!confirm('¿Está seguro de que desea eliminar este diagnóstico?')) {
        return;
    }

    try {
        if (diagnosticoId.startsWith('local-')) {
            
            const diagnosticos = JSON.parse(localStorage.getItem('diagnosticos')) || [];
            const updatedDiagnosticos = diagnosticos.filter(d => d.id !== diagnosticoId);
            localStorage.setItem('diagnosticos', JSON.stringify(updatedDiagnosticos));
        } else {
    
            const response = await fetch(`/api/diagnosticos/${diagnosticoId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Error al eliminar diagnóstico');
            }
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
    
    const alert = document.getElementById('active-appointment-alert');
    alert.style.display = 'none';
    currentAppointmentId = null;
}

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

function logout() {
    if (confirm('¿Está seguro de que desea cerrar sesión?')) {
        localStorage.clear();
        window.location.href = '../index.html';
    }
}