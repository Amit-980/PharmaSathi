package com.pharmasathi.backend.controller;

import com.pharmasathi.backend.dto.LoginRequest;
import com.pharmasathi.backend.dto.RegisterShopRequest;
import com.pharmasathi.backend.entity.ShopAccount;
import com.pharmasathi.backend.service.ShopAccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/setup")
public class SetupController {

    private final ShopAccountService service;

    public SetupController(ShopAccountService service) {
        this.service = service;
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        return service.status();
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterShopRequest request) {
        try {
            ShopAccount account = service.register(request);
            return ResponseEntity.ok(Map.of(
                    "registered", true,
                    "shopName", account.getShopName(),
                    "ownerName", account.getOwnerName(),
                    "plan", account.getSubscriptionPlan()
            ));
        } catch (IllegalArgumentException | IllegalStateException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(service.login(request));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(401).body(Map.of("message", exception.getMessage()));
        }
    }
}
