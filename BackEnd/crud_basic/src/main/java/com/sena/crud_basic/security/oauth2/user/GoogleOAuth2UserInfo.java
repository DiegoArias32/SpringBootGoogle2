package com.sena.crud_basic.security.oauth2.user;

import java.util.Map;

/**
 * Clase que representa la información del usuario obtenida
 * desde el proveedor OAuth2 de Google.
 * <p>
 * Esta clase extiende {@link OAuth2UserInfo} y proporciona
 * métodos específicos para extraer datos de la estructura
 * estándar de atributos que Google devuelve tras la autenticación.
 * </p>
 */
public class GoogleOAuth2UserInfo extends OAuth2UserInfo {

    /**
     * Constructor que recibe un mapa con los atributos
     * del usuario proporcionados por Google.
     *
     * @param attributes mapa con atributos devueltos por Google OAuth2
     */
    public GoogleOAuth2UserInfo(Map<String, Object> attributes) {
        super(attributes);
    }

    /**
     * Obtiene el ID único del usuario según el estándar de Google.
     * El atributo "sub" representa el identificador único del usuario.
     *
     * @return ID del usuario como cadena
     */
    @Override
    public String getId() {
        return (String) attributes.get("sub");
    }

    /**
     * Obtiene el nombre completo del usuario.
     * Se extrae del atributo "name".
     *
     * @return nombre completo del usuario
     */
    @Override
    public String getName() {
        return (String) attributes.get("name");
    }

    /**
     * Obtiene el correo electrónico del usuario.
     * Se extrae del atributo "email".
     *
     * @return correo electrónico
     */
    @Override
    public String getEmail() {
        return (String) attributes.get("email");
    }

    /**
     * Obtiene la URL de la imagen de perfil del usuario.
     * Se extrae del atributo "picture".
     *
     * @return URL de la imagen de perfil
     */
    @Override
    public String getImageUrl() {
        return (String) attributes.get("picture");
    }
}
