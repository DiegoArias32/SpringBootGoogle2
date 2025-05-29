// Script de seguridad para el panel administrativo
(function() {
    'use strict';
    
    // Constantes de configuración
    const API_BASE_URL = 'http://localhost:8080/api';
    
    // Variables globales
    let csrfToken = '';
    let requestCount = 0;
    const MAX_REQUESTS_PER_MINUTE = 100;
    let lastRequestTime = Date.now();
    let requestTimestamps = [];
    
    // Intervalo de limpieza de timestamps de solicitudes (cada minuto)
    setInterval(() => {
        const oneMinuteAgo = Date.now() - 60000;
        requestTimestamps = requestTimestamps.filter(time => time > oneMinuteAgo);
    }, 60000);
    
    // ========================
    // Funciones de seguridad
    // ========================
    
    // Verificar autenticación al cargar la página
    function checkAuth() {
        // Verificar datos de usuario en sessionStorage
        let userData = sessionStorage.getItem('userData');
        
        // Si no está en sessionStorage, verificar cookies
        if (!userData) {
            const userDataCookie = document.cookie
                .split('; ')
                .find(row => row.startsWith('userData='))
                ?.split('=')[1];
                
            if (userDataCookie) {
                userData = decodeURIComponent(userDataCookie);
                // Restaurar en sessionStorage
                sessionStorage.setItem('userData', userData);
                const parsedData = JSON.parse(userData);
                sessionStorage.setItem('userRoles', JSON.stringify(parsedData.roles));
            }
        }
        
        if (!userData) {
            redirectToLogin();
            return false;
        }
        
        try {
            const parsedUserData = JSON.parse(userData);
            const roles = parsedUserData.roles || [];
            
            // Verificar roles (solo admin y staff pueden acceder)
            if (!roles.includes('ROLE_ADMIN') && !roles.includes('ROLE_STAFF')) {
                console.log('Acceso no autorizado - rol incorrecto');
                redirectToLogin();
                return false;
            }
        } catch (e) {
            console.error('Error al analizar datos de usuario', e);
            redirectToLogin();
            return false;
        }
        
        return true;
    }
    
    // Función para redireccionar al login
    function redirectToLogin() {
        sessionStorage.removeItem('userData');
        sessionStorage.removeItem('userRoles');
        window.location.href = '../index.html';
    }
    
    // Función para obtener el CSRF token
    function getCsrfToken() {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1];
        return cookieValue || '';
    }
    
    // Control de tasa de peticiones
    function checkRateLimit() {
        const now = Date.now();
        requestTimestamps.push(now);
        
        // Limpiar timestamps antiguos (más de 1 minuto)
        const oneMinuteAgo = now - 60000;
        requestTimestamps = requestTimestamps.filter(time => time > oneMinuteAgo);
        
        // Verificar si se excede el límite
        if (requestTimestamps.length > MAX_REQUESTS_PER_MINUTE) {
            console.error('Límite de tasa excedido. Espere un momento.');
            showError('Demasiadas peticiones. Por favor, espere un momento antes de intentar nuevamente.');
            return false;
        }
        
        return true;
    }
    
    // Verificar datos de entrada para evitar inyección
    function sanitizeInput(input) {
        if (typeof input === 'string') {
            // Eliminar tags HTML y caracteres especiales
            return input
                .replace(/[<>]/g, '') // Eliminar < y >
                .replace(/javascript:/gi, '') // Eliminar javascript:
                .replace(/on\w+\s*=/gi, '') // Eliminar manejadores de eventos on*
                .replace(/(\b)(alert|confirm|prompt|console|window|document|eval|setTimeout|setInterval)(\s*\()/gi, '$1x$2$3'); // Funciones peligrosas
        } else if (typeof input === 'object' && input !== null) {
            // Recursivamente sanitizar objetos
            if (Array.isArray(input)) {
                return input.map(item => sanitizeInput(item));
            } else {
                const result = {};
                for (const key in input) {
                    if (Object.prototype.hasOwnProperty.call(input, key)) {
                        result[key] = sanitizeInput(input[key]);
                    }
                }
                return result;
            }
        }
        
        return input; // Devolver otros tipos sin cambios
    }
    
    // ========================
    // Funciones de API mejoradas
    // ========================
    
    // Función base para peticiones API con seguridad adicional
    async function apiRequest(url, method, data = null) {
        // Verificar autenticación
        if (!checkAuth()) {
            return;
        }
        
        // Verificar límite de tasa
        if (!checkRateLimit()) {
            throw new Error('Demasiadas peticiones. Por favor, espere un momento.');
        }
        
        try {
            // Sanitizar datos de entrada
            if (data) {
                data = sanitizeInput(data);
            }
            
            // Obtenemos el token CSRF actual
            csrfToken = getCsrfToken();
            
            const headers = {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            };
            
            const fetchOptions = {
                method: method,
                headers: headers,
                credentials: 'include' // Incluir cookies
            };
            
            if (data && (method === 'POST' || method === 'PUT')) {
                fetchOptions.body = JSON.stringify(data);
            }
            
            // Mostrar spinner de carga
            if (typeof showLoading === 'function') {
                showLoading();
            }
            
            const response = await fetch(`${API_BASE_URL}${url}`, fetchOptions);
            
            // Ocultar spinner de carga
            if (typeof hideLoading === 'function') {
                hideLoading();
            }
            
            // Si la respuesta no es exitosa, lanzamos un error
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    // Error de autenticación o autorización
                    redirectToLogin();
                    throw new Error('Sesión expirada o no autorizada. Por favor, inicie sesión nuevamente.');
                }
                
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`);
            }
            
            // Para respuestas sin contenido (204)
            if (response.status === 204) {
                return null;
            }
            
            return await response.json();
        } catch (error) {
            // Ocultar spinner en caso de error
            if (typeof hideLoading === 'function') {
                hideLoading();
            }
            
            console.error('Error en la petición API:', error);
            if (typeof showError === 'function') {
                showError(error.message || 'Error en la comunicación con el servidor');
            }
            throw error;
        }
    }
    
    // Expose API request function globally
    window.secureApiRequest = apiRequest;
    
    // Helper functions
    window.secureShowLoading = function() {
        if (typeof showLoading === 'function') {
            showLoading();
        }
    };
    
    window.secureHideLoading = function() {
        if (typeof hideLoading === 'function') {
            hideLoading();
        }
    };
    
    window.secureShowSuccess = function(message) {
        if (typeof showSuccess === 'function') {
            showSuccess(message);
        }
    };
    
    window.secureShowError = function(message) {
        if (typeof showError === 'function') {
            showError(message);
        }
    };
    
    // Cerrar sesión
    window.logout = async function() {
        try {
            await apiRequest('/auth/signout', 'POST');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        } finally {
            sessionStorage.removeItem('userData');
            sessionStorage.removeItem('userRoles');
            window.location.href = '../index.html';
        }
    };
    
    // ========================
    // Inicialización
    // ========================
    
    // Verificar autenticación al cargar la página
    document.addEventListener('DOMContentLoaded', function() {
        // Verificar autenticación
        if (!checkAuth()) {
            return;
        }
        
        // Obtener token CSRF
        csrfToken = getCsrfToken();
        
        // Añadir botón de logout
        const headerContent = document.querySelector('.header-content');
        if (headerContent) {
            const logoutButton = document.createElement('button');
            logoutButton.className = 'btn btn-danger logout-btn';
            logoutButton.innerHTML = '<i class="fas fa-sign-out-alt"></i> Cerrar Sesión';
            logoutButton.addEventListener('click', logout);
            headerContent.appendChild(logoutButton);
        }
        
        // Protección contra XSS en elementos de entrada
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                if (this.type !== 'password' && this.type !== 'number') {
                    this.value = sanitizeInput(this.value);
                }
            });
        });
    });
    
    // Añadir gestión de errores global
    window.addEventListener('error', function(event) {
        console.error('Error global:', event.message);
        if (typeof showError === 'function') {
            showError('Se ha producido un error en la aplicación. Por favor, recargue la página o contacte al administrador.');
        }
    });
    
    // Prevenir ataques de clickjacking
    if (window.self !== window.top) {
        // La página está en un iframe
        window.top.location = window.self.location;
    }
    
})();