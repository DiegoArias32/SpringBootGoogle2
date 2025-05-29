package com.sena.crud_basic.security;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

public class ReCaptchaModels {

    @Data
    public static class ReCaptchaResponse {
        private boolean success;
        private String hostname;
        private String action;
        private float score;
        @JsonProperty("challenge_ts")
        private String challengeTs;
        @JsonProperty("error-codes")
        private List<String> errorCodes;
    }
    
    @Data
    public static class ReCaptchaRequest {
        private String token;
    }
}