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
                .claim("roles", roles)  // Agregar los roles al claim
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    // ADD THIS METHOD - Generate token from username (for OAuth2)
    public String generateTokenFromUsername(String username) {
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
        // Using legacy parser() method instead of parserBuilder()
        return Jwts.parser().setSigningKey(key())
                .parseClaimsJws(token).getBody().getSubject();
    }

    // Método para obtener los roles desde el token JWT
    public List<String> getRolesFromJwtToken(String token) {
        // Using legacy parser() method instead of parserBuilder()
        Claims claims = Jwts.parser().setSigningKey(key())
                .parseClaimsJws(token).getBody();
        
        // Obtener los roles del token (si existen)
        return claims.containsKey("roles") ? (List<String>) claims.get("roles") : null;
    }

    public boolean validateJwtToken(String authToken) {
        try {
            // Using legacy parser() method instead of parserBuilder()
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