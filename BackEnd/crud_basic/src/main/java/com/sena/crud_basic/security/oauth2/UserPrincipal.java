package com.sena.crud_basic.security.oauth2;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import com.sena.crud_basic.model.UserDTO;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Implementación de {@link OAuth2User} y {@link UserDetails} que representa
 * el principal (usuario autenticado) en el sistema.
 * <p>
 * Esta clase se utiliza para integrar la información de usuario propia y la
 * información obtenida de un proveedor OAuth2 en una sola entidad.
 * </p>
 */
public class UserPrincipal implements OAuth2User, UserDetails {

    private Long id;
    private String email;
    private String password;
    private String firstName;
    private String lastName;
    private String username;
    private Collection<? extends GrantedAuthority> authorities;
    private Map<String, Object> attributes;

    /**
     * Constructor principal para crear una instancia de UserPrincipal.
     *
     * @param id          ID único del usuario
     * @param email       correo electrónico del usuario
     * @param password    contraseña del usuario (encriptada)
     * @param firstName   nombre(s) del usuario
     * @param lastName    apellidos del usuario
     * @param username    nombre de usuario
     * @param authorities roles y permisos asignados al usuario
     */
    public UserPrincipal(Long id, String email, String password, String firstName, String lastName, 
                         String username, Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.username = username;
        this.authorities = authorities;
    }

    /**
     * Crea un UserPrincipal a partir de un DTO de usuario.
     * Convierte los roles del usuario en objetos {@link GrantedAuthority}.
     *
     * @param user DTO de usuario que contiene los datos base
     * @return UserPrincipal construido a partir del DTO
     */
    public static UserPrincipal create(UserDTO user) {
        List<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getName().name()))
                .collect(Collectors.toList());

        return new UserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getPassword(),
                user.getFirstName(),
                user.getLastName(),
                user.getUsername(),
                authorities
        );
    }

    /**
     * Crea un UserPrincipal a partir de un DTO de usuario y un mapa
     * de atributos adicionales obtenidos durante la autenticación OAuth2.
     *
     * @param user       DTO de usuario base
     * @param attributes mapa de atributos OAuth2 adicionales
     * @return UserPrincipal con atributos asociados
     */
    public static UserPrincipal create(UserDTO user, Map<String, Object> attributes) {
        UserPrincipal userPrincipal = UserPrincipal.create(user);
        userPrincipal.setAttributes(attributes);
        return userPrincipal;
    }

    /**
     * Obtiene el ID único del usuario.
     *
     * @return ID del usuario
     */
    public Long getId() {
        return id;
    }

    /**
     * Obtiene el correo electrónico del usuario.
     *
     * @return correo electrónico
     */
    public String getEmail() {
        return email;
    }

    /**
     * Obtiene la contraseña encriptada del usuario.
     *
     * @return contraseña
     */
    @Override
    public String getPassword() {
        return password;
    }

    /**
     * Obtiene el nombre de usuario.
     *
     * @return username
     */
    @Override
    public String getUsername() {
        return username;
    }

    /**
     * Obtiene el nombre(s) del usuario.
     *
     * @return nombre(s)
     */
    public String getFirstName() {
        return firstName;
    }

    /**
     * Obtiene el apellido(s) del usuario.
     *
     * @return apellido(s)
     */
    public String getLastName() {
        return lastName;
    }

    /**
     * Indica si la cuenta no ha expirado.
     * Siempre retorna {@code true} (no implementa lógica de expiración).
     *
     * @return {@code true}
     */
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    /**
     * Indica si la cuenta no está bloqueada.
     * Siempre retorna {@code true} (no implementa lógica de bloqueo).
     *
     * @return {@code true}
     */
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    /**
     * Indica si las credenciales no han expirado.
     * Siempre retorna {@code true} (no implementa lógica de expiración).
     *
     * @return {@code true}
     */
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    /**
     * Indica si el usuario está habilitado.
     * Siempre retorna {@code true} (no implementa lógica de deshabilitación).
     *
     * @return {@code true}
     */
    @Override
    public boolean isEnabled() {
        return true;
    }

    /**
     * Obtiene las autoridades (roles/permisos) asociadas al usuario.
     *
     * @return colección de objetos {@link GrantedAuthority}
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    /**
     * Obtiene los atributos OAuth2 del usuario.
     *
     * @return mapa de atributos
     */
    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    /**
     * Asigna los atributos OAuth2 al usuario.
     *
     * @param attributes mapa de atributos a asignar
     */
    public void setAttributes(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    /**
     * Obtiene el nombre del usuario para OAuth2.
     * En este caso, se retorna el ID convertido a cadena.
     *
     * @return ID como cadena
     */
    @Override
    public String getName() {
        return String.valueOf(id);
    }
}
