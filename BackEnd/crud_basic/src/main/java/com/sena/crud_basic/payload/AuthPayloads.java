package com.sena.crud_basic.payload;

import java.util.List;
import java.util.Set;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class AuthPayloads {

    @Data
    public static class LoginRequest {
        @NotBlank(message = "El nombre de usuario o correo electrónico es obligatorio")
        private String usernameOrEmail;

        @NotBlank(message = "La contraseña es obligatoria")
        private String password;
        
        @NotBlank(message = "El token reCAPTCHA es obligatorio")
        private String recaptchaToken;
    }

    @Data
    public static class SignupRequest {
        @NotBlank(message = "El nombre es obligatorio")
        @Size(min = 2, max = 50, message = "El nombre debe tener entre 2 y 50 caracteres")
        @Pattern(regexp = "^[\\p{L} .'-]+$", message = "El nombre solo puede contener letras y espacios")
        private String firstName;

        @NotBlank(message = "El apellido es obligatorio")
        @Size(min = 2, max = 50, message = "El apellido debe tener entre 2 y 50 caracteres")
        @Pattern(regexp = "^[\\p{L} .'-]+$", message = "El apellido solo puede contener letras y espacios")
        private String lastName;

        @NotBlank(message = "El nombre de usuario es obligatorio")
        @Size(min = 3, max = 20, message = "El nombre de usuario debe tener entre 3 y 20 caracteres")
        @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos")
        private String username;

        @NotBlank(message = "El correo electrónico es obligatorio")
        @Size(max = 50, message = "El correo electrónico no puede exceder los 50 caracteres")
        @Email(message = "El correo electrónico debe tener un formato válido")
        private String email;

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 8, max = 120, message = "La contraseña debe tener entre 8 y 120 caracteres")
        @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\\S+$).{8,}$", 
                message = "La contraseña debe contener al menos un número, una mayúscula, una minúscula, un carácter especial y sin espacios")
        private String password;
        
        @Size(max = 15, message = "El teléfono no puede exceder los 15 caracteres")
        @Pattern(regexp = "^[0-9+()-]*$", message = "El teléfono solo puede contener números y los símbolos +, (, ), -")
        private String phone;
        
        private String position;
        private String employeeId;
        private Set<String> roles;
        
        @NotBlank(message = "El token reCAPTCHA es obligatorio")
        private String recaptchaToken;
    }

    @Data
    public static class JwtResponse {
        private String token;
        private String type = "Bearer";
        private Long id;
        private String firstName;
        private String lastName;
        private String username;
        private String email;
        private List<String> roles;

        public JwtResponse(String token, Long id, String firstName, String lastName, String username, String email, List<String> roles) {
            this.token = token;
            this.id = id;
            this.firstName = firstName;
            this.lastName = lastName;
            this.username = username;
            this.email = email;
            this.roles = roles;
        }
    }

    @Data
    public static class MessageResponse {
        private String message;

        public MessageResponse(String message) {
            this.message = message;
        }
    }
}