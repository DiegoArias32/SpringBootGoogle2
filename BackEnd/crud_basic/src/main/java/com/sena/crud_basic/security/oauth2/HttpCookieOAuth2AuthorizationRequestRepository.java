// HttpCookieOAuth2AuthorizationRequestRepository.java
package com.sena.crud_basic.security.oauth2;

import com.nimbusds.oauth2.sdk.util.StringUtils;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Esta clase implementa un repositorio para almacenar solicitudes de autorización OAuth2
 * utilizando cookies en lugar de la sesión HTTP. Esto es útil para aplicaciones sin estado (stateless),
 * como las SPA (Single Page Applications) o backends RESTful.
 */
@Component
public class HttpCookieOAuth2AuthorizationRequestRepository implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    // Nombre de la cookie que almacenará la solicitud de autorización
    public static final String OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME = "oauth2_auth_request";

    // Nombre de la cookie que almacenará la URI de redirección después del login
    public static final String REDIRECT_URI_PARAM_COOKIE_NAME = "redirect_uri";

    // Tiempo de expiración de las cookies en segundos (3 minutos)
    private static final int cookieExpireSeconds = 180;

    /**
     * Carga la solicitud de autorización desde la cookie.
     */
    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        return CookieUtils.getCookie(request, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME)
                .map(cookie -> CookieUtils.deserialize(cookie, OAuth2AuthorizationRequest.class))
                .orElse(null);
    }

    /**
     * Guarda la solicitud de autorización en una cookie.
     * Si es null, elimina las cookies correspondientes.
     */
    @Override
    public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest,
                                         HttpServletRequest request,
                                         HttpServletResponse response) {
        if (authorizationRequest == null) {
            // Si no hay solicitud, elimina las cookies
            CookieUtils.deleteCookie(request, response, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME);
            CookieUtils.deleteCookie(request, response, REDIRECT_URI_PARAM_COOKIE_NAME);
            return;
        }

        // Serializa y guarda la solicitud de autorización en una cookie
        CookieUtils.addCookie(
                response,
                OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME,
                CookieUtils.serialize(authorizationRequest),
                cookieExpireSeconds
        );

        // Si el cliente incluyó una URI de redirección, la guarda también
        String redirectUriAfterLogin = request.getParameter(REDIRECT_URI_PARAM_COOKIE_NAME);
        if (StringUtils.isNotBlank(redirectUriAfterLogin)) {
            CookieUtils.addCookie(
                    response,
                    REDIRECT_URI_PARAM_COOKIE_NAME,
                    redirectUriAfterLogin,
                    cookieExpireSeconds
            );
        }
    }

    /**
     * Elimina la solicitud de autorización de la cookie y la retorna.
     * Técnicamente, solo la carga (no la elimina realmente).
     * La eliminación se realiza en otro método (`removeAuthorizationRequestCookies`).
     */
    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request, HttpServletResponse response) {
        return this.loadAuthorizationRequest(request);
    }

    /**
     * Elimina ambas cookies relacionadas con OAuth2 (autorización y redirect_uri).
     * Se usa después del login exitoso o cancelado para limpiar el estado.
     */
    public void removeAuthorizationRequestCookies(HttpServletRequest request, HttpServletResponse response) {
        CookieUtils.deleteCookie(request, response, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME);
        CookieUtils.deleteCookie(request, response, REDIRECT_URI_PARAM_COOKIE_NAME);
    }
}
