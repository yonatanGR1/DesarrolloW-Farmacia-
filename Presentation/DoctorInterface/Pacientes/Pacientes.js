const API_BASE = "https://desarrollow-farmacia.onrender.com";
const API_PACIENTES = `${API_BASE}/api/pacientes`;

let editingPatientId = null;
let patients = [];

// Datos para la gestión de pacientes
function loadDoctorName() {
    try {
        const doctorData = localStorage.getItem('currentDoctor');
        if (doctorData) {
            const doctor = JSON.parse(doctorData);
            const userDisplayName = document.getElementById('user-display-name');
            if (userDisplayName) {
                userDisplayName.textContent = doctor.nombre;
            }
        }
    } catch (error) {
        console.error('Error cargando nombre del doctor:', error);
    }
}

// Inicializar gestión de pacientes
function initializePatientManager() {
    loadPatientsList();
    
    // Configurar el formulario
    document.getElementById('patientForm').addEventListener('submit', function(e) {
        e.preventDefault();
        if (editingPatientId) {
            updatePatient();
        } else {
            registerPatient();
        }
    });
    
    // Configurar búsqueda
    document.getElementById('searchPatient').addEventListener('input', function() {
        filterPatients(this.value);
    });
}

async function loadPatientsList() {
    try {
        const response = await fetch(`${API_PACIENTES}`);
        if (!response.ok) {
            throw new Error('Error al cargar pacientes');
        }
        
        patients = await response.json();
        displayPatients();
        
    } catch (error) {
        console.error('Error:', error);
        const container = document.getElementById('patientsList');
        container.innerHTML = '<p class="text-center text-danger">Error al cargar pacientes</p>';
    }
}

// Mostrar pacientes en tarjetas
function displayPatients() {
    const container = document.getElementById('patientsList');
    container.innerHTML = '';
    
    if (patients.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No hay pacientes registrados.</p>';
        return;
    }
    
    // Ordenar pacientes por apellido
    patients.sort((a, b) => a.apellido.localeCompare(b.apellido));
    
    patients.forEach(patient => {
        const patientElement = document.createElement('div');
        patientElement.className = 'list-group-item patient-card';
        patientElement.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">${patient.nombre} ${patient.apellido}</h5>
                <small>${patient.edad} años</small>
            </div>
            <p class="mb-1"><strong>Género:</strong> ${patient.genero}</p>
            <p class="mb-1"><strong>Contacto:</strong> ${patient.telefono || 'No especificado'}</p>
            <p class="mb-1"><strong>Email:</strong> ${patient.email || 'No especificado'}</p>
            <p class="mb-1">
                <strong>Condiciones:</strong><br>
                ${patient.condiciones && patient.condiciones.length > 0 ? 
                    patient.condiciones.map(condition => `<span class="badge bg-primary me-1 mb-1">${condition}</span>`).join('') : 
                    '<span class="text-muted">Ninguna registrada</span>'}
            </p>
            <div class="patient-actions mt-2">
                <button class="btn btn-sm btn-hospital" onclick="viewPatientDetails('${patient._id}')">
                    <i class="fas fa-eye"></i> Ver Detalles
                </button>
                <button class="btn btn-sm btn-outline-warning" onclick="editPatient('${patient._id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deletePatient('${patient._id}')">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;
        container.appendChild(patientElement);
    });
}

// Filtrar pacientes en tarjetas
function filterPatients(searchTerm) {
    const container = document.getElementById('patientsList');
    const patientCards = container.getElementsByClassName('patient-card');
    
    for (let card of patientCards) {
        const patientName = card.querySelector('h5').textContent.toLowerCase();
        if (patientName.includes(searchTerm.toLowerCase())) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    }
}

// Registrar nuevo paciente
async function registerPatient() {
    const nombre = document.getElementById('patientName').value;
    const apellido = document.getElementById('patientLastname').value;
    const edad = parseInt(document.getElementById('patientAge').value);
    const genero = document.getElementById('patientGender').value;
    const telefono = document.getElementById('patientPhone').value;
    const email = document.getElementById('patientEmail').value;
    const direccion = document.getElementById('patientAddress').value;
    
    // Procesar condiciones médicas
    const conditionsInput = document.getElementById('patientConditions').value;
    const condiciones = conditionsInput.split(',').map(item => item.trim()).filter(item => item !== '');
    
    // Procesar alergias
    const allergiesInput = document.getElementById('patientAllergies').value;
    const alergias = allergiesInput.split(',').map(item => item.trim()).filter(item => item !== '');
    
    // Procesar medicamentos
    const medicationsInput = document.getElementById('patientMedications').value;
    const medicamentos = medicationsInput.split(',').map(item => item.trim()).filter(item => item !== '');
    
    if (!nombre || !apellido || !edad || !genero) {
        alert('Por favor, complete todos los campos obligatorios.');
        return;
    }
    
    try {
        const response = await fetch(`${API_PACIENTES}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre,
                apellido,
                edad,
                genero,
                telefono,
                email,
                direccion,
                condiciones,
                alergias,
                medicamentos
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al registrar paciente');
        }

        const result = await response.json();
        alert('Paciente registrado correctamente.');
        resetForm();
        loadPatientsList();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al registrar paciente: ' + error.message);
    }
}

// Editar paciente
async function editPatient(patientId) {
    try {
        const response = await fetch(`${API_PACIENTES}/${patientId}`);
        if (!response.ok) {
            throw new Error('Error al cargar paciente');
        }
        
        const patient = await response.json();
        
        // Llenar el formulario con los datos del paciente
        document.getElementById('patientName').value = patient.nombre;
        document.getElementById('patientLastname').value = patient.apellido;
        document.getElementById('patientAge').value = patient.edad;
        document.getElementById('patientGender').value = patient.genero;
        document.getElementById('patientPhone').value = patient.telefono || '';
        document.getElementById('patientEmail').value = patient.email || '';
        document.getElementById('patientAddress').value = patient.direccion || '';
        document.getElementById('patientConditions').value = patient.condiciones ? patient.condiciones.join(', ') : '';
        document.getElementById('patientAllergies').value = patient.alergias ? patient.alergias.join(', ') : '';
        document.getElementById('patientMedications').value = patient.medicamentos ? patient.medicamentos.join(', ') : '';
        
        editingPatientId = patientId;
        
        // Cambiar texto del botón
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.innerHTML = '<i class="fas fa-save me-1"></i> Actualizar Paciente';
        submitBtn.classList.remove('btn-hospital');
        submitBtn.classList.add('btn-warning');
        
        // Desplazarse al formulario
        document.getElementById('patientForm').scrollIntoView();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar paciente para editar');
    }
}

// Actualizar paciente
async function updatePatient() {
    const nombre = document.getElementById('patientName').value;
    const apellido = document.getElementById('patientLastname').value;
    const edad = parseInt(document.getElementById('patientAge').value);
    const genero = document.getElementById('patientGender').value;
    const telefono = document.getElementById('patientPhone').value;
    const email = document.getElementById('patientEmail').value;
    const direccion = document.getElementById('patientAddress').value;
    
    // Procesar condiciones médicas
    const conditionsInput = document.getElementById('patientConditions').value;
    const condiciones = conditionsInput.split(',').map(item => item.trim()).filter(item => item !== '');
    
    // Procesar alergias
    const allergiesInput = document.getElementById('patientAllergies').value;
    const alergias = allergiesInput.split(',').map(item => item.trim()).filter(item => item !== '');
    
    // Procesar medicamentos
    const medicationsInput = document.getElementById('patientMedications').value;
    const medicamentos = medicationsInput.split(',').map(item => item.trim()).filter(item => item !== '');
    
    if (!nombre || !apellido || !edad || !genero) {
        alert('Por favor, complete todos los campos obligatorios.');
        return;
    }
    
    try {
        const response = await fetch(`${API_PACIENTES}/${editingPatientId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre,
                apellido,
                edad,
                genero,
                telefono,
                email,
                direccion,
                condiciones,
                alergias,
                medicamentos
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al actualizar paciente');
        }

        alert('Paciente actualizado correctamente.');
        resetForm();
        loadPatientsList();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al actualizar paciente: ' + error.message);
    }
}

// Resetear formulario
function resetForm() {
    document.getElementById('patientForm').reset();
    editingPatientId = null;
    
    // Restaurar botón original
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.innerHTML = '<i class="fas fa-save me-1"></i> Registrar Paciente';
    submitBtn.classList.remove('btn-warning');
    submitBtn.classList.add('btn-hospital');
}

// Eliminar paciente
async function deletePatient(patientId, confirmDelete = true) {
    if (confirmDelete && !window.confirm('¿Está seguro de que desea eliminar este paciente?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_PACIENTES}/${patientId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Error al eliminar paciente');
        }

        alert('Paciente eliminado correctamente.');
        loadPatientsList();
        closePatientDetails();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar paciente');
    }
}

// Ver detalles del paciente
async function viewPatientDetails(patientId) {
    try {
        const response = await fetch(`${API_PACIENTES}/${patientId}`);
        if (!response.ok) {
            throw new Error('Error al cargar paciente');
        }
        
        const patient = await response.json();
        
        const detailsContent = document.getElementById('patientDetailsContent');
        detailsContent.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="patient-detail-item">
                        <h5>Información Personal</h5>
                        <p><strong>Nombre completo:</strong> ${patient.nombre} ${patient.apellido}</p>
                        <p><strong>Edad:</strong> ${patient.edad} años</p>
                        <p><strong>Género:</strong> ${patient.genero}</p>
                        <p><strong>Teléfono:</strong> ${patient.telefono || 'No especificado'}</p>
                        <p><strong>Email:</strong> ${patient.email || 'No especificado'}</p>
                        <p><strong>Dirección:</strong> ${patient.direccion || 'No especificada'}</p>
                    </div>
                    
                    <div class="patient-detail-item">
                        <h5>Alergias</h5>
                        ${patient.alergias && patient.alergias.length > 0 ? 
                            patient.alergias.map(allergy => `<span class="badge bg-danger me-1 mb-1">${allergy}</span>`).join('') : 
                            '<p class="text-muted">No registra alergias</p>'}
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="patient-detail-item">
                        <h5>Condiciones Médicas</h5>
                        ${patient.condiciones && patient.condiciones.length > 0 ? 
                            patient.condiciones.map(condition => `<span class="badge bg-primary me-1 mb-1">${condition}</span>`).join('') : 
                            '<p class="text-muted">No registra condiciones médicas</p>'}
                    </div>
                    
                    <div class="patient-detail-item">
                        <h5>Medicamentos Actuales</h5>
                        ${patient.medicamentos && patient.medicamentos.length > 0 ? 
                            '<ul class="list-unstyled">' + patient.medicamentos.map(med => `<li>💊 ${med}</li>`).join('') + '</ul>' : 
                            '<p class="text-muted">No registra medicamentos actuales</p>'}
                    </div>
                    
                    <div class="patient-detail-item">
                        <h5>Información Adicional</h5>
                        <p><strong>Fecha de registro:</strong> ${new Date(patient.createdAt || Date.now()).toLocaleDateString('es-ES')}</p>
                        <p><strong>ID del paciente:</strong> ${patient._id}</p>
                    </div>
                </div>
            </div>
            
            <div class="row mt-3">
                <div class="col-12">
                    <div class="d-flex gap-2 flex-wrap">
                        <button class="btn btn-hospital" onclick="editPatient('${patient._id}')">
                            <i class="fas fa-edit me-1"></i> Editar Paciente
                        </button>
                        <button class="btn btn-outline-hospital" onclick="createPrescription('${patient._id}')">
                            <i class="fas fa-prescription me-1"></i> Crear Receta
                        </button>
                        <button class="btn btn-outline-hospital" onclick="scheduleAppointment('${patient._id}')">
                            <i class="fas fa-calendar-plus me-1"></i> Agendar Cita
                        </button>
                        <button class="btn btn-outline-info" onclick="viewMedicalHistory('${patient._id}')">
                            <i class="fas fa-history me-1"></i> Historial Médico
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Mostrar sección de detalles
        document.getElementById('patientDetailsSection').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar detalles del paciente');
    }
}

// Cerrar detalles del paciente
function closePatientDetails() {
    document.getElementById('patientDetailsSection').classList.add('hidden');
}

// Agendar cita para paciente específico
function scheduleAppointment(patientId) {
    localStorage.setItem('selectedPatientForAppointment', patientId);
    window.location.href = '../citas/Citas.html';
}

// Crear receta para paciente específico
function createPrescription(patientId) {
    localStorage.setItem('selectedPatientForPrescription', patientId);
    window.location.href = '../Recetas/Recetas.html';
}

// Ver historial médico del paciente
function viewMedicalHistory(patientId) {
    localStorage.setItem('selectedPatientForHistory', patientId);
    window.location.href = '../PatientHistory.html';
}

// Función de cierre de sesión
function logout() {
    if (confirm('¿Está seguro de que desea cerrar sesión?')) {
        localStorage.removeItem('currentDoctor');
        window.location.href = '/index.html';
    }
}

// Inicializar la gestión de pacientes cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    loadDoctorName();
    initializePatientManager();
});