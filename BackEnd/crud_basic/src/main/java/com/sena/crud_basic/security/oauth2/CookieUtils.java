package com.sena.crud_basic.security.oauth2;

import org.springframework.util.SerializationUtils;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.Base64;
import java.util.Optional;

/**
 * Utilidad para manejar cookies en operaciones relacionadas con OAuth2 y autenticación.
 * Provee métodos para obtener, agregar, eliminar, serializar y deserializar cookies.
 */
public class CookieUtils {

    /**
     * Obtiene una cookie específica del request por su nombre.
     *
     * @param request HttpServletRequest que contiene las cookies.
     * @param name    Nombre de la cookie a buscar.
     * @return Optional con la cookie encontrada o vacío si no existe.
     */
    public static Optional<Cookie> getCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();

        if (cookies != null && cookies.length > 0) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(name)) {
                    return Optional.of(cookie);
                }
            }
        }

        return Optional.empty();
    }

    /**
     * Agrega una cookie HTTP segura al response.
     *
     * @param response HttpServletResponse donde se agregará la cookie.
     * @param name     Nombre de la cookie.
     * @param value    Valor de la cookie.
     * @param maxAge   Tiempo de vida de la cookie en segundos (por ejemplo, 180 para 3 minutos).
     */
    public static void addCookie(HttpServletResponse response, String name, String value, int maxAge) {
        Cookie cookie = new Cookie(name, value);
        cookie.setPath("/");              // Accesible desde toda la aplicación
        cookie.setHttpOnly(true);        // No accesible desde JavaScript (seguridad)
        // cookie.setSecure(true);       // Descomentar si usas HTTPS en producción
        cookie.setMaxAge(maxAge);
        response.addCookie(cookie);
    }

    /**
     * Elimina una cookie del navegador del cliente.
     * Lo hace estableciendo su valor como vacío y su edad máxima en 0.
     *
     * @param request  HttpServletRequest para acceder a las cookies existentes.
     * @param response HttpServletResponse para enviar la cookie eliminada.
     * @param name     Nombre de la cookie a eliminar.
     */
    public static void deleteCookie(HttpServletRequest request, HttpServletResponse response, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null && cookies.length > 0) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(name)) {
                    cookie.setValue("");
                    cookie.setPath("/");
                    cookie.setMaxAge(0);
                    response.addCookie(cookie);
                }
            }
        }
    }

    /**
     * Serializa un objeto Java en una cadena Base64, ideal para almacenarlo en una cookie.
     * Esto permite guardar objetos complejos en cookies como tokens o información de autorización.
     *
     * @param object Objeto a serializar.
     * @return Cadena codificada en Base64 lista para guardarse como cookie.
     */
    public static String serialize(Object object) {
        return Base64.getUrlEncoder()
                .encodeToString(SerializationUtils.serialize(object));
    }

    /**
     * Deserializa una cookie (que contiene datos codificados en Base64) a un objeto del tipo especificado.
     *
     * @param cookie Cookie que contiene el objeto serializado.
     * @param cls    Clase esperada del objeto deserializado.
     * @param <T>    Tipo genérico del objeto.
     * @return Objeto deserializado.
     */
    public static <T> T deserialize(Cookie cookie, Class<T> cls) {
        return cls.cast(SerializationUtils.deserialize(
                Base64.getUrlDecoder().decode(cookie.getValue())));
    }
}
