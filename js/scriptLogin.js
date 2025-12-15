document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        errorMessage.textContent = ''; // Limpiar mensaje de error anterior
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            console.log('Iniciando solicitud de login...');
            const response = await fetch('api/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-API-Key': 'orange-2025'
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            // Verificar si la respuesta es OK
            if (!response.ok) {
                const text = await response.text();
                console.error('Error de respuesta:', response.status, text);
                throw new Error(`Error del servidor: ${response.status}`);
            }

            const data = await response.json();
            console.log('Respuesta del servidor:', data);

            if (data.success) {
                console.log('Login exitoso, datos recibidos:', data);
                
                // Usamos directamente los nombres de variables que envía el backend
                const redirectParams = {
                    a: data.franquicia,
                    b: data.username,
                    c: data.nivel,
                    d: data.tipo
                };

                // Verificar cada campo para diagnóstico
                Object.entries(redirectParams).forEach(([key, value]) => {
                    if (!value) console.error(`Falta campo para parámetro ${key}`);
                });

                // Construir la URL con los parámetros
                const redirectURL = `registroNew/selfran.html?a=${encodeURIComponent(redirectParams.a || '')}&b=${encodeURIComponent(redirectParams.b || '')}&c=${encodeURIComponent(redirectParams.c || '')}&d=${encodeURIComponent(redirectParams.d || '')}`;
                console.log('URL de redirección:', redirectURL);
                
                // Forzar la redirección
                window.location.href = redirectURL;
            } else {
                console.log('Login fallido:', data.message);
                errorMessage.textContent = data.message || 'Usuario o contraseña incorrectos';
            }
        } catch (error) {
            console.error('Error durante el login:', error);
            errorMessage.textContent = 'Error al intentar iniciar sesión. Por favor, intenta de nuevo.';
        }
    });
});
