package com.sena.crud_basic.security.services;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitService {

    private final Map<String, Bucket> limiters = new ConcurrentHashMap<>();

    // Configuración para limitar a 20 peticiones por minuto por IP
    private Bucket createNewBucket() {
        Bandwidth limit = Bandwidth.classic(10, Refill.greedy(10, Duration.ofMinutes(1)));
        return Bucket.builder().addLimit(limit).build();
    }

    public boolean tryConsume(String ipAddress) {
        return limiters.computeIfAbsent(ipAddress, key -> createNewBucket()).tryConsume(1);
    }
    
}