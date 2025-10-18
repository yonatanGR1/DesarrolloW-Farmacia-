// Pacientes.js - Funcionalidad específica para gestión de pacientes

// Datos para la gestión de pacientes


// Inicializar gestión de pacientes
function initializePatientManager() {
    loadPatientsList();
    
    // Configurar el formulario
    document.getElementById('patientForm').addEventListener('submit', function(e) {
        e.preventDefault();
        registerPatient();
    });
    
    // Configurar búsqueda
    document.getElementById('searchPatient').addEventListener('input', function() {
        filterPatients(this.value);
    });
}

// Cargar lista de pacientes
/*function loadPatientsList() {
    const container = document.getElementById('patientsList');
    container.innerHTML = '';
    
    if (patients.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No hay pacientes registrados.</p>';
        return;
    }
    
    // Ordenar pacientes por apellido
    patients.sort((a, b) => a.lastname.localeCompare(b.lastname));
    
    patients.forEach(patient => {
        const patientElement = document.createElement('div');
        patientElement.className = 'list-group-item patient-card';
        patientElement.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">${patient.name} ${patient.lastname}</h5>
                <small>${patient.age} años</small>
            </div>
            <p class="mb-1"><strong>Género:</strong> ${patient.gender}</p>
            <p class="mb-1"><strong>Contacto:</strong> ${patient.phone || 'No especificado'}</p>
            <p class="mb-1">
                <strong>Condiciones:</strong><br>
                ${patient.conditions.map(condition => `<span class="condition-badge">${condition}</span>`).join('')}
            </p>
            <div class="patient-actions">
                <button class="btn btn-sm btn-hospital" onclick="viewPatientDetails(${patient.id})">
                    <i class="fas fa-eye"></i> Ver Detalles
                </button>
                <button class="btn btn-sm btn-outline-hospital" onclick="editPatient(${patient.id})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deletePatient(${patient.id})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;
        container.appendChild(patientElement);
    });
}*/

// Filtrar pacientes
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
function registerPatient() {
    const name = document.getElementById('patientName').value;
    const lastname = document.getElementById('patientLastname').value;
    const age = parseInt(document.getElementById('patientAge').value);
    const gender = document.getElementById('patientGender').value;
    const phone = document.getElementById('patientPhone').value;
    const email = document.getElementById('patientEmail').value;
    const address = document.getElementById('patientAddress').value;
    
    // Procesar condiciones médicas
    const conditionsInput = document.getElementById('patientConditions').value;
    const conditions = conditionsInput.split(',').map(item => item.trim()).filter(item => item !== '');
    
    // Procesar alergias
    const allergiesInput = document.getElementById('patientAllergies').value;
    const allergies = allergiesInput.split(',').map(item => item.trim()).filter(item => item !== '');
    
    // Procesar medicamentos
    const medicationsInput = document.getElementById('patientMedications').value;
    const medications = medicationsInput.split(',').map(item => item.trim()).filter(item => item !== '');
    
    if (!name || !lastname || !age || !gender) {
        alert('Por favor, complete todos los campos obligatorios.');
        return;
    }
    
    const newPatient = {
        id: Date.now(),
        name,
        lastname,
        age,
        gender,
        phone: phone || '',
        email: email || '',
        address: address || '',
        conditions,
        allergies,
        medications,
        createdAt: new Date().toISOString().split('T')[0]
    };
    
    patients.push(newPatient);
    loadPatientsList();
    savePatients();
  
    
    
    // Reiniciar formulario
    
    
    alert('Paciente registrado correctamente.');
    document.getElementById('patientForm').reset();
}

// Guardar pacientes en localStorage
function savePatients() {
    localStorage.setItem('medicalPatients', JSON.stringify(patients));
}

// Ver detalles del paciente
function viewPatientDetails(patientId) {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    const detailsContent = document.getElementById('patientDetailsContent');
    detailsContent.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="patient-detail-item">
                    <h5>Información Personal</h5>
                    <p><strong>Nombre completo:</strong> ${patient.name} ${patient.lastname}</p>
                    <p><strong>Edad:</strong> ${patient.age} años</p>
                    <p><strong>Género:</strong> ${patient.gender}</p>
                    <p><strong>Teléfono:</strong> ${patient.phone || 'No especificado'}</p>
                    <p><strong>Email:</strong> ${patient.email || 'No especificado'}</p>
                    <p><strong>Dirección:</strong> ${patient.address || 'No especificada'}</p>
                </div>
                
                <div class="patient-detail-item">
                    <h5>Alergias</h5>
                    ${patient.allergies.length > 0 ? 
                        patient.allergies.map(allergy => `<span class="condition-badge" style="background-color: #dc3545;">${allergy}</span>`).join('') : 
                        '<p class="text-muted">No registra alergias</p>'}
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="patient-detail-item">
                    <h5>Condiciones Médicas</h5>
                    ${patient.conditions.length > 0 ? 
                        patient.conditions.map(condition => `<span class="condition-badge">${condition}</span>`).join('') : 
                        '<p class="text-muted">No registra condiciones médicas</p>'}
                </div>
                
                <div class="patient-detail-item">
                    <h5>Medicamentos Actuales</h5>
                    ${patient.medications.length > 0 ? 
                        '<ul class="list-unstyled">' + patient.medications.map(med => `<li>💊 ${med}</li>`).join('') + '</ul>' : 
                        '<p class="text-muted">No registra medicamentos actuales</p>'}
                </div>
                
                <div class="patient-detail-item">
                    <h5>Información Adicional</h5>
                    <p><strong>Fecha de registro:</strong> ${formatDate(patient.createdAt)}</p>
                    <p><strong>ID del paciente:</strong> ${patient.id}</p>
                </div>
            </div>
        </div>
        
        <div class="row mt-3">
            <div class="col-12">
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-hospital" onclick="editPatient(${patient.id})">
                        <i class="fas fa-edit me-1"></i> Editar Paciente
                    </button>
                    <button class="btn btn-outline-hospital" onclick="createPrescription(${patient.id})">
                        <i class="fas fa-prescription me-1"></i> Crear Receta
                    </button>
                    <button class="btn btn-outline-hospital" onclick="scheduleAppointment(${patient.id})">
                        <i class="fas fa-calendar-plus me-1"></i> Agendar Cita
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Mostrar sección de detalles
    document.getElementById('patientDetailsSection').classList.remove('hidden');
}

// Agendar cita para paciente específico
function scheduleAppointment(patientId) {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    // Guardar el ID del paciente en localStorage para que Citas.js lo detecte
    localStorage.setItem('selectedPatientForAppointment', patientId);
    
    // Redirigir a la página de citas
    window.location.href = '../citas/Citas.html';
}

// Cerrar detalles del paciente
function closePatientDetails() {
    document.getElementById('patientDetailsSection').classList.add('hidden');
}

// Editar paciente
let editingPatientId = null; // Variable global para rastrear qué paciente se está editando

function editPatient(patientId) {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    // Guardar el ID del paciente que se está editando
    editingPatientId = patientId;
    
    // Llenar el formulario con los datos del paciente
    document.getElementById('patientName').value = patient.name;
    document.getElementById('patientLastname').value = patient.lastname;
    document.getElementById('patientAge').value = patient.age;
    document.getElementById('patientGender').value = patient.gender;
    document.getElementById('patientPhone').value = patient.phone || '';
    document.getElementById('patientEmail').value = patient.email || '';
    document.getElementById('patientAddress').value = patient.address || '';
    document.getElementById('patientConditions').value = patient.conditions.join(', ');
    document.getElementById('patientAllergies').value = patient.allergies.join(', ');
    document.getElementById('patientMedications').value = patient.medications.join(', ');
    
    // Cambiar botón de "Agregar" a "Actualizar"
    const submitBtn = document.getElementById('submitBtn'); // Ajusta el ID según tu código
    submitBtn.textContent = 'Actualizar Paciente';
    submitBtn.style.backgroundColor = '#ffa500'; // Opcional: color diferente
    
    // Desplazarse al formulario
    document.getElementById('patientForm').scrollIntoView();
}

function savePatient() {
    // Si estamos editando, actualizar el paciente existente
    if (editingPatientId !== null) {
        const index = patients.findIndex(p => p.id === editingPatientId);
        if (index !== -1) {
            patients[index] = {
                id: editingPatientId,
                name: document.getElementById('patientName').value,
                lastname: document.getElementById('patientLastname').value,
                age: document.getElementById('patientAge').value,
                gender: document.getElementById('patientGender').value,
                phone: document.getElementById('patientPhone').value,
                email: document.getElementById('patientEmail').value,
                address: document.getElementById('patientAddress').value,
                conditions: document.getElementById('patientConditions').value.split(',').map(c => c.trim()),
                allergies: document.getElementById('patientAllergies').value.split(',').map(a => a.trim()),
                medications: document.getElementById('patientMedications').value.split(',').map(m => m.trim())
            };
        }
        
        // Resetear el formulario
        resetForm();
        editingPatientId = null;
        
    } else {
        // Si es nuevo paciente, agregar normalmente
        // Tu código para agregar paciente aquí
    }
    
    // Actualizar la vista de pacientes
    displayPatients();
}

function resetForm() {
    document.getElementById('patientForm').reset();
    
    // Restaurar botón a estado inicial
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.textContent = 'Agregar Paciente';
    submitBtn.style.backgroundColor = ''; // Restaurar color original
    
    editingPatientId = null;
}

// Eliminar paciente
function deletePatient(patientId, confirm = true) {
    if (confirm && !window.confirm('¿Está seguro de que desea eliminar este paciente?')) {
        return;
    }
    
    patients = patients.filter(p => p.id !== patientId);
    savePatients();
    loadPatientsList();
    closePatientDetails();
}

// Formatear fecha
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

// Funciones adicionales (placeholder)
function createPrescription(patientId) {
    alert(`Crear receta para el paciente con ID: ${patientId}`);
    // En una implementación real, esto redirigiría al módulo de recetas
}

// Función de cierre de sesión
function logout() {
    if (confirm('¿Está seguro de que desea cerrar sesión?')) {
        alert('Sesión cerrada correctamente.');
        window.location.href = '../DoctorInterface.html';
    }
}

// Inicializar la gestión de pacientes cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initializePatientManager();
});

// Crear receta para paciente específico
function createPrescription(patientId) {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    // Guardar el ID del paciente en localStorage para que Recetas.js lo detecte
    localStorage.setItem('selectedPatientForPrescription', patientId);
    
    // Redirigir a la página de recetas
    window.location.href = '../Recetas/Recetas.html';

    
}
// === AGREGAR ESTA FUNCIÓN NUEVA === //
// Función para ver historial médico del paciente
function viewMedicalHistory(patientId) {
    // Guardar paciente seleccionado en localStorage
    localStorage.setItem('selectedPatientForHistory', patientId);
    // Redirigir al historial médico
    window.location.href = '../PatientHistory.html';
}
// === FIN DE FUNCIÓN NUEVA === //