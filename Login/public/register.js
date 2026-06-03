document.getElementById('registerForm').addEventListener('submit', async (e) => { 
    e.preventDefault();//Evita que la pagina se recargue al enviar 

    const API_BASE = "https://desarrollow-farmacia.onrender.com"; //URL base de la API
    const nombre = document.getElementById('nombre').value;//Obtiene el texto del campo Nombre
    const email = document.getElementById('email').value;//Obtiene el texto del campo "email"
    const password = document.getElementById('password').value;//Obtiene el texto del campo password
    const rol = document.getElementById('rol').value;//Obtiene el valor seleccionado en rol 
    const messageElement = document.getElementById('message');//Obtiene el valor de message

    // Validaciones básicas
    
    if (!nombre || !email || !password || !rol) {//Si falta alguno de lo campos obligatorios 
        messageElement.textContent = 'Todos los campos son obligatorios';//Muesta mensaje de error 
        messageElement.style.color = 'red';//Pone el mensaje en rojo 
        return; //Sale de la funcion y no sigue con la peticion 
    }

    if (password.length < 6) {
        messageElement.textContent = 'La contraseña debe tener al menos 6 caracteres';
        messageElement.style.color = 'red';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/register`, {
            
            method: 'POST',//Enviar datos al servidor 
            headers: {
                'Content-Type': 'application/json', //Tipo de contenido, Formato JSON 
            },
            body: JSON.stringify({//stringify convierte un objeto o arreglo a una cadena de texto Formato JSON 
                nombre,
                email,
                password,
                rol
            }),
        });

        
        const data = await response.json();

       
        console.table(data);

        if (response.ok) {//Si la respuesta fue exitosa (status 200-209)
            messageElement.textContent = 'Usuario registrado exitosamente!';
            messageElement.style.color = 'green';
            
            // Limpiar formulario
            document.getElementById('registerForm').reset();
            
       
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else {
            messageElement.textContent = data.error || 'Error al registrar usuario';
            messageElement.style.color = 'red';
        }
    } catch (error) {
      
        console.error('Error:', error);
        messageElement.textContent = 'Error de conexión con el servidor';
        messageElement.style.color = 'red';
    }
});