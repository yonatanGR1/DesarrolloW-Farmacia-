// Recetas.js - Funcionalidad específica para gestión de recetas con MongoDB

const API_RECETAS = '/api/recetas';
let prescriptions = [];

// Inicializar gestión de recetas
async function initializePrescriptionManager() {
    await loadPatientOptions();
    await loadPrescriptionsList();
    setDefaultDates();
    
    // Cargar parámetros de la URL (si viene desde diagnóstico)
    loadUrlParameters();
    
    // Configurar el formulario
    document.getElementById('prescriptionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        createPrescription();
    });
    
    // Configurar búsqueda
    document.getElementById('searchPrescription').addEventListener('input', function() {
        filterPrescriptions(this.value);
    });
    
    // Verificar si hay un paciente seleccionado desde el módulo de pacientes
    checkSelectedPatient();
}

// Cargar parámetros de la URL cuando venga desde diagnóstico
function loadUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const pacienteId = urlParams.get('pacienteId');
    const pacienteNombre = urlParams.get('pacienteNombre');
    const pacienteApellido = urlParams.get('pacienteApellido');
    const diagnosticoId = urlParams.get('diagnosticoId');
    const tipoDiagnostico = urlParams.get('tipoDiagnostico');

    console.log('Datos recibidos desde diagnóstico:', { 
        pacienteId, 
        pacienteNombre, 
        pacienteApellido, 
        diagnosticoId, 
        tipoDiagnostico 
    });

    // Si hay parámetros, preseleccionar el paciente
    if (pacienteId && pacienteNombre && pacienteApellido) {
        setTimeout(() => {
            preselectPatient(pacienteId, pacienteNombre, pacienteApellido, tipoDiagnostico);
        }, 1000);
    }
}

// Preseleccionar paciente cuando venga desde diagnóstico
function preselectPatient(pacienteId, pacienteNombre, pacienteApellido, tipoDiagnostico) {
    const patientSelect = document.getElementById('patientSelect');
    
    // Buscar si el paciente existe en las opciones
    let patientFound = false;
    for (let i = 0; i < patientSelect.options.length; i++) {
        if (patientSelect.options[i].value === pacienteId) {
            patientSelect.value = pacienteId;
            patientFound = true;
            break;
        }
    }
    
    // Si no existe, agregarlo como opción
    if (!patientFound && pacienteId) {
        const option = document.createElement('option');
        option.value = pacienteId;
        option.textContent = `${pacienteNombre} ${pacienteApellido}`;
        option.setAttribute('data-patient', JSON.stringify({
            _id: pacienteId,
            nombre: pacienteNombre,
            apellido: pacienteApellido,
            edad: 'No especificada',
            genero: 'No especificado'
        }));
        patientSelect.appendChild(option);
        patientSelect.value = pacienteId;
    }
    
    // Mostrar mensaje informativo
    if (patientSelect.value === pacienteId) {
        showPatientSelectionMessage(pacienteNombre, pacienteApellido, tipoDiagnostico);
        
        // Scroll al formulario
        document.getElementById('prescriptionForm').scrollIntoView({ behavior: 'smooth' });
    }
}

// Mostrar mensaje cuando un paciente es seleccionado automáticamente
function showPatientSelectionMessage(pacienteNombre, pacienteApellido, tipoDiagnostico) {
    const form = document.getElementById('prescriptionForm');
    const existingMessage = document.getElementById('patientSelectionMessage');
    
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.id = 'patientSelectionMessage';
    messageDiv.className = 'alert alert-info alert-dismissible fade show mt-3';
    messageDiv.innerHTML = `
        <i class="fas fa-info-circle me-2"></i>
        <strong>Paciente desde diagnóstico:</strong> ${pacienteNombre} ${pacienteApellido}
        ${tipoDiagnostico ? `| <strong>Diagnóstico:</strong> ${tipoDiagnostico}` : ''}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insertar después del título o en una posición visible
    const cardBody = document.querySelector('.card-body');
    if (cardBody) {
        cardBody.insertBefore(messageDiv, cardBody.querySelector('form'));
    }
}

// Obtener lista de pacientes desde la API
async function getPatients() {
    try {
        const res = await fetch("/api/pacientes");
        if (!res.ok) {
            throw new Error('Error al cargar pacientes');
        }
        const pacientes = await res.json();
        return pacientes;
    } catch (error) {
        console.error('Error cargando pacientes:', error);
        return [];
    }
}

// Cargar opciones de pacientes en el selector
async function loadPatientOptions() {
    const patientSelect = document.getElementById('patientSelect');
    patientSelect.innerHTML = '<option value="">Seleccionar paciente...</option>';
    
    try {
        const patients = await getPatients();
        
        patients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient._id;
            option.textContent = `${patient.nombre} ${patient.apellido} (${patient.edad} años)`;
            option.setAttribute('data-patient', JSON.stringify(patient));
            patientSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando opciones de pacientes:', error);
        patientSelect.innerHTML = '<option value="">Error al cargar pacientes</option>';
    }
}

// Verificar si hay un paciente seleccionado desde pacientes
function checkSelectedPatient() {
    const selectedPatientId = localStorage.getItem('selectedPatientForPrescription');
    
    if (selectedPatientId) {
        document.getElementById('patientSelect').value = selectedPatientId;
        showPatientSelectionMessageFromStorage(selectedPatientId);
        localStorage.removeItem('selectedPatientForPrescription');
    }
}

// Mostrar mensaje cuando un paciente es seleccionado desde almacenamiento
async function showPatientSelectionMessageFromStorage(patientId) {
    try {
        const patients = await getPatients();
        const patient = patients.find(p => p._id === patientId);
        
        if (patient) {
            showPatientSelectionMessage(patient.nombre, patient.apellido, '');
        }
    } catch (error) {
        console.error('Error mostrando mensaje de selección:', error);
    }
}

// Establecer fechas por defecto
function setDefaultDates() {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    
    document.getElementById('prescriptionDate').value = today.toISOString().split('T')[0];
    document.getElementById('prescriptionValidity').value = nextMonth.toISOString().split('T')[0];
}

// Agregar campo de medicamento
function addMedication() {
    const container = document.getElementById('medicationsContainer');
    const newMedication = document.createElement('div');
    newMedication.className = 'medication-item border p-3 mb-3 rounded';
    newMedication.innerHTML = `
        <div class="row">
            <div class="col-md-6 mb-2">
                <input type="text" class="form-control medication-name" placeholder="Nombre del medicamento *" required>
            </div>
            <div class="col-md-3 mb-2">
                <input type="text" class="form-control medication-dose" placeholder="Dosis *" required>
            </div>
            <div class="col-md-3 mb-2">
                <select class="form-select medication-frequency" required>
                    <option value="">Frecuencia...</option>
                    <option value="Cada 8 horas">Cada 8 horas</option>
                    <option value="Cada 12 horas">Cada 12 horas</option>
                    <option value="Una vez al día">Una vez al día</option>
                    <option value="Dos veces al día">Dos veces al día</option>
                    <option value="Tres veces al día">Tres veces al día</option>
                    <option value="Cuando sea necesario">Cuando sea necesario</option>
                </select>
            </div>
        </div>
        <div class="row">
            <div class="col-md-6 mb-2">
                <input type="number" class="form-control medication-duration" placeholder="Duración (días)" min="1">
            </div>
            <div class="col-md-6 mb-2">
                <input type="text" class="form-control medication-instructions" placeholder="Instrucciones especiales">
            </div>
        </div>
        <button type="button" class="btn btn-sm btn-outline-danger remove-medication" onclick="removeMedication(this)">
            <i class="fas fa-times"></i> Eliminar
        </button>
    `;
    container.appendChild(newMedication);
}

// Remover campo de medicamento
function removeMedication(button) {
    const medicationItems = document.querySelectorAll('.medication-item');
    if (medicationItems.length > 1) {
        button.closest('.medication-item').remove();
    } else {
        alert('Debe haber al menos un medicamento en la receta.');
    }
}

// Crear nueva receta en MongoDB
async function createPrescription() {
    const patientId = document.getElementById('patientSelect').value;
    const prescriptionDate = document.getElementById('prescriptionDate').value;
    const prescriptionValidity = document.getElementById('prescriptionValidity').value;
    const generalInstructions = document.getElementById('prescriptionInstructions').value;
    const doctorNotes = document.getElementById('doctorNotes').value;
    
    if (!patientId) {
        alert('Por favor, seleccione un paciente.');
        return;
    }
    
    const medications = getMedicationsFromForm();
    if (medications.length === 0) {
        alert('Por favor, agregue al menos un medicamento.');
        return;
    }
    
    const invalidMedication = medications.find(med => !med.name || !med.dose || !med.frequency);
    if (invalidMedication) {
        alert('Por favor, complete todos los campos obligatorios para cada medicamento.');
        return;
    }
    
    try {
        const patientSelect = document.getElementById('patientSelect');
        const selectedOption = patientSelect.options[patientSelect.selectedIndex];
        const patientData = JSON.parse(selectedOption.getAttribute('data-patient'));
        
        // Obtener diagnósticoId de la URL si existe
        const urlParams = new URLSearchParams(window.location.search);
        const diagnosticoId = urlParams.get('diagnosticoId');
        
        const nuevaReceta = {
            pacienteId: patientId,
            pacienteNombre: patientData.nombre,
            pacienteApellido: patientData.apellido,
            pacienteEdad: patientData.edad,
            pacienteGenero: patientData.genero,
            fechaEmision: prescriptionDate,
            fechaValidez: prescriptionValidity,
            medicamentos: medications.map(med => ({
                nombre: med.name,
                dosis: med.dose,
                frecuencia: med.frequency,
                duracion: med.duration || '',
                instruccionesEspeciales: med.specialInstructions || ''
            })),
            instruccionesGenerales: generalInstructions,
            notasMedico: doctorNotes,
            doctorNombre: "Dr. Juan Pérez",
            estado: 'activa',
            // Agregar referencia al diagnóstico si existe
            ...(diagnosticoId && { diagnosticoId: diagnosticoId })
        };
        
        const response = await fetch(API_RECETAS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(nuevaReceta),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al crear receta');
        }
        
        const recetaCreada = await response.json();
        
        await loadPrescriptionsList();
        
        document.getElementById('prescriptionForm').reset();
        resetMedicationsForm();
        setDefaultDates();
        
        // Limpiar mensajes y parámetros de URL
        const messageDiv = document.getElementById('patientSelectionMessage');
        if (messageDiv) {
            messageDiv.remove();
        }
        
        // Limpiar parámetros de la URL
        window.history.replaceState({}, '', window.location.pathname);
        
        alert('Receta emitida correctamente.');
        
    } catch (error) {
        console.error('Error creando receta:', error);
        alert('Error al crear la receta: ' + error.message);
    }
}

// Obtener medicamentos del formulario
function getMedicationsFromForm() {
    const medications = [];
    const medicationItems = document.querySelectorAll('.medication-item');
    
    medicationItems.forEach(item => {
        const name = item.querySelector('.medication-name').value;
        const dose = item.querySelector('.medication-dose').value;
        const frequency = item.querySelector('.medication-frequency').value;
        const duration = item.querySelector('.medication-duration').value;
        const instructions = item.querySelector('.medication-instructions').value;
        
        if (name || dose || frequency) {
            medications.push({
                name,
                dose,
                frequency,
                duration: duration || '',
                specialInstructions: instructions || ''
            });
        }
    });
    
    return medications;
}

// Reiniciar formulario de medicamentos
function resetMedicationsForm() {
    const container = document.getElementById('medicationsContainer');
    container.innerHTML = `
        <div class="medication-item border p-3 mb-3 rounded">
            <div class="row">
                <div class="col-md-6 mb-2">
                    <input type="text" class="form-control medication-name" placeholder="Nombre del medicamento *" required>
                </div>
                <div class="col-md-3 mb-2">
                    <input type="text" class="form-control medication-dose" placeholder="Dosis *" required>
                </div>
                <div class="col-md-3 mb-2">
                    <select class="form-select medication-frequency" required>
                        <option value="">Frecuencia...</option>
                        <option value="Cada 8 horas">Cada 8 horas</option>
                        <option value="Cada 12 horas">Cada 12 horas</option>
                        <option value="Una vez al día">Una vez al día</option>
                        <option value="Dos veces al día">Dos veces al día</option>
                        <option value="Tres veces al día">Tres veces al día</option>
                        <option value="Cuando sea necesario">Cuando sea necesario</option>
                    </select>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-2">
                    <input type="number" class="form-control medication-duration" placeholder="Duración (días)" min="1">
                </div>
                <div class="col-md-6 mb-2">
                    <input type="text" class="form-control medication-instructions" placeholder="Instrucciones especiales">
                </div>
            </div>
            <button type="button" class="btn btn-sm btn-outline-danger remove-medication" onclick="removeMedication(this)">
                <i class="fas fa-times"></i> Eliminar
            </button>
        </div>
    `;
}

// Cargar lista de recetas desde MongoDB
async function loadPrescriptionsList() {
    const container = document.getElementById('prescriptionsList');
    container.innerHTML = '<p class="text-center text-muted">Cargando recetas...</p>';
    
    try {
        const response = await fetch(API_RECETAS);
        if (!response.ok) {
            throw new Error('Error al cargar recetas');
        }
        
        prescriptions = await response.json();
        container.innerHTML = '';
        
        if (prescriptions.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">No hay recetas emitidas.</p>';
            return;
        }
        
        prescriptions.forEach(prescription => {
            const patientName = `${prescription.pacienteNombre} ${prescription.pacienteApellido}`;
            
            const today = new Date();
            const validityDate = new Date(prescription.fechaValidez);
            const isExpired = validityDate < today;
            const statusClass = isExpired ? 'expired' : 'active';
            const statusText = isExpired ? 'Expirada' : 'Activa';
            
            const prescriptionElement = document.createElement('div');
            prescriptionElement.className = `list-group-item prescription-card ${statusClass}`;
            prescriptionElement.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">${patientName}</h5>
                    <small class="${isExpired ? 'status-expired' : 'status-active'}">${statusText}</small>
                </div>
                <p class="mb-1"><strong>Fecha:</strong> ${formatDate(prescription.fechaEmision)}</p>
                <p class="mb-1"><strong>Válida hasta:</strong> ${formatDate(prescription.fechaValidez)}</p>
                <p class="mb-1">
                    <strong>Medicamentos:</strong><br>
                    ${prescription.medicamentos.map(med => 
                        `<span class="medication-badge">${med.nombre} ${med.dosis}</span>`
                    ).join('')}
                </p>
                <div class="prescription-actions">
                    <button class="btn btn-sm btn-hospital" onclick="viewPrescriptionDetails('${prescription._id}')">
                        <i class="fas fa-eye"></i> Ver Detalles
                    </button>
                  
                    <button class="btn btn-sm btn-outline-danger" onclick="deletePrescription('${prescription._id}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            `;
            container.appendChild(prescriptionElement);
        });
    } catch (error) {
        console.error('Error cargando recetas:', error);
        container.innerHTML = '<p class="text-center text-muted">Error al cargar recetas.</p>';
    }
}

// Filtrar recetas
function filterPrescriptions(searchTerm) {
    const container = document.getElementById('prescriptionsList');
    const prescriptionCards = container.getElementsByClassName('prescription-card');
    
    for (let card of prescriptionCards) {
        const patientName = card.querySelector('h5').textContent.toLowerCase();
        const medicationsText = card.textContent.toLowerCase();
        
        if (patientName.includes(searchTerm.toLowerCase()) || medicationsText.includes(searchTerm.toLowerCase())) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    }
}

// Ver detalles de receta
async function viewPrescriptionDetails(prescriptionId) {
    try {
        const response = await fetch(`${API_RECETAS}/${prescriptionId}`);
        if (!response.ok) {
            throw new Error('Error al cargar receta');
        }
        
        const prescription = await response.json();
        const patientName = `${prescription.pacienteNombre} ${prescription.pacienteApellido}`;
        
        const patientData = {
            name: prescription.pacienteNombre,
            lastname: prescription.pacienteApellido,
            age: prescription.pacienteEdad,
            gender: prescription.pacienteGenero
        };
        
        const detailsContent = document.getElementById('prescriptionPreviewContent');
        detailsContent.innerHTML = generatePrescriptionPreview(prescription, patientData, patientName);
        
        document.getElementById('prescriptionPreviewSection').classList.remove('d-none');
        
        // Desplazar hacia la sección de detalles
        document.getElementById('prescriptionPreviewSection').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error cargando detalles de receta:', error);
        alert('Error al cargar los detalles de la receta.');
    }
}

// Vista previa de receta
async function previewPrescription() {
    const patientId = document.getElementById('patientSelect').value;
    const prescriptionDate = document.getElementById('prescriptionDate').value;
    const prescriptionValidity = document.getElementById('prescriptionValidity').value;
    const generalInstructions = document.getElementById('prescriptionInstructions').value;
    const doctorNotes = document.getElementById('doctorNotes').value;
    
    if (!patientId) {
        alert('Por favor, seleccione un paciente para generar la vista previa.');
        return;
    }
    
    const medications = getMedicationsFromForm();
    if (medications.length === 0) {
        alert('Por favor, agregue al menos un medicamento para generar la vista previa.');
        return;
    }
    
    try {
        const patientSelect = document.getElementById('patientSelect');
        const selectedOption = patientSelect.options[patientSelect.selectedIndex];
        const patient = JSON.parse(selectedOption.getAttribute('data-patient'));
        const patientName = `${patient.nombre} ${patient.apellido}`;
        
        const previewPrescription = {
            fechaEmision: prescriptionDate,
            fechaValidez: prescriptionValidity,
            medicamentos: medications.map(med => ({
                nombre: med.name,
                dosis: med.dose,
                frecuencia: med.frequency,
                duracion: med.duration || '',
                instruccionesEspeciales: med.specialInstructions || ''
            })),
            instruccionesGenerales: generalInstructions,
            notasMedico: doctorNotes,
            pacienteNombre: patient.nombre,
            pacienteApellido: patient.apellido,
            pacienteEdad: patient.edad,
            pacienteGenero: patient.genero
        };
        
        const detailsContent = document.getElementById('prescriptionPreviewContent');
        detailsContent.innerHTML = generatePrescriptionPreview(previewPrescription, patient, patientName, true);
        
        document.getElementById('prescriptionPreviewSection').classList.remove('d-none');
        
        // Desplazar hacia la sección de vista previa
        document.getElementById('prescriptionPreviewSection').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error generando vista previa:', error);
        alert('Error al generar la vista previa. Por favor, intente nuevamente.');
    }
}

// Generar HTML para vista previa de receta
function generatePrescriptionPreview(prescription, patient, patientName, isPreview = false) {
    return `
        <div class="prescription-preview">
            <div class="prescription-header">
                <h2>HOSPITAL LA PAZ</h2>
                <h4>Servicio de Medicina General</h4>
                <p>Calle Principal 123, Ciudad - Tel: 123-456-7890</p>
                <hr>
                <h3>RECETA MÉDICA</h3>
            </div>
            
            <div class="prescription-details">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Paciente:</strong> ${patientName}</p>
                        <p><strong>Edad:</strong> ${patient.age || patient.edad} años</p>
                        <p><strong>Género:</strong> ${patient.gender || patient.genero}</p>
                    </div>
                    <div class="col-md-6 text-end">
                        <p><strong>Fecha:</strong> ${formatDate(prescription.fechaEmision)}</p>
                        <p><strong>Válida hasta:</strong> ${formatDate(prescription.fechaValidez)}</p>
                    </div>
                </div>
            </div>
            
            <div class="prescription-medications">
                <h5>MEDICAMENTOS RECETADOS:</h5>
                ${prescription.medicamentos.map(med => `
                    <div class="medication-row">
                        <div class="medication-name"><strong>${med.nombre} ${med.dosis}</strong></div>
                        <div class="medication-details">
                            ${med.frecuencia}
                            ${med.duracion ? ` por ${med.duracion} días` : ''}
                            ${med.instruccionesEspeciales ? `<br><small><strong>Instrucciones:</strong> ${med.instruccionesEspeciales}</small>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            ${prescription.instruccionesGenerales ? `
                <div class="prescription-instructions">
                    <h5>INSTRUCCIONES GENERALES:</h5>
                    <p>${prescription.instruccionesGenerales}</p>
                </div>
            ` : ''}
            
            ${prescription.notasMedico ? `
                <div class="doctor-notes">
                    <h5>NOTAS MÉDICAS:</h5>
                    <p>${prescription.notasMedico}</p>
                </div>
            ` : ''}
            
            <div class="prescription-footer">
                <div class="doctor-signature">
                    <p>_________________________</p>
                    <p><strong>Dr. Juan Pérez</strong></p>
                    <p>Médico General</p>
                    <p>Lic. MG-12345</p>
                </div>
            </div>
            
            ${isPreview ? `
                <div class="alert alert-warning mt-3">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>VISTA PREVIA</strong> - Esta es una vista previa. La receta no ha sido guardada.
                </div>
            ` : ''}
        </div>
        
        ${!isPreview ? `
            <div class="text-center mt-3">              
            </div>
        ` : ''}
    `;
}

// Formatear fecha
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

// Función de cierre de sesión
function logout() {
    if (confirm('¿Está seguro de que desea cerrar sesión?')) {
        localStorage.removeItem('currentPatient');
        window.location.href = '../../index.html';
    }
}

// Inicializar la gestión de recetas cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initializePrescriptionManager();
});