package com.sena.crud_basic.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sena.crud_basic.security.oauth2.UserPrincipal;
import com.sena.crud_basic.security.JwtUtils;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class OAuth2Controller {

    @Autowired
    private JwtUtils jwtUtils;

    @GetMapping("/oauth2/success")
    public ResponseEntity<?> oauth2Success(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        String jwt = jwtUtils.generateTokenFromUsername(userPrincipal.getUsername());
        
        Map<String, Object> response = new HashMap<>();
        response.put("token", jwt);
        response.put("type", "Bearer");
        response.put("id", userPrincipal.getId());
        response.put("username", userPrincipal.getUsername());
        response.put("email", userPrincipal.getEmail());
        response.put("firstName", userPrincipal.getFirstName());
        response.put("lastName", userPrincipal.getLastName());
        response.put("roles", userPrincipal.getAuthorities());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/oauth2/error")
    public ResponseEntity<?> oauth2Error() {
        Map<String, String> response = new HashMap<>();
        response.put("error", "OAuth2 authentication failed");
        return ResponseEntity.badRequest().body(response);
    }
}