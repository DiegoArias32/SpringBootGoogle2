package com.sena.crud_basic.security.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.sena.crud_basic.security.ReCaptchaModels.ReCaptchaResponse;

@Service
public class ReCaptchaService {

    private final WebClient webClient;
    private final String recaptchaSecret;
    private final float scoreThreshold;

    public ReCaptchaService(WebClient.Builder webClientBuilder, 
                           @Value("${google.recaptcha.secret}") String recaptchaSecret,
                           @Value("${google.recaptcha.score-threshold:0.5}") float scoreThreshold) {
        this.webClient = webClientBuilder.baseUrl("https://www.google.com/recaptcha/api").build();
        this.recaptchaSecret = recaptchaSecret;
        this.scoreThreshold = scoreThreshold;
    }

    public boolean validateToken(String token) {
        if (token == null || token.isEmpty()) {
            return false;
        }

        try {
            ReCaptchaResponse response = webClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/siteverify")
                    .queryParam("secret", recaptchaSecret)
                    .queryParam("response", token)
                    .build())
                .retrieve()
                .bodyToMono(ReCaptchaResponse.class)
                .block();

            return response != null && response.isSuccess() && response.getScore() >= scoreThreshold;
        } catch (Exception e) {
            return false;
        }
    }
}