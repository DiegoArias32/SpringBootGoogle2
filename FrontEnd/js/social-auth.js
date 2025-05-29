// social-auth.js - Script para manejo de autenticación con redes sociales
'use strict';

// Configuración inicial
const API_BASE_URL = "http://172.30.7.71:8080/api";
const RECAPTCHA_SITE_KEY = "6Lcy8x4rAAAAAKSfqVFXEkhNz_IsFIb_iCn5qOwy";
let loginAttempts = 0;
const MAX_LOGIN_ATTEMPTS = 5;
let socialAuthInProgress = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando módulo de autenticación social...');
    
    // Inicialización de componentes UI
    initializeTabs();
    initializeRoleToggle();
    initializePasswordToggle();
    initializePasswordValidation();
    initializeFormSubmission();
    checkUrlParams();
    
    // Inicializar reCAPTCHA
    if (typeof grecaptcha !== 'undefined') {
        console.log('reCAPTCHA ya está cargado');
    } else {
        console.log('Cargando reCAPTCHA...');
    }
});

// Verifica si hay parámetros en la URL después de un inicio de sesión con OAuth
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');
    
    if (token) {
        // Guardar el token en sessionStorage
        sessionStorage.setItem('jwtToken', token);
        
        // Redireccionar según roles (asumiendo que el token tiene esa info)
        const redirectUrl = determineRedirectUrl(token);
        
        Swal.fire({
            title: 'Éxito',
            text: 'Has iniciado sesión correctamente con tu cuenta social.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        }).then(() => {
            window.location.href = redirectUrl;
        });
    } 
    
    if (error) {
        Swal.fire({
            title: 'Error',
            text: decodeURIComponent(error),
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    }
}

// Determina la URL de redirección basada en el token JWT
function determineRedirectUrl(token) {
    // Decodifica el token para obtener la información del usuario
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const roles = payload.roles || [];
        
        if (roles.includes('ROLE_ADMIN') || roles.includes('ROLE_STAFF')) {
            return '../sistema de gestion/dashboard.html';
        } else {
            return '../index.html';
        }
    } catch (error) {
        console.error('Error al decodificar el token:', error);
        return '../index.html'; // Redirección por defecto
    }
}

// Inicializa las pestañas de inicio de sesión y registro
function initializeTabs() {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    
    if (loginTab && registerTab) {
        loginTab.addEventListener('click', function() {
            loginTab.classList.add('active');
            loginTab.classList.remove('bg-gray-200', 'text-gray-700');
            registerTab.classList.remove('active');
            registerTab.classList.add('bg-gray-200', 'text-gray-700');
            document.getElementById('login-form').classList.remove('hidden');
            document.getElementById('register-form').classList.add('hidden');
        });
        
        registerTab.addEventListener('click', function() {
            registerTab.classList.add('active');
            registerTab.classList.remove('bg-gray-200', 'text-gray-700');
            loginTab.classList.remove('active');
            loginTab.classList.add('bg-gray-200', 'text-gray-700');
            document.getElementById('register-form').classList.remove('hidden');
            document.getElementById('login-form').classList.add('hidden');
        });
    }
}

// Inicializa el toggle de roles en el formulario de registro
function initializeRoleToggle() {
    const clientRoleBtn = document.getElementById('role-client');
    const staffRoleBtn = document.getElementById('role-staff');
    
    if (clientRoleBtn && staffRoleBtn) {
        clientRoleBtn.addEventListener('click', function() {
            this.classList.add('active');
            staffRoleBtn.classList.remove('active');
            document.getElementById('staff-fields').classList.add('hidden');
            document.getElementById('register-client-btn').classList.remove('hidden');
            document.getElementById('register-staff-btn').classList.add('hidden');
        });
        
        staffRoleBtn.addEventListener('click', function() {
            this.classList.add('active');
            clientRoleBtn.classList.remove('active');
            document.getElementById('staff-fields').classList.remove('hidden');
            document.getElementById('register-client-btn').classList.add('hidden');
            document.getElementById('register-staff-btn').classList.remove('hidden');
        });
    }
}

// Inicializa el toggle de visibilidad de la contraseña
function initializePasswordToggle() {
    const togglePassword = document.getElementById('toggle-password');
    const toggleRegisterPassword = document.getElementById('toggle-register-password');
    
    togglePassword?.addEventListener('click', function() {
        togglePasswordVisibility('password', this);
    });
    
    toggleRegisterPassword?.addEventListener('click', function() {
        togglePasswordVisibility('register-password', this);
    });
}

// Cambia la visibilidad de un campo de contraseña
function togglePasswordVisibility(inputId, toggleBtn) {
    const passwordInput = document.getElementById(inputId);
    if (!passwordInput) return;
    
    const icon = toggleBtn.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Inicializa la validación en vivo de contraseña
function initializePasswordValidation() {
    const passwordInput = document.getElementById('register-password');
    
    if (!passwordInput) return;
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        
        // Validar longitud mínima (8 caracteres)
        const lengthCheck = document.getElementById('length-check');
        if (lengthCheck) {
            if (password.length >= 8) {
                lengthCheck.classList.replace('text-red-500', 'text-green-500');
            } else {
                lengthCheck.classList.replace('text-green-500', 'text-red-500');
            }
        }
        
        // Validar minúsculas
        const lowercaseCheck = document.getElementById('lowercase-check');
        if (lowercaseCheck) {
            if (/[a-z]/.test(password)) {
                lowercaseCheck.classList.replace('text-red-500', 'text-green-500');
            } else {
                lowercaseCheck.classList.replace('text-green-500', 'text-red-500');
            }
        }
        
        // Validar mayúsculas
        const uppercaseCheck = document.getElementById('uppercase-check');
        if (uppercaseCheck) {
            if (/[A-Z]/.test(password)) {
                uppercaseCheck.classList.replace('text-red-500', 'text-green-500');
            } else {
                uppercaseCheck.classList.replace('text-green-500', 'text-red-500');
            }
        }
        
        // Validar números
        const numberCheck = document.getElementById('number-check');
        if (numberCheck) {
            if (/[0-9]/.test(password)) {
                numberCheck.classList.replace('text-red-500', 'text-green-500');
            } else {
                numberCheck.classList.replace('text-green-500', 'text-red-500');
            }
        }
        
        // Validar caracteres especiales
        const specialCheck = document.getElementById('special-check');
        if (specialCheck) {
            if (/[@#$%^&+=]/.test(password)) {
                specialCheck.classList.replace('text-red-500', 'text-green-500');
            } else {
                specialCheck.classList.replace('text-green-500', 'text-red-500');
            }
        }
    });
}

// Inicializa la presentación de formularios
function initializeFormSubmission() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', debounceSubmit('login', handleLoginSubmit, 1000));
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', debounceSubmit('register', handleRegisterSubmit, 1000));
    }
    
    // Sanitizar entradas de texto
    const textInputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
    textInputs.forEach(input => {
        input.addEventListener('blur', function() {
            this.value = sanitizeInput(this.value);
        });
    });
}

// Función para debounce (prevenir múltiples envíos)
function debounceSubmit(formType, callback, delay = 2000) {
    let submitting = false;
    
    return function(event) {
        event.preventDefault();
        
        if (submitting) {
            console.log('Envío del formulario demasiado rápido. Por favor, espere unos segundos.');
            return;
        }
        
        callback(event);
        
        submitting = true;
        setTimeout(() => {
            submitting = false;
        }, delay);
    };
}

// Sanitiza la entrada del usuario para prevenir XSS
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/data:/gi, '');
}

// Maneja el envío del formulario de inicio de sesión
async function handleLoginSubmit(event) {
    const usernameOrEmail = document.getElementById('usernameOrEmail').value.trim();
    const password = document.getElementById('password').value;
    
    if (!usernameOrEmail || !password) {
        Swal.fire({
            title: 'Error',
            text: 'Por favor, completa todos los campos',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
        return;
    }
    
    try {
        // Obtener token de reCAPTCHA
        const recaptchaToken = await executeRecaptcha('login');
        
        Swal.fire({
            title: 'Iniciando sesión...',
            text: 'Por favor, espera un momento.',
            icon: 'info',
            showConfirmButton: false,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const loginData = {
            usernameOrEmail: usernameOrEmail,
            password: password,
            recaptchaToken: recaptchaToken
        };
        
        const response = await fetch(`${API_BASE_URL}/auth/signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData),
            credentials: 'include'
        });
        
        if (!response.ok) {
            loginAttempts++;
            
            if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
                handleTooManyAttempts(30); // Bloquear por 30 segundos
                return;
            }
            
            const errorData = await response.json();
            throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`);
        }
        
        const userData = await response.json();
        
        // Guardar datos del usuario
        sessionStorage.setItem('userData', JSON.stringify(userData));
        sessionStorage.setItem('userRoles', JSON.stringify(userData.roles));
        
        loginAttempts = 0; // Resetear contador de intentos
        
        Swal.fire({
            title: 'Éxito',
            text: 'Inicio de sesión exitoso. Redirigiendo...',
            icon: 'success',
            showConfirmButton: false,
            timer: 1500
        }).then(() => {
            // Redireccionar según el rol
            const roles = userData.roles || [];
            if (roles.includes('ROLE_ADMIN') || roles.includes('ROLE_STAFF')) {
                window.location.href = '../sistema de gestion/dashboard.html';
            } else {
                window.location.href = '../index.html';
            }
        });
        
    } catch (error) {
        Swal.fire({
            title: 'Error',
            text: error.message || 'Error al iniciar sesión. Intente nuevamente.',
            icon: 'error',
            confirmButtonText: 'Intentar de nuevo'
        });
    }
}

// Maneja el envío del formulario de registro
async function handleRegisterSubmit(event) {
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const termsAccepted = document.getElementById('terms').checked;
    const isStaffRole = document.getElementById('role-staff').classList.contains('active');
    
    let position = null;
    let employeeId = null;
    
    if (isStaffRole) {
        position = document.getElementById('position').value.trim();
        employeeId = document.getElementById('employee-id').value.trim();
    }
    
    // Validaciones básicas
    if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
        Swal.fire({
            title: 'Error',
            text: 'Por favor, completa todos los campos obligatorios',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
        return;
    }
    
    if (password !== confirmPassword) {
        Swal.fire({
            title: 'Error',
            text: 'Las contraseñas no coinciden',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
        return;
    }
    
    if (!termsAccepted) {
        Swal.fire({
            title: 'Error',
            text: 'Debes aceptar los términos y condiciones',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
        return;
    }
    
    // Validación de patrón de contraseña
    const passwordPattern = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\S+$).{8,}$/;
    if (!passwordPattern.test(password)) {
        Swal.fire({
            title: 'Error',
            text: 'La contraseña no cumple con los requisitos mínimos',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
        return;
    }
    
    try {
        // Obtener token de reCAPTCHA
        const recaptchaToken = await executeRecaptcha('register');
        
        Swal.fire({
            title: 'Registrando...',
            text: 'Por favor, espera un momento.',
            icon: 'info',
            showConfirmButton: false,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const registerData = {
            firstName: firstName,
            lastName: lastName,
            username: username,
            email: email,
            password: password,
            phone: phone,
            recaptchaToken: recaptchaToken
        };
        
        if (isStaffRole) {
            registerData.position = position;
            registerData.employeeId = employeeId;
            registerData.roles = ['staff'];
        } else {
            registerData.roles = ['client'];
        }
        
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registerData),
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`);
        }
        
        if (isStaffRole) {
            Swal.fire({
                title: 'Solicitud Enviada',
                text: 'Su solicitud de cuenta de personal ha sido enviada. Espere la aprobación.',
                icon: 'info',
                confirmButtonText: 'Entendido'
            });
        } else {
            Swal.fire({
                title: 'Registro Exitoso',
                text: 'Usuario registrado con éxito. Ahora puedes iniciar sesión.',
                icon: 'success',
                showConfirmButton: false,
                timer: 2000
            }).then(() => {
                document.getElementById('login-tab').click();
            });
        }
    } catch (error) {
        Swal.fire({
            title: 'Error',
            text: error.message || 'Error al registrar usuario. Intente nuevamente.',
            icon: 'error',
            confirmButtonText: 'Intentar de nuevo'
        });
    }
}

// Ejecuta reCAPTCHA
async function executeRecaptcha(action) {
    return new Promise((resolve, reject) => {
        if (typeof grecaptcha === 'undefined') {
            reject(new Error('reCAPTCHA no está cargado'));
            return;
        }
        
        grecaptcha.ready(function() {
            grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: action })
                .then(function(token) {
                    resolve(token);
                })
                .catch(function(error) {
                    console.error('Error de reCAPTCHA:', error);
                    reject(error);
                });
        });
    });
}

// Maneja bloqueo por demasiados intentos
function handleTooManyAttempts(seconds) {
    const loginForm = document.getElementById('login-form');
    const submitButton = loginForm.querySelector('button[type="submit"]');
    
    submitButton.disabled = true;
    submitButton.textContent = `Bloqueado por ${seconds} segundos`;
    
    let remainingTime = seconds;
    const interval = setInterval(() => {
        remainingTime--;
        submitButton.textContent = `Bloqueado por ${remainingTime} segundos`;
        
        if (remainingTime <= 0) {
            clearInterval(interval);
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Iniciar Sesión';
            loginAttempts = 0;
        }
    }, 1000);
}

// Función para cerrar sesión
async function logout() {
    try {
        await fetch(`${API_BASE_URL}/auth/signout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    } finally {
        sessionStorage.removeItem('userData');
        sessionStorage.removeItem('userRoles');
        window.location.href = '../login y register/loginAndRegister.html';
    }
}

// Exponer función de logout globalmente
window.logout = logout;