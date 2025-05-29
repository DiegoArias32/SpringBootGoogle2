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

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private JwtUtils tokenProvider;

    private HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository;

    @Value("${app.oauth2.authorizedRedirectUris:http://localhost:5501}")
    private String[] authorizedRedirectUris;

    @Autowired
    OAuth2AuthenticationSuccessHandler(JwtUtils tokenProvider, HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository) {
        this.tokenProvider = tokenProvider;
        this.httpCookieOAuth2AuthorizationRequestRepository = httpCookieOAuth2AuthorizationRequestRepository;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        String targetUrl = determineTargetUrl(request, response, authentication);

        if (response.isCommitted()) {
            logger.debug("Response has already been committed. Unable to redirect to " + targetUrl);
            return;
        }

        clearAuthenticationAttributes(request, response);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    @Override
    protected String determineTargetUrl(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        Optional<String> redirectUri = CookieUtils.getCookie(request, REDIRECT_URI_PARAM_COOKIE_NAME)
                .map(Cookie::getValue);

        if(redirectUri.isPresent() && !isAuthorizedRedirectUri(redirectUri.get())) {
            throw new OAuth2AuthenticationProcessingException("URI de redirección no autorizada");
        }

        // URL por defecto para tu frontend - CORREGIDO
        String targetUrl = redirectUri.orElse("http://localhost:5501");
        
        // Limpiar la URL base de caracteres problemáticos
        targetUrl = targetUrl.replaceAll("[\r\n\t]", "").trim();

        String token = tokenProvider.generateTokenFromUsername(authentication.getName());
        
        // Validar que el token no contenga caracteres problemáticos
        if (token.contains("\r") || token.contains("\n")) {
            throw new OAuth2AuthenticationProcessingException("Token inválido generado");
        }

        try {
            // IMPORTANTE: Agregar parámetros necesarios para el frontend
            String finalUrl = UriComponentsBuilder.fromUriString(targetUrl)
                    .queryParam("token", token)
                    .queryParam("auth", "success")
                    .build()
                    .toUriString();
                    
            // Validación final
            if (finalUrl.contains("\r") || finalUrl.contains("\n")) {
                return "http://localhost:5501?error=Invalid_redirect&auth=failure";
            }
            
            return finalUrl;
        } catch (Exception e) {
            // Fallback en caso de error
            return "http://localhost:5501?error=URL_construction_failed&auth=failure";
        }
    }

    protected void clearAuthenticationAttributes(HttpServletRequest request, HttpServletResponse response) {
        super.clearAuthenticationAttributes(request);
        httpCookieOAuth2AuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);
    }

    private boolean isAuthorizedRedirectUri(String uri) {
        URI clientRedirectUri = URI.create(uri);

        for (String authorizedRedirectUri : authorizedRedirectUris) {
            URI authorizedURI = URI.create(authorizedRedirectUri);
            if(authorizedURI.getHost().equalsIgnoreCase(clientRedirectUri.getHost())
                    && authorizedURI.getPort() == clientRedirectUri.getPort()) {
                return true;
            }
        }
        return false;
    }
}