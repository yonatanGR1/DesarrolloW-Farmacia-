//--- Funcion para cargar pacientes en la tabla ----
async function cargarPacientes() {
    try {
        const res = await fetch("/api/pacientes"); //Llama al endpoint GET 
        const pacientes = await res.json();

                //Ver en consola tambien 
                console.table(pacientes);

                //ordenar por apellido 
                pacientes.sort((a,b) => a.apellido.localeCompare(b.apellido));

                //------------DIVS (CARDS)-----------------
                const container = document.querySelector("#patientsList");
                container.innerHTML= "";

                if (pacientes.length === 0) {
                    container.innerHTML = '<p class="text-center text-muted">No hay pacientes registrados.</p>';
                    return;
                }

                pacientes.forEach(p => {
                    //ID unico por paciente 
                    //const modalId = `modal-${p.email.replace(/[@.]/g, "-")}`;//evitamos caracteres no validos en id
                    const modalId = `modal-${p._id}`;
                   
                    const patientElement = document.createElement('div');
                    patientElement.id = `patient-${p._id}`;
                    patientElement.className = 'patientElement';
                    //patientElement.className = 'list-group-item patient-card';
                    patientElement.innerHTML = `
                        <div class="targetPatient">
                            <h1 style="font-size: 25px; display: inline-block;">${p.nombre} ${p.apellido}</h1>
                            <h2 style="font-size: 15px;" class="styleTargeAge">${p.edad} años </h2>
                            <h3 style="font-size: 15px;"><strong>Género: </strong>${p.genero}</h3>
                            <h3 style="font-size: 15px;"><strong>Telefono: </strong>${p.telefono}</h3>
                            <h3 style="font-size: 15px;"><strong>Email: </strong>${p.email}</h3>
                        </div>

                        <div>
                            <div class="box">
                                <button popovertarget="${modalId}" class="btn btn-sm btn-hospital" onclick="viewPatientDetails('${p.email}')">
                                    <i class="fas fa-eye"></i> Ver Detalles
                                </button>
                                <div class="boxModal" id="${modalId}" popover>
                                    <h1 style="font-size: 25px; display: inline-block;">${p.nombre} ${p.apellido}</h1>
                                    <button class="btnClose" popovertarget="${modalId}">Close</button>
                                </div>
                            </div>

                            <div class="box">
                                <button class="btn btn-sm btn-outline-hospital" onclick="editPatient('${p._id}')">
                                    <i class="fas fa-edit"></i> Editar
                                </button>
                            </div class="box">
                            <div class="box">
                                <button class="btn btn-sm btn-outline-danger" onclick="deletePatient('${p._id}')">
                                    <i class="fas fa-trash"></i> Eliminar
                                </button>
                            </div>
                        </div>
                    `;
                    container.appendChild(patientElement);
                });
        
    } catch (error) {
        console.error("Error cargando pacientes:", err);
    }

            //---------TABLA DE PACIENTES---------

            /*try {
                const res = await fetch("/api/pacientes"); //Llama al endpoint GET 
                const pacientes = await res.json();

                //Ver en consola tambien 
                console.table(pacientes);

                //ordenar por apellido 
                pacientes.sort((a,b) => a.apellido.localeCompare(b.apellido));

                const tbody = document.querySelector("#tablaPacientesBody");
                tbody.innerHTML = ""; //Limpiar antes de llenar

                pacientes.forEach(p => {
                    const fila = document.createElement("tr");
                    fila.innerHTML = `
                        <td>${p.nombre}</td>
                        <td>${p.apellido}</td>
                        <td>${p.edad}</td>
                        <td>${p.genero}</td>
                        <td>${p.telefono}</td>
                        <td>${p.email}</td>
                        <td>${p.direccion}</td>
                    `;
                    tbody.appendChild(fila); //Agregar fila al cuerpo de la tabla
                });
            } catch (err) {
                console.error("Error cargando pacientes:", err)
            }*/
        }


//Agrega un evento que se ejecuta al enviar el formulario 
//--------------------------- AGREGAR PACIENTE----------------------
document.getElementById('patientForm').addEventListener('submit', async (e) => { 
    e.preventDefault();//Evita que la pagina se recargue al enviar 

    const nombre = document.getElementById('patientName').value;//Obtiene el texto del campo Nombre
    const apellido = document.getElementById('patientLastname').value;//Obtiene el texto del campo "apellido"
    const edad = document.getElementById('patientAge').value;//Obtiene el texto del campo edad
    const genero = document.getElementById('patientGender').value;//Obtiene el valor seleccionado en rol 
    const telefono = document.getElementById('patientPhone').value;
    const email = document.getElementById('patientEmail').value;
    const direccion = document.getElementById('patientAddress').value;
    const messageElement = document.getElementById('message');//Obtiene el valor de message

    // Validaciones básicas
    //!nombre indica si nombre esta vacion 
    if (!nombre || !apellido || !edad || !genero || !telefono || !email ) {//Si falta alguno de lo campos obligatorios 
        messageElement.textContent = 'Todos los campos son obligatorios';//Muesta mensaje de error 
        messageElement.style.color = 'red';//Pone el mensaje en rojo 
        return; //Sale de la funcion y no sigue con la peticion 
    }

    try {//Intenta ejecutar la peticion al servidor 
        //fetch manda una peticion HTTP al servidor 
        //await espera a que una promise termine y da su resultado 
        const response = await fetch('/api/pacientes', {
            //PUT : Actualizar datos , DELETE : borrar datos
            method: 'POST',//Enviar datos al servidor 
            headers: {
                'Content-Type': 'application/json', //Tipo de contenido, Formato JSON 
            },
            body: JSON.stringify({//stringify convierte un objeto o arreglo a una cadena de texto Formato JSON 
                nombre,
                apellido,
                edad,
                genero,
                telefono,
                email,
                direccion 
            }),
        });

        //Espera a que la respuesta se convierta de texto JSON a un objeto de Javascript y guardalo en data
        const data = await response.json();

        //Mostrar como tabla 
        console.table(data);

        if (response.ok) {//Si la respuesta fue exitosa (status 200-209)
            messageElement.textContent = 'Registro de pasiente Creado exitosamente!';
            messageElement.style.color = 'green';
            
            // Limpiar formulario
            document.getElementById('patientForm').reset();
            
            // Redirigir al login después de 2 segundos
            setTimeout(() => {
                window.location.href = '/Pacientes';
            }, 2000);
        } else {
            messageElement.textContent = data.error || 'Error al registrar paciente';
            messageElement.style.color = 'red';
        }
    } catch (error) {
        //Muestra Error y luego su objeto error (con su stack)
        console.error('Error:', error);
        messageElement.textContent = 'Error de conexión con el servidor';
        messageElement.style.color = 'red';
    }
});

//-------------------ELIMINAR PACIENTE--------------------------------------
async function deletePatient(id) {
   //Pedir confirmacion al usuario antes de borrar. Si !confirm no es valido. = true
   if(!confirm('Seguro que desea eliminar este paciente? Esta accion no se puede deshacer.')){
    return;
   } 

   try {
    //Realizar la peticion DELETE al servidor (ruta que definimos en el servidor)
    const res = await fetch(`/api/pacientes/${encodeURIComponent(id)}`,{
        method: 'DELETE',
        headers: {'Accept': 'application/json'}//Opcional Indicamos que esperamos
    });

    const data = await res.json();//Pasamos la respuesta json 

    if (!res.ok){//si !res no es valido. = true
        //mostrar mensaje de error (data.error viene del servidor si lo enviamos)
        return alert('Error al eliminar: '+(data.error || JSON.stringify(data)));
    }

    //Si toodo salio bien , eliminar el nodo del DON para actualizar la interfaz 
    const nodo = document.getElementById(`patient-${id}`);
    if (nodo) nodo.remove();//quitar visualmente el paciente de la lista 

    //Informar al usuario
    alert(data.message || 'Paciente eliminado');

   } catch (error) {
    // errores de red o imprevistos 
    console.error('Error en fetch al eliminar:', error);
    alert('Error al conectar con el servidor');
   }
}


//---------------------------EDITAR PACIENTE--------------------
async function editPatient(id) {

    //Encontrar el paciente en la lista actual del DON (opcional)
    const pacienteDiv = document.getElementById(`patient-${id}`);
    if (!pacienteDiv){
        return alert('Paciente no encontrado en la interfaz');
    } 

    //TRAEMOS DATOS DE UN PACIENTE EN ESPECIFICO
    //return alert('Entradon al try');
    try {
        const res = await fetch(`/api/pacientes/${encodeURIComponent(id)}`,{
            method: 'GET', //o simplemente omitelo, por defecto fetch usa GET
            headers: {'Accept': 'application/json'}
        }); //Llama al endpoint GET 

        
        if(!res.ok){
            const errorData = await res.json(); 
            alert('Error al obtener el paciente: '+(errorData.errorData.error || 'Descnonocido'));
            throw new Error(errorData.error || 'Error descnonocido al obtener el paciente');
        } 

        const paciente = await res.json();
        console.log("paciente encontrado:", paciente);
        alert(`paciente encontrado: ${paciente.nombre} ${paciente.apellido}`);
        
        //LLENAR EL FORMULARIO PARA EDITAR
        document.getElementById('patientName').value = paciente.nombre; 
        document.getElementById('patientLastname').value = paciente.apellido;
        document.getElementById('patientAge').value = paciente.edad;
        document.getElementById('patientGender').value = paciente.genero;
        document.getElementById('patientPhone').value = paciente.telefono;
        document.getElementById('patientEmail').value = paciente.email;
        document.getElementById('patientAddress').value = paciente.direccion;


    } catch (error) {
        //console.log("Error al obtener el paciente:", error);
        alert('Error al obtener el paciente. Revisa la consola');
    }
}


//-----------------------------ACTUALIZAR PACIENTE--------------------------
async function updatedPatient(id) {
 
    //EVIAR CAMBIOS (PUT)
    try {
        //Obtener valores actualizados del formualario 
        const nombre = document.getElementById('patientName').value;//Obtiene el texto del campo Nombre
        const apellido = document.getElementById('patientLastname').value;//Obtiene el texto del campo "apellido"
        const edad = document.getElementById('patientAge').value;//Obtiene el texto del campo edad
        const genero = document.getElementById('patientGender').value;//Obtiene el valor seleccionado en rol 
        const telefono = document.getElementById('patientPhone').value;
        const email = document.getElementById('patientEmail').value;
        const direccion = document.getElementById('patientAddress').value;

        //Crear el objeto con los datos actualizados 
        const updatedData = {
            nombre, 
            apellido,
            edad,
            genero,
            telefono,
            email,
            direccion
        };

        alert(`paciente encontrado: ${id} ${updatedData}`);
        //enviar los datos al servidor con metodo put 
        const res = await fetch(`/api/pacientes/${encodeURIComponent(id)}`,{
            method: 'PUT', 
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }, 
            body:JSON.stringify(updatedData),

        });

        const data = await res.json();

        //Manejar errores HTTP
        if(!res.ok){
            alert('Error al actualizar el paciente: ' + (data.error || 'Desconocido'));
            return;
        }

        //Todo correcto 
        alert('Paciente acutalizado Correctamente');
        console.log("Respuesta del servidor:", data);

    } catch (error) {
        console.error("Error al actualizar el paciente:", error);
        alert('Error al enviar los cambios al servidor');
    }
    
}

// --- Ejecutar al cargar la página ---
window.onload = cargarPacientes;
