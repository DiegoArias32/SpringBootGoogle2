package com.sena.crud_basic.security.oauth2;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import static com.sena.crud_basic.security.oauth2.HttpCookieOAuth2AuthorizationRequestRepository.REDIRECT_URI_PARAM_COOKIE_NAME;

/**
 * Manejador personalizado para cuando ocurre una falla en la autenticación OAuth2.
 * Se encarga de redirigir al usuario a una URL con el mensaje de error correspondiente
 * y limpiar las cookies temporales utilizadas durante el proceso OAuth2.
 */
@Component
public class OAuth2AuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    // Repositorio que maneja las cookies usadas durante el flujo OAuth2
    @Autowired
    HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository;

    /**
     * Este método se ejecuta automáticamente cuando ocurre un error de autenticación OAuth2.
     */
    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception)
            throws IOException, ServletException {

        // Intenta obtener la URI de redirección desde la cookie
        String targetUrl = CookieUtils.getCookie(request, REDIRECT_URI_PARAM_COOKIE_NAME)
                .map(Cookie::getValue)
                .orElse("http://localhost:5501"); // Si no hay cookie, se usa una URL por defecto

        // Extrae el mensaje de error de la excepción
        String errorMessage = exception.getLocalizedMessage();

        // Limpia el mensaje de error para que no cause problemas en la URL
        if (errorMessage != null) {
            errorMessage = errorMessage.replaceAll("[\r\n\t]", " ") // Elimina saltos de línea y tabulaciones
                                       .replaceAll("\\s+", " ")     // Reemplaza múltiples espacios por uno solo
                                       .trim();                     // Elimina espacios al inicio/final

            // Limita el mensaje a 100 caracteres para evitar URLs largas
            if (errorMessage.length() > 100) {
                errorMessage = errorMessage.substring(0, 100);
            }
        } else {
            errorMessage = "Authentication failed";
        }

        // Construye la URL de redirección incluyendo los parámetros de error
        try {
            targetUrl = UriComponentsBuilder.fromUriString(targetUrl)
                    .queryParam("error", URLEncoder.encode(errorMessage, StandardCharsets.UTF_8)) // Mensaje de error codificado
                    .queryParam("auth", "failure") // Indicador de fallo de autenticación
                    .build()
                    .toUriString();
        } catch (Exception e) {
            // En caso de fallo al construir la URL, se usa una URL genérica con mensaje básico
            targetUrl = "http://localhost:5501?error=" +
                    URLEncoder.encode("Authentication failed", StandardCharsets.UTF_8) +
                    "&auth=failure";
        }

        // Limpia las cookies utilizadas en el proceso OAuth2
        httpCookieOAuth2AuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);

        // Verifica si la URL contiene caracteres peligrosos antes de redirigir
        if (targetUrl.contains("\r") || targetUrl.contains("\n")) {
            targetUrl = "http://localhost:5501?error=Invalid_redirect&auth=failure";
        }

        // Redirige al usuario a la URL final con el mensaje de error
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
