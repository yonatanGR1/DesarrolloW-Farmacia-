document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageElement = document.getElementById('message');

    // Validaciones básicas
    if (!email || !password) {
        messageElement.textContent = 'Todos los campos son obligatorios';
        messageElement.style.color = 'red';
        return;
    }

    try {
        console.log('Enviando login...'); // Para debug
        
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password
            }),
        });

        console.log('Respuesta recibida:', response.status); // Para debug

        const data = await response.json();
        console.log('Datos:', data); // Para debug

        if (response.ok) {
            messageElement.textContent = 'Login exitoso! Redirigiendo...';
            messageElement.style.color = 'green';
            
           
            localStorage.setItem('currentUser', JSON.stringify({
                _id: data.usuario.id,
                nombre: data.usuario.nombre,
                email: data.usuario.email,
                rol: data.rol
            }));
            
            console.log('Usuario guardado en localStorage:', data.usuario);

            // Redirigir según el rol
            setTimeout(() => {
                if (data.rol === 'doctor') {
                    // También guardar como doctor si es necesario
                    localStorage.setItem('currentDoctor', JSON.stringify({
                        _id: data.usuario.id,
                        nombre: data.usuario.nombre,
                        email: data.usuario.email
                    }));
                    window.location.href = './Presentation/DoctorInterface/DoctorInterface.html';
                } else if (data.rol === 'paciente') {
                    window.location.href = '../Presentation/PatientInterface/PacienteH.html';
                } else {
                    // Redirección por defecto
                    window.location.href = '/index.html';
                }
            }, 1000);
        } else {
            messageElement.textContent = data.mensaje || 'Error al iniciar sesión';
            messageElement.style.color = 'red';
        }
    } catch (error) {
        console.error('Error completo:', error);
        messageElement.textContent = 'Error de conexión con el servidor';
        messageElement.style.color = 'red';
    }
});

