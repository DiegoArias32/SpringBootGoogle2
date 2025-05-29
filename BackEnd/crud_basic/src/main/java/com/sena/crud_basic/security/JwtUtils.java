package com.sena.crud_basic.security;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import com.sena.crud_basic.security.services.UserDetailsImpl;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtils {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${app.jwtSecret}")
    private String jwtSecret;

    @Value("${app.jwtExpirationMs}")
    private int jwtExpirationMs;

    public String generateJwtToken(Authentication authentication) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();

        // Obtener los roles del usuario
        List<String> roles = userPrincipal.getAuthorities().stream()
                                          .map(grantedAuthority -> grantedAuthority.getAuthority())
                                          .collect(Collectors.toList());

        return Jwts.builder()
                .setSubject(userPrincipal.getUsername())
                .claim("email", userPrincipal.getEmail())           // ✅ AGREGADO: Email
                .claim("firstName", userPrincipal.getFirstName())   // ✅ AGREGADO: Nombre
                .claim("lastName", userPrincipal.getLastName())     // ✅ AGREGADO: Apellido
                .claim("userId", userPrincipal.getId())             // ✅ AGREGADO: ID
                .claim("roles", roles)                              // Roles existentes
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateTokenFromUsername(String username) {
        // NOTA: Este método se usa para OAuth2, mantenerlo simple
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    private Key key() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String getUserNameFromJwtToken(String token) {
        return Jwts.parser().setSigningKey(key())
                .parseClaimsJws(token).getBody().getSubject();
    }

    // Método para obtener los roles desde el token JWT
    public List<String> getRolesFromJwtToken(String token) {
        Claims claims = Jwts.parser().setSigningKey(key())
                .parseClaimsJws(token).getBody();
        
        return claims.containsKey("roles") ? (List<String>) claims.get("roles") : null;
    }

    // ✅ NUEVO: Método para obtener el email del token
    public String getEmailFromJwtToken(String token) {
        Claims claims = Jwts.parser().setSigningKey(key())
                .parseClaimsJws(token).getBody();
        
        return claims.containsKey("email") ? (String) claims.get("email") : null;
    }

    // ✅ NUEVO: Método para obtener el nombre del token
    public String getFirstNameFromJwtToken(String token) {
        Claims claims = Jwts.parser().setSigningKey(key())
                .parseClaimsJws(token).getBody();
        
        return claims.containsKey("firstName") ? (String) claims.get("firstName") : null;
    }

    // ✅ NUEVO: Método para obtener el apellido del token
    public String getLastNameFromJwtToken(String token) {
        Claims claims = Jwts.parser().setSigningKey(key())
                .parseClaimsJws(token).getBody();
        
        return claims.containsKey("lastName") ? (String) claims.get("lastName") : null;
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parser().setSigningKey(key()).parse(authToken);
            return true;
        } catch (MalformedJwtException e) {
            logger.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("JWT claims string is empty: {}", e.getMessage());
        }

        return false;
    }
}