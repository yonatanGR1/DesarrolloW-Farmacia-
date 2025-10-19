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
            
            // Redirigir según el rol
            setTimeout(() => {
                if (data.rol === 'doctor') {
                    window.location.href = './Presentation/DoctorInterface/DoctorInterface.html';
                } else {
                    window.location.href = '../Presentation/PatientInterface/PacienteH.html';
                    //window.location.href = 'PatientInterface.html';
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
document.addEventListener("DOMContentLoaded", async () => {
  // 👇 Asegúrate de guardar el ID del doctor cuando inicia sesión
  const doctorId = localStorage.getItem("doctorId");
  if (!doctorId) {
    alert("Error: no se encontró el ID del doctor en sesión.");
    return;
  }

  try {
    const res = await fetch(`/api/doctor/pacientes/${doctorId}`);
    const pacientes = await res.json();

    const select = document.getElementById("patientSelect");
    select.innerHTML = '<option value="">Seleccionar paciente...</option>';

    if (!pacientes || pacientes.length === 0) {
      const option = document.createElement("option");
      option.textContent = "No hay pacientes registrados";
      option.disabled = true;
      select.appendChild(option);
      return;
    }

    pacientes.forEach(p => {
      const option = document.createElement("option");
      option.value = p._id;
      option.textContent = `${p.nombre} ${p.apellido} (${p.email})`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error(err);
    alert("Error al cargar la lista de pacientes");
  }
});
