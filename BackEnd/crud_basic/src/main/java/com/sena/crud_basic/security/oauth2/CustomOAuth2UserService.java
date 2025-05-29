package com.sena.crud_basic.security.oauth2;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.sena.crud_basic.model.ERole;
import com.sena.crud_basic.model.RoleDTO;
import com.sena.crud_basic.model.UserDTO;
import com.sena.crud_basic.repository.RoleRepository;
import com.sena.crud_basic.repository.UserRepository;
import com.sena.crud_basic.security.oauth2.user.OAuth2UserInfo;
import com.sena.crud_basic.security.oauth2.user.OAuth2UserInfoFactory;

import java.util.Optional;
import java.util.Set;

/**
 * Servicio personalizado que extiende DefaultOAuth2UserService.
 * Se encarga de procesar el usuario autenticado por un proveedor OAuth2,
 * ya sea registrándolo o actualizando su información.
 */
@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Lazy
    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Método principal para cargar el usuario desde OAuth2.
     * Procesa el usuario y maneja errores relacionados con la autenticación.
     */
    @Override
    public OAuth2User loadUser(OAuth2UserRequest oAuth2UserRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(oAuth2UserRequest);

        try {
            return processOAuth2User(oAuth2UserRequest, oAuth2User);
        } catch (AuthenticationException ex) {
            throw ex;
        } catch (Exception ex) {
            // Si ocurre un error, lanza excepción que será capturada por el handler de fallo en autenticación.
            throw new InternalAuthenticationServiceException(ex.getMessage(), ex.getCause());
        }
    }

    /**
     * Procesa la información del usuario autenticado.
     * Si ya existe en la base de datos, lo actualiza; de lo contrario, lo registra.
     */
    private OAuth2User processOAuth2User(OAuth2UserRequest oAuth2UserRequest, OAuth2User oAuth2User) {
        // Extrae la información del usuario según el proveedor (Google, Facebook, etc.)
        OAuth2UserInfo oAuth2UserInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(
            oAuth2UserRequest.getClientRegistration().getRegistrationId(),
            oAuth2User.getAttributes()
        );

        // Verifica si se obtuvo el correo electrónico
        if (!StringUtils.hasText(oAuth2UserInfo.getEmail())) {
            throw new OAuth2AuthenticationProcessingException("Email not found from OAuth2 provider");
        }

        // Busca al usuario en la base de datos
        Optional<UserDTO> userOptional = userRepository.findByEmail(oAuth2UserInfo.getEmail());
        UserDTO user;

        if (userOptional.isPresent()) {
            // Si existe, actualiza sus datos
            user = userOptional.get();
            user = updateExistingUser(user, oAuth2UserInfo);
        } else {
            // Si no existe, lo registra
            user = registerNewUser(oAuth2UserRequest, oAuth2UserInfo);
        }

        // Devuelve el usuario autenticado como UserPrincipal
        return UserPrincipal.create(user, oAuth2User.getAttributes());
    }

    /**
     * Registra un nuevo usuario en la base de datos usando la información del proveedor OAuth2.
     */
    private UserDTO registerNewUser(OAuth2UserRequest oAuth2UserRequest, OAuth2UserInfo oAuth2UserInfo) {
        UserDTO user = new UserDTO();

        // Separa nombre y apellido
        String fullName = oAuth2UserInfo.getName();
        String[] nameParts = fullName != null ? fullName.split(" ", 2) : new String[]{"Usuario", ""};

        user.setFirstName(nameParts[0]);
        user.setLastName(nameParts.length > 1 ? nameParts[1] : "");
        user.setEmail(oAuth2UserInfo.getEmail());

        // Genera un nombre de usuario único a partir del correo
        user.setUsername(generateUniqueUsername(oAuth2UserInfo.getEmail()));

        // Crea una contraseña temporal codificada (no se usará para iniciar sesión)
        user.setPassword(passwordEncoder.encode("OAuth2User_" + System.nanoTime()));

        // Marca al usuario como OAuth2
        user.setOAuth2User(true);
        user.setEnabled(true);
        user.setAccountNonLocked(true);

        // Asigna el rol por defecto (CLIENT)
        RoleDTO userRole = roleRepository.findByName(ERole.ROLE_CLIENT)
                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
        user.setRoles(Set.of(userRole));

        // Guarda y devuelve el nuevo usuario
        return userRepository.save(user);
    }

    /**
     * Actualiza los datos de un usuario existente con la nueva información de OAuth2.
     */
    private UserDTO updateExistingUser(UserDTO existingUser, OAuth2UserInfo oAuth2UserInfo) {
        String fullName = oAuth2UserInfo.getName();
        if (fullName != null) {
            String[] nameParts = fullName.split(" ", 2);
            existingUser.setFirstName(nameParts[0]);
            if (nameParts.length > 1) {
                existingUser.setLastName(nameParts[1]);
            }
        }
        return userRepository.save(existingUser);
    }

    /**
     * Genera un nombre de usuario único basado en el correo electrónico.
     * Si el nombre ya existe, agrega un número al final.
     */
    private String generateUniqueUsername(String email) {
        // Extrae el nombre base antes del @
        String baseUsername = email.substring(0, email.indexOf("@"));
        // Elimina caracteres especiales
        baseUsername = baseUsername.replaceAll("[^a-zA-Z0-9]", "");

        String username = baseUsername;
        int counter = 1;

        // Si ya existe en la base de datos, intenta con sufijos numéricos
        while (userRepository.existsByUsername(username)) {
            username = baseUsername + counter;
            counter++;
        }

        return username;
    }
}
