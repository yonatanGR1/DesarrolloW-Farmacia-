// Recetas.js - Funcionalidad específica para gestión de recetas

// Datos para la gestión de recetas
let prescriptions = JSON.parse(localStorage.getItem('medicalPrescriptions')) || [];

// Inicializar gestión de recetas
function initializePrescriptionManager() {
    loadPatientOptions();
    loadPrescriptionsList();
    setDefaultDates();
    
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

// Verificar si hay un paciente seleccionado desde pacientes
function checkSelectedPatient() {
    const selectedPatientId = localStorage.getItem('selectedPatientForPrescription');
    
    if (selectedPatientId) {
        // Encontrar el paciente en la lista
        const patients = getPatients();
        const patient = patients.find(p => p.id == selectedPatientId);
        if (patient) {
            // Seleccionar automáticamente el paciente en el dropdown
            document.getElementById('patientSelect').value = selectedPatientId;
            
            // Mostrar mensaje informativo
            showPatientSelectionMessage(patient);
        }
        
        // Limpiar la selección para futuras visitas
        localStorage.removeItem('selectedPatientForPrescription');
    }
}

// Mostrar mensaje cuando un paciente es seleccionado automáticamente
function showPatientSelectionMessage(patient) {
    const form = document.getElementById('prescriptionForm');
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

// Obtener lista de pacientes
function getPatients() {
    return JSON.parse(localStorage.getItem('medicalPatients')) || [];
}

// Cargar opciones de pacientes en el selector
function loadPatientOptions() {
    const patientSelect = document.getElementById('patientSelect');
    patientSelect.innerHTML = '<option value="">Seleccionar paciente...</option>';
    
    const patients = getPatients();
    patients.forEach(patient => {
        const option = document.createElement('option');
        option.value = patient.id;
        option.textContent = `${patient.name} ${patient.lastname} (${patient.age} años)`;
        patientSelect.appendChild(option);
    });
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

// Crear nueva receta
function createPrescription() {
    const patientId = document.getElementById('patientSelect').value;
    const prescriptionDate = document.getElementById('prescriptionDate').value;
    const prescriptionValidity = document.getElementById('prescriptionValidity').value;
    const generalInstructions = document.getElementById('prescriptionInstructions').value;
    const doctorNotes = document.getElementById('doctorNotes').value;
    
    // Validar paciente seleccionado
    if (!patientId) {
        alert('Por favor, seleccione un paciente.');
        return;
    }
    
    // Obtener medicamentos
    const medications = getMedicationsFromForm();
    if (medications.length === 0) {
        alert('Por favor, agregue al menos un medicamento.');
        return;
    }
    
    // Validar que todos los medicamentos tengan nombre y dosis
    const invalidMedication = medications.find(med => !med.name || !med.dose || !med.frequency);
    if (invalidMedication) {
        alert('Por favor, complete todos los campos obligatorios para cada medicamento.');
        return;
    }
    
    const newPrescription = {
        id: Date.now(),
        patientId: parseInt(patientId),
        date: prescriptionDate,
        validity: prescriptionValidity,
        medications: medications,
        generalInstructions: generalInstructions,
        doctorNotes: doctorNotes,
        status: 'active',
        createdAt: new Date().toISOString()
    };
    
    prescriptions.push(newPrescription);
    savePrescriptions();
    loadPrescriptionsList();
    
    // Reiniciar formulario
    document.getElementById('prescriptionForm').reset();
    resetMedicationsForm();
    setDefaultDates();
    
    // Remover mensaje de selección si existe
    const messageDiv = document.getElementById('patientSelectionMessage');
    if (messageDiv) {
        messageDiv.remove();
    }
    
    alert('Receta emitida correctamente.');
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

// Cargar lista de recetas
function loadPrescriptionsList() {
    const container = document.getElementById('prescriptionsList');
    container.innerHTML = '';
    
    if (prescriptions.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No hay recetas emitidas.</p>';
        return;
    }
    
    // Ordenar recetas por fecha (más recientes primero)
    prescriptions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const patients = getPatients();
    
    prescriptions.forEach(prescription => {
        const patient = patients.find(p => p.id == prescription.patientId);
        const patientName = patient ? `${patient.name} ${patient.lastname}` : 'Paciente desconocido';
        
        // Determinar estado de la receta
        const today = new Date();
        const validityDate = new Date(prescription.validity);
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
            <p class="mb-1"><strong>Fecha:</strong> ${formatDate(prescription.date)}</p>
            <p class="mb-1"><strong>Válida hasta:</strong> ${formatDate(prescription.validity)}</p>
            <p class="mb-1">
                <strong>Medicamentos:</strong><br>
                ${prescription.medications.map(med => 
                    `<span class="medication-badge">${med.name} ${med.dose}</span>`
                ).join('')}
            </p>
            <div class="prescription-actions">
                <button class="btn btn-sm btn-hospital" onclick="viewPrescriptionDetails(${prescription.id})">
                    <i class="fas fa-eye"></i> Ver Detalles
                </button>
                <button class="btn btn-sm btn-outline-hospital" onclick="printPrescription(${prescription.id})">
                    <i class="fas fa-print"></i> Imprimir
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deletePrescription(${prescription.id})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;
        container.appendChild(prescriptionElement);
    });
}

// Filtrar recetas
function filterPrescriptions(searchTerm) {
    const container = document.getElementById('prescriptionsList');
    const prescriptionCards = container.getElementsByClassName('prescription-card');
    const patients = getPatients();
    
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
function viewPrescriptionDetails(prescriptionId) {
    const prescription = prescriptions.find(p => p.id === prescriptionId);
    if (!prescription) return;
    
    const patients = getPatients();
    const patient = patients.find(p => p.id == prescription.patientId);
    const patientName = patient ? `${patient.name} ${patient.lastname}` : 'Paciente desconocido';
    
    const detailsContent = document.getElementById('prescriptionPreviewContent');
    detailsContent.innerHTML = generatePrescriptionPreview(prescription, patient, patientName);
    
    // Mostrar sección de vista previa
    document.getElementById('prescriptionPreviewSection').classList.remove('hidden');
}

// Vista previa de receta
function previewPrescription() {
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
    
    const patients = getPatients();
    const patient = patients.find(p => p.id == patientId);
    const patientName = patient ? `${patient.name} ${patient.lastname}` : 'Paciente desconocido';
    
    const previewPrescription = {
        date: prescriptionDate,
        validity: prescriptionValidity,
        medications: medications,
        generalInstructions: generalInstructions,
        doctorNotes: doctorNotes
    };
    
    const detailsContent = document.getElementById('prescriptionPreviewContent');
    detailsContent.innerHTML = generatePrescriptionPreview(previewPrescription, patient, patientName, true);
    
    // Mostrar sección de vista previa
    document.getElementById('prescriptionPreviewSection').classList.remove('hidden');
}

// Generar HTML para vista previa de receta
function generatePrescriptionPreview(prescription, patient, patientName, isPreview = false) {
    const today = new Date().toLocaleDateString('es-ES');
    
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
                        ${patient ? `<p><strong>Edad:</strong> ${patient.age} años</p>` : ''}
                    </div>
                    <div class="col-md-6 text-end">
                        <p><strong>Fecha:</strong> ${formatDate(prescription.date)}</p>
                        <p><strong>Válida hasta:</strong> ${formatDate(prescription.validity)}</p>
                    </div>
                </div>
            </div>
            
            <div class="prescription-medications">
                <h5>MEDICAMENTOS RECETADOS:</h5>
                ${prescription.medications.map(med => `
                    <div class="medication-row">
                        <div class="medication-name">${med.name} ${med.dose}</div>
                        <div class="medication-details">
                            ${med.frequency}
                            ${med.duration ? ` por ${med.duration} días` : ''}
                            ${med.specialInstructions ? `<br><small>${med.specialInstructions}</small>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            ${prescription.generalInstructions ? `
                <div class="prescription-instructions">
                    <h5>INSTRUCCIONES GENERALES:</h5>
                    <p>${prescription.generalInstructions}</p>
                </div>
            ` : ''}
            
            ${prescription.doctorNotes ? `
                <div class="doctor-notes">
                    <h5>NOTAS MÉDICAS:</h5>
                    <p>${prescription.doctorNotes}</p>
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
                <button class="btn btn-hospital" onclick="printPrescription(${prescription.id})">
                    <i class="fas fa-print me-1"></i> Imprimir Receta
                </button>
            </div>
        ` : ''}
    `;
}

// Cerrar vista previa
function closePrescriptionPreview() {
    document.getElementById('prescriptionPreviewSection').classList.add('hidden');
}

// Imprimir receta
function printPrescription(prescriptionId) {
    const prescription = prescriptions.find(p => p.id === prescriptionId);
    if (!prescription) return;
    
    const patients = getPatients();
    const patient = patients.find(p => p.id == prescription.patientId);
    const patientName = patient ? `${patient.name} ${patient.lastname}` : 'Paciente desconocido';
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receta Médica - ${patientName}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .prescription-preview { background: white; border: 2px solid #333; padding: 30px; }
                .prescription-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
                .prescription-header h2 { color: #2c7db1; margin: 0; }
                .prescription-header h4 { color: #666; margin: 5px 0; }
                .medication-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #ccc; }
                .doctor-signature { margin-top: 50px; border-top: 1px solid #333; padding-top: 10px; display: inline-block; min-width: 200px; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            ${generatePrescriptionPreview(prescription, patient, patientName)}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        // printWindow.close(); // Opcional: cerrar ventana después de imprimir
    }, 500);
}

// Eliminar receta
function deletePrescription(prescriptionId, confirm = true) {
    if (confirm && !window.confirm('¿Está seguro de que desea eliminar esta receta?')) {
        return;
    }
    
    prescriptions = prescriptions.filter(p => p.id !== prescriptionId);
    savePrescriptions();
    loadPrescriptionsList();
    closePrescriptionPreview();
}

// Guardar recetas en localStorage
function savePrescriptions() {
    localStorage.setItem('medicalPrescriptions', JSON.stringify(prescriptions));
}

// Formatear fecha
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

// Función de cierre de sesión
function logout() {
    if (confirm('¿Está seguro de que desea cerrar sesión?')) {
        alert('Sesión cerrada correctamente.');
        window.location.href = '../DoctorInterface.html';
    }
}

// Inicializar la gestión de recetas cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initializePrescriptionManager();
});