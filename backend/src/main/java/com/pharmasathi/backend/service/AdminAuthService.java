package com.pharmasathi.backend.service;

import com.pharmasathi.backend.dto.AdminLoginRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AdminAuthService {

    private final String adminUsername;
    private final String adminPassword;
    private final SecureRandom random = new SecureRandom();
    private final Map<String, Instant> sessions = new ConcurrentHashMap<>();

    public AdminAuthService(
            @Value("${pharmasathi.admin-username:}") String adminUsername,
            @Value("${pharmasathi.admin-password:}") String adminPassword) {
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
    }

    public String login(AdminLoginRequest request) {
        if (adminUsername.isBlank() || adminPassword.isBlank()) {
            throw new IllegalStateException("Platform admin is not configured");
        }
        if (request == null
                || !matches(adminUsername, request.username())
                || !matches(adminPassword, request.password())) {
            throw new IllegalArgumentException("Invalid admin credentials");
        }
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        sessions.put(hash(token), Instant.now().plus(8, ChronoUnit.HOURS));
        return token;
    }

    public boolean authorized(String authorization) {
        sessions.entrySet().removeIf(entry -> entry.getValue().isBefore(Instant.now()));
        if (authorization == null || !authorization.startsWith("Bearer ")) return false;
        Instant expiry = sessions.get(hash(authorization.substring(7)));
        return expiry != null && expiry.isAfter(Instant.now());
    }

    public void logout(String authorization) {
        if (authorization != null && authorization.startsWith("Bearer ")) {
            sessions.remove(hash(authorization.substring(7)));
        }
    }

    private boolean matches(String expected, String actual) {
        if (actual == null) return false;
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                actual.getBytes(StandardCharsets.UTF_8)
        );
    }

    private String hash(String value) {
        try {
            return Base64.getEncoder().encodeToString(
                    MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))
            );
        } catch (Exception exception) {
            throw new IllegalStateException("Admin security could not be initialized", exception);
        }
    }
}
