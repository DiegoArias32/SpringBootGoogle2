// security.js
(function() {
    'use strict';
    
    // Constantes de configuración
    const API_BASE_URL = 'http://localhost:8080/api';
    const RECAPTCHA_SITE_KEY = '6Lcy8x4rAAAAAKSfqVFXEkhNz_IsFIb_iCn5qOwy'; // Tu clave de sitio real
    
    // Variables globales
    let csrfToken = '';
    let loginAttempts = 0;
    const MAX_LOGIN_ATTEMPTS = 5;
    let formSubmitTimers = {};
    
    // ========================
    // Funciones de utilidad
    // ========================
    
    // Función para obtener el CSRF token
    function getCsrfToken() {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1];
        return cookieValue || '';
    }
    
    // Función para codificar datos contra XSS
    function encodeHTML(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    
    // Validación de entrada
    function validateInput(input, pattern, errorMessage) {
        if (!pattern.test(input.value)) {
            showInputError(input, errorMessage);
            return false;
        }
        clearInputError(input);
        return true;
    }
    
    function showInputError(input, message) {
        const parent = input.parentElement.parentElement;
        let errorDiv = parent.querySelector('.error-message');
        
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message text-red-500 text-xs mt-1';
            parent.appendChild(errorDiv);
        }
        
        errorDiv.textContent = message;
        input.classList.add('border-red-500');
    }
    
    function clearInputError(input) {
        const parent = input.parentElement.parentElement;
        const errorDiv = parent.querySelector('.error-message');
        
        if (errorDiv) {
            errorDiv.textContent = '';
        }
        
        input.classList.remove('border-red-500');
    }
    
    // Throttling para evitar múltiples envíos
    function throttleFormSubmit(formId, handler, delay = 2000) {
        return function(event) {
            event.preventDefault();
            
            // Si ya hay un temporizador activo, cancelamos el envío
            if (formSubmitTimers[formId]) {
                console.log('Envío del formulario demasiado rápido. Por favor, espere unos segundos.');
                return;
            }
            
            // Procesamos el evento
            handler(event);
            
            // Configuramos el temporizador
            formSubmitTimers[formId] = setTimeout(() => {
                formSubmitTimers[formId] = null;
            }, delay);
        };
    }
    
    // Función para guardar datos del usuario (sin token)
    function saveUserData(userData) {
        sessionStorage.setItem('userData', JSON.stringify(userData));
        sessionStorage.setItem('userRoles', JSON.stringify(userData.roles));
    }
    
    // Función para verificar si el usuario está autenticado
    function isAuthenticated() {
        return sessionStorage.getItem('userData') !== null;
    }
    
    // Función para eliminar datos del usuario
    function removeUserData() {
        sessionStorage.removeItem('userData');
        sessionStorage.removeItem('userRoles');
    }
    
    // ========================
    // Funciones de reCAPTCHA
    // ========================
    
    // Obtener token de reCAPTCHA
    function generateRecaptchaToken(action) {
        return new Promise((resolve, reject) => {
            if (typeof grecaptcha === 'undefined') {
                reject(new Error('reCAPTCHA no está cargado'));
                return;
            }
            
            grecaptcha.ready(function() {
                grecaptcha.execute(RECAPTCHA_SITE_KEY, {action: action})
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
    
    // ========================
    // Funciones de API
    // ========================
    
    // Función base para peticiones API con protección CSRF
    async function apiRequest(url, method, data = null) {
        try {
            // Obtenemos el token CSRF actual
            csrfToken = getCsrfToken();
            
            const headers = {
                'Content-Type': 'application/json'
            };
            
            // Añadir CSRF token si existe
            if (csrfToken) {
                headers['X-CSRF-TOKEN'] = csrfToken;
            }
            
            const fetchOptions = {
                method: method,
                headers: headers,
                credentials: 'include' // Incluir cookies
            };
            
            if (data && (method === 'POST' || method === 'PUT')) {
                fetchOptions.body = JSON.stringify(data);
            }
            
            console.log(`Enviando solicitud ${method} a ${API_BASE_URL}${url}`);
            
            const response = await fetch(`${API_BASE_URL}${url}`, fetchOptions);
            
            // Si la respuesta no es exitosa, lanzamos un error
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Error: ${response.status} ${response.statusText}` }));
                throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`);
            }
            
            // Para respuestas sin contenido (204)
            if (response.status === 204) {
                return null;
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error en la petición API:', error);
            throw error;
        }
    }
    
    // Función específica para login
    async function loginUser(credentials) {
        try {
            const recaptchaToken = await generateRecaptchaToken('login');
            credentials.recaptchaToken = recaptchaToken;
            
            console.log('Intentando login con credenciales:', {
                usernameOrEmail: credentials.usernameOrEmail,
                recaptchaToken: recaptchaToken ? 'presente' : 'ausente'
            });
            
            const response = await apiRequest('/auth/signin', 'POST', credentials);
            
            console.log('Respuesta de login recibida:', response);
            
            // Ya no necesitamos guardar el token, está en la cookie
            // Solo guardamos la información del usuario
            if (response) {
                saveUserData(response);
                return response;
            }
            
            throw new Error('Error en la respuesta de autenticación');
        } catch (error) {
            loginAttempts++;
            
            // Si excede intentos, bloquear temporalmente
            if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
                const waitTime = 60; // segundos
                blockLoginForm(waitTime);
            }
            
            throw error;
        }
    }
    
    // Función específica para registro
    async function registerUser(userData) {
        try {
            const recaptchaToken = await generateRecaptchaToken('register');
            userData.recaptchaToken = recaptchaToken;
            
            return await apiRequest('/auth/signup', 'POST', userData);
        } catch (error) {
            throw error;
        }
    }

    // Función para cerrar sesión
    async function logout() {
        try {
            await apiRequest('/auth/signout', 'POST');
            removeUserData();
            window.location.href = '../index.html';
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            // Aún así, limpiamos los datos locales
            removeUserData();
            window.location.href = '../index.html';
        }
    }
    
    // ========================
    // Manipulación del DOM
    // ========================
    
    // Función para bloquear el formulario de login temporalmente
    function blockLoginForm(seconds) {
        const loginForm = document.getElementById('login-form');
        const loginButton = loginForm.querySelector('button[type="submit"]');
        
        loginButton.disabled = true;
        loginButton.textContent = `Bloqueado por ${seconds} segundos`;
        
        let timeLeft = seconds;
        const interval = setInterval(() => {
            timeLeft--;
            loginButton.textContent = `Bloqueado por ${timeLeft} segundos`;
            
            if (timeLeft <= 0) {
                clearInterval(interval);
                loginButton.disabled = false;
                loginButton.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Iniciar Sesión';
                loginAttempts = 0;
            }
        }, 1000);
    }
    
    // Validación de seguridad de contraseña en tiempo real
    function setupPasswordValidation() {
        const passwordInput = document.getElementById('register-password');
        if (!passwordInput) return;
        
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            
            // Validar longitud
            const lengthCheck = document.getElementById('length-check');
            if (lengthCheck) {
                if (password.length >= 8) {
                    lengthCheck.classList.replace('text-red-500', 'text-green-500');
                } else {
                    lengthCheck.classList.replace('text-green-500', 'text-red-500');
                }
            }
            
            // Validar minúscula
            const lowercaseCheck = document.getElementById('lowercase-check');
            if (lowercaseCheck) {
                if (/[a-z]/.test(password)) {
                    lowercaseCheck.classList.replace('text-red-500', 'text-green-500');
                } else {
                    lowercaseCheck.classList.replace('text-green-500', 'text-red-500');
                }
            }
            
            // Validar mayúscula
            const uppercaseCheck = document.getElementById('uppercase-check');
            if (uppercaseCheck) {
                if (/[A-Z]/.test(password)) {
                    uppercaseCheck.classList.replace('text-red-500', 'text-green-500');
                } else {
                    uppercaseCheck.classList.replace('text-green-500', 'text-red-500');
                }
            }
            
            // Validar número
            const numberCheck = document.getElementById('number-check');
            if (numberCheck) {
                if (/[0-9]/.test(password)) {
                    numberCheck.classList.replace('text-red-500', 'text-green-500');
                } else {
                    numberCheck.classList.replace('text-green-500', 'text-red-500');
                }
            }
            
            // Validar carácter especial
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
    
    // ========================
    // Manejadores de eventos
    // ========================
    
    // Manejar envío del formulario de login
    async function handleLoginSubmit(event) {
        event.preventDefault();
        
        const usernameOrEmail = document.getElementById('usernameOrEmail').value.trim();
        const password = document.getElementById('password').value;
        
        // Validación básica en cliente
        if (!usernameOrEmail || !password) {
            Swal.fire({
                title: 'Error',
                text: 'Por favor, completa todos los campos',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
            return;
        }
        
        // Mostrar cargando
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
        
        try {
            // Llamar a la función de login
            const response = await loginUser({
                usernameOrEmail: usernameOrEmail,
                password: password
            });
            
            // Éxito - redireccionamos según el rol
            const roles = response.roles || [];
            let redirectUrl = '../menu/menu.html'; // URL predeterminada para clientes
            
            if (roles.includes('ROLE_ADMIN') || roles.includes('ROLE_STAFF')) {
                redirectUrl = '../sistema de gestion/dashboard.html'; // URL para staff/admin
            }
            
            Swal.fire({
                title: 'Éxito',
                text: 'Inicio de sesión exitoso. Redirigiendo...',
                icon: 'success',
                showConfirmButton: false,
                timer: 1500
            }).then(() => {
                window.location.href = redirectUrl;
            });
        } catch (error) {
            // Error - mostramos mensaje
            Swal.fire({
                title: 'Error',
                text: error.message || 'Error al iniciar sesión. Intente nuevamente.',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
        }
    }

    function handleOAuth2Response() {
        // Verificar si hay un parámetro que indique login social exitoso
        const urlParams = new URLSearchParams(window.location.search);
        const loginSuccess = urlParams.get('login_success');
        
        if (loginSuccess === 'true') {
            // Mostrar mensaje de éxito
            Swal.fire({
                title: 'Éxito',
                text: 'Inicio de sesión con red social exitoso',
                icon: 'success',
                showConfirmButton: false,
                timer: 1500
            }).then(() => {
                // Redirigir a la página principal o dashboard
                window.location.href = '../index.html';
            });
        }
    }
    
    // Manejar envío del formulario de registro
    async function handleRegisterSubmit(event) {
        event.preventDefault();
        
        const firstName = document.getElementById('first-name').value.trim();
        const lastName = document.getElementById('last-name').value.trim();
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const terms = document.getElementById('terms').checked;
        
        // Validación del rol y campos específicos
        const isStaff = document.getElementById('role-staff').classList.contains('active');
        let position = null;
        let employeeId = null;
        
        if (isStaff) {
            position = document.getElementById('position').value;
            employeeId = document.getElementById('employee-id').value.trim();
        }
        
        // Validaciones básicas en cliente
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
                confirmButtonText: 'Intentar de nuevo'
            });
            return;
        }
        
        if (!terms) {
            Swal.fire({
                title: 'Error',
                text: 'Debes aceptar los términos y condiciones',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
            return;
        }
        
        // Mostrar cargando
        Swal.fire({
            title: 'Registrando usuario...',
            text: 'Por favor, espera un momento.',
            icon: 'info',
            showConfirmButton: false,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        try {
            // Preparar datos para envío
            const userData = {
                firstName,
                lastName,
                username,
                email,
                password,
                phone
            };
            
            // Agregar campos de staff si corresponde
            if (isStaff) {
                userData.position = position;
                userData.employeeId = employeeId;
                userData.roles = ['staff'];
            } else {
                userData.roles = ['client'];
            }
            
            // Llamar a la función de registro
            await registerUser(userData);
            
            if (isStaff) {
                // Para personal, mostramos mensaje de espera de aprobación
                Swal.fire({
                    title: 'Registro Enviado',
                    text: 'Su solicitud de cuenta de personal ha sido enviada. Espere la aprobación.',
                    icon: 'info',
                    confirmButtonText: 'Entendido'
                });
            } else {
                // Para clientes, redirigimos al login
                Swal.fire({
                    title: 'Registro Exitoso',
                    text: 'Usuario registrado con éxito. Ahora puedes iniciar sesión.',
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 2000
                }).then(() => {
                    // Cambiar a la pestaña de login
                    document.getElementById('login-tab').click();
                });
            }
        } catch (error) {
            // Error - mostramos mensaje
            Swal.fire({
                title: 'Error',
                text: error.message || 'Error al registrar usuario. Intente nuevamente.',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
        }
    }
    
    // ========================
    // Inicialización de la aplicación
    // ========================
    
    document.addEventListener('DOMContentLoaded', function() {
        handleOAuth2Response();
        console.log('Inicializando aplicación de seguridad...');
        
        // Configurar validación de contraseña
        setupPasswordValidation();
        
        // ✅ Tab switching (Login & Register)
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
    
        // ✅ Role selection (Client & Staff)
        const roleClient = document.getElementById('role-client');
        const roleStaff = document.getElementById('role-staff');
        
        if (roleClient && roleStaff) {
            roleClient.addEventListener('click', function() {
                this.classList.add('active');
                roleStaff.classList.remove('active');
                document.getElementById('staff-fields').classList.add('hidden');
                document.getElementById('register-client-btn').classList.remove('hidden');
                document.getElementById('register-staff-btn').classList.add('hidden');
            });
        
            roleStaff.addEventListener('click', function() {
                this.classList.add('active');
                roleClient.classList.remove('active');
                document.getElementById('staff-fields').classList.remove('hidden');
                document.getElementById('register-client-btn').classList.add('hidden');
                document.getElementById('register-staff-btn').classList.remove('hidden');
            });
        }
    
        // ✅ Password visibility toggle
        const togglePassword = document.getElementById('toggle-password');
        if (togglePassword) {
            togglePassword.addEventListener('click', function() {
                togglePasswordVisibility('password', this);
            });
        }
    
        const toggleRegisterPassword = document.getElementById('toggle-register-password');
        if (toggleRegisterPassword) {
            toggleRegisterPassword.addEventListener('click', function() {
                togglePasswordVisibility('register-password', this);
            });
        }
    
        function togglePasswordVisibility(inputId, toggleButton) {
            const passwordInput = document.getElementById(inputId);
            if (!passwordInput) return;
            
            const icon = toggleButton.querySelector('i');
    
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
    
        // ✅ Login Form Submission with throttling
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', 
                throttleFormSubmit('login-form', handleLoginSubmit, 2000)
            );
        }
    
        // ✅ Register Form Submission with throttling
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', 
                throttleFormSubmit('register-form', handleRegisterSubmit, 2000)
            );
        }
        
        // Protección contra ataques XSS en campos de texto
        const textInputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
        textInputs.forEach(input => {
            input.addEventListener('blur', function() {
                // Sanitizar valores
                this.value = encodeHTML(this.value);
            });
        });
        
        // Verificar si hay sesión activa (ahora verificamos sessionStorage)
        if (isAuthenticated()) {
            const userRoles = JSON.parse(sessionStorage.getItem('userRoles') || '[]');
            
            if (userRoles.includes('ROLE_ADMIN') || userRoles.includes('ROLE_STAFF')) {
                window.location.href = '../sistema de gestion/dashboard.html';
            } else if (userRoles.includes('ROLE_CLIENT')) {
                window.location.href = '../menu/menu.html';
            }
        }
        
        // Exponer las funciones necesarias globalmente
        window.logout = logout;
        
        console.log('Inicialización de seguridad completada');
    });
})();