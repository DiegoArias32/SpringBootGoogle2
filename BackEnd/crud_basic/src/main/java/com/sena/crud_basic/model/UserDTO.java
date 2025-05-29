package com.sena.crud_basic.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users", 
       uniqueConstraints = {
           @UniqueConstraint(columnNames = "username"),
           @UniqueConstraint(columnNames = "email")
       })
public class UserDTO {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 50)
    private String firstName;

    @NotBlank
    @Size(max = 50)
    private String lastName;

    @NotBlank
    @Size(max = 20)
    private String username;

    @NotBlank
    @Size(max = 50)
    @Email
    private String email;

    // CAMBIADO: Hacer el password menos restrictivo para OAuth2
    @Size(min = 1, max = 120, message = "La contraseña debe tener entre 1 y 120 caracteres")
    private String password = ""; // Valor por defecto
    
    @Size(max = 15)
    private String phone;
    
    private String position;
    
    private String employeeId;
    
    private boolean enabled = true;
    
    private boolean accountNonLocked = true;
    
    private int failedAttempt = 0;
    
    // Indicador para usuarios OAuth2
    @Column(name = "is_oauth2_user")
    private boolean isOAuth2User = false;
    
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_roles", 
               joinColumns = @JoinColumn(name = "user_id"),
               inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<RoleDTO> roles = new HashSet<>();

    public UserDTO(String firstName, String lastName, String username, String email, String password) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.username = username;
        this.email = email;
        this.password = password;
    }
}