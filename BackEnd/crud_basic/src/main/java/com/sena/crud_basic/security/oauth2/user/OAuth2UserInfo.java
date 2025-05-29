package com.sena.crud_basic.security.oauth2.user;

import java.util.Map;

/**
 * Clase abstracta que representa la información básica
 * de un usuario obtenida desde un proveedor OAuth2.
 * <p>
 * Proporciona una estructura común para extraer atributos
 * como id, nombre, correo electrónico y URL de la imagen de perfil,
 * los cuales deben ser implementados por cada proveedor específico.
 * </p>
 */
public abstract class OAuth2UserInfo {

    /**
     * Mapa que contiene los atributos del usuario
     * devueltos por el proveedor OAuth2.
     */
    protected Map<String, Object> attributes;

    /**
     * Constructor que recibe un mapa con los atributos del usuario.
     *
     * @param attributes atributos del usuario obtenidos del proveedor OAuth2
     */
    public OAuth2UserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    /**
     * Obtiene el mapa de atributos del usuario.
     *
     * @return mapa con los atributos del usuario
     */
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    /**
     * Obtiene el identificador único del usuario,
     * el cual debe ser implementado según el proveedor OAuth2.
     *
     * @return ID único del usuario
     */
    public abstract String getId();

    /**
     * Obtiene el nombre completo o nombre de usuario,
     * implementación específica según proveedor.
     *
     * @return nombre completo o nombre de usuario
     */
    public abstract String getName();

    /**
     * Obtiene el correo electrónico del usuario.
     *
     * @return correo electrónico
     */
    public abstract String getEmail();

    /**
     * Obtiene la URL de la imagen de perfil del usuario.
     *
     * @return URL de la imagen de perfil
     */
    public abstract String getImageUrl();
}
