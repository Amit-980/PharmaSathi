package com.pharmasathi.backend.controller;

import com.pharmasathi.backend.dto.OwnerAccountUpdateRequest;
import com.pharmasathi.backend.dto.AdminLoginRequest;
import com.pharmasathi.backend.dto.RegisterShopRequest;
import com.pharmasathi.backend.service.AdminAuthService;
import com.pharmasathi.backend.service.ShopAccountService;
import com.pharmasathi.backend.entity.ShopAccount;
import com.pharmasathi.backend.repository.ShopAccountRepository;
import com.pharmasathi.backend.repository.MedicineRepository;
import com.pharmasathi.backend.repository.PurchaseRepository;
import com.pharmasathi.backend.repository.SaleRepository;
import com.pharmasathi.backend.repository.SupplierRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class OwnerController {

    private final ShopAccountRepository accounts;
    private final MedicineRepository medicines;
    private final SupplierRepository suppliers;
    private final PurchaseRepository purchases;
    private final SaleRepository sales;
    private final AdminAuthService adminAuth;
    private final ShopAccountService shopAccountService;

    public OwnerController(
            ShopAccountRepository accounts,
            MedicineRepository medicines,
            SupplierRepository suppliers,
            PurchaseRepository purchases,
            SaleRepository sales,
            AdminAuthService adminAuth,
            ShopAccountService shopAccountService) {
        this.accounts = accounts;
        this.medicines = medicines;
        this.suppliers = suppliers;
        this.purchases = purchases;
        this.sales = sales;
        this.adminAuth = adminAuth;
        this.shopAccountService = shopAccountService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AdminLoginRequest request) {
        try {
            return ResponseEntity.ok(Map.of("token", adminAuth.login(request)));
        } catch (IllegalArgumentException | IllegalStateException exception) {
            return ResponseEntity.status(401).body(Map.of("message", exception.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        adminAuth.logout(authorization);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/backup")
    public ResponseEntity<?> backup() {
        return ResponseEntity.ok(Map.of(
                "createdAt", java.time.LocalDateTime.now().toString(),
                "customers", accounts.findAll().stream().map(this::customerView).toList(),
                "medicines", medicines.findAll(),
                "suppliers", suppliers.findAll(),
                "purchases", purchases.findAll(),
                "sales", sales.findAll()
        ));
    }

    @GetMapping("/customers")
    public ResponseEntity<?> customers() {
        List<Map<String, Object>> result = accounts.findAll().stream()
                .map(this::customerView)
                .toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/customers")
    public ResponseEntity<?> createCustomer(@RequestBody RegisterShopRequest request) {
        try {
            return ResponseEntity.ok(customerView(shopAccountService.registerByAdmin(request)));
        } catch (IllegalArgumentException | IllegalStateException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        }
    }

    @PatchMapping("/customers/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody OwnerAccountUpdateRequest request) {
        ShopAccount account = accounts.findById(id).orElse(null);
        if (account == null) {
            return ResponseEntity.notFound().build();
        }
        if (request.enabled() != null) account.setEnabled(request.enabled());
        if (request.plan() != null && request.plan().matches("Starter|Business|Pro")) {
            account.setSubscriptionPlan(request.plan());
        }
        if (request.subscriptionEndDate() != null) {
            account.setSubscriptionEndDate(request.subscriptionEndDate());
        }
        return ResponseEntity.ok(customerView(accounts.save(account)));
    }

    @PostMapping("/customers/{id}/renew")
    public ResponseEntity<?> renew(
            @PathVariable Long id,
            @RequestParam(defaultValue = "30") int days) {
        ShopAccount account = accounts.findById(id).orElse(null);
        if (account == null) return ResponseEntity.notFound().build();
        LocalDate base = account.getSubscriptionEndDate() != null
                && !account.getSubscriptionEndDate().isBefore(LocalDate.now())
                ? account.getSubscriptionEndDate()
                : LocalDate.now();
        account.setSubscriptionEndDate(base.plusDays(Math.max(1, days)));
        account.setEnabled(true);
        return ResponseEntity.ok(customerView(accounts.save(account)));
    }

    private Map<String, Object> customerView(ShopAccount account) {
        return Map.ofEntries(
                Map.entry("id", account.getId()),
                Map.entry("shopName", account.getShopName()),
                Map.entry("ownerName", account.getOwnerName()),
                Map.entry("phone", account.getPhone()),
                Map.entry("email", account.getEmail() == null ? "" : account.getEmail()),
                Map.entry("plan", account.getSubscriptionPlan() == null ? "Business" : account.getSubscriptionPlan()),
                Map.entry("enabled", account.isEnabled()),
                Map.entry("registeredAt", account.getRegisteredAt().toString()),
                Map.entry("subscriptionEndDate", account.getSubscriptionEndDate() == null
                        ? "" : account.getSubscriptionEndDate().toString())
        );
    }

}
