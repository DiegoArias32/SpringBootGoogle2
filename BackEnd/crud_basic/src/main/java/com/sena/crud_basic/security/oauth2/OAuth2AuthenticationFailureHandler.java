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

@Component
public class OAuth2AuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    @Autowired
    HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException, ServletException {
        String targetUrl = CookieUtils.getCookie(request, REDIRECT_URI_PARAM_COOKIE_NAME)
                .map(Cookie::getValue)
                .orElse("http://localhost:5501"); // URL por defecto

        // Limpiar caracteres problemáticos del mensaje de error
        String errorMessage = exception.getLocalizedMessage();
        if (errorMessage != null) {
            // Remover caracteres CR/LF y otros caracteres problemáticos
            errorMessage = errorMessage.replaceAll("[\r\n\t]", " ")
                                     .replaceAll("\\s+", " ")
                                     .trim();
            // Limitar longitud del mensaje
            if (errorMessage.length() > 100) {
                errorMessage = errorMessage.substring(0, 100);
            }
        } else {
            errorMessage = "Authentication failed";
        }

        try {
            targetUrl = UriComponentsBuilder.fromUriString(targetUrl)
                    .queryParam("error", URLEncoder.encode(errorMessage, StandardCharsets.UTF_8))
                    .queryParam("auth", "failure")
                    .build()
                    .toUriString();
        } catch (Exception e) {
            // Si hay error construyendo la URL, usar una URL simple
            targetUrl = "http://localhost:5501?error=" + 
                       URLEncoder.encode("Authentication failed", StandardCharsets.UTF_8) + 
                       "&auth=failure";
        }

        httpCookieOAuth2AuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);

        // Validar que la URL no contenga caracteres problemáticos antes de redirigir
        if (targetUrl.contains("\r") || targetUrl.contains("\n")) {
            targetUrl = "http://localhost:5501?error=Invalid_redirect&auth=failure";
        }

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}