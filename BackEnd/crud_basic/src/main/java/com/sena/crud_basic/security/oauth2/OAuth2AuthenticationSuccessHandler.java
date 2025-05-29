package com.sena.crud_basic.security.oauth2;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import com.sena.crud_basic.security.JwtUtils;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URI;
import java.util.Optional;

import static com.sena.crud_basic.security.oauth2.HttpCookieOAuth2AuthorizationRequestRepository.REDIRECT_URI_PARAM_COOKIE_NAME;

/**
 * Handler personalizado que se ejecuta cuando una autenticación OAuth2 es exitosa.
 * <p>
 * Esta clase extiende {@link SimpleUrlAuthenticationSuccessHandler} para
 * manejar la redirección al frontend con un token JWT generado y validado,
 * además de limpiar cookies temporales usadas en el proceso de autenticación.
 * </p>
 */
@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    /**
     * Utilidad para la generación y validación de tokens JWT.
     */
    private JwtUtils tokenProvider;

    /**
     * Repositorio para manejar las cookies relacionadas con la autorización OAuth2.
     */
    private HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository;

    /**
     * Lista de URIs autorizadas para redirección luego de la autenticación exitosa.
     * <p>
     * Se configura vía propiedades y por defecto apunta a http://localhost:5501.
     * </p>
     */
    @Value("${app.oauth2.authorizedRedirectUris:http://localhost:5501}")
    private String[] authorizedRedirectUris;

    /**
     * Constructor que inyecta las dependencias necesarias.
     *
     * @param tokenProvider Utilidad para JWT
     * @param httpCookieOAuth2AuthorizationRequestRepository Repositorio para cookies OAuth2
     */
    @Autowired
    public OAuth2AuthenticationSuccessHandler(JwtUtils tokenProvider,
                                              HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository) {
        this.tokenProvider = tokenProvider;
        this.httpCookieOAuth2AuthorizationRequestRepository = httpCookieOAuth2AuthorizationRequestRepository;
    }

    /**
     * Método que se ejecuta al autenticarse exitosamente.
     * <p>
     * Determina la URL de destino, limpia atributos de autenticación
     * y realiza la redirección HTTP al frontend.
     * </p>
     *
     * @param request        petición HTTP recibida
     * @param response       respuesta HTTP a enviar
     * @param authentication información de autenticación exitosa
     * @throws IOException      si ocurre error de entrada/salida
     * @throws ServletException si ocurre error en el servlet
     */
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        String targetUrl = determineTargetUrl(request, response, authentication);

        if (response.isCommitted()) {
            logger.debug("Response has already been committed. Unable to redirect to " + targetUrl);
            return;
        }

        clearAuthenticationAttributes(request, response);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    /**
     * Construye la URL de redirección luego de la autenticación exitosa.
     * <p>
     * Valida que la URI de redirección esté autorizada y añade el token JWT generado
     * como parámetro de consulta junto con un indicador de éxito.
     * </p>
     *
     * @param request        petición HTTP recibida
     * @param response       respuesta HTTP
     * @param authentication información de autenticación exitosa
     * @return URL final a la que se redirige el usuario
     * @throws OAuth2AuthenticationProcessingException si la URI no está autorizada o el token es inválido
     */
    @Override
    protected String determineTargetUrl(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) {
        Optional<String> redirectUri = CookieUtils.getCookie(request, REDIRECT_URI_PARAM_COOKIE_NAME)
                .map(Cookie::getValue);

        if (redirectUri.isPresent() && !isAuthorizedRedirectUri(redirectUri.get())) {
            throw new OAuth2AuthenticationProcessingException("URI de redirección no autorizada");
        }

        // URL por defecto si no se proporciona ninguna URI de redirección
        String targetUrl = redirectUri.orElse("http://localhost:5501");

        // Limpiar caracteres problemáticos de la URL
        targetUrl = targetUrl.replaceAll("[\r\n\t]", "").trim();

        String token = tokenProvider.generateTokenFromUsername(authentication.getName());

        // Validar que el token generado no contenga caracteres problemáticos
        if (token.contains("\r") || token.contains("\n")) {
            throw new OAuth2AuthenticationProcessingException("Token inválido generado");
        }

        try {
            // Construir la URL final con parámetros necesarios para el frontend
            String finalUrl = UriComponentsBuilder.fromUriString(targetUrl)
                    .queryParam("token", token)
                    .queryParam("auth", "success")
                    .build()
                    .toUriString();

            // Validar caracteres problemáticos en la URL final
            if (finalUrl.contains("\r") || finalUrl.contains("\n")) {
                return "http://localhost:5501?error=Invalid_redirect&auth=failure";
            }

            return finalUrl;
        } catch (Exception e) {
            // En caso de error en la construcción de la URL se devuelve una URL fallback con error
            return "http://localhost:5501?error=URL_construction_failed&auth=failure";
        }
    }

    /**
     * Limpia los atributos de autenticación y elimina cookies temporales relacionadas con OAuth2.
     *
     * @param request  petición HTTP
     * @param response respuesta HTTP
     */
    protected void clearAuthenticationAttributes(HttpServletRequest request, HttpServletResponse response) {
        super.clearAuthenticationAttributes(request);
        httpCookieOAuth2AuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);
    }

    /**
     * Verifica si la URI proporcionada está en la lista de URIs autorizadas.
     * <p>
     * La comparación es estricta por host y puerto, ignorando el esquema.
     * </p>
     *
     * @param uri URI a validar
     * @return {@code true} si la URI está autorizada, {@code false} en caso contrario
     */
    private boolean isAuthorizedRedirectUri(String uri) {
        URI clientRedirectUri = URI.create(uri);

        for (String authorizedRedirectUri : authorizedRedirectUris) {
            URI authorizedURI = URI.create(authorizedRedirectUri);
            if (authorizedURI.getHost().equalsIgnoreCase(clientRedirectUri.getHost())
                    && authorizedURI.getPort() == clientRedirectUri.getPort()) {
                return true;
            }
        }
        return false;
    }
}
