package com.pharmasathi.backend.service;

import com.pharmasathi.backend.dto.LoginRequest;
import com.pharmasathi.backend.dto.RegisterShopRequest;
import com.pharmasathi.backend.entity.ShopAccount;
import com.pharmasathi.backend.repository.ShopAccountRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;

@Service
public class ShopAccountService {

    private final ShopAccountRepository repository;
    private final SecureRandom secureRandom = new SecureRandom();

    public ShopAccountService(ShopAccountRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> status() {
        return repository.findFirstByOrderByIdAsc()
                .<Map<String, Object>>map(account -> Map.of(
                        "registered", true,
                        "shopName", account.getShopName(),
                        "ownerName", account.getOwnerName()
                ))
                .orElseGet(() -> Map.of("registered", false));
    }

    public ShopAccount register(RegisterShopRequest request) {
        if (repository.count() > 0) {
            throw new IllegalStateException("This installation is already registered");
        }
        validate(request);

        byte[] saltBytes = new byte[24];
        secureRandom.nextBytes(saltBytes);
        String salt = Base64.getEncoder().encodeToString(saltBytes);

        ShopAccount account = new ShopAccount();
        account.setShopName(request.shopName().trim());
        account.setOwnerName(request.ownerName().trim());
        account.setPhone(request.phone().trim());
        account.setEmail(request.email() == null ? "" : request.email().trim());
        account.setUsername(request.username().trim().toLowerCase());
        account.setPasswordSalt(salt);
        account.setPasswordHash(hash(request.password(), salt));
        account.setRegisteredAt(LocalDateTime.now());
        return repository.save(account);
    }

    public Map<String, Object> login(LoginRequest request) {
        ShopAccount account = repository.findByUsername(request.username().trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        if (!MessageDigest.isEqual(
                account.getPasswordHash().getBytes(StandardCharsets.UTF_8),
                hash(request.password(), account.getPasswordSalt()).getBytes(StandardCharsets.UTF_8))) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        return Map.of(
                "authenticated", true,
                "shopName", account.getShopName(),
                "ownerName", account.getOwnerName()
        );
    }

    private void validate(RegisterShopRequest request) {
        if (request.shopName() == null || request.shopName().isBlank()
                || request.ownerName() == null || request.ownerName().isBlank()
                || request.phone() == null || !request.phone().matches("\\d{10}")
                || request.username() == null || request.username().trim().length() < 4
                || request.password() == null || request.password().length() < 6) {
            throw new IllegalArgumentException("Please enter valid registration details");
        }
    }

    private String hash(String password, String salt) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(
                    digest.digest((salt + password).getBytes(StandardCharsets.UTF_8))
            );
        } catch (Exception exception) {
            throw new IllegalStateException("Password security could not be initialized", exception);
        }
    }
}
