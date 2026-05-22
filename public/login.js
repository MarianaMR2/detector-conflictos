document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('loginForm');

    if (!form) {
        console.error('No se encontró el formulario loginForm');
        return;
    }

    form.addEventListener('submit', async (e) => {

        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {

                localStorage.setItem('token', data.token);
                localStorage.setItem('usuario', JSON.stringify(data.usuario));

                window.location.href = '/dashboard.html';

            } else {
                alert(data.error);
            }

        } catch (error) {
            console.error(error);
            alert('Error de conexión con el servidor');
        }

    });

});