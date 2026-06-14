package com.pharmasathi.backend.service;

import com.pharmasathi.backend.entity.AuthSession;
import com.pharmasathi.backend.repository.AuthSessionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class AuthSessionService {

    private final SecureRandom secureRandom = new SecureRandom();
    private final AuthSessionRepository repository;
    private final long sessionHours;

    public AuthSessionService(
            AuthSessionRepository repository,
            @Value("${pharmasathi.session-hours:24}") long sessionHours) {
        this.repository = repository;
        this.sessionHours = Math.max(1, sessionHours);
    }

    @Transactional
    public String create(Long shopId) {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        AuthSession session = new AuthSession();
        session.setShopId(shopId);
        session.setTokenHash(hash(token));
        session.setCreatedAt(LocalDateTime.now());
        session.setExpiresAt(LocalDateTime.now().plusHours(sessionHours));
        repository.save(session);
        return token;
    }

    @Transactional
    public Long resolve(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return null;
        }
        repository.deleteAllByExpiresAtBefore(LocalDateTime.now());
        return repository.findByTokenHashAndExpiresAtAfter(
                hash(authorization.substring(7)),
                LocalDateTime.now()
        ).map(AuthSession::getShopId).orElse(null);
    }

    @Transactional
    public void revoke(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) return;
        repository.findByTokenHashAndExpiresAtAfter(hash(authorization.substring(7)), LocalDateTime.now())
                .ifPresent(repository::delete);
    }

    private String hash(String token) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8))
            );
        } catch (Exception exception) {
            throw new IllegalStateException("Session security could not be initialized", exception);
        }
    }
}
