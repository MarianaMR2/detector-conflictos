const form = document.getElementById('registerForm');

form.addEventListener('submit', async (e) => {

    e.preventDefault();

    const data = {

        nombre: document.getElementById('nombre').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        programa: document.getElementById('programa').value,
        semestre: document.getElementById('semestre').value

    };

    try {

        const res = await fetch('/api/auth/registrar', {

            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)

        });

        const result = await res.json();

        if (res.ok) {

            alert('Usuario creado correctamente');

            window.location.href = '/';

        } else {

            alert(result.error);

        }

    } catch (err) {

        console.error(err);

    }

});