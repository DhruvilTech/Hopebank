document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.login-form');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Reset previous errors
        clearErrors();
        
        // Get all form inputs
        const username = document.getElementById('username');
        const email = document.getElementById('email');
        const password = document.getElementById('password');
        const phone = document.getElementById('phone');
        const address = document.getElementById('address');
        
        let isValid = true;
        const usernamePattern = /^(?=.*[A-Za-z])[A-Za-z\d]{3,}$/;

        if (!usernamePattern.test(username.value)) {
            showError(username, 'Username must contain at least one letter and be at least three characters long.');
            isValid = false;
        }
        
// Username validation
        if (!username.value.trim()) {
            showError(username, 'Username is required');
            isValid = false;
        } else if (username.value.length < 3) {
            showError(username, 'Username must be at least 3 characters');
            isValid = false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.value.trim()) {
            showError(email, 'Email is required');
            isValid = false;
        } else if (!emailRegex.test(email.value)) {
            showError(email, 'Please enter a valid email');
            isValid = false;
        } else if (email.value.length < 13) {
            showError(email, 'Email must be at least 13 characters');
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

        // Phone validation
        const phoneRegex = /^\d{10}$/;
        if (!phone.value.trim()) {
            showError(phone, 'Phone number is required');
            isValid = false;
        } else if (!phoneRegex.test(phone.value)) {
            showError(phone, 'Please enter a valid 10-digit phone number');
            isValid = false;
        }

        // Address validation
        if (!address.value.trim()) {
            showError(address, 'Address is required');
            isValid = false;
        } else if (address.value.length < 10) {
            showError(address, 'Address must be at least 10 characters');
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