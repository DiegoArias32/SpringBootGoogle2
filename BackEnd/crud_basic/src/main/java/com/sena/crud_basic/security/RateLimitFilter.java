package com.sena.crud_basic.security;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sena.crud_basic.security.services.RateLimitService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitService rateLimitService;

    public RateLimitFilter(RateLimitService rateLimitService) {
        this.rateLimitService = rateLimitService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        // Get request method
        String method = request.getMethod();
        
        // Only apply rate limiting to mutation operations (POST, PUT, DELETE)
        // GET requests are allowed without rate limiting
        if ("GET".equals(method)) {
            // If it's a GET request, continue without rate limiting
            filterChain.doFilter(request, response);
            return;
        }
        
        // For POST, PUT, DELETE operations, apply rate limiting
        // Get client IP
        String ipAddress = getClientIP(request);
        
        // Try to consume a token from the bucket for this IP
        if (rateLimitService.tryConsume(ipAddress)) {
            // If tokens are available, continue
            filterChain.doFilter(request, response);
        } else {
            // If no tokens are available, respond with 429 Too Many Requests
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            
            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
            responseBody.put("error", "Too Many Requests");
            responseBody.put("message", "Has excedido el límite de peticiones para operaciones de modificación. Por favor, intenta más tarde.");
            
            ObjectMapper mapper = new ObjectMapper();
            mapper.writeValue(response.getWriter(), responseBody);
        }
    }
    
    private String getClientIP(HttpServletRequest request) {
        String xForwardedForHeader = request.getHeader("X-Forwarded-For");
        if (xForwardedForHeader != null && !xForwardedForHeader.isEmpty()) {
            // If there's X-Forwarded-For, use the first IP (original client)
            return xForwardedForHeader.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}