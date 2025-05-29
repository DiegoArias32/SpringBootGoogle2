package com.sena.crud_basic.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.XXssProtectionHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.sena.crud_basic.security.services.RateLimitService;
import com.sena.crud_basic.security.services.UserDetailsServiceImpl;
import com.sena.crud_basic.security.oauth2.CustomOAuth2UserService;
import com.sena.crud_basic.security.oauth2.OAuth2AuthenticationSuccessHandler;
import com.sena.crud_basic.security.oauth2.OAuth2AuthenticationFailureHandler;
import com.sena.crud_basic.security.oauth2.HttpCookieOAuth2AuthorizationRequestRepository;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)  // Habilita seguridad en métodos con anotaciones @PreAuthorize, etc.
public class WebSecurityConfig {

    @Autowired
    UserDetailsServiceImpl userDetailsService;  // Servicio que carga datos de usuario para autenticación

    @Autowired
    private AuthEntryPointJwt unauthorizedHandler;  // Maneja errores 401 no autorizados

    @Autowired
    private RateLimitService rateLimitService;  // Servicio para limitar tasa de peticiones (rate limiting)

    @Autowired
    private CustomOAuth2UserService customOAuth2UserService;  // Servicio para cargar info usuario OAuth2

    @Autowired
    private OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;  // Handler para login OAuth2 exitoso

    @Autowired
    private OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler;  // Handler para fallo en login OAuth2

    /**
     * Bean para manejar solicitudes OAuth2 guardando la autorización en cookies,
     * evitando estado en el servidor.
     */
    @Bean
    public HttpCookieOAuth2AuthorizationRequestRepository cookieAuthorizationRequestRepository() {
        return new HttpCookieOAuth2AuthorizationRequestRepository();
    }

    /**
     * Filtro para validar el token JWT en cada solicitud HTTP.
     */
    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();
    }

    /**
     * Filtro personalizado para limitar la cantidad de peticiones que un usuario
     * o IP puede hacer en un periodo determinado (rate limiting).
     */
    @Bean
    public RateLimitFilter rateLimitFilter() {
        return new RateLimitFilter(rateLimitService);
    }

    /**
     * Proveedor de autenticación que usa UserDetailsService y BCrypt para validar
     * usuario y contraseña.
     */
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    /**
     * Bean que expone el AuthenticationManager requerido por Spring Security para
     * manejar el proceso de autenticación.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    /**
     * Configura la cadena de filtros de seguridad HTTP, políticas CORS, CSRF,
     * cabeceras HTTP, gestión de sesiones, reglas de acceso y OAuth2 login.
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Deshabilita CSRF porque se usa JWT y APIs REST (stateless)
            .csrf(csrf -> csrf.disable())

            // Configura CORS con reglas definidas en corsConfigurationSource()
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Maneja excepciones de autenticación no autorizada (401)
            .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))

            // Gestión de sesiones (session management)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED) // Sesiones creadas solo si es necesario (importante para OAuth2)
                .maximumSessions(1)             // Limita sesión concurrente a 1 por usuario
                .maxSessionsPreventsLogin(false) // No previene nuevo login si se supera límite, invalida sesión vieja
            )

            // Configura cabeceras HTTP para seguridad extra
            .headers(headers -> headers
                .frameOptions(frameOptions -> frameOptions.deny()) // Previene clickjacking
                .xssProtection(xss -> xss.headerValue(XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK)) // Protección contra XSS
                .contentSecurityPolicy(csp -> csp.policyDirectives(
                    // Política de seguridad de contenido (Content Security Policy) detallada
                    "default-src 'self'; " +
                    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://accounts.google.com; " +
                    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://accounts.google.com; " +
                    "font-src 'self' https://cdnjs.cloudflare.com data: https://fonts.gstatic.com; " +
                    "img-src 'self' data: https://accounts.google.com https://lh3.googleusercontent.com; " +
                    "frame-src https://www.google.com/ https://www.google.com/recaptcha/ https://www.gstatic.com/ https://accounts.google.com; " +
                    "connect-src 'self' http://localhost:8080 http://localhost:5501/ http://127.0.0.1:8080 http://172.30.7.71:8080 http://172.30.7.71:5501 http://192.168.0.*:8080 http://192.168.*.*:8080 http://10.*.*.*:8080 https://www.google.com https://www.gstatic.com/ https://accounts.google.com https://oauth2.googleapis.com; "
                ))
            )

            // Configura reglas de autorización por URL
            .authorizeHttpRequests(auth -> auth
                // Endpoints públicos sin autenticación
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/error").permitAll()
                
                // Rutas relacionadas con OAuth2 también públicas para iniciar login
                .requestMatchers("/oauth2/**").permitAll()
                .requestMatchers("/login/oauth2/**").permitAll()
                
                // Recursos estáticos permitidos sin autenticación
                .requestMatchers("/css/**", "/js/**", "/images/**").permitAll()
                .requestMatchers("/", "/index.html", "/login", "/register").permitAll()
                
                // APIs específicas permitidas para pruebas (puedes restringir después)
                .requestMatchers("/api/employees/**").permitAll()
                .requestMatchers("/api/clients/**").permitAll()
                .requestMatchers("/api/menu/**").permitAll()
                
                // Cualquier otra petición requiere usuario autenticado
                .anyRequest().authenticated()
            )

            // Configura el login OAuth2
            .oauth2Login(oauth2 -> oauth2
                // Endpoint para iniciar la autorización OAuth2
                .authorizationEndpoint(authorization -> authorization
                    .baseUri("/oauth2/authorize")
                )
                // Endpoint para recibir el código de autorización
                .redirectionEndpoint(redirection -> redirection
                    .baseUri("/login/oauth2/code/*")
                )
                // Servicio para cargar la info de usuario OAuth2
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(customOAuth2UserService)
                )
                // URL a la que redirige en caso de éxito y de fallo
                .defaultSuccessUrl("/oauth2/success", true)
                .failureUrl("/oauth2/failure")
            );

        // Configura el proveedor de autenticación personalizado
        http.authenticationProvider(authenticationProvider());

        // Agrega los filtros personalizados en orden correcto antes del filtro de autenticación por usuario/contraseña
        http.addFilterBefore(rateLimitFilter(), UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Configura la política CORS para permitir orígenes, métodos y cabeceras
     * especificados y permite envío de cookies y credenciales.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Permite orígenes con patrones para localhost y redes privadas comunes
        configuration.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:*", 
            "http://127.0.0.1:*", 
            "http://172.30.7.71:*",
            "http://192.168.*.*:*",
            "http://10.*.*.*:*"
        ));

        // Métodos HTTP permitidos para CORS
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // Permite todos los headers
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // Permite el envío de cookies y credenciales en peticiones CORS
        configuration.setAllowCredentials(true);

        // Tiempo máximo (en segundos) que el resultado de preflight CORS es cacheado
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Aplica la configuración CORS para todas las rutas
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Bean para codificar las contraseñas usando BCrypt, recomendado para seguridad.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
