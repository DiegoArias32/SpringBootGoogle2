package com.sena.crud_basic.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.sena.crud_basic.security.JwtUtils;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Controller
@RequestMapping("/oauth2")
public class SimpleOAuth2Controller {

    @Autowired
    private JwtUtils jwtUtils;

    @GetMapping("/success")
    public void oauth2Success(HttpServletRequest request, HttpServletResponse response) throws IOException {
        
        try {
            // Obtener la autenticación del contexto de seguridad
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !authentication.isAuthenticated()) {
                System.out.println("❌ No hay autenticación en el contexto");
                response.sendRedirect("http://localhost:5501?error=No_authentication&auth=failure");
                return;
            }

            System.out.println("✅ Autenticación encontrada: " + authentication.getClass().getSimpleName());
            System.out.println("✅ Principal: " + authentication.getPrincipal().getClass().getSimpleName());
            System.out.println("✅ Es autenticado: " + authentication.isAuthenticated());

            // Intentar obtener información del usuario
            String username = null;
            String email = null;

            // Si es un OAuth2User
            if (authentication.getPrincipal() instanceof OAuth2User) {
                OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
                email = oAuth2User.getAttribute("email");
                String name = oAuth2User.getAttribute("name");
                username = email != null ? email : name;
                System.out.println("✅ OAuth2User - Email: " + email + ", Name: " + name);
            } 
            // Si es otro tipo de usuario
            else {
                username = authentication.getName();
                System.out.println("✅ Otro tipo de usuario: " + username);
            }
            
            if (username == null || username.isEmpty()) {
                System.out.println("❌ No se pudo obtener username");
                response.sendRedirect("http://localhost:5501?error=No_username&auth=failure");
                return;
            }

            // Generar token JWT
            String token = jwtUtils.generateTokenFromUsername(username);
            System.out.println("✅ Token JWT generado: " + token.substring(0, 20) + "...");
            
            // Construir URL de redirección
            String redirectUrl = String.format("http://localhost:5501?token=%s&auth=success", token);
            System.out.println("✅ Redirigiendo a: " + redirectUrl);
            
            response.sendRedirect(redirectUrl);
            
        } catch (Exception e) {
            System.err.println("❌ Error en oauth2Success: " + e.getMessage());
            e.printStackTrace();
            response.sendRedirect("http://localhost:5501?error=Token_generation_failed&auth=failure");
        }
    }

    @GetMapping("/failure")
    public void oauth2Failure(@RequestParam(required = false) String error, 
                             HttpServletResponse response) throws IOException {
        String errorMsg = error != null ? error : "OAuth2_authentication_failed";
        System.out.println("❌ OAuth2 falló: " + errorMsg);
        response.sendRedirect("http://localhost:5501?error=" + errorMsg + "&auth=failure");
    }
}