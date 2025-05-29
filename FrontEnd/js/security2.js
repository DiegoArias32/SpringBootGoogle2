// Módulo de seguridad adicional para verificaciones de reCAPTCHA y otras protecciones
(function() {
    'use strict';
    
    // Configuración
    const RECAPTCHA_SITE_KEY = '6LeDFJ8UAAAAAKeLGLV7-5yGkcRXkPuqMyBnIz8K'; // Clave pública de reCAPTCHA
    const USE_RECAPTCHA = true; // Establecer a false para desactivar reCAPTCHA en desarrollo
    const MIN_PASSWORD_LENGTH = 8;
    
    // Variables de reCAPTCHA
    let recaptchaLoaded = false;
    let recaptchaWidgets = {};
    
    // ==========================
    // Funciones de inicialización
    // ==========================
    
    // Inicializar el módulo de seguridad
    function initSecurity() {
        // Cargar reCAPTCHA si está habilitado
        if (USE_RECAPTCHA) {
            loadRecaptcha();
        }
        
        // Eventos de formularios
        document.addEventListener('submit', handleFormSubmit);
        
        // Validación de datos de entrada en tiempo real
        setupInputValidation();
        
        // Prevenir ataque de clickjacking
        preventClickjacking();
        
        // Configurar CSP dinámico (si es necesario)
        // setupDynamicCSP();
        
        // Añadir protección anti-CSRF a llamadas fetch y XMLHttpRequest
        protectAgainstCSRF();
    }
    
    // ==========================
    // reCAPTCHA
    // ==========================
    
    // Cargar el script de reCAPTCHA
    function loadRecaptcha() {
        // Evitar cargar reCAPTCHA varias veces
        if (window.grecaptcha || document.querySelector('script[src*="recaptcha"]')) {
            recaptchaLoaded = true;
            console.log('reCAPTCHA ya cargado');
            return;
        }
        
        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/api.js?render=explicit&onload=recaptchaCallback`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
        
        // Definir la función de callback global
        window.recaptchaCallback = function() {
            recaptchaLoaded = true;
            console.log('reCAPTCHA cargado correctamente');
            
            // Aplicar a todos los formularios después de que reCAPTCHA esté listo
            setTimeout(() => {
                applyRecaptchaToForms();
            }, 1000); // Esperar a que los formularios estén completamente cargados
        };
    }
    
    // Aplicar reCAPTCHA a todos los formularios
    function applyRecaptchaToForms() {
        // Comprobar si reCAPTCHA está cargado
        if (!recaptchaLoaded || !window.grecaptcha) {
            console.warn('reCAPTCHA no está listo todavía. Esperando...');
            setTimeout(applyRecaptchaToForms, 500);
            return;
        }
        
        console.log('reCAPTCHA está listo');
        
        // Buscar formularios que necesiten protección (excluir búsquedas o formas de solo lectura)
        const forms = document.querySelectorAll('form:not([data-no-recaptcha])');
        
        forms.forEach((form, index) => {
            // Crear contenedor para reCAPTCHA si no existe
            let recaptchaContainer = form.querySelector('.recaptcha-container');
            if (!recaptchaContainer) {
                recaptchaContainer = document.createElement('div');
                recaptchaContainer.className = 'recaptcha-container';
                // Insertar antes del botón de envío
                const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
                if (submitButton) {
                    submitButton.parentNode.insertBefore(recaptchaContainer, submitButton);
                } else {
                    form.appendChild(recaptchaContainer);
                }
            }
            
            // ID único para este widget
            const widgetId = `recaptcha-${index}`;
            recaptchaContainer.id = widgetId;
            
            // Renderizar el widget de reCAPTCHA (invisible)
            recaptchaWidgets[form.id || widgetId] = grecaptcha.render(widgetId, {
                'sitekey': RECAPTCHA_SITE_KEY,
                'size': 'invisible',
                'badge': 'bottomright',
                'callback': (token) => {
                    // Guardar el token en un campo oculto
                    let tokenInput = form.querySelector('input[name="g-recaptcha-response"]');
                    if (!tokenInput) {
                        tokenInput = document.createElement('input');
                        tokenInput.type = 'hidden';
                        tokenInput.name = 'g-recaptcha-response';
                        form.appendChild(tokenInput);
                    }
                    tokenInput.value = token;
                    
                    // Continuar con el envío del formulario
                    completeFormSubmission(form);
                }
            });
        });
        
        console.log('Verificación reCAPTCHA aplicada a los formularios');
    }
    
    // Aplicar verificación de reCAPTCHA a un formulario específico
    function applyRecaptchaVerification(form) {
        // Si reCAPTCHA está desactivado, simplemente continuar
        if (!USE_RECAPTCHA || !recaptchaLoaded) {
            return completeFormSubmission(form);
        }
        
        const formId = form.id || Array.from(document.querySelectorAll('form')).indexOf(form);
        
        // Verificar si ya tiene un widget de reCAPTCHA
        if (recaptchaWidgets[formId]) {
            grecaptcha.execute(recaptchaWidgets[formId]);
        } else {
            // Si no tiene widget, continuar sin verificación (como fallback)
            console.warn('Formulario sin widget de reCAPTCHA, se procede sin verificación');
            completeFormSubmission(form);
        }
    }
    
    // Completar el envío del formulario después de la verificación
    function completeFormSubmission(form) {
        // Aquí procesamos el formulario según su tipo
        // Esta es una versión simplificada, ajústate a tus necesidades
        
        const formId = form.id || '';
        const formAction = form.getAttribute('action') || '';
        
        if (typeof submitForm === 'function') {
            // Función general de envío si existe
            submitForm(form);
        } else {
            // Envío directo del formulario (si no hay manejo específico)
            console.log('Enviando formulario directamente');
            form.submit();
        }
    }
    
    // ==========================
    // Manejo de Eventos
    // ==========================
    
    // Interceptar envíos de formularios para aplicar reCAPTCHA
    function handleFormSubmit(event) {
        // Ignorar si no viene de un formulario
        if (!event.target.tagName || event.target.tagName.toLowerCase() !== 'form') {
            return;
        }
        
        const form = event.target;
        
        // Ignorar formularios que indican no usar reCAPTCHA
        if (form.hasAttribute('data-no-recaptcha')) {
            return;
        }
        
        // Evitar el envío directo
        event.preventDefault();
        
        // Validar el formulario primero
        if (!validateForm(form)) {
            return;
        }
        
        // Aplicar reCAPTCHA y continuar
        applyRecaptchaVerification(form);
    }
    
    // ==========================
    // Validación de Datos
    // ==========================
    
    // Configurar validación de entradas en tiempo real
    function setupInputValidation() {
        // Validar entradas cuando pierden el foco
        document.addEventListener('blur', function(event) {
            const target = event.target;
            
            // Solo procesar inputs, textareas y selects
            if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
                return;
            }
            
            validateInput(target);
        }, true); // Usar fase de captura
        
        // Sanitizar entradas para prevenir XSS
        document.addEventListener('input', function(event) {
            const target = event.target;
            
            // Solo procesar inputs de texto y textareas
            if (!['INPUT', 'TEXTAREA'].includes(target.tagName)) {
                return;
            }
            
            // No sanitizar campos de contraseña
            if (target.type === 'password') {
                return;
            }
            
            // Sanitizar en tiempo real
            const originalValue = target.value;
            const sanitizedValue = sanitizeUserInput(originalValue);
            
            // Solo actualizar si cambia, para evitar problemas con el cursor
            if (originalValue !== sanitizedValue) {
                target.value = sanitizedValue;
            }
        });
    }
    
    // Sanitizar entrada del usuario contra XSS
    function sanitizeUserInput(input) {
        if (typeof input !== 'string') {
            return input;
        }
        
        // Reemplazar caracteres especiales de HTML
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/data:/gi, '');
    }
    
    // Validar un campo individual
    function validateInput(input) {
        // Obtener el tipo de validación requerida
        const validationType = input.dataset.validate;
        if (!validationType) {
            return true; // No se requiere validación específica
        }
        
        let isValid = true;
        const value = input.value.trim();
        
        // Limpiar errores anteriores
        clearInputError(input);
        
        // Validar según el tipo
        switch (validationType) {
            case 'required':
                isValid = value.length > 0;
                if (!isValid) {
                    showInputError(input, 'Este campo es obligatorio');
                }
                break;
                
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                isValid = emailRegex.test(value);
                if (!isValid && value.length > 0) {
                    showInputError(input, 'Por favor, introduce un email válido');
                }
                break;
                
            case 'password':
                isValid = value.length >= MIN_PASSWORD_LENGTH;
                if (!isValid && value.length > 0) {
                    showInputError(input, `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
                }
                break;
                
            case 'number':
                isValid = !isNaN(parseFloat(value)) && isFinite(value);
                if (!isValid && value.length > 0) {
                    showInputError(input, 'Por favor, introduce un número válido');
                }
                break;
                
            // Añadir más tipos de validación según sea necesario
        }
        
        return isValid;
    }
    
    // Validar un formulario completo
    function validateForm(form) {
        let isValid = true;
        
        // Validar todos los campos con requisitos
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            // Si un campo no es válido, marcar todo el formulario como inválido
            if (!validateInput(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    // Mostrar error de validación
    function showInputError(input, message) {
        // Buscar contenedor padre para mostrar el error
        const formGroup = input.closest('.form-group') || input.parentNode;
        
        // Crear elemento de error si no existe
        let errorElement = formGroup.querySelector('.input-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'input-error';
            formGroup.appendChild(errorElement);
        }
        
        // Mostrar mensaje
        errorElement.textContent = message;
        input.classList.add('is-invalid');
    }
    
    // Limpiar error de validación
    function clearInputError(input) {
        const formGroup = input.closest('.form-group') || input.parentNode;
        const errorElement = formGroup.querySelector('.input-error');
        
        if (errorElement) {
            errorElement.textContent = '';
        }
        
        input.classList.remove('is-invalid');
    }
    
    // ==========================
    // Protecciones adicionales
    // ==========================
    
    // Prevenir clickjacking
    function preventClickjacking() {
        if (window.self !== window.top) {
            // La página está en un iframe
            window.top.location = window.self.location;
        }
    }
    
    // Protección contra CSRF
    function protectAgainstCSRF() {
        // Obtener token CSRF de cookies
        function getCsrfToken() {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('XSRF-TOKEN='))
                ?.split('=')[1];
            return token || '';
        }
        
        // Interceptar fetch para añadir token CSRF
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
            // Solo modificar peticiones a nuestra API
            if (typeof url === 'string' && url.includes('/api')) {
                options = options || {};
                options.headers = options.headers || {};
                
                // Añadir token CSRF
                const csrfToken = getCsrfToken();
                if (csrfToken) {
                    options.headers['X-CSRF-TOKEN'] = csrfToken;
                }
                
                // Asegurar que se envían cookies
                options.credentials = options.credentials || 'include';
            }
            
            return originalFetch.call(this, url, options);
        };
        
        // Interceptar XMLHttpRequest
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
            this._url = url;
            originalOpen.call(this, method, url, async, user, password);
        };
        
        const originalSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function(body) {
            if (typeof this._url === 'string' && this._url.includes('/api')) {
                const csrfToken = getCsrfToken();
                if (csrfToken) {
                    this.setRequestHeader('X-CSRF-TOKEN', csrfToken);
                }
                this.withCredentials = true;
            }
            originalSend.call(this, body);
        };
    }
    
    // ==========================
    // Inicializar el módulo
    // ==========================
    
    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSecurity);
    } else {
        initSecurity();
    }
})();