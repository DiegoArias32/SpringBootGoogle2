package com.sena.crud_basic.security.oauth2;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.sena.crud_basic.model.ERole;
import com.sena.crud_basic.model.RoleDTO;
import com.sena.crud_basic.model.UserDTO;
import com.sena.crud_basic.repository.RoleRepository;
import com.sena.crud_basic.repository.UserRepository;
import com.sena.crud_basic.security.oauth2.user.OAuth2UserInfo;
import com.sena.crud_basic.security.oauth2.user.OAuth2UserInfoFactory;
import com.sena.crud_basic.security.services.UserDetailsImpl;

import java.util.Optional;
import java.util.Set;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest oAuth2UserRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(oAuth2UserRequest);

        try {
            return processOAuth2User(oAuth2UserRequest, oAuth2User);
        } catch (AuthenticationException ex) {
            throw ex;
        } catch (Exception ex) {
            // Throwing an instance of AuthenticationException will trigger the OAuth2AuthenticationFailureHandler
            throw new InternalAuthenticationServiceException(ex.getMessage(), ex.getCause());
        }
    }

    private OAuth2User processOAuth2User(OAuth2UserRequest oAuth2UserRequest, OAuth2User oAuth2User) {
        OAuth2UserInfo oAuth2UserInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(
            oAuth2UserRequest.getClientRegistration().getRegistrationId(), 
            oAuth2User.getAttributes()
        );
        
        if (!StringUtils.hasText(oAuth2UserInfo.getEmail())) {
            throw new OAuth2AuthenticationProcessingException("Email not found from OAuth2 provider");
        }

        Optional<UserDTO> userOptional = userRepository.findByEmail(oAuth2UserInfo.getEmail());
        UserDTO user;
        
        if (userOptional.isPresent()) {
            user = userOptional.get();
            if (!user.getEmail().equals(oAuth2UserInfo.getEmail())) {
                throw new OAuth2AuthenticationProcessingException("Email already exists");
            }
            user = updateExistingUser(user, oAuth2UserInfo);
        } else {
            user = registerNewUser(oAuth2UserRequest, oAuth2UserInfo);
        }

        return UserPrincipal.create(user, oAuth2User.getAttributes());
    }

    private UserDTO registerNewUser(OAuth2UserRequest oAuth2UserRequest, OAuth2UserInfo oAuth2UserInfo) {
        UserDTO user = new UserDTO();

        user.setFirstName(oAuth2UserInfo.getName().split(" ")[0]);
        if (oAuth2UserInfo.getName().split(" ").length > 1) {
            user.setLastName(oAuth2UserInfo.getName().substring(oAuth2UserInfo.getName().indexOf(" ") + 1));
        } else {
            user.setLastName("");
        }
        
        user.setEmail(oAuth2UserInfo.getEmail());
        user.setUsername(generateUniqueUsername(oAuth2UserInfo.getEmail()));
        user.setPassword(""); // OAuth2 users don't have password
        user.setEnabled(true);
        user.setAccountNonLocked(true);

        // Asignar rol por defecto (CLIENT)
        RoleDTO userRole = roleRepository.findByName(ERole.ROLE_CLIENT)
                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
        user.setRoles(Set.of(userRole));

        return userRepository.save(user);
    }

    private UserDTO updateExistingUser(UserDTO existingUser, OAuth2UserInfo oAuth2UserInfo) {
        existingUser.setFirstName(oAuth2UserInfo.getName().split(" ")[0]);
        if (oAuth2UserInfo.getName().split(" ").length > 1) {
            existingUser.setLastName(oAuth2UserInfo.getName().substring(oAuth2UserInfo.getName().indexOf(" ") + 1));
        }
        return userRepository.save(existingUser);
    }

    private String generateUniqueUsername(String email) {
        String baseUsername = email.substring(0, email.indexOf("@"));
        String username = baseUsername;
        int counter = 1;
        
        while (userRepository.existsByUsername(username)) {
            username = baseUsername + counter;
            counter++;
        }
        
        return username;
    }
}