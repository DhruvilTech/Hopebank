document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('.login-form');

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        clearErrors();

        const username = document.getElementById('Username');
        const password = document.getElementById('password');

        let isValid = true;

        // Username validation
        if (!username.value.trim()) {
            showError(username, 'Username is required');
            isValid = false;
        } else if (username.value.length < 3) {
            showError(username, 'Username must be at least 3 characters');
            isValid = false;
        }

        // Password validation
        const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#\$%\^\&*\)\(+=._-]).{8,}$/;
        if (!pattern.test(password.value)) {
            showError(password, 'Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character');
            isValid = false;
        }
        if (!password.value) {
            showError(password, 'Password is required');
            isValid = false;
        } else if (password.value.length < 8) {
            showError(password, 'Password must be at least 8 characters');
            isValid = false;
        }
        if (isValid) {
            form.submit();
        }
    });

    function showError(input, message) {
        const formGroup = input.closest('.form-group');
        const error = document.createElement('div');
        error.className = 'error-message';
        error.textContent = message;
        formGroup.appendChild(error);
        input.classList.add('error-input');
    }

    function clearErrors() {
        document.querySelectorAll('.error-message').forEach(error => error.remove());
        document.querySelectorAll('.error-input').forEach(input => input.classList.remove('error-input'));
    }
}); 