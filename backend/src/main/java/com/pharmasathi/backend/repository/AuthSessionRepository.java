package com.pharmasathi.backend.repository;

import com.pharmasathi.backend.entity.AuthSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface AuthSessionRepository extends JpaRepository<AuthSession, Long> {
    Optional<AuthSession> findByTokenHashAndExpiresAtAfter(String tokenHash, LocalDateTime now);
    void deleteAllByShopId(Long shopId);
    void deleteAllByExpiresAtBefore(LocalDateTime now);
}
