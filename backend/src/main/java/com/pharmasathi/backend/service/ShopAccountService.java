package com.pharmasathi.backend.service;

import com.pharmasathi.backend.dto.LoginRequest;
import com.pharmasathi.backend.dto.RegisterShopRequest;
import com.pharmasathi.backend.entity.ShopAccount;
import com.pharmasathi.backend.repository.ShopAccountRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.security.spec.KeySpec;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

@Service
public class ShopAccountService {

    private final ShopAccountRepository repository;
    private final AuthSessionService sessions;
    private final SecureRandom secureRandom = new SecureRandom();

    public ShopAccountService(ShopAccountRepository repository, AuthSessionService sessions) {
        this.repository = repository;
        this.sessions = sessions;
    }

    public Map<String, Object> status() {
        return repository.findFirstByOrderByIdAsc()
                .<Map<String, Object>>map(account -> Map.of(
                        "registered", true,
                        "shopName", account.getShopName(),
                        "ownerName", account.getOwnerName(),
                        "plan", planOrDefault(account),
                        "enabled", account.isEnabled(),
                        "subscriptionEndDate", dateOrEmpty(account.getSubscriptionEndDate())
                ))
                .orElseGet(() -> Map.of("registered", false));
    }

    public ShopAccount register(RegisterShopRequest request) {
        validate(request);
        String username = request.username().trim().toLowerCase();
        if (repository.existsByUsername(username)) {
            throw new IllegalStateException("Username already registered");
        }

        byte[] saltBytes = new byte[24];
        secureRandom.nextBytes(saltBytes);
        String salt = Base64.getEncoder().encodeToString(saltBytes);

        ShopAccount account = new ShopAccount();
        account.setShopName(request.shopName().trim());
        account.setOwnerName(request.ownerName().trim());
        account.setPhone(request.phone().trim());
        account.setEmail(request.email() == null ? "" : request.email().trim());
        account.setAddress(request.address() == null ? "" : request.address().trim());
        account.setGstin(request.gstin() == null ? "" : request.gstin().trim().toUpperCase());
        account.setDrugLicense(request.drugLicense() == null ? "" : request.drugLicense().trim());
        account.setSubscriptionPlan(request.plan().trim());
        account.setEnabled(true);
        account.setSubscriptionStartDate(LocalDate.now());
        account.setSubscriptionEndDate(LocalDate.now().plusDays(30));
        account.setUsername(username);
        account.setPasswordSalt(salt);
        account.setPasswordHash(hashPassword(request.password(), salt));
        account.setRegisteredAt(LocalDateTime.now());
        return repository.save(account);
    }

    public Map<String, Object> login(LoginRequest request) {
        ShopAccount account = repository.findByUsername(request.username().trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        if (!account.isEnabled()) {
            throw new IllegalArgumentException("Account disabled. Please contact PharmaSathi owner");
        }
        if (account.getSubscriptionEndDate() != null
                && account.getSubscriptionEndDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Subscription expired. Please renew your plan");
        }

        if (!passwordMatches(request.password(), account)) {
            throw new IllegalArgumentException("Invalid username or password");
        }
        migrateLegacyPassword(request.password(), account);

        return Map.ofEntries(
                Map.entry("authenticated", true),
                Map.entry("token", sessions.create(account.getId())),
                Map.entry("shopId", account.getId()),
                Map.entry("shopName", account.getShopName()),
                Map.entry("ownerName", account.getOwnerName()),
                Map.entry("plan", planOrDefault(account)),
                Map.entry("subscriptionEndDate", dateOrEmpty(account.getSubscriptionEndDate()))
        );
    }

    private String planOrDefault(ShopAccount account) {
        return account.getSubscriptionPlan() == null || account.getSubscriptionPlan().isBlank()
                ? "Business"
                : account.getSubscriptionPlan();
    }

    private String dateOrEmpty(LocalDate date) {
        return date == null ? "" : date.toString();
    }

    private void validate(RegisterShopRequest request) {
        if (request.shopName() == null || request.shopName().isBlank()
                || request.ownerName() == null || request.ownerName().isBlank()
                || request.phone() == null || !request.phone().matches("\\d{10}")
                || request.plan() == null || !request.plan().matches("Starter|Business|Pro")
                || request.username() == null || request.username().trim().length() < 4
                || request.password() == null || request.password().length() < 8) {
            throw new IllegalArgumentException("Please enter valid registration details");
        }
    }

    private String hashPassword(String password, String salt) {
        try {
            KeySpec spec = new PBEKeySpec(password.toCharArray(), Base64.getDecoder().decode(salt), 210_000, 256);
            return "pbkdf2$210000$" + HexFormat.of().formatHex(
                    SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded()
            );
        } catch (Exception exception) {
            throw new IllegalStateException("Password security could not be initialized", exception);
        }
    }

    private boolean passwordMatches(String password, ShopAccount account) {
        String stored = account.getPasswordHash();
        String candidate = stored != null && stored.startsWith("pbkdf2$")
                ? hashPassword(password, account.getPasswordSalt())
                : legacyHash(password, account.getPasswordSalt());
        return MessageDigest.isEqual(
                stored.getBytes(StandardCharsets.UTF_8),
                candidate.getBytes(StandardCharsets.UTF_8)
        );
    }

    private void migrateLegacyPassword(String password, ShopAccount account) {
        if (account.getPasswordHash().startsWith("pbkdf2$")) return;
        account.setPasswordHash(hashPassword(password, account.getPasswordSalt()));
        repository.save(account);
    }

    private String legacyHash(String password, String salt) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest((salt + password).getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Password security could not be initialized", exception);
        }
    }
}
