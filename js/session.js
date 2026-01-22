// Función para obtener los datos de la sesión al cargar la página
async function getUserSessionData() {
    try {
        const response = await fetch('https://siwo-net.com/intra2-new/api/check_session.php', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'orange-2025'
            },
            credentials: 'include' // Importante para enviar cookies
        });

        if (!response.ok) {
            throw new Error('Sesión no válida');
        }

        const data = await response.json();
        
        if (!data.success) {
            window.location.href = 'https://siwo-net.com/intra2-new/index.html';
            return;
        }

        // Actualizar la información del header con los datos de la sesión
        const { user } = data;
        if (document.getElementById('franq')) document.getElementById('franq').textContent = user.afiliado || '';
        if (document.getElementById('user')) document.getElementById('user').textContent = user.username || '';
        if (document.getElementById('cat')) document.getElementById('cat').textContent = 
            (user.nivel ? user.nivel : '') + (user.tipo ? ' ' + user.tipo : '');

    } catch (error) {
        console.error('Error al obtener datos de sesión:', error);
        window.location.href = 'https://siwo-net.com/intra2-new/index.html';
    }
}

// Obtener datos de sesión al cargar la página
document.addEventListener('DOMContentLoaded', getUserSessionData);
