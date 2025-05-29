package com.sena.crud_basic.security.oauth2.user;

import com.sena.crud_basic.security.oauth2.OAuth2AuthenticationProcessingException;

import java.util.Map;

/**
 * Factoría para crear instancias de {@link OAuth2UserInfo}
 * según el proveedor OAuth2 utilizado (identificado por registrationId).
 * <p>
 * Permite abstraer la creación de objetos específicos para cada proveedor,
 * facilitando la extensión para nuevos proveedores en el futuro.
 * </p>
 */
public class OAuth2UserInfoFactory {

    /**
     * Crea una instancia concreta de {@link OAuth2UserInfo}
     * basada en el proveedor OAuth2 identificado por {@code registrationId}.
     *
     * @param registrationId identificador del proveedor OAuth2 (ejemplo: "google")
     * @param attributes mapa de atributos del usuario proporcionados por el proveedor OAuth2
     * @return una instancia concreta de {@link OAuth2UserInfo} correspondiente al proveedor
     * @throws OAuth2AuthenticationProcessingException si el proveedor no está soportado
     */
    public static OAuth2UserInfo getOAuth2UserInfo(String registrationId, Map<String, Object> attributes) {
        if (registrationId.equalsIgnoreCase("google")) {
            return new GoogleOAuth2UserInfo(attributes);
        } else {
            throw new OAuth2AuthenticationProcessingException(
                "Sorry! Login with " + registrationId + " is not supported yet.");
        }
    }
}
