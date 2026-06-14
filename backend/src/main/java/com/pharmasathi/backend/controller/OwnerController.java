package com.pharmasathi.backend.controller;

import com.pharmasathi.backend.dto.OwnerAccountUpdateRequest;
import com.pharmasathi.backend.entity.ShopAccount;
import com.pharmasathi.backend.repository.ShopAccountRepository;
import com.pharmasathi.backend.repository.MedicineRepository;
import com.pharmasathi.backend.repository.PurchaseRepository;
import com.pharmasathi.backend.repository.SaleRepository;
import com.pharmasathi.backend.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/owner")
public class OwnerController {

    private final ShopAccountRepository accounts;
    private final MedicineRepository medicines;
    private final SupplierRepository suppliers;
    private final PurchaseRepository purchases;
    private final SaleRepository sales;
    private final String ownerKey;

    public OwnerController(
            ShopAccountRepository accounts,
            MedicineRepository medicines,
            SupplierRepository suppliers,
            PurchaseRepository purchases,
            SaleRepository sales,
            @Value("${pharmasathi.owner-key:}") String ownerKey) {
        this.accounts = accounts;
        this.medicines = medicines;
        this.suppliers = suppliers;
        this.purchases = purchases;
        this.sales = sales;
        this.ownerKey = ownerKey;
    }

    @GetMapping("/backup")
    public ResponseEntity<?> backup(@RequestHeader("X-Owner-Key") String key) {
        if (!authorized(key)) return unauthorized();
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
    public ResponseEntity<?> customers(@RequestHeader("X-Owner-Key") String key) {
        if (!authorized(key)) return unauthorized();
        List<Map<String, Object>> result = accounts.findAll().stream()
                .map(this::customerView)
                .toList();
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/customers/{id}")
    public ResponseEntity<?> update(
            @RequestHeader("X-Owner-Key") String key,
            @PathVariable Long id,
            @RequestBody OwnerAccountUpdateRequest request) {
        if (!authorized(key)) return unauthorized();
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
            @RequestHeader("X-Owner-Key") String key,
            @PathVariable Long id,
            @RequestParam(defaultValue = "30") int days) {
        if (!authorized(key)) return unauthorized();
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

    private ResponseEntity<Map<String, String>> unauthorized() {
        String message = ownerKey.isBlank() ? "Owner console is disabled" : "Invalid owner key";
        return ResponseEntity.status(401).body(Map.of("message", message));
    }

    private boolean authorized(String key) {
        return !ownerKey.isBlank() && ownerKey.equals(key);
    }
}
