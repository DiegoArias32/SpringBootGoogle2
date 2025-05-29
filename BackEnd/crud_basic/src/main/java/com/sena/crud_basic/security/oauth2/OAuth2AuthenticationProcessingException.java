package com.sena.crud_basic.security.oauth2;

import org.springframework.security.core.AuthenticationException;

/**
 * Excepción personalizada para manejar errores ocurridos durante
 * el proceso de autenticación OAuth2.
 * <p>
 * Esta excepción extiende {@link AuthenticationException} y se
 * utiliza para encapsular problemas específicos en la autenticación
 * OAuth2, permitiendo un manejo más claro y específico de errores.
 * </p>
 */
public class OAuth2AuthenticationProcessingException extends AuthenticationException {

    /**
     * Crea una nueva instancia de {@code OAuth2AuthenticationProcessingException}
     * con un mensaje detallado y la causa raíz del error.
     *
     * @param msg el mensaje que describe el error
     * @param t la causa original del error (otra excepción)
     */
    public OAuth2AuthenticationProcessingException(String msg, Throwable t) {
        super(msg, t);
    }

    /**
     * Crea una nueva instancia de {@code OAuth2AuthenticationProcessingException}
     * con un mensaje detallado.
     *
     * @param msg el mensaje que describe el error
     */
    public OAuth2AuthenticationProcessingException(String msg) {
        super(msg);
    }
}
